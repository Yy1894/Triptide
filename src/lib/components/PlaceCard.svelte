<script lang="ts">
    type Place = {
        name: string;
        desc?: string;
        image: string;
        time: string;
    };

    const defaultPlace: Omit<Place, 'desc'> = {
        name: 'PlaceName',
        image: 'placeholder.jpeg',
        time: 'Add Time'
    };

    export let place: Partial<Place> = {};

    // merge user-provided values with defaults
    $: fullPlace = { ...defaultPlace, ...place }; 
</script>

<div class="place-card">
    <img class="place-image" src={fullPlace.image} alt=""/>
    <div class="place-details">
        <div class="place-name">{fullPlace.name}</div>
        {#if fullPlace.desc}
            <p class="place-desc">{fullPlace.desc}</p>
        {/if}
        <div class="plan-time">
            <button class="edit-time">{fullPlace.time}</button>
        </div>
    </div>
</div>

<style>
    .place-card {
        display: flex;
        padding: 0.5rem 0;
        gap: 3%;
        width: 100%;
        background-color: white;
        overflow: hidden;
        align-items: stretch;
    }

    .place-image {
        width: 30%;
        height: 100%;
        border-radius: 20px;
        object-fit: cover;
        border: solid 1px var(--gray-100)
    }

    .place-details {
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

    button {
        background-color: var(--gray-200);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 12px;
        color: var(--gray-800);
        font-size: 0.7rem;
        margin-top: 0.5rem;
    }

    button:hover {
        opacity: 0.75;
        cursor: pointer;
    }
</style>