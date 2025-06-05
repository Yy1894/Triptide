<script>
    import '../../app.css';
    export let text = 'Button';
    export let type = 'single';
    export let onClick = () => {};
    export let disabled = false;
</script>
  
<button class="{type}" on:click={onClick} {disabled}>
    {text}
</button>
  
<style>
    button {
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 50px;
        cursor: pointer;
        font-weight: 500;
        font-size: 1rem;
        transition: transform 0.2s ease, opacity 0.2s ease;
    }

    button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        transform: none;
    }

    button:disabled:hover {
        opacity: 0.5;
        transform: none;
    }

    .single {
        background-color: var(--planner-300);
        color: var(--white);
        font-weight: 600;
    }

    .single:hover {
        opacity: 0.75;
        transform: scale(1.02);
    }

    .blue {
        width: 50%;
        background-color: var(--planner-400);
        color: var(--white);
    }

    .blue:hover {
        opacity: 0.75;
    }

    .gray {
        width: 50%;
        background: var(--gray-50);
        color: var(--gray-400);
    }

    .gray:hover {
        background-color: var(--gray-100);
        color: var(--gray-600);
    }

    .memory {
        background-color: var(--memory-500);
        color: var(--white);
        font-weight: 600;
    }

    .memory:hover {
        background-color: var(--memory-400);
        color: var(--white);
        font-weight: 600;
    }

    .orange {
        width: 50%;
        background-color: var(--memory-500);
        color: var(--white);
    }

    .orange:hover {
        background-color: var(--memory-400);
    }
</style>  