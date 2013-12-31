function lolliplots(params) {
  var params = params || {},
      style  = params.style || {},
      colorSchemes = style.colorSchemes || {};

  var height = style.height || 200,
      margin = style.margin || 5,
      width = style.width || 500;

  function chart(selection) {
    selection.each(function(data) {
      var gene = data.gene,
          length = data.length,
          mutations = data.mutations,
          proteinDomains = data.domains;

      // Select the svg element, if it exists.
      var fig = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg');

      fig.attr('class', 'lollibox')
          .attr('id', gene + '-transcript')
          .attr('width', width)
          .attr('height', height + 2*margin);
    });
  } // end chart()

  return chart;
}