<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { feature } from 'topojson-client';
  import { Colors } from '../constants/Colors';
  import '../../app.css';

  let mapContainer: HTMLDivElement;

  onMount(() => {
    const width = mapContainer.clientWidth;
    const height = mapContainer.clientHeight;

    // Create SVG
    const svg = d3.select(mapContainer)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)  // make a coordinate from (0, 0) to (width, height)
      .attr('preserveAspectRatio', 'xMidYMid meet') as d3.Selection<SVGSVGElement, unknown, null, undefined>; // center the map

    // Add a group for all map elements that will be transformed
    const g = svg.append('g');

    // Create projection
    const projection = d3.geoMercator()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 1.6]);  // position the map, horizontally centered but is slighty upward

    const path = d3.geoPath().projection(projection);

    // Tokyo coordinates [longitude, latitude]
    const tokyo: [number, number] = [139.6917, 35.6895];

    const initMap = async () => {
      try {
        // Load world map data
        const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
        const world = await response.json();
        
        // Convert TopoJSON to GeoJSON
        const countries = feature(world, world.objects.countries) as any;

        // Draw the map
        g.append('g')
          .selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('d', path as any)
          .attr('class', 'country')
          .attr('fill', Colors.gray.light200)
          .attr('stroke', Colors.gray.light50)
          .attr('stroke-width', '0.5');

        // Add Tokyo marker
        g.append('circle')
          .attr('cx', projection(tokyo)![0])
          .attr('cy', projection(tokyo)![1])
          .attr('r', 5)
          .attr('class', 'marker')
          .attr('fill', Colors.planner.med400);

        // Add zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 8])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          });

        svg.call(zoom)
           .call(zoom.transform, d3.zoomIdentity);
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    initMap();

    return () => {
      d3.select(mapContainer).selectAll('*').remove();
    };
  });
</script>

<div bind:this={mapContainer} class="map-wrapper"></div>

<style>
  .map-wrapper {
    width: 100%;
    height: 100%;
    background-color: var(--gray-50);
    overflow: hidden;
    touch-action: none;
  }

  :global(.country) {
    transition: fill 0.2s ease;
  }

  :global(.country:hover) {
    fill: #a1cdd2;
  }

  :global(.marker) {
    transition: all 0.2s ease;
    pointer-events: all;
  }

  :global(.marker:hover) {
    r: 8;
    cursor: pointer;
  }

  :global(.dark .map-wrapper) {
    background-color: var(--black);
  }

  :global(.dark .country) {
      fill: #121212;
      stroke: var(--gray-700);
  }

  :global(.dark .country:hover) {
      fill: #5a1c05;
  }

  :global(.dark .marker) {
      fill: var(--memory-500);
  }
</style> 