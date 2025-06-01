<script>
 import '/src/app.css';
  import { goto } from '$app/navigation';
  import WorldMap from '$lib/components/WorldMap.svelte';
  import Button from '$lib/components/Button.svelte';
  import NewMemoryPopup from '$lib/components/NewMemoryPopup.svelte';
  import Nav from '$lib/components/Nav.svelte';
  import { onMount } from 'svelte';

  let showNewMemoryPopup = false;
  
  const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  onMount(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
});
  
  function handleNewMemory() {
      showNewMemoryPopup = true;
  }
</script>

<main>
  <Nav activeTab="Memory" darkMode={true} />

  <div class="map-container">
      <WorldMap />
  </div>

  <div class="floating-button">
      <Button text="+ Add a new memory" type="memory" onClick={handleNewMemory} />
  </div>

  <NewMemoryPopup bind:showPopup={showNewMemoryPopup} fromPage="memory" />

</main>

<style>
  main {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--gray-50);
      font-family: 'Inter', sans-serif;
  }

  .map-container {
      flex: 1;
      position: relative;
      background-color: var(--gray-50);
  }

  .floating-button {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 10;
}
</style>