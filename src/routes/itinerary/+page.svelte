<script lang="ts">
    import '../../app.css';
    import { goto } from '$app/navigation';
    import { slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import { Loader } from '@googlemaps/js-api-loader';
    import { browser } from '$app/environment';
    import ProfilePicture from '$lib/components/ProfilePicture.svelte';
    import BottomBar from '$lib/components/BottomBar.svelte';
    import Button from '$lib/components/Button.svelte';
    import ItineraryDate from '$lib/components/ItineraryDate.svelte';
    import AddPlaces from '$lib/components/AddPlaces.svelte';
    import PlaceCard from '$lib/components/PlaceCard.svelte';

    // Placeholder data obtained from the popup
    let destination = "Taiwan";
    let desc = `Click to view all past trips to ${destination}`;
    let startDate = "27/04/2025";
    let endDate = "30/04/2025";
    let places: string[] = [];
    const place_placeholder = { name: 'Somewhere'}
    const places_placeholder = Array(3).fill(place_placeholder);

    const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    let mapContainer: HTMLDivElement;

    onMount(async () => {
        if (!browser) return;
        
        if (!GOOGLE_PLACES_API_KEY) {
            console.error('Google Places API key is missing');
            return;
        }
        
        const loader = new Loader({
            apiKey: GOOGLE_PLACES_API_KEY,
            version: "weekly",
            libraries: ["places"],
            language: 'en'
        });

        try {
            await loader.importLibrary("maps");

            const map = new google.maps.Map(mapContainer, {
                center: { lat: 23.5, lng: 121 }, // Taiwan's coordinates
                zoom: 8,
            });
        } catch (error) {
            console.error('Error loading Google Maps:', error);
        }
    });
    
    // Array of dates between startDate to endDate
    // TODO: implement generateTripDates(startDate, endDate)
    let tripDates = ["27/04/2025", "28/04/2025", "29/04/2025", "30/04/2025"];
    let expandedSections = {
        explore: true,
        places_to_visit: true,
        itinerary: true
    };
    let expandedDates: Record<string, boolean> = {};
    tripDates.forEach(date => expandedDates[date] = false);

    let recommendedPlaces = [
        { name: "Place name" },
        { name: "Place name" },
        { name: "Place name" }
    ];

    let placesToVisit = [
        { name: "Place name"},
        { name: "Place name"},
        { name: "Place name"}
    ];

    function handleDeletePlace(index: number) {
        placesToVisit = placesToVisit.filter((_, i) => i !== index);
    }

    function toggleSection(section: keyof typeof expandedSections) {
        expandedSections[section] = !expandedSections[section];
    }

    function handleBack() {
        // Get the 'from' parameter from the URL
        const fromPage = page.url.searchParams.get('from');
        console.log(`fromPage = ${fromPage}`);
        
        if (fromPage === 'trips') {
            goto('/trips');
        } else {
            goto('/');
        }
    }

    function handlePlaceSelected(place: google.maps.places.PlaceResult) {
        const newPlace = {
            name: place.name || 'Unknown Place',
            desc: place.formatted_address || '',
            image: (place as any).photoUrl || 'placeholder.jpeg'
        };
        
        placesToVisit = [...placesToVisit, newPlace];
    }
    
    function handlePastTrip() {
        console.log(`see past trips to ${destination}`)
    }

    function handleCancel() {
        console.log('cancel update');
    }

    function handleSave() {
        console.log('save update');
    }

    function handleRecommendPlaces() {
        console.log(`will give recommendation using OpenAI`);
    }

    function handleTurnIntoItinerary() {
        console.log(`please turn this into itinerary`);
    }

    function showPastTrips() {
        // TODO: Implement past trips view
        console.log('Show past trips');
    }
</script>

<main>
    <div class="plan-section">
        <header>
            <div class="back-btn-wrapper">
                <button class="back-btn" onclick={handleBack} aria-label="Back">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
            </div>
            
            <div class="trip-info">
                <h1>Trip to {destination}</h1>
                <p class="date">{startDate} - {endDate}</p>
            </div>

            <div class="tripmates">
                <ProfilePicture zIndex=1/>
                <ProfilePicture marginLeft=-15px zIndex=0/>
            </div>
        </header>

        <div class="content">
            <section class="places-section">
                <button class="section-header" onclick={() => toggleSection('places_to_visit')}>
                    <div class="section-text">
                        <i class="fa-solid fa-chevron-right arrow-icon" class:rotated={expandedSections.places_to_visit}></i>
                        <h2>Places to Visit</h2>
                    </div>
                </button>

                <!-- TODO: implement the content part -->
                {#if expandedSections.places_to_visit}
                    <div
                        class="section-content places"
                        transition:slide={{ duration: 400, easing: quintOut }}
                    >   
                        <div class="added-places">
                            {#each placesToVisit as place, i}
                                <PlaceCard 
                                    variant="simple" 
                                    place={place}
                                    onDelete={() => handleDeletePlace(i)}
                                />
                            {/each}
                        </div>

                        <AddPlaces
                            onPlaceSelected={handlePlaceSelected}
                            countryRestriction="tw"
                        />

                        <div class="places-buttons">
                            <Button text="Recommend Places" type="blue" onClick={handleRecommendPlaces} />
                            <Button text="Turn into Itinerary" type="blue" onClick={handleTurnIntoItinerary} />
                        </div>
                    </div>
                {/if}
            </section>

            <section class="itinerary-section">
                <button class="section-header" onclick={() => toggleSection('itinerary')}>
                    <div class="section-text">
                        <i class="fa-solid fa-chevron-right arrow-icon" class:rotated={expandedSections.itinerary}></i>
                        <h2>Itinerary</h2>
                    </div>
                </button>
                
                {#if expandedSections.itinerary}
                    <div
                        class="section-content"
                        transition:slide={{ duration: 400, easing: quintOut }}
                    >
                        {#each tripDates as date}
                            <ItineraryDate 
                                {date} 
                                isExpanded={expandedDates[date]}
                            />
                        {/each} 
                    </div>
                {/if}
            </section>

            <div class="button-group">
                <Button text="Cancel" type="gray" onClick={handleCancel}/>
                <!-- later edit this so button turns blue only when there is changes to the plan -->
                <Button text="Save" type="blue" onClick={handleSave} />
            </div>
        </div>
    </div>

    <div class="map-section">
        <div class="map-container" bind:this={mapContainer}></div>
        <BottomBar title="Past Trips" desc={desc} onClick={handlePastTrip} />
    </div>
</main>


<style>
    main {
        height: 100vh;
        display: grid;
        grid-template-columns: 50% 50%;
        font-family: 'Inter', sans-serif;
    }

    .plan-section {
        height: 100vh;
        box-sizing: border-box;
        padding: 0.5rem 0rem 0rem 0rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }

    .map-section {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: #84D7EB;
    }

    .map-container {
        flex: 1;
        position: relative;
    }

    header {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        gap: 1rem;
        padding: 0 2rem 1.5rem 1rem;
        border-bottom: 1px solid var(--gray-100);
    }

    .back-btn-wrapper {
        align-self: flex-start;
        margin-top: 1.75rem;
    }

    .back-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.5rem;
        color: var(--gray-400);
        border-radius: 50%;
        transition: background-color 0.2s;
    }

    .back-btn:hover {
        background-color: var(--gray-100);
    }

    .trip-info {
        flex: 1;
        margin-bottom: 0.5rem;
    }

    .trip-info h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0;
    }

    .date {
        color: var(--gray-400);
        margin-top: 0.5rem;
        margin-bottom: 0;
        font-size: 0.9rem;
    }

    .tripmates {
        margin-top: 1rem;
        display: flex;
        align-items: center;
    }

    .content {
        padding: 1rem 1.5rem 0 1.5rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .section-header {
        width: 100%;
        background: none;
        border: none;
        border-bottom: 1px solid var(--gray-100);
        box-sizing: border-box;
        padding: 0.75rem 0.5rem;
        cursor: pointer;
        text-align: left;
    }

    .section-text {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0;
        font-size: 1rem;
        font-family: 'Inter', sans-serif;
    }

    .arrow-icon {
        transition: transform 0.3s ease;
        transform-origin: center;
    }

    .rotated {
        transform: rotate(90deg);
    }

    .section-text h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
    }

    .section-content {
        padding-left: 1.5rem;
        padding-top: 1rem;
        display: flex;
        flex-direction: column;
        margin-bottom: 1rem;
        gap: 0.5rem;
    }

    .section-content.places{
        margin-left: 0.5rem;
    }

    .places-buttons {
        margin-top: 0.5rem;
        display: flex;
        gap: 0.5rem;
    }
    .button-group {
        position: sticky;
        flex-shrink: 0;
        background-color: var(--white);
        padding: 1.5rem 0;
        bottom: 0;
        display: flex;
        gap: 1rem;
        margin-top: auto;
    }
</style>