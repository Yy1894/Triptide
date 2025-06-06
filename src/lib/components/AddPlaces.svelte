<script lang="ts">
    import { onMount } from 'svelte';
    import { Loader } from '@googlemaps/js-api-loader';

    // Extend the PlaceResult type to include our custom photoUrl
    interface ExtendedPlaceResult extends google.maps.places.PlaceResult {
        photoUrl?: string;
    }

    export let onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
    export let countryRestriction: string | undefined = undefined;
    export let placeTypes: string[] = ['establishment'];
    export let placeholder = 'Add a place';
    export let id = crypto.randomUUID(); // Generate unique ID for each instance

    let inputContainer: HTMLDivElement;
    let inputWrapper: HTMLDivElement;
    let showAddButton = false;
    let lastSelectedPlaceName = '';
    let selectedPlace: ExtendedPlaceResult | null = null;
    let inputElement: HTMLInputElement;
    
    const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    onMount(async () => {
        if (!GOOGLE_PLACES_API_KEY) {
            console.error('Google Maps API key is missing');
            return;
        }

        const loader = new Loader({
            apiKey: GOOGLE_PLACES_API_KEY,
            version: "weekly",
            libraries: ["places"],
            language: 'en'
        });

        try {
            await loader.importLibrary("places");

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `places-input-${id}`;
            input.className = 'places-input';
            input.placeholder = placeholder;

            inputWrapper.appendChild(input);
            inputElement = input;

            const autocompleteOptions: google.maps.places.AutocompleteOptions = {
                types: placeTypes
            };

            if (countryRestriction) {
                autocompleteOptions.componentRestrictions = { country: countryRestriction.toLowerCase() };
            }

            const autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions);
            autocomplete.setFields(['name', 'formatted_address', 'photos', 'place_id', 'geometry']);

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace() as ExtendedPlaceResult;
                if (place && place.name) {
                    // If the place has photos, get the URL for the first photo
                    if (place.photos && place.photos.length > 0) {
                        try {
                            const photoOptions = {
                                maxWidth: 400,
                                maxHeight: 300
                            };
                            place.photoUrl = place.photos[0].getUrl(photoOptions);
                        } catch (error) {
                            console.error('Error getting photo URL:', error);
                            place.photoUrl = '/placeholder.jpeg';
                        }
                    }
                    else {
                        place.photoUrl = '/placeholder.jpeg';
                    }
                    
                    selectedPlace = place;
                    lastSelectedPlaceName = input.value.trim();
                    showAddButton = true;
                }
            });

            input.addEventListener('blur', () => {
                const trimmed = input.value.trim();
                if (trimmed === lastSelectedPlaceName) {
                    return;
                } else {
                    showAddButton = false;
                }
            });
        } catch (error) {
            console.error('Error loading Places Autocomplete:', error);
        }
    });

    function handleAddPlace() {
        if (selectedPlace && inputElement) {
            onPlaceSelected(selectedPlace);

            inputElement.value = '';    // reset the value

            showAddButton = false;
            lastSelectedPlaceName = '';
            selectedPlace = null;
        }
    }
</script>

<div class="add-places-wrapper">
    <div class="input-container {showAddButton ? 'with-button' : ''}" bind:this={inputContainer}>
        <div class="input-with-icon" bind:this={inputWrapper}>
            <i class="fa-solid fa-location-dot location-icon"></i>
        </div>
    </div>
    {#if showAddButton}
        <button class="add-button" onclick={handleAddPlace} aria-label="Add a new place">
            <i class="fa-solid fa-plus"></i>
        </button>
    {/if}
</div>

<style>
    .add-places-wrapper {
        width: 100%;
        display: flex;
        gap: 0.4rem;
    }

    .input-container {
        flex: 1 1 100%;
        transition: flex-basis 0.3s ease;
    }

    .input-container.with-button {
        flex: 1 1 auto;
        max-width: calc(100% - 2rem);
    }

    .input-with-icon {
        position: relative;
        width: 100%;
    }

    .location-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--gray-400);
        font-size: 1rem;
        z-index: 1;
    }

    .add-button {
        padding: 0.55rem 0.75rem;
        color: var(--gray-200);
        background: none;
        font-size: 1.2rem;
        border: none;
        border-radius: 2rem;
        cursor: pointer;
        align-self: center;
        transition: all 0.2s ease;
    }

    .add-button:hover {
        background-color: var(--gray-50);
        color: var(--planner-400);
    }

    :global(.places-input) {
        width: 100%;
        box-sizing: border-box;
        padding: 0.75rem 0.75rem 0.75rem 2.5rem;
        font-size: 0.9rem;
        background: var(--gray-50);
        border: 2px solid var(--gray-50);
        border-radius: 0.75rem;
        color: var(--gray-600);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    :global(.places-input:hover) {
        background-color: var(--gray-100);
        border-color: var(--gray-100);
    }

    :global(.places-input:focus) {
        outline-color: var(--planner-400);
        background-color: white;
    }

    :global(.pac-container) {
        border-radius: 0.75rem;
        margin-top: 0.5rem;
        border: 1px solid var(--gray-100);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }

    :global(.pac-item) {
        padding: 0.5rem 0.75rem;
        cursor: pointer;
    }

    :global(.pac-item:hover) {
        background-color: var(--gray-50);
    }

    :global(.pac-container:after) {
        display: none;
    }
</style> 