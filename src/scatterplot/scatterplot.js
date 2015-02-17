import "scatterplotChart.js";
import "scatterplotStyle.js";

gd3.scatterplot = function(params) {
  var params = params || {},
      style = scatterplotStyle(params.style || {});

  return scatterplotChart(style);
}