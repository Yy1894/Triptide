<script>
  import '../../../../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Button from '$lib/components/Button.svelte';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { ref, get } from 'firebase/database';
  import { db } from '../../../../firebase';

  let memoryId = '';
  let tripOptions = [];
  let memory = null;
  let tripId = '';

  $: {
    tripId = page.params.tripId;
    memoryId = page.params.memoryId;
  }

  onMount(async () => {
    if (tripId && memoryId) {
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
                const memories = Object.values(trip.memories);
                const latest = memories.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
                return {
                  id,
                  label: `${latest.startDate} - ${latest.endDate}`
                };
              });

            const currentIndex = tripOptions.findIndex(t => t.id === tripId);
            if (currentIndex > 0) {
              const [current] = tripOptions.splice(currentIndex, 1);
              tripOptions.unshift(current);
            }
          }
        } else {
          console.error('Trip or memory not found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  });

  let gradientColors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
  $: gradientStyle = `conic-gradient(${gradientColors.map((c, i) => `${c} ${i * 72}deg ${(i + 1) * 72}deg`).join(',')})`;
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
            <button on:click={() => goto(`/memory/${trip.id}/${memoryId}`)}>
              {trip.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="wheel-container">
        <div class="gradient-wheel" style="background-image: {gradientStyle};"></div>
      </div>

      <div class="image-preview">
        {#if memory.images && memory.images.length > 0}
          <h2>Images</h2>
          <div class="image-grid">
            {#each memory.images as img}
              <img src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt="memory image" />
            {/each}
          </div>
        {:else}
          <p class="no-image">No images uploaded.</p>
        {/if}
      </div>
    {/if} <!-- ✅ 이 줄 빠지면 Svelte 에러 발생 -->
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

  .gradient-wheel {
    width: 300px;
    height: 300px;
    margin: 2rem auto;
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  .wheel-container {
    display: flex;
    justify-content: center;
  }

  .image-preview {
    padding: 1rem 2rem;
    color: white;
  }

  .image-preview h2 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
  }

  .image-grid img {
    width: 100%;
    border-radius: 8px;
    object-fit: cover;
    aspect-ratio: 1 / 1;
  }

  .no-image {
    font-size: 0.95rem;
    color: var(--gray-400);
  }
</style>