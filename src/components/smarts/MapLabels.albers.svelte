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
    
    export let collection_name = undefined;
    export let base_collection_name = collection_name;
    
    /* --------------------------------------------
     * Which property would you like to label?
     */    
    export let label_property = "label-text";

    console.log("using collection:", collection_name)
    
    let collection = feature($data, $data.objects[collection_name])
    let base_collection = feature($data, $data.objects[base_collection_name])
    
	/* --------------------------------------------
	 * Allow for custom styling for the points, if shown
	 */
	export let fill = "None"; // The fill will be determined by the scale, unless this prop is set
	export let stroke = "None";
	export let strokeWidth = "None";

	/* --------------------------------------------
	 * Add this optional export in case you want to plot only a subset of the features
	 * while keeping the zoom on the whole geojson feature set
	 */
	export let features = collection.features;
    
    console.log(features)
    
    /* --------------------------------------------
     * Apply "null" projection 
     */
    
    $: projectionFn = geoIdentity()
        .reflectY(true)
        .fitSize([$width, $height], base_collection);

    $: geoPathFn = geoPath(projectionFn);

</script>

<g
	class="map-group"
>
    
	{#each features as feature}
        <!-- Draw the points if you'd like -->
		<path
			class="feature-path"
			fill="{fill || feature.properties.fill || "None"}"
			stroke={stroke || feature.properties.stroke }
			stroke-width={strokeWidth || feature.properties["stroke-width"] }
			d="{geoPathFn(feature)}"
		></path>
        
        {#if (feature.geometry)}
            <!-- {(console.log(projectionFn(feature.geometry.coordinates)))} -->
            <text class="label-text label-text-{collection_name}"
                id="{feature.id || null}"
                x= { projectionFn(feature.geometry.coordinates)[0] }
                y= { projectionFn(feature.geometry.coordinates)[1] }
            >{feature.properties[label_property]}</text>
        {/if}

	{/each}
</g>

<style>

    /* mess with the smaller state names
     * depending on the screen size
     */
     
     
    /* Anything over 1500px */
    #g-state-DC {
        transform: translate(-1%,1%)
    }
    
    #g-state-CT, #g-state-RI, #g-state-MA, #g-state-NH, #g-state-MD {
        transform: translate(0.2%,0.5%);
    }
    
    #g-state-RI {
        transform: translate(0.4%,1%);
    }
    
    @media(max-width: 1500px) {
        #g-state-DC {
            display: none;
        }
        
        #g-state-CT, #g-state-RI, #g-state-MA, #g-state-NH, #g-state-MD {
            transform: translate(0.2%,1%);
        }
        
        #g-state-RI {
            transform: translate(0.9%,1.2%);
        }
    }

    @media (max-width: 900px) {
        #g-state-RI {
            display: none;
        }
    }
    
    @media(max-width:500px) {
        
        .label-text {
            transform: translate(0%,2%);
        }
        
        #g-state-DE, #g-state-MD, #g-state-CT, #g-state-VT, #g-state-MA, #g-state-NH {
            display: none;
        }
        
    }
    
    .label-text {
        text-anchor: middle;
        font-size: 0.8em;
        fill: #a0a0a0;  /*  Use fill: instead of color: for svg <text> blocks */
    }
    
    
    /* drop label size when map is smaller */
    @media (max-width: 700px) {
        .label-text {
            font-size: 0.6em;
        }
        
        #g-state-NH {
            transform: translate(0.2%,1.5%);
        }
        
    }
    
</style>
