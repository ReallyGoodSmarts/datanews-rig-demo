<script>
	import { getContext, createEventDispatcher } from 'svelte';
	import { geoPath, geoIdentity } from 'd3-geo';
	import { raise } from 'layercake';
    import { feature } from 'topojson-client';

	const { data, width, height, zGet } = getContext('LayerCake');

    /* --------------------------------------------
	 * This component only for maps pre-projected
     * With AlbersUsa ... so it applies a "null"
     * projection. 
	 */
    
    /* --------------------------------------------
     * Define which collection to map, and optionally
     * which collection to use as the base reference
     * collection (usually the main map layer)
     * so the collecitons' width and height match.
     */

	/* --------------------------------------------
	 * Allow for custom styling
	 */
	export let fill = undefined;
	export let stroke = undefined;
	export let strokeWidth = undefined;

    /* --------------------------------------------
     * Pick the first collection object if collection name is not specified
     */
    
    export let collection_name = undefined;
    export let base_collection_name = collection_name;

    console.log("using collection:", collection_name)
    
    let collection = feature($data, $data.objects[collection_name])
    let base_collection = feature($data, $data.objects[base_collection_name])
    
	/* --------------------------------------------
	 * Add this optional export in case you want to plot only a subset of the features
	 * while keeping the zoom on the whole geojson feature set
	 */
	export let features = collection.features;
    
    /* --------------------------------------------
    * Apply "null" projection 
    */

    $: projectionFn = geoIdentity()
         .reflectY(true)
         .fitSize([$width, $height], base_collection);

    $: geoPathFn = geoPath(projectionFn);

    $: geoPathFn = geoPath(projectionFn);

	/* --------------------------------------------
	 * Here's how you would do cross-component hovers
	 */
	const dispatch = createEventDispatcher();

	function handleMousemove(feature) {
		return function handleMousemoveFn(e) {
			raise(this);
			// When the element gets raised, it flashes 0,0 for a second so skip that
			if (e.layerX !== 0 && e.layerY !== 0) {
				dispatch('mousemove', { e, props: feature.properties });
			}
		}
	}
</script>

<g
	class="map-group"
	on:mouseout={(e) => dispatch('mouseout')}
>
	{#each features as feature, i }
		<path
			class="feature-path"
			fill="{fill || feature.properties.fill || "None" || $zGet(feature.properties)}"
			stroke={stroke || feature.properties.stroke }
			stroke-width={strokeWidth || feature.properties["stroke-width"] }
			d="{geoPathFn(feature)}"
			on:mouseover={(e) => dispatch('mousemove', { e, props: feature.properties })}
			on:mousemove={handleMousemove(feature)}
		></path>
        
        <!-- send a message upstream when map is drawn -->
        {#if (i+1 == features.length)}
            {dispatch('message', { mapDrawn: true })}
        {/if}
        
	{/each}
</g>

<style>
	/* .feature-path {
		stroke: #333;
		stroke-width: 0.5px;
	} */
	.feature-path:hover {
		stroke: #121212;
		stroke-width: 1px;
	}
</style>
