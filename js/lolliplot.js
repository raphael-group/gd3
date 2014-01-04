function lolliplots(params) {
  var params = params || {},
      style  = params.style || {},
      colorSchemes = style.colorSchemes || {},
      domainDB = params.domainDB || 'PFAM';

  var blockColorLight = style.blockColorLight || '#BDC3C7',
      blockColorMedium = style.blockColorMedium || '#95A5A6',
      highlightColor = style.highlightColor || '#f1c40f',
      textColorStrongest = style.textColorStrongest || '#2C3E50';

  var bgColor = style.bgColor || '#ffffff',
      genomeHeight = style.genomeHeight || 20,
      height = style.height || 200,
      margin = style.margin || 5,
      numTicks = style.numTicks || 5,
      radius = style.radius || 5,
      legendSymbolHeight = style.legendSymbolHeight || 14,
      tickPadding = style.tickPadding || 1.25,
      width = style.width || 500;

  var resolution = Math.floor(width / (radius*2));

  var showLegend = false;

  var inactivating = params.inactivating || {
    "Nonsense_Mutation": true,
    "Frame_Shift_Del": true,
    "Frame_Shift_Ins":true,
    "Missense_Mutation": false,
    "Splice_Site": true,
    "In_Frame_Del": false,
    "In_Frame_Ins": false
  };

  // TODO find a more elegant way to do this
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

  // TODO find a more elegant way to do this
  //var sampleTypes = colorSchemes.sampleType || {};
  var sampleTypes = params.sampleTypes ||
        [
          "EBV",
          "BLCA",
          "BRCA",
          "COADREAD",
          "GBM",
          "SCNAL",
          "HNSC",
          "KIRC",
          "LAML",
          "LUAD",
          "LUSC",
          "SCNAH",
          "UCEC",
          "OV",
          "GASTRIC"
        ];
  var sampleTypeToColor = {};

  function chart(selection) {
    selection.each(function(data) {
      var geneName = data.gene,
          length = data.length,
          mutations = data.mutations,
          proteinDomains = data.domains[domainDB];

      var dataSet = mutations.slice();

      // Assign colors for each type if no type coloration information exists
      if(Object.keys(sampleTypeToColor).length == 0) {
        var colors = d3.scale.category20();
        for (var i = 0; i < sampleTypes.length; i++) {
          sampleTypeToColor[sampleTypes[i]] = colors(i);
        }
      }


      // Select the svg element, if it exists.
      var fig = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg');

      fig.attr('class', 'lollibox')
          .attr('id', geneName + '-transcript')
          .attr('width', width)
          .attr('height', height + 2*margin);

      // Zoom scale
      var start = 0,
          stop = length;

      var x = d3.scale.linear()
          .domain([start, stop])
          .range([margin, width - margin]);

      var sequenceScale = d3.scale.linear()
          .domain([start, stop])
          .range([0, length]);

      // Define zoom behavior
      var zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 100])
        .on('zoom', function() { updateTranscript()});
      fig.call(zoom);

      // Add figure background
      var background = fig.append('rect')
          .attr('class', 'background')
          .attr('width', width)
          .attr('height', height)
          .style('fill', bgColor);

      // Transcript configuration
      var transcript = fig.append('rect')
          .attr('class', 'transcript')
          .attr('height', genomeHeight - margin)
          .attr('width', x(stop) - x(start))
          .attr('x', x(start))
          .attr('y', height/2)
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
          .attr('transform', 'translate(5,' + ( height/2 + genomeHeight+2) +')')
          .style('font-size', '12px')
          .style('fill', '#000')
          .call(xAxis);

      // Add mutation symbols to the figure
      var symbols = fig.selectAll('.symbols')
          .data(dataSet)
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
            .style('stroke-width', 2);

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
        var multiDataset = sampleTypes.length > 1,
            mutationTypes = Object.keys(mutSymbols),
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
            });

        legend.append('path')
          .attr('class', 'symbol')
          .attr('d', d3.svg.symbol()
              .type(function(d, i) {return d3.svg.symbolTypes[mutSymbols[d]];})
              .size(2 * legendSymbolHeight)
          )
          .style('stroke', function(d, i) {
            return multiDataset ? blockColorMedium : sampleTypeToColor[sampleTypes[0]];
          })
          .style('stroke-width', 2)
          .style('fill', function(d, i) {
            return multiDataset ? blockColorMedium : sampleTypeToColor[sampleTypes[0]];
          });

        legend.append('text')
          .attr('dx', 7)
          .attr('dy', 3)
          .text(function(d) { return d.replace(/_/g, ' ')});
      }


      function updateTranscript() {
        // Current scope of zoom
        var curMin = d3.min(x.domain()),
            curMax = d3.max(x.domain()),
            curRes = Math.round( (curMax - curMin)/resolution );

        curRes = curRes ? curRes : 1;

        // Stack mutations if there exist more than one per location
        var bottomIndex = {},
            topIndex = {},
            pX = {},
            pY = {};

        var endIter = Math.ceil(curMax/curRes) + 5;
            startIter = Math.floor(curMin/curRes) - 5;
        for (var i = startIter; i < endIter; i++) {
          bottomIndex[i] = 0;
          topIndex[i] = 0;
        }

        // render mutation glpyhs and move/color them
        symbols.attr('transform', function(d, i) {
              var indexDict = inactivating[d.ty] ? bottomIndex : topIndex,
                  curIndex = Math.round(d.locus/curRes),
                  px = x(curIndex*curRes),
                  py;

              if ( inactivating[d.ty]) {
                py = height/2 + (genomeHeight + indexDict[curIndex] * radius * 2
                    + 3 * margin + 10);
              } else {
                py = height/2 - (indexDict[curIndex] * radius * 2 + 3 * margin + 5);
              }

              indexDict[curIndex]++;

              // Store the x and y values
              pX[i] = px;
              pY[i] = py;

              return 'translate(' + px + ', ' + py + ')';
            })// end symbols.attr('transform')
            .style('fill', function(d) { return sampleTypeToColor[d.dataset]; })
            .style('fill-opacity', 1)
            .style('stroke', function(d) { return sampleTypeToColor[d.dataset]; })
            .style('stroke-opacity', 1);

        if (symbols.tooltip) {
          symbols.tooltip(function(d, i) {
              var tip = d.sample + '<br />' + d.ty.replace(/_/g, ' ') + '<br />'
                      + d.locus + ': ' + d.aao + '>' + d.aan;

              return {
                detection: 'shape',
                displacement: [3, -25],
                gravity: 'right',
                mousemove: false,
                placement: 'fixed',
                position: [pX[i], pY[i]],
                text: tip,
                type: 'tooltip'
              };
          });
        } // end if symbols.tooltip

        // Ignore everything that is outside of the boundary
        symbols.filter(function(d, i) { return !(curMin < d.locus && curMax > d.locus); })
            .style('fill-opacity', 0)
            .style('stroke-opacity', 0);

        // update the axis
        figAxis.call(xAxis);

        // update the transcript
        transcript.attr('x', x(start)).attr('width', x(stop) - x(start));

        // Update the domains
        domainGroups.attr('transform', function(d, i) {
          return 'translate(' + x(d.start) + ',' + (height/2 - margin) + ')';
        });

        domains.attr('width', function(d, i) { return x(d.end) - x(d.start); });

        domainLabels.attr('x', function(d, i) {
          var w = d3.select(this.parentNode).select('rect').attr('width');
          return w/2;
        })
      } // end updateTranscript

      updateTranscript();

      if(showLegend) {
        renderLegend();
      }
    });
  } // end chart()

  chart.addLegend = function() {
    showLegend = true;
    return chart;
  }

  return chart;
}