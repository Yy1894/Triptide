<script>
    // import WorldMap from '$lib/components/WorldMap.svelte';
    import { goto } from '$app/navigation';
    
    let title = "Travel App";
    let activeTab = "Planner";
  
    function handleNewTrip() {
      goto('/itinerary');
    }
  </script>
  
  <main>
    <nav>
      <div class="logo">{title}</div>
      <div class="right-nav">
        <div class="menu">
          <button 
            class:active={activeTab === "Planner"} 
            on:click={() => activeTab = "Planner"}>
            Planner
          </button>
          <button 
            class:active={activeTab === "Memory"} 
            on:click={() => activeTab = "Memory"}>
            Memory
          </button>
        </div>
        <div class="profile">
          <button class="profile-btn">👤</button>
        </div>
      </div>
    </nav>
  
    <div class="map-container">
      <!-- <WorldMap /> -->
    </div>
  
    <div class="bottom-bar">
      <div class="past-trips">
        <h2>Past Trips</h2>
        <p class="hint">Click to view all past trips</p>
      </div>
      <button class="new-trip-btn" on:click={handleNewTrip}>+ Plan a new trip</button>
    </div>
  </main>
  
  <style>
    main {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #F0F0F0;
      font-family: 'Inter';
    }
  
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      border-bottom: 1px solid #eee;
      background-color: white;
    }
  
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .right-nav {
      display: flex;
      align-items: center;
      gap: 2rem;
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
      color: #999;
      transition: all 0.2s ease;
    }
  
    .menu button.active {
      color: #000;
      font-weight: bold;
    }
  
    .menu button:hover {
      color: #000;
    }
  
    .profile-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    }
  
    .profile-btn:hover {
      background-color: #f5f5f5;
    }
  
    .map-container {
      flex: 1;
      position: relative;
      background-color: #F0F0F0;
      /* overflow: hidden; */
    }
  
    .bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      margin-top: 10px;
      background-color: white;
      border-radius: 20px 20px 0 0;
      box-shadow: 0 -2px 10px  rgba(0, 0, 0, 0.1);
    }
  
    .past-trips {
      cursor: pointer;
      transition: opacity 0.2s ease;
    }
  
    .past-trips:hover {
      opacity: 0.8;
    }
  
    .past-trips h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }
  
    .hint {
      margin: 0.2rem 0 0 0;
      font-size: 0.8rem;
      color: #666;
    }
  
    .new-trip-btn {
      background-color: #38C1D0;
      color: white;
      border: none;
      padding: 0.8rem 1.5rem;
      border-radius: 2rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8rem;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
  
    .new-trip-btn:hover {
      opacity: 0.9;
      transform: scale(1.02);
    }
  </style>
  