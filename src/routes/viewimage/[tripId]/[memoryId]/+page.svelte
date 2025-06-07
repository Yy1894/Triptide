<script>
  import '../../../../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Button from '$lib/components/Button.svelte';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { ref, get } from 'firebase/database';
  import { db } from '../../../../firebase';

  let memoryId = '';
  /**
   * @type {{ location: any; startDate: any; endDate: any; images: any; } | null}
   */
  let memory = null;
  let tripId = '';

  // Subscribe to page store to get URL parameters
  $: {
    tripId = page.params.tripId;
    memoryId = page.params.memoryId;
  }

  onMount(async () => {
    if (tripId && memoryId) {
      try {
        const snapshot = await get(ref(db, `trips/${tripId}/memories/${memoryId}`));
        if (snapshot.exists()) {
          memory = snapshot.val();
        } else {
          console.error('No memory found');
        }
      } catch (error) {
        console.error('Error fetching memory:', error);
      }
    }
  });

  let gradientColors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
  $: gradientStyle = `
    conic-gradient(
      ${gradientColors.map((c, i) => `${c} ${i * 72}deg ${(i + 1) * 72}deg`).join(',')}
    )
  `;
</script>

<main>
  <Nav activeTab="MyMemory" darkMode={true}/>

  <div class="content">
    {#if memory}
      <div class="header">
        <h1>{memory.location}</h1>
        <p>{memory.startDate} - {memory.endDate}</p>
      </div>

      <div class="wheel-container">
        <div class="gradient-wheel" style="background-image: {gradientStyle};"></div>
      </div>

      <div class="image-list">
        {#each memory.images as img}
          <!-- svelte-ignore a11y_img_redundant_alt -->
          <img src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt="Memory image" />
        {/each}
      </div>
    {:else}
      <p class="empty">Loading memory...</p>
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
    padding: 2rem 1rem;
    overflow-y: auto;
  }

  .header {
    text-align: center;
    color: var(--white);
    margin-bottom: 2rem;
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

  .image-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
  }

  .image-list img {
    width: 80%;
    max-width: 500px;
    border-radius: 12px;
  }

  .empty {
    color: var(--gray-400);
    text-align: center;
    margin-top: 4rem;
  }
</style> 