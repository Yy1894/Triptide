<script lang="ts">
    import { Colors } from '$lib/constants/Colors';
    import { goto } from '$app/navigation';

    let title = "Travel App";
    export let activeTab = "Home";

    function handleNavigation(tab: "Home" | "Planner" | "Memory") {
        activeTab = tab;
        if (tab === 'Home') {
            goto('/');
        } else if (tab === 'Planner') {
            goto('/trips');
        } else {
            console.log("will be implemented later");
        }
    }
</script>

<nav>
    <div class="logo">{title}</div>
    <div class="right-nav">
        <div class="menu">
            <button 
                class:active={activeTab === "Home"} 
                onclick={() => handleNavigation("Home")}>
                Home
            </button>
            <button 
                class:active={activeTab === "Planner"} 
                onclick={() => handleNavigation("Planner")}>
                Planner
            </button>
            <button 
                class:active={activeTab === "Memory"} 
                onclick={() => handleNavigation("Memory")}>
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

<style>
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
    }
  
    .menu button {
        background: none;
        border: none;
        font-size: 1rem;
        cursor: pointer;
        padding: 0.5rem 1rem;
        color: var(--gray-400);
        transition: all 0.2s ease;
        min-width: 100px;
        text-align: center;
    }
  
    .menu button.active {
        color: var(--black);
        font-weight: 600;
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
</style> 