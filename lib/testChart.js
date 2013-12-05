function testChart(config) {
  var margin = {top: 20, right: 20, bottom: 20, left: 20},
      width = 500,
      height = 300;

  var styles = { 'backgroundColor': '#ccc' },
      bgColor = styles.backgroundColor;

  function chart(selection) {
    selection.each(function(data) {
      // Select the svg element, if it exists.

      var svg = d3.select(this).selectAll("svg").data([data]);

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg").append("g");

      svg.attr('width', width)
          .attr('height', height);

      svg.style('background-color', bgColor);

      var g = svg.select('g')
          .attr('transform', 'translate('+margin.left+','+margin.top+')');
    });
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  }

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.style = function(obj) {
    if (!arguments.length) return style;
    var keys = Object.keys(obj);
    for(k in keys) {
      var key = keys[k];
      styles[key] = '#0f0';
    }
    return chart;
  }

  return chart;
}