function tooltipView(style) {
  var clickCount = 0,
      clickEvents = {},
      direction = d3_tip_direction,
      offset    = d3_tip_offset,
      html      = d3_tip_html,
      node      = undefined,
      sticky    = false,
      svg       = null,
      point     = null,
      target    = null;


  function positionTooltip() {
      var args = Array.prototype.slice.call(arguments)

      // Obtain location information
      var poffset = offset.apply(this, args),
          coords,
          dir     = direction.apply(this, args),
          i       = directions.length,
          nodel = d3.select(node),
          scrollTop  = document.documentElement.scrollTop || document.body.scrollTop,
          scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

      while(i--) nodel.classed(directions[i], false);
      coords = direction_callbacks.get(dir).apply(this);
      nodel.classed(dir, true).style({
        top: (coords.top +  poffset[0]) + scrollTop + 'px',
        left: (coords.left + poffset[1]) + scrollLeft + 'px'
      });
    }

  function view(selection) {
    svg = selection; // assumes selection is an SVG
    point = selection.node().createSVGPoint();

    // node = d3.select(document.createElement('div'));
    node = d3.select('body').append('div');
    node.style({
      background: style.background,
      border: style.border,
      'border-radius': style.borderRadius,
      color: style.fontColor,
      'font-family': style.fontFamily,
      'font-size': style.fontSize,
      'line-height': style.lineHeight,
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      opacity: 0,
      'pointer-events': 'none',
      'box-sizing': 'border-box',
      padding: style.padding
    });
    node = node.node();

    // Create a listener for the body to close on keypress (ESC)
    var uniqueID = Date.now();
    d3.select('body').on('keydown.gd3-tooltip-exit-'+uniqueID, function() {
      if (d3.event.keyCode == 27) {
        sticky = false;
        view.hide();
      }
    });

    var tipObjects = selection.selectAll('.gd3-tipobj')
        .on('click', function() {
            sticky = sticky ? false : true;
            if(sticky) {
              // view.render();
              if(d3.event.type != 'click') return;
                d3.select(node).selectAll('*').each(function() {
                  var thisEl = d3.select(this),
                      isSummaryElement = thisEl.attr('data-summaryElement');
                  if(isSummaryElement) thisEl.style('display', 'block');
                });
                positionTooltip();
              }
            else view.hide();
        })
        .on('mouseover', view.render )
        .on('mouseout', view.hide );
  } // end view

  view.render = function() {
    // if the node is sticky (i.e., has been clicked, or otherwise frozen)
    if (sticky) {
      // If the event isn't a click event, don't do anything
      if(d3.event.type != 'click') return;

      d3.select(node).selectAll('*').each(function() {
        var thisEl = d3.select(this),
            isSummaryElement = thisEl.attr('data-summaryElement');
        if(isSummaryElement) thisEl.style('display', 'block');
      });
      positionTooltip();
      return;
    }

    var args = Array.prototype.slice.call(arguments);
    if(args[args.length - 1] instanceof SVGElement) target = args.pop();


    var content = html.apply(this, args),
        nodel   = d3.select(node);

    var xout = '<span class="gd3-tooltip-xout" style="cursor: pointer; float: right; font-size:8px;">X</span><br/>';
    nodel.html(xout);

    content.forEach(function(tipElem) {
      tipElem.render(nodel);
    });
    nodel.style({ opacity: 1, 'pointer-events': 'all' });

    nodel.select('.gd3-tooltip-xout')
      .on('click', function () {
        // Activate tipObejcts.on('click') and tipObjects.on('mouseover')
        sticky = sticky ? false : true;
        view.hide();
      });

    var clickEventObjs = nodel.selectAll('.clickEventObj');
    if (clickEventObjs.empty() == false) {
      clickEventObjs.each(function() {
        var thisEl = d3.select(this),
            clickIndex = thisEl.attr('data-click'),
            clickEvent = clickEvents[clickIndex];
        thisEl.on('click', clickEvent);
      });
    }

    positionTooltip();

    return view;
  }

  view.hide = function() {
    if (sticky) return;
    var nodel = d3.select(node);
    nodel.style({ opacity: 0, 'pointer-events': 'none' });

    d3.select(node).selectAll('*').each(function() {
        var thisEl = d3.select(this),
            isSummaryElement = thisEl.attr('data-summaryElement');
        if(isSummaryElement) thisEl.style('display', 'none');
      });
    return view;
  }

  view.attr = function(n, v) {
    if (arguments.length < 2 && typeof n === 'string') {
      return d3.select(node).attr(n)
    } else {
      var args =  Array.prototype.slice.call(arguments)
      d3.selection.prototype.attr.apply(d3.select(node), args)
    }

    return view;
  }

  view.style = function(n, v) {
    if (arguments.length < 2 && typeof n === 'string') {
      return d3.select(node).style(n)
    } else {
      var args =  Array.prototype.slice.call(arguments)
      d3.selection.prototype.style.apply(d3.select(node), args)
    }

    return view;
  }

  view.direction = function(v) {
    if (!arguments.length) return direction
    direction = v == null ? v : d3.functor(v)

    return view;
  }

  view.offset = function(v) {
    if (!arguments.length) return offset
    offset = v == null ? v : d3.functor(v)

    return view;
  }

  view.html = function(v) {
    if (!arguments.length) return html
    html = v == null ? v : d3.functor(v)

    return view;
  }

  // use the given data to generate an HTML string and proceed as normal
  view.useData = function(data) {
    function depth(d) {
      return Array.isArray(d) ? depth(d[0])+1 : 0;
    }

    var ghostNode = document.createElement('div'),
        nodel = d3.select(ghostNode);

    var dimensionality = depth(data);

    function registerClickEvent(selection) {
      if(selection.on('click')) {
        selection.attr('data-click', clickCount).classed('clickEventObj', true);
        clickEvents[clickCount] = selection.on('click');
        clickCount = clickCount + 1;
      }
    }

    // Alter the rendering behavior based on the dimensionality of data
    if(dimensionality == 0) {
      html = d3.functor([data]);
    } else if (dimensionality == 1) {
      html = d3.functor(data);
    } else {
      html = d3.functor(function(d,i) {return data[i]; });
    }

    return view;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Private functions

  // Create functions for determining which direction the tip should render
  function d3_tip_direction() { return 'n' }
  function d3_tip_offset() { return [0, 0] }
  function d3_tip_html() { return ' ' }

  var direction_callbacks = d3.map({
    n:  direction_n,
    s:  direction_s,
    e:  direction_e,
    w:  direction_w,
    nw: direction_nw,
    ne: direction_ne,
    sw: direction_sw,
    se: direction_se
  }),

  directions = direction_callbacks.keys();

  function direction_n() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.n.y - node.offsetHeight,
      left: bbox.n.x - node.offsetWidth / 2
    }
  }

  function direction_s() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.s.y,
      left: bbox.s.x - node.offsetWidth / 2
    }
  }

  function direction_e() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.e.y - node.offsetHeight / 2,
      left: bbox.e.x
    }
  }

  function direction_w() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.w.y - node.offsetHeight / 2,
      left: bbox.w.x - node.offsetWidth
    }
  }

  function direction_nw() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.nw.y - node.offsetHeight,
      left: bbox.nw.x - node.offsetWidth
    }
  }

  function direction_ne() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.ne.y - node.offsetHeight,
      left: bbox.ne.x
    }
  }

  function direction_sw() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.sw.y,
      left: bbox.sw.x - node.offsetWidth
    }
  }

  function direction_se() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.se.y,
      left: bbox.e.x
    }
  }

  // Private - gets the screen coordinates of a shape
  //
  // Given a shape on the screen, will return an SVGPoint for the directions
  // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
  // sw(southwest).
  //
  //    +-+-+
  //    |   |
  //    +   +
  //    |   |
  //    +-+-+
  //
  // Returns an Object {n, s, e, w, nw, sw, ne, se}
  function getScreenBBox() {
    var targetel   = target || d3.event.target;

    while ('undefined' === typeof targetel.getScreenCTM && 'undefined' === targetel.parentNode) {
        targetel = targetel.parentNode;
    }

    var bbox       = {},
        matrix     = targetel.getScreenCTM(),
        tbbox      = targetel.getBBox(),
        width      = tbbox.width,
        height     = tbbox.height,
        x          = tbbox.x,
        y          = tbbox.y

    point.x = x
    point.y = y
    bbox.nw = point.matrixTransform(matrix)
    point.x += width
    bbox.ne = point.matrixTransform(matrix)
    point.y += height
    bbox.se = point.matrixTransform(matrix)
    point.x -= width
    bbox.sw = point.matrixTransform(matrix)
    point.y -= height / 2
    bbox.w  = point.matrixTransform(matrix)
    point.x += width
    bbox.e = point.matrixTransform(matrix)
    point.x -= width / 2
    point.y -= height / 2
    bbox.n = point.matrixTransform(matrix)
    point.y += height
    bbox.s = point.matrixTransform(matrix)

    return bbox
  }

  // end private functions
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return view;
}