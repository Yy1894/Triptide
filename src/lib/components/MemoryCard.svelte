<script lang="ts">
    import { goto } from '$app/navigation';

    export let destination = '';
    export let startDate = '';
    export let endDate = '';
    export let image = '';
    export let tid = '';
    export let memoryId = '';

    function handleClick() {
        goto(`/viewimage/${tid}/${memoryId}`);
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div 
    class="memory-card" 
    role="button" 
    tabindex="0" 
    onclick={handleClick}
>
    <div class="image" style="background-image: url({image || ''})">
        {#if !image}
            <div class="placeholder">
                <i class="fa-solid fa-image" style="color: var(--gray-400)"></i>
            </div>
        {/if}
    </div>
    <div class="info">
        <h3>{destination}</h3>
        <p class="date">{startDate} - {endDate}</p>
    </div>
</div>

<style>
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
        color: var(--white);
    }
    .date {
        margin: 0.25rem 0 0 0;
        font-size: 0.8rem;
        color: var(--gray-200);
    }
</style> 