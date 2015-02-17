function tooltipStyle(style) {
  return {
    background: style.background || 'rgba(0, 0, 0, 0.75)',
    border: style.border || '1px solid rgba(0,0,0,0.8)',
    borderRadius: style.borderRadius || '2px',
    fontColor: style.fontColor || '#ffffff',
    fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize: '11px',
    height: style.height || 200,
    lineHeight: style.lineHeight || 1,
    padding: style.padding || '5px',
    voteActiveColor: style.voteActiveColor || '#ff0000',
    width: style.width || 500,
  };
}