<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { Place } from '$lib/constants/Interfaces';

    const defaultPlace: Place = {
        name: 'PlaceName',
        image: '/placeholder.jpeg',
        time: 'Add Time'
    };

    export let place: Partial<Place> = {};
    export let variant: 'simple' | 'detailed' = 'detailed';
    export let onDelete: () => void = () => {};

    let showDelete = false;

    function toggleDelete(event: MouseEvent) {
        event.stopPropagation();
        showDelete = true;
    }

    function handleDelete(event: MouseEvent) {
        event.stopPropagation();
        showDelete = false;
        onDelete();
    }

    function handleMouseLeave() {
        showDelete = false;
    }

    // Close delete option when clicking outside
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.actions')) {
            showDelete = false;
        }
    }

    // merge user-provided values with defaults
    $: fullPlace = { ...defaultPlace, ...place }; 
</script>

<svelte:window onclick={handleClickOutside}/>

{#if variant === 'simple'}
    <div class="place-card simple">
        <img class="place-image simple" src={fullPlace.image} alt=""/>
        <div class="place-name simple">{fullPlace.name}</div>
        <div class="actions" role="group" onmouseleave={handleMouseLeave}>
            {#if showDelete}
                <button 
                    class="delete-btn"
                    onclick={handleDelete}
                    aria-label="Delete place"
                    transition:fade={{ duration: 100 }}
                >
                    <span class="delete-text">Delete place</span>
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            {/if}
            <button class="more-btn" onclick={toggleDelete} aria-label="More options">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
        </div>
    </div>
{:else}
    <div class="place-card detailed">
        <img class="place-image detailed" src={fullPlace.image} alt=""/>
        <div class="place-details" role="group">
            <div class="actions-detailed">
                <button class="close-btn" onclick={onDelete} aria-label="Delete place">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="place-name">{fullPlace.name}</div>
            {#if fullPlace.desc}
                <p class="place-desc">{fullPlace.desc}</p>
            {/if}
            <!-- <div class="plan-time">
                <button class="edit-time">{fullPlace.time}</button>
            </div> -->
        </div>
    </div>
{/if}

<style>
    .place-card {
        background-color: white;
        overflow: hidden;
    }

    .place-image {
        object-fit: cover;
        border: solid 1px var(--gray-100);
    }

    /* Simple variant styles */
    .place-card.simple {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0.5rem 0.5rem 0;
        border-radius: 0.5rem;
    }

    .place-image.simple {
        width: 2.8rem;
        height: 2.8rem;
        border-radius: 0.5rem;
    }

    .place-name.simple {
        font-size: 0.9rem;
        font-weight: 500;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .more-btn {
        background: none;
        border: none;
        padding: 0.5rem 0.85rem;
        color: var(--gray-400);
        cursor: pointer;
        border-radius: 2rem;
        transition: all 0.2s ease;
    }

    .more-btn:hover {
        background-color: var(--gray-50);
        color: var(--gray-600);
    }

    .close-btn {
        background: rgba(240, 240, 240, 0.8);
        border: none;
        padding: 0.5rem 0.75rem;
        font-size: 1rem;
        color: var(--gray-400);
        cursor: pointer;
        border-radius: 2rem;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        background-color: var(--gray-100);
        color: var(--gray-600);
    }

    .delete-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--gray-50);
        border: none;
        padding: 0.5rem 0.85rem;
        color: var(--gray-600);
        cursor: pointer;
        border-radius: 2rem;
        transition: all 0.2s ease;
    }

    .delete-btn:hover {
        background-color: var(--memory-50);
        color: var(--memory-600);
    }

    .delete-text {
        white-space: nowrap;
    }

    .place-card.detailed {
        display: flex;
        padding: 0.5rem 0;
        gap: 3%;
        width: 100%;
        align-items: stretch;
    }

    .place-image.detailed {
        width: 30%;
        aspect-ratio: 16 / 9;
        height: auto;
        border-radius: 20px;
    }

    .place-details {
        position: relative;
        display: flex;
        flex-direction: column;
        background-color: var(--gray-50);
        flex: 1;
        border-radius: 20px;
        box-sizing: border-box;
        padding: 1.5rem;
        gap: 0.75rem;
        font-family: 'Inter', sans-serif;
        overflow-wrap: break-word;
        word-break: break-word;
        white-space: pre-wrap;
    }

    .actions-detailed {
        position: absolute;
        top: 1rem;
        right: 1rem;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .place-details:hover .actions-detailed {
        opacity: 1;
    }

    .place-name {
        font-weight: 500;
        font-size: 1rem;
    }

    .place-desc {
        margin: 0;
        font-weight: 400;
        color: var(--gray-400);
        font-size: 0.9rem;
    }

    /* .edit-time {
        background-color: var(--gray-200);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 12px;
        color: var(--gray-800);
        font-size: 0.7rem;
        margin-top: 0.5rem;
        cursor: pointer;
    }

    .edit-time:hover {
        opacity: 0.75;
    } */
</style>