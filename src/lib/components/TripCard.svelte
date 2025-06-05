<script>
    export let destination = '';
    export let startDate = '';
    export let endDate = '';
    export let image = '';
</script>

<div class="trip-card">
    <div class="image" style="background-image: url({image || ''})">
        <!-- Image placeholder if no image provided -->
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
    .trip-card {
        background: var(--white);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
    }

    .trip-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .image {
        height: 160px;
        background-size: cover;
        background-position: center;
        background-color: var(--gray-100);
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
</style> 