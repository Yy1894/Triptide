<script lang="ts">
    import { Colors } from '$lib/constants/Colors';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { Loader } from '@googlemaps/js-api-loader';
    import Button from './Button.svelte';

    export let showPopup = false;
    export let fromPage = 'home';

    let destination = "";
    let startDate = "";
    let endDate = "";
    let friends = "";
    let destinationError = false;
    let startDateError = false;
    let endDateError = false;
    let destinationInput: HTMLDivElement;
    
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

            const waitForElement = () => new Promise<void>((resolve) => {
                const check = () => {
                    if (destinationInput) return resolve();
                    requestAnimationFrame(check);
                };
                check();
            });

            await waitForElement();

            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'destination-input';
            input.placeholder = 'Where do you want to go?';

            destinationInput.appendChild(input);

            const autocomplete = new google.maps.places.Autocomplete(input, {
                types: ['(regions)']
            });
            autocomplete.setFields(['name', 'formatted_address']);

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                destination = place.name || "";
            });


            // ------ The Implementation below is the new one, but can't style it --------
            // const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
            //     types: ['(cities)'], // Restrict to cities only
            // });

            // destinationInput.appendChild(placeAutocomplete);

            // //@ts-ignore
            // placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
            //     const place = placePrediction.toPlace();
            //     await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
            //     destination = place.displayName;
            // });
        } catch (error) {
            console.error('Error loading Places Autocomplete:', error);
        }
    });

    function handleCancel() {
        showPopup = false;
        destination = "";
        startDate = "";
        endDate = "";
        friends = "";
    }

    function handleStart() {
        destinationError = !destination;
        startDateError = !startDate;
        endDateError = !endDate;

        if (destinationError || startDateError || endDateError) {
            alert('Please fill in all required fields: Destination, Start Date, End Date');
            return;
        }

        goto(`/itinerary?from=${fromPage}`);
        handleCancel();
    }
</script>

{#if showPopup}
<div class="overlay"> 
    <div class="popup">
        <h1>Start a New Plan</h1>
        
        <div class="input-form">
            <label for="destination-input" class:error={destinationError}>Destination</label>
            <div bind:this={destinationInput} class="destination-wrapper" id="destination"></div>
        </div>

        <div class="date-group">
            <div class="input-form">
                <label for="start-date" class:error={startDateError}>Start Date</label>
                <input 
                    type="date" 
                    id="start-date" 
                    bind:value={startDate}
                    required
                />
            </div>

            <div class="input-form">
                <label for="end-date" class:error={endDateError}>End Date</label>
                <input 
                    type="date" 
                    id="end-date" 
                    bind:value={endDate}
                    required
                />
            </div>
        </div>

        <div class="input-form">
            <label for="trip-friends">
                <span class="invite-label">
                    + Invite Friends
                    <i class="fa-solid fa-user-group" style="color: {Colors.gray.dark800}"></i>
                </span>
            </label>
            <input 
                type="text" 
                id="trip-friends"
                bind:value={friends} 
                placeholder="Enter email addresses"
            />
        </div>

        <div class="button-group">
            <Button text="Cancel" type="gray" onClick={handleCancel} />
            <Button text="Start" type="blue" onClick={handleStart} />
        </div>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
    }

    .popup {
        background: var(--white);
        padding: 2rem;
        border-radius: 20px;
        width: 80%;
        max-width: 560px;
        box-shadow: 0 0px 20px rgba(0, 0, 0, 0.1);
    }

    .popup h1 {
        margin: 0 0 2rem 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .input-form {
        margin-bottom: 1.5rem;
    }

    .input-form label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--gray-800);
    }

    .input-form label.error {
        color: var(--memory-600) !important;
    }

    .input-form input {
        width: 95.3%;
        padding: 0.75rem;
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        font-size: 1rem;
    }

    input:focus {
        outline-color: var(--planner-600);
    }

    :global(input#destination-input) {
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 0.75rem;
        width: 95.3%;
        font-size: 1rem;
    }

    :global(input#destination-input:focus) {
        outline-color: var(--planner-600);
    }

    .date-group {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .date-group .input-form {
        flex: 1;
        margin-bottom: 0;
    }

    .date-group .input-form input {
        width: 90%;
    }

    .invite-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }
</style> 