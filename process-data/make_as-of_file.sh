#!/bin/bash

# usage from project root:
#  bash process-data/make_as-of_file.sh

# this funky line reads in the vaccinations.json and pulls the 
# report date from the first object ... and then stores it as a 
# json file in the format:
#   { "Date": "2021-03-26" }
echo "{ \"as_of\": $(cat ./src/data/vaccinations.json | jq .[0].Date) }" > ./src/data/as-of.json