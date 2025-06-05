<script lang="ts">
  import PlaceCard from "./PlaceCard.svelte";
  import AddPlaces from "./AddPlaces.svelte";
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let date;
  export let isExpanded = true;
  export let places: { name: string; desc?: string; image?: string; time?: string; }[] = [];

  function toggleDate() {
    isExpanded = !isExpanded;
  }

  function handlePlaceSelected(place: google.maps.places.PlaceResult) {
    const newPlace = {
      name: place.name || 'Unknown Place',
      desc: place.formatted_address || '',
      image: (place as any).photoUrl || 'placeholder.jpeg',
      time: 'Add Time'
    };
    
    places = [...places, newPlace];
  }

  function handleDeletePlace(index: number) {
    places = places.filter((_, i) => i !== index);
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
      {#each places as place, i}
        <PlaceCard {place} onDelete={() => handleDeletePlace(i)} />
      {/each}

      <div class="add-places-container">
        <AddPlaces 
          onPlaceSelected={handlePlaceSelected}
          countryRestriction="tw"
        />
      </div>
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
      font-family: 'Inter', sans-serif;
  }

  .date-text h3 {
      margin: 0;
      font-size: 1.1rem;
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

  .add-places-container {
    margin-top: 1rem;
  }
</style> 