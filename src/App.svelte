<script>
    import MapKey from './MapKey.svelte';
    import SvgImage from './SvgImage.svelte';
    import HtmlRender from './HtmlRender.svelte'
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
    
    <!-- Here's a little SVG component, that adjusts to the screen width -->
    <!-- <SvgImage
        filename="./vaccinations_map.svg" /> -->
        
    <HtmlRender
        filename="vaccination_map.html" />

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
    
    img {
        margin-top: 5px;
        margin-bottom: 5px;
    }

</style>
