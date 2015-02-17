function heatmapData(inputData) {
  var data = {
    annotations : undefined,
    cells : [],
    maxCellValue : Number.NEGATIVE_INFINITY,
    minCellValue : Number.POSITIVE_INFINITY,
    xs : [],
    ys : []
  }


  function defaultParse () {
    data.cells = inputData.cells;
    data.name = inputData.name;
    data.xs = inputData.xs;
    data.ys = inputData.ys;

    data.annotations = inputData.annotations;

    // Find max and min values to make color scale
    var tmp;
    for (var i=data.cells.length-1; i>=0; i--) {
      tmp = data.cells[i].value;
      if (tmp > data.maxCellValue) data.maxCellValue = tmp;
      if (tmp < data.minCellValue) data.minCellValue = tmp;
    }

    var datasetCatIndex = -1;
    if(data.annotations) {
      if(!data.annotations.annotationToColor) data.annotations.annotationToColor = {};

      data.annotations.categories.forEach(function(category, categoryIndex) {
        var entry = data.annotations.annotationToColor[category];
        if(entry && Object.keys(entry).length > 0) return;

        // Assume the data is continuous and find the min and max of the category
        var annotationNames = Object.keys(data.annotations.sampleToAnnotations),
            values = annotationNames.map(function(n) {
              return data.annotations.sampleToAnnotations[n][categoryIndex];
            });

        entry = [d3.min(values), d3.max(values)];

        data.annotations.annotationToColor[category] = entry;

      });
      // Set any missing column datasets to null
      data.columnIdToDataset = {};
      data.annotations.categories.forEach(function(c, i){
        if (c.toLowerCase() === "cancer type" || c.toLowerCase() === "dataset"){
          datasetCatIndex = i;
        }
      })
    }

    // If this category is giving the dataset (or cancer type) of the
    // column, add it to the map of column IDs to datasets
    if (datasetCatIndex !== -1){
      data.xs.forEach(function(n){
        data.columnIdToDataset[n] = data.annotations.sampleToAnnotations[n][datasetCatIndex];
      })
    } else {
      data.xs.forEach(function(n){ data.columnIdToDataset[n] = null; });
    }
  }

  defaultParse();

  data.sortColumns = function (columnIds) {
    data.xs.sort(function(a,b) { return columnIds.indexOf(a) - columnIds.indexOf(b); });
  }


  return data;
}