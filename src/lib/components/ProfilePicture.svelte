<script lang="ts">
  export let friends = 1;
  export let images: string[] = [];
</script>

<div class="profile-pictures">
  {#each Array(friends) as _, i}
      <div 
          class="profile-picture"
          style="z-index: {friends - i}; margin-left: {i === 0 ? '0' : '-20px'}"
      >
          {#if images[i]}
              <img class="profile-img" src={images[i]} alt="Profile" />
          {:else}
              <div class="default-avatar">
                  <i class="fa-solid fa-user"></i>
              </div>
          {/if}
      </div>
  {/each}
</div>

<style>
  .profile-pictures {
      display: flex;
      align-items: center;
  }

  .profile-picture {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 2px solid white;
      background-color: var(--gray-100);
      overflow: hidden;
      flex-shrink: 0;
  }

  .profile-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
  }

  .default-avatar {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gray-400);
      font-size: 1.2rem;
  }
</style>