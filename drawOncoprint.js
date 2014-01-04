#!/usr/bin/env node

// Load required modules
var jsdom = require('jsdom')
, fs = require('fs')
//, wkhtmltopdf = require('wkhtmltopdf');

// Validate args
var argv = require('optimist').argv;
if (!( argv.outdir && argv.json )){
    usage  = "Usage: node drawOncoprint.js --json=</path/to/json>"
    usage += " --outdir=</path/to/output> [--width=<width_in_pixels>]"
    usage += " [--style=</path/to/json/file>]"
    console.log(usage);
    process.exit(1);
}

// Load the data and parse into shorter variable handles
var data = JSON.parse(fs.readFileSync(argv.json).toString());

// Scripts required to make oncoprint
var scripts = [ "bower_components/jquery/jquery.min.js",
                "bower_components/d3/d3.min.js",
                "js/oncoprinter.js",
              ]
, htmlStub = '<!DOCTYPE html><oncoprint></oncoprint>';

var src = scripts.map(function(S){ return fs.readFileSync(S).toString(); })

// Globals to store the loaded JS libraries
var d3, $;

// Parameters for drawing the oncoprint
var styleFile = argv.style || "styles/pancancer-style.json"
, styling = JSON.parse(fs.readFileSync(styleFile).toString())
, width = argv.width || styling.global.width || 900;
styling.oncoprint.width = width;

// Merge the global and oncoprint styles into one
var style = styling.oncoprint;
for (var attrname in styling.global)
    style[attrname] = styling.global[attrname];

// Function to notify user if write fails
function write_err(err){ if (err){ console.log('Could not output result.' + err); } }

jsdom.env({features:{QuerySelector:true}, html:htmlStub, src:src, done:function(errors, window) {
    // Function for saving a figure
    function save_fig(selector, file_prefix){
        // Grab the element from the document
        var elem = $(selector)[0];

        // Output if the element exists
        if (elem){
            // Write to file as an SVG
            fs.writeFile(file_prefix + ".svg", elem.outerHTML, write_err);
        
            // Write to file as a PDF
            // wkhtmltopdf(elem.outerHTML).pipe(fs.creatReadStream(argv.outpre + ".pdf"));    
        }
    }
    // Make libraries global loaded in window
    d3 = window.d3;
    $  = window.jQuery;
    

    // Create the oncoprint in the headless browser
    var el = d3.select('oncoprint')
        .datum(data)
        .call(
            window.oncoprint({style: style})
            .addCoverage()
            .addLegend()
            .addSortingMenu()
        );

    // Make sure all SVGs are properly defined
    d3.selectAll("svg").attr("xmlns", "http://www.w3.org/2000/svg") 

    // Write the oncoprint to file
    save_fig("svg#oncoprint", argv.outdir + "/oncoprint")

    // Write the mutation type legend to file
    save_fig("svg#mutation-legend", argv.outdir + "/mutLegend")

    // Write the sample type legend to file (if necessary)
    save_fig("svg#sample-type-legend", argv.outdir + "/sampleTyLegend");

}});