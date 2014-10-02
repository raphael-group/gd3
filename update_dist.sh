#!/bin/sh

# Locations of scripts
MUTATION_MATRIX=js/mutation-matrix.js
TRANSCRIPT_PLOT=js/transcript-plot.js
SUBNETWORK=js/subnetwork.js
CNA_BROWSER=js/cna-browser.js
HEATMAP=js/heatmap.js

# Copy latest scripts to dist
cp $MUTATION_MATRIX dist/js
cp $TRANSCRIPT_PLOT dist/js
cp $SUBNETWORK dist/js
cp $CNA_BROWSER dist/js
cp $HEATMAP dist/js

# Create a single uglified version of all the scripts
MIN_FILE=dist/js/gd3.min.js
./node_modules/uglify-js/bin/uglifyjs $MUTATION_MATRIX $TRANSCRIPT_PLOT $SUBNETWORK $CNA_BROWSER $HEATMAP \
	-m -c -o dist/js/gd3.min.js --source-map ${MIN_FILE}.map \
	--source-map-root http://cgat.cs.brown.edu/components/gd3/dist/js

# Copy style files to dist
cp styles/* dist/style/