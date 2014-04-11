function subnetwork(params) {
  var params = params || {},
      style  = params.style || {},
      colorSchemes = style.colorSchemes || {};

  var cold = style.cold || 'rgb(102, 178, 255)',
      edgeWidth = style.edgeWidth || 1.5,
      fontColor = style.fontColor || '#333',
      fontFamily = style.fontFamily || '"Helvetica","Arial"',
      fontSize = style.fontSize || 12,
      heatLegendHeight = style.heatLegendHeight || 110,
      heatLegendWidth = style.heatLegendWidth || 50,
      heatLegendText = style.heatLegendText || "No. Mutated Samples",
      height = style.height || 350,
      hot = style.hot || 'rgb(255, 51, 51)',
      margins = style.margins || {bottom: 0, left: 0, right: 0, top: 0},
      netLegendBox = style.netLegendBox || 15,
      netLegendWidth = style.netLegendWidth || 100,
      nodeRadius = style.nodeRadius || 10,
      transitionTime = style.transitionTime || 500,
      width = style.width || 350;

  var showNetworkLegend = false,
      showGradientLegend = false;

  if (colorSchemes.network == undefined) {
    colorSchemes.network = {
            "Multinet": "rgb(92, 128, 178)",
            "iRefIndex": "rgb(140, 91, 56)",
            "HINT": "rgb(127, 92, 159)",
            "HINT+HI2012": "rgb(127, 92, 159)"
    }
  }

  function chart(selection) {
    selection.each(function(data) {
      //////////////////////////////////////////////////////////////////////////
      // General setup
      var edges = data.edges,
          nodes = data.nodes;

      // Select the svg element, if it exists.
      var fig = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg');

      fig.attr('id', 'figure')
          .attr('height', height + margins.top + margins.bottom)
          .attr('width', width)
          .style('font-family', fontFamily)
          .style('font-size', fontSize);

      // Create the color scale
      var heatRange = nodes.map(function(n){ return n.heat; }),
          color = d3.scale.linear()
              .domain([d3.min(heatRange), d3.max(heatRange)])
              .range([cold, hot])
              .nice();

      // Calculate the size of the subnetwork view port
      var forceWidth = width;
      if (showNetworkLegend && showGradientLegend) forceWidth -= Math.max(netLegendWidth, heatLegendWidth);
      else if (showNetworkLegend) forceWidth -= netLegendWidth;
      else if (showGradientLegend) forceWidth -= heatLegendWidth;

      // Set up the force directed graph
      var force = d3.layout.force()
          .charge(-400)
          .linkDistance(40)
          .size([forceWidth, height]);

      // This drag function fixes nodes in place once they are dragged
      var drag = force.drag().on('dragstart', function(d) {
        d.fixed = true;
        d3.select(this).select('circle').style('stroke-opacity', 0);
      });

      // Set up scales
      var x = d3.scale.linear().range([0, forceWidth]),
          y = d3.scale.linear().range([0, height]);

      var links = loadLinks(edges, nodes);

      force.nodes(nodes)
          .links(links)
          .start();

      // Determine which networks are in the data
      var networks = [];
      for (var i = 0; i < links.length; i++) {
        for (var j = 0; j < links[i].networks.length; j++) {
          if (networks.indexOf(links[i].networks[j]) == -1) {
            networks.push(links[i].networks[j]);
          }
        }
      }

      var numNets = networks.length,
          netLegendHeight = numNets * 10;

      // Draw the edges
      var link = fig.selectAll('.link')
          .data(links);

      var linkInNetwork = {},
          activeNetworks = {};

      for (var i = 0; i < networks.length; i++) {
        var net = networks[i],
            netColor = colorSchemes.network[networks[i]];
            activeNetworks[net] = true;

            var inNet = fig.selectAll('.' + net)
                .data(links.filter(function (link) {
                  return link.networks && link.networks.indexOf(net) != -1;
                }))
                .enter()
                .append('line')
                  .classed(net, true)
                  .style('stroke-width', edgeWidth)
                  .style('stroke', netColor);

            linkInNetwork[net] = inNet;
      }

      // Draw the nodes
      // Keep the circles and text in the same group for better dragging
      var circle = fig.append('svg:g')
          .selectAll('node')
          .data(nodes)
          .enter()
          .append('svg:g')
            .style('cursor', 'move')
            .call(force.drag)
            .on('dblclick', function(d) {
              d.fixed = d.fixed ? false : true;
              d3.select(this).select('circle').style('stroke-opacity', 1);
            });

      circle.append('circle')
          .attr('r', nodeRadius)
          .attr('fill', function(d) { return color(d.heat); })
          .style('stroke-width', 1.5)
          .style('stroke', '#333');

      circle.append('text')
          .attr('x', nodeRadius)
          .attr('y', '10px')
          .style('fill', fontColor)
          .style('fill-opacity', '1')
          .style('font-size', fontSize)
          .text(function(d) { return d.name; });

      // Make sure nodes don't go outside the borders of the SVG
      force.on('tick', function() {
        circle.attr('transform', function(d) {
          d.x = Math.max(nodeRadius, Math.min(forceWidth - nodeRadius, d.x));
          d.y = Math.max(nodeRadius, Math.min(height - nodeRadius, d.y));
          return 'translate(' + d.x + ',' + d.y + ')';
        });

        networks.forEach(function(net, i) {
          var offset = edgeWidth * (i - numNets / 2);
          linkInNetwork[net]
              .attr('x1', function(d) { return d.source.x + offset; })
              .attr('y1', function(d) { return d.source.y + offset; })
              .attr('x2', function(d) { return d.target.x + offset; })
              .attr('y2', function(d) { return d.target.y + offset; });
        });
      }); // end force

      //////////////////////////////////////////////////////////////////////////
      // DRAW LEGENDS
      function renderNetworkLegend() {
        var networkLeft = showNetworkLegend ? (width - Math.max(heatLegendWidth+15, netLegendWidth)) : (width - netLegendWidth);

        var netLegend = fig.selectAll(".net-group")
            .data(networks).enter()
            .append("g")
                .attr("transform", function(d, i){
                    return "translate(" + networkLeft + "," + ((i+1)*netLegendBox) + ")";
                })
                .style("font-size", 12)
                .on("click", function(n){
                    var active = activeNetworks[n];
                    activeNetworks[n] = !active;
                    linkInNetwork[n].transition().duration(transitionTime)
                        .style("stroke-opacity", active ? 0 : 1);

                    d3.select(this).transition().duration(transitionTime)
                        .style("stroke-opacity", active ? 0.5 : 1)
                        .style("fill-opacity", active ? 0.5 : 1);
                });

        netLegend.append("line")
            .attr("x1", 0)
            .attr("x2", netLegendBox)
            .style("stroke-width", edgeWidth)
            .style("stroke", function(n){ return colorSchemes.network[n]; });

        netLegend.append("text")
            .attr("x", 8 + netLegendBox)
            .attr("y", 3)
            .text(function(n){ return n; });
      } // end renderNetworkLegend()


      function renderGradientLegend() {
        var gradientTop = showNetworkLegend ? networks.length * 18 + 15 : 10,
          gradientLeft = showNetworkLegend ? (width - Math.max(heatLegendWidth+15, netLegendWidth)) : (width - heatLegendWidth - 15);
        
        var heatLegend = fig.append('g')
            .attr('id', 'subnetwork-legend')
            .attr('transform', 'translate(' + gradientLeft + ',' + gradientTop + ')');

        fig.append('svg:defs')
            .append('svg:linearGradient')
              .attr('x1', '0%')
              .attr('y1', '100%')
              .attr('x2', '0%')
              .attr('y2', '0%')
              .attr('id', 'heat_gradient')
              .call(function (gradient) {
                gradient.append('svg:stop')
                  .attr('offset', '0%')
                  .attr('style', 'stop-color:' + cold + ';stop-opacity:1');
                gradient.append('svg:stop')
                  .attr('offset', '100%')
                  .attr('style', 'stop-color:' + hot + ';stop-opacity:1');
              });

        heatLegend.append('rect')
            .attr("y", 5)
            .attr('width', heatLegendWidth)
            .attr('height', heatLegendHeight)
            .style('fill', 'url(#heat_gradient)');

        heatLegend.append("text")
          .attr("dx", heatLegendWidth / 2)
          .attr("text-anchor", "middle")
          .text(d3.max(heatRange));

        heatLegend.append("text")
          .attr("dx", heatLegendWidth / 2)
          .attr("dy", heatLegendHeight + 20)
          .attr("text-anchor", "middle")
          .text(d3.min(heatRange));

        heatLegend.append("text")
          .attr("dx", (heatLegendHeight+10)/2)
          .attr("dy", -heatLegendWidth - 5)
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(90)")
          .text(heatLegendText);

      } // end renderGradientLegend()


      if(showNetworkLegend) {
        renderNetworkLegend();
      }
      if(showGradientLegend) {
        renderGradientLegend();
      }


      //////////////////////////////////////////////////////////////////////////
      // UTILITY FUNCTIONS
      // Returns list of links between a given set of nodes and an edge list
      function loadLinks(edges, nodes) {
        var links = [];

        for (var i = 0; i < nodes.length; i++) {
          var u = nodes[i].name;
          for(var j = 0; j < nodes.length; j++) {
            var v = nodes[j].name;
            for (var k = 0; k < edges.length; k++) {
              var src = edges[k].source,
                  tgt = edges[k].target;
              if ( (u == src && v == tgt) || (u == tgt && v == src) ) {
                links.push({
                  'source': nodes[i],
                  'target': nodes[j],
                  'weight': edges[k].weight,
                  'networks': edges[k].networks
                })
              }
            }
          }
        }

        return links;
      } // end loadLinks()
    });
  } // end chart()


  chart.addNetworkLegend = function () {
    showNetworkLegend = true;
    return chart;
  }

  chart.addGradientLegend = function () {
    showGradientLegend = true;
    return chart;
  }



  return chart;
}