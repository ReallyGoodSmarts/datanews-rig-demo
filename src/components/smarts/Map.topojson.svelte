<script>
	import { getContext, createEventDispatcher } from 'svelte';
	import { geoPath, geoIdentity } from 'd3-geo';
	import { raise } from 'layercake';
    import { feature } from 'topojson-client';

	const { data, width, height, zGet } = getContext('LayerCake');

	/* --------------------------------------------
	 * Optional D3 projection function (if not already_albers)
	 */
	export let projection = undefined;
    
    /* --------------------------------------------
     * Is the topojson already projected as albersusa?
     */
    export let already_albers = false;

	/* --------------------------------------------
	 * Allow for custom styling
	 */
	export let fill = undefined; // The fill will be determined by the scale, unless this prop is set
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
     * Apply projection, or "null" if already albers
     */
    
    let projection_base

    if (already_albers) {
        
        // if the topojson is already projected as AlbersUsa ...
        // Use a "null" projection that flips the Y coordinate and rescales to fit your SVG
        projection_base = geoIdentity()
            .reflectY(true)
            // .fitSize([$width, $height], $data);
        
    } else {
        
        projection_base = projection()
            // .fitSize([$width, $height], $data);
        
    }
    
    $: projectionFn = projection_base.fitSize([$width, $height], base_collection);
    console.log($width, $height)

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
	{#each features as feature}
		<path
			class="feature-path"
			fill="{fill || feature.properties.fill || "None" || $zGet(feature.properties)}"
			stroke={stroke || feature.properties.stroke }
			stroke-width={strokeWidth || feature.properties["stroke-width"] }
			d="{geoPathFn(feature)}"
			on:mouseover={(e) => dispatch('mousemove', { e, props: feature.properties })}
			on:mousemove={handleMousemove(feature)}
		></path>
	{/each}
</g>

<style>
	/* .feature-path {
		stroke: #333;
		stroke-width: 0.5px;
	} */
	.feature-path:hover {
		stroke: #000;
		stroke-width: 1px;
	}
</style>
