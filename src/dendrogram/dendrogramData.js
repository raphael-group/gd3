function dendrogramData(inputData, delta, T) {
  // Set delta to merge everything (unless it was set already)
  if (!delta) delta = inputData.Z[inputData.Z.length-1][2];

  // Cut the dendrogram accordingly and return
  return cutDendrogram(inputData, delta, T);
}

function cutDendrogram(data, delta, T){
  function MRCA(u, v){
    var parentsU = [],
        parentsV = [],
        node = u;

    while (node != null){
      node = T[node].parent;
      parentsU.push(node);
    }

    node = v;
    while (node != null){
      node = T[node].parent;
      if (parentsU.indexOf(node) != -1){
        return T[node].weight;
      }
    }
    return 0;
  }

  function subtreeDistance(t1, t2){ return MRCA(d3.max(t1), d3.max(t2)); }
  function isLeaf(v){ return v < N; }

  // Declarations
  var Z = [], labelToGroup = {}, groupLabels = {}, groupIndex = 0,
      rows = data.Z.filter(function(row){ return row[2] <= +delta; })
                   .map(function(row, i){ return row.slice(0, 3).concat([i]); }),
      n = rows.length,
      N = data.labels.length;

  // Add all the nodes that are below the cut value to the UnionFind
  var U = gd3_data_structures.UnionFind(),
      leafIndices = [];

  rows.forEach(function(row, i){
    U.union([row[0], row[1], N+i]);
    if (isLeaf(row[0])) leafIndices.push(row[0]);
    if (isLeaf(row[1])) leafIndices.push(row[1]);
  });

  leafIndices = leafIndices.sort(function(i, j){ return d3.ascending(+i, +j); });
  var labels = leafIndices.map(function(i){ return data.labels[i]; });

  // Then extract the labels that will still be required, normalizing
  // the rows to match their new numbers
  function addIfLeaf(v){
    // Ignore internal nodes, leaving the row unchanged
    if (!isLeaf(v)) return v;

    // Record leaves and assign them to groups
    var group = U.get(v);
    if (!(group in groupLabels)) groupLabels[group] = groupIndex++;
    // labels.push(data.labels[v]);
    labelToGroup[data.labels[v]] = groupLabels[group];

    // Relabel the leaf to its new index
    return leafIndices.indexOf(v);
  }

  rows.forEach(function(row, i){
    row[0] = addIfLeaf(row[0]);
    row[1] = addIfLeaf(row[1]);
  });

  // Normalize the values of each internal node (we can only
  // do this once we know the number of labels)
  var m = labels.length;
  rows.forEach(function(row){
    if (row[0] >= m) row[0] -= N - m;
    if (row[1] >= m) row[1] -= N - m;
  });

  // Compute the pseudoedges
  var groups = U.groups().map(function(g){
        return {members: g, _id: d3.max(g) - N + m};
      }),
      pairs = gd3_util.allPairs(groups),
      d = {};

  pairs.forEach(function(P){
    var dist = subtreeDistance(P[0].members, P[1].members);
    if (!d[P[0]._id]) d[P[0]._id] = {};
    if (!d[P[1]._id]) d[P[1]._id] = {};
    d[P[0]._id][P[1]._id] = dist;
    d[P[1]._id][P[0]._id] = dist;
  });

  var iterations = 0;
  while (pairs.length > 0){
    // Some sanity checking so the browser won't crash even if this infinitely loops
    if (iterations > 10000) throw new Error("This while loop shouldn't execute 10k times.")
    iterations++;

    // Identify the pair with minimum distance
    var toMerge, lowest = Number.MAX_VALUE;
    pairs.forEach(function(P, i){
      if (d[P[0]._id][P[1]._id] < lowest){
        lowest = d[P[0]._id][P[1]._id]
        toMerge = P;
      }
    });

    // Add that link to the linkage matrix
    rows.push([toMerge[0]._id, toMerge[1]._id, lowest, rows.length]);

    // Remove the groups/pairs that include either of the merged pairs
    var idsToRemove = [toMerge[0]._id, toMerge[1]._id];
    groups = groups.filter(function(G){ return idsToRemove.indexOf(G._id) === -1; });
    pairs = pairs.filter(function(P){
      return idsToRemove.indexOf(P[0]._id) === -1 &&
           idsToRemove.indexOf(P[1]._id) === -1;
    });

    // Add new pairs including the new group
    var newGroup = { _id: m + rows.length-1,
             members: d3.merge([toMerge[0].members, toMerge[1].members])
            };
    d[newGroup._id] = {};

    groups.forEach(function(G){
      var dist = d3.min([d[toMerge[0]._id][G._id], d[toMerge[1]._id][G._id]]);
      pairs.push([G, newGroup]);
      d[G._id][newGroup._id] = dist;
      d[newGroup._id][G._id] = dist;
    });
    groups.push(newGroup);
  }

  Z = rows.map(function(row){ return row.slice(0); });

  return { Z: Z, labels: labels, labelToGroup: labelToGroup };
}

///////////////////////////////////////////////////////////////////////////
// Create a tree to represent the linkage matrix and make it easy to
// compute distances between subtrees
function treeFromLinkageMatrix(data){
  var N = data.labels.length,
      T = {};

  data.Z.forEach(function(row, i){
    T[N+i] = { children: [row[0], row[1]], weight: row[2], parent: null };
    if (!(row[0] in T)) T[row[0]] = {};
    T[row[0]].parent = N+i;
    if (!(row[1] in T)) T[row[1]] = {};
    T[row[1]].parent = N+i;
  });

  return T;
}
