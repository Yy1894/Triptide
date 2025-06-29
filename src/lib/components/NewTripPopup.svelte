<script lang="ts">
    import { Colors } from '$lib/constants/Colors';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { Loader } from '@googlemaps/js-api-loader';
    import { ref, child, get, set, onValue, push } from 'firebase/database';
    import { db } from '../../firebase';
    import Button from './Button.svelte';

    export let showPopup = false;

    let destination = "";
    let selectedPlace: any;
    let lastSelectedPlaceName = "";
    let startDate = "";
    let endDate = "";
    let tripmates: string[] = [];
    let currentEmail = "";
    let destinationError = false;
    let startDateError = false;
    let endDateError = false;
    let dateOrderError = false;
    let destinationInput: HTMLDivElement;
    let autocomplete: google.maps.places.Autocomplete | null = null;
    let isGoogleLoaded = false;
    
    const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

    // Add reactive statements to clear errors when valid input is provided
    $: if (destination) destinationError = false;
    $: if (startDate) startDateError = false;
    $: if (endDate) endDateError = false;
    
    // Clear date order error when either date changes
    $: if (startDate && endDate) {
        const startDateTime = new Date(startDate).getTime();
        const endDateTime = new Date(endDate).getTime();
        if (endDateTime >= startDateTime) {
            dateOrderError = false;
            startDateError = false;
            endDateError = false;
        }
    }

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
            isGoogleLoaded = true;
        } catch (error) {
            console.error('Error loading Places Autocomplete:', error);
        }
    });

    async function initializeAutocomplete() {
        if (!isGoogleLoaded || !destinationInput) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'destination-input';
        input.placeholder = 'Where do you want to go?';

        destinationInput.appendChild(input);

        autocomplete = new google.maps.places.Autocomplete(input, {
            types: ['(regions)']
        });
        autocomplete.setFields(['name', 'formatted_address', 'photos', 'place_id', 'geometry']);
        
        autocomplete.addListener('place_changed', () => {
            if (!autocomplete) return;
            const place = autocomplete.getPlace();
            if (place.name) {
                destination = place.name;
                selectedPlace = place;
                lastSelectedPlaceName = input.value.trim();
                destinationError = false;
            }
        });

        let placeChangeTimeout;

        input.addEventListener('blur', () => {
            // Use a small delay to allow place_changed event to fire first
            placeChangeTimeout = setTimeout(() => {
                const trimmed = input.value.trim();
                if (trimmed && trimmed !== lastSelectedPlaceName) {
                    destinationError = true;
                }
                else if (!trimmed) {
                    // Don't show error for empty field
                    destinationError = false;
                    destination = "";
                }
            }, 400);
        });
    }

    function isValidEmail(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function handleEmailInput(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const email = currentEmail.trim();
            
            if (email && isValidEmail(email) && !tripmates.includes(email)) {
                tripmates = [...tripmates, email];
                currentEmail = "";
            }
        }
    }

    function removeEmail(emailToRemove: string) {
        tripmates = tripmates.filter(email => email !== emailToRemove);
    }

    function handleCancel() {
        showPopup = false;
        destination = "";
        startDate = "";
        endDate = "";
        tripmates = [];
        currentEmail = "";
        destinationError = false;
        startDateError = false;
        endDateError = false;

        if (autocomplete) {
            google.maps.event.clearInstanceListeners(autocomplete);
            autocomplete = null;
        }
    }

    const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

    async function fetchUnsplashPhoto(query: string): Promise<string | null> {
        try {
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`
            );

            if (!response.ok) {
                console.error("Failed to fetch Unsplash photo");
                return null;
            }

            const data = await response.json();
            const firstPhoto = data.results?.[0];
            return firstPhoto?.urls?.regular || null;
        } catch (error) {
            console.error("Error fetching Unsplash photo:", error);
            return null;
        }
    }

    async function handleStart() {
        destinationError = !destination;
        startDateError = !startDate;
        endDateError = !endDate;

        // Check if both dates are filled before comparing them
        if (startDate && endDate) {
            const startDateTime = new Date(startDate).getTime();
            const endDateTime = new Date(endDate).getTime();
            
            if (endDateTime < startDateTime) {
                startDateError = true;
                endDateError = true;
                dateOrderError = true;
                return;
            }
            dateOrderError = false;
        }

        if (destinationError || startDateError || endDateError) {
            return;
        }
        else {
            const tid = crypto.randomUUID();

            // Extract required place details
            const placeDetails = {
                name: selectedPlace.name,
                formatted_address: selectedPlace.formatted_address,
                photo: await fetchUnsplashPhoto(destination) || '/placeholder.jpeg',
                location: {
                    lat: selectedPlace.geometry.location.lat(),
                    lng: selectedPlace.geometry.location.lng()
                }
            };

            const tripData = {
                tid,
                destination: placeDetails,
                startDate,
                endDate,
                tripmates,
                created_at: new Date().toISOString()
            };

            try {
                // Create a new reference for this specific trip using its ID
                const tripRef = ref(db, `trips/${tid}`);
                await set(tripRef, tripData);
                console.log(`Trip saved to db with ID: ${tid}`);
                goto(`/itinerary/${tid}`);
                handleCancel();
            } catch (error) {
                console.error('Error saving trip:', error);
            }
        }
    }

    $: if (showPopup && isGoogleLoaded && destinationInput) {
        initializeAutocomplete();
    }
</script>

{#if showPopup}
<div class="overlay"> 
    <div class="popup">
        <h1>Start a New Plan</h1>
        
        <div class="input-form">
            <label for="destination">Destination</label>
            <div bind:this={destinationInput} class="destination-wrapper" id="destination"></div>
            {#if destinationError}
                <p class="error-message">Please enter your destination</p>
            {/if}
        </div>

        <div class="date-group">
            <div class="input-form">
                <label for="start-date">Start Date</label>
                <input 
                    type="date" 
                    id="start-date" 
                    bind:value={startDate}
                    required
                />
                {#if startDateError}
                    <p class="error-message">
                        {dateOrderError ? 'Start date must be before end date' : 'Please enter the starting date'}
                    </p>
                {/if}
            </div>

            <div class="input-form">
                <label for="end-date">End Date</label>
                <input 
                    type="date" 
                    id="end-date" 
                    bind:value={endDate}
                    required
                />
                {#if endDateError}
                    <p class="error-message">
                        {dateOrderError ? 'End date must be after start date' : 'Please enter the ending date'}
                    </p>
                {/if}
            </div>
        </div>

        <div class="input-form">
            <label for="trip-friends">
                <span class="invite-label">
                    + Invite Tripmates
                    <i class="fa-solid fa-user-group" style="color: {Colors.gray.dark800}"></i>
                </span>
            </label>
            <div class="email-input-container">
                {#each tripmates as email}
                    <div class="email-tag">
                        <span>{email}</span>
                        <button class="remove-email" onclick={() => removeEmail(email)}>×</button>
                    </div>
                {/each}
                <input 
                    type="email" 
                    id="trip-friends"
                    bind:value={currentEmail}
                    onkeydown={handleEmailInput}
                    placeholder={tripmates.length ? "" : "Enter email addresses"}
                />
            </div>
        </div>

        <div class="button-group">
            <Button text="Cancel" type="gray" onClick={handleCancel} />
            <Button text="Start" type="blue" onClick={handleStart} disabled={destinationError || startDateError || endDateError}/>
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

    .error-message {
        color: var(--memory-500);
        margin: 0.5rem 0 0 0;
        font-size: 0.8rem;
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

    .email-input-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        min-height: 2.5rem;
        align-items: center;
    }

    .email-input-container input {
        border: none;
        outline: none;
        flex: 1;
        min-width: 50px;
        padding: 0;
        padding-left: 0.25rem;
    }

    .email-input-container input:focus {
        outline: none;
    }

    .email-tag {
        display: flex;
        align-items: center;
        background-color: var(--gray-100);
        padding: 0.25rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        gap: 0.5rem;
    }
    .email-tag:hover {
        background-color: var(--gray-200);
        opacity: 0.8;
    }

    .remove-email {
        background: none;
        border: none;
        color: var(--gray-600);
        cursor: pointer;
        padding: 0;
        font-size: 1.2rem;
        line-height: 1;
        display: flex;
        align-items: center;
    }

    .remove-email:hover {
        color: var(--memory-600);
    }
</style> 