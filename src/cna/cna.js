import "cnaChart";
import "cnaStyle";

gd3.cna = function(params) {
  var params = params || {},
      style  = cnaStyle(params.style || {});

  // cnaChart functions as a partial application, binding the given variables
  //   into the returned instance.
  return cnaChart(style);
};