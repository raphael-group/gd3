gd3.tooltip.element = gd3_tooltipElement;

function gd3_tooltipElement() {

}

gd3_tooltipElement.prototype.summaryElement = false;
gd3_tooltipElement.prototype.showSummary = function(state) {
  state = state || false;
  this.summaryElement = state;
  return this;
}