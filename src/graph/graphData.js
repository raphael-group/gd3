function graphData(inputData) {
  var data = {
    edges : [],
    nodes : []
  }


  function defaultParse () {
    data.title = inputData.title || '';
    data.edges = inputData.edges;
    data.nodes = inputData.nodes;
    data.links = loadLinks(data.edges,data.nodes);

    data.maxNodeValue = d3.max(data.nodes.map(function(d) { return d.value; }));
    data.minNodeValue = d3.min(data.nodes.map(function(d) { return d.value; }));

    data.edgeCategories = [];

    // add edge categories only if they exist
    var categories = {};
    if(data.edges.length && data.edges[0].categories) {
      data.edges.forEach(function(e) {
        e.categories.forEach(function(c) {
          categories[c] = null;
        });
      });
      data.edgeCategories = Object.keys(categories);
    }

    // creates a force-directed layout friendly link list
    function loadLinks(edges, nodes) {
      var links = [],
          nodeToIndex = {};

      nodes.forEach(function(n, i){ nodeToIndex[n.name] = i; });
      edges.forEach(function(d){
        links.push({
          source: nodes[nodeToIndex[d.source]],
          target: nodes[nodeToIndex[d.target]],
          weight: d.weight,
          categories: d.categories,
          references: d.references
        });
      });

      return links;
    } // end loadLinks()
  }

  defaultParse();

  return data;
}