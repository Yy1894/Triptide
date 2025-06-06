<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let location = '';
  let startDate = '';
  let endDate = '';

  $: {
    const q = $page.url.searchParams;
    location = q.get('location') ?? '';
    startDate = q.get('startDate') ?? '';
    endDate = q.get('endDate') ?? '';
  }

  let gradientColors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

  $: gradientStyle = `conic-gradient(${[...gradientColors, gradientColors[0]].join(', ')})`;
</script>

<div class="memory-view">
  <h2>{location}</h2>
  <p>{startDate} - {endDate}</p>

  <div class="gradient-wheel" style="background-image: {gradientStyle};"></div>
</div>

<style>
.memory-view {
  padding: 2rem;
  font-family: sans-serif;
  text-align: center;
}

.gradient-wheel {
  width: 300px;
  height: 300px;
  margin: 2rem auto;
  border-radius: 50%;
  background: var(--gradient);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}
</style>