import "graphData.js";

function graphChart(style) {
  var anchorNodesOnClick = true,
      drawLegend = true;

  function chart(selection) {
    selection.each(function(data) {
      data = graphData(data);

      // Used for edge classes and filtering
      var instanceIDConst = 'gd3-graph-'+Date.now();

      var height = style.height,
          width = style.width;

      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
                .attr('height', height)
                .attr('width', width)
                .style('font-family', style.fontFamily)
                .style('font-size', style.fontSize);

      var graph = svg.append('g');

      // Set up edge coloring
      var edgeColor = d3.scale.ordinal()
          .domain(data.edgeCategories)
          .range(style.edgeColors);

      // Set up node coloring
      var nodeColor = d3.scale.linear()
          .domain([data.minNodeValue, data.maxNodeValue])
          .range(style.nodeColor)
          .interpolate(d3.interpolateLab);

      var forceHeight = height,
          forceWidth = width;

      if(drawLegend) {
        var xLegend = style.width - style.legendWidth,
            legend = svg.append('g')
                .attr('transform','translate('+xLegend+',0)')
        drawLegendFn(legend);
      }

      // Set up force directed graph
      var force = d3.layout.force()
          .charge(-400)
          .linkDistance(100)
          .size([forceWidth,forceHeight]);

      var x = d3.scale.linear().range([0,forceWidth]),
          y = d3.scale.linear().range([0,forceHeight]);

      // Start the force directed layout
      force.nodes(data.nodes).links(data.links).start();

      // Draw the edges
      var link = graph.append('g').selectAll('.link')
          .data(data.links)
          .enter()
          .append('g')
          .attr('class', 'gd3Link');

      // Draw categories for each edge
      if(data.edgeCategories) {
        link.each(function(d) {
          var thisEdge = d3.select(this);
          d.categories.forEach(function(c) {
            thisEdge.append('line')
                .attr('class', instanceIDConst+'-'+c)
                .style('stroke-width', style.edgeWidth)
                .style('stroke', edgeColor(c));
          });
        });
      } else {
        link.append('line').style('stroke-width', style.edgeWidth).style('stroke', edgeColor(null));
      }

      link.selectAll('line').style('stroke-linecap', 'round');


      // Draw the nodes
      var node = graph.append('g').selectAll('.node')
          .data(data.nodes)
          .enter()
          .append('g')
              .style('cursor', 'move')
              .call(force.drag);

      node.append('circle')
          .attr('r', style.nodeRadius)
          .attr('fill', function(d) { return nodeColor(d.value); })
          .style('stroke-width', style.nodeStrokeWidth)
          .style('stroke', style.nodeStrokeColor);

      node.append('text')
          .attr('x', style.nodeRadius+style.nodeLabelPadding)
          .attr('y', style.nodeRadius+style.nodeLabelPadding)
          .style('font-family', style.fontFamily)
          .style('font-size', style.fontSize)
          .style('font-weight', style.nodeLabelFontWeight)
          .text(function(d) { return d.name; });

      force.on('tick', function() {
        node.attr('transform', function(d) {
          var maxBound = style.nodeRadius+style.nodeStrokeWidth,
              minBoundX = forceWidth - style.nodeRadius - style.nodeStrokeWidth,
              minBoundY = forceHeight - style.nodeRadius - style.nodeStrokeWidth;
          if(drawLegend) minBoundX = minBoundX - style.legendWidth;
          d.x = Math.max(maxBound, Math.min(minBoundX, d.x));
          d.y = Math.max(maxBound, Math.min(minBoundY, d.y));
          return 'translate('+ d.x + ',' + d.y + ')';
        });

        // position the edges
        link.each(function(d) {
          var thisEdgeSet = d3.select(this),
              categories = d.categories || [null],
              numCategories = categories.length;

          var offset = (numCategories/2) * style.edgeWidth;

          thisEdgeSet.selectAll('line').each(function(d,i) {
            var thisEdge = d3.select(this);
            thisEdge.attr('x1', d.source.x - offset + style.edgeWidth * i)
                .attr('x2', d.target.x - offset + style.edgeWidth * i)
                .attr('y1', d.source.y - offset + style.edgeWidth * i)
                .attr('y2', d.target.y - offset + style.edgeWidth * i);
          });
        });
      });


      if(anchorNodesOnClick) {
        force.drag().on('dragstart', function(d) {
          d.fixed = true;
          //d3.select(this).select('circle').style('stroke-opacity', 0);
        });
        node.on('dblclick', function(d) {
          d.fixed = d.fixed ? false : true;
          //d3.select(this).select('circle').style('stroke-opacity', 1);
        });
      } // end anchorNodesOnClick block


      function drawLegendFn(legend) {
        legend.style('font-family', style.fontFamily);
        legend.append('rect')
            .attr('width',style.legendWidth)
            .attr('height', style.height)
            .style('fill', '#ffffff')
            .style('opacity', .95);

        var title = legend.append('text')
            .style('font-size', style.legendFontSize);

        title.selectAll('tspan')
            .data(data.title.split('\n'))
            .enter()
            .append('tspan')
                .attr('x', 0)
                .attr('dy', style.legendFontSize+2)
                .text(function(d){ return d; });

        // Render the scale
        var titleHeight = title.node().getBBox().height + 4,
            scaleG = legend.append('g')
                .attr('transform','translate(0,'+titleHeight+')');
        scaleG.append('text')
            .attr('x', style.legendScaleWidth + 2)
            .attr('y', style.legendFontSize)
            .style('font-size', style.legendFontSize)
            .text(data.maxNodeValue);
        scaleG.append('text')
                .attr('x', style.legendScaleWidth + 2)
                .attr('y', style.height/2)
                .style('font-size', style.legendFontSize)
                .text(data.minNodeValue);
        var colorScaleRect = scaleG.append('rect')
            .attr('height', style.height/2)
            .attr('width', style.legendScaleWidth);

        // Create a unique ID for the color map gradient in case multiple graphs are made
        var now = Date.now(),
            gradientId = 'gd3-graph-gradient'+now;

        // Configure the gradient to be mapped on to the legend
        var gradient = scaleG.append('svg:defs')
              .append('svg:linearGradient')
                .attr('id', gradientId)
                .attr('x1', '0%')
                .attr('y1', '100%')
                .attr('x2', '0%')
                .attr('y2', '0%');

        var scaleRange = nodeColor.range();
        scaleRange.forEach(function(c, i){
          gradient.append('svg:stop')
              .attr('offset', i*1./(scaleRange.length-1))
              .attr('stop-color', c)
              .attr('stop-opacity', 1);
        });

        colorScaleRect.attr('fill', 'url(#'+gradientId+')');

        // Add the edge keys to the graph
        var scaleHeight = scaleG.node().getBBox().height + 4,
            edgeKeys = legend.append('g').selectAll('g')
                .data(data.edgeCategories)
                .enter()
                .append('g')
                    .style('cursor', 'pointer')
                    .on('click', function(category) {
                      var catEdges = d3.selectAll('.'+instanceIDConst+'-'+category),
                          visible = catEdges.style('opacity') == 1;
                      d3.select(this).style("opacity", visible ? 0.5 : 1);
                      catEdges.style('opacity', visible ? 0 : 1);
                    })
                    .on('mouseover', function() {
                      d3.select(this).selectAll('text').style('fill', 'red');
                    })
                    .on('mouseout', function() {
                      d3.select(this).selectAll('text').style('fill', 'black');
                    });
        edgeKeys.each(function(category, i) {
          var thisEl = d3.select(this),
              thisY = (i+1)*style.legendFontSize + titleHeight + scaleHeight;
          thisEl.append('line')
              .attr('x1', 0)
              .attr('y1', thisY - style.legendFontSize/4)
              .attr('x2', 15)
              .attr('y2', thisY - style.legendFontSize/4)
              .style('stroke', edgeColor(category))
              .style('stroke-width', style.legendFontSize/2);

          thisEl.append('text')
              .attr('x', 16)
              .attr('y', (i+1)*style.legendFontSize + titleHeight + scaleHeight)
              .style('font-size', style.legendFontSize)
              .text(category);
        });
      }

      // Add dispatch
      link.on("click.dispatch-interaction", function(d){
        gd3.dispatch.interaction({ source: d.source.name, target: d.target.name });
      })
    });
  }

  chart.clickAnchorsNodes = function(state) {
    anchorNodesOnClick = state;
    return chart;
  }

  chart.showLegend = function(state) {
    drawLegend = state;
    return chart;
  }

  return chart;
}