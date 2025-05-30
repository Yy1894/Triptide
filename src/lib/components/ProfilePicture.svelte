<script>
    export let image = '';
    export let marginLeft = '0px';
    export let zIndex = '0';
</script>

<div
  class="profile-picture"
  style="margin-left: {marginLeft}; z-index: {zIndex}"
>
  {#if image}
    <img class="profile-img" src={image} alt="" />
  {:else}
    <img class="profile-img" src='profile-pic.png' alt="" />
  {/if}
</div>

<style>
    .profile-picture {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        border: 2px solid white;
    }

    .profile-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }
</style>