function heatmap (params) {
  var params = params || {},
      style  = params.style || {};

  // Style options
  var cellHeight = style.cellHeight || 20,
      cellWidth = style.cellWidth || 20,
      fontFamily = style.fontFamily || 'sans-serif',
      fontSize = style.fontSize || '10px',
      height = style.height || 400,
      margins = style.margins || {bottom: 0, left: 0, right: 0, top: 0},
      width = style.width || 400;

  // Rendering flags
  var renderXLabels = false,
      renderYLabels = false,
      renderLegend = false;

  function chart(selection) {
    selection.each(function(data) {
      console.log(data);
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

      var colors = ['#ffeda0','#f03b20'],
          color = d3.scale.linear()
              .domain([min, max])
              .range(colors);

      var heatmap = fig.append('g').attr('class','vizHeatmap');

      var heatmapCells = heatmap.selectAll('rect')
              .data(cells)
              .enter()
              .append('rect')

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
            var dX = d.x,
                dY = d.y;

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

      // Group for yLabels placement
      var yLabelsG = fig.append('g').attr('class','vizHeatmapYLabels');

      // Add labels to the y axis
      if (renderYLabels) {
        var fontSizeInt = parseInt(fontSize.replace('px',''));
        yLabelsG.selectAll('text')
          .data(ys)
          .enter()
            .append('text')
              .attr('id', function(d,i){return 'vizHeatmapYLabel'+i})
              .attr('text-anchor','end')
              .attr('y', function(d,i) {return i*cellHeight + cellHeight/2+fontSizeInt/2})
              .text(function(d){return d});
        yLabelsG.selectAll('text')
          .attr('x',yLabelsG.node().getBBox().width);
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
        var legendWidth = cellWidth < 10 ? 10 : cellWidth;
        legendRefLine.attr('x1',0)
            .attr('x2',legendWidth)
            .attr('y1',(xs.length*cellHeight)/2)
            .attr('y2', (xs.length)*cellHeight/2)
            .style('stroke','black')
            .style('stroke-width', 2);

        var xMod = parseFloat(heatmap.attr('transform').replace('translate(','').split(',')[0]);
        xMod = xMod + heatmap.node().getBBox().width + 10;
        legendG.attr('transform','translate('+xMod+',0)');
        var legend = legendBarG.append('rect')
            .attr('width', legendWidth)
            .attr('height', xs.length*cellHeight)
            .style('fill','red');

        var gradient = legendBarG.append("svg:defs")
              .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "0%")
                .attr("y2", "0%");

        gradient.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", colors[0])
            .attr("stop-opacity", 1);

        if(colors.length == 2) {
          gradient.append("svg:stop")
              .attr("offset", "100%")
              .attr("stop-color", colors[1])
              .attr("stop-opacity", 1);
        } else {
          gradient.append("svg:stop")
              .attr("offset", "50%")
              .attr("stop-color", colors[1])
              .attr("stop-opacity", 1);

          gradient.append("svg:stop")
              .attr("offset", "100%")
              .attr("stop-color", colors[2])
              .attr("stop-opacity", 1);
        }

        legend.style('fill', 'url(#gradient)');

        var mouseScrubRegion = legendBarG.append('rect').style('fill', 'black');
        legend.on('mousemove', function(d,i) {
          // legendYOffset assumes that parent groups of legendG do not translate Y
          //    if this does not hold, than there will be bugs with this function
          var mouse = d3.mouse(this),
              legendYOffset = parseFloat(legendG.attr('transform').replace('translate(','').split(',')[1].replace(')','')),
              legendYLoc = mouse[1] - legendYOffset,
              loc = 1 - legendYLoc / legend.attr('height'),
              locValue = loc*max,
              scrubError = max/40;

          var unitScalar = legend.attr('height') / parseFloat(max),
              scrubHeight = 2*(unitScalar*scrubError),
              scrubY = legendYLoc-unitScalar*scrubError;
          scrubHeight = scrubHeight + scrubY > legend.attr('height') ? scrubHeight - Math.abs(scrubHeight+scrubY - legend.attr('height')) : scrubHeight;

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
      }
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

  return chart;
}