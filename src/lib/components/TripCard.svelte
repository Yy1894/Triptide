<script lang="ts">
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import DeleteConfirmationPopup from './DeleteConfirmationPopup.svelte';
    import { ref, remove } from 'firebase/database';
    import { db } from '../../firebase';

    export let destination = '';
    export let startDate = '';
    export let endDate = '';
    export let image = '';
    export let tid = '';
    export let memoryId: string = '';
    export let variant: 'trip' | 'memory' = 'trip';

    let showDelete = false;
    let showDeleteConfirmation = false;

    function handleClick() {
        if (variant === 'memory') {
            goto(`/viewimage/${tid}/${memoryId}`);
        } else {
            goto(`/itinerary/${tid}`);
        }
    }

    function handleMouseEnter() {
        showDelete = true;
    }

    function handleMouseLeave() {
        showDelete = false;
    }

    function handleDeleteClick(event: MouseEvent) {
        event.stopPropagation();
        showDeleteConfirmation = true;
    }

    async function handleConfirmDelete() {
        try {
            const tripRef = ref(db, `trips/${tid}`);
            await remove(tripRef);
            showDeleteConfirmation = false;
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    }

    async function handleConfirmDeleteMemory() {
        try {
            const memoryRef = ref(db, `trips/${tid}/memories/${memoryId}`);
            await remove(memoryRef);
            showDeleteConfirmation = false;
        } catch (error) {
            console.error('Error deleting memory:', error);
        }
    }

    function handleCancelDelete() {
        showDeleteConfirmation = false;
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div 
    class:trip-card={variant === 'trip'}
    class:memory-card={variant === 'memory'}
    role="button" 
    tabindex="0" 
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onclick={handleClick}
>
    <div class="image" style="background-image: url({image || ''})">
        <!-- Image placeholder if no image provided -->
        {#if !image}
            <div class="placeholder">
                <i class="fa-solid fa-image" style="color: var(--gray-400)"></i>
            </div>
        {/if}
        {#if showDelete}
            <button 
                class="delete-btn"
                onclick={handleDeleteClick}
                transition:fade={{ duration: 100 }}
                aria-label="Delete trip"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        {/if}
    </div>
    <div class="info">
        <h3 class:dark={variant === 'memory'}>{destination}</h3>
        <p class="date" class:dark={variant === 'memory'}>{startDate} - {endDate}</p>
    </div>
</div>

{#if showDeleteConfirmation}
    <DeleteConfirmationPopup
        showPopup={showDeleteConfirmation}
        destination={variant === 'trip' ? destination : destination}
        mode={variant === 'trip' ? 'Trip to' : 'Memory in'}
        onConfirm={variant === 'trip' ? handleConfirmDelete : handleConfirmDeleteMemory}
        onCancel={handleCancelDelete}
        darkMode={variant === 'memory'}
    />
{/if}

<style>
    .trip-card {
        background: var(--white);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        position: relative;
    }
    .trip-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .memory-card {
        background: var(--black);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(200, 200, 200, 0.2);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        position: relative;
    }
    .memory-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(200, 200, 200, 0.2);
    }
    .image {
        height: 160px;
        background-size: cover;
        background-position: center;
        background-color: var(--gray-100);
        position: relative;
    }
    .placeholder {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
    }
    .info {
        padding: 1rem;
    }
    .info h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--gray-900);
    }
    .info h3.dark {
        color: var(--white);
    }
    .date {
        margin: 0.25rem 0 0 0;
        font-size: 0.8rem;
        color: var(--gray-400);
    }
    .date.dark {
        color: var(--gray-200);
    }
    .delete-btn {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        background: rgba(240, 240, 240, 0.8);
        border: none;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--gray-600);
        transition: all 0.2s ease;
    }
    .delete-btn:hover {
        background-color: var(--memory-50);
        color: var(--memory-600);
    }
</style> 