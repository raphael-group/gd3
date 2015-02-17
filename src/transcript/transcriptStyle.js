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
    margin: style.margin || { left: 5, right: 5, top: 5, bottom: 0 }
  };
}