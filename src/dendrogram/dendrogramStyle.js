function dendrogramStyle(style) {
  return {
        colorSchemes: style.colorSchemes || {"default": d3.scale.category20() },
        edgeWidth: style.edgeWidth || 1.5,
        fontColor: style.fontColor || '#333',
        backgroundColor: "#fff",
        fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
        fontSize: style.fontSize || 12,
        margins: style.margins || {bottom: 0, left: 5, right: 0, top: 0},
        nodeRadius: style.nodeRadius || 10,
        width: style.width || 1200,
        height: style.height || 600,
        strokeWidth: style.strokeWidth || 1,
        strokeColor: style.strokeColor || "#333",
        colorScheme: style.colorScheme || "default",
        animationSpeed: style.animationSpeed || 750,
        margins: { left: 40, right: 0, top: 0, bottom: 0},
        sliderMargins: { left: 40, right: 0, top: 5, bottom: 20},
        sliderHeight: 125
    }
}