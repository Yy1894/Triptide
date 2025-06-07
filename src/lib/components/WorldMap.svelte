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
    startDate: string;
    endDate: string;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${date.getFullYear()}`;
  }

  async function getPastTripLocations(): Promise<Record<string, TripLocation[]>> {
    try {
      const tripsRef = ref(db, 'trips');
      const snapshot = await get(tripsRef);
      if (!snapshot.exists()) return {};

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const locationMap: Record<string, TripLocation[]> = {};

      Object.values(snapshot.val()).forEach((trip: any) => {
        const endDate = new Date(trip.endDate);
        if (endDate < today && trip.destination?.location) {
          const key = `${trip.destination.location.lat},${trip.destination.location.lng}`;
          if (!locationMap[key]) locationMap[key] = [];
          locationMap[key].push({
            name: trip.destination.name,
            location: trip.destination.location,
            startDate: trip.startDate,
            endDate: trip.endDate
          });
        }
      });

      return locationMap;
    } catch (error) {
      console.error('Error fetching past trips:', error);
      return {};
    }
  }

  let cleanup: (() => void) | undefined;

  onMount(() => {
    let mounted = true;

    async function initMap() {
      if (!mounted) return;

      const width = mapContainer.clientWidth;
      const height = mapContainer.clientHeight;

      const svg = d3.select(mapContainer)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet') as d3.Selection<SVGSVGElement, unknown, null, undefined>;

      const g = svg.append('g');

      const projection = d3.geoMercator()
        .scale(width / (2 * Math.PI))
        .translate([width / 2, height / 1.6]);

      const path = d3.geoPath().projection(projection);

      try {
        const locationMap = await getPastTripLocations();
        if (!mounted) return;

        const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
        if (!mounted) return;
        const world = await response.json();

        const countries = feature(world, world.objects.countries) as any;

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

        const pastLocations = Object.values(locationMap).map(trips => trips[0]);

        g.selectAll('circle')
          .data(pastLocations)
          .enter()
          .append('circle')
          .attr('cx', d => projection([d.location.lng, d.location.lat])![0])
          .attr('cy', d => projection([d.location.lng, d.location.lat])![1])
          .attr('r', 5)
          .attr('class', 'marker')
          .attr('fill', Colors.planner.med400)
          .on('click', function (event, d) {
            d3.selectAll('.trip-label').remove();
            d3.selectAll('.trip-marker').remove();
            d3.selectAll('.trip-line').remove();
            event.stopPropagation();

            const key = `${d.location.lat},${d.location.lng}`;
            const trips = locationMap[key];

            if (trips && trips.length > 0) {
              const baseX = projection([d.location.lng, d.location.lat])![0];
              const baseY = projection([d.location.lng, d.location.lat])![1];

              trips.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
              
              if (trips.length > 1) {
                g.append('line')
                  .attr('x1', baseX)
                  .attr('y1', baseY + 5)
                  .attr('x2', baseX)
                  .attr('y2', baseY - (trips.length - 1) * 24 + 6)
                  .attr('stroke', Colors.planner.med400)
                  .attr('stroke-width', 2)
                  .attr('class', 'trip-line');
              }

              trips.forEach((trip, idx) => {
                const offsetY = idx * 24;

                const markerGroup = g.append('g')
                  .attr('class', 'trip-group')
                  .on('mouseover', function () {
                    d3.select(this).select('circle').transition().duration(200).attr('r', 7);
                    d3.select(this).select('text').transition().duration(200).attr('fill', Colors.planner.med400);
                  })
                  .on('mouseout', function () {
                    d3.select(this).select('circle').transition().duration(200).attr('r', 5);
                    d3.select(this).select('text').transition().duration(200).attr('fill', Colors.black);
                  });

                markerGroup.append('circle')
                  .attr('cx', baseX)
                  .attr('cy', baseY - offsetY)
                  .attr('r', 5)
                  .attr('fill', Colors.planner.med400)
                  .attr('class', 'trip-marker');

                markerGroup.append('text')
                  .attr('x', baseX + 10)
                  .attr('y', baseY - offsetY + 4)
                  .attr('font-size', '12px')
                  .attr('class', 'trip-label')
                  .text(`${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`);
              });
            }
          });

        svg.on('click', () => {
          d3.selectAll('.trip-label').remove();
          d3.selectAll('.trip-marker').remove();
          d3.selectAll('.trip-line').remove();
        });

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
    r: 7;
    cursor: pointer;
  }

  :global(.trip-label),
  :global(.trip-marker),
  :global(.trip-line) {
    transition: all 0.2s ease;
    pointer-events: all;
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
