<script>
  import '../app.css';
  import { goto } from '$app/navigation';
  import { Colors } from '$lib/constants/Colors';
  import WorldMap from '$lib/components/WorldMap.svelte';
  import Button from '$lib/components/Button.svelte';
  import BottomBar from '$lib/components/BottomBar.svelte';

  let title = "Travel App";
  let activeTab = "Planner";
  let showNewTripPopup = false;
  let destination = "";
  let startDate = "";
  let endDate = "";
  let friends = "";
  
  const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  function handleNewTrip() {
    showNewTripPopup = true;
  }

  function handleCancel() {
    showNewTripPopup = false;
    destination = "";
    startDate = "";
    endDate = "";
    friends = "";
  }

  function handleStart() {
    console.log(destination, startDate, endDate, friends);
    goto('/itinerary');
  }

  function handlePastTrip() {
    console.log("let's see the past trip");
  }
</script>
  
  <main>
    <nav>
      <div class="logo">{title}</div>
      <div class="right-nav">
        <div class="menu">
          <button 
            class:active={activeTab === "Planner"} 
            onclick={() => activeTab = "Planner"}>
            Planner
          </button>
          <button 
            class:active={activeTab === "Memory"} 
            onclick={() => activeTab = "Memory"}>
            Memory
          </button>
        </div>
        <div class="profile">
          <button class="profile-btn" aria-label="Open profile">
            <i class="fa-regular fa-user fa-xl" style="color: {Colors.black}"></i>
          </button>
        </div>
      </div>
    </nav>
  
    <div class="map-container">
      <WorldMap />
    </div>
  
    <BottomBar onClick={handlePastTrip} onButtonClick={handleNewTrip} />

    {#if showNewTripPopup}
      <!-- (optional) add onclick={handleCancel} -->
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

  </main>
  
  <style>
    main {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--gray-50);
      font-family: 'Inter', sans-serif;
    }
  
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      border-bottom: 1px solid var(--gray-100);
      background-color: var(--white);
    }
  
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .right-nav {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
  
    .menu {
      display: flex;
      gap: 0.5rem;
    }
  
    .menu button {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.5rem 1rem;
      color:var(--gray-400);
      transition: all 0.2s ease;
    }
  
    .menu button.active {
      color: var(--black);
      font-weight: bold;
    }
  
    .menu button:hover {
      color: var(--black);
    }
  
    .profile-btn {
      background: none;
      border: none;
      width: 2.5rem;
      height: 2.5rem;
      opacity: 0.3;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    }
  
    .profile-btn:hover {
      background-color: var(--gray-100);
      opacity: 1;
    }
  
    .map-container {
      flex: 1;
      position: relative;
      background-color: var(--gray-50);
      /* overflow: hidden; */
    }

    /* Popup Styling */
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
      /* color: var(--planner-600); */
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

    .date-group .input-form input{
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
  