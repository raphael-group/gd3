#!/usr/bin/env node

// Load required modules
var jsdom = require('jsdom')
, fs = require('fs')
//, wkhtmltopdf = require('wkhtmltopdf');

// Validate args
var argv = require('optimist').argv;
if (!( argv.outdir && argv.json )){
    usage  = "Usage: node drawOncoprint.js --json=</path/to/json>"
    usage += " --outdir=</path/to/output>"
    console.log(usage);
    process.exit(1);
}

// Load the data and parse into shorter variable handles
var data = JSON.parse(fs.readFileSync(argv.json).toString())
, M = data.M
, sample2ty = data.sample2ty
, coverage_str = data.coverage_str;

// Scripts required to make oncoprint
var scripts = [ "js/lib/jquery.js",
                "js/lib/d3.v3.min.js",
                "js/oncoprinter.js",
                "js/style/default-style.js"
              ]
, htmlStub = '<!DOCTYPE html><oncoprint></oncoprint>';

var src = scripts.map(function(S){ return fs.readFileSync(S).toString(); })

// Globals to store the loaded JS libraries
var d3, $;

// Parameters for drawing the oncoprint
var width = 900

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
    var el = d3.select("oncoprint");
    window.oncoprinter(el, M, sample2ty, coverage_str, width);

    // Make sure all SVGs are properly defined
    d3.selectAll("svg").attr("xmlns", "http://www.w3.org/2000/svg") 

    // Write the oncoprint to file
    save_fig("svg#oncoprint", argv.outdir + "/oncoprint")

    // Write the mutation type legend to file
    save_fig("svg#mutation-legend", argv.outdir + "/mutLegend")

    // Write the sample type legend to file (if necessary)
    save_fig("svg#sample-type-legend", argv.outdir + "/sampleTyLegend");

}});