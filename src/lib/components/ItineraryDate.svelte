<script>
  import PlaceCard from "./PlaceCard.svelte";
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  export let date;
  export let isExpanded = true;
  /**
   * @type {{ name: string, desc: string, img: string, time: string }[]}
   */
   export let places = [];
  // export let recommendedPlaces = [];

  function toggleDate() {
    isExpanded = !isExpanded;
  }
</script>
  
<div class="date-section">
  <button class="date-header" onclick={toggleDate}>
    <div class="date-text">
      <i class="fa-solid fa-chevron-right arrow-icon" class:rotated={isExpanded}></i>
      <h3>{date}</h3>
    </div>
  </button>

  {#if isExpanded}
    <div
      class="date-content"
      transition:slide={{ duration: 400, easing: quintOut }}
    >
      {#each places as place}
        <PlaceCard {place} />
      {/each}

      <button class="add-place-btn">
        <i class="fa-solid fa-location-dot"></i>
        Add places
      </button>
    </div>
  {/if}
</div>

<style>
  .date-section {
      margin-bottom: 1rem;
  }

  .date-header {
      width: 100%;
      background: none;
      border: none;
      border-bottom: 1px solid var(--gray-100);
      box-sizing: border-box;
      padding: 0.5rem;
      cursor: pointer;
      text-align: left;
  }

  .date-text {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 0;
      font-size: 1rem;
      font-family: 'Inter', sans-serif;
  }

  .date-text h3 {
    margin: 0;
    font-weight: 500;
  }

  .arrow-icon {
    transition: transform 0.3s ease;
    transform-origin: center;
  }

  .rotated {
      transform: rotate(90deg);
  }

  .date-content {
      padding: 1rem 0 1rem 2rem;
  }

  .add-place-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: white;
      border: 2px solid var(--gray-100);
      border-radius: 0.75rem;
      color: var(--gray-600);
      cursor: pointer;
      margin: 1rem 0;
      transition: all 0.2s ease;
  }

  .add-place-btn:hover {
      background: var(--gray-50);
      border-color: var(--gray-50);
  }
</style> 