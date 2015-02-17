import "dendrogramData.js";

function dendrogramChart(style) {
  // Globals controllable by the user
  var update,
      currentDelta,
      cutAndUpdate,
      showSlider = false,
      useLogScale = false;

  function chart(selection) {
    selection.each(function(inputData) {
      ///////////////////////////////////////////////////////////////////
      // Perform simple validation of data
      // Z: N-1 x 4 linkage matrix, where N is the number of leaves. Each
      //    row stores which two nodes (columns 1 and 2) merge at distance
      //     (column 3). See Scipy for details: http://goo.gl/nycOCS
      // labels: array of labels (strings). Labels will be drawn in the order
      //          given in this array.
      if (!inputData.Z || !inputData.labels){
        throw "dendrogram: Z and labels *required*."
      }

      // Parse the given data into the data structures we'll be using
      var T = treeFromLinkageMatrix(inputData);
      data = dendrogramData(inputData, currentDelta, T);

      // Make sure that there is a unique index in the 4th column
      var indices = data.Z.map(function(r){ return r[3]; });
      if (indices.length != d3.set(indices).values().length){
        data.Z.forEach(function(r, i){
          r[3] = i + "-" + r[3];
        })
      }

      ///////////////////////////////////////////////////////////////////
      // Give some of the style elements shorter variable handles
      var height = style.height,
        width = style.width,
        treeWidth,
        colorScheme = style.colorScheme, // name of color scheme
        colorSchemes = style.colorSchemes;

      // Set up the SVG
      var svg = d3.select(this).selectAll('svg')
          .data([data]).enter()
          .append('svg')
          .attr("xmlns", "http://www.w3.org/2000/svg"),
        fig = svg.append("g"),
        edges = fig.append("g").attr("id" ,"edges"), // add edges first so they are shown below nodes
        leafGroup = fig.append("g").attr("id", "leaves");

      svg.attr('id', 'figure')
        .attr('height', height)
        .attr('width', width)
        .style('font-family', style.fontFamily)
        .style('font-size', style.fontSize);

      // Set up the x-axis
      var xAxis = d3.svg.axis(),
          xAxisGroup = fig.append("g")
            .style({'stroke': style.fontColor, 'fill': 'none', 'stroke-width': style.strokeWidth})
            .attr("transform", "translate(0," + height + ")");

      // Set up colors
      if (!(colorScheme in colorSchemes)){
        colorScheme = "default";
      }
      var color = colorSchemes[colorScheme];

      ///////////////////////////////////////////////////////////////////
      // Update redraws the dendrogram using the given treeData
      update = function (treeData){
        // Parse the data into shorter variable handles
        var Z = treeData.Z,
            labels = treeData.labels,
            labelToGroup = treeData.labelToGroup,
            n = labels.length;    // number of nodes

        if (!treeData.labelToGroup){
          labelToGroup = {};
          labels.forEach(function(d, i){ labelToGroup[d] = i; });
        }

        // Create a mapping of leaves (labels) to when they first are
        // added, and then sort the labels in this order
        function isLeaf(v){ return v < n; }
        var nodeToIndex = [];
        labels.forEach(function(n, i){ nodeToIndex[i] = i; });

        // Set up a linear y-axis scale
        var y = d3.scale.linear()
            .domain([0, labels.length-1])
            .range([style.nodeRadius, height-style.nodeRadius]),
          labelToY = d3.scale.ordinal() // convenience scale for labels directly
            .domain(labels)
            .rangePoints([style.nodeRadius, height-style.nodeRadius]);

        ///////////////////////////////////////////////////////////////
        // LEAVES' GENERAL UPDATE

        // DATA JOIN: join data with old elements
        var leaves = leafGroup.selectAll("g")
          .data(labels, function(d){ return d; });

        // UPDATE: transition old elements
        leaves.transition()
          .duration(style.animationSpeed)
          .attr("transform", function(d){ return "translate(0," + labelToY(d) + ")"; });

        leaves.select("circle")
          .attr("fill", function(d){ return color(labelToGroup[d]); });

        // ENTER: create new elements
        var leafGs = leaves.enter()
          .append("g")
          .attr("transform", function(d){ return "translate(0," + labelToY(d) + ")"; });

        leafGs.append("circle")
          .attr("r", style.nodeRadius)
          .style("fill-opacity", 1e-6)
          .attr("fill", function(d){ return color(labelToGroup[d]); })
          .transition()
          .duration(style.animationSpeed)
          .style("fill-opacity", 1);

        leafGs.append("text")
          .attr("text-anchor", "start")
          .attr("x", style.nodeRadius + 5)
          .attr("y", style.nodeRadius/2)
          .text(function(d){ return d; });

        // EXIT: remove old elements
        leaves.exit().transition()
          .duration(style.animationSpeed)
          .style("fill-opacity", 1e-6)
          .remove();

        ///////////////////////////////////////////////////////////////
        // Set up the linear x-axis scale by:

        // (1) Compute the size of the largest label, so we can 
        // set the tree width
        var labelWidth = leafGroup.node().getBBox().width;
        treeWidth = width - labelWidth - style.margins.left;
        leafGroup.attr("transform", "translate(" + treeWidth + ",0)");

        // (2) Using the updated treeWidth to set up the x-axis scale
        var dists = Z.map(function(row){ return row[2]; }),
            xExtent = d3.extent(dists);

        if (useLogScale) x = d3.scale.log();
        else x = d3.scale.linear()
        x.domain(xExtent)
         .range([treeWidth, style.margins.left]); // go in reverse, since low distances are to the furthest right

        ///////////////////////////////////////////////////////////////
        // Create objects to represent each edge
        var edgeData = [],
            distances = labels.map(function(_){ return xExtent[0]; })
            groups = labels.map(function(d){ return [labelToGroup[d]]; });

        function connectNodes(u, v, w, index){
          // Find the y-index of each node
          var i  = nodeToIndex[u],
              j  = nodeToIndex[v],
              d1 = distances[u],
              d2 = distances[v],
              g1 = groups[u],
              g2 = groups[v],
              newG = g1.length == 1 && g2.length == 1 && g1[0] == g2[0] ? g1 : g1.concat(g2);

          // Draw the horizontal line from u
          edgeData.push({name: "u" + index, x1: x(d1), x2: x(w), y1: y(i), y2: y(i), groups: g1 });

          // Draw the horizontal line from v
          edgeData.push({name: "v" + index, x1: x(d2), x2: x(w), y1: y(j), y2: y(j), groups: g2 });

          // Connect the two horizontal lines with a vertical line
          edgeData.push({name: "uv" + index, x1: x(w), x2: x(w), y1: y(i), y2: y(j), groups: newG })

          // Add an index for the new internal nodes
          nodeToIndex.push( (i  + j) / 2. );
          distances.push(w);
          groups.push( newG );

        }

        Z.forEach(function(row){ connectNodes(row[0], row[1], row[2], row[3]); });

        ///////////////////////////////////////////////////////////////
        // EDGES' GENERAL UPDATE
        // Data join
        var lines = edges.selectAll("line")
          .data(edgeData, function(d){ return d.name + " " + d.ty; });

        // Transition existing elements
        lines.transition()
          .duration(style.animationSpeed)
          .attr("x1", function(d){ return d.x1; })
          .attr("x2", function(d){ return d.x2; })
          .attr("y1", function(d){ return d.y1; })
          .attr("y2", function(d){ return d.y2; })
          .attr("stroke-dasharray", function(d){
            if (d.groups.length == 1){ return ""; }
            else { return ("3", "3"); }
          });

        // Add new elements
        lines.enter()
          .append("line")
          .attr("x1", function(d){ return d.x1; })
          .attr("x2", function(d){ return d.x1; })
          .attr("y1", function(d){ return d.y1; })
          .attr("y2", function(d){ return d.y1; })
          .attr("stroke", style.strokeColor)
          .attr("stroke-width", style.strokeWidth)
          .attr("stroke-dasharray", function(d){
            if (d.groups.length == 1){ return ""; }
            else { return ("3", "3"); }
          })
          .attr("fill-opacity", 1e-6)
          .transition()
            .duration(style.animationSpeed)
            .attr("x2", function(d){ return d.x2; })
            .attr("y2", function(d){ return d.y2; })
            .attr("fill-opacity", 1);

        // Fade and remove old elements
        lines.exit().transition()
          .duration(style.animationSpeed)
          .style("stroke-opacity", 1e-6)
          .remove();

        ///////////////////////////////////////////////////////////////////
        // Update the x-axis
        xAxis.scale(x);
        xAxisGroup.call(xAxis);
        xAxisGroup.selectAll("text")
          .style({'stroke-width': '0px', 'fill': style.fontColor });

        ///////////////////////////////////////////////////////////////////
        // Resize the SVG to make sure everything fits
        svg.attr('height', fig.node().getBBox().height);
      }

      // Draw the inital dendrogram
      update(data);

      // Show the slider if necessary
      if (showSlider){
        // Create the data
        var U = gd3_data_structures.UnionFind(),
            N = inputData.labels.length,
            step = Math.ceil(N/100), // only sample points after every N/100 merges
            series = [{values: [], name: "Largest component"},
                      {values: [], name: "Non-singleton components"}];
        
        inputData.Z.forEach(function(row, i){
          // Merge nodes row[0] and row[1] with their parent
          U.union([row[0], row[1], N+i]);

          // Record the largest and number of non-singleton components
          // every N/100 merges
          if (i % step == 0){
            var groups = U.groups(),
                largestSize = d3.max(groups, function(g){ return g.length; }),
                nonSingletons = d3.sum(groups.map(function(g){ return g.length > 1; }));
              if (row[2] != 0){
                series[0].values.push({x: row[2], y: largestSize });
                series[1].values.push({x: row[2], y: nonSingletons });
              }
          }
        });

        var allPoints = d3.merge(series.map(function(d, i){ return d.values; }));

        // Set up the sizes
        var sliderWidth = treeWidth - style.sliderMargins.left - style.sliderMargins.right,
            sliderHeight = style.sliderHeight - style.sliderMargins.top - style.sliderMargins.bottom;

        // Set up the scales
        if (useLogScale) sliderX = d3.scale.log().range([0, sliderWidth]);
        else sliderX = d3.scale.linear().range([0, sliderWidth]);

        var yExtent = d3.extent(allPoints, function(d){ return d.y; });
        if (yExtent[1] - yExtent[0] > 100) sliderY = d3.scale.log().range([sliderHeight, 0]);
        else sliderY = d3.scale.linear().range([sliderHeight, 0]);

        sliderX.domain( d3.extent(allPoints, function(d) { return d.x; }).reverse() );
        sliderY.domain( yExtent ).nice();

        // Set up the axes
        var sliderColor = d3.scale.category10(),
            sliderXAxis = d3.svg.axis()
              .scale(sliderX)
              .orient("bottom"),
            sliderYAxis = d3.svg.axis()
              .scale(sliderY)
              .ticks(5)
              .orient("left"),
            line = d3.svg.line()
              .interpolate("basis")
              .x(function(d) { return sliderX(d.x); })
              .y(function(d) { return sliderY(d.y); });

        // Add the instructions and the SVG
        d3.select(this).insert("div", "svg")
          .html("<b>Instructions</b>: Choose &delta; by mousing over the plot below and double-clicking. You can change your selection by double-clicking again.<br/><br/>")

        var sliderSVG = d3.select(this).insert("svg", "svg")
          .attr("width", sliderWidth + style.sliderMargins.left + style.sliderMargins.right)
          .attr("height", sliderHeight + style.sliderMargins.top + style.sliderMargins.bottom)
          .append("g")
          .attr("transform", "translate(" + style.sliderMargins.left + "," + style.sliderMargins.top + ")")
          .style("font-size", style.fontSize);

        sliderSVG.append("rect") // background
          .attr("width", sliderWidth + style.sliderMargins.left + style.sliderMargins.right)
          .attr("height", sliderHeight + style.sliderMargins.top + style.sliderMargins.bottom)
          .attr("fill", style.backgroundColor);

        // Draw the lines
        var lines = sliderSVG.selectAll(".point")
          .data(series)
          .enter().append("g")
          .attr("class", "point");

        lines.append("path")
          .attr("class", "line")
          .attr("d", function(d) { return line(d.values); })
          .style("fill", "none")
          .style("stroke", function(d) { return sliderColor(d.name); });

        // Add the axes
        sliderSVG.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + sliderHeight + ")")
          .call(sliderXAxis)
            .append("text")
            .attr("x", sliderWidth/2)
            .attr("dy", "30px")
            .style("text-anchor", "middle")
            .text("\u03B4");

        sliderSVG.append("g")
          .attr("class", "y axis")
          .call(sliderYAxis);

        sliderSVG.selectAll(".axis path")
          .style({fill: "none", stroke: "#000", "shape-rendering": "crispEdges"});
        sliderSVG.selectAll(".axis line")
          .style({fill: "none", stroke: "#000", "shape-rendering": "crispEdges"});

        // Add a series legend, aligned to the right topmost corner of the plot
        var legend = sliderSVG.append("g"),
            legendGroups = legend.selectAll(".legend-text")
              .data(series).enter()
              .append("g");

        legendGroups.append("line")
          .attr("x1", 0)
          .attr("x1", 20)
          .attr("y1", 0)
          .attr("y2", 0)
          .style("stroke", function(d) { return sliderColor(d.name); });

        legendGroups.append("text").attr("x", 25).attr("y", 3).text(function(d){ return d.name; });

        var legendWidth = legend.node().getBBox().width;
        legendGroups.attr("transform", function(d, i){
          var thisX = treeWidth - legendWidth - style.sliderMargins.left,
              thisY = sliderY(d3.max(sliderY.domain())) + (i)*15;
          return "translate(" + thisX + "," + thisY + ")";
        });

        // Add the onmouseover line that we use to select delta
        var deltaFixed = false,
            deltaFormat = d3.format(".5r"),
            deltaLine = sliderSVG.append("line")
              .attr("y1", sliderY(d3.min(sliderY.domain())))
              .attr("y2", sliderY(d3.max(sliderY.domain())))
              .style("fill", "none")
              .style("stroke", style.strokeColor)
              .style("opacity", 0),
            delta = sliderSVG.append("text")
              .attr("text-anchor", "start")
              .attr("x", treeWidth - legendWidth - style.sliderMargins.left)
              .attr("y", sliderY(d3.max(sliderY.domain())) + (series.length*15) + 5)
              .text("\u03B4: " + deltaFormat(d3.max(sliderX.domain())));

        // Move the line to match the mouse position
        sliderSVG.on("mousemove", function(){
          var coordinates = d3.mouse(this);
          if (!deltaFixed && coordinates[0] > 0){
            deltaLine.attr("x1", coordinates[0])
              .attr("x2", coordinates[0])
              .style("opacity", 1);
          }
        });

        // On double click update the plot with the given delta
        sliderSVG.on("dblclick", function(){
          // Fix the delta on double click if it wasn't before
          if (!deltaFixed){
            currentDelta = sliderX.invert(deltaLine.attr("x1"));
            cutAndUpdate();
          }
          deltaFixed = !deltaFixed;
        });

      }

      // Cut the plot using the current value of delta, 
      // then update the dendrogram accordingly
      cutAndUpdate = function(){
        // Update the value shown in the delta plot
        if (showSlider) delta.text("\u03B4: " + deltaFormat(currentDelta));
        update(cutDendrogram(inputData, currentDelta, T));
      }
    });
  }

  // "Public" functions that the user can call
  chart.update = function(treeData){
    update(treeData);
    return chart;
  }

  chart.animationSpeed = function(){
    return style.animationSpeed; // note this returns the animation speed, NOT the chart
  }

  chart.showSlider = function(){
    showSlider = true;
    return chart;
  }

  chart.setDelta = function(delta){
    currentDelta = delta;
    if (cutAndUpdate) cutAndUpdate(delta);
    return chart;
  };

  chart.logScale = function(_){
    if (arguments.length) useLogScale = _; 
    return chart;
  };

  return chart;
}