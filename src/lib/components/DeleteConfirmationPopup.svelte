<script lang="ts">
    export let showPopup = false;
    export let destination = '';
    export let onConfirm: () => void;
    export let onCancel: () => void;

    function handlePopupClick(event: MouseEvent) {
        event.stopPropagation();
    }
</script>

{#if showPopup}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="overlay" role="button" tabindex="0">
        <div class="popup" role="button" tabindex="0" onclick={handlePopupClick}>
            <h2>Delete Trip</h2>
            <p>Are you sure you want to delete Trip to {destination}?</p>
            <div class="button-group">
                <button class="cancel-btn" onclick={onCancel}>Cancel</button>
                <button class="delete-btn" onclick={onConfirm}>Yes, delete</button>
            </div>
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
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
    }

    .popup {
        background: var(--white);
        padding: 2rem;
        border-radius: 20px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 0px 20px rgba(0, 0, 0, 0.1);
    }

    .popup h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--memory-600);
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .popup p {
        margin: 1rem 0 2rem 0;
        color: var(--gray-600);
        text-align: center;
    }

    .button-group {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    button {
        padding: 0.75rem 1.5rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        background: var(--gray-100);
        border: none;
        color: var(--gray-600);
        width: 50%;
    }

    .cancel-btn:hover {
        opacity: 0.75;
    }

    .delete-btn:hover {
        background: var(--memory-400);
        color: white;
    }
</style> 