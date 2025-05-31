<script lang="ts">
    import '../../app.css';
    import TripCard from '$lib/components/TripCard.svelte';
    import Button from '$lib/components/Button.svelte';
    import NewTripPopup from '$lib/components/NewTripPopup.svelte';
    import Nav from '$lib/components/Nav.svelte';
    
    interface Trip {
        destination: string;
        startDate: string;
        endDate: string;
        imageUrl: string;
    }

    let activeTab = "Ongoing Trips";
    let showNewTripPopup = false;
    let contentContainer: HTMLElement;
    
    // Sample data, replace with actual data later
    const sample_trip = {
        destination: "Taiwan",
        startDate: "04.27.2025",
        endDate: "04.30.2025",
        imageUrl: ""
    }
    let ongoingTrips = Array(3).fill(sample_trip);
    
    // let pastTrips: Trip[] = [];
    let pastTrips = Array(14).fill(sample_trip);

    function handleNewTrip() {
        showNewTripPopup = true;
    }

    function handleTabChange(tab: string) {
        activeTab = tab;
        contentContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
</script>

<main>
    <Nav activeTab="Planner" />

    <div class="content" bind:this={contentContainer}>
        <div class="header">
            <h1>Your Trips</h1>
        </div>

        <div class="tabs">
            <button 
                class:active={activeTab === "Ongoing Trips"} 
                onclick={() => handleTabChange("Ongoing Trips")}>
                Ongoing Trips
            </button>
            <button 
                class:active={activeTab === "Past Trips"} 
                onclick={() => handleTabChange("Past Trips")}>
                Past Trips
            </button>
        </div>

        <div class="trips-container">
            {#if activeTab === "Ongoing Trips"}
                {#if ongoingTrips.length === 0}
                    <div class="empty-state">
                        <p>There is no ongoing trip</p>
                    </div>
                {:else}
                    <div class="trips-grid">
                        {#each ongoingTrips as trip}
                            <TripCard {...trip} />
                        {/each}
                    </div>
                {/if}
            {:else}
                {#if pastTrips.length === 0}
                    <div class="empty-state">
                        <p>There is no past trip</p>
                    </div>
                {:else}
                    <div class="trips-grid">
                        {#each pastTrips as trip}
                            <TripCard {...trip} />
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>

        <div class="floating-button">
            <Button text="+ Plan a new trip" type="single" onClick={handleNewTrip} />
        </div>
    </div>

    <NewTripPopup bind:showPopup={showNewTripPopup} fromPage="trips" />
</main>

<style>
    main {
        height: 100vh;
        background-color: var(--white);
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
        background-color: var(--white);
    }

    .header h1 {
        font-size: 2rem;
        font-weight: 600;
        margin: 0;
    }

    .tabs {
        display: flex;
        position: sticky;
        top: 0;
        padding-top: 1.5rem;
        padding-left: 1rem;
        background-color: var(--white);
        gap: 1.5rem;
        margin-bottom: 0.5rem;
        z-index: 5;
    }

    .tabs button {
        background: none;
        border: none;
        font-size: 1rem;
        cursor: pointer;
        padding: 0.75rem 0;
        color: var(--gray-400);
        transition: color 0.3s ease;
        position: relative;
        min-width: 120px;
        text-align: center;
    }

    .tabs button:hover {
        color: black;
    }

    .tabs button.active {
        color: var(--planner-600);
        font-weight: 600;
    }

    .tabs button.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: var(--planner-600);
        transition: transform 0.2s ease;
    }

    .trips-container {
        flex: 1;
        padding: 0 1rem;
        display: flex;
        flex-direction: column;
    }

    .trips-grid {
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