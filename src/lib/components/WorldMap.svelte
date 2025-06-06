<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { feature } from 'topojson-client';
  import { Colors } from '../constants/Colors';
  import '../../app.css';
  import { ref, get } from 'firebase/database';
  import { db } from '../../firebase';

  let mapContainer: HTMLDivElement;

  interface TripLocation {
    name: string;
    location: {
      lat: number;
      lng: number;
    };
  }

  async function getPastTripLocations(): Promise<TripLocation[]> {
    try {
      const tripsRef = ref(db, 'trips');
      const snapshot = await get(tripsRef);
      
      if (!snapshot.exists()) return [];

      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create a Set to store unique locations
      const uniqueLocations = new Map<string, TripLocation>();

      // Filter past trips and extract unique destinations
      Object.values(snapshot.val()).forEach((trip: any) => {
        const endDate = new Date(trip.endDate);
        if (endDate < today && trip.destination?.location) {
          const locationKey = `${trip.destination.location.lat},${trip.destination.location.lng}`;
          if (!uniqueLocations.has(locationKey)) {
            uniqueLocations.set(locationKey, {
              name: trip.destination.name,
              location: trip.destination.location
            });
          }
        }
      });

      return Array.from(uniqueLocations.values());
    } catch (error) {
      console.error('Error fetching past trips:', error);
      return [];
    }
  }

  let cleanup: (() => void) | undefined;

  onMount(() => {
    let mounted = true;

    async function initMap() {
      if (!mounted) return;

      const width = mapContainer.clientWidth;
      const height = mapContainer.clientHeight;

      // Create SVG
      const svg = d3.select(mapContainer)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet') as d3.Selection<SVGSVGElement, unknown, null, undefined>;

      // Add a group for all map elements that will be transformed
      const g = svg.append('g');

      // Create projection
      const projection = d3.geoMercator()
        .scale(width / (2 * Math.PI))
        .translate([width / 2, height / 1.6]);  // position the map, horizontally centered but is slighty upward

      const path = d3.geoPath().projection(projection);

      try {
        // Get past trip locations
        const pastLocations = await getPastTripLocations();
        if (!mounted) return;

        // Load world map data
        const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
        if (!mounted) return;
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

        // Add markers for past trip locations
        g.selectAll('circle')
          .data(pastLocations)
          .enter()
          .append('circle')
          .attr('cx', d => projection([d.location.lng, d.location.lat])![0])
          .attr('cy', d => projection([d.location.lng, d.location.lat])![1])
          .attr('r', 5)
          .attr('class', 'marker')
          .attr('fill', Colors.planner.med400)

        // Add zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 8])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          });

        svg.call(zoom)
           .call(zoom.transform, d3.zoomIdentity);

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }

    initMap();

    cleanup = () => {
      mounted = false;
      d3.select(mapContainer).selectAll('*').remove();
    };

    return cleanup;
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