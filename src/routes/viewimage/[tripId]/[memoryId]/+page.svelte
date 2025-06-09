<script>
  import '../../../../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Button from '$lib/components/Button.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { ref, get } from 'firebase/database';
  import { db } from '../../../../firebase';

  let tripId, memoryId;
  let memory = null;
  let tripOptions = [];
  let currentImageIndex = 0;
  let gradientLayers = [];
  let columnGroups = [];
  let rotationAngle = 0;

  $: tripId = $page.params.tripId;
  $: memoryId = $page.params.memoryId;
  $: currentImage = memory?.images?.[currentImageIndex];

  $: if (tripId && memoryId) {
    loadMemoryAndTrip(tripId, memoryId);
  }

  async function loadMemoryAndTrip(tripId, memoryId) {
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
          columnGroups = await extractColumnwiseColors(memory.images);
          currentImageIndex = 0;
        }
      } else {
        console.error('Trip or memory not found');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  $: {
    if (memory?.images?.length > 0) {
      const imageCount = memory.images.length;
      const sliceAngle = 360 / imageCount;
      rotationAngle = sliceAngle * currentImageIndex - 90;
    } else {
      rotationAngle = 0;
    }
  }

  $: wheelStyle = {
    transform: `translateY(-50%) rotate(${rotationAngle}deg)`,
    transformOrigin: 'center center'
  };

  $: if (memory?.images?.length && columnGroups.length) {
    const angleOffset = -(360 / memory.images.length) * currentImageIndex;
    const gradients = makeConcentricGradients(columnGroups, angleOffset);

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

  async function getImageData(url) {
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

  function getColumnColors(imageData, columnCount = 5) {
    const { data, width, height } = imageData;
    const columnWidth = Math.floor(width / columnCount);
    const columns = Array.from({ length: columnCount }, () => []);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colIndex = Math.min(Math.floor(x / columnWidth), columnCount - 1);
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];

        const [h, s, br] = rgbToHsb(r, g, b);
        if (br < 20 || s < 10) continue;

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

  async function extractColumnwiseColors(imageUrls) {
    const columnColorGroups = [[], [], [], [], []];

    for (const url of imageUrls) {
      const imageData = await getImageData(url);
      const colColors = getColumnColors(imageData);
      colColors.forEach((color, index) => {
        columnColorGroups[index].push(color);
      });
    }

    return columnColorGroups.reverse();
  }

  function makeConcentricGradients(groups, rotationOffset = 0) {
    return groups.map(colors => {
      const step = 360 / colors.length;
      const start = rotationOffset + 90 - 180 / memory.images.length;
      return `conic-gradient(from ${start}deg, ${colors.map((c, i) => `${c} ${i * step}deg ${(i + 1) * step}deg`).join(', ')})`;
    });
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
              on:click={() => goto(`/viewimage/${trip.id}/${trip.memoryId}`)}>
              {trip.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="wheel-container">
        <div class="wheel-mask">
          <div class="gradient-wheel" style={wheelStyle}>
            {#each gradientLayers as style}
              <div class="layer" style={style}></div>
            {/each}
          </div>
        </div>

        {#if currentImage}
          <img class="preview-img" src={currentImage} alt="Current Image" />
        {/if}

        <div class="arrow-controls">
          <button on:click={prevImage}>▲</button>
          <button on:click={nextImage}>▼</button>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    height: 100vh;
    background-color: var(--black);
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
    padding: 0 1rem 2rem 1rem;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .header {
    padding-top: 2rem;
    padding-left: 1rem;
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
    overflow: hidden;
    padding-top: 1.5rem;
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
    flex: 0 0 auto;
    background-color: white;
    border: 1px solid var(--gray-200);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.95rem;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.3s ease;
  }

  .trip-switcher button:hover {
    background-color: var(--gray-100);
  }

  .trip-switcher button.active {
    background-color: var(--memory-500);
  }

  .wheel-container {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 2rem;
    height: 40vw;
    position: relative;
  }

  .wheel-mask {
    width: 50vw;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  .gradient-wheel {
    position: absolute;
    width: 35vw;
    height: 35vw;
    left: -17.5vw;
    top: 50%;
    transform: translateY(-50%);
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
    position: absolute;
    top: 50%;
    left: calc(17.5vw + 180px);
    transform: translate(-50%, -50%);
    width: 300px;
    height: 200px;
    object-fit: cover;
    z-index: 3;
  }

  .arrow-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: absolute;
    top: 50%;
    left: calc(17.5vw + 340px);
    transform: translateY(-50%);
    z-index: 4;
  }

  .arrow-controls button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: white;
    cursor: pointer;
  }
</style>

