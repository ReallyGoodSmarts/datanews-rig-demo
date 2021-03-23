<script>
    import MapKey from './components/smarts/MapKey.svelte';
    import SvgImage from './components/smarts/SvgImage.svelte';
    import HtmlRender from './components/smarts/HtmlRender.svelte'
    import { LayerCake, Html, Svg } from 'layercake';
    import { feature } from 'topojson-client';
    // import { scaleQuantize } from 'd3-scale';
    import { geoAlbersUsa } from 'd3-geo';

    import Map from './components/Map.svg.svelte';
    
    // This example loads json data as json using @rollup/plugin-json
    import usStates from './data/us-states.topojson.json';

    const geojson = feature(usStates, usStates.objects.collection);
    
    // const innerlines = feature(vaxMap, vaxMap.objects.innerlines).features;
    // const state_names = feature(vaxMap, vaxMap.objects.names).features;

</script>

<main>

	<h1>Fully vaccinated across the U.S.</h1>
    
	<p class="g-leadin">Percentage of the state's adult population who've received both doses of Pfizer or Moderna shots, or the single-dose Johnson & Johnson shot.</p>
    
    <!-- Let's use the MapKey component I made -->
    <MapKey 
        hed = ""
        subhed = "Portion fully vaccinated"
        color_string = "#fff7fb,#ede5f1,#d5d5e8,#b3c4df,#83b2d4,#529ec8,#258bac,#067c80,#016657,#014636"
        level_breaks_string = " ,10%,20%,30%,40%,50%,60%,70%,80%,90%"
    />
    
    <div class="chart-container">
      <LayerCake
        z='FOO'
        data={geojson}

      >
        <Svg>
          <Map
            projection={geoAlbersUsa}
          />
        </Svg>

      </LayerCake>
    </div>
    

    <!-- <div class="chart-container">
      <LayerCake ...>
        <Html zIndex={1}> 
            <HtmlRender
                filename="vaccination_map.html" />
        </Html>
      </LayerCake>
    </div> -->

    <p class="g-notes">Data as of March 18, 2021 | Source: Centers for Disease Control and Prevention | Get the <a href="https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data">data</a> | By John Keefe  

</main>


<style>

	main {
		text-align: left;
        font-size: 1em;
        font-family: sans-serif;
	}

	h1 {
		color: #121212;
		font-size: 1.5em;
		font-weight: 700;
	}
    
    .g-leadin {
        color: #808080;
        font-weight: 300;
        width: 100%;
        font-family: sans-serif;
    }
    
    .g-notes {
        color: #808080;
        font-weight: 300;
        font-size: 0.7em;
        width: 100%;
        font-family: sans-serif;
    }
    
    .chart-container {
      width: 100%;
      height: 300px;
    }
    

</style>
