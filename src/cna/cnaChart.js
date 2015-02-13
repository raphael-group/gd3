import "cnaData";

function cnaChart(style) {
  function chart(selection) {
    selection.each(function(data) {
      data = cnaData(data);

      // Determine the height
      //var height = (intervalH * data.segments.length) + initIntervalH + rangeLegendOffset - 10;
      var genomeBarHeight = style.genomeBarHeight,
          ampAreaHeight = data.numAmps * style.horizontalBarSpacing,
          delAreaHeight = data.numDels * style.horizontalBarSpacing,
          height = style.margin.top + style.margin.bottom + genomeBarHeight + delAreaHeight + ampAreaHeight,
          width = style.width;

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
              .attr('width', width);

      var svg = svgActual.append('g');

      // Needed for zooming and panning to work
      var bgMasks = svg.selectAll(".cna-bg")
              .data([{y: 0, height: ampAreaHeight},
                     {y: height-delAreaHeight, height: delAreaHeight}
                    ]).enter()
              .append('rect')
              .attr("class", "cna-bg")
              .attr('width', width)
              .attr("height", function(d){ return d.height; })
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
      var genomeBarY = ampAreaHeight + style.margin.top;
      var genomeBar = svg.append("rect")
              .attr("class", "genome")
              .attr("y", genomeBarY)
              .attr("x", 0)
              .attr("width", width)
              .attr("height", style.genomeBarHeight)
              .style("fill", '#ccc');

      var geneGroups = svg.selectAll(".genes")
              .data(data.get('genes')).enter()
              .append("g")
              .attr("class", "genes"),
          genes = geneGroups.append('rect')
              .attr('width', function(d){ return x(d.end) - x(d.start); })
              .attr('height', style.genomeBarHeight + 2*style.geneHeightOverflow)
              .attr('y', genomeBarY - style.geneHeightOverflow)
              .style('fill-opacity', function(d) {return d.selected ? 1 : 0.2;})
              .style('fill', function (d) {return d.selected ? style.geneSelectedColor : style.geneColor;})
              .attr('id', function (d, i) { return "gene-" + i; }),
          geneLabels = geneGroups.append('text')
              .attr('y', genomeBarY + style.genomeBarHeight/2 + 5)
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

      segs = segments.append('rect')
          .attr('fill', function(d){
            if (gd3.color.categoryPalette) return gd3.color.categoryPalette(samplesToTypes[d.sample]);
            return segmentTypeToColor[samplesToTypes[d.sample]]
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

      // Updates the position of horizontal bars in the visualization
      function segY(d){
        if (d.ty == "amp"){
          return ampAreaHeight - style.horizontalBarHeight - style.horizontalBarSpacing * d.index;
        } else if (d.ty == "del") {
          return (height-delAreaHeight) + style.horizontalBarSpacing * d.index;
        } else {
          console.log("Segment of unknown type: " + d.ty);
        }
      }
      function updateSegments() {
        // Move the intervals into place
        segs.attr("transform", function(d, i){
          return "translate(" + x(d.start) + "," + segY(d) + ")"
        })
        .attr("width", function(d, i){ return x(d.end) - x(d.start); })

        // Fade in/out intervals that are from datasets not currently active
        var activeIntervals = segments.filter(function(d){ return data.sampleTypeToInclude[samplesToTypes[d.sample]]; })
          .style("opacity", 1);
        segments.filter(function(d){ return !data.sampleTypeToInclude[samplesToTypes[d.sample]]; })
          .style("opacity", 0);

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
    });//end selection.each()
  }
  return chart;
}