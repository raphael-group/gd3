import "heatmapChart.js";
import "heatmapStyle.js";

gd3.heatmap = function(params) {
  var params = params || {},
      style  = heatmapStyle(params.style || {});

  // heatmapChart functions as a partial application, binding the given variables
  //   into the returned instance.
  return heatmapChart(style);
};