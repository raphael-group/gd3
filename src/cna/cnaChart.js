import "cnaData";

function cnaChart(style) {
  var showScrollers = true,
      showLegendText = true;

  function chart(selection) {
    selection.each(function(data) {
      data = cnaData(data);

      // Determine the height
      //var height = (intervalH * data.segments.length) + initIntervalH + rangeLegendOffset - 10;
      var genomeBarHeight = style.genomeBarHeight,
          ampAreaHeight = data.numAmps * style.horizontalBarSpacing,
          delAreaHeight = data.numDels * style.horizontalBarSpacing,
          width = style.width - style.margin.left - style.margin.right;

      if (showScrollers){
        var height = style.height;
      } else {
        var height = style.margin.top + style.margin.bottom + genomeBarHeight + delAreaHeight + ampAreaHeight;
      }

      // Determine coloration
      var d3color = d3.scale.category20(),
          segmentTypeToColor = {};
      for (var i = 0; i < data.get('sampleTypes').length; i++) {
        segmentTypeToColor[data.get('sampleTypes')[i]] = d3color(i);
      }

      // Select the svg element, if it exists.
      var svgActual = d3.select(this)
          .selectAll('svg')
          .data([data])
            .enter()
            .append('svg')
              .attr('height', height)
              .attr('width', style.width);

      var svg = svgActual.append('g').attr('transform', 'translate('+style.margin.left+','+style.margin.top+')');
      svgActual.append('rect').attr('x', style.margin.left + width)
          .attr('width', style.margin.right)
          .attr('height', height)
          .style('fill', '#fff');

      // Needed for zooming and panning to work
      var bgMasks = svg.append('rect')
              .attr("class", "cna-bg")
              .attr('width', width)
              .attr("height", height)
              .attr("y", function(d){ return d.y; })
              .style('fill', style.backgroundColor);

      // Set up scales
      var start = d3.min(data.segmentDomain),
          stop = d3.max(data.segmentDomain);

      var x = d3.scale.linear()
          .domain([start, stop])
          .range([0, width]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient('bottom')
          .ticks(5)
          .tickSize(0)
          .tickPadding(1.25);

      // Set up the zoom
      var zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 100])
        .on('zoom', function(){ updateAllComponents(); });
      svg.call(zoom).on('dblclick.zoom', null)

      //////////////////////////////////////////////////////////////////////////
      // BEGIN RENDERING CODE

      //////////////////////////////////////////////////////////////////////////
      // Draw the genome
      var genomeBarY = ampAreaHeight + style.margin.top,
          genomeG = svg.append('g').attr('transform', 'translate(0,'+genomeBarY+')'),
          genomeBar = genomeG.append("rect")
              .attr("class", "genome")
              .attr("width", width)
              .attr("height", style.genomeBarHeight)
              .style("fill", '#ccc');

      var geneGroups = genomeG.selectAll(".genes")
              .data(data.get('genes')).enter()
              .append("g")
              .attr("class", "genes"),
          genes = geneGroups.append('rect')
              .attr('width', function(d){ return x(d.end) - x(d.start); })
              .attr('height', style.genomeBarHeight + 2*style.geneHeightOverflow)
              .attr('y', -style.geneHeightOverflow)
              .style('fill-opacity', function(d) {return d.selected ? 1 : 0.2;})
              .style('fill', function (d) {return d.selected ? style.geneSelectedColor : style.geneColor;})
              .attr('id', function (d, i) { return "gene-" + i; }),
          geneLabels = geneGroups.append('text')
              .attr('y', style.genomeBarHeight/2 + 5)
              .attr('text-anchor', 'middle')
              .style('fill-opacity', function (d) {return d.selected ? 1 : 0})
              .style('fill', '#000')
              .style('font-family', style.fontFamily)
              .style('font-size', style.fontSize)
              .text(function(d){  return d.label; });

        geneGroups.on('mouseover', function(d){
          if (!d.fixed){
            d3.select(this).select('rect').style('fill', style.geneHighlightColor);
            d3.select(this).select("text").style("fill-opacity", 1)
          }
        });

        geneGroups.on('mouseout', function(d, i){
          if (!d.fixed){
            // Reset the gene block color
            d3.select(this).select("rect").style("fill", function (d) {
              return d.selected ? style.geneSelectedColor : style.geneColor;
            });

            d3.select(this).select("text").style("fill-opacity", 0);
          }
        });
        geneGroups.on('dblclick', function(d, i){
          d.fixed = d.fixed ? false : true;
          if (d.fixed){
            d3.select(this).select("rect").style("fill", function (d) {
              return d.selected ? style.geneSelectedColor : style.geneHighlightColor;
            });

            d3.select(this).select("text").style("fill-opacity", 1)
          }
        });


      //////////////////////////////////////////////////////////////////////////
      // Draw the segments
      var segmentsG = svg.append('g'),
          segments = segmentsG.selectAll('.segments')
              .data(data.get('segments'))
              .enter().append('g')
              .attr("class", "intervals");

      var minSegmentX = d3.min(data.get('segmentDomain')),
          maxSegmentX = d3.max(data.get('segmentDomain'));

      var segs = segments.append('rect')
          .attr('fill', function(d){
            if (gd3.color.categoryPalette) return gd3.color.categoryPalette(samplesToTypes[d.sample]);
            return segmentTypeToColor[samplesToTypes[d.sample]];
          })
          .attr('width', function(d) {
            return x(d.end, minSegmentX, maxSegmentX) - x(d.start, minSegmentX, maxSegmentX);
          })
          .attr('height', style.horizontalBarHeight)
          .attr('id', function (d, i) { return "interval-" + i; })

      //segments.call(gd3.annotation());

      // Add a vertical bar that spans the target gene
      var verticalBars = svg.selectAll('.vert-bar')
              .data(data.get('genes').filter(function(d){ return d.selected; })).enter()
              .append("rect")
              .attr("y", 0)
              .attr("width", function(d){ return x(d.end) - x(d.start); })
              .attr("height", height)
              .style("fill", style.geneSelectedColor)
              .style("fill-opacity", 0.5);


      // Updates the position of horizontal bars in the visualization
      var segY;
      if(showScrollers) {
        // Updates the position of horizontal bars in the visualization
        var ampOffset = style.height / 2 - style.horizontalBarHeight  - style.geneHeightOverflow,
            delOffset = style.height / 2 + style.genomeBarHeight  + style.geneHeightOverflow;
        segY = function (d){
          if (d.ty == "amp"){
            return  ampOffset - style.horizontalBarSpacing * d.index;
          } else if (d.ty == "del") {
            return delOffset + style.horizontalBarSpacing * d.index;
          } else {
            throw("Segment of unknown type: " + d.ty);
          }
        }

        if(showLegendText) {
          // Add the legend text
          var ampText = svgActual.append('text'),
              delText = svgActual.append('text'),
              textStyle = {
                'font-family': style.fontFamily,
                'font-weight': 'bold',
                opacity: .5
              }

          ampText.attr('transform', 'rotate(90)')
              .attr('text-anchor', 'middle')
              .attr('x', style.height * 1/4)
              .attr('y', -width - 5)
              .style(textStyle)
              .text('Amplifications');

          delText.attr('transform', 'rotate(90)')
              .attr('text-anchor', 'middle')
              .attr('x', style.height*3/4)
              .attr('y', -width - 5)
              .style(textStyle)
              .text('Deletions');
        }

      } else {
        segY = function (d){
          if (d.ty == "amp"){
            return ampAreaHeight - style.horizontalBarHeight - style.horizontalBarSpacing * d.index;
          } else if (d.ty == "del") {
            return (height-delAreaHeight) + style.horizontalBarSpacing * d.index;
          } else {
            console.log("Segment of unknown type: " + d.ty);
          }
        }
      }


      updateGeneBar();
      updateSegments();

      function updateAllComponents() {
        var t = zoom.translate(),
          tx = t[0],
          ty = t[1],
          scale = zoom.scale();

        tx = Math.min(tx, 0);

        zoom.translate([tx, ty]);

        // Find the start/stop points after the zoom
        var curMin = d3.min( x.domain() ),
          curMax = d3.max( x.domain() );

        x.domain([curMin, curMax]);

        updateGeneBar();
        updateSegments();
      }

      // Updates the genome bar showing domains and also the target gene line
      function updateGeneBar() {
        // Move the vertical bar around the target genes
        verticalBars.attr("x", function(d){ return x(d.start); })
           .attr("width", function(d){ return x(d.end) - x(d.start); });

        // Move the genes into place
        genes.attr('transform', function(d, i){
          return 'translate(' + x(d.start) + ',0)';
        });

        // Scale the gene's blocks' width
        genes.attr('width', function(d, i){ return x(d.end) - x(d.start); });

        // Move the geneLabels
        geneLabels.attr('transform', function(d, i){
          var x1 = d3.max( [d.start, d3.max(x.domain())] ),
              x2 = d3.min( [d.end, d3.min(x.domain())] );
          return 'translate(' + x(d.start + (d.end-d.start)/2) + ',0)';
        });
      }

      function updateSegments() {
        // Move the intervals into place
        segs.attr("transform", function(d, i){
          var curY = d3.select(this).attr('transform'),
              y = curY ? +curY.split(',')[1].replace(')','') : segY(d);
          return "translate(" + x(d.start) + "," + y + ")"
        })
        .attr("width", function(d, i){ return x(d.end) - x(d.start); })
        .attr("opacity", function(d, i){
          var y = +d3.select(this).attr('transform').replace('translate(', '').split(',')[1].replace(')', '');
          return y < 0 ? 0 : 1;
        })

        // Fade in/out intervals that are from datasets not currently active
        var activeIntervals = segments.filter(function(d){
          var includedSample = data.sampleTypeToInclude[samplesToTypes[d.sample]];
          return includedSample;
        })
          .style("opacity", 1);
        segments.filter(function(d){
          return !data.sampleTypeToInclude[samplesToTypes[d.sample]];;
        }).style("opacity", 0);

      }

      /////////////////////////////////////////////////////////////////////////
      // Set up dispatch

      // Assign actions for dispatch events
      segs.attr({"stroke-width": 1, "stroke": "black", "stroke-opacity": 0})
        .on("mouseover.dispatch-sample", function(d){
          gd3.dispatch.sample({ sample: d.sample, opacity: 1});
        }).on("mouseout.dispatch-sample", function(d){
          gd3.dispatch.sample({ sample: d.sample, opacity: 0});
        }).on("click.dispatch-mutation", function(d){
          gd3.dispatch.mutation({dataset: d.dataset, gene: data.gene, mutation_class: d.ty });
        });

      // Highlight the segments corresponding to the given sample
      gd3.dispatch.on("sample.cna", function(d){
        var opacity = d.opacity,
            sample = d.sample;
        segs.attr("stroke-opacity", 0)
        segs.filter(function(d){ return d.sample == sample; })
          .attr("stroke-opacity", opacity)
      });

      // Filter the visible segments given a list of categories (datasets/sample types)
      gd3.dispatch.on('filterCategory.cnas', function(d) {
        if(!d || !d.categories) return;

        data.sampleTypes.forEach(function(s){
          data.sampleTypeToInclude[s] = true;
        })
        d.categories.forEach(function(s) {
          data.sampleTypeToInclude[s] = false;
        });
        updateAllComponents();
      });

      // Add dispatch for recolor message, which updates dataset segment colors
      gd3.dispatch.on("recolor.cna", function() {
        segs.each(function(d) {
          var dataset = samplesToTypes[d.sample];
          d3.select(this).transition().duration(1000).style('fill', function () {
            if(!d.sample || !dataset) {
              return 'none';
            } else {
              return d3.rgb(gd3.color.categoryPalette(dataset));
            }
          });
        })
      });

      ////////////////////////////////////////////////////////////////////////////
      // Set up scroll bars
      function renderScrollers () {
        // Adjust canvas for scrollbars
        svgActual.attr('height', style.height + 'px');
        verticalBars.attr('height', style.height - style.margin.bottom - style.margin.top - 3);
        genomeG.attr('transform', 'translate(0,'+ (style.height / 2 ) + ')' );

        // Adjust segment heights
        // Updates the position of horizontal bars in the visualization
        // var ampOffset = style.height / 2 - style.horizontalBarHeight  - style.geneHeightOverflow,
        //     delOffset = style.height / 2 + style.genomeBarHeight  + style.geneHeightOverflow;

        // offsets for scrolling
        var ampYs = [],
            delYs = [];

        // function segY(d){
        //   if (d.ty == "amp"){
        //     return  ampOffset - style.horizontalBarSpacing * d.index;
        //   } else if (d.ty == "del") {
        //     return delOffset + style.horizontalBarSpacing * d.index;
        //   } else {
        //     throw("Segment of unknown type: " + d.ty);
        //   }
        // }
        // Move the intervals into place
        segs.attr("transform", function(d, i){
          var y = segY(d),
              ys = d.ty == 'amp' ? ampYs : delYs;
          ys.push(y);

          return "translate(" + x(d.start) + "," + y + ")"
        })

        // Add a group for sliders
        var sG = svg.append('g');

        var minAmpY = d3.min(ampYs),
            maxDelY = d3.max(delYs);

        var ampSegments = segs.filter(function(d) { return d.ty == 'amp'; }),
            delSegments = segs.filter(function(d) { return d.ty == 'del'; });

        // Only render the scrollers if there are mutations off the page
        var showAmpScroller = minAmpY < 0,
            showDelScroller = maxDelY > height;

        if (!showAmpScroller && !showDelScroller) return;

        // Determine scrolling max offset for both activating and inactivating mutations
        var maxAmpOffset = minAmpY < 0 ? Math.abs(minAmpY)+style.horizontalBarHeight : style.genomeBarHeight,
            maxDelOffset = maxDelY > height ? maxDelY-style.horizontalBarHeight : style.genomeBarHeight;

        // create drag slider gradient
        // Define the gradient
        var gradient = svg.append("svg:defs")
          .append("svg:linearGradient")
          .attr("id", "gd3-cna-scroller-gradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "100%")
          .attr("spreadMethod", "pad");

        // Define the gradient colors
        gradient.append("svg:stop")
          .attr("offset", "0%")
          .attr("stop-color", "#eeeeee")
          .attr("stop-opacity", 1);

        gradient.append("svg:stop")
          .attr("offset", "100%")
          .attr("stop-color", "#666666")
          .attr("stop-opacity", 1);

        // Create drag event handlers for sliders
        var dragSlider = d3.behavior.drag()
                    .on('dragstart', dragStart)
                    .on('drag', dragMove)
                    .on('dragend', dragEnd);

        function dragStart(d) {
          d3.event.sourceEvent.stopPropagation();
          var thisEl = d3.select(this);
          thisEl.style('fill', '#888888');
        }

        function dragMove(d) {
          var thisEl = d3.select(this),
              higher = d.loc == 'top' ? d.max : d.min, // lesser/upper canvas y bound value
              lower = higher == d.max ? d.min : d.max;

          // Set the y-value, stopping it at the upper and lower bounds
          // of the scrollbar
          if(d3.event.y > lower) {
            var y = lower;
          } else if (d3.event.y < higher) {
            var y = higher;
          } else {
            var y = d3.event.y;
          }

          // Scroll only if the dragger is within the bounds of the track
          thisEl.attr('cy', y);

          var scrollSegments = d.loc == 'top' ? ampSegments : delSegments;

          // Decide scroll amount
          var scrollDomain = lower - higher,
              scrollNow = y - higher,
              scrollPercent = d.loc == 'top' ? 1 - scrollNow / scrollDomain : scrollNow / scrollDomain;

          // Get the maximum offset for the pertinent segment group and create a y adjustment
          var offset = d.loc == 'top' ? maxAmpOffset : -1*maxDelOffset,
              adjust = offset * scrollPercent;

          // Move the segments
          scrollSegments.attr('transform', function(d) {
            var t = d3.select(this).attr('transform').replace('translate(','').replace(')','').split(','),
                x = +t[0],
                y = +t[1];

            return 'translate('+x+','+ (segY(d) + adjust) + ')';
          });

          // Hide the segments if they're below range
          scrollSegments.attr('opacity', function(d) {
            var y = +d3.select(this).attr('transform').split(',')[1].replace(')',''),
                hideY = d.ty == 'amp' ? ampOffset : delOffset;
            if(d.ty == 'amp') return y < hideY && y >= 0 ? 1 : 0;
            else return y > hideY  ? 1 : 0;
          });
        }
        function dragEnd(d) {
          var thisEl = d3.select(this);
          thisEl.style('fill', 'url(#gd3-cna-scroller-gradient)')
        }

        // Add a background for the slider area
        sG.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 15)
            .attr('height', style.height)
            .style('fill', '#fff');

        // Add slider tracks
        if (showAmpScroller){
          sG.append('line')
              .attr('x1', 6)
              .attr('y1', 10)
              .attr('x2', 6)
              .attr('y2', style.height/2 - style.genomeBarHeight/2 + 10)
              .style('stroke', '#ccc')
              .style('stroke-width', 1);
        }
        if (showDelScroller){
          sG.append('line')
              .attr('x1', 6)
              .attr('y1', style.height/2 + style.genomeBarHeight/2 + 10)
              .attr('x2', 6)
              .attr('y2', style.height - 10)
              .style('stroke', '#ccc')
              .style('stroke-width', 1);
        }

        // Set up drag circles
        var sliderBounds = [
          { min: style.height/2 - style.genomeBarHeight/2 + 4,
            max: 6,
            loc: 'top',
            show: showAmpScroller
          },
          { min: style.height/2 + style.genomeBarHeight + 4,
            max: style.height - 6,
            loc: 'bottom',
            show: showDelScroller
          }
        ];
        sG.selectAll('circle')
            .data(sliderBounds.filter(function(d){ return d.show; }))
            .enter()
            .append('circle')
            .attr('r', 5)
            .attr('cx', 6)
            .attr('cy', function(d) { return d.min; })
            .style( {
              'box-shadow': '0px 0px 5px 0px rgba(0,0,0,0.75)',
              fill: 'url(#gd3-cna-scroller-gradient)',
              stroke: '#666',
              'stroke-width': 1
            })
            .call(dragSlider);

      } // end renderScrollers()

      if(showScrollers) renderScrollers();

    });//end selection.each()
  }

  chart.showLegendText = function() {
    if(arguments.length == 0) return showLegendText;
    showLegendText = arguments[0];
    return chart;
  }

  chart.showScrollers = function() {
    if(arguments.length == 0) return showScrollers;
    showScrollers = arguments[0];
    return chart;
  }

  return chart;
}
