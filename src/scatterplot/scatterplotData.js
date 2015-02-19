function scatterplotData(inputData) {
  var data = {
    categories: [],
    pts: [],
    title: '',
    xLabel: '',
    xScale: { max: Number.NEGATIVE_INFINITY, min: Number.POSITIVE_INFINITY },
    yLabel: '',
    yScale: { max: Number.NEGATIVE_INFINITY, min: Number.POSITIVE_INFINITY }
  }

  // categories = Array of Strings
  // pts = Array of Objects s.t. each Object is {x: Number, y: Number},
  //          optionally {x: Number, y: Number, category: String}
  // title = String
  function parseJSON() {
    data.categories = d3.set(inputData.categories ? inputData.categories : []);
    data.pts = inputData.pts.map(function(d) {
      d.x = +(d.x); // safety sanitation
      d.y = +(d.y);

      if(d.category) data.categories.add(d.category);

      // include range tests to save a loop
      if (!inputData.xScale) {
        data.xScale.max = d3.max([d.x, data.xScale.max]);
        data.xScale.min = d3.min([d.x, data.xScale.min]);
      }
      if (!inputData.yScale) {
        data.yScale.max = d3.max([d.y, data.yScale.max]);
        data.yScale.min = d3.min([d.y, data.yScale.min]);
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