<script>
    import Button from "./Button.svelte";

    export let title = 'Past Trips';
    export let desc = 'Click to view all past trips';
    export let onClick = () => {};

    // change if there is a button
    export let buttonText = '+ Plan a new trip';
    export let onButtonClick = undefined;
</script>

<div class="bottom-bar">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="text" onclick={onClick}>
        <h2>{title}</h2>
        <p class="hint">{desc}</p>
    </div>

    {#if typeof onButtonClick === 'function'}
        <Button text={buttonText} type="single" onClick={onButtonClick} />
    {/if}
</div>

<style>
    .bottom-bar {
      display: flex;
      bottom: 0;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background-color: var(--white);
      border-radius: 20px 20px 0 0;
      box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1);
    }
  
    .text {
      cursor: pointer;
      transition: opacity 0.2s ease;
    }
  
    .text:hover {
      opacity: 0.8;
    }
  
    .text h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }
  
    .hint {
      margin: 0.2rem 0 0 0;
      font-size: 0.8rem;
      color: var(--gray-400);
    }
  </style>