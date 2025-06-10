<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        /**
         * 
         * @param e {any}
         */
        const handleClickOutside = (e) => {
            if (!e.target.closest('.profile')) {
                showDropdown = false;
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    });

    let title = "Triptide";
    export let activeTab = "Planner";
    export let darkMode = false;

    let showDropdown = false;

    /**
     * 
     * @param tab {string}
     */
    function handleNavigation(tab) {
        activeTab = tab;
       if (tab === 'Planner') {
            goto('/');
        } else if (tab === 'Memory') {
            goto('/memories');
        } else if (tab === 'MyTrip') {
            goto('/trips');
        }  else if (tab === 'MyMemory') {
            goto('/mymemory');
        } else {
            console.log("will be implemented later");
        }
    }

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<nav class:dark-mode={darkMode}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="logo" onclick={() => handleNavigation("Planner")}>
        <img src="/logo.png" alt="Logo" class="logo-img" />
        {title}
    </div>
    <div class="right-nav">
        <div class="menu">
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
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="profile"
            onmouseenter={() => showDropdown = true}
            onmouseleave={() => showDropdown = false}>
            <button class="profile-btn" aria-label="Open profile">
                <i class="fa-regular fa-user fa-xl"></i>
            </button>
            {#if showDropdown}
                <div class="dropdown">
                    <button onclick={() => handleNavigation("MyTrip")}>My Trips</button>
                    <button onclick={() => handleNavigation("MyMemory")}>My Memories</button>
                    <button>Log out</button>
                </div>
            {/if}
        </div>
    </div>
</nav>

<style>
    nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        border-bottom: 1px solid var(--gray-200);
        background-color: var(--white);
    }

    .logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: bold;
        font-size: 1.5rem;
    }

    .logo:hover {
        cursor: pointer;
    }

    .logo-img {
        width: autopx;
        height: 32px;
        object-fit: contain;
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

    .dropdown {
        position: absolute;
        top: 3.5rem;
        right: 2rem;
        background: var(--white);
        border: 1px solid var(--gray-200);
        border-radius: 0.5rem;
        padding: 0.5rem 0;
        z-index: 999;
        display: flex;
        flex-direction: column;
        min-width: 150px;
    }

    .dropdown button {
        background: none;
        border: none;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
        text-align: left;
        color: var(--black);
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .dropdown button:hover {
        background-color: var(--gray-100);
    }

    nav.dark-mode .dropdown {
        background: var(--gray-900);
        border: 1px solid var(--gray-700);
    }

    nav.dark-mode .dropdown button {
        color: var(--white);
    }

    nav.dark-mode .dropdown button:hover {
        background-color: var(--gray-800);
    }

    nav.dark-mode {
        background-color: var(--black);
        border-bottom: 1px solid var(--gray-200);
    }

    nav.dark-mode .logo {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--white);
    }

    nav.dark-mode .menu button {
        color: var(--gray-400);
    }

    nav.dark-mode .menu button:hover {
        color: var(--white);
    }

    nav.dark-mode .menu button.active {
        color: var(--white);
        font-weight: 600;
    }

    nav.dark-mode .profile-btn {
        background-color: var(--black);
    }

    nav.dark-mode .profile-btn:hover {
        background-color: var(--gray-700);
    }

    nav .profile-btn i {
        color: var(--black);
    }

    nav.dark-mode .profile-btn i {
        color: var(--white);
    }
</style>