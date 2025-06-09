<script lang="ts">
  import '../../app.css';
  import MemoryCard from '$lib/components/MemoryCard.svelte';
  import Button from '$lib/components/Button.svelte';
  import NewMemoryPopup from '$lib/components/NewMemoryPopup.svelte';
  import Nav from '$lib/components/Nav.svelte';
  import { onMount } from 'svelte';
  import { ref, onValue } from 'firebase/database';
  import { db } from '../../firebase';

  let showNewMemoryPopup = false;
  let contentContainer: HTMLElement;

  interface MemoryCardData {
    tid: string;
    memoryId: string;
    destination: string;
    startDate: string;
    endDate: string;
    image: string;
  }

  let pastMemories: MemoryCardData[] = [];

  onMount(() => {
    const tripsRef = ref(db, 'trips');
    onValue(tripsRef, (snapshot) => {
      const memories: MemoryCardData[] = [];
      snapshot.forEach((childSnapshot) => {
        const trip = childSnapshot.val();
        const tid = childSnapshot.key;
        if (trip.memories && typeof trip.memories === 'object') {
          const memoryEntries = Object.entries(trip.memories);
          if (memoryEntries.length > 0) {
            const [memoryId, memory] = memoryEntries[0];
            const mem = memory as { images: string[] };
            if (mem.images && mem.images.length > 0) {
              const format = (d: string) => {
                const date = new Date(d);
                return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
              };
              memories.push({
                tid,
                memoryId,
                destination: trip.destination?.name || '',
                startDate: format(trip.startDate),
                endDate: format(trip.endDate),
                image: mem.images[0]
              });
            }
          }
        }
      });
      pastMemories = memories;
    });
  });

  function handleNewMemory() {
    showNewMemoryPopup = true;
  }
</script>

<main>
  <Nav activeTab="MyMemory" darkMode={true}/>

  <div class="content" bind:this={contentContainer}>
      <div class="header">
          <h1>My Memories</h1>
      </div>

      <div class="memories-container">
            {#if pastMemories.length === 0}
                <div class="empty-state">
                    <p>There is no memory yet</p>
                </div>
            {:else}
                <div class="memories-grid">
                    {#each pastMemories as memory}
                        <MemoryCard {...memory} />
                    {/each}
                </div>
            {/if}
      </div>

      <div class="floating-button">
          <Button text="+ Add a new memory" type="memory" onClick={handleNewMemory} />
      </div>
  </div>

  <NewMemoryPopup bind:showPopup={showNewMemoryPopup} />
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
      overflow: hidden;
      overflow-y: auto;
  }

  .header {
      padding-top: 2rem;
      padding-left: 1rem;
      background-color: var(--black);
  }

  .header h1 {
      font-size: 2rem;
      font-weight: 600;
      margin: 0;
      color: var(--white);
  }

  .memories-container {
      flex: 1;
      padding: 0 1rem;
      display: flex;
      flex-direction: column;
  }

  .memories-grid {
      display: grid;
      padding-top: 1.5rem;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
  }

  .empty-state {
      flex: 1;
      display: flex;
      margin-top: -10rem;
      justify-content: center;
      align-items: center;
      color: var(--gray-400);
      font-size: 1.1rem;
  }

  .floating-button {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 10;
  }
</style> 