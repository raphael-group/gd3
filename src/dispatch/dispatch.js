gd3.dispatch = d3.dispatch('sample', 'interaction', 'sort', 'filterCategory', 'filterType', 'mutation', 'filterMutationType');

// filter dataset is akin to filtering by cancer type, since each cancer type is its own dataset
// filter cell type is akin to filtering by insertion or deletion mutations, since they are a datatype within a dataset
