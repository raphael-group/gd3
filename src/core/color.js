gd3.color = {};

gd3.color.noData = '#eeeeee';

gd3.color.categoryPalette;
gd3.color.annotationPalettes = {};
gd3.color.annotationToType = {};

gd3.color.palettes = {};

// colorbrewer paired qualitative paired scale with modified 2 and 1 element versions
// Color blind safe!
gd3.color.palettes.categorical_cbSafe = {
  1: ["#1f78b4"],
  2: ["#1f78b4","#b2df8a"],
  3: ["#a6cee3","#1f78b4","#b2df8a"],
  4: ["#a6cee3","#1f78b4","#b2df8a","#33a02c"]
};

// colorbrewer paired qualitative paired scale, but above range of colorblind friendly
// Even though the two use the same scale, they are separated for clarity
gd3.color.palettes.categorical = {
  5: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99"],
  6: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c"],
  7: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f"],
  8: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00"],
  9: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6"],
  10: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a"],
  11: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99"],
  12: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"]
};

gd3.color.palettes.annotation_discrete = [
  ["#ad494a", "#a55194", "#8ca252", "#8c6d31",  "#843c39", "#393b79", "#7b4173", "#637939", "#e7ba52", "#bd9e39", "#cedb9c", "#ce6dbd", "#d6616b", "#9c9ede", "#b5cf6b", "#5254a3", "#e7969c", "#6b6ecf", "#e7cb94", "#de9ed6"],
  ["#fd8d3c", "#31a354", "#9e9ac8", "#969696", "#756bb1", "#3182bd", "#636363", "#e6550d", "#a1d99b", "#74c476", "#fdd0a2", "#bdbdbd", "#bcbddc", "#c6dbef", "#fdae6b", "#6baed6", "#dadaeb", "#9ecae1", "#c7e9c0", "#d9d9d9"]
];

// These default to the colorbrewer sequential, single-hue palettes
// The blue scale has been discluded because of its use for the heatmap chart
// Additionally, the ordering of scales is made to be as colorblind-friendly as possible
gd3.color.palettes.annotation_continuous = [
  ['rgb(247,252,245)','rgb(0,68,27)'],
  ['rgb(252,251,253)','rgb(63,0,125)'],
  ['rgb(240,240,240)','rgb(0,0,0)'],
  ['rgb(255,245,235)','rgb(127,39,4)'],
  ['rgb(255,245,240)','rgb(103,0,13)']
];

// The behavior for annotations is as follows:
// annotations() : return the annotation palette object
// annotations(key) : return the annotation palette object key's value
// annotation(key, data) : set the annotation key's palette to have a domain of data
//   --> The scale will default to discrete, unless data.length == 2 && typeof(each datum) == Number
// annotation(key, data, type) : as before, except hardcode scale as "discrete" or "continuous"
// annotation(key, data, type, colors) : as before, except hardcode in palette colors
gd3.color.annotations = function() {
  if(arguments.length == 0) return gd3.color.annotationPalettes;
  if(arguments.length == 1) return gd3.color.annotationPalettes[arguments[0]];
  // Else, expect two arguments where the first is the name and the second is the type
  if(Object.prototype.toString.call(arguments[1]) !== '[object Array]' ) {
    throw 'annotations() must be passed: (1) the annotation name, (2) an array of annotation values'
        + ' OR the range of values, (3) [optionally] a string declaring if the data is "discrete"'
        + ' or "continuous"';
  }
  if(arguments.length > 2 && arguments[2] != "discrete" && arguments[2] != "continuous") {
    throw 'annotations() third argument must either be "discrete" or "continuous"';
  }

  var scale;

  var annotation = arguments[0],
      data = arguments[1];

  // Assign scale type
  var type;
  if(arguments.length > 2) type = arguments[2];
  else if(data.length == 2 && typeof(data[0]) === 'number' && typeof(data[1]) === 'number') type = 'continuous';
  else type = 'discrete';

  gd3.color.annotationToType[annotation] = type;

  // Define the type of scale and the domain
  if(type == 'continuous') {
    scale = d3.scale.linear().domain([d3.min(data),d3.max(data)]);
  } else {
    scale = d3.scale.ordinal().domain(data);
  }

  // Define the color scale range of the annotation
  var colors;
  if(arguments.length > 3) {
    if(Object.prototype.toString.call(arguments[3]) !== '[object Array]' ) {
      throw 'annotations()\'s third argument must be an array of colors you wish to use in your annotation scale';
    }
    colors = arguments[3];
  } else {
    var numOfType = Object.keys(gd3.color.annotationPalettes).filter(function(d) {
          return gd3.color.annotationToType[d] == type;
        }).length, // # of previously defined of this type of scale
        palettes = gd3.color.palettes;

        var paletteIndex;
        if(type == 'discrete') {
          paletteIndex = (numOfType + 1) % palettes.annotation_discrete.length;
        } else {
          paletteIndex = (numOfType + 1) % palettes.annotation_continuous.length;
        }

        var palette = (type == 'discrete' ? palettes.annotation_discrete : palettes.annotation_continuous)[paletteIndex];

    colors = palette;
  }
  scale.range(colors);

  // Define the annotation scale in the annotationPalettes object
  gd3.color.annotationPalettes[annotation] = scale;
}

// Create a palette for category data (e.g., cancer type) given the categories
//  or given categories and colors
// If no arguments are given, the function returns the current palette
gd3.color.categories = function() {
  function isArrayTest() {
    for(var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if( Object.prototype.toString.call(a) !== '[object Array]' ) {
        throw 'categories() must be passed: (1) an array of categories, (2) an array of categories'
            + ' and an array of colors';
      }
      if(a.length == 0) throw 'categories() must be passed non-empty arrays for arguments';
    }
  }

  if(arguments.length == 0) return gd3.color.categoryPalette;
  else if(arguments.length == 1) {
    var categories = arguments[0];
    isArrayTest(categories);

    var colors;
    if(categories.length < 5) {
      colors = gd3.color.palettes.categorical_cbSafe[categories.length];
    } else if (categories.length < 13) {
      colors = gd3.color.palettes.categorical[categories.length];
    } else {
      colors = d3.scale.category20().range();
    }

    gd3.color.categoryPalette = d3.scale.ordinal().domain(categories).range(colors);
  } else if(arguments.length > 1) {
    var categories = arguments[0],
        colors = arguments[1];

    isArrayTest(categories, colors);
    gd3.color.categoryPalette = d3.scale.ordinal().domain(categories).range(colors);
  }

  return gd3.color.categoryPalette;
}