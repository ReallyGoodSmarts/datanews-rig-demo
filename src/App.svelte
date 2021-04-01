<script>
    import { LayerCake, Html, Svg } from 'layercake';
    import { afterUpdate } from 'svelte'
    import MapKey from './components/smarts/MapKey.svelte';
    import Map from './components/smarts/Map.albers.svelte';
    import MapLabels from './components/smarts/MapLabels.albers.svelte';
    
    // set up the as-of date
    import dayjs from 'dayjs'
    import updateLocale from 'dayjs/plugin/updateLocale'
    dayjs.extend(updateLocale)
    dayjs.updateLocale('en', {
      monthsShort: [
        "Jan.", "Feb.", "March", "April", "May", "June",
        "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."
      ]
    })
    
    import updated_date from './data/as-of.json'
    let as_of = dayjs(updated_date.as_of).format("MMM D, YYYY")
    console.log(as_of)
    
    // This example loads json data as json using @rollup/plugin-json
    import theTopojson from './data/vaccinations_county_map.topojson.json';
    
    // Values for container height calculation
    const height_from_width = 0.6
    let w = 400
    let h
    $: h = w * height_from_width, updateHeight() // trick to update height on h change
    
    // stuff for tooltips
    import Tooltip from './components/layercake/Tooltip.svelte';
    import { format } from 'd3-format';
    const addCommas = format(',');
    let hideTooltip = true;
    let evt;
    
    // stuff for Pym, which manages iframe resizing for use as an embed
    import pym from '../scripts/pym.v1.min.js';
    var pymChild = new pym.Child();
    let mainElementHeight
    
    function updateHeight(event) {
        // This gets called 
        // note that i'm actually ignoring the event object itself
        
        // only process if the first main element exists    
        if (document.getElementsByTagName('main')[0]) {
            
            // sending height of the first <main> tag to the Pym parent
            // as a message instead of using pymChild.sendHeight, which sends the 
            // height of the <body> tag. 
            mainElementHeight = document.getElementsByTagName('main')[0].offsetHeight.toString()
            pymChild.sendMessage('height', mainElementHeight);
        }
    }

</script>

<main>

	<h1>Fully vaccinated across the U.S.</h1>
    
	<p class="g-leadin">Percentage of county's total population that has received both doses of Pfizer or Moderna shots, or the single-dose Johnson & Johnson shot.</p>
    
    <!-- Let's use the MapKey component I made -->
    <MapKey 
        hed = ""
        subhed = "Portion fully vaccinated"
        color_string = "#fff7fb,#ede5f1,#d5d5e8,#b3c4df,#83b2d4,#529ec8,#258bac,#067c80,#016657,#014636"
        level_breaks_string = " ,10%,20%,30%,40%,50%,60%,70%,80%,90%"
    />
    
    <div class="chart-container" bind:clientWidth={w} style="height: {h}px ">
    
      <LayerCake
        z='FOO'
        data={theTopojson}

      >
        <Svg>
          <Map
            collection_name="counties"
            on:message={updateHeight}
          />
        </Svg>
        
        <Svg>
          <Map
            collection_name="innerlines"
            base_collection_name="counties"
          />
        </Svg>
        
        <Svg>
          <MapLabels
            collection_name="names"
            base_collection_name="counties"
            label_property="nyt_name"
          />
        </Svg>
        
        <!-- Make a top, transparent state layer for the rollovers -->
        <Svg zIndex={1}>
          <Map
            collection_name="counties"
            fill=transparent
            strokeWidth=0
            
            on:mousemove={event => evt = hideTooltip= event}
            on:mouseout={() => hideTooltip = true}
          
          />
        </Svg>
        
        <Html
          pointerEvents={false}
        >
          {#if hideTooltip !== true}
            <Tooltip
              {evt}
              let:detail
            >
            <div class="tooltip-box">
                <span class="tooltip-county">{detail.props.NAME}</span><br />
                <span class="tooltip-state">{detail.props.StateName ? detail.props.StateName : "statewide"}</span><br />
                <span class="tooltip-info">{detail.props.Series_Complete_Pop_Pct ? detail.props.Series_Complete_Pop_Pct : "Unknown "}% vaccinated</span>
            </div>
            </Tooltip>
          {/if}
        </Html>

      </LayerCake>
    </div>
    
    <p class="g-notes">Data as of {as_of}. Statewide totals shown for Hawaii, New Mexico, and Texas, where county-level data is not available, and for Colorado, Georgia, and Virginia, where the county of residence wasn't available for about half of those vaccinated. | Source: <a href="https://covid.cdc.gov/covid-data-tracker/#county-view">Centers for Disease Control and Prevention</a> | Get the <a href="https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_county_condensed_data">data</a> | By John Keefe  

</main>


<style>

	main {
		text-align: left;
        font-size: 1em;
        font-family: sans-serif;
	}

	h1 {
		color: #121212;
        margin-top: 0px;
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
      height: 400px;
    }
    
    .tooltip-county {
        font-weight: 700;
    }

</style>
