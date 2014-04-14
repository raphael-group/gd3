function transcript_plot(params) {
  var params = params || {},
      style  = params.style || {},
      colorSchemes = style.colorSchemes || {},
      domainDB = params.domainDB || 'PFAM';

  var blockColorLight = style.blockColorLight || '#BDC3C7',
      blockColorMedium = style.blockColorMedium || '#95A5A6',
      highlightColor = style.highlightColor || '#f1c40f',
      textColorStrongest = style.textColorStrongest || '#2C3E50';

  var bgColor = style.bgColor || '#ffffff',
      buttonColor = style.buttonColor || '#666666'
      genomeHeight = style.genomeHeight || 20,
      axisHeight = style.axisHeight || 20,
      height = style.height || 200,
      margin = style.margin || 5,
      numTicks = style.numTicks || 5,
      radius = style.radius || 5,
      legendSymbolHeight = style.legendSymbolHeight || 14,
      tickPadding = style.tickPadding || 1.25,
      width = style.width || 500;

  var resolution = Math.floor(width / (radius*2));

  var showLegend = false,
    allowVerticalPanning = false,
    drawTooltips = false;

  var inactivating = params.inactivating || {
    "Nonsense_Mutation": true,
    "Frame_Shift_Del": true,
    "Frame_Shift_Ins":true,
    "Missense_Mutation": false,
    "Splice_Site": true,
    "In_Frame_Del": false,
    "In_Frame_Ins": false
  };


  var mutSymbols = params.mutSymbols ||
        {
          "Nonsense_Mutation": 0,
          "Frame_Shift_Del": 1,
          "Frame_Shift_Ins": 1,
          "Missense_Mutation": 2,
          "Splice_Site": 3,
          "In_Frame_Del": 4,
          "In_Frame_Ins": 4
  };

  var mutSymbolsToInclude = {};
  Object.keys(mutSymbols).forEach(function(d){ mutSymbolsToInclude[d] = true; })
  var sampleTypeToColor = colorSchemes.sampleType || {};

  // Define globals to be used when filtering the transcript plot by sample type
  var sampleTypeToInclude = {},
      updateTranscript;

  function chart(selection) {
    selection.each(function(data) {
      var geneName = data.gene,
          length = data.length,
          mutations = data.mutations,
          proteinDomains = data.domains[domainDB] || [];

      var dataSet = mutations.slice();

      // Collect all unique types for all samples
      var sampleTypes = [];
      mutations.forEach(function(m){
        if(sampleTypes.indexOf(m.dataset) == -1) {
          sampleTypes.push(m.dataset);
        }
      });
      sampleTypes.sort();
      sampleTypes.forEach(function(d){ sampleTypeToInclude[d] = true; });

      // Assign colors for each type if no type coloration information exists
      if(Object.keys(sampleTypeToColor).length == 0) {
        var colors = d3.scale.category20();
        for (var i = 0; i < sampleTypes.length; i++) {
          sampleTypeToColor[sampleTypes[i]] = colors(i);
        }
      }


      // Select the svg element, if it exists.
      var plotHeight = (height - genomeHeight - axisHeight - 4*margin)/2;
      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
            .style("cursor", "move");

      svg.attr('class', 'transcript-box')
          .attr('id', geneName + '-transcript')
          .attr('width', width)
          .attr('height', height + 2*margin);

      var fig = svg.append("g");

      // Add figure backgrounds
      var background = fig.append('rect')
          .attr('class', 'background')
          .attr('width', width)
          .attr('height', height)
          .style('fill', bgColor);

      var topStart = plotHeight;
      var backgroundTop = fig.append('rect')
          .attr('class', 'background')
          .attr('id', 'background-top')
          .attr('width', width - 2 * margin)
          .attr('height', plotHeight)
          .attr("x", margin)
          .attr("y", margin)
          .style('fill', bgColor);

      var bottomStart = plotHeight + genomeHeight + axisHeight + 3.5 * margin;
      var backgroundBottom = fig.append('rect')
          .attr('class', 'background')
          .attr('id', 'background-bottom')
          .attr('width', width - 2 * margin)
          .attr('height', plotHeight)
          .attr("x", margin)
          .attr("y", plotHeight + genomeHeight + axisHeight + 3 * margin)
          .style('fill', bgColor);

      /////////////////////////////////////////////////////////////////////////
      // Define the zoom behavior
      var start = 0,
        stop = length;

      // X-axis scale and zoom
      var x = d3.scale.linear()
          .domain([start, stop])
          .range([margin, width - margin]);

      var zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 100])
        .on('zoom', function(){ updateTranscript(); }); // MUST be wrapped in another function

      fig.call(zoom);

      // Parameters 
      var symbolHeight = radius * 2,
        maxBinVal = mutations.length;

      // Missense and in-frame scale and zoom
      var topY = d3.scale.linear()
        .domain([0, maxBinVal])
        .range([plotHeight, -1 * symbolHeight * maxBinVal + topStart]);

      var topSliderScale = d3.scale.linear()
            .range([0, symbolHeight * maxBinVal])

      var zoomTop = d3.behavior.zoom()
        .y(topY)
        .scaleExtent([1, 1])
        .on('zoom', function(){ updateTranscript(); } ); // MUST be wrapped in another function

      // Inactivating scale and zoom
      var bottomY = d3.scale.linear()
        .domain([0, maxBinVal])
        .range([bottomStart, bottomStart + maxBinVal * symbolHeight])

      var bottomSliderScale = d3.scale.linear()
            .range([0, symbolHeight * maxBinVal])

      var zoomBottom = d3.behavior.zoom()
        .y(bottomY)
        .scaleExtent([1, 1])
        .on('zoom', function(){ updateTranscript(); } ); // MUST be wrapped in another function

      // Transcript configuration
      var genomeY = 2 * margin + plotHeight;
      var transcript = fig.append('rect')
          .attr('class', 'transcript')
          .attr('height', genomeHeight - margin)
          .attr('width', x(stop) - x(start))
          .attr('x', x(start))
          .attr('y', genomeY + margin/2)
          .style('fill', blockColorLight);

      // xAxis generator
      var xAxis = d3.svg.axis()
          .scale(x)
          .orient('bottom')
          .ticks(numTicks)
          .tickSize(0)
          .tickPadding(tickPadding);

      // Append the axis to the canvas
      var figAxis = fig.append('g')
          .attr('class', 'xaxis')
          .attr('transform', 'translate(5,' + ( genomeY + genomeHeight + margin) +')')
          .style('font-size', '12px')
          .style('fill', '#000')
          .call(xAxis);

      // Add mutation symbols to the figure
      var topSymbols = fig.selectAll('.top-symbols')
          .data(dataSet.filter(function(m){ return !inactivating[m.ty]; }))
          .enter()
          .append('path')
            .attr('class', 'symbols')
            .attr('d', d3.svg.symbol()
              .type(function(d, i) {
                return d3.svg.symbolTypes[mutSymbols[d.ty]];
              })
              .size(radius*radius))
            .style('fill', function(d, i) { return sampleTypeToColor[d.dataset]})
            .style('stroke', function(d, i) { return sampleTypeToColor[d.dataset]; })
            .style('stroke-width', 2)
            .style("cursor", "default");

      var bottomSymbols = fig.selectAll('.bottom-symbols')
          .data(dataSet.filter(function(m){ return inactivating[m.ty]; }))
          .enter()
          .append('path')
            .attr('class', 'symbols')
            .attr('d', d3.svg.symbol()
              .type(function(d, i) {
                return d3.svg.symbolTypes[mutSymbols[d.ty]];
              })
              .size(radius*radius))
            .style('fill', function(d, i) { return sampleTypeToColor[d.dataset]})
            .style('stroke', function(d, i) { return sampleTypeToColor[d.dataset]; })
            .style('stroke-width', 2)
            .style("cursor", "default");

      // Add annotations to the mutations (if necessary)
      if (drawTooltips){
        var tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(function(d, i){
            return d.sample + '<br />Type: ' + d.dataset + "<br/>"
                      + d.ty.replace(/_/g, ' ') + '<br />'
                      + d.locus + ': ' + d.aao + '>' + d.aan;
          });

        svg.call(tip);

        bottomSymbols.on("mouseover", tip.show)
                     .on("mouseout", tip.hide);

        topSymbols.on("mouseover", tip.show)
                  .on("mouseout", tip.hide);
      }


      // Draw domain data with labels with mouse over
      var domainGroups = fig.selectAll('.domains')
          .data(proteinDomains.slice())
          .enter()
          .append('g')
            .attr('class', 'domains');

      var domains = domainGroups.append('rect')
          .attr('id', function(d, i) { return 'domain-' + i; })
          .attr('width', function(d, i) { return x(d.end) - x(d.start); })
          .attr('height', genomeHeight + margin)
          .style('fill', blockColorMedium)
          .style('fill-opacity', .5);

      var domainLabels = domainGroups.append('text')
          .attr('id', function(d, i) { return 'domain-label-' + i; })
          .attr('text-anchor', 'middle')
          .attr('y', genomeHeight)//height/2 + 2.5*margin)
          .style('fill', textColorStrongest)
          .style('fill-opacity', 0)
          .text(function(d, i) { return d.name; });

      domainGroups.on('mouseover', function(d, i) {
        d3.select(this).selectAll('rect').style('fill', highlightColor);
        fig.select('#domain-label-' + i).style('fill-opacity', 1);
      })
      .on('mouseout', function(d, i) {
        d3.select(this).selectAll('rect').style('fill', blockColorMedium);
        fig.select('#domain-label-' + i).style('fill-opacity', 0);
      });


      function renderLegend() {
        var mutationTypes = Object.keys(mutSymbols),
            numTypes = mutationTypes.length,
            numRows = Math.ceil(numTypes/2);

        var legendHeight = numRows * legendSymbolHeight;
        // Select the svg element, if it exists.
        var svg = selection.append('div')
            .selectAll('svg')
            .data([data])
            .enter()
              .append('svg')
              .attr('class', 'legend')
              .attr('font-size', 10)
              .style('height', legendHeight + 2*margin)
              .style('width', width);

        var legend = svg.selectAll('.symbolGroup')
            .data(mutationTypes)
            .enter()
            .append('g')
            .attr('transform', function(d, i) {
              var x = (i % numRows) * width / numRows + 2 * margin;
              var y = Math.round(i/numTypes) * legendSymbolHeight + (Math.round(i/numTypes)+2) * margin;
              return 'translate(' + x + ', ' + y + ')';
            })
            .style("cursor", "pointer")
            .on("click", function(d){
              // Determine if the current symbol is selected
              var active = mutSymbolsToInclude[d],
                opacity = active ? 0.5 : 1;

              // Hide/show the symbol in the legend depending on whether it's active
              d3.select(this).selectAll("*")
                .style("fill-opacity", opacity)
                .style("stroke-opacity", opacity);

              // Update the transcript
              mutSymbolsToInclude[d] = !active;
              updateTranscript();
            });

        legend.append('path')
          .attr('class', 'symbol')
          .attr('d', d3.svg.symbol()
              .type(function(d, i) {return d3.svg.symbolTypes[mutSymbols[d]];})
              .size(2 * legendSymbolHeight)
          )
          .style('stroke', blockColorMedium)
          .style('stroke-width', 2)
          .style('fill', blockColorMedium)

        legend.append('text')
          .attr('dx', 7)
          .attr('dy', 3)
          .text(function(d) { return d.replace(/_/g, ' ')});
      }

      /////////////////////////////////////////////////////////////////////////
      function renderVerticalPanningControls(){
        // Add buttons and sliders to control the y-axes of the two plots

        // Hard-code some variables, including the locations of the sliders/buttons
        var increment = 5, // number of pixels to increment with each click
          buttonRadius = 8, // button size
          UPTRI = 5, // index to access d3's built-in up triangle
          DOWNTRI = 4, // index to access d3's built-in down triangle
          sliderHeight = plotHeight - 2*buttonRadius - 2*margin;
          sliderRadius = 4,
          sliderWidth = 3,
          sliderMargin = margin + buttonRadius;//plotHeight - sliderHeight + margin/2;

        var sliderData = [
              { x: margin, y1: sliderMargin + sliderHeight, y2: sliderMargin,
                direction: "up", z: zoomTop, scale: topSliderScale, name: "topSlider"},
              { x: margin, y1: height - sliderMargin - sliderHeight, y2: height-sliderMargin,
                direction: "down", z: zoomBottom, scale: bottomSliderScale, name: "bottomSlider" }
            ];

        sliderData.forEach(function(d){
          d.y = d.y1;
          d.scale.domain([d.y1, d.y2]);
        });

        var buttonData = [  {y: margin, increment: -increment, symbol: UPTRI, slider: sliderData[0]},
                            {y: sliderMargin + 2*margin + sliderHeight, increment: increment, symbol: DOWNTRI, slider: sliderData[0]},
                            {y: (height - sliderHeight - sliderMargin - 2*margin), increment: -increment, symbol: UPTRI, slider: sliderData[1]},
                            {y: (height - margin), increment: increment, symbol: DOWNTRI, scale: bottomSliderScale, slider: sliderData[1]}
                         ];

        // Add the buttons
        svg.selectAll(".button")
          .data(buttonData).enter()
          .append("path")
          .attr('d', d3.svg.symbol()
            .type(function(d, i) { return d3.svg.symbolTypes[d.symbol]; })
            .size(radius*radius)
          )
          .attr("transform", function(d) {
            return "translate(" + margin + "," + (d.y) + ")";
          })
          .style("cursor", "pointer")
          .style("fill", buttonColor)
          .on("click", function(d){
            var y = moveTo(d.slider, d.slider.y + d.increment);
            panVertically(d3.select("circle#" + d.slider.name), d.slider, y);
          });


        // Define the drag behavior for the sliders
        var drag = d3.behavior.drag()
                    .origin(Object)
                    .on("drag", dragMove)
                    .on('dragend', dragEnd);

        // Add the lines and circles for the sliders
        var g = svg.selectAll('.slider')
                  .data(sliderData).enter()
                  .append('g');

        g.append('line')
          .attr("x1", function(d){ return d.x; })
          .attr("x2", function(d){ return d.x; })
          .attr("y1", function(d){ return d.y1; })
          .attr("y2", function(d){ return d.y2; })
          .style("stroke", "#C0C0C0")
          .style("stroke-width", 2);

        g.append("circle")
            .attr("id", function(d){ return d.name; })
            .attr("r", sliderRadius)
            .attr("cx", function(d){ return d.x; })
            .attr("cy", function(d) { return d.y1; })
            .attr("fill", "#C0C0C0")
            .style("cursor", "pointer")
            .call(drag);

        //
        function panVertically(el, d, y){
          // Translate the whole plot
          el.attr("cy", d.y = y);
          d.z.translate([d.z.translate()[0], d.direction == "up" ? d.scale(d.y) : -d.scale(d.y)]);
          updateTranscript();

        }

        function moveTo(d, y){
          // Calculate how far to move the slider
          if (d.direction == "up"){
            return Math.max(d.y2, Math.min(d.y1, y));  
          }
          else{
            return Math.max(d.y1, Math.min(d.y2, y));  
          }
        }

        // Define the dragging behavior for the sliders
        function dragMove(d) {
          // Fade the slider while it's moving
          d3.select(this).attr("opacity", 0.6);

          // Then pan appropriately
          panVertically(d3.select(this), d, moveTo(d, d3.event.y));
        }

        function dragEnd() {
            d3.select(this).attr('opacity', 1)
        }
         
      }

      /////////////////////////////////////////////////////////////////////////
      updateTranscript = function() {
        // Restrict the x-axis domain from going below 0
        var t = zoom.translate(),
            scale = zoom.scale(),
            tx = t[0],
            ty = t[1];

        tx = Math.min(tx, 0);

        zoom.translate([tx, ty]);

        // Stack mutations if there exist more than one per location
        var minX = d3.min(x.domain()),
            maxX = d3.max(x.domain()),
            curRes = Math.round( (maxX - minX)/resolution );

        curRes = curRes ? curRes : 1;

        function stackSymbols(symbols, y, minY, maxY){
          // Record the number of symbols at each index
          var binToCount = {};
          symbols.filter(function(d){
            return mutSymbolsToInclude[d.ty] && sampleTypeToInclude[d.dataset];
          })
          .each(function(d){
            // Assign the current mutation to a bin
            var bin = Math.round(d.locus/curRes);

            // Increase the count of the number of mutations in that bin
            if (bin in binToCount){
              yIndex = binToCount[bin];
              binToCount[bin] += 1;
            }
            else{
              yIndex = 0;
              binToCount[bin] = 1;
            }
            d.x = x(bin * curRes);
            d.y = y(yIndex);

          });

          // Find the max stack/bin size, and update the slider scales
          maxBinVal = d3.max(Object.keys(binToCount), function(b){ return binToCount[b]; })
          topSliderScale.range([0, symbolHeight * maxBinVal]);
          bottomSliderScale.range([0, symbolHeight * maxBinVal]);

          // render mutation glpyhs and move/color them
          symbols.attr('transform', function(d, i) { return 'translate(' + d.x + ', ' + d.y + ')'; })
              .style('fill-opacity', 1)
              .style('stroke-opacity', 1);

          // Ignore everything that is outside of the boundary
          symbols.filter(function(d, i) {
              var inViewPort = ((minY < d.y && maxY > d.y) && (minX < d.locus && maxX > d.locus)),
                  mutTypeIncluded = mutSymbolsToInclude[d.ty],
                  sampleTypeIncluded = sampleTypeToInclude[d.dataset];
              return !(inViewPort && mutTypeIncluded && sampleTypeIncluded);
            })
            .style('fill-opacity', 0)
            .style('stroke-opacity', 0);
        }

        // 
        stackSymbols( topSymbols, topY, 0, plotHeight + margin);
        stackSymbols( bottomSymbols, bottomY, bottomStart - margin, height - 2*margin);

        // update the axis
        figAxis.call(xAxis);

        // update the transcript
        transcript.attr('x', x(start)).attr('width', x(stop) - x(start));

        // Update the domains
        domainGroups.attr('transform', function(d, i) {
          return 'translate(' + x(d.start) + ',' + (genomeY - margin/2) + ')';
        });

        domains.attr('width', function(d, i) { return x(d.end) - x(d.start); });

        domainLabels.attr('x', function(d, i) {
          var w = d3.select(this.parentNode).select('rect').attr('width');
          return w/2;
        });

      } // end updateTranscript

      updateTranscript();

      if(showLegend) {
        renderLegend();
      }
      if (allowVerticalPanning){
        renderVerticalPanningControls()
      }
    });
  } // end chart()

  chart.addLegend = function() {
    showLegend = true;
    return chart;
  }

 chart.addTooltips = function() {
    drawTooltips = true;
    return chart;
  }

  chart.addVerticalPanning = function() {
      allowVerticalPanning = true;
      return chart;

  }

  chart.filterDatasets = function(datasetToInclude) {
    Object.keys(datasetToInclude).forEach(function(d){
      sampleTypeToInclude[d] = datasetToInclude[d];
    });
    updateTranscript();
  }
  
  return chart;
}