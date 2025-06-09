<script lang="ts">
    import '../../app.css';
    import MemoryCard from '$lib/components/MemoryCard.svelte';
    import Button from '$lib/components/Button.svelte';
    import NewMemoryPopup from '$lib/components/NewMemoryPopup.svelte';
    import Nav from '$lib/components/Nav.svelte';
    import { onMount } from 'svelte';
    import { ref, get } from 'firebase/database';
    import { db } from '../../firebase';

    interface Memory {
        tripId: string;
        memoryId: string;
        destination: string;
        startDate: string;
        endDate: string;
        image: string;
    }

    let showNewMemoryPopup = false;
    let contentContainer: HTMLElement;
    
    let pastMemories: Memory[] = [];

    onMount(async () => {
        const snapshot = await get(ref(db, 'trips'));
        const data = snapshot.val();

        pastMemories = Object.entries(data).flatMap(([tripId, trip]: any) => {
            const memories = Object.entries(trip.memories ?? {});
            if (memories.length === 0) return [];

            //latest memoryID
            const sorted = memories.sort((a, b) => new Date(b[1].createdAt) - new Date(a[1].createdAt));
            const [memoryId, memory] = sorted[0];

            return [{
            tripId,
            memoryId,
            destination: trip.destination?.name ?? 'Unknown',
            startDate: memory.startDate,
            endDate: memory.endDate,
            image: memory.images?.[0] ?? ''
            }];
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
                    <p>There is no memory</p>
                </div>
            {:else}
                <div class="memories-grid">
                    {#each pastMemories as memory}
                        <MemoryCard {...memory} on:deleted={(e) => handleDeletedMemory(e.detail.memoryId)} />
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