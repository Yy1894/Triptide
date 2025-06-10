<script lang="ts">
  import PlaceCard from "./PlaceCard.svelte";
  import AddPlaces from "./AddPlaces.svelte";
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { Place } from "$lib/constants/Interfaces";

  export let date;
  export let isExpanded = true;
  export let countryCode = 'tw'; // Default to Taiwan if not provided
  
  export let places: Place[] = [];
  export let onPlacesUpdate: (places: Place[]) => void;

  function toggleDate() {
    isExpanded = !isExpanded;
  }

  function handlePlaceSelected(place: google.maps.places.PlaceResult) {
    const newPlace = {
      name: place.name || 'Unknown Place',
      desc: place.formatted_address || '',
      image: (place as any).photoUrl || '/placeholder.jpeg',
      time: 'Add Time',
      geometry: place.geometry?.location ? {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      } : undefined
    };
    
    const updatedPlaces = [...places, newPlace];
    places = updatedPlaces;
    onPlacesUpdate(updatedPlaces);
  }

  function handleDeletePlace(index: number) {
    const updatedPlaces = places.filter((_, i) => i !== index);
    places = updatedPlaces;
    onPlacesUpdate(updatedPlaces);
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
          countryRestriction={countryCode}
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