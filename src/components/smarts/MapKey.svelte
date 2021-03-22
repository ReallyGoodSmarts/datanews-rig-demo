<script>
    export let hed = "";
    export let subhed = ""
    export let color_string = ""
    export let level_breaks_string = ""
    export let has_missing_data = false
    export let missing_data_color = "#eee"
    export let interaction_tip = ""
    
    let colors = color_string.split(',')
    let level_breaks = level_breaks_string.split(',')
    
</script>

<main>
    <div class="map-key">
        <div class="map-key-hed">{hed}</div>
        <div class="map-key-subhed">{subhed}</div>

        <div class="bars">
        
            {#each colors as color, i}
            
                {#if (i < colors.length - 1)}
                <div class="bar bar-tick">
                    <div class="level" style="background-color: {color};"></div>
                </div>
                {:else}
                <div class="bar">
                    <div class="level" style="background-color: {color};"></div>
                </div>
                {/if}


            {/each}
            
            {#if has_missing_data}
                <div class="bar bar-last">
                    <div class="level" style="background-color: {missing_data_color};"></div>
                </div>
            {/if}
            
        </div>

        <div class="level-labels">
        
            {#each level_breaks as level_break}
                <div class="level-label">
                        <span>{level_break}</span>
                </div>
            {/each}
                
            {#if has_missing_data}
                <div class="level-label">
                    <span>No data</span>
                </div>
            {/if}    
        
        </div>
        
        <p class="map-interaction-tip">{interaction_tip}</p>
        
    </div>
</main>

<style>

    .map-key {
      max-width: 400px;
      margin: auto;
      font-family: arial, helvetica, sans-serif;
      margin-bottom: 5px;
    }
    .map-key .map-interaction-tip {
      font-size: 14px;
      font-weight: 300;
      margin-bottom: 5px;
      opacity: 0.6;
      display: none;
      text-align: center;
      margin-top: 15px;
    }
    .map-key-hed {
      color: #121212;
      font-size: 1.2em;
      font-weight: bold;
      margin: auto;
      margin-bottom: 5px;
      text-align: center;
    }
    
    .map-key-subhed {
      color: #121212;
      font-size: 1em;
      font-weight: 300;
      margin: auto;
      margin-bottom: 5px;
      text-align: center;
    }
    
    @media (max-width: 765px) {
      .map-key .map-interaction-tip {
        display: block;
      }
    }

    .level-labels {
      display: -ms-flexbox;
      display: flex;
    }
    .level-labels span {
      transform: translate(-50%, 0);
      display: inline-block;
    }
    .level-labels .level-label {
      paddintop: 3px;
      -ms-flex: 1;
          flex: 1;
      text-align: left;
      font-weight: 300;
      font-size: 14px;
      position: relative;
    }
    /* .level-labels .level-label:last-child span {
      transform: none;
      text-align: center;
      margin-left: 6px;
      white-space: nowrap;
    } */

    .bars {
      display: -ms-flexbox;
      display: flex;
    }
    .bars .bar {
      -ms-flex: 1;
          flex: 1;
      height: 15px;
    }
    @media (max-width: 765px) {
      .bars .bar {
        height: 14px;
      }
    }
    .bars .bar.bar-tick {
      border-right: 1px solid #666;
    }
    .bars .bar.bar-last {
      margin-left: 10px;
    }
    .bars .bar.bar-none {
      margin-right: 10px;
      border-right: 0;
    }
    @media (max-width: 600px) {
      .bars .bar.bar-none {
        margin-right: 7px;
      }
    }
    .bars .bar.bar-none:last-child {
      margin-right: 0;
    }
    .bars .bar .level {
      width: 100%;
      height: 60%;
    }
    .bars .bar-big {
      -ms-flex: auto;
          flex: auto;
      width: 30px;
    }

</style>




