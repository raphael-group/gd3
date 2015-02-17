import "../core/util.js"
import "../core/dataStructures.js"
import "dendrogramChart";
import "dendrogramStyle";

gd3.dendrogram = function(params) {
  var params = params || {},
      style  = dendrogramStyle(params.style || {});

  // dendrogramChart functions as a partial application, binding the given variables
  //   into the returned instance.
  return dendrogramChart(style);
};