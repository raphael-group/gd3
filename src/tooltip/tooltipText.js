import "tooltipElement";

gd3.tooltip.text = gd3_tooltipText;

function gd3_tooltipText(text) {
  if (!this instanceof gd3_tooltipText) return new gd3_tooltipText(text);

  this.text = text;
  this.type = "text";
  return this;
}

var gd3_tooltipTextPrototype = gd3_tooltipText.prototype = new gd3_tooltipElement;

gd3_tooltipTextPrototype.toString = function() {
  return this.text;
};

gd3_tooltipTextPrototype.render = function(selection) {
  var text = selection.append('span').text(this.text);
  text.attr('data-summaryElement', this.summaryElement);
  if(this.summaryElement) text.style('display', 'none');
  else text.style('display', 'block');
  return text;
}