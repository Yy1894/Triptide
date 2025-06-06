<script>
  import '../../app.css';
  import Button from '$lib/components/Button.svelte';
  import Nav from '$lib/components/Nav.svelte';
  import { currentMemory } from '$lib/stores/memory';
  import { get } from 'svelte/store';

  let memory = get(currentMemory);

  // 메인 이미지
  let mainImageUrl = memory?.images?.[0]
    ? typeof memory.images[0] === 'string'
      ? memory.images[0]
      : URL.createObjectURL(memory.images[0])
    : '';

  // 컬럼별 대표 색 (예시용)
  let gradientColors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
  $: gradientStyle = `conic-gradient(${[...gradientColors, gradientColors[0]].join(', ')})`;
</script>

<main>
  <Nav activeTab="Memory" />

  <div class="content">
    <div class="header">
      <h1>Memory View</h1>
    </div>

    {#if memory}
      <div class="memory-container">
        <h2>{memory.location}</h2>
        <p>{memory.startDate} - {memory.endDate}</p>

        <div class="visual-section">
          <!-- 🎨 gradient wheel -->
          <div
            class="gradient-wheel"
            style="background-image: {gradientStyle}; width: 300px; height: 300px"
          ></div>

          <!-- 📸 main image -->
          <img
            class="main-image"
            src={mainImageUrl}
            alt="Main Memory Image"
          />
        </div>
      </div>
    {:else}
      <p>Memory not loaded.</p>
    {/if}
  </div>
</main>

<style>
.content {
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.memory-container {
  text-align: center;
}

.visual-section {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.gradient-wheel {
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.main-image {
  width: 300px;
  height: auto;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
}
</style>
