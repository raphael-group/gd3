!function() {
  var gd3 = {
    version: "0.2.1"
  };
  gd3.dispatch = d3.dispatch("sample", "interaction", "sort", "filterCategory", "filterType", "mutation", "filterMutationType");
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
  gd3.color = {};
  gd3.color.noData = "#eeeeee";
  gd3.color.categoryPalette;
  gd3.color.annotationPalettes = {};
  gd3.color.annotationToType = {};
  gd3.color.palettes = {};
  gd3.color.palettes.categorical_cbSafe = {
    1: [ "#1f78b4" ],
    2: [ "#1f78b4", "#b2df8a" ],
    3: [ "#a6cee3", "#1f78b4", "#b2df8a" ],
    4: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c" ]
  };
  gd3.color.palettes.categorical = {
    5: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99" ],
    6: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c" ],
    7: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f" ],
    8: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00" ],
    9: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6" ],
    10: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a" ],
    11: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99" ],
    12: [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928" ]
  };
  gd3.color.palettes.annotation_discrete = [ [ "#ad494a", "#a55194", "#8ca252", "#8c6d31", "#843c39", "#393b79", "#7b4173", "#637939", "#e7ba52", "#bd9e39", "#cedb9c", "#ce6dbd", "#d6616b", "#9c9ede", "#b5cf6b", "#5254a3", "#e7969c", "#6b6ecf", "#e7cb94", "#de9ed6" ], [ "#fd8d3c", "#31a354", "#9e9ac8", "#969696", "#756bb1", "#3182bd", "#636363", "#e6550d", "#a1d99b", "#74c476", "#fdd0a2", "#bdbdbd", "#bcbddc", "#c6dbef", "#fdae6b", "#6baed6", "#dadaeb", "#9ecae1", "#c7e9c0", "#d9d9d9" ] ];
  gd3.color.palettes.annotation_continuous = [ [ "rgb(247,252,245)", "rgb(0,68,27)" ], [ "rgb(252,251,253)", "rgb(63,0,125)" ], [ "rgb(240,240,240)", "rgb(0,0,0)" ], [ "rgb(255,245,235)", "rgb(127,39,4)" ], [ "rgb(255,245,240)", "rgb(103,0,13)" ] ];
  gd3.color.annotations = function() {
    if (arguments.length == 0) return gd3.color.annotationPalettes;
    if (arguments.length == 1) return gd3.color.annotationPalettes[arguments[0]];
    if (Object.prototype.toString.call(arguments[1]) !== "[object Array]") {
      throw "annotations() must be passed: (1) the annotation name, (2) an array of annotation values" + ' OR the range of values, (3) [optionally] a string declaring if the data is "discrete"' + ' or "continuous"';
    }
    if (arguments.length > 2 && arguments[2] != "discrete" && arguments[2] != "continuous") {
      throw 'annotations() third argument must either be "discrete" or "continuous"';
    }
    var scale;
    var annotation = arguments[0], data = arguments[1];
    var type;
    if (arguments.length > 2) type = arguments[2]; else if (data.length == 2 && typeof data[0] === "number" && typeof data[1] === "number") type = "continuous"; else type = "discrete";
    gd3.color.annotationToType[annotation] = type;
    if (type == "continuous") {
      scale = d3.scale.linear().domain([ d3.min(data), d3.max(data) ]);
    } else {
      scale = d3.scale.ordinal().domain(data);
    }
    var colors;
    if (arguments.length > 3) {
      if (Object.prototype.toString.call(arguments[3]) !== "[object Array]") {
        throw "annotations()'s third argument must be an array of colors you wish to use in your annotation scale";
      }
      colors = arguments[3];
    } else {
      var numOfType = Object.keys(gd3.color.annotationPalettes).filter(function(d) {
        return gd3.color.annotationToType[d] == type;
      }).length, palettes = gd3.color.palettes;
      var paletteIndex;
      if (type == "discrete") {
        paletteIndex = palettes.annotation_discrete.length % (numOfType + 1);
      } else {
        paletteIndex = palettes.annotation_continuous.length % (numOfType + 1);
      }
      var palette = (type == "discrete" ? palettes.annotation_discrete : palettes.annotation_continuous)[paletteIndex];
      colors = palette;
    }
    scale.range(colors);
    gd3.color.annotationPalettes[annotation] = scale;
  };
  gd3.color.categories = function() {
    function isArrayTest() {
      for (var i = 0; i < arguments.length; i++) {
        var a = arguments[i];
        if (Object.prototype.toString.call(a) !== "[object Array]") {
          throw "categories() must be passed: (1) an array of categories, (2) an array of categories" + " and an array of colors";
        }
        if (a.length == 0) throw "categories() must be passed non-empty arrays for arguments";
      }
    }
    if (arguments.length == 0) return gd3.color.categoryPalette; else if (arguments.length == 1) {
      var categories = arguments[0];
      isArrayTest(categories);
      var colors;
      if (categories.length < 5) {
        colors = gd3.color.palettes.categorical_cbSafe[categories.length];
      } else if (categories.length < 13) {
        colors = gd3.color.palettes.categorical[categories.length];
      } else {
        colors = d3.scale.category20().range();
      }
      gd3.color.categoryPalette = d3.scale.ordinal().domain(categories).range(colors);
    } else if (arguments.length > 1) {
      var categories = arguments[0], colors = arguments[1];
      isArrayTest(categories, colors);
      gd3.color.categoryPalette = d3.scale.ordinal().domain(categories).range(colors);
    }
    return gd3.color.categoryPalette;
  };
  var gd3_util = {
    arraysEqual: function(a, b) {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (a.length != b.length) return false;
      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    },
    arrayToSet: function(a) {
      var seen = {};
      return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : seen[item] = true;
      });
    },
    allPairs: function(xs) {
      var n = xs.length, pairs = [];
      for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
          pairs.push([ xs[i], xs[j] ]);
        }
      }
      return pairs;
    },
    selectionSize: function(selection) {
      var n = 0;
      selection.each(function() {
        ++n;
      });
      return n;
    }
  };
  var gd3_data_structures = {
    UnionFind: function() {
      var weights = {}, parents = {};
      function get(x) {
        if (!(x in parents)) {
          parents[x] = x;
          weights[x] = 1;
          return x;
        } else {
          var path = [ x ], root = parents[x], count = 0;
          while (root != path[path.length - 1] && count <= 15) {
            path.push(root);
            root = parents[root];
            count++;
          }
          path.forEach(function(ancestor) {
            parents[ancestor] = root;
          });
          return root;
        }
      }
      function union(xs) {
        if (xs.constructor != Array) {
          xs = [ xs ];
        }
        var roots = xs.map(get), heaviest = d3.max(roots.map(function(r) {
          return [ weights[r], r ];
        }))[1];
        roots.forEach(function(r) {
          if (r != heaviest) {
            weights[heaviest] += weights[r];
            parents[r] = heaviest;
          }
        });
      }
      function groups() {
        var groupIndex = 0, groupToIndex = {}, currentGroups = [ [] ];
        Object.keys(parents).forEach(function(n) {
          var group = get(n);
          if (!(group in groupToIndex)) groupToIndex[group] = groupIndex++;
          if (currentGroups.length <= groupToIndex[group]) currentGroups.push([]);
          currentGroups[groupToIndex[group]].push(+n);
        });
        return currentGroups;
      }
      return {
        get: get,
        union: union,
        groups: groups
      };
    }
  };
  function cnaData(data) {
    function braph(cdata) {
      var gene = cdata.gene || "", geneinfo = cdata.neighbors || [], region = cdata.region || {};
      samplesToTypes = cdata.sampleToTypes || {}, seg = cdata.segments;
      var chrm = region.chr, allmin = 0, allmax = 0, minSegXLoc = region.minSegX, maxSegXLoc = region.maxSegX;
      var geneJSON = geneinfo.map(function(d) {
        var selected = d.name == gene;
        return {
          fixed: selected ? true : false,
          start: d.start,
          end: d.end,
          label: d.name,
          selected: selected
        };
      });
      var sampleTypes = [], samplelst = [], segJSON = [];
      seg.forEach(function(d) {
        samplelst.push(d.sample);
        var dSegments = d.segments;
        dSegments.forEach(function(s) {
          segJSON.push({
            gene: gene,
            start: s.start,
            end: s.end,
            label: s.sample,
            sample: d.sample,
            dataset: samplesToTypes[d.sample],
            ty: s.ty
          });
          if (sampleTypes.indexOf(samplesToTypes[d.sample]) === -1) {
            sampleTypes.push(samplesToTypes[s.sample]);
          }
        });
      });
      segJSON.sort(function(a, b) {
        if (a.dataset != b.dataset) return d3.ascending(a.dataset, b.dataset); else return d3.ascending(a.end - a.start, b.end - b.start);
      });
      var sampleTypeToInclude = {};
      sampleTypes.sort().forEach(function(d) {
        sampleTypeToInclude[d] = true;
      });
      var d = {
        genes: geneJSON,
        sampleTypes: sampleTypes,
        samplesToTypes: samplesToTypes,
        segments: segJSON,
        segmentDomain: [ minSegXLoc, maxSegXLoc ],
        sampleTypeToInclude: sampleTypeToInclude
      };
      d.get = function(arg) {
        if (arg == "genes") return d.genes; else if (arg == "sampleTypes") return d.sampleTypes; else if (arg == "samplesToTypes") return d.samplesToTypes; else if (arg == "segments") return d.segments; else if (arg == "amps") return d.amps; else if (arg == "dels") return d.dels; else if (arg == "segmentDomain") return d.segmentDomain; else return undefined;
      };
      d.recomputeSegmentIndices = function() {
        var ampIndex = 0, delIndex = 0;
        d.segments.forEach(function(datum) {
          if (d.sampleTypeToInclude[datum.dataset]) {
            if (datum.ty == "amp") datum.index = ampIndex++;
            if (datum.ty == "del") datum.index = delIndex++;
          }
        });
        d.numAmps = ampIndex;
        d.numDels = delIndex;
      };
      d.recomputeSegmentIndices();
      return d;
    }
    var cnaData = braph(data);
    return cnaData;
  }
  function cnaChart(style) {
    function chart(selection) {
      selection.each(function(data) {
        data = cnaData(data);
        var genomeBarHeight = style.genomeBarHeight, ampAreaHeight = data.numAmps * style.horizontalBarSpacing, delAreaHeight = data.numDels * style.horizontalBarSpacing, height = style.margin.top + style.margin.bottom + genomeBarHeight + delAreaHeight + ampAreaHeight, width = style.width;
        var d3color = d3.scale.category20(), segmentTypeToColor = {};
        for (var i = 0; i < data.get("sampleTypes").length; i++) {
          segmentTypeToColor[data.get("sampleTypes")[i]] = d3color(i);
        }
        var svgActual = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg").attr("height", height).attr("width", width);
        var svg = svgActual.append("g");
        var bgMasks = svg.selectAll(".cna-bg").data([ {
          y: 0,
          height: ampAreaHeight
        }, {
          y: height - delAreaHeight,
          height: delAreaHeight
        } ]).enter().append("rect").attr("class", "cna-bg").attr("width", width).attr("height", function(d) {
          return d.height;
        }).attr("y", function(d) {
          return d.y;
        }).style("fill", style.backgroundColor);
        var start = d3.min(data.segmentDomain), stop = d3.max(data.segmentDomain);
        var x = d3.scale.linear().domain([ start, stop ]).range([ 0, width ]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5).tickSize(0).tickPadding(1.25);
        var zoom = d3.behavior.zoom().x(x).scaleExtent([ 1, 100 ]).on("zoom", function() {
          updateAllComponents();
        });
        svg.call(zoom).on("dblclick.zoom", null);
        var genomeBarY = ampAreaHeight + style.margin.top;
        var genomeBar = svg.append("rect").attr("class", "genome").attr("y", genomeBarY).attr("x", 0).attr("width", width).attr("height", style.genomeBarHeight).style("fill", "#ccc");
        var geneGroups = svg.selectAll(".genes").data(data.get("genes")).enter().append("g").attr("class", "genes"), genes = geneGroups.append("rect").attr("width", function(d) {
          return x(d.end) - x(d.start);
        }).attr("height", style.genomeBarHeight + 2 * style.geneHeightOverflow).attr("y", genomeBarY - style.geneHeightOverflow).style("fill-opacity", function(d) {
          return d.selected ? 1 : .2;
        }).style("fill", function(d) {
          return d.selected ? style.geneSelectedColor : style.geneColor;
        }).attr("id", function(d, i) {
          return "gene-" + i;
        }), geneLabels = geneGroups.append("text").attr("y", genomeBarY + style.genomeBarHeight / 2 + 5).attr("text-anchor", "middle").style("fill-opacity", function(d) {
          return d.selected ? 1 : 0;
        }).style("fill", "#000").style("font-family", style.fontFamily).style("font-size", style.fontSize).text(function(d) {
          return d.label;
        });
        geneGroups.on("mouseover", function(d) {
          if (!d.fixed) {
            d3.select(this).select("rect").style("fill", style.geneHighlightColor);
            d3.select(this).select("text").style("fill-opacity", 1);
          }
        });
        geneGroups.on("mouseout", function(d, i) {
          if (!d.fixed) {
            d3.select(this).select("rect").style("fill", function(d) {
              return d.selected ? style.geneSelectedColor : style.geneColor;
            });
            d3.select(this).select("text").style("fill-opacity", 0);
          }
        });
        geneGroups.on("dblclick", function(d, i) {
          d.fixed = d.fixed ? false : true;
          if (d.fixed) {
            d3.select(this).select("rect").style("fill", function(d) {
              return d.selected ? style.geneSelectedColor : style.geneHighlightColor;
            });
            d3.select(this).select("text").style("fill-opacity", 1);
          }
        });
        var segmentsG = svg.append("g"), segments = segmentsG.selectAll(".segments").data(data.get("segments")).enter().append("g").attr("class", "intervals");
        var minSegmentX = d3.min(data.get("segmentDomain")), maxSegmentX = d3.max(data.get("segmentDomain"));
        segs = segments.append("rect").attr("fill", function(d) {
          if (gd3.color.categoryPalette) return gd3.color.categoryPalette(samplesToTypes[d.sample]);
          return segmentTypeToColor[samplesToTypes[d.sample]];
        }).attr("width", function(d) {
          return x(d.end, minSegmentX, maxSegmentX) - x(d.start, minSegmentX, maxSegmentX);
        }).attr("height", style.horizontalBarHeight).attr("id", function(d, i) {
          return "interval-" + i;
        });
        var verticalBars = svg.selectAll(".vert-bar").data(data.get("genes").filter(function(d) {
          return d.selected;
        })).enter().append("rect").attr("y", 0).attr("width", function(d) {
          return x(d.end) - x(d.start);
        }).attr("height", height).style("fill", style.geneSelectedColor).style("fill-opacity", .5);
        updateGeneBar();
        updateSegments();
        function updateAllComponents() {
          var t = zoom.translate(), tx = t[0], ty = t[1], scale = zoom.scale();
          tx = Math.min(tx, 0);
          zoom.translate([ tx, ty ]);
          var curMin = d3.min(x.domain()), curMax = d3.max(x.domain());
          x.domain([ curMin, curMax ]);
          updateGeneBar();
          updateSegments();
        }
        function updateGeneBar() {
          verticalBars.attr("x", function(d) {
            return x(d.start);
          }).attr("width", function(d) {
            return x(d.end) - x(d.start);
          });
          genes.attr("transform", function(d, i) {
            return "translate(" + x(d.start) + ",0)";
          });
          genes.attr("width", function(d, i) {
            return x(d.end) - x(d.start);
          });
          geneLabels.attr("transform", function(d, i) {
            var x1 = d3.max([ d.start, d3.max(x.domain()) ]), x2 = d3.min([ d.end, d3.min(x.domain()) ]);
            return "translate(" + x(d.start + (d.end - d.start) / 2) + ",0)";
          });
        }
        function segY(d) {
          if (d.ty == "amp") {
            return ampAreaHeight - style.horizontalBarHeight - style.horizontalBarSpacing * d.index;
          } else if (d.ty == "del") {
            return height - delAreaHeight + style.horizontalBarSpacing * d.index;
          } else {
            console.log("Segment of unknown type: " + d.ty);
          }
        }
        function updateSegments() {
          segs.attr("transform", function(d, i) {
            return "translate(" + x(d.start) + "," + segY(d) + ")";
          }).attr("width", function(d, i) {
            return x(d.end) - x(d.start);
          });
          var activeIntervals = segments.filter(function(d) {
            return data.sampleTypeToInclude[samplesToTypes[d.sample]];
          }).style("opacity", 1);
          segments.filter(function(d) {
            return !data.sampleTypeToInclude[samplesToTypes[d.sample]];
          }).style("opacity", 0);
        }
        segs.attr({
          "stroke-width": 1,
          stroke: "black",
          "stroke-opacity": 0
        }).on("mouseover.dispatch-sample", function(d) {
          gd3.dispatch.sample({
            sample: d.sample,
            opacity: 1
          });
        }).on("mouseout.dispatch-sample", function(d) {
          gd3.dispatch.sample({
            sample: d.sample,
            opacity: 0
          });
        }).on("click.dispatch-mutation", function(d) {
          gd3.dispatch.mutation({
            dataset: d.dataset,
            gene: data.gene,
            mutation_class: d.ty
          });
        });
        gd3.dispatch.on("sample.cna", function(d) {
          var opacity = d.opacity, sample = d.sample;
          segs.attr("stroke-opacity", 0);
          segs.filter(function(d) {
            return d.sample == sample;
          }).attr("stroke-opacity", opacity);
        });
        gd3.dispatch.on("filterCategory.cnas", function(d) {
          if (!d || !d.categories) return;
          data.sampleTypes.forEach(function(s) {
            data.sampleTypeToInclude[s] = true;
          });
          d.categories.forEach(function(s) {
            data.sampleTypeToInclude[s] = false;
          });
          updateAllComponents();
        });
      });
    }
    return chart;
  }
  function cnaStyle(style) {
    return {
      fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: style.fontSize || "12px",
      geneColor: style.geneColor || "#aaa",
      backgroundColor: style.backgroundColor || "#f6f6f6",
      geneHeightOverflow: style.geneHeightOverflow || 5,
      geneHighlightColor: style.geneHighlightColor || "#f00",
      geneSelectedColor: style.geneSelectedColor || "#f00",
      genomeBarHeight: style.genomeBarHeight || 14,
      horizontalBarHeight: style.horizontalBarHeight || 5,
      horizontalBarSpacing: style.horizontalBarSpacing || 6,
      width: style.width || 500,
      margin: style.margin || {
        top: 10,
        bottom: 10
      }
    };
  }
  gd3.cna = function(params) {
    var params = params || {}, style = cnaStyle(params.style || {});
    return cnaChart(style);
  };
  function dendrogramData(inputData, delta, T) {
    if (!delta) delta = inputData.Z[inputData.Z.length - 1][2];
    return cutDendrogram(inputData, delta, T);
  }
  function cutDendrogram(data, delta, T) {
    function MRCA(u, v) {
      var parentsU = [], parentsV = [], node = u;
      while (node != null) {
        node = T[node].parent;
        parentsU.push(node);
      }
      node = v;
      while (node != null) {
        node = T[node].parent;
        if (parentsU.indexOf(node) != -1) {
          return T[node].weight;
        }
      }
      return 0;
    }
    function subtreeDistance(t1, t2) {
      return MRCA(d3.max(t1), d3.max(t2));
    }
    function isLeaf(v) {
      return v < N;
    }
    var Z = [], labelToGroup = {}, groupLabels = {}, groupIndex = 0, rows = data.Z.filter(function(row) {
      return row[2] <= +delta;
    }).map(function(row, i) {
      return row.slice(0, 3).concat([ i ]);
    }), n = rows.length, N = data.labels.length;
    var U = gd3_data_structures.UnionFind(), leafIndices = [];
    rows.forEach(function(row, i) {
      U.union([ row[0], row[1], N + i ]);
      if (isLeaf(row[0])) leafIndices.push(row[0]);
      if (isLeaf(row[1])) leafIndices.push(row[1]);
    });
    leafIndices = leafIndices.sort(function(i, j) {
      return d3.ascending(+i, +j);
    });
    var labels = leafIndices.map(function(i) {
      return data.labels[i];
    });
    function addIfLeaf(v) {
      if (!isLeaf(v)) return v;
      var group = U.get(v);
      if (!(group in groupLabels)) groupLabels[group] = groupIndex++;
      labelToGroup[data.labels[v]] = groupLabels[group];
      return leafIndices.indexOf(v);
    }
    rows.forEach(function(row, i) {
      row[0] = addIfLeaf(row[0]);
      row[1] = addIfLeaf(row[1]);
    });
    var m = labels.length;
    rows.forEach(function(row) {
      if (row[0] >= m) row[0] -= N - m;
      if (row[1] >= m) row[1] -= N - m;
    });
    var groups = U.groups().map(function(g) {
      return {
        members: g,
        _id: d3.max(g) - N + m
      };
    }), pairs = gd3_util.allPairs(groups), d = {};
    pairs.forEach(function(P) {
      var dist = subtreeDistance(P[0].members, P[1].members);
      if (!d[P[0]._id]) d[P[0]._id] = {};
      if (!d[P[1]._id]) d[P[1]._id] = {};
      d[P[0]._id][P[1]._id] = dist;
      d[P[1]._id][P[0]._id] = dist;
    });
    var iterations = 0;
    while (pairs.length > 0) {
      if (iterations > 1e4) throw new Error("This while loop shouldn't execute 10k times.");
      iterations++;
      var toMerge, lowest = Number.MAX_VALUE;
      pairs.forEach(function(P, i) {
        if (d[P[0]._id][P[1]._id] < lowest) {
          lowest = d[P[0]._id][P[1]._id];
          toMerge = P;
        }
      });
      rows.push([ toMerge[0]._id, toMerge[1]._id, lowest, rows.length ]);
      var idsToRemove = [ toMerge[0]._id, toMerge[1]._id ];
      groups = groups.filter(function(G) {
        return idsToRemove.indexOf(G._id) === -1;
      });
      pairs = pairs.filter(function(P) {
        return idsToRemove.indexOf(P[0]._id) === -1 && idsToRemove.indexOf(P[1]._id) === -1;
      });
      var newGroup = {
        _id: m + rows.length - 1,
        members: d3.merge([ toMerge[0].members, toMerge[1].members ])
      };
      d[newGroup._id] = {};
      groups.forEach(function(G) {
        var dist = d3.min([ d[toMerge[0]._id][G._id], d[toMerge[1]._id][G._id] ]);
        pairs.push([ G, newGroup ]);
        d[G._id][newGroup._id] = dist;
        d[newGroup._id][G._id] = dist;
      });
      groups.push(newGroup);
    }
    Z = rows.map(function(row) {
      return row.slice(0);
    });
    return {
      Z: Z,
      labels: labels,
      labelToGroup: labelToGroup
    };
  }
  function treeFromLinkageMatrix(data) {
    var N = data.labels.length, T = {};
    data.Z.forEach(function(row, i) {
      T[N + i] = {
        children: [ row[0], row[1] ],
        weight: row[2],
        parent: null
      };
      if (!(row[0] in T)) T[row[0]] = {};
      T[row[0]].parent = N + i;
      if (!(row[1] in T)) T[row[1]] = {};
      T[row[1]].parent = N + i;
    });
    return T;
  }
  function dendrogramChart(style) {
    var update, currentDelta, cutAndUpdate, showSlider = false, useLogScale = false;
    function chart(selection) {
      selection.each(function(inputData) {
        if (!inputData.Z || !inputData.labels) {
          throw "dendrogram: Z and labels *required*.";
        }
        var T = treeFromLinkageMatrix(inputData);
        data = dendrogramData(inputData, currentDelta, T);
        var indices = data.Z.map(function(r) {
          return r[3];
        });
        if (indices.length != d3.set(indices).values().length) {
          data.Z.forEach(function(r, i) {
            r[3] = i + "-" + r[3];
          });
        }
        var height = style.height, width = style.width, treeWidth, colorScheme = style.colorScheme, colorSchemes = style.colorSchemes;
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg").attr("xmlns", "http://www.w3.org/2000/svg"), fig = svg.append("g"), edges = fig.append("g").attr("id", "edges"), leafGroup = fig.append("g").attr("id", "leaves");
        svg.attr("id", "figure").attr("height", height).attr("width", width).style("font-family", style.fontFamily).style("font-size", style.fontSize);
        var xAxis = d3.svg.axis(), xAxisGroup = fig.append("g").style({
          stroke: style.fontColor,
          fill: "none",
          "stroke-width": style.strokeWidth
        }).attr("transform", "translate(0," + height + ")");
        if (!(colorScheme in colorSchemes)) {
          colorScheme = "default";
        }
        var color = colorSchemes[colorScheme];
        update = function(treeData) {
          var Z = treeData.Z, labels = treeData.labels, labelToGroup = treeData.labelToGroup, n = labels.length;
          if (!treeData.labelToGroup) {
            labelToGroup = {};
            labels.forEach(function(d, i) {
              labelToGroup[d] = i;
            });
          }
          function isLeaf(v) {
            return v < n;
          }
          var nodeToIndex = [];
          labels.forEach(function(n, i) {
            nodeToIndex[i] = i;
          });
          var y = d3.scale.linear().domain([ 0, labels.length - 1 ]).range([ style.nodeRadius, height - style.nodeRadius ]), labelToY = d3.scale.ordinal().domain(labels).rangePoints([ style.nodeRadius, height - style.nodeRadius ]);
          var leaves = leafGroup.selectAll("g").data(labels, function(d) {
            return d;
          });
          leaves.transition().duration(style.animationSpeed).attr("transform", function(d) {
            return "translate(0," + labelToY(d) + ")";
          });
          leaves.select("circle").attr("fill", function(d) {
            return color(labelToGroup[d]);
          });
          var leafGs = leaves.enter().append("g").attr("transform", function(d) {
            return "translate(0," + labelToY(d) + ")";
          });
          leafGs.append("circle").attr("r", style.nodeRadius).style("fill-opacity", 1e-6).attr("fill", function(d) {
            return color(labelToGroup[d]);
          }).transition().duration(style.animationSpeed).style("fill-opacity", 1);
          leafGs.append("text").attr("text-anchor", "start").attr("x", style.nodeRadius + 5).attr("y", style.nodeRadius / 2).text(function(d) {
            return d;
          });
          leaves.exit().transition().duration(style.animationSpeed).style("fill-opacity", 1e-6).remove();
          var labelWidth = leafGroup.node().getBBox().width;
          treeWidth = width - labelWidth - style.margins.left;
          leafGroup.attr("transform", "translate(" + treeWidth + ",0)");
          var dists = Z.map(function(row) {
            return row[2];
          }), xExtent = d3.extent(dists);
          if (useLogScale) x = d3.scale.log(); else x = d3.scale.linear();
          x.domain(xExtent).range([ treeWidth, style.margins.left ]);
          var edgeData = [], distances = labels.map(function(_) {
            return xExtent[0];
          });
          groups = labels.map(function(d) {
            return [ labelToGroup[d] ];
          });
          function connectNodes(u, v, w, index) {
            var i = nodeToIndex[u], j = nodeToIndex[v], d1 = distances[u], d2 = distances[v], g1 = groups[u], g2 = groups[v], newG = g1.length == 1 && g2.length == 1 && g1[0] == g2[0] ? g1 : g1.concat(g2);
            edgeData.push({
              name: "u" + index,
              x1: x(d1),
              x2: x(w),
              y1: y(i),
              y2: y(i),
              groups: g1
            });
            edgeData.push({
              name: "v" + index,
              x1: x(d2),
              x2: x(w),
              y1: y(j),
              y2: y(j),
              groups: g2
            });
            edgeData.push({
              name: "uv" + index,
              x1: x(w),
              x2: x(w),
              y1: y(i),
              y2: y(j),
              groups: newG
            });
            nodeToIndex.push((i + j) / 2);
            distances.push(w);
            groups.push(newG);
          }
          Z.forEach(function(row) {
            connectNodes(row[0], row[1], row[2], row[3]);
          });
          var lines = edges.selectAll("line").data(edgeData, function(d) {
            return d.name + " " + d.ty;
          });
          lines.transition().duration(style.animationSpeed).attr("x1", function(d) {
            return d.x1;
          }).attr("x2", function(d) {
            return d.x2;
          }).attr("y1", function(d) {
            return d.y1;
          }).attr("y2", function(d) {
            return d.y2;
          }).attr("stroke-dasharray", function(d) {
            if (d.groups.length == 1) {
              return "";
            } else {
              return "3", "3";
            }
          });
          lines.enter().append("line").attr("x1", function(d) {
            return d.x1;
          }).attr("x2", function(d) {
            return d.x1;
          }).attr("y1", function(d) {
            return d.y1;
          }).attr("y2", function(d) {
            return d.y1;
          }).attr("stroke", style.strokeColor).attr("stroke-width", style.strokeWidth).attr("stroke-dasharray", function(d) {
            if (d.groups.length == 1) {
              return "";
            } else {
              return "3", "3";
            }
          }).attr("fill-opacity", 1e-6).transition().duration(style.animationSpeed).attr("x2", function(d) {
            return d.x2;
          }).attr("y2", function(d) {
            return d.y2;
          }).attr("fill-opacity", 1);
          lines.exit().transition().duration(style.animationSpeed).style("stroke-opacity", 1e-6).remove();
          xAxis.scale(x);
          xAxisGroup.call(xAxis);
          xAxisGroup.selectAll("text").style({
            "stroke-width": "0px",
            fill: style.fontColor
          });
          svg.attr("height", fig.node().getBBox().height);
        };
        update(data);
        if (showSlider) {
          var U = gd3_data_structures.UnionFind(), N = inputData.labels.length, step = Math.ceil(N / 100), series = [ {
            values: [],
            name: "Largest component"
          }, {
            values: [],
            name: "Non-singleton components"
          } ];
          inputData.Z.forEach(function(row, i) {
            U.union([ row[0], row[1], N + i ]);
            if (i % step == 0) {
              var groups = U.groups(), largestSize = d3.max(groups, function(g) {
                return g.length;
              }), nonSingletons = d3.sum(groups.map(function(g) {
                return g.length > 1;
              }));
              if (row[2] != 0) {
                series[0].values.push({
                  x: row[2],
                  y: largestSize
                });
                series[1].values.push({
                  x: row[2],
                  y: nonSingletons
                });
              }
            }
          });
          var allPoints = d3.merge(series.map(function(d, i) {
            return d.values;
          }));
          var sliderWidth = treeWidth - style.sliderMargins.left - style.sliderMargins.right, sliderHeight = style.sliderHeight - style.sliderMargins.top - style.sliderMargins.bottom;
          if (useLogScale) sliderX = d3.scale.log().range([ 0, sliderWidth ]); else sliderX = d3.scale.linear().range([ 0, sliderWidth ]);
          var yExtent = d3.extent(allPoints, function(d) {
            return d.y;
          });
          if (yExtent[1] - yExtent[0] > 100) sliderY = d3.scale.log().range([ sliderHeight, 0 ]); else sliderY = d3.scale.linear().range([ sliderHeight, 0 ]);
          sliderX.domain(d3.extent(allPoints, function(d) {
            return d.x;
          }).reverse());
          sliderY.domain(yExtent).nice();
          var sliderColor = d3.scale.category10(), sliderXAxis = d3.svg.axis().scale(sliderX).orient("bottom"), sliderYAxis = d3.svg.axis().scale(sliderY).ticks(5).orient("left"), line = d3.svg.line().interpolate("basis").x(function(d) {
            return sliderX(d.x);
          }).y(function(d) {
            return sliderY(d.y);
          });
          d3.select(this).insert("div", "svg").html("<b>Instructions</b>: Choose &delta; by mousing over the plot below and double-clicking. You can change your selection by double-clicking again.<br/><br/>");
          var sliderSVG = d3.select(this).insert("svg", "svg").attr("width", sliderWidth + style.sliderMargins.left + style.sliderMargins.right).attr("height", sliderHeight + style.sliderMargins.top + style.sliderMargins.bottom).append("g").attr("transform", "translate(" + style.sliderMargins.left + "," + style.sliderMargins.top + ")").style("font-size", style.fontSize);
          sliderSVG.append("rect").attr("width", sliderWidth + style.sliderMargins.left + style.sliderMargins.right).attr("height", sliderHeight + style.sliderMargins.top + style.sliderMargins.bottom).attr("fill", style.backgroundColor);
          var lines = sliderSVG.selectAll(".point").data(series).enter().append("g").attr("class", "point");
          lines.append("path").attr("class", "line").attr("d", function(d) {
            return line(d.values);
          }).style("fill", "none").style("stroke", function(d) {
            return sliderColor(d.name);
          });
          sliderSVG.append("g").attr("class", "x axis").attr("transform", "translate(0," + sliderHeight + ")").call(sliderXAxis).append("text").attr("x", sliderWidth / 2).attr("dy", "30px").style("text-anchor", "middle").text("δ");
          sliderSVG.append("g").attr("class", "y axis").call(sliderYAxis);
          sliderSVG.selectAll(".axis path").style({
            fill: "none",
            stroke: "#000",
            "shape-rendering": "crispEdges"
          });
          sliderSVG.selectAll(".axis line").style({
            fill: "none",
            stroke: "#000",
            "shape-rendering": "crispEdges"
          });
          var legend = sliderSVG.append("g"), legendGroups = legend.selectAll(".legend-text").data(series).enter().append("g");
          legendGroups.append("line").attr("x1", 0).attr("x1", 20).attr("y1", 0).attr("y2", 0).style("stroke", function(d) {
            return sliderColor(d.name);
          });
          legendGroups.append("text").attr("x", 25).attr("y", 3).text(function(d) {
            return d.name;
          });
          var legendWidth = legend.node().getBBox().width;
          legendGroups.attr("transform", function(d, i) {
            var thisX = treeWidth - legendWidth - style.sliderMargins.left, thisY = sliderY(d3.max(sliderY.domain())) + i * 15;
            return "translate(" + thisX + "," + thisY + ")";
          });
          var deltaFixed = false, deltaFormat = d3.format(".5r"), deltaLine = sliderSVG.append("line").attr("y1", sliderY(d3.min(sliderY.domain()))).attr("y2", sliderY(d3.max(sliderY.domain()))).style("fill", "none").style("stroke", style.strokeColor).style("opacity", 0), delta = sliderSVG.append("text").attr("text-anchor", "start").attr("x", treeWidth - legendWidth - style.sliderMargins.left).attr("y", sliderY(d3.max(sliderY.domain())) + series.length * 15 + 5).text("δ: " + deltaFormat(d3.max(sliderX.domain())));
          sliderSVG.on("mousemove", function() {
            var coordinates = d3.mouse(this);
            if (!deltaFixed && coordinates[0] > 0) {
              deltaLine.attr("x1", coordinates[0]).attr("x2", coordinates[0]).style("opacity", 1);
            }
          });
          sliderSVG.on("dblclick", function() {
            if (!deltaFixed) {
              currentDelta = sliderX.invert(deltaLine.attr("x1"));
              cutAndUpdate();
            }
            deltaFixed = !deltaFixed;
          });
        }
        cutAndUpdate = function() {
          if (showSlider) delta.text("δ: " + deltaFormat(currentDelta));
          update(cutDendrogram(inputData, currentDelta, T));
        };
      });
    }
    chart.update = function(treeData) {
      update(treeData);
      return chart;
    };
    chart.animationSpeed = function() {
      return style.animationSpeed;
    };
    chart.showSlider = function() {
      showSlider = true;
      return chart;
    };
    chart.setDelta = function(delta) {
      currentDelta = delta;
      if (cutAndUpdate) cutAndUpdate(delta);
      return chart;
    };
    chart.logScale = function(_) {
      if (arguments.length) useLogScale = _;
      return chart;
    };
    return chart;
  }
  function dendrogramStyle(style) {
    return {
      colorSchemes: style.colorSchemes || {
        "default": d3.scale.category20()
      },
      edgeWidth: style.edgeWidth || 1.5,
      fontColor: style.fontColor || "#333",
      backgroundColor: "#fff",
      fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: style.fontSize || 12,
      margins: style.margins || {
        bottom: 0,
        left: 5,
        right: 0,
        top: 0
      },
      nodeRadius: style.nodeRadius || 10,
      width: style.width || 1200,
      height: style.height || 600,
      strokeWidth: style.strokeWidth || 1,
      strokeColor: style.strokeColor || "#333",
      colorScheme: style.colorScheme || "default",
      animationSpeed: style.animationSpeed || 750,
      margins: {
        left: 40,
        right: 0,
        top: 0,
        bottom: 0
      },
      sliderMargins: {
        left: 40,
        right: 0,
        top: 5,
        bottom: 20
      },
      sliderHeight: 125
    };
  }
  gd3.dendrogram = function(params) {
    var params = params || {}, style = dendrogramStyle(params.style || {});
    return dendrogramChart(style);
  };
  function graphData(inputData) {
    var data = {
      edges: [],
      nodes: []
    };
    function defaultParse() {
      data.title = inputData.title || "";
      data.edges = inputData.edges;
      data.nodes = inputData.nodes;
      data.links = loadLinks(data.edges, data.nodes);
      data.maxNodeValue = d3.max(data.nodes.map(function(d) {
        return d.value;
      }));
      data.minNodeValue = d3.min(data.nodes.map(function(d) {
        return d.value;
      }));
      data.edgeCategories = [];
      var categories = {};
      if (data.edges.length && data.edges[0].categories) {
        data.edges.forEach(function(e) {
          e.categories.forEach(function(c) {
            categories[c] = null;
          });
        });
        data.edgeCategories = Object.keys(categories);
      }
      function loadLinks(edges, nodes) {
        var links = [], nodeToIndex = {};
        nodes.forEach(function(n, i) {
          nodeToIndex[n.name] = i;
        });
        edges.forEach(function(d) {
          links.push({
            source: nodes[nodeToIndex[d.source]],
            target: nodes[nodeToIndex[d.target]],
            weight: d.weight,
            categories: d.categories,
            references: d.references
          });
        });
        return links;
      }
    }
    defaultParse();
    return data;
  }
  function graphChart(style) {
    var anchorNodesOnClick = true, drawLegend = true;
    function chart(selection) {
      selection.each(function(data) {
        data = graphData(data);
        var instanceIDConst = "gd3-graph-" + Date.now();
        var height = style.height, width = style.width;
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg").attr("height", height).attr("width", width).style("font-family", style.fontFamily).style("font-size", style.fontSize);
        var graph = svg.append("g");
        var edgeColor = d3.scale.ordinal().domain(data.edgeCategories).range(style.edgeColors);
        var nodeColor = d3.scale.linear().domain([ data.minNodeValue, data.maxNodeValue ]).range(style.nodeColor).interpolate(d3.interpolateLab);
        var forceHeight = height, forceWidth = width;
        if (drawLegend) {
          var xLegend = style.width - style.legendWidth, legend = svg.append("g").attr("transform", "translate(" + xLegend + ",0)");
          drawLegendFn(legend);
        }
        var force = d3.layout.force().charge(-400).linkDistance(100).size([ forceWidth, forceHeight ]);
        var x = d3.scale.linear().range([ 0, forceWidth ]), y = d3.scale.linear().range([ 0, forceHeight ]);
        force.nodes(data.nodes).links(data.links).start();
        var link = graph.append("g").selectAll(".link").data(data.links).enter().append("g").attr("class", "gd3Link");
        if (data.edgeCategories) {
          link.each(function(d) {
            var thisEdge = d3.select(this);
            d.categories.forEach(function(c) {
              thisEdge.append("line").attr("class", instanceIDConst + "-" + c).style("stroke-width", style.edgeWidth).style("stroke", edgeColor(c));
            });
          });
        } else {
          link.append("line").style("stroke-width", style.edgeWidth).style("stroke", edgeColor(null));
        }
        link.selectAll("line").style("stroke-linecap", "round");
        var node = graph.append("g").selectAll(".node").data(data.nodes).enter().append("g").style("cursor", "move").call(force.drag);
        node.append("circle").attr("r", style.nodeRadius).attr("fill", function(d) {
          return nodeColor(d.value);
        }).style("stroke-width", style.nodeStrokeWidth).style("stroke", style.nodeStrokeColor);
        node.append("text").attr("x", style.nodeRadius + style.nodeLabelPadding).attr("y", style.nodeRadius + style.nodeLabelPadding).style("font-family", style.fontFamily).style("font-size", style.fontSize).style("font-weight", style.nodeLabelFontWeight).text(function(d) {
          return d.name;
        });
        force.on("tick", function() {
          node.attr("transform", function(d) {
            var maxBound = style.nodeRadius + style.nodeStrokeWidth, minBoundX = forceWidth - style.nodeRadius - style.nodeStrokeWidth, minBoundY = forceHeight - style.nodeRadius - style.nodeStrokeWidth;
            if (drawLegend) minBoundX = minBoundX - style.legendWidth;
            d.x = Math.max(maxBound, Math.min(minBoundX, d.x));
            d.y = Math.max(maxBound, Math.min(minBoundY, d.y));
            return "translate(" + d.x + "," + d.y + ")";
          });
          link.each(function(d) {
            var thisEdgeSet = d3.select(this), categories = d.categories || [ null ], numCategories = categories.length;
            var offset = numCategories / 2 * style.edgeWidth;
            thisEdgeSet.selectAll("line").each(function(d, i) {
              var thisEdge = d3.select(this);
              thisEdge.attr("x1", d.source.x - offset + style.edgeWidth * i).attr("x2", d.target.x - offset + style.edgeWidth * i).attr("y1", d.source.y - offset + style.edgeWidth * i).attr("y2", d.target.y - offset + style.edgeWidth * i);
            });
          });
        });
        if (anchorNodesOnClick) {
          force.drag().on("dragstart", function(d) {
            d.fixed = true;
          });
          node.on("dblclick", function(d) {
            d.fixed = d.fixed ? false : true;
          });
        }
        function drawLegendFn(legend) {
          legend.style("font-family", style.fontFamily);
          legend.append("rect").attr("width", style.legendWidth).attr("height", style.height).style("fill", "#ffffff").style("opacity", .95);
          var title = legend.append("text").style("font-size", style.legendFontSize);
          title.selectAll("tspan").data(data.title.split("\n")).enter().append("tspan").attr("x", 0).attr("dy", style.legendFontSize + 2).text(function(d) {
            return d;
          });
          var titleHeight = title.node().getBBox().height + 4, scaleG = legend.append("g").attr("transform", "translate(0," + titleHeight + ")");
          scaleG.append("text").attr("x", style.legendScaleWidth + 2).attr("y", style.legendFontSize).style("font-size", style.legendFontSize).text(data.maxNodeValue);
          scaleG.append("text").attr("x", style.legendScaleWidth + 2).attr("y", style.height / 2).style("font-size", style.legendFontSize).text(data.minNodeValue);
          var colorScaleRect = scaleG.append("rect").attr("height", style.height / 2).attr("width", style.legendScaleWidth);
          var now = Date.now(), gradientId = "gd3-graph-gradient" + now;
          var gradient = scaleG.append("svg:defs").append("svg:linearGradient").attr("id", gradientId).attr("x1", "0%").attr("y1", "100%").attr("x2", "0%").attr("y2", "0%");
          var scaleRange = nodeColor.range();
          scaleRange.forEach(function(c, i) {
            gradient.append("svg:stop").attr("offset", i * 1 / (scaleRange.length - 1)).attr("stop-color", c).attr("stop-opacity", 1);
          });
          colorScaleRect.attr("fill", "url(#" + gradientId + ")");
          var scaleHeight = scaleG.node().getBBox().height + 4, edgeKeys = legend.append("g").selectAll("g").data(data.edgeCategories).enter().append("g").style("cursor", "pointer").on("click", function(category) {
            var catEdges = d3.selectAll("." + instanceIDConst + "-" + category), visible = catEdges.style("opacity") == 1;
            d3.select(this).style("opacity", visible ? .5 : 1);
            catEdges.style("opacity", visible ? 0 : 1);
          }).on("mouseover", function() {
            d3.select(this).selectAll("text").style("fill", "red");
          }).on("mouseout", function() {
            d3.select(this).selectAll("text").style("fill", "black");
          });
          edgeKeys.each(function(category, i) {
            var thisEl = d3.select(this), thisY = (i + 1) * style.legendFontSize + titleHeight + scaleHeight;
            thisEl.append("line").attr("x1", 0).attr("y1", thisY - style.legendFontSize / 4).attr("x2", 15).attr("y2", thisY - style.legendFontSize / 4).style("stroke", edgeColor(category)).style("stroke-width", style.legendFontSize / 2);
            thisEl.append("text").attr("x", 16).attr("y", (i + 1) * style.legendFontSize + titleHeight + scaleHeight).style("font-size", style.legendFontSize).text(category);
          });
        }
        link.on("click.dispatch-interaction", function(d) {
          gd3.dispatch.interaction({
            source: d.source.name,
            target: d.target.name
          });
        });
      });
    }
    chart.clickAnchorsNodes = function(state) {
      anchorNodesOnClick = state;
      return chart;
    };
    chart.showLegend = function(state) {
      drawLegend = state;
      return chart;
    };
    return chart;
  }
  function graphStyle(style) {
    return {
      edgeColors: style.edgeColors || d3.scale.category10().range(),
      edgeWidth: style.edgeWidth || 3,
      fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: style.fontSize || 12,
      height: style.height || 200,
      legendFontSize: style.legendFontSize || 11,
      legendScaleWidth: style.legendScaleWidth || 30,
      legendWidth: style.legendWidth || 75,
      margins: style.margins || {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0
      },
      nodeColor: style.nodeColor || [ "#ccc", "#ccc" ],
      nodeRadius: style.nodeRadius || 10,
      nodeLabelPadding: style.nodeLabelPadding || 2,
      nodeLabelFontWeight: style.nodeLabelFontWeight || "bold",
      nodeStrokeColor: style.nodeStrokeColor || "#333",
      nodeStrokeWidth: style.nodeStrokeWidth || 2,
      width: style.width || 300
    };
  }
  gd3.graph = function(params) {
    var params = params || {}, style = graphStyle(params.style || {});
    return graphChart(style);
  };
  function heatmapData(inputData) {
    var data = {
      annotations: undefined,
      cells: [],
      maxCellValue: Number.NEGATIVE_INFINITY,
      minCellValue: Number.POSITIVE_INFINITY,
      xs: [],
      ys: []
    };
    function defaultParse() {
      data.cells = inputData.cells;
      data.name = inputData.name;
      data.xs = inputData.xs;
      data.ys = inputData.ys;
      data.annotations = inputData.annotations;
      var tmp;
      for (var i = data.cells.length - 1; i >= 0; i--) {
        tmp = data.cells[i].value;
        if (tmp > data.maxCellValue) data.maxCellValue = tmp;
        if (tmp < data.minCellValue) data.minCellValue = tmp;
      }
      var datasetCatIndex = -1;
      if (data.annotations) {
        if (!data.annotations.annotationToColor) data.annotations.annotationToColor = {};
        data.annotations.categories.forEach(function(category, categoryIndex) {
          var entry = data.annotations.annotationToColor[category];
          if (entry && Object.keys(entry).length > 0) return;
          var annotationNames = Object.keys(data.annotations.sampleToAnnotations), values = annotationNames.map(function(n) {
            return data.annotations.sampleToAnnotations[n][categoryIndex];
          });
          entry = [ d3.min(values), d3.max(values) ];
          data.annotations.annotationToColor[category] = entry;
        });
        data.columnIdToDataset = {};
        data.annotations.categories.forEach(function(c, i) {
          if (c.toLowerCase() === "cancer type" || c.toLowerCase() === "dataset") {
            datasetCatIndex = i;
          }
        });
      }
      if (datasetCatIndex !== -1) {
        data.xs.forEach(function(n) {
          data.columnIdToDataset[n] = data.annotations.sampleToAnnotations[n][datasetCatIndex];
        });
      } else {
        data.xs.forEach(function(n) {
          data.columnIdToDataset[n] = null;
        });
      }
    }
    defaultParse();
    data.sortColumns = function(columnIds) {
      data.xs.sort(function(a, b) {
        return columnIds.indexOf(a) - columnIds.indexOf(b);
      });
    };
    return data;
  }
  function heatmapChart(style) {
    var renderAnnotations = true, renderLegend = true, renderXLabels = true, renderYLabels = true;
    function chart(selection) {
      selection.each(function(data) {
        data = heatmapData(data);
        var width = style.width;
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg").attr("width", width).style("font-family", style.fontFamily).style("font-size", style.fontFamily);
        var svgGroup = svg.append("g");
        var cells = data.cells, xs = data.xs, ys = data.ys;
        var colorDomain = d3.range(data.minCellValue, data.maxCellValue, (data.maxCellValue - data.minCellValue) / style.colorScale.length).concat([ data.maxCellValue ]), colorScale = d3.scale.linear().domain(colorDomain).range(style.colorScale).interpolate(d3.interpolateLab);
        var heatmap = svgGroup.append("g").attr("class", "gd3heatmapCellsContainer");
        var heatmapCells = heatmap.append("g").attr("class", "gd3heatmapCells").selectAll(".rect").data(cells).enter().append("rect").attr("height", style.cellHeight).attr("width", style.cellWidth).attr("x", function(d, i) {
          return data.xs.indexOf(d.x) * style.cellWidth;
        }).attr("y", function(d, i) {
          return data.ys.indexOf(d.y) * style.cellHeight;
        }).style("fill", function(d) {
          return d.value == null ? style.noCellValueColor : colorScale(d.value);
        });
        heatmapCells.append("title").text(function(d) {
          return [ "x: " + d.x, "y: " + d.y, "value: " + (d.value == null ? "No data" : d.value) ].join("\n");
        });
        var guidelineData = [ {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        }, {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        }, {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        }, {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        } ];
        var guidelinesG = svgGroup.append("g").attr("class", "gd3heatmapGuidlines"), guidelines = guidelinesG.selectAll("line").data(guidelineData).enter().append("line").style("stroke", "#000").style("stroke-width", 1);
        heatmapCells.on("mouseover.dispatch-sample", function(cell) {
          var xOffset = +heatmap.attr("transform").replace(")", "").replace("translate(", "").split(",")[0];
          var thisEl = d3.select(this), h = +thisEl.attr("height"), w = +thisEl.attr("width"), x = +thisEl.attr("x") + xOffset, y = +thisEl.attr("y");
          var visibleHeight = +heatmap.node().getBBox().height, visibleWidth = +heatmap.node().getBBox().width + xOffset;
          guidelines.each(function(d, i) {
            var line = d3.select(this);
            if (i == 0) line.attr("x1", 0).attr("x2", style.width).attr("y1", y).attr("y2", y);
            if (i == 1) line.attr("x1", 0).attr("x2", style.width).attr("y1", y + h).attr("y2", y + h);
          });
          if (renderLegend) {
            if (cell.value) {
              var lineLoc = legendScale(cell.value);
              legendRefLine.attr("x1", lineLoc).attr("x2", lineLoc).style("opacity", 1);
            } else {
              legendRefLine.style("opacity", 0);
            }
          }
          thisEl.style("stroke", "#000").style("stroke-width", 1);
          gd3.dispatch.sample({
            sample: cell.x,
            over: true
          });
        }).on("mouseout.dispatch-sample", function(cell) {
          guidelines.attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 0);
          if (renderLegend) legendRefLine.style("opacity", 0);
          d3.select(this).style("stroke", "none");
          gd3.dispatch.sample({
            sample: cell.x,
            over: false
          });
        }).on("click.dispatch-mutation", function(cell) {
          gd3.dispatch.mutation({
            gene: cell.y,
            dataset: data.columnIdToDataset[cell.x],
            mutation_class: "expression"
          });
        });
        var legendG = svgGroup.append("g");
        yLabelsG = svgGroup.append("g").attr("class", "gd3heatmapYLabels");
        if (renderYLabels) renderYLabelsFn();
        if (renderAnnotations) renderAnnotationsFn();
        if (renderXLabels) renderXLabelsFn();
        if (renderLegend) renderLegendFn();
        var heatmapTranslate = heatmap.attr("transform") || "translate(0,0)", heatmapStartX = +heatmapTranslate.replace(")", "").replace("translate(", "").split(",")[0], heatmapW = heatmap.node().getBBox().width;
        var zoom = d3.behavior.zoom().on("zoom", function() {
          var t = zoom.translate(), tx = t[0];
          heatmap.attr("transform", "translate(" + (tx + heatmapStartX) + ",0)");
          function inViewPort(x) {
            return x * style.cellWidth + tx > 0;
          }
          function cellVisibility(x) {
            return inViewPort(x) ? 1 : .1;
          }
          heatmapCells.style("opacity", function(d) {
            return cellVisibility(data.xs.indexOf(d.x));
          });
          if (renderXLabels) {
            heatmap.selectAll("g.gd3annotationXLabels text").style("opacity", function(name) {
              return cellVisibility(data.xs.indexOf(name));
            });
          }
          if (renderAnnotations) {
            heatmap.selectAll("g.gd3heatmapAnnotationCells rect").style("opacity", function(x) {
              return cellVisibility(data.xs.indexOf(x));
            });
          }
        });
        svgGroup.call(zoom);
        var annotationCellsG, annotationCategoryCellsG;
        function renderAnnotationsFn() {
          if (!data.annotations) return;
          var verticalOffset = heatmap.node().getBBox().height + style.labelMargins.bottom;
          var annotationCellsG = heatmap.append("g").attr("class", "gd3heatmapAnnotationCells"), annotationYLabelsG = svgGroup.append("g").attr("class", "gd3annotationYLabels");
          annotationYLabelsG.attr("transform", "translate(0," + verticalOffset + ")");
          if (renderYLabels) {
            var annotationYLabels = annotationYLabelsG.selectAll("text").data(data.annotations.categories).enter().append("text").attr("text-anchor", "end").attr("y", function(d, i) {
              return i * (style.annotationCellHeight + style.annotationCategorySpacing) + style.annotationCellHeight;
            }).style("font-size", style.annotationLabelFontSize).text(function(d) {
              return d;
            });
            var yLabelsHOffset = yLabelsG.node().getBBox().width || 0, annotationYLabelsHOffset = annotationYLabelsG.node().getBBox().width || 0, maxLabelWidth = yLabelsHOffset > annotationYLabelsHOffset ? yLabelsHOffset : annotationYLabelsHOffset;
            annotationYLabels.attr("x", maxLabelWidth);
            yLabelsG.selectAll("text").attr("x", maxLabelWidth);
            heatmap.attr("transform", "translate(" + (maxLabelWidth + style.labelMargins.right) + ",0)");
          }
          annotationCellsG.attr("transform", "translate(0," + verticalOffset + ")");
          annotationCategoryCellsG = annotationCellsG.selectAll("g").data(data.annotations.categories).enter().append("g").attr("transform", function(d, i) {
            var y = i * (style.annotationCellHeight + style.annotationCategorySpacing);
            return "translate(0," + y + ")";
          });
          annotationCategoryCellsG.each(function(category, categoryIndex) {
            var thisEl = d3.select(this);
            var sampleNames = Object.keys(data.annotations.sampleToAnnotations), sampleIndex = sampleNames.map(function(d) {
              return [ d, data.xs.indexOf(d) ];
            });
            sampleIndex = sampleIndex.filter(function(d) {
              return d[1] >= 0;
            });
            sampleIndex = sampleIndex.sort(function(a, b) {
              return a[1] - b[1];
            }).map(function(d) {
              return d[0];
            });
            var annColor;
            if (gd3.color.annotations(category)) {
              annColor = gd3.color.annotations(category);
            } else {
              var values = Object.keys(data.annotations.sampleToAnnotations).map(function(key) {
                return data.annotations.sampleToAnnotations[key][categoryIndex];
              });
              values = d3.set(values).values();
              if (values.length <= 10) gd3.color.annotations(category, values, "discrete"); else {
                values = values.map(function(v) {
                  return +v;
                });
                gd3.color.annotations(category, [ d3.min(values), d3.max(values) ], "continuous");
              }
              annColor = gd3.color.annotations(category);
            }
            var annotationRects = thisEl.selectAll("rect").data(sampleIndex).enter().append("rect").attr("height", style.annotationCellHeight).attr("width", style.cellWidth).attr("x", function(d) {
              return xs.indexOf(d) * style.cellWidth;
            }).style("fill", function(d) {
              var value = data.annotations.sampleToAnnotations[d][categoryIndex];
              return annColor(value);
            });
            annotationRects.append("title").text(function(d) {
              var value = data.annotations.sampleToAnnotations[d][categoryIndex];
              return [ "x: " + d, "y: " + category, "value: " + (value == null ? "No data" : value) ].join("\n");
            });
          });
        }
        var legendScale, legendRefLine;
        function renderLegendFn() {
          var heatmapTranslate = heatmap.attr("transform") || "translate(0,0)", xOffset = +heatmapTranslate.replace(")", "").replace("translate(", "").split(",")[0], yOffset = heatmap.node().getBBox().height + style.annotationCategorySpacing;
          if (!xOffset) xOffset = 0;
          legendG.attr("transform", "translate(" + xOffset + "," + yOffset + ")");
          var colorScaleRect = legendG.append("rect").attr("height", style.colorScaleHeight).attr("width", style.colorScaleWidth);
          var now = Date.now(), gradientId = "gd3heatmapGradient" + now;
          var gradient = legendG.append("svg:defs").append("svg:linearGradient").attr("id", gradientId).attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
          style.colorScale.reverse().forEach(function(c, i) {
            gradient.append("svg:stop").attr("offset", i * 1 / style.colorScale.length).attr("stop-color", c).attr("stop-opacity", 1);
          });
          colorScaleRect.style("fill", "url(#" + gradientId + ")");
          var textY = style.colorScaleHeight + style.fontSize + 3;
          legendG.append("text").attr("text-anchor", "middle").attr("x", style.colorScaleWidth).attr("y", textY).style("font-size", style.annotationLabelFontSize).text(data.maxCellValue);
          legendG.append("text").attr("text-anchor", "middle").attr("x", 0).attr("y", textY).style("font-size", style.annotationLabelFontSize).text(data.minCellValue);
          legendG.append("text").attr("text-anchor", "middle").attr("x", style.colorScaleWidth / 2).attr("y", textY + style.annotationLabelFontSize + 2).style("font-size", style.annotationLabelFontSize).text(data.name);
          legendScale = d3.scale.linear().domain([ data.minCellValue, data.maxCellValue ]).range([ style.colorScaleWidth, 0 ]);
          legendRefLine = legendG.append("line").attr("y1", 0).attr("y2", style.colorScaleHeight).style("stroke", "black").style("stroke-width", 2);
        }
        var annotationXLabelsG;
        function renderXLabelsFn() {
          annotationXLabelsG = heatmap.append("g").attr("class", "gd3annotationXLabels");
          var verticalOffset = heatmap.node().getBBox().height + style.labelMargins.bottom;
          annotationXLabelsG.attr("transform", "translate(0," + verticalOffset + ")");
          annotationXLabelsG.selectAll("text").data(data.xs).enter().append("text").attr("y", function(d, i) {
            return -i * style.cellWidth;
          }).attr("transform", "rotate(90)").style("font-size", style.annotationLabelFontSize).text(function(d) {
            return d;
          });
        }
        function renderYLabelsFn() {
          var yLabels = yLabelsG.selectAll("text").data(ys).enter().append("text").attr("text-anchor", "end").attr("y", function(d, i) {
            return i * style.cellHeight + style.cellHeight;
          }).style("font-size", style.fontSize).text(function(d) {
            return d;
          });
          var maxLabelWidth = 0;
          yLabels.each(function() {
            var tmpWidth = d3.select(this).node().getBBox().width;
            maxLabelWidth = maxLabelWidth > tmpWidth ? maxLabelWidth : tmpWidth;
          });
          yLabels.attr("x", maxLabelWidth);
          heatmap.attr("transform", "translate(" + (maxLabelWidth + style.labelMargins.right) + ",0)");
        }
        var actualHeight = svgGroup.node().getBBox().height + 4;
        svg.attr("height", actualHeight);
        gd3.dispatch.on("sort.heatmap", function(d) {
          data.sortColumns(d.columnLabels);
          heatmapCells.transition().attr("x", function(d, i) {
            return data.xs.indexOf(d.x) * style.cellWidth;
          });
          if (annotationXLabelsG) {
            annotationXLabelsG.selectAll("text").transition().attr("y", function(d, i) {
              return -data.xs.indexOf(d) * style.cellWidth;
            });
          }
          if (annotationCategoryCellsG) {
            annotationCategoryCellsG.each(function(d) {
              d3.select(this).selectAll("rect").transition().attr("x", function(d) {
                return data.xs.indexOf(d) * style.cellWidth;
              });
            });
          }
        });
        gd3.dispatch.on("sample.heatmap", function(d) {
          if (d.over) {
            var xOffset = +heatmap.attr("transform").replace(")", "").replace("translate(", "").split(",")[0], x = xOffset + data.xs.indexOf(d.sample) * style.cellWidth;
            var visibleHeight = +heatmap.node().getBBox().height;
            guidelines.each(function(d, i) {
              var line = d3.select(this);
              if (i == 2) line.attr({
                x1: x,
                x2: x,
                y1: 0,
                y2: visibleHeight
              });
              if (i == 3) line.attr({
                x1: x + style.cellWidth,
                x2: x + style.cellWidth,
                y1: 0,
                y2: visibleHeight
              });
            });
          } else {
            guidelines.attr({
              x1: 0,
              x2: 0,
              y1: 0,
              y2: 0
            });
          }
        });
      });
    }
    chart.showAnnotations = function(state) {
      renderAnnotations = state;
      return chart;
    };
    chart.showLegend = function(state) {
      renderLegend = state;
      return chart;
    };
    chart.showXLabels = function(state) {
      renderXLabels = state;
      return chart;
    };
    chart.showYLabels = function(state) {
      renderYLabels = state;
      return chart;
    };
    return chart;
  }
  function heatmapStyle(style) {
    return {
      annotationCellHeight: style.annotationCellHeight || 10,
      annotationCategorySpacing: style.annotationCategorySpacing || 5,
      annotationContinuousColorScale: style.annotationContinuousColorScale || [ "#004529", "#f7fcb9" ],
      annotationLabelFontSize: style.annotationLabelFontSize || style.fontSize || 12,
      cellHeight: style.cellHeight || 18,
      cellWidth: style.cellWidth || 14,
      colorScale: style.colorScale || [ "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,81,156)", "rgb(8,48,107)" ],
      colorScaleHeight: style.colorScaleHeight || 14,
      colorScaleWidth: style.colorScaleWidth || 200,
      fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: style.fontSize || 14,
      labelMargins: style.labelMargins || {
        bottom: 5,
        right: 2
      },
      margins: style.margins || {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0
      },
      noCellValueColor: style.noCellValueColor || "#a7a7a7",
      width: style.width || 400
    };
  }
  gd3.heatmap = function(params) {
    var params = params || {}, style = heatmapStyle(params.style || {});
    return heatmapChart(style);
  };
  function mutmtxData(inputData) {
    var data = {
      datasets: [],
      glyphs: [ "square", "triangle-up", "cross", "circle", "diamond", "triangle-down" ],
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
        cellTypeToTick: inputData.cellTypeToTick || {
          snv: "full",
          amp: "up",
          del: "down"
        },
        cellTypeToLabel: inputData.cellTypeToLabel || {
          snv: "SNV",
          inactive_snv: "Inactivating SNV",
          amp: "Amplification",
          del: "Deletion"
        },
        cellTypeToGlyph: inputData.cellTypeToGlyph || {
          snv: null,
          inactive_snv: "square"
        },
        cellTypeToSortIndex: inputData.cellTypeToSortIndex || {
          snv: 0,
          inactive_snv: 1,
          del: 2,
          amp: 3
        },
        columnIdToLabel: {},
        columnIdToCategory: {},
        columnIdToTypes: {},
        rowIdToLabel: {}
      },
      matrix: {
        cells: {},
        columnIdToActiveRows: {},
        rowIdToActiveColumns: {}
      },
      types: []
    };
    data.coverage = function() {
      var mutatedSamples = d3.merge(data.ids.rows.map(function(d) {
        return data.matrix.rowIdToActiveColumns[d];
      })), numMutatedSamples = d3.set(mutatedSamples).values().length, s = (numMutatedSamples * 100 / data.numSamples).toFixed(2) + "%";
      return s + " (" + numMutatedSamples + "/" + data.numSamples + ")";
    };
    data.get = function(attr) {
      if (!attr) return null; else if (attr === "datasets") return data.datasets; else if (attr === "ids") return data.ids; else if (attr === "labels") return data.labels;
    };
    data.reorderColumns = function(ordering) {
      function sortByVisibility(c1, c2) {
        var c1Hidden = data.hiddenColumns.byCategory[c1] || data.hiddenColumns.byType[c1] ? true : false, c2Hidden = data.hiddenColumns.byCategory[c2] || data.hiddenColumns.byType[c2] ? true : false;
        if (c1Hidden == c2Hidden) return 0; else if (c1Hidden) return 1; else if (c2Hidden) return -1; else return 0;
      }
      function sortByCellType(c1, c2) {
        var c1Type = data.maps.columnIdToTypes[c1][0], c2Type = data.maps.columnIdToTypes[c2][0];
        return d3.ascending(data.maps.cellTypeToSortIndex[c1Type], data.maps.cellTypeToSortIndex[c2Type]);
      }
      function sortByExclusivity(c1, c2) {
        var c1X = data.matrix.columnIdToActiveRows[c1].length > 1, c2X = data.matrix.columnIdToActiveRows[c2].length > 1;
        return d3.ascending(c1X, c2X);
      }
      function sortByFirstActiveRow(c1, c2) {
        var c1First = data.matrix.columnIdToActiveRows[c1][0], c2First = data.matrix.columnIdToActiveRows[c2][0];
        return d3.ascending(c1First, c2First);
      }
      function sortByName(c1, c2) {
        var c1Label = data.maps.columnIdToLabel[c1], c2Label = data.maps.columnIdToLabel[c2];
        return d3.ascending(c1Label, c2Label);
      }
      function sortByColumnCategory(c1, c2) {
        return d3.ascending(data.maps.columnIdToCategory[c1], data.maps.columnIdToCategory[c2]);
      }
      var sortFns;
      if (ordering) {
        sortFns = [ sortByVisibility ];
        ordering.forEach(function(d) {
          if (d == "First active row") sortFns.push(sortByFirstActiveRow);
          if (d == "Column category") sortFns.push(sortByColumnCategory);
          if (d == "Exclusivity") sortFns.push(sortByExclusivity);
          if (d == "Name") sortFns.push(sortByName);
        });
      } else {
        sortFns = [ sortByVisibility, sortByFirstActiveRow, sortByColumnCategory, sortByExclusivity, sortByCellType, sortByName ];
      }
      data.ids.columns.sort(function(c1, c2) {
        var sortResult;
        for (var i = 0; i < sortFns.length; i++) {
          sortResult = sortFns[i](c1, c2);
          if (sortResult != 0) {
            return sortResult;
          }
        }
        return sortResult;
      });
    };
    data.recomputeLabels = function() {
      data.labels.rows = data.labels.rows.map(function(rowLabel) {
        var rowId = rowLabel.split(" (")[0], count = Object.keys(inputData.M[rowId]).reduce(function(sum, colId) {
          if (data.hiddenColumns.byCategory[colId] || data.hiddenColumns.byType[colId]) return sum; else return sum + 1;
        }, 0);
        return rowId + " (" + count + ")";
      });
    };
    function defaultParse() {
      inputData.samples.forEach(function(s) {
        data.maps.columnIdToLabel[s._id] = s.name;
        data.labels.columns.push(s.name);
      });
      if (inputData.typeToSamples && inputData.sampleTypes) {
        data.numSamples = inputData.sampleTypes.reduce(function(total, t) {
          return total + inputData.typeToSamples[t].length;
        }, 0);
      } else {
        data.numSamples = inputData.samples.length;
      }
      var rowAndCount = [];
      Object.keys(inputData.M).forEach(function(k, i) {
        var numSamples = Object.keys(inputData.M[k]).length;
        rowAndCount.push([ k, numSamples ]);
      });
      var sortedRowIds = [];
      rowAndCount.sort(function(a, b) {
        return a[1] < b[1] ? 1 : -1;
      });
      rowAndCount.forEach(function(d, i) {
        var name = d[0], numSamples = d[1];
        data.maps.rowIdToLabel[i.toString()] = name;
        data.labels.rows.push(name + " (" + numSamples + ")");
        sortedRowIds.push(name);
      });
      data.ids.columns = Object.keys(data.maps.columnIdToLabel);
      data.ids.rows = Object.keys(data.maps.rowIdToLabel);
      var setOfDatasets = {};
      Object.keys(inputData.sampleToTypes).forEach(function(colId) {
        setOfDatasets[inputData.sampleToTypes[colId]] = null;
        data.maps.columnIdToCategory[colId] = inputData.sampleToTypes[colId];
      });
      data.datasets = Object.keys(setOfDatasets);
      var cellTypes = [];
      sortedRowIds.forEach(function(rowLabel, rowId) {
        var columns = Object.keys(inputData.M[rowLabel]);
        rowId = rowId.toString();
        data.matrix.rowIdToActiveColumns[rowId] = columns;
        columns.forEach(function(colId) {
          if (!data.matrix.columnIdToActiveRows[colId]) {
            data.matrix.columnIdToActiveRows[colId] = [];
          }
          data.matrix.columnIdToActiveRows[colId].push(rowId);
          var type = inputData.M[rowLabel][colId][0];
          data.matrix.cells[[ rowId, colId ].join()] = {
            dataset: inputData.sampleToTypes[colId],
            type: inputData.M[rowLabel][colId][0]
          };
          cellTypes.push(type);
          if (!data.maps.columnIdToTypes[colId]) data.maps.columnIdToTypes[colId] = [];
          data.maps.columnIdToTypes[colId].push(type);
        });
      });
      data.types = cellTypes.filter(function(item, pos, self) {
        return self.indexOf(item) == pos;
      });
      Object.keys(data.maps.columnIdToTypes).forEach(function(colId) {
        var types = data.maps.columnIdToTypes[colId], typeLog = {};
        types.forEach(function(t) {
          if (!typeLog[t]) typeLog[t] = 0;
          typeLog[t] = typeLog[t] + 1;
        });
        types = Object.keys(typeLog);
        types.sort(function(a, b) {
          return typeLog[a] < typeLog[b];
        });
        data.maps.columnIdToTypes[colId] = types;
      });
      data.types.forEach(function(t) {
        if (!(t in data.maps.cellTypeToTick)) {
          data.maps.cellTypeToTick[t] = "full";
        }
        if (!(t in data.maps.cellTypeToLabel)) {
          data.maps.cellTypeToLabel[t] = t.replace("_", " ");
        }
      });
      if (inputData.cellTypesToGlyph) {
        data.maps.cellTypeToGlyph = inputData.cellTypeToGlyph;
      } else {
        var typesTmp = {};
        cellTypes.forEach(function(t) {
          if (typesTmp[t] == undefined) typesTmp[t] = 0;
          typesTmp[t] = typesTmp[t] + 1;
        });
        var types = Object.keys(typesTmp).sort(function(a, b) {
          typesTmp[a] > typesTmp[b];
        });
        types.forEach(function(d, i) {
          if (d in data.maps.cellTypeToGlyph) return;
          if (data.maps.cellTypeToTick[d] != "full") {
            data.maps.cellTypeToGlyph[d] = null;
          } else {
            data.maps.cellTypeToGlyph[d] = data.glyphs[i % data.glyphs.length];
          }
        });
      }
    }
    defaultParse();
    if (inputData.annotations) {
      data.annotations = inputData.annotations;
    } else {
      data.annotations = {
        categories: [],
        sampleToAnnotations: {},
        annotationToColor: {}
      };
      data.ids.columns.forEach(function(s) {
        data.annotations.sampleToAnnotations[data.maps.columnIdToLabel[s]] = [];
      });
    }
    return data;
  }
  function mutmtxChart(style) {
    var categoriesToFilter = [], drawHoverLegend = true, drawLegend = false, drawSortingMenu = true, drawCoverage = true, drawColumnLabels = true, showColumnCategories = true, stickyLegend = false, typesToFilter = [];
    var sortingOptionsData = [ "First active row", "Column category", "Exclusivity", "Name" ];
    function chart(selection) {
      selection.each(function(data) {
        data = mutmtxData(data);
        var height = style.height, width = style.width;
        var d3color = d3.scale.category20(), colCategoryToColor = {}, datasets = data.get("datasets");
        for (var i = 0; i < datasets.length; i++) {
          colCategoryToColor[datasets[i]] = d3color(i);
        }
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg");
        svg.attr("id", "mutation-matrix").attr("width", width).attr("height", height + style.labelHeight).attr("xmlns", "http://www.w3.org/2000/svg");
        var matrix = svg.append("g");
        var rowLabelsG = svg.append("g").attr("class", "mutmtx-rowLabels"), rowLabels = rowLabelsG.selectAll("text").data(data.get("labels").rows).enter().append("text").attr("text-anchor", "end").attr("x", 0).attr("y", function(d, i) {
          return style.rowHeight * data.labels.rows.indexOf(d) + style.rowHeight - 3;
        }).style("font-family", style.fontFamily).style("font-size", style.fontSize).text(function(d) {
          return d;
        });
        var maxTextWidth = -Infinity;
        rowLabels.each(function(d) {
          var w = this.getComputedTextLength();
          maxTextWidth = w > maxTextWidth ? w : maxTextWidth;
        });
        rowLabels.attr("x", maxTextWidth);
        style.labelWidth = Math.ceil(maxTextWidth) + 5;
        style.matrixWidth = width - style.labelWidth;
        var rowNames = data.get("labels").rows, rowRules = svg.append("g").attr("class", "mutmtxRowRules").selectAll("line").data(rowNames).enter().append("line").attr("x1", style.labelWidth).attr("x2", style.labelWidth + style.matrixWidth).attr("y1", function(d, i) {
          return style.rowHeight * rowNames.indexOf(d) + style.rowHeight;
        }).attr("y2", function(d, i) {
          return style.rowHeight * rowNames.indexOf(d) + style.rowHeight;
        }).style("stroke-width", ".5px").style("stroke", "#ddd");
        data.reorderColumns();
        var wholeVisX = d3.scale.linear().domain([ 0, data.get("labels").columns.length ]).range([ style.labelWidth, width ]);
        var columnsG = matrix.append("g").attr("class", ".mutmtxColumnsGroup");
        var columns = columnsG.selectAll("g").data(data.get("ids").columns).enter().append("g").attr("class", "mutmtxColumn").attr("id", function(d) {
          return d.key;
        }).attr("transform", function(d, i) {
          return "translate(" + wholeVisX(i) + ",0)";
        });
        svg.attr("height", function(d) {
          return Math.ceil(rowLabelsG.node().getBBox().height + 10);
        });
        if (data.annotations) {
          var names = Object.keys(data.annotations.sampleToAnnotations), categories = data.annotations.categories;
          var annRowLabelsG = svg.append("g").attr("class", "mutmtx-annRowLabels").attr("transform", "translate(0," + rowLabelsG.node().getBBox().height + ")");
          var annRowLabels = annRowLabelsG.selectAll("text").data(categories).enter().append("text").attr("text-anchor", "end").attr("x", style.labelWidth - 5).attr("y", function(d, i) {
            return (i + 1) * style.annotationRowHeight + (i + 1) * style.annotationRowSpacing;
          }).style("font-family", style.fontFamily).style("font-size", style.annotationRowHeight).text(function(d) {
            return d;
          });
          var annColoring = data.annotations.annotationToColor;
          Object.keys(annColoring).forEach(function(annotation, i) {
            if (gd3.color.annotations(annotation)) {
              return;
            } else {
              var values = Object.keys(data.annotations.sampleToAnnotations).map(function(key) {
                return data.annotations.sampleToAnnotations[key][i];
              });
              values = d3.set(values).values();
              if (values.length <= 10) gd3.color.annotations(annotation, values, "discrete"); else {
                values = values.map(function(v) {
                  return +v;
                });
                gd3.color.annotations(annotation, [ d3.min(values), d3.max(values) ], "continuous");
              }
            }
          });
          var maxTextHeight = 0;
          columns.each(function(annKey) {
            var mtxOffset = style.rowHeight * data.ids.rows.length;
            var aGroup = d3.select(this).append("g").attr("id", "annotation-" + annKey);
            var annotationKey = names.reduce(function(prev, cur, i, array) {
              if (annKey.indexOf(cur) > -1) return cur; else return prev;
            }, null);
            var annData;
            if (annotationKey == null) {
              annData = data.annotations.categories.map(function(d) {
                return null;
              });
            } else {
              annData = data.annotations.sampleToAnnotations[annotationKey];
            }
            aGroup.selectAll("rect").data(annData).enter().append("rect").attr("height", style.annotationRowHeight).attr("x", 0).attr("y", function(d, i) {
              var spacing = style.annotationRowSpacing * (i + 1);
              return mtxOffset + spacing + style.annotationRowHeight * i;
            }).attr("width", 20).style("fill", function(d, i) {
              if (d == null) return gd3.color.noData;
              var annotation = categories[i];
              return gd3.color.annotations(annotation)(d);
            });
            if (drawColumnLabels) {
              var annTextOffset = annData.length * (style.annotationRowHeight + style.annotationRowSpacing) + style.annotationRowSpacing + mtxOffset;
              var annText = aGroup.append("text").attr("x", annTextOffset).attr("text-anchor", "start").attr("transform", "rotate(90)").style("font-family", style.fontFamily).style("font-size", style.annotationFontSize).text(annotationKey);
              var annTextHeight = annText.node().getBBox().width + style.annotationRowSpacing;
              maxTextHeight = d3.max([ annTextHeight, maxTextHeight ]);
            }
          });
          var svgHeight = svg.attr("height"), numAnnotations = data.annotations.sampleToAnnotations[names[0]].length, svgHeight = parseInt(svgHeight) + numAnnotations * (style.annotationRowHeight + 2);
          svg.attr("height", svgHeight + maxTextHeight);
        }
        var zoom = d3.behavior.zoom().x(wholeVisX).scaleExtent([ 1, 14 ]).on("zoom", function() {
          rerenderMutationMatrix();
        });
        svg.call(zoom);
        renderMutationMatrix();
        rerenderMutationMatrix();
        if (drawCoverage) {
          selection.append("p").style("float", "right").html("<b>Coverage:</b> " + data.coverage());
        }
        gd3.dispatch.on("filterCategory.mutmtx", function(d) {
          if (!d || !d.categories) return;
          categoriesToFilter = d.categories.filter(function(s) {
            return data.datasets.indexOf(s) > -1;
          });
          data.hiddenColumns.byCategory = {};
          Object.keys(data.maps.columnIdToCategory).forEach(function(cid) {
            var category = data.maps.columnIdToCategory[cid];
            if (categoriesToFilter.indexOf(category) > -1) {
              data.hiddenColumns.byCategory[cid] = category;
            }
          });
          data.reorderColumns(sortingOptionsData);
          data.recomputeLabels();
          rerenderMutationMatrix();
        });
        gd3.dispatch.on("filterType.mutmtx", function(d) {
          if (!d || !d.types) return;
          typesToFilter = d.types.filter(function(s) {
            return data.types.indexOf(s) > -1;
          });
          data.hiddenColumns.byType = {};
          Object.keys(data.maps.columnIdToTypes).forEach(function(cid) {
            var types = data.maps.columnIdToTypes[cid];
            data.hiddenColumns.byType[cid] = types.every(function(type) {
              return typesToFilter.indexOf(type) > -1;
            });
          });
          data.reorderColumns(sortingOptionsData);
          data.recomputeLabels();
          rerenderMutationMatrix();
        });
        if (drawLegend) drawLegendFn(selection.append("div").style("width", style.width));
        if (drawHoverLegend) {
          var container = selection.append("div"), legendHoverHeader = container.append("span").style("cursor", "pointer").style("font-family", style.fontFamily).style("font-size", style.fontSize + "px").text("Legend (mouse over)"), legend = container.append("div").style("background", "#fff").style("border", "1px solid #ccc").style("padding", "10px").style("position", "absolute").style("display", "none").style("visibility", "hidden");
          legendHoverHeader.on("click", function() {
            stickyLegend = stickyLegend ? false : true;
            legend.selectAll("*").remove();
            if (stickyLegend) drawHoverLegendFn(legend); else legend.style("display", "none").style("visibility", "hidden");
          });
          legendHoverHeader.on("mouseover", function() {
            if (stickyLegend) return;
            drawHoverLegendFn(legend);
          }).on("mouseout", function() {
            if (stickyLegend) return;
            legend.selectAll("*").remove();
            legend.style("display", "none").style("visibility", "hidden");
          });
        }
        if (drawSortingMenu) drawSortingMenu();
        function drawHoverLegendFn(legend) {
          var legendW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
          legendW = legendW - 20 - 20;
          legendW = legendW < style.width - 20 - 20 ? legendW : style.width - 20 - 20;
          var body = document.body, docElement = document.documentElement, legendHeaderBounds = legendHoverHeader.node().getBoundingClientRect(), clientTop = docElement.clientTop || body.clientTop || 0, clientLeft = docElement.clientLeft || body.clientLeft || 0, scrollLeft = window.pageXOffset || docElement.scrollLeft || body.scrollLeft, scrollTop = window.pageYOffset || docElement.scrollTop || body.scrollTop, top = legendHeaderBounds.top + scrollTop - clientTop, left = legendHeaderBounds.left + scrollLeft - clientLeft;
          legend.style("left", left).style("top", top + legendHeaderBounds.height + 5).style("display", "block").style("visibility", "visible");
          if (stickyLegend) {
            legend.append("span").text("X").style("color", "#aaa").style("cursor", "pointer").style("float", "right").style("font-family", style.fontFamily).on("click", function() {
              stickyLegend = false;
              legend.selectAll("*").remove();
              legend.style("display", "none").style("visibility", "hidden");
            });
          }
          drawLegendFn(legend.style("width", legendW + "px"));
        }
        function drawLegendFn(legend) {
          legend.style("font-size", style.fontSize + "px");
          if (showColumnCategories) {
            var columnCategories = legend.append("div").style("min-width", legend.style("width")).style("width", legend.style("width"));
            var categories = {};
            Object.keys(data.maps.columnIdToCategory).forEach(function(k) {
              categories[data.maps.columnIdToCategory[k]] = null;
            });
            categories = Object.keys(categories).sort();
            var categoryLegendKeys = columnCategories.selectAll("div").data(categories).enter().append("div").style("display", "inline-block").style("font-family", style.fontFamily).style("font-size", style.fontSize).style("margin-right", function(d, i) {
              return i == categories.length - 1 ? "0px" : "10px";
            }).on("click", function(d) {
              var filtering = categoriesToFilter;
              if (categoriesToFilter.indexOf(d) > -1) {
                filtering.splice(filtering.indexOf(d), 1);
                d3.select(this).style("opacity", 1);
              } else {
                filtering.push(d);
                d3.select(this).style("opacity", .2);
              }
              gd3.dispatch.filterCategory({
                categories: filtering
              });
            });
            categoryLegendKeys.append("div").style("background", function(d) {
              if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d);
              return colCategoryToColor[d];
            }).style("display", "inline-block").style("height", style.fontSize + "px").style("width", style.fontSize / 2 + "px");
            categoryLegendKeys.append("span").style("display", "inline-block").style("margin-left", "2px").text(function(d) {
              return d;
            });
            var categoryLegendKeyWidths = [];
            categoryLegendKeys.each(function() {
              var cWidth = this.getBoundingClientRect().width;
              categoryLegendKeyWidths.push(cWidth);
            });
            categoryLegendKeys.style("width", d3.max(categoryLegendKeyWidths) + "px").style("min-width", d3.max(categoryLegendKeyWidths) + "px");
          }
          if (Object.keys(data.maps.cellTypeToGlyph).length > 1) {
            var cellTypes = legend.append("div"), cellTypesData = Object.keys(data.maps.cellTypeToGlyph);
            var cellTypeLegendKeys = cellTypes.selectAll("div").data(cellTypesData).enter().append("div").style("cursor", "pointer").style("display", "inline-block").style("font-family", style.fontFamily).style("font-size", style.fontSize).style("margin-right", function(d, i) {
              return i == cellTypesData.length - 1 ? "0px" : "10px";
            }).on("click", function(d) {
              var filtering = typesToFilter;
              if (typesToFilter.indexOf(d) > -1) {
                filtering.splice(filtering.indexOf(d), 1);
                d3.select(this).style("opacity", 1);
              } else {
                filtering.push(d);
                d3.select(this).style("opacity", .2);
              }
              gd3.dispatch.filterType({
                types: filtering
              });
            });
            cellTypeLegendKeys.append("svg").attr("height", function(d) {
              var tickType = data.maps.cellTypeToTick[d];
              if (tickType == "down" || tickType == "up") return style.fontSize / 2 + "px"; else return style.fontSize + "px";
            }).attr("width", style.fontSize + "px").style("background", d3color(0)).style("margin-right", "2px").style("margin-bottom", function(d) {
              var tickType = data.maps.cellTypeToTick[d];
              if (tickType == "up") return style.fontSize / 2 + "px"; else "0px";
            }).each(function(type) {
              var glyph = data.maps.cellTypeToGlyph[type];
              if (!glyph || glyph == null) return;
              d3.select(this).append("path").attr("d", function(type) {
                var diameter = style.fontSize - style.fontSize / 2;
                return d3.svg.symbol().type(glyph).size(diameter * diameter)();
              }).attr("transform", "translate(" + style.fontSize / 2 + "," + style.fontSize / 2 + ")").style("fill", style.glyphColor).style("stroke", style.glyphStrokeColor).style("strokew-width", .5);
            });
            cellTypeLegendKeys.append("span").text(function(d) {
              return data.maps.cellTypeToLabel[d];
            });
          }
          if (data.annotations) {
            var annotationLegends = legend.append("div").selectAll("div").data(data.annotations.categories).enter().append("div");
            annotationLegends.each(function(annotationName) {
              var thisEl = d3.select(this), scale = gd3.color.annotations(annotationName), scaleType = gd3.color.annotationToType[annotationName];
              thisEl.style("font-family", style.fontFamily).style("font-size", style.fontSize);
              thisEl.append("span").text(annotationName + ": ");
              if (scaleType && scaleType == "continuous") {
                var scaleHeight = style.fontSize, scaleWidth = style.fontSize * 5;
                thisEl.append("span").text(scale.min);
                var gradientSvg = thisEl.append("svg").attr("height", scaleHeight).attr("width", scaleWidth).style("margin-left", "2px").style("margin-right", "2px");
                thisEl.append("span").text(scale.domain());
                thisEl.selectAll("*").style("display", "inline-block");
                var now = Date.now(), gradientId = "gd3-mutmtx-gradient" + now;
                var gradient = gradientSvg.append("svg:defs").append("svg:linearGradient").attr("id", gradientId).attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
                var scaleRange = scale.range();
                scaleRange.forEach(function(c, i) {
                  gradient.append("svg:stop").attr("offset", i * 1 / (scaleRange.length - 1)).attr("stop-color", c).attr("stop-opacity", 1);
                });
                gradientSvg.append("rect").attr("height", scaleHeight).attr("width", scaleWidth).attr("fill", "url(#" + gradientId + ")");
              } else {
                var annKeys = thisEl.selectAll("div").data(scale.domain()).enter().append("div").style("display", "inline-block").style("font-family", style.fontFamily).style("font-size", style.fontSize).style("margin-right", function(d, i) {
                  return i == Object.keys(scale).length - 1 ? "0px" : "10px";
                });
                annKeys.append("div").style("background", function(d) {
                  return scale(d);
                }).style("display", "inline-block").style("height", style.fontSize + "px").style("width", style.fontSize / 2 + "px");
                annKeys.append("span").style("display", "inline-block").style("margin-left", "2px").text(function(d) {
                  return d;
                });
              }
            });
          }
        }
        function drawSortingMenu() {
          var menu = selection.append("div");
          var title = menu.append("p").style("cursor", "pointer").style("font-family", style.fontFamily).style("font-size", style.fontSize + "px").style("margin-bottom", "0px").text("Sort columns [+]");
          var optionsMenu = menu.append("ul").style("display", "none").style("list-style", "none").style("margin-right", "0px").style("margin-bottom", "0px").style("margin-left", "0px").style("margin-top", "0px").style("padding-left", 0);
          title.on("click", function() {
            var optionsShown = optionsMenu.style("display") == "block", display = optionsShown ? "none" : "block", visibility = optionsShown ? "hidden" : "visible";
            d3.select("p").text("Sort columns " + (optionsShown ? "[+]" : "[-]"));
            optionsMenu.style("display", display);
            optionsMenu.style("visibility", visibility);
          });
          renderMenu();
          function renderMenu() {
            optionsMenu.selectAll("li").remove();
            var menuItem = optionsMenu.selectAll("li").data(sortingOptionsData).enter().append("li").style("font-family", style.fontFamily).style("font-size", style.sortingMenuFontSize + "px");
            menuItem.each(function(menuText, menuPosition) {
              var texts = [ menuPosition + 1 + ". ", "↑", " ", "↓", " ", " ", menuText ], thisLi = d3.select(this);
              thisLi.selectAll("span").data(texts).enter().append("span").text(function(d) {
                return d;
              }).each(function(d, i) {
                if (i != 1 && i != 3) return;
                d3.select(this).style("cursor", "pointer").on("mouseover", function() {
                  d3.select(this).style("color", "red");
                }).on("mouseout", function() {
                  d3.select(this).style("color", style.fontColor);
                }).on("click", function() {
                  if (i == 1 && menuPosition == 0) return;
                  if (i == 3 && menuPosition == sortingOptionsData.length - 1) return;
                  var neighbor = menuPosition + (i == 1 ? -1 : 1), neighborText = sortingOptionsData[neighbor];
                  sortingOptionsData[neighbor] = menuText;
                  sortingOptionsData[menuPosition] = neighborText;
                  data.reorderColumns(sortingOptionsData);
                  renderMenu();
                  rerenderMutationMatrix(true);
                  var orderedLabels = data.ids.columns.map(function(d) {
                    return data.maps.columnIdToLabel[d];
                  });
                  gd3.dispatch.sort({
                    columnLabels: orderedLabels,
                    sortingOptionsData: sortingOptionsData
                  });
                });
              });
            });
          }
        }
        function rerenderMutationMatrix(transition) {
          var t = zoom.translate(), tx = t[0], ty = t[1], scale = zoom.scale();
          tx = Math.min(tx, 0);
          zoom.translate([ tx, ty ]);
          rowLabels.data(data.labels.rows).text(function(d) {
            return d;
          });
          var colWidth = wholeVisX(1) - wholeVisX(0);
          if (transition && transition == true) {
            columns.transition().attr("transform", function(d) {
              var colIndex = data.ids.columns.indexOf(d);
              return "translate(" + wholeVisX(colIndex) + ",0)";
            });
          } else {
            columns.attr("transform", function(d) {
              var colIndex = data.ids.columns.indexOf(d);
              return "translate(" + wholeVisX(colIndex) + ",0)";
            });
          }
          columns.style("opacity", 1);
          columns.filter(function(d) {
            return data.hiddenColumns.byCategory[d] || data.hiddenColumns.byType[d];
          }).style("opacity", 0);
          columns.filter(function(d) {
            return wholeVisX(data.ids.columns.indexOf(d)) < style.labelWidth;
          }).style("opacity", .2);
          columns.selectAll("rect").attr("width", colWidth);
          columns.selectAll(".gd3mutmtx-cellClyph").attr("transform", function(d) {
            var str = d3.select(this).attr("transform"), then = str.replace("translate", "").replace(")", "").split(","), x = colWidth / 2, y = +then[1], now = "translate(" + x + "," + y + ")";
            return now;
          }).attr("d", function(d) {
            var cellType = d.cell.type, glyph = data.maps.cellTypeToGlyph[cellType], gWidth = d3.min([ colWidth, style.rowHeight - style.rowHeight / 2 ]);
            return d3.svg.symbol().type(glyph).size(gWidth * gWidth)();
          });
          cells.style("opacity", function(d) {
            var visibleType = typesToFilter.indexOf(d.cell.type) === -1, visibleCategory = categoriesToFilter.indexOf(d.cell.dataset) === -1;
            return visibleType && visibleCategory ? 1 : 0;
          });
        }
        var cells;
        function renderMutationMatrix() {
          var colWidth = wholeVisX(1) - wholeVisX(0);
          cells = columns.append("g").attr("class", "mutmtx-sampleMutationCells").selectAll("g").data(function(colId) {
            var activeRows = data.matrix.columnIdToActiveRows[colId], colLabel = data.maps.columnIdToLabel[colId];
            return activeRows.map(function(rowId) {
              var rowLabel = data.maps.rowIdToLabel[rowId];
              return {
                colId: colId,
                row: rowId,
                rowLabel: rowLabel,
                colLabel: colLabel,
                cell: data.matrix.cells[[ rowId, colId ].join()]
              };
            });
          }).enter().append("g");
          cells.each(function(d) {
            var thisCell = d3.select(this), y = style.rowHeight * data.ids.rows.indexOf(d.row);
            thisCell.append("rect").attr("data-column-id", d.colId).attr("x", 0).attr("y", function(d) {
              var tickType = data.maps.cellTypeToTick[d.cell.type];
              if (tickType == "down") return y + style.rowHeight / 2; else return y;
            }).attr("height", function(d) {
              var tickType = data.maps.cellTypeToTick[d.cell.type];
              if (tickType == "up" || tickType == "down") return style.rowHeight / 2; else return style.rowHeight;
            }).attr("width", colWidth).style("fill", function() {
              if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.cell.dataset);
              return colCategoryToColor[d.cell.dataset];
            });
            var cellType = d.cell.type, glyph = data.maps.cellTypeToGlyph[cellType];
            if (glyph && glyph != null) {
              thisCell.append("path").attr("class", "gd3mutmtx-cellClyph").attr("d", d3.svg.symbol().type(glyph).size(colWidth * colWidth)).attr("transform", "translate(" + colWidth / 2 + "," + (y + style.rowHeight / 2) + ")").style("fill", style.glyphColor).style("stroke", style.glyphStrokeColor).style("stroke-width", .5);
            }
          });
          var columnNames = columns.selectAll("text");
          var rects = columns.select("g.mutmtx-sampleMutationCells").selectAll("g").selectAll("rect").attr({
            "stroke-width": 1,
            stroke: "black",
            "stroke-opacity": 0
          });
          columns.select("g.mutmtx-sampleMutationCells").selectAll("g").on("mouseover.dispatch-sample", function(d) {
            gd3.dispatch.sample({
              sample: data.maps.columnIdToLabel[d.colId],
              over: true
            });
          }).on("mouseout.dispatch-sample", function(d) {
            gd3.dispatch.sample({
              sample: data.maps.columnIdToLabel[d.colId],
              over: false
            });
          }).on("click.dispatch-mutation", function(d) {
            gd3.dispatch.mutation({
              gene: d.rowLabel,
              dataset: d.cell.dataset,
              mutation_class: d.cell.type == "inactive_snv" ? "snv" : d.cell.type
            });
          });
          gd3.dispatch.sort({
            columnLabels: data.ids.columns.map(function(d) {
              return data.maps.columnIdToLabel[d];
            }),
            sortingOptionsData: sortingOptionsData
          });
          gd3.dispatch.on("sample.mutmtx", function(d) {
            var over = d.over, sample = d.sample, affectedColumns = columnNames.filter(function(d) {
              return data.maps.columnIdToLabel[d] == sample;
            });
            if (gd3_util.selectionSize(affectedColumns)) {
              rects.attr("stroke-opacity", 0);
              rects.filter(function(d) {
                return data.maps.columnIdToLabel[d.colId] == sample;
              }).attr("stroke-opacity", over ? 1 : 0);
              columnNames.style({
                opacity: over ? .25 : 1,
                "font-weight": "normal"
              });
              affectedColumns.style({
                opacity: 1,
                "font-weight": over ? "bold" : "normal"
              });
            }
          });
        }
      });
    }
    chart.showHoverLegend = function(state) {
      drawHoverLegend = state;
      return chart;
    };
    chart.showLegend = function(state) {
      drawLegend = state;
      return chart;
    };
    chart.showCoverage = function(state) {
      drawCoverage = state;
      return chart;
    };
    chart.showColumnLabels = function(state) {
      drawColumnLabels = state;
      return chart;
    };
    chart.showSortingMenu = function(state) {
      drawSortingMenu = state;
      return chart;
    };
    chart.showColumnCategories = function(state) {
      showColumnCategories = state;
      return chart;
    };
    return chart;
  }
  function mutmtxStyle(style) {
    return {
      animationSpeed: style.animationSpeed || 300,
      annotationContinuousScale: style.annotationContinuousScale || [ "#fcc5c0", "#49006a" ],
      annotationFontSize: style.annotationFontSize || 10,
      annotationRowHeight: style.annotationRowHeight || 10,
      annotationRowSpacing: style.annotationRowSpacing || 5,
      bgColor: style.bgColor || "#F6F6F6",
      blockColorMedium: style.blockColorMedium || "#95A5A6",
      blockColorStrongest: style.blockColorStrongest || "#2C3E50",
      boxMargin: style.boxMargin || 5,
      colorSampleTypes: style.colorSampleTypes || true,
      coocurringColor: style.coocurringColor || "orange",
      exclusiveColor: style.exclusiveColor || "blue",
      fontColor: style.fontColor || "#000",
      fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: style.fontSize || 14,
      glyphColor: style.glyphColor || "#888",
      glyphStrokeColor: style.glyphStrokeColor || "#ccc",
      height: style.height || 300,
      rowHeight: style.rowHeight || 20,
      labelHeight: style.labelHeight || 40,
      labelWidth: style.labelWidth || 100,
      minBoxWidth: style.minBoxWidth || 20,
      mutationLegendHeight: style.mutationLegendHeight || 30,
      sampleStroke: style.sampleStroke || 1,
      sortingMenuFontSize: style.sortingMenuFontSize || 12,
      width: style.width || 600,
      zBottom: 0,
      zTop: 100
    };
  }
  gd3.mutationMatrix = function(params) {
    var params = params || {}, style = mutmtxStyle(params.style || {});
    return mutmtxChart(style);
  };
  function scatterplotData(inputData) {
    var data = {
      categories: [],
      pts: [],
      title: "",
      xLabel: "",
      xScale: {
        max: Number.NEGATIVE_INFINITY,
        min: Number.POSITIVE_INFINITY
      },
      yLabel: "",
      yScale: {
        max: Number.NEGATIVE_INFINITY,
        min: Number.POSITIVE_INFINITY
      }
    };
    function parseJSON() {
      data.categories = d3.set(inputData.categories ? inputData.categories : []);
      data.pts = inputData.pts.map(function(d) {
        d.x = +d.x;
        d.y = +d.y;
        if (d.category) data.categories.add(d.category);
        if (!inputData.xScale) {
          data.xScale.max = d3.max([ d.x, data.xScale.max ]);
          data.xScale.min = d3.min([ d.x, data.xScale.min ]);
        }
        if (!inputData.yScale) {
          data.yScale.max = d3.max([ d.y, data.yScale.max ]);
          data.yScale.min = d3.min([ d.y, data.yScale.min ]);
        }
        return d;
      });
      data.title = inputData.title;
      data.xLabel = inputData.xLabel;
      data.yLabel = inputData.yLabel;
      if (inputData.xScale) data.xScale = inputData.xScale;
      if (inputData.yScale) data.yScale = inputData.yScale;
    }
    parseJSON();
    return data;
  }
  function scatterplotChart(style) {
    function chart(selection) {
      selection.each(function(data) {
        data = scatterplotData(data);
        function makeShape(d) {
          var category = d.category, hasCategory = data.categories.has(category), shape = hasCategory ? style.categoryShapes[data.categories.values().indexOf(category)] : "circle", pt = d3.svg.symbol().type(shape);
          return pt.size(style.pointSize * style.pointSize)();
        }
        var height = style.height - style.margins.top - style.margins.bottom, width = style.width - style.margins.left - style.margins.right;
        var pointColor = d3.scale.ordinal().domain(data.categories).range(style.categoryColors);
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg").attr("height", style.height).attr("width", style.width).attr("xmlns", "http://www.w3.org/2000/svg").style("font-family", style.fontFamily).style("font-size", style.fontSize);
        var scatterplot = svg.append("g").attr("transform", "translate(" + style.margins.left + "," + style.margins.top + ")");
        var x = d3.scale.linear().domain([ data.xScale.min, data.xScale.max ]).range([ 0, width ]), y = d3.scale.linear().domain([ data.yScale.min, data.yScale.max ]).range([ height, 0 ]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom"), yAxis = d3.svg.axis().scale(y).orient("left");
        var axisStyle = {
          stroke: "black",
          fill: "none",
          "shape-rendering": "crispEdges",
          "stroke-width": "1px"
        }, axisG = scatterplot.append("g").attr("class", "gd3-scatterplot-axis"), xAxisRender = axisG.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis), xAxisLabel = axisG.append("text").attr("text-anchor", "middle").attr("x", x(x.domain()[1]) / 2).attr("y", height + xAxisRender.node().getBBox().height + style.axisFontSize).style("font-size", style.axisFontSize).text(data.xLabel), yAxisRender = axisG.append("g").attr("class", "y axis").call(yAxis), yAxisLabel = axisG.append("text").attr("text-anchor", "middle").attr("transform", "rotate(-90)").attr("x", -y(y.domain()[0]) / 2).attr("y", -yAxisRender.node().getBBox().width).text(data.yLabel);
        axisG.selectAll(".tick text").style("fill", "black").style("font-size", style.axisFontSize);
        axisG.selectAll("path").style(axisStyle);
        scatterplot.append("text").attr("text-anchor", "middle").attr("x", x(x.domain()[1]) / 2).style("font-size", style.titleFontSize).style("font-weight", "bold").text(data.title);
        var legendW = style.margins.right - style.legendPadding.left - style.legendPadding.right, legend = scatterplot.append("g").attr("class", "gd3-scatterplot-legend").attr("transform", "translate(" + (width + style.legendPadding.left) + ",0)"), legendCategories = legend.selectAll(".category").data(data.categories.values()).enter().append("g").attr("class", "category");
        legendCategories.each(function(d, i) {
          var thisEl = d3.select(this), shapeR = style.pointSize / 2, shape = thisEl.append("path").attr("d", makeShape).attr("transform", "translate(" + shapeR + "," + -shapeR + ")").style("fill", function(d) {
            return pointColor(d);
          }), text = thisEl.append("text").attr("x", style.pointSize + 1).text(d);
          thisEl.attr("transform", "translate(0," + i * (style.legendFontSize + 2) + ")");
        });
        var pointsGroup = scatterplot.append("g").attr("class", "gd3-scatterplot-points");
        pointsGroup.selectAll(".point").data(data.pts).enter().append("path").attr("class", "point").attr("d", makeShape).attr("transform", function(d) {
          return "translate(" + x(d.x) + "," + y(d.y) + ")";
        }).style("fill", function(d) {
          return pointColor(d.category);
        });
      });
    }
    return chart;
  }
  function scatterplotStyle(style) {
    return {
      axisFontSize: style.axisFontSize || style.fontSize || 12,
      categoryColors: d3.scale.category10().range(),
      categoryShapes: [ "circle", "diamond", "cross", "triangle-down", "square", "triangle-up" ],
      fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: style.fontSize || 12,
      height: style.height || 300,
      legendFontSize: style.legendFontSize || 11,
      legendScaleWidth: style.legendScaleWidth || 30,
      legendWidth: style.legendWidth || 75,
      pointSize: style.pointSize || 7,
      titleFontSize: style.titleFontSize || 14,
      width: style.width || 300,
      margins: style.margins || {
        bottom: 50,
        left: 35,
        right: 15,
        top: style.titleFontSize || 14
      },
      legendPadding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: style.pointSize || 7
      }
    };
  }
  gd3.scatterplot = function(params) {
    var params = params || {}, style = scatterplotStyle(params.style || {});
    return scatterplotChart(style);
  };
  function tooltipStyle(style) {
    return {
      background: style.background || "rgba(0, 0, 0, 0.75)",
      border: style.border || "1px solid rgba(0,0,0,0.8)",
      borderRadius: style.borderRadius || "2px",
      fontColor: style.fontColor || "#ffffff",
      fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: "11px",
      height: style.height || 200,
      lineHeight: style.lineHeight || 1,
      padding: style.padding || "5px",
      voteActiveColor: style.voteActiveColor || "#ff0000",
      width: style.width || 500
    };
  }
  function tooltipView(style) {
    var clickCount = 0, clickEvents = {}, direction = d3_tip_direction, offset = d3_tip_offset, html = d3_tip_html, node = undefined, sticky = false, svg = null, point = null, target = null;
    function positionTooltip() {
      var args = Array.prototype.slice.call(arguments);
      var poffset = offset.apply(this, args), coords, dir = direction.apply(this, args), i = directions.length, nodel = d3.select(node), scrollTop = document.documentElement.scrollTop || document.body.scrollTop, scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
      while (i--) nodel.classed(directions[i], false);
      coords = direction_callbacks.get(dir).apply(this);
      nodel.classed(dir, true).style({
        top: coords.top + poffset[0] + scrollTop + "px",
        left: coords.left + poffset[1] + scrollLeft + "px"
      });
    }
    function view(selection) {
      svg = selection;
      point = selection.node().createSVGPoint();
      node = d3.select("body").append("div");
      node.style({
        background: style.background,
        border: style.border,
        "border-radius": style.borderRadius,
        color: style.fontColor,
        "font-family": style.fontFamily,
        "font-size": style.fontSize,
        "line-height": style.lineHeight,
        overflow: "hidden",
        position: "absolute",
        top: 0,
        opacity: 0,
        "pointer-events": "none",
        "box-sizing": "border-box",
        padding: style.padding
      });
      node = node.node();
      var uniqueID = Date.now();
      d3.select("body").on("keydown.gd3-tooltip-exit-" + uniqueID, function() {
        if (d3.event.keyCode == 27) {
          sticky = false;
          view.hide();
        }
      });
      var tipObjects = selection.selectAll(".gd3-tipobj").on("click", function() {
        sticky = sticky ? false : true;
        if (sticky) {
          if (d3.event.type != "click") return;
          d3.select(node).selectAll("*").each(function() {
            var thisEl = d3.select(this), isSummaryElement = thisEl.attr("data-summaryElement");
            if (isSummaryElement) thisEl.style("display", "block");
          });
          positionTooltip();
        } else view.hide();
      }).on("mouseover", view.render).on("mouseout", view.hide);
    }
    view.render = function() {
      if (sticky) {
        if (d3.event.type != "click") return;
        d3.select(node).selectAll("*").each(function() {
          var thisEl = d3.select(this), isSummaryElement = thisEl.attr("data-summaryElement");
          if (isSummaryElement) thisEl.style("display", "block");
        });
        positionTooltip();
        return;
      }
      var args = Array.prototype.slice.call(arguments);
      if (args[args.length - 1] instanceof SVGElement) target = args.pop();
      var content = html.apply(this, args), nodel = d3.select(node);
      var xout = '<span class="gd3-tooltip-xout" style="cursor: pointer; float: right; font-size:8px;">X</span><br/>';
      nodel.html(xout);
      content.forEach(function(tipElem) {
        tipElem.render(nodel);
      });
      nodel.style({
        opacity: 1,
        "pointer-events": "all"
      });
      nodel.select(".gd3-tooltip-xout").on("click", function() {
        sticky = sticky ? false : true;
        view.hide();
      });
      var clickEventObjs = nodel.selectAll(".clickEventObj");
      if (clickEventObjs.empty() == false) {
        clickEventObjs.each(function() {
          var thisEl = d3.select(this), clickIndex = thisEl.attr("data-click"), clickEvent = clickEvents[clickIndex];
          thisEl.on("click", clickEvent);
        });
      }
      positionTooltip();
      return view;
    };
    view.hide = function() {
      if (sticky) return;
      var nodel = d3.select(node);
      nodel.style({
        opacity: 0,
        "pointer-events": "none"
      });
      d3.select(node).selectAll("*").each(function() {
        var thisEl = d3.select(this), isSummaryElement = thisEl.attr("data-summaryElement");
        if (isSummaryElement) thisEl.style("display", "none");
      });
      return view;
    };
    view.attr = function(n, v) {
      if (arguments.length < 2 && typeof n === "string") {
        return d3.select(node).attr(n);
      } else {
        var args = Array.prototype.slice.call(arguments);
        d3.selection.prototype.attr.apply(d3.select(node), args);
      }
      return view;
    };
    view.style = function(n, v) {
      if (arguments.length < 2 && typeof n === "string") {
        return d3.select(node).style(n);
      } else {
        var args = Array.prototype.slice.call(arguments);
        d3.selection.prototype.style.apply(d3.select(node), args);
      }
      return view;
    };
    view.direction = function(v) {
      if (!arguments.length) return direction;
      direction = v == null ? v : d3.functor(v);
      return view;
    };
    view.offset = function(v) {
      if (!arguments.length) return offset;
      offset = v == null ? v : d3.functor(v);
      return view;
    };
    view.html = function(v) {
      if (!arguments.length) return html;
      html = v == null ? v : d3.functor(v);
      return view;
    };
    view.useData = function(data) {
      function depth(d) {
        return Array.isArray(d) ? depth(d[0]) + 1 : 0;
      }
      var ghostNode = document.createElement("div"), nodel = d3.select(ghostNode);
      var dimensionality = depth(data);
      function registerClickEvent(selection) {
        if (selection.on("click")) {
          selection.attr("data-click", clickCount).classed("clickEventObj", true);
          clickEvents[clickCount] = selection.on("click");
          clickCount = clickCount + 1;
        }
      }
      if (dimensionality == 0) {
        html = d3.functor([ data ]);
      } else if (dimensionality == 1) {
        html = d3.functor(data);
      } else {
        html = d3.functor(function(d, i) {
          return data[i];
        });
      }
      return view;
    };
    function d3_tip_direction() {
      return "n";
    }
    function d3_tip_offset() {
      return [ 0, 0 ];
    }
    function d3_tip_html() {
      return " ";
    }
    var direction_callbacks = d3.map({
      n: direction_n,
      s: direction_s,
      e: direction_e,
      w: direction_w,
      nw: direction_nw,
      ne: direction_ne,
      sw: direction_sw,
      se: direction_se
    }), directions = direction_callbacks.keys();
    function direction_n() {
      var bbox = getScreenBBox();
      return {
        top: bbox.n.y - node.offsetHeight,
        left: bbox.n.x - node.offsetWidth / 2
      };
    }
    function direction_s() {
      var bbox = getScreenBBox();
      return {
        top: bbox.s.y,
        left: bbox.s.x - node.offsetWidth / 2
      };
    }
    function direction_e() {
      var bbox = getScreenBBox();
      return {
        top: bbox.e.y - node.offsetHeight / 2,
        left: bbox.e.x
      };
    }
    function direction_w() {
      var bbox = getScreenBBox();
      return {
        top: bbox.w.y - node.offsetHeight / 2,
        left: bbox.w.x - node.offsetWidth
      };
    }
    function direction_nw() {
      var bbox = getScreenBBox();
      return {
        top: bbox.nw.y - node.offsetHeight,
        left: bbox.nw.x - node.offsetWidth
      };
    }
    function direction_ne() {
      var bbox = getScreenBBox();
      return {
        top: bbox.ne.y - node.offsetHeight,
        left: bbox.ne.x
      };
    }
    function direction_sw() {
      var bbox = getScreenBBox();
      return {
        top: bbox.sw.y,
        left: bbox.sw.x - node.offsetWidth
      };
    }
    function direction_se() {
      var bbox = getScreenBBox();
      return {
        top: bbox.se.y,
        left: bbox.e.x
      };
    }
    function getScreenBBox() {
      var targetel = target || d3.event.target;
      while ("undefined" === typeof targetel.getScreenCTM && "undefined" === targetel.parentNode) {
        targetel = targetel.parentNode;
      }
      var bbox = {}, matrix = targetel.getScreenCTM(), tbbox = targetel.getBBox(), width = tbbox.width, height = tbbox.height, x = tbbox.x, y = tbbox.y;
      point.x = x;
      point.y = y;
      bbox.nw = point.matrixTransform(matrix);
      point.x += width;
      bbox.ne = point.matrixTransform(matrix);
      point.y += height;
      bbox.se = point.matrixTransform(matrix);
      point.x -= width;
      bbox.sw = point.matrixTransform(matrix);
      point.y -= height / 2;
      bbox.w = point.matrixTransform(matrix);
      point.x += width;
      bbox.e = point.matrixTransform(matrix);
      point.x -= width / 2;
      point.y -= height / 2;
      bbox.n = point.matrixTransform(matrix);
      point.y += height;
      bbox.s = point.matrixTransform(matrix);
      return bbox;
    }
    return view;
  }
  gd3.tooltip = {};
  gd3.tooltip.make = function(params) {
    var params = params || {}, style = tooltipStyle(params.style || {}), votingFns = params.votingFns || {};
    return tooltipView(style);
  };
  gd3.tooltip.data = function(ds) {
    return ds.map(function(d) {
      return gd3.tooltip.datum(d);
    });
  };
  gd3.tooltip.datum = function(d) {
    var elem = null;
    if (!d.type) elem = new gd3.tooltip.text(d.toString()); else if (d.type == "image") elem = new gd3.tooltip.image(d.src, d.title); else if (d.type == "link") elem = new gd3.tooltip.link(d.href, d.body); else if (d.type == "table") elem = new gd3.tooltip.table(d.table); else if (d.type == "text") elem = new gd3.tooltip.text(d.text); else if (d.type == "vote") elem = new gd3.tooltip.vote(d.downvoteFn, d.upvoteFn, d.voteCountFn, d.voteDirectionFn);
    if (elem == null) return new gd3.tooltip.text(d.toString());
    return elem.showSummary(d.defaultHidden);
  };
  gd3.tooltip.element = gd3_tooltipElement;
  function gd3_tooltipElement() {}
  gd3_tooltipElement.prototype.summaryElement = false;
  gd3_tooltipElement.prototype.showSummary = function(state) {
    state = state || false;
    this.summaryElement = state;
    return this;
  };
  gd3.tooltip.image = gd3_tooltipImage;
  function gd3_tooltipImage(src, title) {
    if (!this instanceof gd3_tooltipImage) return new gd3_tooltipImage(src, title);
    this.src = src;
    this.title = title;
    this.type = "link";
    return this;
  }
  var gd3_tooltipImagePrototype = gd3_tooltipImage.prototype = new gd3_tooltipElement();
  gd3_tooltipImagePrototype.toString = function() {
    return this.title.toString();
  };
  gd3_tooltipImagePrototype.render = function(selection) {
    var thisTooltip = this;
    img = selection.append("img").attr("src", this.src);
    if (this.title) img.attr("alt", this.title);
    img.attr("data-summaryElement", this.summaryElement);
    if (this.summaryElement) img.style("display", "none");
    return img;
  };
  gd3.tooltip.text = gd3_tooltipText;
  function gd3_tooltipText(text) {
    if (!this instanceof gd3_tooltipText) return new gd3_tooltipText(text);
    this.text = text;
    this.type = "text";
    return this;
  }
  var gd3_tooltipTextPrototype = gd3_tooltipText.prototype = new gd3_tooltipElement();
  gd3_tooltipTextPrototype.toString = function() {
    return this.text;
  };
  gd3_tooltipTextPrototype.render = function(selection) {
    var text = selection.append("span").text(this.text);
    text.attr("data-summaryElement", this.summaryElement);
    if (this.summaryElement) text.style("display", "none"); else text.style("display", "block");
    return text;
  };
  gd3.tooltip.vote = gd3_tooltipVote;
  var gd3_tooltipVotePrototype = gd3_tooltipVote.prototype = new gd3_tooltipElement();
  function gd3_tooltipVote(downvoteFn, upvoteFn, voteCountFn, voteDirectionFn) {
    if (!this instanceof gd3_tooltipVote) {
      return new gd3_tooltipVote(downvoteFn, upvoteFn, voteCountFn, voteDirectionFn);
    }
    this.downvoteFn = downvoteFn;
    this.upvoteFn = upvoteFn;
    this.voteCountFn = voteCountFn;
    this.voteDirectionFn = voteDirectionFn;
    return this;
  }
  gd3_tooltipVotePrototype.toString = function() {
    if (typeof this.voteCount == "function") return this.voteCount() + " votes";
    return this.voteCount + " votes";
  };
  gd3_tooltipVotePrototype.render = function(selection) {
    var votingArea = selection.append("span").attr("class", "gd3-tooltip-vote"), downVote = votingArea.append("span").text("▼").attr("class", "gd3-tooltip-dvote"), upVote = votingArea.append("span").text("▲").attr("class", "gd3-tooltip-uvote"), voteCount = votingArea.append("span").attr("class", "gd3-tooltip-votecount").text(this.voteCountFn());
    if (this.voteDirectionFn) {
      if (this.voteDirectionFn() == "down") {
        downVote.classed("gd3-vote-active", true);
        downVote.style("color", "goldenrod");
      } else if (this.voteDirectionFn() == "up") {
        upVote.classed("gd3-vote-active", true);
        upVote.style("color", "goldenrod");
      }
    }
    votingArea.style("display", "block");
    votingArea.selectAll("span").style({
      display: "inline-block"
    });
    var downVoteFn = this.downVoteFn, thisVote = this;
    downVote.on("click", function(d) {
      var downVote = d3.select(this), upVote = d3.select(this.parentNode).select(".gd3-tooltip-uvote"), voteCount = d3.select(this.parentNode).select(".gd3-tooltip-votecount");
      upVote.style("color", null);
      if (downVote.classed("gd3-vote-active") == true) {
        downVote.classed("gd3-vote-active", false);
        downVote.style("color", null);
      } else {
        downVote.classed("gd3-vote-active", true);
        upVote.classed("gd3-vote-active", false);
        downVote.style("color", "goldenrod");
      }
      var vote = thisVote.downvoteFn(d, downVote.classed("gd3-vote-active"));
      if (vote) {
        upVote.classed("gd3-vote-active", false);
        downVote.classed("gd3-vote-active", true);
      }
      voteCount.text(voteCount.datum().voteCountFn());
    });
    upVote.on("click", function(d) {
      var downVote = d3.select(this.parentNode).select(".gd3-tooltip-dvote"), upVote = d3.select(this), voteCount = d3.select(this.parentNode).select(".gd3-tooltip-votecount");
      downVote.style("color", null);
      if (upVote.classed("gd3-vote-active") == true) {
        upVote.classed("gd3-vote-active", false);
        upVote.style("color", null);
      } else {
        downVote.classed("gd3-vote-active", false);
        upVote.classed("gd3-vote-active", true);
        upVote.style("color", "goldenrod");
      }
      var vote = thisVote.upvoteFn(d, upVote.classed("gd3-vote-active"));
      if (vote) {
        downVote.classed("gd3-vote-active", false);
        upVote.classed("gd3-vote-active", true);
      }
      voteCount.text(voteCount.datum().voteCountFn());
    });
    var voteGlyphStyle = {
      cursor: "pointer",
      "-moz-user-select": "none",
      "-ms-user-select": "none",
      "-o-user-select": "none",
      "-webkit-user-select": "none"
    };
    downVote.style(voteGlyphStyle);
    upVote.style(voteGlyphStyle);
    votingArea.attr("data-summaryElement", this.summaryElement);
    if (this.summaryElement) votingArea.style("display", "none");
    return votingArea;
  };
  gd3.tooltip.link = gd3_tooltipLink;
  function gd3_tooltipLink(href, body) {
    if (!this instanceof gd3_tooltipLink) return new gd3_tooltipLink(href, body);
    this.body = body;
    this.href = href;
    this.type = "link";
    return this;
  }
  var gd3_tooltipLinkPrototype = gd3_tooltipLink.prototype = new gd3_tooltipElement();
  gd3_tooltipLinkPrototype.toString = function() {
    return this.body.toString();
  };
  gd3_tooltipLinkPrototype.render = function(selection) {
    var thisTooltip = this;
    a = selection.append("a").attr("href", this.href);
    if (thisTooltip.body.render) thisTooltip.body.render(a); else a.text(thisTooltip.body.toString());
    a.attr("data-summaryElement", this.summaryElement);
    if (this.summaryElement) a.style("display", "none");
    return a;
  };
  gd3.tooltip.table = gd3_tooltipTable;
  function gd3_tooltipTable(array) {
    if (!this instanceof gd3_tooltipTable) return new gd3_tooltipTable(array);
    this.table = array;
    return this;
  }
  var gd3_tooltipTablePrototype = gd3_tooltipTable.prototype = new gd3_tooltipElement();
  gd3_tooltipTablePrototype.toString = function() {
    return this.body.toString();
  };
  gd3_tooltipTablePrototype.render = function(selection) {
    var thisTooltip = this;
    table = selection.append("table").attr("class", "gd3-tooltip-table"), rows = table.selectAll("tr").data(thisTooltip.table).enter().append("tr"), 
    cells = rows.selectAll("td").data(function(d) {
      return d;
    }).enter().append("td");
    cells.each(function(d) {
      if (d.render) d.render(d3.select(this)); else d3.select(this).text(d.toString());
    });
    table.attr("data-summaryElement", this.summaryElement);
    if (this.summaryElement) table.style("display", "none");
    return table;
  };
  function transcriptData(data) {
    function parseCancer(cdata) {
      var defaultInactivatingMutations = {
        Nonsense_Mutation: true,
        Frame_Shift_Del: true,
        Frame_Shift_Ins: true,
        Missense_Mutation: false,
        Splice_Site: true,
        In_Frame_Del: false,
        In_Frame_Ins: false
      };
      var defaultMutationTypesToSymbols = {
        Nonsense_Mutation: 0,
        Frame_Shift_Del: 1,
        Frame_Shift_Ins: 1,
        Missense_Mutation: 2,
        Splice_Site: 3,
        In_Frame_Del: 4,
        In_Frame_Ins: 4
      };
      var proteinDomainDB = cdata.proteinDomainDB || Object.keys(cdata.domains)[0] || "";
      var d = {
        geneName: cdata.gene,
        inactivatingMutations: cdata.inactivatingMutations || defaultInactivatingMutations,
        length: cdata.length,
        mutationCategories: cdata.mutationCategories || [],
        mutations: cdata.mutations,
        mutationTypesToSymbols: cdata.mutationTypesToSymbols || defaultMutationTypesToSymbols,
        proteinDomainDB: proteinDomainDB,
        proteinDomains: cdata.domains[proteinDomainDB] || []
      };
      d.types = Object.keys(d.mutationTypesToSymbols);
      d.datasets = d3.set(cdata.mutations.map(function(m) {
        return m.dataset;
      })).values();
      d.get = function(str) {
        if (str == "length") return d.length; else if (str == "datasets") return d.datasets; else if (str == "mutations") return d.mutations; else if (str == "mutationTypesToSymbols") return d.mutationTypesToSymbols; else if (str == "proteinDomains") return d.proteinDomains; else return null;
      };
      d.isMutationInactivating = function(mut) {
        return d.inactivatingMutations[mut];
      };
      d.domain = function(locus) {
        var loc = locus * 1;
        for (var i = 0; i < d.proteinDomains.length; i++) {
          if (d.proteinDomains[i].start < loc && d.proteinDomains[i].end > loc) {
            return d.proteinDomains[i].name;
          }
        }
        return null;
      };
      return d;
    }
    var tData = parseCancer(data);
    return tData;
  }
  function transcriptChart(style) {
    var showScrollers = true, showLegend = true;
    function chart(selection) {
      selection.each(function(data) {
        data = transcriptData(data);
        var filteredTypes = [], filteredCategories = [], instanceIDConst = "gd3-transcript-" + Date.now();
        var d3color = d3.scale.category20(), sampleTypeToColor = {};
        for (var i = 0; i < data.get("datasets").length; i++) {
          sampleTypeToColor[data.get("datasets")[i]] = d3color(i);
        }
        var height = style.height, scrollbarWidth = showScrollers ? style.scollbarWidth : 0, width = style.width - scrollbarWidth - style.margin.left - style.margin.right;
        var mutationResolution = Math.floor(width / style.symbolWidth);
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg").attr("height", height).attr("width", width + scrollbarWidth + style.margin.left + style.margin.right);
        var start = 0, stop = data.get("length");
        var x = d3.scale.linear().domain([ start, stop ]).range([ 0, width ]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(style.numXTicks).tickSize(0).tickPadding(style.xTickPadding);
        var tG = svg.append("g").attr("transform", "translate(" + (style.margin.left + scrollbarWidth) + ",0)");
        var transcriptAxis = tG.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (style.height / 2 + style.transcriptBarHeight + 6) + ")").style("font-family", style.fontFamily).style("font-size", "12px").style("fill", "#000").call(xAxis);
        var transcriptBar = tG.append("rect").attr("height", style.transcriptBarHeight).attr("width", x(stop) - x(start)).attr("x", x(start)).attr("y", height / 2).style("fill", "#ccc");
        var zoom = d3.behavior.zoom().x(x).scaleExtent([ 1, 100 ]).on("zoom", function() {
          updateTranscript();
        });
        svg.call(zoom);
        var mutationsG = tG.append("g").attr("class", "gd3TranscriptMutations"), inactivatingG = mutationsG.append("g"), activatingG = mutationsG.append("g");
        var inactivatingData = data.get("mutations").filter(function(d) {
          return data.isMutationInactivating(d.ty);
        }), activatingData = data.get("mutations").filter(function(d) {
          return !data.isMutationInactivating(d.ty);
        });
        var inactivatingMutations = inactivatingG.selectAll(".symbols").data(inactivatingData).enter().append("path").attr("class", "symbols").attr("d", d3.svg.symbol().type(function(d, i) {
          return d3.svg.symbolTypes[data.get("mutationTypesToSymbols")[d.ty]];
        }).size(style.symbolWidth)).style("fill", function(d, i) {
          if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
          return sampleTypeToColor[d.dataset];
        }).style("stroke", function(d, i) {
          if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
          return sampleTypeToColor[d.dataset];
        }).style("stroke-width", 2);
        var activatingMutations = activatingG.selectAll(".symbols").data(activatingData).enter().append("path").attr("class", "symbols").attr("d", d3.svg.symbol().type(function(d, i) {
          return d3.svg.symbolTypes[data.get("mutationTypesToSymbols")[d.ty]];
        }).size(style.symbolWidth)).style("fill", function(d, i) {
          if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
          return sampleTypeToColor[d.dataset];
        }).style("stroke", function(d, i) {
          if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
          return sampleTypeToColor[d.dataset];
        }).style("stroke-width", 2);
        var domainGroupsData = data.get("proteinDomains");
        var domainGroups = tG.selectAll(".domains").data(domainGroupsData ? data.get("proteinDomains").slice() : []).enter().append("g").attr("class", "domains");
        var domains = domainGroups.append("rect").attr("id", function(d, i) {
          return "domain-" + i;
        }).attr("width", function(d, i) {
          return x(d.end) - x(d.start);
        }).attr("height", style.transcriptBarHeight + 10).style("fill", "#aaa").style("fill-opacity", .5);
        var domainLabels = domainGroups.append("text").attr("id", function(d, i) {
          return "domain-label-" + i;
        }).attr("text-anchor", "middle").attr("y", style.transcriptBarHeight).style("fill", "#000").style("fill-opacity", 0).style("font-size", 12).style("font-family", style.fontFamily).text(function(d, i) {
          return d.name;
        });
        domainGroups.on("mouseover", function(d, i) {
          d3.select(this).selectAll("rect").style("fill", "#f00");
          domainGroups.select("#domain-label-" + i).style("fill-opacity", 1);
        }).on("mouseout", function(d, i) {
          d3.select(this).selectAll("rect").style("fill", "#aaa");
          domainGroups.select("#domain-label-" + i).style("fill-opacity", 0);
        });
        updateTranscript();
        if (showScrollers) {
          renderScrollers();
        }
        function updateTranscript() {
          var t = zoom.translate(), tx = t[0], ty = t[1], scale = zoom.scale();
          tx = Math.min(tx, 0);
          zoom.translate([ tx, ty ]);
          var curMin = d3.min(x.domain()), curMax = d3.max(x.domain()), curRes = Math.round((curMax - curMin) / mutationResolution);
          curRes = curRes ? curRes : 1;
          var bottomIndex = {}, topIndex = {}, pX = {}, pY = {};
          var endIter = Math.ceil(curMax / curRes) + 5;
          startIter = Math.floor(curMin / curRes) - 5;
          for (var i = startIter; i < endIter; i++) {
            bottomIndex[i] = 0;
            topIndex[i] = 0;
          }
          activatingMutations.each(function(d) {
            var activeType = filteredTypes.indexOf(d.ty) === -1, activeCategories = filteredCategories.indexOf(d.dataset) === -1;
            d.visible = activeCategories && activeType;
          });
          activatingMutations.filter(function(d) {
            return !d.visible;
          }).style({
            "stroke-opacity": 0,
            "fill-opacity": 0
          });
          activatingMutations.filter(function(d) {
            return d.visible;
          }).attr("transform", function(d, i) {
            var indexDict = data.isMutationInactivating(d.ty) ? bottomIndex : topIndex, curIndex = Math.round(d.locus / curRes), px = x(curIndex * curRes), py;
            if (indexDict[curIndex] == undefined) indexDict[curIndex] = 0;
            if (data.isMutationInactivating(d.ty)) {
              py = height / 2 + (style.transcriptBarHeight + indexDict[curIndex] * (style.symbolWidth / 2) + 21);
            } else {
              py = height / 2 - (indexDict[curIndex] * (style.symbolWidth / 2) + 11);
            }
            indexDict[curIndex]++;
            pX[i] = px;
            pY[i] = py;
            return "translate(" + px + ", " + py + ")";
          }).style("fill", function(d) {
            if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
            return sampleTypeToColor[d.dataset];
          }).style("fill-opacity", 1).style("stroke", function(d) {
            if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
            return sampleTypeToColor[d.dataset];
          }).style("stroke-opacity", 1);
          inactivatingMutations.each(function(d) {
            if (filteredTypes.indexOf(d.ty) === -1) d.visible = true; else d.visible = false;
          });
          inactivatingMutations.filter(function(d) {
            return !d.visible;
          }).style({
            "stroke-opacity": 0,
            "fill-opacity": 0
          });
          inactivatingMutations.filter(function(d) {
            return d.visible;
          }).attr("transform", function(d, i) {
            var indexDict = data.isMutationInactivating(d.ty) ? bottomIndex : topIndex, curIndex = Math.round(d.locus / curRes), px = x(curIndex * curRes), py;
            if (indexDict[curIndex] == undefined) indexDict[curIndex] = 0;
            if (data.isMutationInactivating(d.ty)) {
              py = height / 2 + (style.transcriptBarHeight + indexDict[curIndex] * (style.symbolWidth / 2) + 21);
            } else {
              py = height / 2 - (indexDict[curIndex] * (style.symbolWidth / 2) + 11);
            }
            indexDict[curIndex]++;
            pX[i] = px;
            pY[i] = py;
            return "translate(" + px + ", " + py + ")";
          }).style("fill", function(d) {
            if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
            return sampleTypeToColor[d.dataset];
          }).style("fill-opacity", 1).style("stroke", function(d) {
            if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
            return sampleTypeToColor[d.dataset];
          }).style("stroke-opacity", 1);
          transcriptAxis.call(xAxis);
          transcriptBar.attr("x", x(start)).attr("width", x(stop) - x(start));
          domainGroups.attr("transform", function(d, i) {
            return "translate(" + x(d.start) + "," + (height / 2 - 5) + ")";
          });
          domains.attr("width", function(d, i) {
            return x(d.end) - x(d.start);
          });
          domainLabels.attr("x", function(d, i) {
            if (this.parentNode) {
              var w = d3.select(this.parentNode).select("rect").attr("width");
              return w / 2;
            } else {
              return d3.select(this).attr("x");
            }
          });
        }
        function renderScrollers() {
          var sG = svg.append("g");
          var activatingYs = [], inactivatingYs = [];
          function getYs(transforms) {
            return function() {
              var transform = d3.select(this).attr("transform");
              if (transform) {
                var y = parseFloat(transform.split(",")[1].split(")")[0]);
                transforms.push(y);
              }
            };
          }
          activatingMutations.each(getYs(activatingYs));
          inactivatingMutations.each(getYs(inactivatingYs));
          var minActivatingY = d3.min(activatingYs), maxInactivatingY = d3.max(inactivatingYs);
          var showActivatingScroller = minActivatingY < 0, showInactivatingScroller = maxInactivatingY > height;
          if (!showActivatingScroller && !showInactivatingScroller) return;
          var maxActivatingOffset = minActivatingY < 0 ? Math.abs(minActivatingY) + style.symbolWidth : style.transcriptBarHeight, maxInactivatingOffset = maxInactivatingY > height ? maxInactivatingY - style.symbolWidth : style.transcriptBarHeight;
          var gradient = svg.append("svg:defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");
          gradient.append("svg:stop").attr("offset", "0%").attr("stop-color", "#eeeeee").attr("stop-opacity", 1);
          gradient.append("svg:stop").attr("offset", "100%").attr("stop-color", "#666666").attr("stop-opacity", 1);
          var dragSlider = d3.behavior.drag().on("dragstart", dragStart).on("drag", dragMove).on("dragend", dragEnd);
          function dragStart(d) {
            d3.event.sourceEvent.stopPropagation();
            var thisEl = d3.select(this);
            thisEl.style("fill", "#888888");
          }
          function dragMove(d) {
            var thisEl = d3.select(this), higher = d.loc == "top" ? d.max : d.min, lower = higher == d.max ? d.min : d.max;
            if (d3.event.y > lower) {
              var y = lower;
            } else if (d3.event.y < higher) {
              var y = higher;
            } else {
              var y = d3.event.y;
            }
            thisEl.attr("cy", y);
            var activeG = d.loc == "top" ? activatingG : inactivatingG, activeM = d.loc == "top" ? activatingMutations : inactivatingMutations;
            var scrollDomain = lower - higher, scrollNow = y - higher, scrollPercent = d.loc == "top" ? 1 - scrollNow / scrollDomain : scrollNow / scrollDomain;
            var offset = d.loc == "top" ? maxActivatingOffset : -1 * maxInactivatingOffset, adjust = offset * scrollPercent;
            activeG.attr("transform", "translate(0," + adjust + ")");
            activeM.each(function() {
              var thisEl = d3.select(this), transform = thisEl.attr("transform");
              if (transform) {
                var y = parseFloat(transform.split(",")[1].split(")")[0]);
                if (d.loc == "top") {
                  thisEl.style("opacity", y + adjust > lower ? 0 : 1);
                } else {
                  thisEl.style("opacity", y + adjust < higher ? 0 : 1);
                }
              }
            });
          }
          function dragEnd(d) {
            var thisEl = d3.select(this);
            thisEl.style("fill", "url(#gradient)");
          }
          sG.append("rect").attr("x", 0).attr("y", 0).attr("width", 15).attr("height", style.height).style("fill", "#fff");
          if (showActivatingScroller) {
            sG.append("line").attr("x1", 6).attr("y1", 10).attr("x2", 6).attr("y2", style.height / 2 - style.transcriptBarHeight / 2 + 10).style("stroke", "#ccc").style("stroke-width", 1);
          }
          if (showInactivatingScroller) {
            sG.append("line").attr("x1", 6).attr("y1", style.height / 2 + style.transcriptBarHeight / 2 + 10).attr("x2", 6).attr("y2", style.height - 10).style("stroke", "#ccc").style("stroke-width", 1);
          }
          var sliderBounds = [ {
            min: style.height / 2 - style.transcriptBarHeight / 2 + 4,
            max: 6,
            loc: "top",
            show: showActivatingScroller
          }, {
            min: style.height / 2 + style.transcriptBarHeight + 4,
            max: style.height - 6,
            loc: "bottom",
            show: showInactivatingScroller
          } ];
          sG.selectAll("circle").data(sliderBounds.filter(function(d) {
            return d.show;
          })).enter().append("circle").attr("r", 5).attr("cx", 6).attr("cy", function(d) {
            return d.min;
          }).style({
            "box-shadow": "0px 0px 5px 0px rgba(0,0,0,0.75)",
            fill: "url(#gradient)",
            stroke: "#666",
            "stroke-width": 1
          }).call(dragSlider);
        }
        if (showLegend) renderLegend();
        function renderLegend() {
          var mutationTypes = data.types, numTypes = mutationTypes.length, numRows = Math.ceil(numTypes / 2);
          var svg = selection.append("div").selectAll(".gd3-transcript-legend-svg").data([ data ]).enter().append("svg").attr("class", "gd3-transcript-legend-svg").attr("font-size", 10).attr("width", width), legendGroup = svg.append("g");
          var legend = legendGroup.selectAll(".symbolGroup").data(mutationTypes).enter().append("g").attr("transform", function(d, i) {
            var x = i % numRows * width / numRows + style.margin.left + style.margin.right, y = Math.round(i / numTypes) * style.legendSymbolHeight + (Math.round(i / numTypes) + 2) + style.margin.top;
            return "translate(" + x + ", " + y + ")";
          }).style("cursor", "pointer").on("click.dispatch-mutation-type", function(d) {
            var index = filteredTypes.indexOf(d), visible = index === -1;
            if (visible) {
              filteredTypes.push(d);
            } else {
              filteredTypes.splice(index, 1);
            }
            d3.select(this).selectAll("*").style("fill-opacity", visible ? .5 : 1).style("stroke-opacity", visible ? .5 : 1);
            gd3.dispatch.filterMutationType({
              types: filteredTypes
            });
          });
          legend.append("path").attr("class", "symbol").attr("d", d3.svg.symbol().type(function(d, i) {
            return d3.svg.symbolTypes[data.mutationTypesToSymbols[d]];
          }).size(2 * style.legendSymbolHeight)).style("stroke", "#95A5A6").style("stroke-width", 2).style("fill", "#95A5A6");
          legend.append("text").attr("dx", 7).attr("dy", 3).text(function(d) {
            return d.replace(/_/g, " ");
          });
          svg.attr("height", legendGroup.node().getBBox().height);
        }
        var allMutations = mutationsG.selectAll("path").on("mouseover.dispatch-sample", function(d) {
          gd3.dispatch.sample({
            sample: d.sample,
            over: true
          });
        }).on("mouseout.dispatch-sample", function(d) {
          gd3.dispatch.sample({
            sample: d.sample,
            over: false
          });
        }).on("click.dispatch-mutation", function(d) {
          var domain = null;
          gd3.dispatch.mutation({
            dataset: d.dataset,
            gene: data.geneName,
            mutation_class: "snv",
            mutation_type: d.ty,
            locus: d.locus,
            domain: data.domain(d.locus)
          });
        });
        gd3.dispatch.on("sample.transcript", function(d) {
          var over = d.over, sample = d.sample, affectedMutations = allMutations.filter(function(d) {
            return d.sample == sample;
          });
          if (gd3_util.selectionSize(affectedMutations)) {
            allMutations.style("opacity", over ? .25 : 1);
            affectedMutations.style("opacity", 1);
          }
        });
        gd3.dispatch.on("filterMutationType." + instanceIDConst, function(d) {
          if (!d || !d.types) return;
          filteredTypes = d.types.filter(function(s) {
            return data.types.indexOf(s) > -1;
          });
          updateTranscript();
        });
        gd3.dispatch.on("filterCategory." + instanceIDConst, function(d) {
          if (!d || !d.categories) return;
          filteredCategories = d.categories.filter(function(s) {
            return data.datasets.indexOf(s) > -1;
          });
          updateTranscript();
        });
      });
    }
    chart.showScrollers = function showScrollers(state) {
      showScrollers = state;
    };
    chart.showLegend = function showLegend(state) {
      showLegend = state;
    };
    return chart;
  }
  function transcriptStyle(style) {
    return {
      fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      height: style.height || 200,
      numXTicks: style.numXTicks || 5,
      symbolWidth: style.symbolWidth || 20,
      transcriptBarHeight: style.transcriptBarHeight || 20,
      legendSymbolHeight: style.legendSymbolHeight || 14,
      width: style.width || 500,
      xTickPadding: style.xTickPadding || 1.25,
      scollbarWidth: style.scrollbarWidth || 15,
      margin: style.margin || {
        left: 5,
        right: 5,
        top: 5,
        bottom: 0
      }
    };
  }
  gd3.transcript = function(params) {
    var params = params || {}, style = transcriptStyle(params.style || {});
    return transcriptChart(style);
  };
  if (typeof define === "function" && define.amd) define(gd3); else if (typeof module === "object" && module.exports) module.exports = gd3;
  this.gd3 = gd3;
}();