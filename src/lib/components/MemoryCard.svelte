<script>
  export let destination = '';
  export let startDate = '';
  export let endDate = '';
  export let image = '';
</script>

<div class="memory-card">
  <div class="image" style="background-image: url({image})">
      <!-- Image placeholder if no image provided -->
      {#if !image}
          <div class="placeholder">
              <i class="fa-solid fa-image" style="color: var(--gray-800)"></i>
          </div>
      {/if}
  </div>
  <div class="info">
      <h3>{destination}</h3>
      <p class="date">{startDate} - {endDate}</p>
  </div>
</div>

<style>
  .memory-card {
      background: var(--black);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      color: var(--white);
  }

  .memory-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
  }

  .image {
      height: 160px;
      background-size: cover;
      background-position: center;
      background-color: var(--gray-900);
  }

  .placeholder {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
  }

  .info {
      padding: 1rem;
  }

  .info h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
  }

  .date {
      margin: 0.25rem 0 0 0;
      font-size: 0.8rem;
      color: var(--gray-400);
  }
</style> 