<script lang="ts">
    import '../../app.css';
    import Button from '$lib/components/Button.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { Loader } from '@googlemaps/js-api-loader';
    import { ref, push, onValue } from 'firebase/database';
    import { db } from '../../firebase';
    import { UploadClient } from '@uploadcare/upload-client';
  
    export let showPopup = false;
    export let onCancel = () => {};

    let startDate = '';
    let endDate = '';
    let isGoogleLoaded = false;
    let dragActive = false;
    let customLocation = '';
    let customLocationInput: HTMLInputElement;
    let images: File[] = [];
    let imageUrls: string[] = [];
    let showLocationError = false;
    let showImageError = false;
    let hasAttemptedSubmit = false;
    let isFormValid = true;
    let selectedTripId = ''; //for dropdown
    let selectedLocation = '';

    let tripOptions: { value: string; label: string }[] = [];

    // Initialize Uploadcare client
    const uploadcare = new UploadClient({ publicKey: import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY });

    onMount(() => {
        // reference to the trips node
        const tripsRef = ref(db, 'trips');

        // listen for changes in the trips data
        onValue(tripsRef, (snapshot) => {
            const options: { value: string; label: string }[] = [];
            snapshot.forEach(child => {
                const val = child.val();
                const tripId = child.key;
                const { name } = val.destination;
                const start = new Date(val.startDate);
                const end = new Date(val.endDate);
                const format = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${String(d.getFullYear())}`;
                options.push({
                    value: tripId,
                    label: `${name} (${format(start)} - ${format(end)})`
                });
            });
            tripOptions = options;
        });
    });
  

    $: if (hasAttemptedSubmit) {
        isFormValid = (
            (selectedLocation !== '' && (!isCustomLocation() || customLocation.trim() !== '')) &&
            images.length > 0
        );
    }

    $: if (selectedTripId && selectedTripId !== 'custom') {
        const trip = tripOptions.find(t => t.value === selectedTripId);
        if (trip) {
            selectedLocation = trip.label.split(' (')[0]; // label에서 name 추출
            const tripRef = ref(db, `trips/${selectedTripId}`);
            onValue(tripRef, (snapshot) => {
                const val = snapshot.val();
                startDate = new Date(val.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                endDate = new Date(val.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                console.log(`startDate: ${startDate}, endDate: ${endDate}`);
            });
        }
    }

    function isCustomLocation() {
        return selectedTripId === 'custom';
    }
  
    const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  
    onMount(async () => {
      if (!GOOGLE_PLACES_API_KEY) return;
  
      const loader = new Loader({
        apiKey: GOOGLE_PLACES_API_KEY,
        version: 'weekly',
        libraries: ['places'],
        language: 'en'
      });
  
      try {
        await loader.importLibrary('places');
        isGoogleLoaded = true;
      } catch (error) {
        console.error('Error loading Places Autocomplete:', error);
      }
    });
  
    $: if (isGoogleLoaded && isCustomLocation() && customLocationInput) {
      const autocompleteCustom = new google.maps.places.Autocomplete(customLocationInput, {
        types: ['(regions)']
      });
  
      autocompleteCustom.setFields(['name']);
      autocompleteCustom.addListener('place_changed', () => {
        const place = autocompleteCustom.getPlace();
        if (place.name) {
          customLocation = place.name;
          showLocationError = false;
        }
      });
    }
  
    async function uploadImage(file: File): Promise<string> {
        try {
            const result = await uploadcare.uploadFile(file);
            return `https://ucarecdn.com/${result.uuid}/`;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    async function handleInputChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const newFiles = Array.from(input.files);
            images = [...images, ...newFiles];
            
            isUploading = true;
            try {
                const newUrls = await Promise.all(newFiles.map(uploadImage));
                imageUrls = [...imageUrls, ...newUrls];
            } catch (error) {
                // Handle error (show error message to user)
                console.error('Upload failed:', error);
            } finally {
                isUploading = false;
            }
        }
    }

    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        dragActive = false;

        const droppedFiles = Array.from(event.dataTransfer?.files || [])
            .filter(file => file.type.startsWith('image/'));

        if (droppedFiles.length > 0) {
            images = [...images, ...droppedFiles];
            
            isUploading = true;
            try {
                const newUrls = await Promise.all(droppedFiles.map(uploadImage));
                imageUrls = [...imageUrls, ...newUrls];
            } catch (error) {
                // Handle error (show error message to user)
                console.error('Upload failed:', error);
            } finally {
                isUploading = false;
            }
        }
    }

    function removeImage(img: File) {
        const index = images.indexOf(img);
        if (index > -1) {
            images = images.filter((_, i) => i !== index);
            imageUrls = imageUrls.filter((_, i) => i !== index);
        }
    }

    function handleCancelClick() {
        onCancel();
        reset();
    }
  
    function handleDragOver(event: DragEvent) {
      event.preventDefault();
      dragActive = true;
    }
  
    function handleDragLeave(event: DragEvent) {
      event.preventDefault();
      dragActive = false;
    }
  
    async function handleAddMemory() {
        hasAttemptedSubmit = true;

        showLocationError = selectedLocation === '' || (isCustomLocation() && customLocation.trim() === '');
        showImageError = images.length === 0;

        if (showLocationError || showImageError) return;

        const finalLocation = isCustomLocation() ? customLocation : selectedLocation;

        console.log(`startDate = ${startDate}, endDate = ${endDate}, location = ${location}`)
        const newMemory = {
            location: finalLocation,
            startDate,
            endDate,
            images: imageUrls,
            createdAt: new Date().toISOString()
        };
        try {
            console.log(`tid = ${selectedTripId}`);
            const memoryRef = ref(db, `trips/${selectedTripId}/memories`);
            const addedRef = await push(memoryRef, newMemory);

            reset();
            goto(`/viewimage/${selectedTripId}/${addedRef.key}`);
        } catch (error) {
            console.error('Error saving memory:', error);
        }
    }
  
    function reset() {
        showPopup = false;
        selectedLocation = '';
        customLocation = '';
        images = [];
        imageUrls = [];
        startDate = '';
        endDate = '';
        showLocationError = false;
        showImageError = false;
    }
  
    let isUploading = false;

    const isDark = document.documentElement.classList.contains('dark');
</script>
  
{#if showPopup}
    <div class="overlay">
        <div class="popup {showLocationError || showImageError ? 'error' : ''}">
            <h1>Add new memory</h1>

            <div class="input-form">
                <label for="location">Load from past trips</label>
                <select bind:value={selectedTripId}>
                    <option value="" disabled>Select location</option>
                    {#each tripOptions as opt}
                        <option value={opt.value}>{opt.label}</option>
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
                        bind:this={customLocationInput}
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
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label>Upload images</label>
                <div class="drop-area {dragActive ? 'active' : ''} {isUploading ? 'uploading' : ''}"
                    role="button"
                    tabindex="0"
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
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <div class="drop-label" role="button" tabindex="0" on:click={() => document.getElementById('fileInput')?.click()}>
                        {#if images.length === 0}
                            <span>Drop image here</span>
                        {:else}
                            <div class="preview-list">
                                {#each images as img, i}
                                    <div class="preview-item">
                                        <button class="delete-button" on:click={() => removeImage(img)}>×</button>
                                        <img src={imageUrls[i] || URL.createObjectURL(img)} alt={img.name} />
                                        <p>{img.name}</p>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    {#if isUploading}
                        <div class="upload-overlay">
                            <div class="spinner"></div>
                            <p>Uploading...</p>
                        </div>
                    {/if}
                </div>
                {#if showImageError}
                    <p class="error-message">Please upload at least one image.</p>
                {/if}
            </div>

            <div class="button-group">
                <Button text="Cancel" type="gray" onClick={handleCancelClick} />
                <Button text="Add a new memory" type="orange" 
                    onClick={handleAddMemory} 
                    disabled={hasAttemptedSubmit && !isFormValid}/>
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

    .drop-area.uploading {
        position: relative;
        pointer-events: none;
        opacity: 0.8;
    }

    .upload-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    .spinner {
        width: 30px;
        height: 30px;
        border: 3px solid var(--gray-200);
        border-top-color: var(--planner-400);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>