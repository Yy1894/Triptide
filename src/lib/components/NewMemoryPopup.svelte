<script lang="ts">
    import '../../app.css';
    import Button from '$lib/components/Button.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { Loader } from '@googlemaps/js-api-loader';
    import { ref, push, onValue } from 'firebase/database';
    import { db } from '../../firebase';
    import * as UC from '@uploadcare/file-uploader';
    import "@uploadcare/file-uploader/web/uc-file-uploader-regular.min.css"

    UC.defineComponents(UC);

  
    export let showPopup = false;
    export let onCancel = () => {};

    let startDate = '';
    let endDate = '';
    let isGoogleLoaded = false;
    let customLocation = '';
    let customLocationInput: HTMLInputElement;
    let showLocationError = false;
    let showImageError = false;
    let hasAttemptedSubmit = false;
    let isFormValid = true;
    let selectedTripId = ''; //for dropdown
    let selectedLocation = '';
    let uploaderCtxEl: HTMLElement;
    let uploaderCtx: any;

    let tripOptions: { value: string; label: string }[] = [];
    let uploadedImageURLs: string[] = [];


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

    $: if (uploaderCtx) {
        uploaderCtx.on('change', () => {
            const urls = uploaderCtx.files().map(file => file?.cdnUrl).filter(Boolean);
            uploadedImageURLs = urls;
            console.log('uploadedImageURLs:', uploadedImageURLs);

            if (uploadedImageURLs.length > 0) {
                showImageError = false;
                hasAttemptedSubmit = true;
            }
        });
    } 

    $: isFormValid = (
        (selectedLocation !== '' && (!isCustomLocation() || customLocation.trim() !== '')) &&
        uploadedImageURLs.length > 0
    );

    $: if (selectedTripId && selectedTripId !== 'custom') {
        const trip = tripOptions.find(t => t.value === selectedTripId);
        if (trip) {
            selectedLocation = trip.label.split(' (')[0]; 
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

    function reset() {
        showPopup = false;
        selectedLocation = '';
        customLocation = '';
        startDate = '';
        endDate = '';
        showLocationError = false;
        showImageError = false;
        uploadedImageURLs = [];
        hasAttemptedSubmit = false;
    }
  
    function handleCancelClick() {
        onCancel();
        reset();
    }
  
    async function handleAddMemory() {
        hasAttemptedSubmit = true;

        showLocationError = selectedLocation === '' || (isCustomLocation() && customLocation.trim() === '');
        showImageError = uploadedImageURLs.length === 0;

        if (showLocationError || showImageError) return;

        const finalLocation = isCustomLocation() ? customLocation : selectedLocation;

        console.log(`startDate = ${startDate}, endDate = ${endDate}, location = ${location}`)
        const newMemory = {
            location: finalLocation,
            startDate,
            endDate,
            images: uploadedImageURLs,
            createdAt: new Date().toISOString()
        };
        try {
            console.log(`tid = ${selectedTripId}`);
            const memoryRef = ref(db, `trips/${selectedTripId}/memories`);
            const newMemory = {
                location: finalLocation,
                startDate: startDate,
                endDate: endDate,
                images: uploadedImageURLs,
                createdAt: new Date().toISOString()
            };
            const addedRef = await push(memoryRef, newMemory);

            reset();
            goto(`/viewimage/${selectedTripId}/${addedRef.key}`);
        } catch (error) {
            console.error('Error saving memory:', error);
        }
    }

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

            <div class="input-form uploader-wrapper">
                <label>Upload images</label>
                <uc-config
                    ctx-name="my-uploader"
                    source-list="local, camera, gdrive"
                    pubkey="d4067f33e4ac8363f078"
                    multiple="true"
                    multiple-min= 1

                ></uc-config>
                
                <uc-file-uploader-minimal
                    ctx-name="my-uploader"
                    class="uc-dark uc-gray"
                ></uc-file-uploader-minimal>
                
                <uc-upload-ctx-provider
                    ctx-name="my-uploader"
                    bind:this={uploaderCtxEl}
                    bind:ctx={uploaderCtx}
                ></uc-upload-ctx-provider>

                {#if showImageError}
                    <p class="error-message">Please upload at least one image.</p>
                {/if}
            </div>

            <div class="button-group">
                <Button text="Cancel" type="gray" onClick={handleCancelClick} />
                <Button text="Add a new memory" type="orange" 
                    onClick={handleAddMemory} 
                    disabled={!isFormValid}/>
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

    option.custom-option {
        color: var(--memory-500);
    }

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }
</style>