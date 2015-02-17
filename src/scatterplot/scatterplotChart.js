import "scatterplotData.js";

function scatterplotChart(style) {
  function chart(selection) {
    selection.each(function(data) {
      data = scatterplotData(data);

      // convenience function for rendering the scatterplot points
      function makeShape(d) {
        var category = d.category,
            hasCategory = data.categories.has(category),
            shape = hasCategory ? style.categoryShapes[data.categories.values().indexOf(category)] : 'circle',
            pt = d3.svg.symbol().type(shape);

        return pt.size(style.pointSize * style.pointSize)();
      }


      var height = style.height - style.margins.top - style.margins.bottom,
          width = style.width - style.margins.left - style.margins.right;

      var pointColor = d3.scale.ordinal().domain(data.categories).range(style.categoryColors);

      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
                .attr('height', style.height)
                .attr('width', style.width)
                .attr('xmlns', 'http://www.w3.org/2000/svg')
                .style('font-family', style.fontFamily)
                .style('font-size', style.fontSize);

      var scatterplot = svg.append('g').attr('transform', 'translate('+style.margins.left+','+style.margins.top+')');

      // Construct x and y scales
      var x = d3.scale.linear().domain([data.xScale.min, data.xScale.max]).range([0, width]),
          y = d3.scale.linear().domain([data.yScale.min, data.yScale.max]).range([height, 0]);

      // Construct x and y axis
      var xAxis = d3.svg.axis().scale(x).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).orient('left');

      // Render both axis
      var axisStyle = { stroke: 'black', fill: 'none','shape-rendering': 'crispEdges', 'stroke-width': '1px'},
          axisG = scatterplot.append('g').attr('class', 'gd3-scatterplot-axis'),
          xAxisRender = axisG.append('g')
              .attr('class', 'x axis')
              .attr('transform', 'translate(0,' + height + ')')
              .call(xAxis),
          xAxisLabel = axisG.append('text')
              .attr('text-anchor', 'middle')
              .attr('x', x(x.domain()[1])/2)
              .attr('y', height + xAxisRender.node().getBBox().height + style.axisFontSize)
              .style('font-size', style.axisFontSize)
              .text(data.xLabel),
          yAxisRender = axisG.append('g')
              .attr('class', 'y axis')
              .call(yAxis),
          yAxisLabel = axisG.append('text')
              .attr('text-anchor', 'middle')
              .attr('transform', 'rotate(-90)')
              .attr('x', -y(y.domain()[0])/2)
              .attr('y', -yAxisRender.node().getBBox().width)
              .text(data.yLabel);

      axisG.selectAll('.tick text').style('fill', 'black').style('font-size', style.axisFontSize);
      axisG.selectAll('path').style(axisStyle);

      // Make the title
      scatterplot.append('text')
          .attr('text-anchor', 'middle')
          .attr('x', x(x.domain()[1])/2)
          .style('font-size', style.titleFontSize)
          .style('font-weight', 'bold')
          .text(data.title);

      // Make the category legend
      var legendW = style.margins.right - style.legendPadding.left - style.legendPadding.right,
          legend = scatterplot.append('g')
              .attr('class', 'gd3-scatterplot-legend')
              .attr('transform', 'translate('+(width + style.legendPadding.left)+',0)'),
          legendCategories = legend.selectAll('.category')
              .data(data.categories.values())
              .enter()
              .append('g')
                  .attr('class', 'category');

      legendCategories.each(function(d,i) {
        var thisEl = d3.select(this),
            shapeR = style.pointSize/2,
            shape = thisEl.append('path')
                .attr('d', makeShape)
                .attr('transform', 'translate(' + shapeR + ',' + (-shapeR) + ')')
                .style('fill', function(d) { return pointColor(d); }),
            text = thisEl.append('text')
                .attr('x', style.pointSize + 1)
                .text(d);

        thisEl.attr('transform','translate(0,' + i*(style.legendFontSize+2) + ')');
      });

      var pointsGroup = scatterplot.append('g').attr('class', 'gd3-scatterplot-points');
      pointsGroup.selectAll('.point')
          .data(data.pts)
          .enter()
          .append('path')
              .attr('class', 'point')
              .attr('d', makeShape)
              .attr('transform', function(d) { return 'translate(' + x(d.x) + ',' + y(d.y) + ')'; })
              .style('fill', function(d) { return pointColor(d.category); });

    });
  }


  return chart;
}