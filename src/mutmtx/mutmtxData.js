function mutmtxData(inputData) {
  var data = {
    datasets: [],
    glyphs: ['square', 'triangle-up', 'cross', 'circle', 'diamond', 'triangle-down'],
    hiddenColumns: {
      byCategory: [],
      byType: []
    },
    ids: {
      columns: [],
      rows: []
    },
    labels: {
      columns: [],
      rows: []
    },
    maps: {
      cellTypeToTick: inputData.cellTypeToTick || {snv: 'full', amp: 'up', del: 'down'},
      cellTypeToLabel: inputData.cellTypeToLabel || {snv: 'SNV', inactive_snv: 'Inactivating SNV', amp: 'Amplification', del: 'Deletion'},
      cellTypeToGlyph: inputData.cellTypeToGlyph || {snv: null, inactive_snv: 'square'},
      cellTypeToSortIndex: inputData.cellTypeToSortIndex || {snv: 0, inactive_snv: 1, del: 2, amp: 3},
      columnIdToLabel: {},
      columnIdToCategory: {},
      columnIdToTypes: {},
      rowIdToLabel: {}
    },
    matrix: {
      cells : {},
      columnIdToActiveRows : {},
      rowIdToActiveColumns : {}
    },
    types: []
  };

  data.coverage = function(){
    var mutatedSamples = d3.merge(data.ids.rows.map(function(d){
          return data.matrix.rowIdToActiveColumns[d];
        })),
        numMutatedSamples = d3.set(mutatedSamples).values().length,
        s = ((numMutatedSamples*100. / data.numSamples).toFixed(2)) + "%";
    return s + " (" + numMutatedSamples + "/" + data.numSamples + ")";
  }

  data.get = function(attr) {
    if (!attr) return null;
    else if (attr === 'datasets') return data.datasets;
    else if (attr === 'ids') return data.ids;
    else if (attr === 'labels') return data.labels;
  }

  data.reorderColumns = function(ordering) {
    // Sort by whether or not the column is visible (i.e., has been filtered)
    function sortByVisibility(c1, c2) {
      var c1Hidden = data.hiddenColumns.byCategory[c1] || data.hiddenColumns.byType[c1] ? true : false,
          c2Hidden = data.hiddenColumns.byCategory[c2] || data.hiddenColumns.byType[c2] ? true : false;

      if (c1Hidden == c2Hidden) return 0;
      else if (c1Hidden) return 1;
      else if (c2Hidden) return -1;
      else return 0;
    }

    // Sort by the column's most common cell type
    function sortByCellType(c1,c2) {
      var c1Type = data.maps.columnIdToTypes[c1][0],
          c2Type = data.maps.columnIdToTypes[c2][0];
      return d3.ascending(data.maps.cellTypeToSortIndex[c1Type], data.maps.cellTypeToSortIndex[c2Type]);
    }
    // Sort by how exclusive each column's mutations are with one another
    function sortByExclusivity(c1, c2) {
      var c1X = data.matrix.columnIdToActiveRows[c1].length > 1,
          c2X = data.matrix.columnIdToActiveRows[c2].length > 1;
      return d3.ascending(c1X, c2X);
    }
    // Sort by which column has more "top" activations in the rendered graphic
    function sortByFirstActiveRow(c1, c2) {
      var c1First = data.matrix.columnIdToActiveRows[c1][0],
          c2First = data.matrix.columnIdToActiveRows[c2][0];
      return d3.ascending(c1First,c2First);
    }
    // Sort by the name of the column
    function sortByName(c1,c2) {
      var c1Label = data.maps.columnIdToLabel[c1],
          c2Label = data.maps.columnIdToLabel[c2];

      return d3.ascending(c1Label, c2Label);
      //return d3.ascending(data.labels.columns[c1],data.labels.columns[c2]);
    }
    // Sort by the column category (i.e, color)
    function sortByColumnCategory(c1,c2) {
      return d3.ascending(data.maps.columnIdToCategory[c1], data.maps.columnIdToCategory[c2]);
    }

    // Sort the data based on input, or if none, on default ordering
    var sortFns;
    if(ordering) {
      sortFns = [sortByVisibility];
      ordering.forEach(function(d) {
        if(d == 'First active row') sortFns.push(sortByFirstActiveRow);
        if(d == 'Column category') sortFns.push(sortByColumnCategory);
        if(d == 'Exclusivity') sortFns.push(sortByExclusivity);
        if(d == 'Name') sortFns.push(sortByName);
      });
    }
    else {
      sortFns = [sortByVisibility, sortByFirstActiveRow, sortByColumnCategory, sortByExclusivity, sortByCellType, sortByName];
    }

    data.ids.columns.sort(function(c1,c2) {
      var sortResult;
      for(var i = 0; i < sortFns.length; i++) {
        sortResult = sortFns[i](c1,c2);
        if (sortResult != 0) {
          return sortResult;
        }
      }
      return sortResult;
    });
  } // end data.reorderColumns()

  data.recomputeLabels = function(){
    data.labels.rows = data.labels.rows.map(function(rowLabel){
      var rowId = rowLabel.split(" (")[0],
          count = Object.keys(inputData.M[rowId]).reduce(function(sum, colId){
            if (data.hiddenColumns.byCategory[colId] || data.hiddenColumns.byType[colId]) return sum;
            else return sum + 1;
          }, 0);
      return rowId + " (" + count + ")";
    });
  }

  function defaultParse() {
    // Scrape labels from the matrix
    inputData.samples.forEach(function(s) {
      data.maps.columnIdToLabel[s._id] = s.name;
      data.labels.columns.push(s.name);
    });

    // Determine the total number of samples across all types
    if (inputData.typeToSamples && inputData.sampleTypes){
      data.numSamples = inputData.sampleTypes.reduce(function(total, t){
        return total + inputData.typeToSamples[t].length;
      },0);
    } else {
      data.numSamples = inputData.samples.length;
    }

    var rowAndCount = [];
    Object.keys(inputData.M).forEach(function(k, i) {
      // data.maps.rowIdToLabel[i.toString()] = k;
      var numSamples = Object.keys(inputData.M[k]).length;
      // data.labels.rows.push(k + ' ('+numSamples+')');
      rowAndCount.push([k,numSamples]);
    });

    var sortedRowIds = [];
    rowAndCount.sort(function(a,b) { return a[1] < b[1] ? 1 : -1; });
    rowAndCount.forEach(function(d, i) {
      var name = d[0],
          numSamples = d[1];
      data.maps.rowIdToLabel[i.toString()] = name;
      data.labels.rows.push(name + ' ('+numSamples+')');
      sortedRowIds.push(name);
    });


    data.ids.columns = Object.keys(data.maps.columnIdToLabel);
    data.ids.rows = Object.keys(data.maps.rowIdToLabel);

    // Make set of datasets in data
    var setOfDatasets = {};
    Object.keys(inputData.sampleToTypes).forEach(function(colId) {
      setOfDatasets[inputData.sampleToTypes[colId]] = null;
      data.maps.columnIdToCategory[colId] = inputData.sampleToTypes[colId];
    });
    data.datasets = Object.keys(setOfDatasets);

    // Build matrix data and maps
    var cellTypes = []
    sortedRowIds.forEach(function(rowLabel, rowId) {
      var columns = Object.keys(inputData.M[rowLabel]);
      rowId = rowId.toString();
      // Add rowId -> columns mapping
      data.matrix.rowIdToActiveColumns[rowId] = columns;
      // Add columnId -> row mapping
      columns.forEach(function(colId) {
        // If the entry doesn't exist, build it
        if(!data.matrix.columnIdToActiveRows[colId]) {
          data.matrix.columnIdToActiveRows[colId] = [];
        }
        // Add the row to the column
        data.matrix.columnIdToActiveRows[colId].push(rowId);

        // Add cell data
        var type = inputData.M[rowLabel][colId][0];
        data.matrix.cells[[rowId,colId].join()] = {
          dataset: inputData.sampleToTypes[colId],
          type: inputData.M[rowLabel][colId][0]
        };
        cellTypes.push(type);

        // Track the types of cells in the data
        if(!data.maps.columnIdToTypes[colId]) data.maps.columnIdToTypes[colId] = [];
        data.maps.columnIdToTypes[colId].push(type);
      });
    }); // end matrix mapping

    // Remove repeat types
    data.types = cellTypes.filter(function(item, pos, self) {
      return self.indexOf(item) == pos;
    });

    // Process the column to type map s.t. there are no repeats and
    //   the map is ordered by population of each type
    Object.keys(data.maps.columnIdToTypes).forEach(function(colId) {
      var types = data.maps.columnIdToTypes[colId],
          typeLog = {};
      types.forEach(function(t) {
        if(!typeLog[t]) typeLog[t] = 0;
        typeLog[t] = typeLog[t] + 1;
      });

      types = Object.keys(typeLog);
      types.sort(function(a,b) { return typeLog[a] < typeLog[b]; });
      data.maps.columnIdToTypes[colId] = types;
    });
    data.types.forEach(function(t){
      if (!(t in data.maps.cellTypeToTick)){
        data.maps.cellTypeToTick[t] = 'full';
      }
      if (!(t in data.maps.cellTypeToLabel)){
        data.maps.cellTypeToLabel[t] = t.replace("_", " ");
      }
    })

    // Load the cell type to glyph mapping if it exists, else create it
    if (inputData.cellTypesToGlyph) {
      data.maps.cellTypeToGlyph = inputData.cellTypeToGlyph;
    } else {
      // Remove duplicates from the cellTypes array
      var typesTmp = {};
      cellTypes.forEach(function(t) {
        if(typesTmp[t] == undefined) typesTmp[t] = 0;
        typesTmp[t] = typesTmp[t] + 1;
      });
      var types = Object.keys(typesTmp).sort(function(a,b) { typesTmp[a] > typesTmp[b] });

      types.forEach(function(d,i) {
        if (d in data.maps.cellTypeToGlyph) return;
        if (data.maps.cellTypeToTick[d] != 'full'){
          data.maps.cellTypeToGlyph[d] = null;
        } else {
          data.maps.cellTypeToGlyph[d] = data.glyphs[i%data.glyphs.length];
        }
      });
    } // end glyph mapping
  }

  defaultParse();

  // sample annotation data processing, if present
  if(inputData.annotations) {
    data.annotations = inputData.annotations;
  } else {
    data.annotations = { categories: [], sampleToAnnotations: {}, annotationToColor: {} };
    data.ids.columns.forEach(function(s){
      data.annotations.sampleToAnnotations[data.maps.columnIdToLabel[s]] = [];
    });
  }

  // create simulated annotation data if it does not exist.
  // Object.keys(data.matrix.cells).forEach(function(key) {
  //   if (data.matrix.cells[key].annotation == undefined) {
  //     var vote = {
  //       type: 'vote',
  //       score: 100
  //     }
  //     var link = {
  //       type: 'link',
  //       href: 'http://www.cs.brown.edu',
  //       text: 'BrownCS'
  //     }
  //     data.matrix.cells[key].annotation = [
  //       {
  //         type: 'text',
  //         title: 'Sample',
  //         text: key
  //       },
  //       {
  //         type: 'table',
  //         header: ['Cancer', 'PMIDs', 'Votes'],
  //         data: [
  //           ['1', link, vote],
  //           ['4', link, vote]
  //         ]
  //       }
  //     ];
  //   }
  // }); // end simulated annotation data

  return data;
}