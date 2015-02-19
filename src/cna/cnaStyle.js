function cnaStyle(style) {
  return {
    fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize: style.fontSize || '12px',
    geneColor: style.geneColor || '#aaa',
    backgroundColor: style.backgroundColor || '#f6f6f6',
    geneHeightOverflow: style.geneHeightOverflow || 5,
    geneHighlightColor: style.geneHighlightColor || '#f00',
    geneSelectedColor: style.geneSelectedColor || '#f00',
    genomeBarHeight: style.genomeBarHeight || 14,
    horizontalBarHeight: style.horizontalBarHeight || 5,
    horizontalBarSpacing: style.horizontalBarSpacing || 6,
    width: style.width || 500,
    margin: style.margin || {top: 10, bottom: 10}
  };
}