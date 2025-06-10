<script lang="ts">
  import '../../../../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Button from '$lib/components/Button.svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { ref, get } from 'firebase/database';
  import { db } from '../../../../firebase';

  let tripId, memoryId;
  let memory: any = null;
  let tripOptions: any[] = [];
  let currentImageIndex = 0;
  let gradientLayers: any[] = [];
  let columnGroups: any[] = [];
  let rotationAngle = 0;

  let droppedTripId: any = null;
  let droppedMemory: any = null;
  let droppedImageIndex = 0;
  let droppedColumnGroups: any[] = [];
  let droppedGradientLayers: any[] = [];
  let droppedWheelStyle = {};
  let droppedCurrentImage: any = null;
  let isDroppedVisible = true;

  $: tripId = page.params.tripId;
  $: memoryId = page.params.memoryId;
  $: currentImage = memory?.images?.[currentImageIndex];

  $: if (tripId && memoryId) {
    loadMemoryAndTrip(tripId, memoryId);
  }

  async function loadMemoryAndTrip(tripId: string, memoryId: string) {
    try {
      const memorySnap = await get(ref(db, `trips/${tripId}/memories/${memoryId}`));
      const tripSnap = await get(ref(db, `trips/${tripId}`));

      if (memorySnap.exists() && tripSnap.exists()) {
        memory = memorySnap.val();
        const currentTrip = tripSnap.val();
        const { lat, lng } = currentTrip.destination.location;

        const allTripsSnap = await get(ref(db, 'trips'));
        if (allTripsSnap.exists()) {
          const allTrips = Object.entries(allTripsSnap.val());

          tripOptions = allTrips
            .filter(([id, trip]) => {
              const loc = trip.destination?.location;
              const hasMemories = trip.memories && Object.keys(trip.memories).length > 0;
              const sameLocation =
                loc && Math.abs(loc.lat - lat) < 0.0001 && Math.abs(loc.lng - lng) < 0.0001;
              return sameLocation && hasMemories;
            })
            .map(([id, trip]) => {
              const memories = Object.entries(trip.memories);
              const sorted = memories.sort((a, b) => new Date(a[1].startDate) - new Date(b[1].startDate));
              const [latestMemoryId, latestMemory] = sorted[0];

              return {
                id,
                memoryId: latestMemoryId,
                label: `${latestMemory.startDate} - ${latestMemory.endDate}`
              };
            });
        }

        if (memory?.images?.length) {
          columnGroups = await extractColumnwiseColors(memory.images, false);
          currentImageIndex = 0;
        }
      } else {
        console.error('Trip or memory not found');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function loadDroppedTrip(tripId: any, memoryId: any) {
    const memorySnap = await get(ref(db, `trips/${tripId}/memories/${memoryId}`));
    if (memorySnap.exists()) {
      droppedTripId = tripId;
      droppedMemory = memorySnap.val();
      droppedColumnGroups = await extractColumnwiseColors(droppedMemory.images, true);
      droppedImageIndex = 0;
      isDroppedVisible = true;
    }
  }

  $: {
    if (memory?.images?.length > 0) {
      const sliceAngle = 360 / memory.images.length;
      rotationAngle = sliceAngle * currentImageIndex - 90;
    } else {
      rotationAngle = 0;
    }
  }

  $: wheelStyle = {
    transform: `translateY(-50%) rotate(${rotationAngle}deg)`,
    transformOrigin: 'center center'
  };

  async function getImageData(url: string) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    await img.decode();

    const MAX_WIDTH = 100;
    const ratio = MAX_WIDTH / img.width;

    const canvas = document.createElement('canvas');
    canvas.width = MAX_WIDTH;
    canvas.height = Math.round(img.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  //convert rgb to hsb for color adjustment
  function rgbToHsb(r, g, b) {
    const r_ = r / 255, g_ = g / 255, b_ = b / 255;
    const max = Math.max(r_, g_, b_), min = Math.min(r_, g_, b_);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r_) h = ((g_ - b_) / delta) % 6;
      else if (max === g_) h = (b_ - r_) / delta + 2;
      else h = (r_ - g_) / delta + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return [h, s * 100, v * 255];
  }

  function getColumnColors(imageData: ImageData, columnCount = 5) {
    const { data, width, height } = imageData;
    const columnWidth = Math.floor(width / columnCount);
    const columns = Array.from({ length: columnCount }, () => []);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colIndex = Math.min(Math.floor(x / columnWidth), columnCount - 1);
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];

        const [h, s, br] = rgbToHsb(r, g, b);
        if (br < 5 || s < 20) continue;

        const rgb = `rgb(${r},${g},${b})`;
        columns[colIndex].push(rgb);
      }
    }

    return columns.map(column => {
      const count = {};
      column.forEach(color => count[color] = (count[color] || 0) + 1);
      return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'rgb(0,0,0)';
    });
  }

  async function extractColumnwiseColors(imageUrls: any, reverseColumns = true) {
    const columnColorGroups = [[], [], [], [], []];

    for (const url of imageUrls) {
      const imageData = await getImageData(url);
      let colColors = getColumnColors(imageData);

      // reverse column order
      if (reverseColumns) {
        colColors = colColors.reverse();
      }

      colColors.forEach((color, index) => {
        columnColorGroups[index].push(color);
      });
    }

    return columnColorGroups;
  }

  // make gradient wheel
  function makeConcentricGradients(groups, rotationOffset = 0, imageCount = 1, isDropped = false) {
    const directionFactor = 1;
    const additionalAdjustment = isDropped ? -360 / imageCount : 0;
    return groups.map(colors => {
      const step = 360 / colors.length;
      const rawStart = rotationOffset + directionFactor * (90 - 180 / imageCount);
      const start = isDropped ? -rawStart + additionalAdjustment : rawStart;
      return `conic-gradient(from ${start}deg, ${
        colors.map((c, i) => `${c} ${i * step}deg ${(i + 1) * step}deg`).join(', ')
      })`;
    });
  }

  $: if (memory?.images?.length && columnGroups.length) {
    const angleOffset = -(360 / memory.images.length) * currentImageIndex;
    const gradients = makeConcentricGradients(columnGroups, angleOffset, memory.images.length, false);

    //mask for donut shape
    const MASK_COUNT = 3;
    for (let i = 0; i < MASK_COUNT; i++) {
      gradients.push('radial-gradient(circle, var(--black) 100%)');
    }

    gradientLayers = gradients.map((bg, i) => {
      const scale = 1 - i * 0.1;
      return `background: ${bg};
              width: ${scale * 100}%;
              height: ${scale * 100}%;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              border-radius: 50%;`;
    });
  }

  $: if (droppedMemory?.images?.length && droppedColumnGroups.length) {
    const angleOffset = -(360 / droppedMemory.images.length) * droppedImageIndex;
    const gradients = makeConcentricGradients(droppedColumnGroups, angleOffset, droppedMemory.images.length, true);

    const MASK_COUNT = 3;
    for (let i = 0; i < MASK_COUNT; i++) {
      gradients.push('radial-gradient(circle, var(--black) 100%)');
    }

    droppedGradientLayers = gradients.map((bg: any, i: number) => {
      const scale = 1 - i * 0.1;
      return `background: ${bg};
              width: ${scale * 100}%;
              height: ${scale * 100}%;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              border-radius: 50%;`;
    });

    droppedWheelStyle = {
      transform: `translateY(-50%) rotate(${-90 + (360 / droppedMemory.images.length) * droppedImageIndex}deg)`
    };

    droppedCurrentImage = droppedMemory.images[droppedImageIndex];
  }

  function nextImage() {
    if (memory?.images?.length > 0) {
      currentImageIndex = (currentImageIndex + 1) % memory.images.length;
    }
  }

  function prevImage() {
    if (memory?.images?.length > 0) {
      currentImageIndex = (currentImageIndex - 1 + memory.images.length) % memory.images.length;
    }
  }

  function nextDroppedImage() {
    if (droppedMemory?.images?.length > 0) {
      droppedImageIndex = (droppedImageIndex + 1) % droppedMemory.images.length;
    }
  }

  function prevDroppedImage() {
    if (droppedMemory?.images?.length > 0) {
      droppedImageIndex = (droppedImageIndex - 1 + droppedMemory.images.length) % droppedMemory.images.length;
    }
  }

  function handleDrop(event: { preventDefault: () => void; dataTransfer: { getData: (arg0: string) => any; }; }) {
    event.preventDefault();
    if (droppedMemory && isDroppedVisible) return;

    const droppedTripId = event.dataTransfer.getData("tripId");
    const droppedMemoryId = event.dataTransfer.getData("memoryId");
    loadDroppedTrip(droppedTripId, droppedMemoryId);
  }

  function allowDrop(event: { preventDefault: () => void; }) {
    if (!droppedMemory || !isDroppedVisible) {
      event.preventDefault();
    }
  }

  function closeDroppedWheel() {
    isDroppedVisible = false;
  }
</script>


<main>
  <Nav activeTab="MyMemory" darkMode={true}/>

  <div class="content">
    {#if memory}
      <div class="header">
        <h1>{memory.location}</h1>
      </div>

      <div class="trip-switcher">
        <div class="trip-switcher-inner">
          {#each tripOptions as trip}
            <button
              class={trip.id === tripId ? 'active' : ''}
              draggable="true"
              on:dragstart={(e) => {
                e.dataTransfer.setData('tripId', trip.id);
                e.dataTransfer.setData('memoryId', trip.memoryId);
              }}
              on:click={() => goto(`/viewimage/${trip.id}/${trip.memoryId}`)}>
              {trip.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="wheel-compare-wrapper">
        <!-- leftside original wheel -->
        <div class="wheel-section">
          <div class="wheel-mask">
            <div class="gradient-wheel" style={wheelStyle}>
              {#each gradientLayers as style}
                <div class="layer" style={style}></div>
              {/each}
              <div class="wheel-mask-center"></div>
            </div>
          </div>

          {#if currentImage}
            <img class="preview-img" src={currentImage} alt="Current Image" />
          {/if}

          <!-- svelte-ignore a11y_consider_explicit_label -->
          <div class="arrow-controls">
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button on:click={prevImage}>
              <i class="fa-solid fa-chevron-up"></i>
            </button>
            <button on:click={nextImage}>
              <i class="fa-solid fa-chevron-down"></i>
            </button>
          </div>
        </div>

        <!-- rightside dropped view -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="wheel-section drop-zone" on:drop={handleDrop} on:dragover={allowDrop}>
          {#if droppedMemory && isDroppedVisible}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <!-- <img src="/lucide_x.png" alt="Close" class="close-button" on:click={closeDroppedWheel} /> -->
            <button class="close-button" on:click={closeDroppedWheel} aria-label="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
        
            <div class="dropped-mask">
              <div class="dropped-wheel" style={droppedWheelStyle}>
                {#each droppedGradientLayers as style}
                  <div class="layer" style={style}></div>
                {/each}
                <div class="wheel-mask-center"></div>
              </div>
            </div>
        
            {#if droppedCurrentImage}
              <!-- svelte-ignore a11y_img_redundant_alt -->
              <img class="dropped-img" src={droppedCurrentImage} alt="Dropped Image" />
            {/if}
        
            <div class="dropped-controls">
              <!-- svelte-ignore a11y_consider_explicit_label -->
              <button on:click={prevDroppedImage}>
                <i class="fa-solid fa-chevron-up"></i>
              </button>
              <!-- svelte-ignore a11y_consider_explicit_label -->
              <button on:click={nextDroppedImage}>
                <i class="fa-solid fa-chevron-down"></i>
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    height: 100vh;
    width: 100vw;
    background-color: var(--black);
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
  }

  .content {
    padding: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100vw;
    font-family: 'Inter', sans-serif;
  }

  .header {
    padding-top: 2rem;
    padding-left: 2rem;
    background-color: var(--black);
    color: var(--white);
  }

  .header h1 {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
  }

  .trip-switcher {
    width: 100%;
    text-align: center;
    padding-top: 1.5rem;
    padding-left: 2rem;
  }

  .trip-switcher-inner {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    gap: 1rem;
    padding: 0.5rem;
  }

  .trip-switcher-inner::-webkit-scrollbar {
    width: 10px;
    height: 4px;
  }

  .trip-switcher-inner::-webkit-scrollbar-thumb {
    background: var(--white);
    border-radius: 2px;
  }

  .trip-switcher-inner::-webkit-scrollbar-track {
    background: transparent;
  }

  .trip-switcher button {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.75rem 0;
    color: var(--gray-400);
    transition: color 0.3s ease;
    position: relative;
    text-align: center;
  }

  .trip-switcher button:hover {
    color: var(--white);
  }

  .trip-switcher button.active {
    color: var(--memory-500);
    font-weight: 600;
  }

  .trip-switcher button.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--memory-500);
    transition: transform 0.2s ease;
  }

  .wheel-compare-wrapper {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    width: 100%;
    height: 100%;
  }

  .wheel-section {
    display: flex;
    align-items: center;
    gap: 32px;
    width: 50%;
    position: relative;
  }

  .wheel-mask {
    display: flex;
    width: 20vw;
    height: 35vw;
    overflow: hidden;
    position: relative;
    align-items: center;
  }

  .gradient-wheel {
    position: absolute;
    width: 35vw;
    height: 35vw;
    left: -15vw;
    border-radius: 50%;
  }

  .layer {
    position: absolute;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .preview-img {
    position: relative;
    width: 300px;
    height: 200px;
    object-fit: cover;
    z-index: 3;
  }

  .arrow-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 4;
  }

  .arrow-controls button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: white;
    cursor: pointer;
  }

  .wheel-section.drop-zone {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 32px;
    width: 50%;
    position: relative;
  }

  .dropped-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 4;
  }

  .dropped-controls button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: white;
    cursor: pointer;
  }

  .dropped-img {
    position: relative;
    width: 300px;
    height: 200px;
    object-fit: cover;
    z-index: 3;
  }

  .dropped-mask {
    display: flex;
    width: 20vw;
    height: 35vw;
    overflow: hidden;
    position: relative;
    align-items: center;
  }

  .dropped-wheel {
    position: absolute;
    width: 35vw;
    height: 35vw;
    right: -15vw;
    border-radius: 50%;
  }

  .close-button {
    position: absolute;
    background: none;
    border: none;
    font-size: 1.4rem;
    color: white;
    top: -48px;
    right: 2rem;
    width: 24px;
    cursor: pointer;
    z-index: 5;
  }

  .wheel-mask-center {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50%;
    height: 50%;
    background: var(--black);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    pointer-events: none;
  }
</style>

