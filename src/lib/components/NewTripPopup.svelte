<script>
    import { Colors } from '$lib/constants/Colors';
    import { goto } from '$app/navigation';
    import Button from './Button.svelte';

    export let showPopup = false;
    export let fromPage = 'home';

    let destination = "";
    let startDate = "";
    let endDate = "";
    let friends = "";

    function handleCancel() {
        showPopup = false;
        destination = "";
        startDate = "";
        endDate = "";
        friends = "";
    }

    function handleStart() {
        console.log(destination, startDate, endDate, friends);
        goto(`/itinerary?from=${fromPage}`);
        handleCancel();
    }
</script>

{#if showPopup}
<div class="overlay"> 
    <div class="popup">
        <h1>Start a New Plan</h1>
        
        <div class="input-form">
            <label for="destination">Destination</label>
            <input 
                type="text" 
                id="destination" 
                bind:value={destination} 
                placeholder="Where do you want to go?"
            />
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

        <div class="input-form">
            <label for="trip-friends">
                <span class="invite-label">
                    + Invite Friends
                    <i class="fa-solid fa-user-group" style="color: {Colors.gray.dark800}"></i>
                </span>
            </label>
            <input 
                type="text" 
                id="trip-friends"
                bind:value={friends} 
                placeholder="Enter email addresses"
            />
        </div>

        <div class="button-group">
            <Button text="Cancel" type="gray" onClick={handleCancel} />
            <Button text="Start" type="blue" onClick={handleStart} />
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
        width: 80%;
        max-width: 560px;
        box-shadow: 0 0px 20px rgba(0, 0, 0, 0.1);
    }

    .popup h1 {
        margin: 0 0 2rem 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .input-form {
        margin-bottom: 1.5rem;
    }

    .input-form label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--gray-800);
    }

    .input-form input {
        width: 95.3%;
        padding: 0.75rem;
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        font-size: 1rem;
    }

    input:focus {
        outline-color: var(--planner-600);
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

    .date-group .input-form input {
        width: 90%;
    }

    .invite-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }
</style> 