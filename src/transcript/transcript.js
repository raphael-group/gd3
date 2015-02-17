import "transcriptChart";
import "transcriptStyle";

gd3.transcript = function(params) {
  var params = params || {},
      style  = transcriptStyle(params.style || {});

  // transcriptChart functions as a partial application, binding the given variables
  //   into the returned instance.
  return transcriptChart(style);
};