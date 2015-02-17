var gd3_data_structures = {
  UnionFind: function(){
    // Instance variables
    var weights = {},
      parents = {};

    // Find and return the name of the set containing the object
    function get(x){
      // check for previously unknown object
      if (!(x in parents)){
        parents[x] = x;
        weights[x] = 1;
        return x;
      } else {
        // find path of objects leading to the root
        var path = [x],
          root = parents[x],
          count = 0;

        while (root != path[path.length - 1] && count <= 15){
          path.push( root );
          root = parents[root];
          count++;
        }

        // compress the path and return
        path.forEach(function(ancestor){
          parents[ancestor] = root;
        });

        return root;
      }
    }

    // Find the sets containing the objects and merge them all
    function union(xs){
      // Convert xs to a list if it isn't one already
      if (xs.constructor != Array){
        xs = [xs];
      }

      // Merge all sets containing any x in xs
      var roots = xs.map(get),
        heaviest = d3.max(roots.map(function(r){ return [weights[r], r]; }))[1];

      roots.forEach(function(r){
        if (r != heaviest){
          weights[heaviest] += weights[r];
          parents[r] = heaviest;
        }
      });
    }

    // Return a list of lists containing each group
    function groups(){
      var groupIndex = 0,
        groupToIndex = {},
        currentGroups = [[]];

      Object.keys(parents).forEach(function(n){
        var group = get(n);
        if (!(group in groupToIndex)) groupToIndex[group] = groupIndex++;
        if (currentGroups.length <= groupToIndex[group]) currentGroups.push([]);
        currentGroups[groupToIndex[group]].push( +n );
      });

      return currentGroups;
    }

    return { get: get, union: union, groups: groups }; 
  }
}
