<script lang="ts">
    import { slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import TripCard from './TripCard.svelte';

    export let showPanel = false;
    export let destination = '';
    export let pastTrips: any[] = [];
    export let onClose = () => {};

    let tripsContainer: HTMLElement;
    let showLeftButton = false;
    let showRightButton = true;

    function handleScroll() {
        if (!tripsContainer) return;
        
        // Show/hide left button based on scroll position
        showLeftButton = tripsContainer.scrollLeft > 0;
        
        // Show/hide right button based on whether we can scroll more
        const maxScroll = tripsContainer.scrollWidth - tripsContainer.clientWidth;
        showRightButton = Math.ceil(tripsContainer.scrollLeft) < maxScroll;
    }

    function scrollLeft() {
        if (!tripsContainer) return;
        const scrollAmount = tripsContainer.clientWidth * 0.8; // Scroll 80% of container width
        tripsContainer.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    }

    function scrollRight() {
        if (!tripsContainer) return;
        const scrollAmount = tripsContainer.clientWidth * 0.8; // Scroll 80% of container width
        tripsContainer.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
</script>

{#if showPanel}
    <div 
        class="panel"
        transition:slide={{ duration: 400, easing: quintOut }}
    >
        <div class="header">
            <h2>Past Trips to {destination}</h2>
            <button class="close-btn" onclick={onClose} aria-label="Close panel">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="content">
            {#if pastTrips.length === 0}
                <div class="message">This is your first trip to {destination}!</div>
            {:else}
                <div class="trips-scroll-container">
                    {#if showLeftButton}
                        <button 
                            class="scroll-btn left" 
                            onclick={scrollLeft}
                            aria-label="Scroll left"
                            transition:slide={{ duration: 200, easing: quintOut }}
                        >
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                    {/if}
                    
                    <div 
                        class="trips-container" 
                        bind:this={tripsContainer}
                        onscroll={handleScroll}
                    >
                        {#each pastTrips as trip}
                            <TripCard 
                                destination={trip.destination.name}
                                startDate={new Date(trip.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                endDate={new Date(trip.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                image={trip.destination.photo}
                                tid={trip.tid}
                            />
                        {/each}
                    </div>

                    {#if showRightButton}
                        <button 
                            class="scroll-btn right" 
                            onclick={scrollRight}
                            aria-label="Scroll right"
                            transition:slide={{ duration: 200, easing: quintOut }}
                        >
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .panel {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 50vh;
        background: var(--white);
        border-radius: 20px 20px 0 0;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        z-index: 10;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 2rem;
        border-bottom: 1px solid var(--gray-100);
    }

    .header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.5rem;
        color: var(--gray-400);
        border-radius: 50%;
        transition: all 0.2s ease;
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-btn:hover {
        background-color: var(--gray-100);
    }

    .content {
        flex: 1;
        padding: 1.5rem 2rem;
        overflow: hidden;
    }

    .message {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--gray-400);
        font-size: 1.1rem;
    }

    .trips-scroll-container {
        position: relative;
        height: 100%;
    }

    .trips-container {
        display: flex;
        gap: 1.5rem;
        overflow-x: auto;
        padding-bottom: 1rem;
        scroll-behavior: smooth;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .trips-container::-webkit-scrollbar {
        display: none;
    }

    .trips-container :global(.trip-card) {
        min-width: 280px;
        width: 280px;
    }

    .scroll-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: var(--white);
        border: none;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        color: var(--gray-600);
        transition: all 0.2s ease;
        z-index: 1;
    }

    .scroll-btn:hover {
        background-color: var(--gray-50);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .scroll-btn.left {
        left: -1.25rem;
    }

    .scroll-btn.right {
        right: -1.25rem;
    }
</style> 