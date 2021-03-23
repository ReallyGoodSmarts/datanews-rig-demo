# Data News Rig Demo

This is me building and documenting a data news rig to help community newsrooms make and publish data projects.

Caution: This is part documentation and part log of what I did ... and may be incomplete on both counts.

Generally, I'm trying to keep things as simple and minimal and replicable as possible, primarily using Github and AWS. 

## Psuedo-plan

Build a basic map of US vaccination data. Possibilities include:

- Scrape US Vaccination data
- Build a US map using mapshaper
    - Classify colors based on vaccine data
    - Make State labels
    - Use just state innerlines
- Use Svelte to format the map, header, etc.
- Enhance that map:
    - CSS tooltips
    - Key
    - Make it responsive using CSS
- Deploy it to a production site
- Deploy it to a dev site
- Use a CSS/JS packager
- Have the map update every day ... automatically
- Use Pym.js to make it embeddable
- Can I get the data into Datasette?
- Can I drive a map off Datasette?
- Do I need a data-processing step in my deployment?

## Publishing on main

Right now, I've set it so anything in the `public` directory will be uploaded to `https://projects.datanews.studio/[repo-name]` when code is pushed to the the `main` branch.

I'm planning to change that so it's from the `prod` branch.

Note to self: The cache on that site is currently set to 30 mins. So I need to invalidate the Cloudfront cache when uploading new code!

Currently, that trick only works for **public** repositories, though I've got some ideas of how to make this work for private ones, which will be important for client work.

## Making a data map

There are lots of ways to make data maps, but I'm going to try making an SVG map using [mapshaper](https://mapshaper.org) on the command line.

### Install mapshaper

```
npm init -y
npm install mapshaper --save
```

### Get base map

Getting states map from the [US Census site](https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html).

See my [map-making repo](https://github.com/ReallyGoodSmarts/map-making/README.md) for how I made the `us_states_albers.json` file using mapshaper.

### Get the vaccination data

The CDC data behind its [vaccination map](https://covid.cdc.gov/covid-data-tracker/#vaccinations) is in a [JSON file at this address](https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data).

We can download it with `curl` and insure it's nicely formatted with `jq`:

```
curl https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data | jq .> data/vaccinations.json
```

There's a little problem with this that's going to trip me up if we don't fix it. The vaccination data actually is in an array one level down in the json, under the key `vaccination_data`:

```
{
  "runid": 1857,
  "vaccination_data": [
    {
      "Date": "2021-03-16",
      "Location": "US",
      "ShortName": "USA",
      "LongName": "United States",
      "Census2019": 331996199,
      "date_type": "Report",
      "Doses_Distributed": 142918525,
      "Doses_Administered": 110737856,
      "Dist_Per_100K": 43048,
      "Admin_Per_100K": 33355,
      "Administered_Moderna": 53647312,
      "Administered_Pfizer": 55393141,
      ...
```

I didn't know about [jq](https://stedolan.github.io/jq/) before. It's a very cool way to handle json data. Looking ahead, I know we're going to need the data in CSV form to merge using mapshaper, and to do that we're going to need that at the top level. So I'm going to make it easy by downloading it that way by turning the `.` into `.vaccination_data`:

```
curl https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data | jq .vaccination_data > data/vaccinations.json
```

### Turn the vax data into a CSV for mapshaper

Joining the data to the map turns out to be very easy with mapshaper, but we'll need the vaccination data as a CSV.

We can use jq for that as well, thanks a [blog post](https://www.freecodecamp.org/news/how-to-transform-json-to-csv-using-jq-in-the-command-line-4fa7939558bf/) about how to convert it and [a code playground](https://jqplay.org/s/QOs3d_fMLU) laying it out.

As explaind in a freeCodeCamp blog post, this is the key line of code:

```
jq -r '(map(keys) | add | unique) as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv'
```

The full conversion line is:

```
cat data/vaccinations.json | jq -r '(map(keys) | add | unique) as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv' > data/vaccinations.csv
```

### Join the data to the map

I'll use mapshaper's `-join` command:

```
npx mapshaper data/us_states_albers.json -join data/vaccinations.csv keys=STUSPS,Location \
    -o public/vaccinations_map.json 
```

### Classify the map

Mapshaper will calculate classifications for you, or you can define them yourself and mapshaper will assign colors for you. It's all with the `-classify` command. 

There are [many color ramps](https://github.com/d3/d3-scale-chromatic) you can use.

I actually _don't_ want mapshaper to quantize or otherwise slice up my data, because I'm really interested in which states are at which percentage of people fully innoculated. (As of this writing, it's still under 20% nationwide).

I've added commands to classify by colors, and I used `style` to color the strokes of the states. I also switched the output to `svg` by adding `.svg` to the end of the file name. The full command is now:

```
npx mapshaper data/us_states_albers.json -join data/vaccinations.csv keys=STUSPS,Location \
    -classify field=Administered_Dose2_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 \
    -style stroke=#c2c2c2 stroke-width=1 \
    -o public/vaccinations_map.svg 
```

### Label the states

With mapshaper, labels get attached to points. But I have polygons (the states). But mapshaper also lets you make a new point layer based on the center points of a set of polygons. So I'm going to try to:

- Make a point layer from my existing polygon layer
- Add labels to those points
- Display them all together (may have to solve layer-ordering)

Read up on an [issue Matt Bloch answered](https://github.com/mbloch/mapshaper/issues/422), and his guide to [working with layers](https://github.com/mbloch/mapshaper/wiki/Introduction-to-the-Command-Line-Tool#working-with-layers), and pretty quickly built three scripts to make different label map layers using the additional commands:

```
-points inner \
-style label-text=NAME \
```

I've combined them all into one shell script to [make state label layers](https://github.com/ReallyGoodSmarts/map-making/blob/main/scripts/make_state_labels.sh), and also added `id`'s for each label (so I can move them with CSS later) and gave them all a class.

These live in my [`map-making` repo](https://github.com/ReallyGoodSmarts/map-making), under the `geos/` folder for future use and reference.

### Innerlines

One of the elegant things the New York Times does with its national maps is to "remove" the outer perimeter boundaries, leaving the shape of the US to be created by the colored polygons. In fact, what they've really done is made an "innerlines" layer for boundaries between states.

You can make innerlines with mapshaper, which very nicely calculates those lines based on boundaries two polygons share. I've [made US state innerlines](https://github.com/ReallyGoodSmarts/map-making/blob/main/scripts/make_state_innerlines.sh) and place them in my [`map-making` repo](https://github.com/ReallyGoodSmarts/map-making) for future use.

### Blend state shapes, innerlines and labels

Since I've made the innerlines and labels maps in my [`map-making` repo](https://github.com/ReallyGoodSmarts/map-making), I'm going to copy over those files (from the `geos` directory) into this project's `data` directory and layer them in.

My mapshaper command up to this point is:

```
npx mapshaper data/us_states_albers.json name=states \
    -join data/vaccinations.csv keys=STUSPS,Location \
    -classify field=Administered_Dose2_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 \
    -style stroke=#c2c2c2 stroke-width=1 \
    -o public/vaccinations_map.svg 
```

But using information about [mapshaper's layers](https://github.com/mbloch/mapshaper/wiki/Introduction-to-the-Command-Line-Tool#working-with-layers) and a [stackoverflow post](https://gis.stackexchange.com/questions/206170/how-to-merge-combine-files-in-mapshaper-using-combine-files-command), I'm refactoring that to load in all the layers:

```
npx mapshaper -i data/us_states_albers.json data/us_states_albers_labels_nyt.json data/us_states_albers_innerlines.json combine-files \
    -rename-layers states,names,innerlines \
    -join data/vaccinations.csv keys=STUSPS,Location target=states\
    -classify field=Administered_Dose2_Pop_Pct color-scheme=PuBuGn breaks=10,20,30,40,50,60,70,80,90 target=states \
    -style stroke=#c2c2c2 stroke-width=1 target=names \
    -style stroke=#c2c2c2 stroke-width=1 target=innerlines \
    -o public/vaccinations_map.svg target=*
```

Key things to note:

- `combine-files` added to the input command, to bring them in as separate files (I was stumped by this for a while)
- `rename-layers` to give the layers proper names
- `target=` added to each line, to declare what layer to involve/target with the command

## Make the web app with Svelte

I'd like to start using [Svelte](https://svelte.dev/) to build my web things. I've seen folks at the New York Times make lots of visualizations very quickly using Svelte, so this seems like a good moment to start. Even though it's clearly more powerful than what I need at the moment, this will get me solving problems — and also provides a nice way to organize and serve up my code.

### Merging Svelte into what I've done so far

I'd already started this repo with my own template, and had done all the coding above. Now I needed to weave in the [Svelte template](https://github.com/sveltejs/template). Starting a Svelte project from scratch is pretty clear, but this would be a little trickier. Using a [blog post by Vaibhav Mule](https://medium.com/altcampus/how-to-merge-two-or-multiple-git-repositories-into-one-9f8a5209913f) as a rough guide, here's what I did, from the root directory of this repo:

```bash
# save my work
git add -A
git commit -m "saving my stuff"
git push origin main

# make a new branch
git branch add-svelte
git checkout add-svelte

# link up to the svelte template
# ... even tho I dropped an "e" in the name of the remote :-)
git remote add -f svelttemplate https://github.com/sveltejs/template.git

# merge my branch with the svelte template
# using --allow-unrelated-histories to combine them
git merge svelttemplate/master --allow-unrelated-histories
```

This worked, but led — expectedly — to merge conflicts. They were listed as:

```
CONFLICT (add/add): Merge conflict in public/index.html
Auto-merging public/index.html
CONFLICT (add/add): Merge conflict in package.json
Auto-merging package.json
CONFLICT (add/add): Merge conflict in README.md
Auto-merging README.md
CONFLICT (add/add): Merge conflict in .gitignore
Auto-merging .gitignore
Automatic merge failed; fix conflicts and then commit the result.
```

The only resolution that was a little tricky was the `package.json`, where I just made sure to blend the two files into one by adding the following items from the Svelte template into the code I had for my original repo:

- Replaced the `"scripts":` object in my original with Svelte's, so it now reads:

```  json
"scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "start": "sirv public"
  },
``` 

- Added the `"devDependencies":` object from Svelte:

```json
"devDependencies": {
  "@rollup/plugin-commonjs": "^17.0.0",
  "@rollup/plugin-node-resolve": "^11.0.0",
  "rollup": "^2.3.4",
  "rollup-plugin-css-only": "^3.1.0",
  "rollup-plugin-livereload": "^2.0.0",
  "rollup-plugin-svelte": "^7.0.0",
  "rollup-plugin-terser": "^7.0.0",
  "svelte": "^3.0.0"
},
```

- Edited the `"dependencies":`object to include the `sirv-cli` line from Svelte, so it becomes:

```json
"dependencies": {
  "mapshaper": "^0.5.39",
  "sirv-cli": "^1.0.0"
}
``` 

Then ...

```bash
# merge my temporary branch into the main branch
git add -A
git commit -m "resolved conflicts"
git checkout main
git merge add-svelte

# run npm install to bring in all the new items in package.json
npm install
```

## Using Svelte to format the map, header, etc.

Done! :-)

See the `App.svelte` [source file]('./src/App.svelte').

### Modularize the map and map key

Also done! See the [SvgImage]('./src/SvgImage.svelte') and [MapKey]('./src/MapKey.svelte') files.

The `MapKey` file will be key (heh), since making map keys can sometimes take as long as making maps. This way, I can just drop in the component and set the properties.

The `SvgImage` component just cleans things up a little, and takes full advantage of Svelte's built-in monitors for the size of the screen. So the image scales with the window size.

That said, the right way to incorporate that SVG onto the page will be with [ai2html](http://ai2html.org/), which pulls out the text from the SVG — which not only keeps it from shrinking as the image gets smaller, but also allows you to style the text through CSS. That'll be nice for when I want to move or disappear the names on the smallest states (sorry, guys). 

## Using ai2html

I (slightly) remade the map using Adobe Illustrator and turned it into html with [ai2html](http://ai2html.org/). This turns all the text into html and places the image of the map behind it — making the text both sharper at different scales and addressable with CSS.

Installing `ai2html` was a breeze, though the latest Adobe Creative Cloud version of the Illustrator Scripts folder is at:

```
/Applications/Adobe\ Illustrator\ 2021/Presets.localized/en_US/Scripts/
```

Also I spent some time on the [configuration json]('./ai/ai2html-config.json') to get it work as I wished.

To stay working with Svelte, I [made a component]('./src/HtmlRender.svelte') that slurps in html from another file. 

Addressing the CSS in the map was a little tricky, as styles added to the component don't seem to apply to the slurped-in html. So I hacked away at the [`global.css`]('./public/global.css') file and got it to work.

The big drawback is that there's now a human component in the pipeline — me, using Illustrator. That's fine for a one-off, or even for occasional updates. But for an automatic, daily map I'm going to head over to D3.

## Using Layer Cake (Yum)

As I looked into the next step in this exercise — mapping dynamic data with Svelte — I stumbled into a framework exactly for this kind of project called [Layer Cake](https://layercake.graphics/guide/), made by [Michael Keller](https://twitter.com/mhkeller). It allows _layering_ of different kinds of graphics — html, svg, etc. — in one go. Perfect.

### Installation

```
npm install --save-dev layercake

```

Once again, I'm faced with a [starter template](https://github.com/mhkeller/layercake-template) I want to use, but in my existing project. So I'm going to do that same merge trick I used before:

```bash
# save my work
git add -A
git commit -m "saving my stuff"
git push origin main

# make a new branch
git branch add-cake
git checkout add-cake

# link up to the svelte template
# ... even tho I dropped an "e" in the name of the remote :-)
git remote add -f caketemplate https://github.com/mhkeller/layercake-template

# merge my branch with the svelte template
# using --allow-unrelated-histories to combine them
git merge caketemplate/master --allow-unrelated-histories
```

This worked, but led — expectedly — to merge conflicts. Worked through them slowly, but without problems.

Then ...

```bash
# merge my temporary branch into the main branch
git add -A
git commit -m "resolved conflicts"
git checkout main
git merge add-cake

# run npm install to bring in all the new items in package.json
npm install
```

### Layer-caking my html

As a first test, I'll try Layer Cake to bring in my `ai2html`-generated html file from earlier.

That worked, by adding this between the `<script>` tags ...

```
    import { LayerCake, Html } from 'layercake';
```

And this between the `<main>` tags ...

```
<div class="chart-container">
  <LayerCake ...>
    <Html zIndex={1}> <!-- Optional z-index -->
        <HtmlRender
            filename="vaccination_map.html" />
    </Html>
  </LayerCake>
</div>
```

### Layer-caking the map data

I modified the [mapshaper script]('./process-data/make_vax_map.sh') to also output the map layers in a single [topojson file]('public/vaccinations_map.topojson.json').

Then I used the [Layer Cake svg-map example](https://layercake.graphics/example/MapSvg/)







