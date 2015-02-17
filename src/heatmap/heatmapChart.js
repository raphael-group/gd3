import "heatmapData";

function heatmapChart(style) {
  var renderAnnotations = true,
      renderLegend = true,
      renderXLabels = true,
      renderYLabels = true;

  function chart(selection) {
    selection.each(function(data) {
      data = heatmapData(data);

      var width = style.width;

      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
                .attr('width', width)
                .style('font-family', style.fontFamily)
                .style('font-size', style.fontFamily);

      var svgGroup = svg.append('g');

      var cells = data.cells,
          xs = data.xs,
          ys = data.ys;

      // colorDomain is necessary to have multihue ranges for the scale
      var colorDomain = d3.range(data.minCellValue, data.maxCellValue,
                  (data.maxCellValue-data.minCellValue)/style.colorScale.length)
              .concat([data.maxCellValue]),
          colorScale = d3.scale.linear()
              .domain(colorDomain)
              .range(style.colorScale)
              .interpolate(d3.interpolateLab);

      var heatmap = svgGroup.append('g').attr('class', 'gd3heatmapCellsContainer');

      var heatmapCells = heatmap.append('g').attr('class', 'gd3heatmapCells').selectAll('.rect')
          .data(cells)
          .enter()
          .append('rect')
              .attr('height', style.cellHeight)
              .attr('width', style.cellWidth)
              .attr('x', function(d, i) { return data.xs.indexOf(d.x) * style.cellWidth; })
              .attr('y', function(d, i) { return data.ys.indexOf(d.y) * style.cellHeight; })
              .style('fill', function(d) {
                return d.value == null ? style.noCellValueColor : colorScale(d.value);
              });

      heatmapCells.append('title').text(function(d) {
        return ['x: ' + d.x, 'y: ' + d.y, 'value: ' + (d.value == null ? 'No data' : d.value)]
            .join('\n');
      });

      // define guide lines for mouse interaction to find cell location
      var guidelineData = [
        {x1: 0, y1: 0, x2: 0, y2: 0},
        {x1: 0, y1: 0, x2: 0, y2: 0},
        {x1: 0, y1: 0, x2: 0, y2: 0},
        {x1: 0, y1: 0, x2: 0, y2: 0}
      ];

      var guidelinesG = svgGroup.append('g').attr('class', 'gd3heatmapGuidlines'),
          guidelines = guidelinesG.selectAll('line')
              .data(guidelineData)
              .enter()
              .append('line')
                  .style('stroke', '#000')
                  .style('stroke-width', 1);

      heatmapCells.on('mouseover.dispatch-sample', function(cell) {
        var xOffset = +heatmap.attr('transform').replace(')','').replace('translate(','').split(',')[0];
        var thisEl = d3.select(this),
            h = +thisEl.attr('height'),
            w = +thisEl.attr('width'),
            x = (+thisEl.attr('x')) + xOffset,
            y = +thisEl.attr('y');

        var visibleHeight = +heatmap.node().getBBox().height,
            visibleWidth = +heatmap.node().getBBox().width + xOffset;

        guidelines.each(function(d,i) {
          var line = d3.select(this);
          if(i == 0) line.attr('x1',0).attr('x2',style.width).attr('y1',y).attr('y2',y);
          if(i == 1) line.attr('x1',0).attr('x2',style.width).attr('y1',y+h).attr('y2',y+h);
          // if(i == 2) line.attr('x1',x).attr('x2',x).attr('y1',0).attr('y2',visibleHeight);
          // if(i == 3) line.attr('x1',x+w).attr('x2',x+w).attr('y1',0).attr('y2',visibleHeight);
        });

        // Update the legend reference line's position, hiding it
        // if the cell has no value
        if (renderLegend){
          if (cell.value){
            var lineLoc = legendScale(cell.value);
            legendRefLine.attr('x1', lineLoc)
                .attr('x2', lineLoc)
                .style('opacity', 1);
          } else {
            legendRefLine.style('opacity', 0);
          }
        }
        thisEl.style('stroke', '#000').style('stroke-width', 1);

        gd3.dispatch.sample({ sample: cell.x, over: true});

      }).on('mouseout.dispatch-sample', function(cell) {
        guidelines.attr('x1',0).attr('x2',0).attr('y1',0).attr('y2',0);
        if (renderLegend) legendRefLine.style("opacity", 0);
        d3.select(this).style('stroke', 'none');
        gd3.dispatch.sample({ sample: cell.x, over: false});
      }).on('click.dispatch-mutation', function(cell){
        gd3.dispatch.mutation({
          gene: cell.y,
          dataset: data.columnIdToDataset[cell.x],
          mutation_class: "expression"
        })
      })

      var legendG = svgGroup.append('g');

      yLabelsG = svgGroup.append('g').attr('class', 'gd3heatmapYLabels');

      if (renderYLabels) renderYLabelsFn();
      if (renderAnnotations) renderAnnotationsFn();
      if (renderXLabels) renderXLabelsFn();
      if (renderLegend) renderLegendFn();

      // Configure panning and zoom for the chart
      var heatmapTranslate = heatmap.attr('transform') || 'translate(0,0)',
          heatmapStartX = +heatmapTranslate.replace(')','').replace('translate(','').split(',')[0],
          heatmapW = heatmap.node().getBBox().width;

      var zoom = d3.behavior.zoom().on('zoom', function() {
          var t = zoom.translate(),
              tx = t[0];

          heatmap.attr('transform', 'translate('+(tx + heatmapStartX)+',0)');

          // Fade out/in heatmap and annotation cells that are out/in the viewport
          function inViewPort(x){ return (x) * style.cellWidth + tx > 0; }
          function cellVisibility(x){ return inViewPort(x) ? 1 : 0.1; }

          heatmapCells.style('opacity', function(d) {
            return cellVisibility(data.xs.indexOf(d.x));
          });
          if (renderXLabels){
            heatmap.selectAll('g.gd3annotationXLabels text')
                .style('opacity', function(name) {
                  return cellVisibility(data.xs.indexOf(name));
                });
          }
          if (renderAnnotations){
            heatmap.selectAll('g.gd3heatmapAnnotationCells rect')
                .style('opacity', function(x) {
                  return cellVisibility(data.xs.indexOf(x));
                });
          }
      });
      svgGroup.call(zoom);

      var annotationCellsG,
          annotationCategoryCellsG;
      function renderAnnotationsFn() {
        if (!data.annotations) return;
        var verticalOffset = heatmap.node().getBBox().height + style.labelMargins.bottom;

        var annotationCellsG = heatmap.append('g').attr('class', 'gd3heatmapAnnotationCells'),
            annotationYLabelsG = svgGroup.append('g').attr('class', 'gd3annotationYLabels');

        annotationYLabelsG.attr('transform', 'translate(0,'+verticalOffset+')');

        // Draw annotation labels, if called for
        if(renderYLabels) {
          var annotationYLabels = annotationYLabelsG.selectAll('text')
              .data(data.annotations.categories)
              .enter()
              .append('text')
                  .attr('text-anchor', 'end')
                  .attr('y', function(d,i) {
                    return i*(style.annotationCellHeight+style.annotationCategorySpacing)
                        + style.annotationCellHeight;
                  })
                  .style('font-size', style.annotationLabelFontSize)
                  .text(function(d) { return d; });

          // Modify label translations based on maximum of labelWidth AND annotationLabelWidth
          var yLabelsHOffset = yLabelsG.node().getBBox().width || 0,
              annotationYLabelsHOffset = annotationYLabelsG.node().getBBox().width || 0,
              maxLabelWidth = yLabelsHOffset > annotationYLabelsHOffset ? yLabelsHOffset : annotationYLabelsHOffset;

          annotationYLabels.attr('x', maxLabelWidth);
          yLabelsG.selectAll('text').attr('x', maxLabelWidth);
          heatmap.attr('transform', 'translate(' + (maxLabelWidth+style.labelMargins.right) +',0)');
        }

        // adjust cell drawing area
        annotationCellsG.attr('transform', 'translate(0,' + verticalOffset + ')');

        // Draw annotation cells
        annotationCategoryCellsG = annotationCellsG.selectAll('g')
            .data(data.annotations.categories)
            .enter()
            .append('g')
                .attr('transform', function(d,i) {
                  var y = i*(style.annotationCellHeight+style.annotationCategorySpacing);
                  return 'translate(0,'+ y + ')';
                });

        // draw the cells for each category
        annotationCategoryCellsG.each(function(category, categoryIndex) {
          var thisEl = d3.select(this);

          var sampleNames = Object.keys(data.annotations.sampleToAnnotations),
              sampleIndex = sampleNames.map(function(d) { return [d,data.xs.indexOf(d)]; });

          sampleIndex = sampleIndex.filter(function(d) { return d[1] >= 0; });
          sampleIndex = sampleIndex.sort(function(a,b) { return a[1] - b[1]; })
              .map(function(d) { return d[0]; });

          var annColor;

          // For each coloring see:
          //    If there is a predefined categorical set, do nothing
          //    Elsetherwise define a scale
          if(gd3.color.annotations(category)) {
            annColor = gd3.color.annotations(category);
          }
          else { // Else we need to create an annotation color
            var values = Object.keys(data.annotations.sampleToAnnotations).map(function(key) {
              return data.annotations.sampleToAnnotations[key][categoryIndex];
            });
            values = d3.set(values).values();

            if(values.length <= 10) gd3.color.annotations(category, values, 'discrete');
            else {
              values = values.map(function(v) { return +v; });
              gd3.color.annotations(category, [d3.min(values), d3.max(values)], 'continuous');
            }
            annColor = gd3.color.annotations(category);
          }

          // Render the cells for each category
          var annotationRects = thisEl.selectAll('rect')
              .data(sampleIndex)
              .enter()
              .append('rect')
                  .attr('height', style.annotationCellHeight)
                  .attr('width', style.cellWidth)
                  .attr('x', function(d) { return xs.indexOf(d)*style.cellWidth; })
                  .style('fill', function(d) {
                      var value = data.annotations.sampleToAnnotations[d][categoryIndex];
                      // if(gd3.color.annotations(category)) {
                      //   console.log(gd3.color.annotations(category).domain(), category);
                      //   return gd3.color.annotations(category)(value);
                      // }
                      // console.log(gd3.color.annotations(category), category, value);
                      return annColor(value);
                  });

          // Render title tooltips for the rectangles
          annotationRects.append('title').text(function(d) {
            var value = data.annotations.sampleToAnnotations[d][categoryIndex];
            return ['x: ' + d, 'y: ' + category, 'value: ' + (value == null ? 'No data' : value)]
                .join('\n');
          });
        });
      }

      var legendScale, legendRefLine;
      function renderLegendFn() {
        var heatmapTranslate = heatmap.attr('transform') || 'translate(0,0)',
            xOffset = +heatmapTranslate.replace(')','').replace('translate(','').split(',')[0],
            yOffset = heatmap.node().getBBox().height+style.annotationCategorySpacing;

        if (!xOffset) xOffset = 0;

        legendG.attr('transform', 'translate('+xOffset+','+yOffset+')');

        var colorScaleRect = legendG.append('rect')
            .attr('height', style.colorScaleHeight)
            .attr('width', style.colorScaleWidth);

        // Create a unique ID for the color map gradient in case multiple heatmaps are made
        var now = Date.now(),
            gradientId = 'gd3heatmapGradient'+now;

        // Configure the gradient to be mapped on to the legend
        var gradient = legendG.append('svg:defs')
              .append('svg:linearGradient')
                .attr('id', gradientId)
                .attr('x1', '0%')
                .attr('y1', '0%')
                .attr('x2', '100%')
                .attr('y2', '0%');

        style.colorScale.reverse().forEach(function(c, i){
          gradient.append('svg:stop')
              .attr('offset', i*1./style.colorScale.length)
              .attr('stop-color', c)
              .attr('stop-opacity', 1);
        });

        colorScaleRect.style('fill', 'url(#'+gradientId+')');

        var textY = style.colorScaleHeight + style.fontSize + 3

        // append the minimum value text
        legendG.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', style.colorScaleWidth)
            .attr('y', textY)
            .style('font-size', style.annotationLabelFontSize)
            .text(data.maxCellValue);

        // append the maximum value text
        legendG.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', 0)
            .attr('y', textY)
            .style('font-size', style.annotationLabelFontSize)
            .text(data.minCellValue);

        // append the name of the legend/heatmap
        legendG.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', style.colorScaleWidth/2)
            .attr('y', textY + style.annotationLabelFontSize+2)
            .style('font-size', style.annotationLabelFontSize)
            .text(data.name);

        // Add a legend reference line
        legendScale = d3.scale.linear()
            .domain([data.minCellValue, data.maxCellValue])
            .range([style.colorScaleWidth, 0]);

        legendRefLine = legendG.append('line')
            .attr('y1', 0)
            .attr('y2',style.colorScaleHeight)
            .style('stroke','black')
            .style('stroke-width', 2);

      }

      var annotationXLabelsG;
      function renderXLabelsFn() {
        annotationXLabelsG = heatmap.append('g').attr('class', 'gd3annotationXLabels');
        // Position the x labels correctly
        var verticalOffset = heatmap.node().getBBox().height + style.labelMargins.bottom;
        annotationXLabelsG.attr('transform', 'translate(0,'+verticalOffset+')');

        // Draw the text labels for each x value
        annotationXLabelsG.selectAll('text')
            .data(data.xs)
            .enter()
            .append('text')
            .attr('y', function(d,i) { return -i*style.cellWidth; })
            .attr('transform', 'rotate(90)')
            .style('font-size', style.annotationLabelFontSize)
            .text(function(d) { return d; });
      }

      function renderYLabelsFn() {
        var yLabels = yLabelsG.selectAll('text')
                .data(ys)
                .enter()
                .append('text')
                    .attr('text-anchor', 'end')
                    .attr('y', function(d,i) { return i * style.cellHeight + style.cellHeight; })
                    .style('font-size', style.fontSize)
                    .text(function(d) { return d; });

        // Determine the x positioning of the y labels
        var maxLabelWidth = 0;
        yLabels.each(function() {
          var tmpWidth = d3.select(this).node().getBBox().width;
          maxLabelWidth = maxLabelWidth > tmpWidth ? maxLabelWidth : tmpWidth;
        });
        yLabels.attr('x', maxLabelWidth);

        // move the heatmap over
        heatmap.attr('transform', 'translate(' + (maxLabelWidth+style.labelMargins.right) +',0)');
      }

      // Set the height to show all the elements
      var actualHeight = svgGroup.node().getBBox().height + 4;
      svg.attr("height", actualHeight);

      // Sort the columns in response to a dispatch
      gd3.dispatch.on('sort.heatmap', function(d) {
        data.sortColumns(d.columnLabels);
        heatmapCells.transition().attr('x', function(d, i) {
          return data.xs.indexOf(d.x) * style.cellWidth;
        });

        // update x labels if they exist
        if(annotationXLabelsG) {
          annotationXLabelsG.selectAll('text').transition()
              .attr('y', function(d, i) {
                return -data.xs.indexOf(d) * style.cellWidth;
              });
        }

        // update annotation cells if they exist
        if(annotationCategoryCellsG) {
          annotationCategoryCellsG.each(function(d) {
            d3.select(this).selectAll('rect').transition()
                .attr('x', function(d) { return data.xs.indexOf(d)*style.cellWidth; });
          });
        }
      });

      // Select the sample names and the mutations, and give each of the
      // mutations a hidden stroke

      gd3.dispatch.on("sample.heatmap", function(d){
        if (d.over){
          var xOffset = +heatmap.attr('transform').replace(')','').replace('translate(','').split(',')[0],
              x = xOffset + data.xs.indexOf(d.sample) * style.cellWidth;

          var visibleHeight = +heatmap.node().getBBox().height;

          guidelines.each(function(d,i) {
            var line = d3.select(this);
            if(i == 2) line.attr({x1: x, x2: x, y1: 0, y2: visibleHeight });
            if(i == 3) line.attr({x1: x+style.cellWidth, x2: x+style.cellWidth, y1: 0, y2: visibleHeight});
          });
        } else {
          guidelines.attr({x1: 0, x2: 0, y1: 0, y2: 0});
        }

      })

    });
  }

  chart.showAnnotations = function(state) {
    renderAnnotations = state;
    return chart;
  }

  chart.showLegend = function(state) {
    renderLegend = state;
    return chart;
  }

  chart.showXLabels = function(state) {
    renderXLabels = state;
    return chart;
  }

  chart.showYLabels = function(state) {
    renderYLabels = state;
    return chart;
  }

  return chart;
}