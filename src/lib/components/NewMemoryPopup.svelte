<script lang="ts">
    import '../../app.css';
    import Button from './Button.svelte';
    import { onMount } from 'svelte';

    export let showPopup = false;
    export let locations = [];
    export let onAddMemory = () => {};
    export let onCancel = () => {};

    let selectedLocation = '';
    let customLocation = '';
    let images = [];
    let dragActive = false;

    let startDate = '';
    let endDate = '';

    function handleFiles(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                images = [...images, file];
            }
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        dragActive = false;
        handleFiles(event.dataTransfer.files);
    }

    function handleDragOver(event) {
        event.preventDefault();
        dragActive = true;
    }

    function handleDragLeave(event) {
        event.preventDefault();
        dragActive = false;
    }

    function handleInputChange(event) {
        if (event.target.files) {
            handleFiles(event.target.files);
        }
    }

    function handleCancelClick() {
        onCancel();
        reset();
    }

    function reset() {
        showPopup = false;
        selectedLocation = '';
        customLocation = '';
        images = [];
        startDate = '';
        endDate = '';
        showLocationError = false;
        showImageError = false;
    }

    function isCustomLocation() {
        return selectedLocation === 'custom';
    }

    function removeImage(imageToRemove: File) {
        images = images.filter(img => img !== imageToRemove);
    }

    let showLocationError = false;
    let showImageError = false;

    function handleAddMemory() {
        showLocationError = selectedLocation === '' || (selectedLocation === 'custom' && customLocation.trim() === '');
        showImageError = images.length === 0;

        if (showLocationError || showImageError) return;

        const finalLocation = selectedLocation === 'custom' ? customLocation : selectedLocation;
        onAddMemory({ location: finalLocation, images, startDate, endDate });
        reset();
    }
</script>

{#if showPopup}
    <div class="overlay">
        <div class="popup {showLocationError || showImageError ? 'error' : ''}">
            <h1>Add new memory</h1>

            <div class="input-form">
                <label for="location">Load from past trips</label>
                <select id="location" bind:value={selectedLocation}>
                    <option value="" disabled>Select location</option>
                    {#each locations as loc}
                        <option value={loc}>{loc}</option>
                    {/each}
                    <option value="custom" class="custom-option">+ Enter custom trip</option>
                </select>
            </div>

            {#if isCustomLocation()}
                <div class="input-form">
                    <label for="custom-location">Custom Location</label>
                    <input 
                        type="text" 
                        id="custom-location"
                        bind:value={customLocation}
                        placeholder="Type your location"
                    />
                    {#if showLocationError}
                        <p class="error-message">Please enter a location.</p>
                    {/if}
                </div>
                <div class="date-group">
                    <div class="input-form">
                        <label for="start-date">Start Date</label>
                        <input 
                            type="date" 
                            id="start-date" 
                            bind:value={startDate}
                        />
                    </div>

                    <div class="input-form">
                        <label for="end-date">End Date</label>
                        <input 
                            type="date" 
                            id="end-date" 
                            bind:value={endDate}
                        />
                    </div>
                </div>
            {:else if showLocationError}
                <p class="error-message">Please enter a location.</p>
            {/if}

            <div class="input-form">
                <label>Upload images</label>
                <div class="drop-area {dragActive ? 'active' : ''}"
                    on:drop={handleDrop}
                    on:dragover={handleDragOver}
                    on:dragleave={handleDragLeave}
                >
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        on:change={handleInputChange}
                        style="display: none;"
                        id="fileInput"
                    />
                    <div class="drop-label" on:click={() => document.getElementById('fileInput')?.click()}>
                        {#if images.length === 0}
                            <span>Drop image here</span>
                        {:else}
                            <div class="preview-list">
                                {#each images as img}
                                    <div class="preview-item">
                                        <button class="delete-button" on:click={() => removeImage(img)}>×</button>
                                        <img src={URL.createObjectURL(img)} alt={img.name} />
                                        <p>{img.name}</p>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
                {#if showImageError}
                    <p class="error-message">Please upload at least one image.</p>
                {/if}
            </div>

            <div class="button-group">
                <Button text="Cancel" type="gray" onClick={handleCancelClick} />
                <Button text="Add a new memory" type="orange" 
                    onClick={handleAddMemory} 
                    disabled={showLocationError || showImageError}/>
            </div>
        </div>
    </div>
{/if}


<style>
    *, *::before, *::after {
        box-sizing: border-box;
    }

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
        z-index: 1000;
    }

    .popup {
        background: var(--gray-900);
        padding: 2rem;
        border-radius: 20px;
        width: 80%;
        max-width: 560px;
        box-shadow: 0 0px 20px rgba(0, 0, 0, 0.1);
        font-family: 'Inter', sans-serif;
    }

    .popup.error {
        border: 2px solid var(--memory-500);
    }

    .error-message {
        color: var(--memory-500);
        font-size: 0.9rem;
        margin-top: 0.5rem;
        margin-bottom: 1rem;
    }

    .popup h1 {
        margin: 0 0 2rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--white);
    }

    .input-form {
        margin-bottom: 1.5rem;
    }

    .input-form label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--gray-200);
    }

    .input-form input {
        width: 100%;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 1rem;
        background: var(--gray-900);
        color: var(--white);
        border: 1px solid var(--gray-200);
        outline: none; 
    }

    .input-form select {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 0.75rem;
        border-radius: 8px;
        font-size: 1rem;
        background: var(--gray-900);
        color: var(--white);
        border: 1px solid var(--gray-200);
        outline: none;
        appearance: none;
    }

    input:focus,
    select:focus {
        border-color: var(--memory-500);
        outline: none;
    }

    .date-group {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .date-group .input-form {
        flex: 1;
        margin-bottom: 0;
    }

    .preview-list {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        max-height: 200px;
        overflow-y: auto;
        padding-right: 0.5rem;
    }

    .preview-item {
        position: relative;
        width: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .preview-item img {
        width: 100%;
        border-radius: 6px;
        object-fit: cover;
    }

    .preview-item p {
        font-size: 0.75rem;
        text-align: center;
        margin-top: 0.3rem;
        color: var(--gray-400);
    }

    .delete-button {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(38, 38, 38, 0.5);
        border: none;
        color: var(--white);
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 0.9rem;
        cursor: pointer;
        z-index: 2;
    }


    .drop-area {
        width: 100%;
        min-height: 120px;
        background: var(--gray-900);
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--white);
        transition: border-color 0.2s;
        cursor: pointer;
    }

    .drop-area.active {
        border-color: var(--memory-500);
        color: var(--memory-500);
    }

    .drop-label {
        padding: 2rem 1rem;
        text-align: center;
        width: 100%;
        cursor: pointer;
    }

    option.custom-option {
        color: var(--memory-500);
    }

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }
</style>