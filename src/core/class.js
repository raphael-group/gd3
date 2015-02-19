// Thanks goes to mbostock and D3 implementation
// https://github.com/mbostock/d3/blob/master/src/core/class.js

function gd3_class(ctor, properties) {
  try {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  } catch (e) {
    ctor.prototype = properties;
  }
}