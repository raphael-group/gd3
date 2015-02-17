import "tooltipElement";

gd3.tooltip.image = gd3_tooltipImage;

function gd3_tooltipImage(src, title) {
  if (!this instanceof gd3_tooltipImage) return new gd3_tooltipImage(src, title);

  this.src = src;
  this.title = title;
  this.type = "link";
  return this;
}

var gd3_tooltipImagePrototype = gd3_tooltipImage.prototype = new gd3_tooltipElement;

gd3_tooltipImagePrototype.toString = function() {
  return this.title.toString();
};

gd3_tooltipImagePrototype.render = function(selection) {
  var thisTooltip = this;
      img = selection.append('img')
        .attr('src', this.src);
  if(this.title) img.attr('alt', this.title);

  img.attr('data-summaryElement', this.summaryElement);
  if(this.summaryElement) img.style('display', 'none');
  return img;
}