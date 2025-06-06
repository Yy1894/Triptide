<script lang="ts">
    import Button from './Button.svelte';

    export let showPopup = false;
    export let onConfirm: () => void;
    export let onCancel: () => void;
</script>

{#if showPopup}
    <div class="popup-overlay">
        <div class="popup">
            <h2>Turn into Itinerary</h2>
            <p>Do you want to assign the places in Places To Visit into your Itinerary?</p>
            
            <div class="buttons">
                <Button text="Yes" type="single" onClick={onConfirm} />
                <Button text="No" type="full-gray" onClick={onCancel} />
            </div>
        </div>
    </div>
{/if}

<style>
    .popup-overlay {
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

    .popup {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--gray-900);
    }

    p {
        margin: 1rem 0 1.5rem;
        color: var(--gray-600);
        line-height: 1.5;
    }

    .buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
</style> 