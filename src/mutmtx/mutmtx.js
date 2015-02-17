import "../core/class";
import "mutmtxChart";
import "mutmtxStyle";

gd3.mutationMatrix = function(params) {
  var params = params || {},
      style  = mutmtxStyle(params.style || {});

  // mutmtxChart functions as a partial application, binding the given variables
  //   into the returned instance.
  return mutmtxChart(style);
};