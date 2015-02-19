function graphStyle(style) {
  return {
    edgeColors : style.edgeColors || d3.scale.category10().range(),
    edgeWidth : style.edgeWidth || 3,
    fontFamily : style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize : style.fontSize || 12,
    height : style.height || 200,
    legendFontSize : style.legendFontSize || 11,
    legendScaleWidth : style.legendScaleWidth || 30,
    legendWidth : style.legendWidth || 75,
    margins : style.margins || {bottom: 0, left: 0, right: 0, top: 0},
    nodeColor : style.nodeColor || ['#ccc','#ccc'],
    nodeRadius : style.nodeRadius || 10,
    nodeLabelPadding : style.nodeLabelPadding || 2,
    nodeLabelFontWeight : style.nodeLabelFontWeight || 'bold',
    nodeStrokeColor : style.nodeStrokeColor || '#333',
    nodeStrokeWidth : style.nodeStrokeWidth || 2,
    width : style.width || 300,
  };
}