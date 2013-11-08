var mutSymbols = {"Nonsense_Mutation": 0, "Frame_Shift_Del": 1, "Frame_Shift_Ins": 1, "Missense_Mutation": 2,
                 "Splice_Site": 3, "In_Frame_Del": 4, "In_Frame_Ins": 4}

function annotate_transcript(el, gene, mutations, proteinDomains, length, width){
    // Declarations
    var margin  = 5
    , width     = width
    , height    = 200 - 2 * margin
    , bar_y     = 20
    , radius    = 5
    , resolution = Math.floor(width / (radius*2));

    // Defining a scale to be used for the zoom functionality
    var start = 0
    , stop = length;

    var x = d3.scale.linear()
        .domain([start, stop])
        .range([margin, width - margin]);

    var sequenceScale = d3.scale.linear()
        .domain([start, stop])
        .range([0, length]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5)
        .tickSize(0)
        .tickPadding(1.25);

    // Defining zoom behavior with D3's built-in zoom functionality
    var zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 100])
        .on("zoom", function(){ update_transcript(svg); });

    // Drawing the box to hold the lolliplot
    var svg = el.append("svg")
        .attr("class", "lollibox")
        .attr("id", gene + "-transcript")
        .attr("width", width)
        .attr("height", height + 2*margin)
        .call(zoom);

    // Add a background
    var background = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "background")
        .style("fill", bgColor);

    // The transcript
    var transcript = svg.append("rect")
        .attr("class", "transcript")
        .attr("y", height - bar_y*2)
        .attr("x", x(start))
        .attr("width", x(stop)-x(start))
        .attr("height", bar_y - margin)
        .style("fill", blockColorLight);

    // This is the text for the actual protein sequence
    // var sequence = svg.selectAll("text")
    //     .data(sample["sequence"]).enter()
    //     .append("text")
    //     .text(function(d){ return d })
    //     .attr("y", height - bar_y*1.5)
    //     .style("fill-opacity", 0);

    // This is the text for the actual protein sequence
    // var sequence = svg.selectAll("text")
    //     .data(sample["sequence"]).enter()
    //     .append("text")
    //     .text(function(d){ return d })
    //     .attr("y", height - bar_y*1.5)
    //     .style("fill-opacity", 0);

    // This draws the actual xaxis
    var xaxis = svg.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + (height - bar_y) + ")")
        .style("font-size", "12px")
        .style("fill", blockColorLight)
        .call(xAxis);

    var gene_name = gene
    , data_set = mutations.slice();

    // These are the actual symbols that
    // we'll plot along the gene, that represent
    // a specific mutation
    var symbols = svg.selectAll(".symbols")
        .data(data_set).enter()
        .append("path")
        .attr("class", "symbols")
        .attr("d", d3.svg.symbol()
            .type(function(d, i){
                    // This references the dictionary we created before
                    // to create the appropriate shape
                    return d3.svg.symbolTypes[mutSymbols[d.ty]];
                })
                .size(radius*radius)
        )
        .style("stroke", function(d, i){ return coloring["cancer"][d.cancer]; })
        .style("fill", function(d, i){ return coloring["cancer"][d.cancer]; })
        .style("stroke-width", 2)
    
    // This draws all the appropriate domains
    // from the domain data
    var domainGroups = svg.selectAll(".domains")
        .data(proteinDomains.slice()).enter()
        .append("g")
        .attr("class", "domains")

    var domains = domainGroups.append("rect")
        .attr("width", function(d, i){
            return x(d.end) - x(d.start);
        })
        .attr("height", bar_y + margin)
        .style("fill-opacity", .5)
        .style("fill", blockColorMedium);

    var domainLabels = domainGroups.append("text")
            .attr("id", function(d, i){ return "domain-" + i; })
            .attr("y", height - bar_y - 1.5 * margin)
            .attr("text-anchor", "middle")
            .style("fill-opacity", 0)
            .style("fill", textColorStrongest)
            .text(function(d, i){  return d.name });

    domainGroups.on("mouseover", function(d, i){
            d3.select(this).selectAll("rect").style("fill", highlightColor)
            el.select("#domain-" + i).style("fill-opacity", 1)
        })
        .on("mouseout", function(d, i){
            d3.select(this).selectAll("rect").style("fill", blockColorMedium)
            el.select("#domain-" + i).style("fill-opacity", 0)
        });

    // This renders all the symbols, domains, rectangles,
    // and axes (rather, it tells them to update themselves)
    function update_transcript(){
        // Find the current scope of the zoom
        var cur_min = d3.min(x.domain())
        , cur_max = d3.max(x.domain())
        , cur_res = Math.round((cur_max - cur_min)/resolution);

        cur_res = (cur_res) ? cur_res : 1;

        // This keeps track of how many mutations are
        // plotted at each spot, so that we can "stack" the
        // mutations on top of one another
        var index_dict = {}
        , Px = {}
        , Py = {};
        for (var i = Math.floor(cur_min/cur_res) - 5; i < Math.ceil(cur_max/cur_res) + 5; i++){
            index_dict[i] = 0;
        }

        // We render all the glyphs in the selection "symbols"
        // We move them to their appropriate position and color them
        symbols.attr("transform", function(d, i){
                var cur_index = Math.round(d.locus/cur_res)
                , px = x(cur_index*cur_res)
                , py = height - bar_y*2 - index_dict[cur_index] * radius*2 - 3*margin;
                index_dict[cur_index] ++;
                
                // Store the x- and y-values for this symbol for later use constructing the tooltip
                Px[i] = px;
                Py[i] = py;

                return "translate(" + px + ", " + py + ")";
            })
            .style("fill", function(d){ return coloring["cancer"][d.cancer] })
            .style("stroke", function(d){ return coloring["cancer"][d.cancer] })
            .style("stroke-opacity", 1)
            .style("fill-opacity", 1)

        if (symbols.tooltip)
            symbols.tooltip(function(d, i) {
                var tip = d.sample + "<br/>" + d.ty.replace(/_/g, " ") + "<br/>" + d.locus + ": " + d.aao + ">" + d.aan;
                return {
                    type: "tooltip",
                    text: tip,
                    detection: "shape",
                    placement: "fixed",
                    gravity: "right",
                    position: [Px[i], Py[i]],
                    displacement: [3, -25],
                    mousemove: false
                };
            });


        // Everything outside the boundaries we ignore
        symbols.filter(function(d, i){  return !(cur_min < d.locus && cur_max > d.locus);  })
            .style("stroke-opacity", 0)
            .style("fill-opacity", 0);

        // updating the axis
        xaxis.call(xAxis);

        // updating the transcript
        transcript.attr("x", x(start)).attr("width", x(stop) - x(start));

        // updating the protein sequence
        // sequence.attr("x", function(d, i){ return x(sequenceScale(i)) })
        //     .style("fill-opacity", function(d, i){ return (cur_res < 5) ? 0.5 : 0 });

        // // updating the domains
        domains.attr("transform", function(d, i){
            return "translate(" + x(d.start) + "," + (height - bar_y*2 - margin) + ")"
        });

        domains.attr("width", function(d, i){ return x(d.end) - x(d.start); });
        
        domainLabels.attr("x", function(d, i){
                // place the label in the center of whatever portion of the domain is shown
                var x1 = d3.max( [d.start, cur_min] )
                ,   x2 = d3.min( [d.end, cur_max] );
                return x(x1 + (x2-x1)/2);
            })
    }

    // Get the party started
    update_transcript();

}

// Draw a transcript legend using ONLY the mutation classes used for the given transcripts
function lolliplot_legend(el, gene2transcripts, width){
    // Declaration 
    var margin    = 5
    , width       = width
    , fontSize    = 10
    , symbolHeight = 14;

    // Extract cancer types and mutation classes
    var cancerTys = []
    , mutationTys = [];

    for ( var g in gene2transcripts ){
        for ( var T in gene2transcripts[g] ){
            for ( var i = 0; i < gene2transcripts[g][T].mutations.length; i++  ){
                var M = gene2transcripts[g][T].mutations[i];
                if (cancerTys.indexOf(M.cancer) == -1) cancerTys.push( M.cancer );
                if (mutationTys.indexOf(M.ty) == -1) mutationTys.push( M.ty );
            }
        }
    }
    var multiCancer = cancerTys.length > 1
    , numTys = mutationTys.length
    , numRows = Math.ceil(numTys/2);

    // Add the SVG
    var height = numRows * symbolHeight - 2 * margin;
    var svg = el.append("svg")
        .attr("class", "legend")
        .style("width", width)
        .style("height", height + 2*margin)
        .attr("font-size", fontSize);

    var legend = svg.selectAll(".symbol-group")
        .data(mutationTys).enter()
        .append("g")
        .attr("transform", function(d, i){
            var x = (i % numRows) * width / numRows + 2 * margin;
            var y = Math.round(i/numTys) * symbolHeight + (Math.round(i/numTys)+2) * margin;
            return "translate(" + x + ", " + y + ")";
        });

    legend.append("path")
        .attr("class", "symbol")
        .attr("d", d3.svg.symbol()
            .type(function(d, i){ return d3.svg.symbolTypes[mutSymbols[d]]; })
            .size(2*symbolHeight)
        )
        .style("stroke", function(d, i){
            return multiCancer ?  blockColorMedium : coloring["cancer"][cancerTys[0]];
        })
        .style("stroke-width", 2)
        .style("fill", function(d, i){
            return multiCancer ?  blockColorMedium : coloring["cancer"][cancerTys[0]];
        });

    legend.append("text")
        .attr("dx", 7)
        .attr("dy", 3)
        .text(function(d){ return d.replace(/_/g, " "); });

}

