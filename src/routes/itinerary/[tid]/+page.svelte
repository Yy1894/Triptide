<script lang="ts">
    import '../../../app.css';
    import { goto } from '$app/navigation';
    import { slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import { Loader } from '@googlemaps/js-api-loader';
    import { browser } from '$app/environment';
    import { ref, onValue, update, get } from 'firebase/database';
    import { db } from '../../../firebase';
    import { countryMappings } from '$lib/constants/CountryMappings';
    import { Colors } from '$lib/constants/Colors';
    import ProfilePicture from '$lib/components/ProfilePicture.svelte';
    import BottomBar from '$lib/components/BottomBar.svelte';
    import Button from '$lib/components/Button.svelte';
    import ItineraryDate from '$lib/components/ItineraryDate.svelte';
    import AddPlaces from '$lib/components/AddPlaces.svelte';
    import PlaceCard from '$lib/components/PlaceCard.svelte';
    import PastTripsPanel from '$lib/components/PastTripsPanel.svelte';
    import { getPlaceRecommendations, distributePlacesToItinerary } from '../../../services/openai';
    import RecommendationPopup from '$lib/components/RecommendationPopup.svelte';
    import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
    import TurnIntoItineraryPopup from '$lib/components/TurnIntoItineraryPopup.svelte';

    let tripData: any = null;
    let tripDates: string[] = [];
    let tid: string;
    let countryCode = 'tw'; // country code to restrict the autocomplete search
    let showTurnIntoItineraryPopup = false;
    let isDistributingPlaces = false;
    
    // the place data structure saved in the database
    interface Place {
        name: string;
        desc?: string;
        image?: string;
        time?: string;
        geometry?: {
            lat: number;
            lng: number;
        };
    }

    interface DatePlaces {
        placesPlanned: Place[];
    }

    let placesPlanned: Record<string, DatePlaces> = {};

    /**
     * Convert date format from DD/MM/YYYY to DD-MM-YYYY
     * 
     * @param date the date to be converted
     */
    function convertDateFormat(date: string): string {
        return date.replace(/\//g, '-');
    }

    const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    let mapContainer: HTMLDivElement;
    let expandedDates: Record<string, boolean> = {};
    let map: google.maps.Map | null = null;
    let markers: google.maps.marker.AdvancedMarkerElement[] = [];
    let showPastTrips = false;
    let showRecommendationPopup = false;
    let isGeneratingRecommendations = false;

    let pastTripsData: any[] = [];

    /**
     * Check if there are any past trips to the same destination
     * and fetch their places data
     */
    async function checkPastTrips(destinationName: string): Promise<boolean> {
        try {
            const tripsRef = ref(db, 'trips');
            const snapshot = await get(tripsRef);
            if (!snapshot.exists()) return false;

            // Get today's date at midnight for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Filter past trips for this destination
            pastTripsData = Object.entries(snapshot.val())
                .map(([tripId, data]) => ({
                    tid: tripId,
                    ...data as any
                }))
                .filter(trip => {
                    const endDate = new Date(trip.endDate);
                    return trip.tid !== tid && // not current trip
                           endDate < today && // trip is in the past
                           trip.destination.name === destinationName;
                })
                .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()); // Most recent first

            return pastTripsData.length > 0;
        } catch (error) {
            console.error('Error checking past trips:', error);
            return false;
        }
    }

    /**
     * Get all places from past trips to this destination
     */
    function getPastPlaces(): string[] {
        const places = new Set<string>();

        pastTripsData.forEach(trip => {
            // Add places from placesToVisit
            if (trip.placesToVisit) {
                trip.placesToVisit.forEach((place: any) => places.add(place.name));
            }

            // Add places from itineraryDate
            if (trip.itineraryDate) {
                Object.values(trip.itineraryDate).forEach((dateData: any) => {
                    dateData.placesPlanned?.forEach((place: any) => places.add(place.name));
                });
            }
        });

        return Array.from(places);
    }

    // When tripData is loaded, check for past trips
    $: if (tripData?.destination?.name) {
        checkPastTrips(tripData.destination.name);
    }

    /**
     * Get the ISO 3166-1 alpha-2 country code from /constants/CountryMappings.ts
     * 
     * @param formattedAddress the address of the destination
     * @returns the country code of the input
     */
    function getCountryCode(formattedAddress: string): string {
        // get the country from the last part of formatted address
        const parts = formattedAddress.split(',');
        const country = parts[parts.length - 1].trim();

        // check if the mapping is available in /constants/CountryMappings.ts
        if (countryMappings[country]) {
            return countryMappings[country];
        }

        // if no mapping found, convert to lowercase and take first two letters
        // might not always be correct
        return country.toLowerCase().slice(0, 2);
    }

    function clearMarkers() {
        if (markers.length > 0) {
            markers.forEach(marker => marker.map = null);
            markers = [];
        }
    }

    async function updateMapMarkers() {
        if (!map) return;
        
        // clear existing markers
        clearMarkers();

        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        // add markers for placesToVisit (red color)
        placesToVisit.forEach(place => {
            if (place.geometry?.lat && place.geometry?.lng) {
                const pin = new PinElement({
                    background: Colors.memory.med400,
                    borderColor: Colors.memory.dark700,
                    glyphColor: Colors.white,
                });

                const marker = new AdvancedMarkerElement({
                    map,
                    position: { lat: place.geometry.lat, lng: place.geometry.lng },
                    title: place.name,
                    content: pin.element
                });
                markers.push(marker);
            }
        });

        // add markers for placesPlanned (blue color)
        Object.values(placesPlanned).forEach(dateData => {
            if (!dateData?.placesPlanned) return;
            
            dateData.placesPlanned.forEach(place => {
                if (place.geometry?.lat && place.geometry?.lng) {
                    const pin = new PinElement({
                        background: Colors.planner.med400,
                        borderColor: Colors.planner.dark700,
                        glyphColor: Colors.white,
                    });

                    const marker = new AdvancedMarkerElement({
                        map,
                        position: { lat: place.geometry.lat, lng: place.geometry.lng },
                        title: place.name,
                        content: pin.element
                    });
                    markers.push(marker);
                }
            });
        });
    }

    // Update markers whenever places change
    $: {
        if (placesToVisit || placesPlanned) {
            updateMapMarkers();
        }
    }

    onMount(async () => {
        if (!browser) return;
        
        if (!GOOGLE_PLACES_API_KEY) {
            console.error('Google Places API key is missing');
            return;
        }
        
        // Get the trip ID from the URL
        tid = page.params.tid;

        const loader = new Loader({
            apiKey: GOOGLE_PLACES_API_KEY,
            version: "weekly",
            libraries: ["places"],
            language: 'en'
        });

        try {
            const { Map } = await loader.importLibrary("maps");
        
            // fetch trip data and initialize map when data is ready
            const tripRef = ref(db, `trips/${tid}`);
        
            onValue(tripRef, (snapshot) => {
                tripData = snapshot.val();
                if (tripData) {
                    // update country code based on destination
                    if (tripData.destination?.formatted_address) {
                        countryCode = getCountryCode(tripData.destination.formatted_address);
                    }

                    // generate array of dates between start and end date
                    const start = new Date(tripData.startDate);
                    const end = new Date(tripData.endDate);
                    const dates = [];
                    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                        dates.push(date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
                    }
                    tripDates = dates;
                    
                    // initialize expanded states for dates
                    expandedDates = Object.fromEntries(dates.map(date => [date, false]));

                    // initialize placesToVisit from database or empty array
                    placesToVisit = tripData.placesToVisit || [];

                    // initialize placesPlanned from database or empty object
                    placesPlanned = {};
                    if (tripData.itineraryDate) {
                        // convert keys from DD/MM/YYYY to DD-MM-YYYY if needed
                        Object.entries(tripData.itineraryDate).forEach(([key, value]) => {
                            const formattedKey = key.includes('/') ? convertDateFormat(key) : key;
                            placesPlanned[formattedKey] = value as DatePlaces;
                        });
                    }
                    
                    // initialize or update the map
                    if (mapContainer && tripData.destination?.location) {
                        if (!map) {
                            map = new Map(mapContainer, {
                                center: tripData.destination.location,
                                zoom: 10,
                                mapId: 'ITINERARY_MAP_ID'
                            });
                        } else {
                            map.setCenter(tripData.destination.location);
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading Google Maps:', error);
        }
    });

    let expandedSections = {
        explore: true,
        places_to_visit: true,
        itinerary: true
    };

    let recommendedPlaces = [
        { name: "Place name" },
        { name: "Place name" },
        { name: "Place name" }
    ];

    let placesToVisit: any[] = [];

    async function handleDeletePlace(index: number) {
        const newPlacesToVisit = placesToVisit.filter((_, i) => i !== index);
        
        try {
            // Update the database
            await update(ref(db, `trips/${tid}`), {
                placesToVisit: newPlacesToVisit
            });
            
            // Update local state
            placesToVisit = newPlacesToVisit;
        } catch (error) {
            console.error('Error deleting place:', error);
        }
    }

    function toggleSection(section: keyof typeof expandedSections) {
        expandedSections[section] = !expandedSections[section];
    }

    function handleBack() {
        goto('/trips');
    }

    function handlePastTrip() {
        showPastTrips = !showPastTrips;
    }

    async function handlePlaceSelected(place: google.maps.places.PlaceResult) {
        const newPlace = {
            name: place.name || 'Unknown Place',
            desc: place.formatted_address || '',
            image: (place as any).photoUrl || '/placeholder.jpeg',
            geometry: place.geometry?.location ? {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            } : undefined
        };
        
        const updatedPlaces = [...placesToVisit, newPlace];
        
        try {
            // update the database
            await update(ref(db, `trips/${tid}`), {
                placesToVisit: updatedPlaces
            });
            
            // update local state
            placesToVisit = updatedPlaces;
        } catch (error) {
            console.error('Error adding place:', error);
        }
    }

    async function handleRecommendPlaces() {
        if (!tripData?.destination?.name) return;
        console.log("recommend places");

        // Check for past trips
        const hasPastTrips = await checkPastTrips(tripData.destination.name);
        
        if (hasPastTrips) {
            console.log("has past trips");
            showRecommendationPopup = true;
        } else {
            // If no past trips, proceed with getting new recommendations
            await getRecommendations('new');
        }
    }

    async function handleRecommendationSelect(type: 'new' | 'old' | 'mix') {
        showRecommendationPopup = false;
        await getRecommendations(type);
    }

    function handleRecommendationCancel() {
        showRecommendationPopup = false;
    }

    async function getRecommendations(recommendationType: 'new' | 'old' | 'mix') {
        isGeneratingRecommendations = true;
        try {
            // Get current places from both placesToVisit and placesPlanned
            const currentPlaces = [
                ...placesToVisit.map(p => p.name),
                ...Object.values(placesPlanned).flatMap(date => 
                    date.placesPlanned?.map(p => p.name) || []
                )
            ];

            // Get past places from previous trips
            const pastPlaces = getPastPlaces();

            // Get recommendations from OpenAI
            const recommendations = await getPlaceRecommendations(
                tripData.destination.name,
                currentPlaces,
                pastPlaces,
                recommendationType
            );

            // For each recommendation, search Google Places API for details
            const placesService = new google.maps.places.PlacesService(map!);
            
            for (const rec of recommendations) {
                const request = {
                    query: `${rec.name} ${tripData.destination.name}`,
                    fields: ['name', 'formatted_address', 'photos', 'place_id', 'geometry']
                };

                try {
                    const results = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
                        placesService.textSearch(request, (results, status) => {
                            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                                resolve(results);
                            } else {
                                reject(new Error(`Places API error: ${status}`));
                            }
                        });
                    });

                    if (results.length > 0) {
                        const place = results[0];
                        const photoUrl = place.photos?.[0]?.getUrl();
                        
                        const newPlace = {
                            name: place.name || rec.name,
                            desc: place.formatted_address || '',
                            image: photoUrl || '/placeholder.jpeg',
                            geometry: place.geometry?.location ? {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            } : undefined
                        };

                        // Add to placesToVisit
                        placesToVisit = [...placesToVisit, newPlace];
                    }
                } catch (error) {
                    console.error(`Error fetching place details for ${rec.name}:`, error);
                }
            }

            // Update the database with new places
            await update(ref(db, `trips/${tid}`), {
                placesToVisit
            });

        } catch (error) {
            console.error('Error getting recommendations:', error);
            alert('Failed to get recommendations. Please try again.');
        } finally {
            isGeneratingRecommendations = false;
        }
    }

    async function handleTurnIntoItinerary() {
        showTurnIntoItineraryPopup = true;
    }

    async function handleConfirmTurnIntoItinerary() {
        showTurnIntoItineraryPopup = false;
        isDistributingPlaces = true;

        try {
            // Convert dates to DD-MM-YYYY format
            const formattedDates = tripDates.map(date => convertDateFormat(date));
            
            // Distribute places using OpenAI, passing the existing places
            const distribution = await distributePlacesToItinerary(
                placesToVisit,
                formattedDates,
                tripData.destination.name,
                placesPlanned
            );

            // Update the database with the new distribution
            await update(ref(db, `trips/${tid}/itineraryDate`), distribution);
            
            // Update local state
            placesPlanned = distribution;

            // Clear places to visit
            await update(ref(db, `trips/${tid}`), {
                placesToVisit: []
            });
            placesToVisit = [];

        } catch (error) {
            console.error('Error turning into itinerary:', error);
            alert('Failed to distribute places. Please try again.');
        } finally {
            isDistributingPlaces = false;
        }
    }

    function handleCancelTurnIntoItinerary() {
        showTurnIntoItineraryPopup = false;
    }

    async function handlePlacePlanned(date: string, places: Place[]) {
        const formattedDate = convertDateFormat(date);
        try {
            // Update the database
            await update(ref(db, `trips/${tid}/itineraryDate/${formattedDate}`), {
                placesPlanned: places
            });
            
            // Update local state
            placesPlanned = {
                ...placesPlanned,
                [formattedDate]: {
                    placesPlanned: places
                }
            };
        } catch (error) {
            console.error('Error updating places planned:', error);
        }
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
                <h1>Trip to {tripData?.destination?.name || 'Loading...'}</h1>
                <p class="date">{tripData?.startDate ? new Date(tripData.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} - {tripData?.endDate ? new Date(tripData.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</p>
            </div>

            <div class="tripmates">
                <ProfilePicture friends={tripData?.tripmates?.length || 0} />
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
                            countryRestriction={countryCode}
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
                                date={date}
                                isExpanded={expandedDates[date]}
                                places={placesPlanned[convertDateFormat(date)]?.placesPlanned || []}
                                onPlacesUpdate={(places) => handlePlacePlanned(date, places)}
                                countryCode={countryCode}
                            />
                        {/each} 
                    </div>
                {/if}
            </section>
        </div>
    </div>

    <div class="map-section">
        <div class="map-container" bind:this={mapContainer}></div>
        <BottomBar title="Past Trips" desc="Click to view all past trips to {tripData?.destination?.name}" onClick={handlePastTrip} />
        <PastTripsPanel 
            showPanel={showPastTrips}
            destination={tripData?.destination?.name || ''}
            pastTrips={pastTripsData}
            onClose={() => showPastTrips = false}
        />
    </div>

    <RecommendationPopup 
        showPopup={showRecommendationPopup}
        destination={tripData?.destination?.name || ''}
        onSelect={handleRecommendationSelect}
        onCancel={handleRecommendationCancel}
    />

    <TurnIntoItineraryPopup
        showPopup={showTurnIntoItineraryPopup}
        onConfirm={handleConfirmTurnIntoItinerary}
        onCancel={handleCancelTurnIntoItinerary}
    />

    <LoadingOverlay 
        show={isGeneratingRecommendations || isDistributingPlaces}
        message={isDistributingPlaces ? "Distributing Places into Itinerary" : "Generating Recommended Places"}
    />
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
        position: relative;
        overflow: hidden;
    }

    .map-container {
        flex: 1;
        position: relative;
    }

    header {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        gap: 0.75rem;
        padding: 0 2rem 1.5rem 0.75rem;
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
        padding: 0.5rem 0.75rem;
        color: var(--gray-400);
        border-radius: 50%;
        transition: all 0.2s ease;
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
</style> 