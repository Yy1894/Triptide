<script>
    import { fade } from 'svelte/transition';
    export let show = false;
    export let message = '';
</script>

{#if show}
    <div class="overlay" transition:fade={{ duration: 200 }}>
        <div class="content" transition:fade={{ duration: 150, delay: 50 }}>
            <div class="spinner"></div>
            <p>{message}</p>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    p {
        color: white;
        font-size: 1.2rem;
        margin: 0;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--white);
        border-top: 3px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style> 