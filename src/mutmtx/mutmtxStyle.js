function mutmtxStyle(style) {
  return {
      animationSpeed : style.animationSpeed || 300,
      annotationContinuousScale : style.annotationContinuousScale || ['#fcc5c0','#49006a'],
      annotationFontSize : style.annotationFontSize || 10,
      annotationRowHeight : style.annotationRowHeight || 10,
      annotationRowSpacing : style.annotationRowSpacing || 5,
      bgColor : style.bgColor || '#F6F6F6',
      blockColorMedium : style.blockColorMedium || '#95A5A6',
      blockColorStrongest : style.blockColorStrongest || '#2C3E50',
      boxMargin : style.boxMargin || 5, // assumes uniform margins on all sides
      colorSampleTypes : style.colorSampleTypes || true,
      coocurringColor : style.coocurringColor || 'orange',
      exclusiveColor : style.exclusiveColor || 'blue',
      fontColor : style.fontColor || '#000',
      fontFamily : '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize : style.fontSize || 14,
      glyphColor : style.glyphColor || '#888',
      glyphStrokeColor : style.glyphStrokeColor || '#ccc',
      height : style.height || 300,
      rowHeight : style.rowHeight || 20,
      labelHeight : style.labelHeight || 40,
      labelWidth : style.labelWidth || 100,
      minBoxWidth : style.minBoxWidth || 20,
      mutationLegendHeight : style.mutationLegendHeight || 30,
      sampleStroke : style.sampleStroke || 1,
      sortingMenuFontSize : style.sortingMenuFontSize || 12,
      width : style.width || 600,
      zBottom: 0,
      zTop: 100
  };
}
