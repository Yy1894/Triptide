<script lang="ts">
    import Button from './Button.svelte';

    export let showPopup = false;
    export let destination = '';
    export let onSelect: (type: 'new' | 'old' | 'mix') => void;
    export let onCancel: () => void;
</script>

{#if showPopup}
    <div class="popup-overlay">
        <div class="popup">
            <h2>Get Recommendations</h2>
            <p>You've been to {destination} before. What type of recommendations would you like?</p>
            
            <div class="buttons">
                <Button text="New Places" type="single" onClick={() => onSelect('new')} />
                <Button text="Places I've Been to" type="single" onClick={() => onSelect('old')} />
                <Button text="Mix of Both" type="single" onClick={() => onSelect('mix')} />
                <Button text="Cancel" type="full-gray" onClick={onCancel} />
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