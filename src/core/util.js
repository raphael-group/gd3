var gd3_util = {
  arraysEqual: function(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;

        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.

        for (var i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      },
  arrayToSet: function(a) {
    var seen = {};
    return a.filter(function(item) {
      return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
  },
  allPairs: function(xs){
    var n = xs.length,
        pairs = [];

    for (var i = 0; i < n; i++){
      for (var j = i+1; j < n; j++){
        pairs.push( [xs[i], xs[j]] );
      }
    }
    return pairs;
  },
  selectionSize: function(selection){
    var n = 0;
    selection.each(function() { ++n; });
    return n;
  }
}