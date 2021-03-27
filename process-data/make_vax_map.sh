#!/bin/bash

# usage from project root:
#  bash process-data/make_vax_map.sh

#download the data using jq to just get the 'vaccination_data' key
curl https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data | jq .vaccination_data > ./src/data/vaccinations.json

# use jq to turn that file into a csv(!)
cat ./src/data/vaccinations.json | jq -r '(map(keys) | add | unique) as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv' > ./src/data/vaccinations.csv

#download the county data using jq to just get the 'vaccination_data' key
curl https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_county_condensed_data | jq .vaccination_county_condensed_data > ./src/data/vaccinations_county.json

# use jq to turn that file into a csv(!)
cat ./src/data/vaccinations_county.json | jq -r '(map(keys) | add | unique) as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv' > ./src/data/vaccinations_county.csv

# use mapshaper to load in 3 maps, 
# join the data to the states map,
# classify that data
# style the state names and innerlines
npx mapshaper -i ./src/data/us_states_albers.json ./src/data/us_states_albers_labels_nyt.json ./src/data/us_states_albers_innerlines.json combine-files \
    -rename-layers states,names,innerlines \
    -join ./src/data/vaccinations.csv keys=STUSPS,Location target=states\
    -classify field=Series_Complete_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 target=states \
    -style stroke=#c2c2c2 stroke-width=1 target=names \
    -style stroke=#c2c2c2 stroke-width=1 target=innerlines \
    -o public/vaccinations_map.svg target=*

# use mapshaper to load in 3 maps, 
# join the data to the states map,
# classify that data
# style the state names and innerlines
# ... but this time output as topojson
npx mapshaper -i ./src/data/us_states_albers.json ./src/data/us_states_albers_labels_nyt.json ./src/data/us_states_albers_innerlines.json combine-files \
    -rename-layers states,names,innerlines \
    -join ./src/data/vaccinations.csv keys=STUSPS,Location target=states\
    -classify field=Series_Complete_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 target=states \
    -style stroke=#c2c2c2 stroke-width=1 target=names \
    -style stroke=#c2c2c2 stroke-width=1 target=innerlines \
    -o format=topojson src/data/vaccinations_map.topojson.json target=*
    
# make a state map of just TX & NM (because we don't have county data for them)
npx mapshaper -i ./src/data/us_states_albers.json -filter '"TX,NM,HI,CO,VA,GA".indexOf(STUSPS) > -1' \
    -rename-layers states_subset \
    -join ./src/data/vaccinations.csv keys=STUSPS,Location target=states_subset\
    -classify field=Series_Complete_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 target=states_subset \
    -o format=topojson src/data/vaccinations_states_subset.topojson.json target=*
    
## Do the counties! SVG ...
npx mapshaper -i ./src/data/us_counties_albers.json ./src/data/us_states_albers_labels_nyt.json ./src/data/us_states_albers_innerlines.json combine-files \
    -rename-layers counties,names,innerlines \
    -join ./src/data/vaccinations_county.csv keys=GEOID,FIPS field-types=GEOID,FIPS:str target=counties\
    -classify field=Series_Complete_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 target=counties \
    -style stroke=#c2c2c2 stroke-width=1 target=names \
    -style stroke=#c2c2c2 stroke-width=1 target=innerlines \
    -o public/vaccinations_county_map.svg target=*

# ## Do the counties! TOPOJSON ...
# npx mapshaper -i ./src/data/us_counties_albers.json ./src/data/us_states_albers_labels_nyt.json ./src/data/us_states_albers_innerlines.json combine-files \
#     -rename-layers counties,names,innerlines \
#     -join ./src/data/vaccinations_county.csv keys=GEOID,FIPS field-types=GEOID,FIPS:str target=counties\
#     -classify field=Series_Complete_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 target=counties \
#     -style stroke=#c2c2c2 stroke-width=1 target=names \
#     -style stroke=#c2c2c2 stroke-width=1 target=innerlines \
#     -o format=topojson ./src/data/vaccinations_county_map.topojson.json target=*


## Do the counties, but replace NM & TX counties with state shapes ... TOPOJSON ...
npx mapshaper -i ./src/data/us_counties_albers.json ./src/data/us_states_albers_labels_nyt.json ./src/data/us_states_albers_innerlines.json ./src/data/vaccinations_states_subset.topojson.json combine-files \
    -rename-layers counties,names,innerlines,states_subset \
    -join ./src/data/vaccinations_county.csv keys=GEOID,FIPS field-types=GEOID,FIPS:str target=counties\
    -classify field=Series_Complete_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 target=counties \
    -style stroke=#c2c2c2 stroke-width=1 target=names \
    -style stroke=#c2c2c2 stroke-width=1 target=innerlines \
    -filter invert '"TX,NM,HI,CO,VA,GA".indexOf(StateAbbr) > -1' target=counties \
    -merge-layers name=counties force target=counties,states_subset \
    -o format=topojson ./src/data/vaccinations_county_map.topojson.json target=*
    