#!/bin/sh

./node_modules/uglify-js/bin/uglifyjs js/mutation-matrix.js -m > js/mutation-matrix.min.js
./node_modules/uglify-js/bin/uglifyjs js/transcript-plot.js -m > js/transcript-plot.min.js
./node_modules/uglify-js/bin/uglifyjs js/subnetwork.js -m > js/subnetwork.min.js
./node_modules/uglify-js/bin/uglifyjs js/cna-browser.js -m > js/cna-browser.min.js