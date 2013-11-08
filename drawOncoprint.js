// Load required modules
var jsdom = require('jsdom'),
fs = require('fs');

// Parse args
var data = JSON.parse(fs.readFileSync(process.argv[2]).toString())
, M = data.M
, sample2ty = data.sample2ty
, coverage_str = data.coverage_str
, outputDir = process.argv[3];

// Scripts required to make oncoprint
var scripts = [ "js/lib/jquery.js",
                "js/lib/d3.v3.min.js",
                "js/oncoprinter.js",
                "js/default-style.js"
              ]
, htmlStub = '<!DOCTYPE html><oncoprint></oncoprint>';

var src = scripts.map(function(S){ return fs.readFileSync(S).toString(); })

// Globals to store the loaded JS libraries
var d3, $;

// Parameters for drawing the oncoprint
var width = 900

// Function to notify user if write fails
function write_err(err){ if (err){ console.log('Could not output result.'); } }

jsdom.env({features:{QuerySelector:true}, html:htmlStub, src:src, done:function(errors, window) {
    // Make libraries global loaded in window
    d3 = window.d3;
    $  = window.jQuery;
    
    // Create the oncoprint in the headless browser
    var el = d3.select("oncoprint");
    window.oncoprinter(el, M, sample2ty, coverage_str, width);

    // Make sure all SVGs are properly defined
    d3.selectAll("svg").attr("xmlns", "http://www.w3.org/2000/svg") 

    // Write the oncoprint to file
    fs.writeFile(outputDir + "/oncoprint.svg", $("svg#oncoprint")[0].outerHTML, write_err);

    // Write the mutation type legend to file
    fs.writeFile(outputDir + "/mutLegend.svg", $("svg#mutation-legend")[0].outerHTML, write_err);

    // Write the sample type legend to file (if necessary)
    if ($("svg#sample-type-legend")[0].outerHTML)
        fs.writeFile(outputDir + "/sampleTyLegend.svg", $("svg#sample-type-legend")[0].outerHTML, write_err);

}});