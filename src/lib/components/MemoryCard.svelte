<script lang="ts">
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import DeleteConfirmationPopup from './DeleteConfirmationPopup.svelte';
    import { ref, remove } from 'firebase/database';
    import { db } from '../../firebase';
  
    export let tripId: string;
    export let memoryId: string;
    export let destination: string;
    export let startDate: string;
    export let endDate: string;
    export let image: string;
  
    let showDelete = false;
    let showDeleteConfirmation = false;
  
    function handleClick() {
      goto(`/viewimage/${tripId}/${memoryId}`);
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
            const memoryRef = ref(db, `trips/${tripId}/memories/${memoryId}`);
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
  
<div 
    class="memory-card" 
    role="button" 
    tabindex="0" 
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:click={handleClick}
>
    <div class="image" style={`background-image: url("${image || ''}")`}>
            {#if !image}
                <div class="placeholder">
                    <i class="fa-solid fa-image" style="color: var(--gray-400)"></i>
                </div>
            {/if}
            {#if showDelete}
                <button 
                    class="delete-btn"
                    on:click={handleDeleteClick}
                    transition:fade={{ duration: 100 }}
                    aria-label="Delete memory"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
            {/if}
        </div>
        <div class="info">
            <h3>{destination}</h3>
            <p class="date">{startDate} - {endDate}</p>
        </div>
    </div>
  
<DeleteConfirmationPopup
    showPopup={showDeleteConfirmation}
    {destination}
    darkMode={true}
    onConfirm={handleConfirmDelete}
    onCancel={handleCancelDelete}
/>

<style>
    .memory-card {
        background: var(--black);
        color: var(--white);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(255, 255, 255, 0.05);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        position: relative;
    }

    .memory-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
    }

    .image {
        height: 160px;
        background-size: cover;
        background-position: center;
        background-color: var(--gray-900);
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
    }

    .date {
        margin: 0.25rem 0 0 0;
        font-size: 0.8rem;
        color: var(--gray-400);
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