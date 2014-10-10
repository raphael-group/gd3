function heatmap (params) {
  var params = params || {},
      style  = params.style || {};

  // Style options
  var cellHeight = style.cellHeight || 14,
      cellWidth = style.cellWidth || 14,
      fontFamily = style.fontFamily || 'sans-serif',
      fontSize = style.fontSize || '10px',
      height = style.height || 400,
      margins = style.margins || {bottom: 0, left: 0, right: 0, top: 0},
      width = style.width || 400,
      sampleAnnotationSpacer = style.sampleAnnotationSpacer || 5;

  // Rendering flags
  var renderXLabels = false,
      renderYLabels = false,
      renderLegend = false,
      makeLegendHorizontal = true;

  // Sample annotation information
  var annotationData,
      showSampleAnnotations = false;

  function chart(selection) {
    selection.each(function(data) {
      // Select the svg element, if it exists.
      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
              .attr('id', 'figure')
              .attr('height', height + margins.top + margins.bottom)
              .attr('width', width + margins.left + margins.right)
              .style('font-family', fontFamily)
              .style('font-size', fontSize);

      var fig = svg.append('g')
          .attr('transform','translate('+margins.left+','+margins.top+')');

      var cells = data.cells,
          xs = data.xs,
          ys = data.ys;

      // Find max and min values to make color scale
      var min = Number.POSITIVE_INFINITY,
          max = Number.NEGATIVE_INFINITY,
          tmp;
      for (var i=cells.length-1; i>=0; i--) {
          tmp = cells[i].value;
          if (tmp < min) min = tmp;
          if (tmp > max) max = tmp;
      }

      //- Orange/yellow colors
      // var colors = ['#ffeda0','#f03b20'],

      // Yellow-green-blue
      //console.log(min, max, d3.range(min, max, (max-min)/12))
      var colors = ["rgb(58, 76, 247)", "rgb(0, 78, 247)", "rgb(82, 137, 248)", "rgb(150, 225, 250)",
                    "rgb(169, 242, 91)", "rgb(170, 241, 56)", "rgb(192, 243, 61)", "rgb(241, 246, 72)",
                    "rgb(255, 247, 76)", "rgb(245, 223, 91)", "rgb(241, 214, 131)", "rgb(243, 222, 182)"],
          numColors = colors.length,
          step = (max-min)/numColors,
          color = d3.scale.linear()
              .domain(d3.range(min, max + step, (max+step-min)/numColors))
              .range(colors);

      var heatmap = fig.append('g').attr('class','vizHeatmap');

      var heatmapCells = heatmap.selectAll('rect')
              .data(cells)
              .enter()
              .append('rect')
                .attr('data-value', function(d) { return d.value; });

      var mouseoverLinesG = heatmap.append('g').attr('class', 'vizHeatmapMouseoverLines');
      var mouseoverLine1 = mouseoverLinesG.append('line'),
          mouseoverLine2 = mouseoverLinesG.append('line'),
          mouseoverLine3 = mouseoverLinesG.append('line'),
          mouseoverLine4 = mouseoverLinesG.append('line');

      var legendG = fig.append('g'),
          legendBarG = legendG.append('g');
      var legendRefLine = legendG.append('line');

      heatmap.on('mouseout', function(d) {
        mouseoverLine1.style('stroke', 'none');
        mouseoverLine2.style('stroke', 'none');
        mouseoverLine3.style('stroke', 'none');
        mouseoverLine4.style('stroke', 'none');
        legendRefLine.style('stroke','none')
      });

      heatmapCells
          .attr('x', function(d){return xs.indexOf(d.x)*cellWidth})
          .attr('y', function(d){return ys.indexOf(d.y)*cellHeight})
          .attr('height', cellHeight)
          .attr('width', cellWidth)
          .style('fill', function(d){return color(d.value)})
          .on('mouseover', function(d,i) {
            d3.select('#vizHeatmapXLabel'+d.x).style('fill','#f00').style('font-weight','bold');
            d3.select('#vizHeatmapYLabel'+d.y).style('fill','#f00').style('font-weight','bold');
            d3.select(this).style('stroke', 'black').style('stroke-width', 2);
            var dX = xs.indexOf(d.x),
                dY = ys.indexOf(d.y);

            var refLineScalar = d.value/max;
            legendRefLine.attr('y1',ys.length*cellHeight-(refLineScalar*ys.length*cellHeight))
                .attr('y2',ys.length*cellHeight-(refLineScalar*ys.length*cellHeight))
                .style('stroke', 'black');

            // Fix for mouseout of heatmap causing stroke to be set to none
            if (mouseoverLine1.style('stroke') == 'none') mouseoverLine1.style('stroke', 'black');
            if (mouseoverLine2.style('stroke') == 'none') mouseoverLine2.style('stroke', 'black');
            if (mouseoverLine3.style('stroke') == 'none') mouseoverLine3.style('stroke', 'black');
            if (mouseoverLine4.style('stroke') == 'none') mouseoverLine4.style('stroke', 'black');

            if (mouseoverLine1.attr('row') != dY) {
              mouseoverLine1
                .attr('x1', 0)
                .attr('x2', cellWidth*xs.length)
                .attr('y1', dY*cellHeight)
                .attr('y2', dY*cellHeight)
                .style('stroke', 'black')
                .style('stroke-width', '1px')
                .attr('row',dY);
              mouseoverLine2
                  .attr('x1', 0)
                  .attr('x2', cellWidth*xs.length)
                  .attr('y1', dY*cellHeight+cellHeight)
                  .attr('y2', dY*cellHeight+cellHeight)
                  .style('stroke', 'black')
                  .style('stroke-width', '1px')
                  .attr('row',dY);
            }
            if (mouseoverLine3.attr('col') != dX) {
              mouseoverLine3
                .attr('x1', dX*cellWidth)
                .attr('x2', dX*cellWidth)
                .attr('y1', 0)
                .attr('y2', cellHeight*ys.length)
                .style('stroke', 'black')
                .style('stroke-width', '1px')
                .attr('col', dX);
              mouseoverLine4
                .attr('x1', dX*cellWidth+cellWidth)
                .attr('x2', dX*cellWidth+cellWidth)
                .attr('y1', 0)
                .attr('y2', cellHeight*ys.length)
                .style('stroke', 'black')
                .style('stroke-width', '1px')
                .attr('col', dX);
            }
          })
          .on('mouseout', function(d) {
            d3.select('#vizHeatmapXLabel'+d.x).style('fill','#000').style('font-weight','normal');
            d3.select('#vizHeatmapYLabel'+d.y).style('fill','#000').style('font-weight','normal');
            d3.select(this).style('stroke', 'none');
          });


      // Add sample annotation cells if they exist
      if (showSampleAnnotations) {
        function ValOrNoData(val){
          if (val == "" || val == null) return "No data";
          else return val;
        }

        var categories = annotationData.categories || [],
              sampleAs = annotationData.sampleToAnnotations || {},
              aColors = annotationData.annotationToColor || {},
              samples = Object.keys(sampleAs);

          // Assign colors for each annotation
          var annotationColors = {};

          categories.forEach(function(c, i){
            var isNumeric = true,
                data = [],
                values = [];

            Object.keys(sampleAs).forEach(function(s){
                // Determine if the value is numeric
                var ty = typeof(sampleAs[s][i]) === 'number';
                isNumeric = isNumeric && ty;

                // Replace blank values with "No data"
                var val = ValOrNoData(sampleAs[s][i]);

                // Record the value
                data.push(val);
                if (isNumeric) values.push(sampleAs[s][i]);
              });

            // Doesn't matter if there are no numeric values, d3.max and d3.min
            // can handle it and will return null
            var d = {min: d3.min(values), max: d3.max(values) };

            // Assign colors to all annotations
            var scale;
            aColors[c]["No data"] = "#333"; // all blank annotations are assigned this color
            if(isNumeric) {
              scale = d3.scale.linear()
                .domain([d.min, d.max])
                .range(['#fcc5c0','#49006a'])
                .interpolate(d3.interpolateLab);
              scale.type = "linear";
            } else {
              // Assign a unique color to each unique annotation value
              var uniqItems = data.filter(function(item, pos) {
                return data.indexOf(item) == pos;
              });
              var uniqColors = uniqItems.map(function(d){
                if (aColors[c] && aColors[c][d]) return aColors[c][d];
                else return '#' + Math.floor(Math.random()*16777215).toString(16); // uniform at random color
              });

              // Use an ordinal scale to map each item to a color
              scale = d3.scale.ordinal()
                .domain(uniqItems)
                .range(uniqColors);
              scale.type = "ordinal";
            }
            annotationColors[c] = scale;
        });

        // Draw annotation information
        var categoryRows = heatmap.selectAll(".category-row")
          .data(categories).enter()
          .append("g");

        var annotationCells = categoryRows.selectAll('.sample-annotation-rect')
            .data(function(c, i){
              return samples.map(function(s){
                return { x: xs.indexOf(s), y: i, value: ValOrNoData(sampleAs[s][i]) };
              }).filter(function(d){ return d.x >= 0; })
            }).enter()
            .append('rect')
              .attr('height', cellHeight)
              .attr('width', cellWidth)
              .attr('x', function(d) { return d.x * cellWidth; })
              .attr('y', function(d) { return sampleAnnotationSpacer + d.y*cellHeight + ys.length*cellHeight; })
              .style('fill', function(d,i) { return annotationColors[categories[d.y]](d.value); });
      }

      // Group for yLabels placement
      var yLabelsG = fig.append('g').attr('class','vizHeatmapYLabels');

      // Add labels to the y axis
      if (renderYLabels) {
        var fontSizeInt = parseInt(fontSize.replace('px','')),
            yLabelData = ys.map(function(d){ return { dy: 0, name: d}})
                           .concat(categories.map(function(d){ return {dy: sampleAnnotationSpacer, name: d}; }));

        yLabelsG.selectAll('text')
          .data(yLabelData).enter()
            .append('text')
              .attr('id', function(d,i){return 'vizHeatmapYLabel'+i})
              .attr('text-anchor','end')
              .attr('y', function(d,i) {return d.dy + i*cellHeight + cellHeight/2+fontSizeInt/2})
              .text(function(d){return d.name});
        yLabelsG.selectAll('text')
          .attr('x',yLabelsG.node().getBBox().width-2);
        heatmap.attr('transform','translate('+(yLabelsG.node().getBBox().width+2)+',0)');
      }

      // Add labels to the x axis
      var xLabelsG = fig.append('g')
          .attr('class','vizHeatmapXLabels')
          .attr('transform', 'translate(0,'+heatmap.node().getBBox().height+')');
      if (renderXLabels) {
        var fontSizeInt = parseInt(fontSize.replace('px',''));
        xLabelsG.selectAll('text')
          .data(xs)
          .enter()
            .append('text')
              .attr('id', function(d,i){return 'vizHeatmapXLabel'+i})
              .attr('transform', function(d,i) {
                var x = i*cellWidth + cellWidth/2 + yLabelsG.node().getBBox().width;
                return 'translate('+x+',3)rotate(90)'
              })
              .text(function(d){return d});
      }

      // Add legend
      if (renderLegend) {
        var legendWidth = cellWidth < 10 ? 10 : cellWidth,
            legendHeight = makeLegendHorizontal ? d3.max([ys.length * cellWidth, 250]) : xs.length * cellHeight;

        legendRefLine.attr('x1',0)
            .attr('x2',legendWidth)
            .attr('y1',(xs.length*cellHeight)/2)
            .attr('y2', (xs.length)*cellHeight/2)
            .style('stroke','black')
            .style('stroke-width', 2);

        var xMod = 10;
        if(makeLegendHorizontal) {
          xMod += xLabelsG.node().getBBox().height + heatmap.node().getBBox().height + 10;
          legendG.attr('transform','translate(0,' + xMod + ') rotate(-90)');
        } else {
          xMod += margins.left + width;
          legendG.attr('transform','translate(' + xMod + ',0)');
        }
        var legend = legendBarG.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill','red');

        var gradient = legendBarG.append("svg:defs")
              .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "0%")
                .attr("y2", "0%");

        colors.reverse().forEach(function(c, i){
          gradient.append("svg:stop")
              .attr("offset", i*1./numColors)
              .attr("stop-color", c)
              .attr("stop-opacity", 1);
        })

        legend.style('fill', 'url(#gradient)');

        legendBarG.append('text')
            .attr('x', 0)
            .attr('y', legend.attr('width'))
            .attr('transform', 'rotate(90)')
            .text(min);

        legendBarG.append('text')
            .attr('x', legend.attr('height'))
            .attr('y', legend.attr('width'))
            .attr('transform', 'rotate(90)')
            .attr('text-anchor', 'end')
            .text(max)

        if (makeLegendHorizontal){
          legendBarG.append('text')
              .attr('x', legend.attr('height')/2)
              .attr('y', legend.attr('width'))
              .attr('transform', 'rotate(90)')
              .attr('text-anchor', 'middle')
              .text(data.name + " value");
        }

        var mouseScrubRegion = legendBarG.append('rect').style('fill', 'black');
        legend.on('mousemove', function(d,i) {
          // legendYOffset assumes that parent groups of legendG do not translate Y
          //    if this does not hold, than there will be bugs with this function
          var mouse = d3.mouse(this),
              legendYOffset = parseFloat(legendG.attr('transform').replace('translate(','').split(',')[1].replace(')','')),
              legendYLoc = makeLegendHorizontal ? mouse[1] : mouse[1] - legendYOffset,
              loc = 1 - legendYLoc / legend.attr('height'),
              locValue = loc*max,
              scrubError = max/40;

          var unitScalar = legend.attr('height') / parseFloat(max),
              scrubHeight = 2*(unitScalar*scrubError),
              scrubY = legendYLoc-unitScalar*scrubError;
          scrubHeight = scrubHeight + scrubY > legend.attr('height') ? scrubHeight - Math.abs(scrubHeight+scrubY - legend.attr('height')) : scrubHeight;

          // if(makeLegendHorizontal) {
          //   scrubY = mouse[1] - unitScalar*scrubError;
          // }

          mouseScrubRegion.attr('x', legend.attr('x')+cellWidth)
              .attr('y', scrubY)
              .attr('width', 5)
              .attr('height', scrubHeight)
              .style('fill', 'black');

          heatmapCells.style('stroke', function(d) {
                return Math.abs(d.value - locValue) < scrubError ? 'black' : 'none'
              })
              .style('stroke-width', 1);
          // TODO make cells highlight that have the same value as what is being mouse overed
        });
        legend.on('mouseout', function() {
          heatmapCells.style('stroke', 'none');
          //mouseScrubRegion.style('fill', 'none');
        });
      }// end renderLegend

      // Resize SVG based on its content
      svg.attr('height', fig.node().getBBox().height);
      //svg.attr('width', fig.node().getBBox().width);

      var heatmapStartX = parseFloat(heatmap.attr('transform').split('translate(')[1].split(',')[0]),
          heatmapW = heatmap.node().getBBox().width;
      var zoom = d3.behavior.zoom()
          .on('zoom', function() {
            var t = zoom.translate(),
                tx = t[0];

            heatmap.attr('transform', 'translate('+(tx + heatmapStartX)+',0)');

            var xLabelsGy = xLabelsG.attr('transform').split('translate(')[1].split(',')[1].split(')')[0];
            xLabelsG.attr('transform', 'translate('+tx+','+xLabelsGy+')');

          });
      svg.call(zoom);
    });// end selection.each();
  } // end chart()

  chart.addXLabels = function() {
    renderXLabels = true;
    return chart;
  }

  chart.addYLabels = function() {
    renderYLabels = true;
    return chart;
  }

  chart.addLegend = function () {
    renderLegend = true;
    return chart;
  }

  chart.addSampleAnnotations = function(data) {
    annotationData = data || {};
    // only show sample annotations if the data exists
    if (annotationData.sampleToAnnotations) showSampleAnnotations = true;
    return chart;
  }

  return chart;
}