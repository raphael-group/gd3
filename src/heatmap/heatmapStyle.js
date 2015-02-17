function heatmapStyle(style) {
  return {
    annotationCellHeight : style.annotationCellHeight || 10,
    annotationCategorySpacing : style.annotationCategorySpacing || 5,
    annotationContinuousColorScale : style.annotationContinuousColorScale || ['#004529', '#f7fcb9'],
    annotationLabelFontSize : style.annotationLabelFontSize || style.fontSize || 12,
    cellHeight : style.cellHeight || 18,
    cellWidth : style.cellWidth || 14,
    colorScale : style.colorScale || ['rgb(222,235,247)','rgb(198,219,239)','rgb(158,202,225)','rgb(107,174,214)','rgb(66,146,198)','rgb(33,113,181)','rgb(8,81,156)','rgb(8,48,107)'],
    colorScaleHeight : style.colorScaleHeight || 14,
    colorScaleWidth : style.colorScaleWidth || 200,
    fontFamily : style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize : style.fontSize || 14,
    labelMargins : style.labelMargins || {bottom: 5, right: 2},
    margins : style.margins || {bottom: 0, left: 0, right: 0, top: 0},
    noCellValueColor : style.noCellValueColor || '#a7a7a7',
    width : style.width || 400,
  };
}