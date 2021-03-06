import "transcriptData";

function transcriptChart(style) {
  var showScrollers = true,
      showLegend = true,
      domainDB,
      updateTranscript;

  function chart(selection) {
    selection.each(function(data) {
      data = transcriptData(data);
      var filteredTypes = [], // store list of mutation types to exclude
          filteredCategories = [], // store list of datasets types to exclude
          instanceIDConst = 'gd3-transcript-'+Date.now();
      domainDB = data.proteinDomainDB;

      // Determine coloration
      var d3color = d3.scale.category20(),
          sampleTypeToColor = {};
      for (var i = 0; i < data.get('datasets').length; i++) {
        sampleTypeToColor[data.get('datasets')[i]] = d3color(i);
      }

      var height = style.height,
          scrollbarWidth = showScrollers ? style.scollbarWidth : 0,
          legendTextWidth = showLegend ? style.legendTextWidth : 0,
          width = style.width - scrollbarWidth - legendTextWidth - style.margin.left - style.margin.right;

      // max number of mutations that can fit along the axis
      var mutationResolution = Math.floor(width / style.symbolWidth);

      var actualSVG = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
                .attr('height', height)
                .attr('width', width + scrollbarWidth + legendTextWidth + style.margin.left + style.margin.right);
      var svg = actualSVG.append('g');

      // x scale for the entire visualization based on transcript length
      var start = 0,
          stop = data.get('length');
      var x = d3.scale.linear()
              .domain([start, stop])
              .range([0, width]);

      var xAxis = d3.svg.axis()
              .scale(x)
              .orient('bottom')
              .ticks(style.numXTicks)
              .tickSize(0)
              .tickPadding(style.xTickPadding);

      // Group for all transcript visualization components other than sliders to live in
      var tG = svg.append('g')
        .attr('transform', 'translate(' + (style.margin.left + scrollbarWidth) + ',0)');

      // Append the axis to the canvas
      var transcriptAxis = tG.append('g')
              .attr('class', 'xaxis gd3TranscriptGenome')
              .attr('transform', 'translate(0,' + ( style.height/2 +  style.transcriptBarHeight+6) +')')
              .style('font-family', style.fontFamily)
              .style('font-size', '12px')
              .style('fill', '#000')
              .call(xAxis);

      var transcriptBar = tG.append('rect')
              .attr('height', style.transcriptBarHeight)
              .attr('width', x(stop) - x(start))
              .attr('x', x(start))
              .attr('y', height/2)
              .style('fill', '#ccc');


      // Define zoom behavior
      var zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 100])
        .on('zoom', function() { updateTranscript() });
      actualSVG.call(zoom);

      // Add mutations to the transcript
      var mutationsG = tG.append('g').attr('class','gd3TranscriptMutations'),
          inactivatingG = mutationsG.append('g'),
          activatingG = mutationsG.append('g');

      var inactivatingData = data.get('mutations').filter(function(d) { return data.isMutationInactivating(d.ty) }),
          activatingData = data.get('mutations').filter(function(d) { return !data.isMutationInactivating(d.ty) });

      var inactivatingMutations = inactivatingG.selectAll('.symbols')
          .data(inactivatingData)
          .enter()
          .append('path')
            .attr('class', 'symbols gd3MutationSymbol')
            .attr('d', d3.svg.symbol()
              .type(function(d, i) {
                return d3.svg.symbolTypes[data.get('mutationTypesToSymbols')[d.ty]];
              })
              .size(style.symbolWidth))
            .style('fill', function(d, i) {
              if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
              return sampleTypeToColor[d.dataset];
            })
            .style('stroke', function(d, i) {
              if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
              return sampleTypeToColor[d.dataset];
            })
            .style('stroke-width', 2);

      var activatingMutations = activatingG.selectAll('.symbols')
          .data(activatingData)
          .enter()
          .append('path')
            .attr('class', 'symbols')
            .attr('d', d3.svg.symbol()
              .type(function(d, i) {
                return d3.svg.symbolTypes[data.get('mutationTypesToSymbols')[d.ty]];
              })
              .size(style.symbolWidth))
            .style('fill', function(d, i) {
              if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
              return sampleTypeToColor[d.dataset];
            })
            .style('stroke', function(d, i) {
              if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
              return sampleTypeToColor[d.dataset];
            })
            .style('stroke-width', 2);

      // Add the domain groups

      var domainGroups = tG.selectAll('.domains')
          .data(data.proteinDomains).enter()
          .append('g')
            .attr('class', 'domains');

      var domains = domainGroups.append('rect')
          .attr('id', function(d, i) { return 'domain-' + i; })
          .attr('width', function(d, i) { return x(d.end) - x(d.start); })
          .attr('height', style.transcriptBarHeight + 10)
          .style('fill', '#aaa')
          .style('fill-opacity', .5);

      var domainLabels = domainGroups.append('text')
          .attr('id', function(d, i) { return 'domain-label-' + i; })
          .attr('text-anchor', 'middle')
          .attr('y', style.transcriptBarHeight)
          .style('fill', '#000')
          .style('fill-opacity', 0)
          .style('font-size', 12)
          .style('font-family', style.fontFamily)
          .text(function(d, i) { return d.name; });

      // Render domain labels onmouseover
      domainGroups.on('mouseover', function(d, i) {
        d3.select(this).selectAll('rect').style('fill', '#f00');
        domainGroups.select('#domain-label-' + i).style('fill-opacity', 1);
      })
      .on('mouseout', function(d, i) {
        d3.select(this).selectAll('rect').style('fill', '#aaa');
        domainGroups.select('#domain-label-' + i).style('fill-opacity', 0);
      });

      // Set up a color scale for the sequence annotations, using any given color mapping
      // and filling in default colors for the other annotation types
      var seqAnnotationColorRange = [],
          defaultColors = d3.scale.category10().range(),
          defaultColorIndex = 0;

      data.seq_annotation_types.forEach(function(anno_ty) {
        if (anno_ty in style.seqAnnotationColors) {
          seqAnnotationColorRange.push(style.seqAnnotationColors[anno_ty])
        } else {
          seqAnnotationColorRange.push(defaultColors[defaultColorIndex]);
          defaultColorIndex += 1;
        }
      })
      var seqAnnotationColor = d3.scale.ordinal().domain(data.seq_annotation_types).range(seqAnnotationColorRange);

      // Add protein sequence information, if it's present
      if (data.sequence) {
        var seq = tG.append('g')
          .attr('class', 'gd3ProteinSequence')
          .attr('transform', 'translate(0,' + (style.height/2 + style.transcriptBarHeight/2 + 6) + ')')
          .selectAll('.seq')
          .data(data.sequence).enter()
          .append('text')
          .attr('text-anchor', 'middle')
          .style('font-family', style.fontFamily)
          .style('fill', function(d, i) {
            var anno = data.locusToAnnotations[i+1];
            return anno ? seqAnnotationColor(anno) : '#000000';
          })
          .text(function(d){ return d; })
      }

      updateTranscript = function() {
        var t = zoom.translate(),
            tx = t[0],
            ty = t[1],
            scale = zoom.scale();

        tx = Math.min(tx, 0);

        zoom.translate([tx, ty]);

         // Current scope of zoom
        var curMin = d3.min(x.domain()),
            curMax = d3.max(x.domain()),
            curRes = Math.round( (curMax - curMin)/mutationResolution );
        curRes = curRes ? curRes : 1;

        // Stack mutations if there exist more than one per location
        var bottomIndex = {},
            topIndex = {},
            pX = {},
            pY = {};

        var endIter = Math.ceil(curMax/curRes) + 5;
            startIter = Math.floor(curMin/curRes) - 5;
        for (var i = startIter; i < endIter; i++) {
          bottomIndex[i] = 0;
          topIndex[i] = 0;
        }

        // render mutation glpyhs and move/color them
        activatingMutations.each(function(d){
          var activeType = filteredTypes.indexOf(d.ty) === -1,
              activeCategories = filteredCategories.indexOf(d.dataset) === -1;
          d.visible = activeCategories && activeType;
        });
        activatingMutations.filter(function(d){ return !d.visible; })
            .style({"stroke-opacity": 0, "fill-opacity": 0});
        activatingMutations.filter(function(d){ return d.visible; })
            .attr('transform', function(d, i) {
                var indexDict = data.isMutationInactivating(d.ty) ? bottomIndex : topIndex,
                    curIndex = Math.round(d.locus/curRes),
                    px = x(curIndex*curRes),
                    py;

                // catch mutations that fall out of scope
                if (indexDict[curIndex] == undefined) indexDict[curIndex] = 0;


                if ( data.isMutationInactivating(d.ty) ) {
                  py = height/2 + (style.transcriptBarHeight + indexDict[curIndex] * (style.symbolWidth/2) + 21);
                } else {
                  py = height/2 - (indexDict[curIndex] * (style.symbolWidth/2) + 11);
                }

                indexDict[curIndex]++;

                // Store the x and y values
                pX[i] = px;
                pY[i] = py;

                return 'translate(' + px + ', ' + py + ')';
            })// end symbols.attr('transform')
            .style('fill', function(d) {
              if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
              return sampleTypeToColor[d.dataset];
            })
            .style('fill-opacity', 1)
            .style('stroke', function(d) {
              if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
              return sampleTypeToColor[d.dataset];
            })
            .style('stroke-opacity', 1);
            // .call(gd3.annotation());

        inactivatingMutations.each(function(d){
          if (filteredTypes.indexOf(d.ty) === -1) d.visible = true;
          else d.visible = false;
        });
        inactivatingMutations.filter(function(d){ return !d.visible; })
          .style({"stroke-opacity": 0, "fill-opacity": 0});
        inactivatingMutations.filter(function(d){ return d.visible; })
          .attr('transform', function(d, i) {
                var indexDict = data.isMutationInactivating(d.ty) ? bottomIndex : topIndex,
                    curIndex = Math.round(d.locus/curRes),
                    px = x(curIndex*curRes),
                    py;

                // catch mutations that fall out of scope
                if (indexDict[curIndex] == undefined) indexDict[curIndex] = 0;


                if ( data.isMutationInactivating(d.ty) ) {
                  py = height/2 + (style.transcriptBarHeight + indexDict[curIndex] * (style.symbolWidth/2) + 21);
                } else {
                  py = height/2 - (indexDict[curIndex] * (style.symbolWidth/2) + 11);
                }

                indexDict[curIndex]++;

                // Store the x and y values
                pX[i] = px;
                pY[i] = py;

                return 'translate(' + px + ', ' + py + ')';
            })// end symbols.attr('transform')
            .style('fill', function(d) {
              if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
              return sampleTypeToColor[d.dataset];
            })
            .style('fill-opacity', 1)
            .style('stroke', function(d) {if (gd3.color.categoryPalette) return gd3.color.categoryPalette(d.dataset);
              return sampleTypeToColor[d.dataset];
            })
            .style('stroke-opacity', 1);
            // .call(gd3.annotation());

        // update the axis
        transcriptAxis.call(xAxis);

        // update the transcript
        transcriptBar.attr('x', x(start)).attr('width', x(stop) - x(start));

        // Update protein domains, fading those that are no longer in the selected database
        domainGroups.attr('transform', function(d, i) {
          return 'translate(' + x(d.start) + ',' + (height/2 - 5) + ')';
        });

        domains.attr('width', function(d, i) { return x(d.end) - x(d.start); })
              .style('opacity', function(d){ return d.db == domainDB ? 1 : 0; });

        domainLabels.attr('x', function(d, i) {
          // TO-DO: WHY??????????? Shouldn't this.parentNode always be defined?
          if (this.parentNode){
            var w = d3.select(this.parentNode).select('rect').attr('width');
            return w/2;
          } else { return d3.select(this).attr('x'); }
        });

        // Update protein sequence position and visibility
        if (data.sequence) {
          // Add one to the index since the indices start at zero
          seq.attr('x', function(d, i){ return x(i+1); })
             .style('opacity', curRes < 3 ? 1 : 0 );
        }

      } // end updateTranscript()

      updateTranscript();
      if (showScrollers) {
        renderScrollers();
      } // end slider behavior code



      function renderScrollers () {
        // Add a group for sliders
        var sG = svg.append('g');

        // calculate offsets for scrolling
        var activatingYs = [],
            inactivatingYs = [];
        function getYs (transforms) {
          return function() {
            var transform = d3.select(this).attr('transform');
            if (transform) {
              var y = parseFloat(transform.split(',')[1].split(')')[0]);
              transforms.push(y);
            }
          };
        }
        activatingMutations.each(getYs(activatingYs));
        inactivatingMutations.each(getYs(inactivatingYs));
        var minActivatingY = d3.min(activatingYs),
            maxInactivatingY = d3.max(inactivatingYs);

        // Only render the scrollers if there are mutations off the page
        var showActivatingScroller = minActivatingY < 0,
            showInactivatingScroller = maxInactivatingY > height;
        if (!showActivatingScroller && !showInactivatingScroller) return;

        // Determine scrolling max offset for both activating and inactivating mutations
        var maxActivatingOffset = minActivatingY < 0 ? Math.abs(minActivatingY)+style.symbolWidth : style.transcriptBarHeight,
            maxInactivatingOffset = maxInactivatingY > height ? maxInactivatingY-style.symbolWidth : style.transcriptBarHeight;

        // create drag slider gradient
        // Define the gradient
        var gradient = svg.append("svg:defs")
          .append("svg:linearGradient")
          .attr("id", "gradient")
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
          var activeG = d.loc == 'top' ? activatingG : inactivatingG,
              activeM = d.loc == 'top' ? activatingMutations : inactivatingMutations;

          // Decide scroll amount
          var scrollDomain = lower - higher,
              scrollNow = y - higher,
              scrollPercent = d.loc == 'top' ? 1 - scrollNow / scrollDomain : scrollNow / scrollDomain;

          // Calculate scroll adjustment if top or bottom
          var offset = d.loc == 'top' ? maxActivatingOffset : -1*maxInactivatingOffset,
              adjust = offset * scrollPercent;

          // Move the mutations, and hide the ones that are moving into
          // out of the (in)activating viewport into the other viewport
          activeG.attr('transform', 'translate(0,'+adjust+')');
          activeM.each(function() {
            var thisEl = d3.select(this),
                transform = thisEl.attr('transform');
            if (transform) {
              var y = parseFloat(transform.split(',')[1].split(')')[0]);
              if(d.loc =='top') {
                thisEl.style('opacity', y+adjust > lower ? 0 : 1);
              } else {
                thisEl.style('opacity', y+adjust < higher ? 0 : 1);
              }
            }

          });
        }
        function dragEnd(d) {
          var thisEl = d3.select(this);
          thisEl.style('fill', 'url(#gradient)')
        }

        // Add a background for the slider area
        sG.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 15)
            .attr('height', style.height)
            .style('fill', '#fff');

        // Add slider tracks
        if (showActivatingScroller){
          sG.append('line')
              .attr('x1', 6)
              .attr('y1', 10)
              .attr('x2', 6)
              .attr('y2', style.height/2 - style.transcriptBarHeight/2 + 10)
              .style('stroke', '#ccc')
              .style('stroke-width', 1);
        }
        if (showInactivatingScroller){
          sG.append('line')
              .attr('x1', 6)
              .attr('y1', style.height/2 + style.transcriptBarHeight/2 + 10)
              .attr('x2', 6)
              .attr('y2', style.height - 10)
              .style('stroke', '#ccc')
              .style('stroke-width', 1);
        }

        // Set up drag circles
        var sliderBounds = [
          { min: style.height/2 - style.transcriptBarHeight/2 + 4,
            max: 6,
            loc: 'top',
            show: showActivatingScroller
          },
          { min: style.height/2 + style.transcriptBarHeight + 4,
            max: style.height - 6,
            loc: 'bottom',
            show: showInactivatingScroller
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
              fill: 'url(#gradient)',
              stroke: '#666',
              'stroke-width': 1
            })
            .call(dragSlider);

      } // end renderScrollers()

      /////////////////////////////////////////////////////////////////////////
      // Render the legend
      var effectiveHeight = style.height;
      if (showLegend){
        // Add the missense/inactivating legend text
        var effectiveWidth = width + scrollbarWidth + style.margin.left + style.symbolWidth + 5,
            axisLegend = actualSVG.append('g');

        var topLegend = axisLegend.append('g')
                .attr('transform', 'translate(' + effectiveWidth + ',0)')
            bottomLegend = axisLegend.append('g')
                .attr('transform', 'translate(' + effectiveWidth + ','
                      + (height/2 + style.transcriptBarHeight + 20) + ')');

        var textStyle = {
           "font-family": style.fontFamily,
           "font-weight": "bold",
           opacity: .5
         };

        topLegend.selectAll('text')
            .data(['Protein Seq', 'Changes'])
            .enter()
            .append('text')
                .attr('transform', 'rotate(90)')
                .attr('text-anchor', 'middle')
                .attr('x', style.height/4)
                .attr('y', function(d,i) { return i*15; })
                .style(textStyle)
                .text(function(d) { return d; });

        bottomLegend.selectAll('text')
            .data(['Inactivating', 'Mutations'])
            .enter()
            .append('text')
                .attr('transform', 'rotate(90)')
                .attr('text-anchor', 'middle')
                .attr('x', style.height/4)
                .attr('y', function(d,i) { return i*15; })
                .style(textStyle)
                .text(function(d) { return d; });

        // Set the effective height so that both the top and bottom
        // axis legend labels are entirely visible.
        effectiveHeight = 3*style.height/4 + bottomLegend.node().getBBox().height;

        renderLegend();
      }

      function renderLegend() {
        var mutationTypes = data.types,
            numTypes = mutationTypes.length,
            numRows = Math.ceil(numTypes/2);

        // Select the svg element, if it exists.
        var legendWrapper = selection.append('div');
        var svg = legendWrapper.selectAll('.gd3-transcript-legend-svg')
            .data([data])
            .enter()
              .append('svg')
              .attr('class', 'gd3-transcript-legend-svg')
              .attr('font-size', 10)
              .attr('width', width),
            legendGroup = svg.append('g');

        var legend = legendGroup.selectAll('.symbolGroup')
            .data(mutationTypes)
            .enter()
            .append('g')
            .attr('transform', function(d, i) {
              var x = (i % numRows) * width / numRows + style.margin.left + style.margin.right,
                  y = Math.round(i/numTypes) * style.legendSymbolHeight + (Math.round(i/numTypes)+2) + style.margin.top;
              return 'translate(' + x + ', ' + y + ')';
            })
            .style("cursor", "pointer")
            .on("click.dispatch-mutation-type", function(d){
              // Hide/show the symbol in the legend depending on whether it's active
              var index = filteredTypes.indexOf(d),
                  visible = index === -1;

              if (visible){
                filteredTypes.push(d);
              } else {
                filteredTypes.splice(index, 1);
              }

              d3.select(this).selectAll("*")
                .style("fill-opacity", visible ? 0.5 : 1)
                .style("stroke-opacity", visible ? 0.5 : 1);

              // Send out the dispatch
              gd3.dispatch.filterMutationType({types: filteredTypes});
            });

        legend.append('path')
          .attr('class', 'symbol')
          .attr('d', d3.svg.symbol()
              .type(function(d, i) {
                return d3.svg.symbolTypes[data.mutationTypesToSymbols[d]];
              })
              .size(2 * style.legendSymbolHeight)
          )
          .style('stroke', '#95A5A6')
          .style('stroke-width', 2)
          .style('fill', '#95A5A6');

        legend.append('text')
          .attr('dx', 7)
          .attr('dy', 3)
          .style('font-family', style.fontFamily)
          .text(function(d) { return d.replace(/_/g, ' ')});

        if (data.sequence && data.seq_annotation_types.length > 0){
          var seqAnnotationLegend = legendWrapper.append('div')
            .attr('class', 'gd3TranscriptSeqAnnotationLegend')
            .style('font-size', '10px');
          seqAnnotationLegend.append('ul')
            .style({"padding-left":"0", "margin-left":"-5px", "list-style":"none"})
            .selectAll('.li')
            .data(data.seq_annotation_types).enter()
            .append('li')
            .style({"display":"inline-block", "padding-left":"5px", "padding-right":"5px"})
            .style('color', function(d){ return seqAnnotationColor(d); })
            .text(function(d){ return d; });
        }

        svg.attr('height', legendGroup.node().getBBox().height);
      }

      // Set the height to the true height
      if (showLegend){
        actualSVG.attr('height', effectiveHeight);
      }

      /////////////////////////////////////////////////////////////////////////
      // Dispatch

      // Add dispatch to increase the size of mutations with
      // from the same sample on mouseover
      var allMutations = mutationsG.selectAll("path")
        .on("mouseover.dispatch-sample", function(d){
          gd3.dispatch.sample({ sample: d.sample, over: true});
        }).on("mouseout.dispatch-sample", function(d){
          gd3.dispatch.sample({ sample: d.sample, over: false});
        }).on("click.dispatch-mutation", function(d){
          var domain = null;
          gd3.dispatch.mutation({
            dataset: d.dataset,
            gene: data.geneName,
            mutation_class: "snv",
            mutation_type: d.ty,
            change: d.aao + d.locus + d.aan,
            domain: data.domain(d.locus)
          })
        });

      var transcriptHighlightGroup = actualSVG.insert("g", "g"),
          transcriptHighlights = transcriptHighlightGroup.selectAll(".transcript-highlight"),
          highlightRadius = Math.ceil(Math.sqrt(style.symbolWidth) * 1.75);
      gd3.dispatch.on("sample.transcript", function(d){
        var over = d.over, // flag if mouseover or mouseout
            sample = d.sample,
            // Identify the given sample's mutations
            affectedMutations = allMutations.filter(function(d){
              return d.sample == sample;
            });

        // Only if there is a mutation in this sample do we update
        // the plot
        transcriptHighlights.remove();
        if (over){
          var highlightData = [];
          affectedMutations.each(function(d){
            var el = d3.select(this),
                x = +el.attr("transform").split("translate(")[1].split(",")[0],
                y = +el.attr("transform").split("translate(")[1].split(",")[1].split(")")[0];
            highlightData.push({x: x, y: y})
          });
          transcriptHighlights = transcriptHighlightGroup.selectAll(".transcript-highlight")
            .data(highlightData).enter()
            .append("circle")
            .attr("class", "transcript-highlight")
            .attr("r", highlightRadius)
            .attr("stroke", "#000")
            .attr("stroke-width", 2)
            .attr("fill-opacity", 0)
            .attr("cx", function(d){ return d.x + style.margin.left + scrollbarWidth; })
            .attr("cy", function(d){ return d.y; })
        }
      });

      gd3.dispatch.on('filterMutationType.' + instanceIDConst, function(d) {
        if(!d || !d.types) return;

        filteredTypes = d.types.filter(function(s) {
          return data.types.indexOf(s) > -1;
        });

        updateTranscript();
      });

      gd3.dispatch.on('filterCategory.' + instanceIDConst, function(d) {
        if(!d || !d.categories) return;
        filteredCategories = d.categories.filter(function(s) {
          return data.datasets.indexOf(s) > -1;
        });

        updateTranscript();
      });
    }); // End selection
  }

  chart.showScrollers = function showScrollers(state) {
    showScrollers = state;
  }

  chart.showLegend = function showLegend(state) {
    showLegend = state;
  }

  chart.setDomainDB = function setDomainDB(state){
    domainDB = state;
    updateTranscript();
  }

  return chart;
}
