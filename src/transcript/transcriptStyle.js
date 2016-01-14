function transcriptStyle(style) {
  return {
    fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    height: style.height || 250,
    numXTicks: style.numXTicks || 5,
    symbolWidth: style.symbolWidth || 20,
    transcriptBarHeight: style.transcriptBarHeight || 20,
    legendSymbolHeight: style.legendSymbolHeight || 14,
    width: style.width || 500,
    xTickPadding: style.xTickPadding || 1.25,
    scollbarWidth: style.scrollbarWidth || 15,
    legendTextWidth: style.legendTextWidth || 28,
    margin: style.margin || { left: 5, right: 15, top: 5, bottom: 0 },
    seqAnnotationColors: {Phosphorylation: '#ff0000', Acetylation: '#00ff00', Ubiquitination: '#0000ff', Regulatory: 'rgb(44, 160, 44)', Methylation: 'rgb(255, 127, 14)', "Disease-associated": 'rgb(31, 119, 180)'}
  };
}