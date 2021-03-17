#!/bin/bash

# usage from project root:
#  bash process-data/make_vax_map.sh

#download the data using jq to just get the 'vaccination_data' key
# curl https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data | jq .vaccination_data > data/vaccinations.json

# use jq to turn that file into a csv(!)
cat data/vaccinations.json | jq -r '(map(keys) | add | unique) as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv' > data/vaccinations.csv

# use mapshaper to load in 3 maps, 
# join the data to the states map,
# classify that data
# style the state names and innerlines
npx mapshaper -i data/us_states_albers.json data/us_states_albers_labels_nyt.json data/us_states_albers_innerlines.json combine-files \
    -rename-layers states,names,innerlines \
    -join data/vaccinations.csv keys=STUSPS,Location target=states\
    -classify field=Series_Complete_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 target=states \
    -style stroke=#c2c2c2 stroke-width=1 target=names \
    -style stroke=#c2c2c2 stroke-width=1 target=innerlines \
    -o public/vaccinations_map.svg target=*

