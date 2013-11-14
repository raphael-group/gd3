#!/usr/bin/env node

// Load required modules
var jsdom = require('jsdom')
, fs = require('fs')
//, wkhtmltopdf = require('wkhtmltopdf');

// Validate args
var argv = require('optimist').argv;
if (!( argv.outpre && argv.json )){
    usage  = "Usage: node drawLolliplot.js --json=</path/to/json>"
    usage += " --outpre=</path/to/output/file (no ext)>"
    usage += "[--width=<width_in_pixels>]"
    usage += " [--style=</path/to/json/file>]"
    console.log(usage);
    process.exit(1);
}

// Load the data and parse into shorter variable handles
var data     = JSON.parse(fs.readFileSync(argv.json).toString())
, gene       = Object.keys(data)[0] // take the first if there's more than one
, transcript = Object.keys(data[gene])[0] // takes the first if there's more than one
, mutations  = data[gene][transcript].mutations
, domains    = data[gene][transcript].domains
, length     = data[gene][transcript].length;

// Scripts required to make oncoprint
var scripts = [ "js/lib/jquery.js",
                "js/lib/d3.v3.min.js",
                "js/lolliplots.js",
              ]
, htmlStub = '<!DOCTYPE html><lolliplot></lolliplot>';

var src = scripts.map(function(S){ return fs.readFileSync(S).toString(); })

// Globals to store the loaded JS libraries
var d3, $;

// Parameters for drawing the oncoprint
var width = argv.width ? argv.width : 900
, styleFile = argv.style ? argv.style : "js/styles/default-style.json"
, styling = JSON.parse(fs.readFileSync(styleFile).toString());
styling.lolliplot.width = width;

// Function to notify user if write fails
function write_err(err){ if (err){ console.log('Could not output result.'); } }

jsdom.env({features:{QuerySelector:true}, html:htmlStub, src:src, done:function(errors, window) {
    // Make libraries global loaded in window
    d3 = window.d3;
    $  = window.jQuery;
    
    // Create the oncoprint in the headless browser
    var el = d3.select("lolliplot");
    window.annotate_transcript(el, gene, mutations, domains, length, styling)

    // Make sure all SVGs are properly defined
    d3.selectAll("svg").attr("xmlns", "http://www.w3.org/2000/svg") 

    // Write the oncoprint to file
    var lolliplot = $("svg")[0].outerHTML;
    fs.writeFile(argv.outpre + ".svg", lolliplot, write_err);
    // wkhtmltopdf(lolliplot).pipe(fs.creatReadStream(argv.outpre + ".pdf"));
    
}});