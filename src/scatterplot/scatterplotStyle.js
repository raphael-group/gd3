function scatterplotStyle(style) {
  return {
    axisFontSize : style.axisFontSize || style.fontSize || 12,
    categoryColors : d3.scale.category10().range(),
    categoryShapes : ['circle', 'diamond', 'cross', 'triangle-down', 'square', 'triangle-up'],
    fontFamily : style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize : style.fontSize || 12,
    height : style.height || 300,
    legendFontSize : style.legendFontSize || 11,
    legendScaleWidth : style.legendScaleWidth || 30,
    legendWidth : style.legendWidth || 75,
    pointSize : style.pointSize || 7,
    titleFontSize : style.titleFontSize || 14,
    width : style.width || 300,

    // Margins defines the chart rendering space whereas the margins serve as gutters for things
    //  like the x axis ticks and labels and the chart title to be positioned
    margins : style.margins || {bottom: 50, left: 35, right: 15, top: style.titleFontSize || 14},
    legendPadding : { top: 0, right: 0, bottom: 0, left: style.pointSize || 7 }
  };
}