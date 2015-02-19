import "graphChart.js";
import "graphStyle.js";

gd3.graph = function(params) {
  var params = params || {},
      style  = graphStyle(params.style || {});

  // graphChart functions as a partial application, binding the given variables
  //   into the returned instance.
  return graphChart(style);
};