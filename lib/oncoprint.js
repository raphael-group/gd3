function oncoprint(params) {
  var params = params || {},
      style  = params.style || {},
      colorSchemes = style.colorSchemes || {};

  var bgColor = style.bgColor || '#F6F6F6',
      blockColorMedium = style.blockColorMedium || '#95A5A6',
      blockColorStrongest = style.blockColorStrongest || '#2C3E50',
      boxMargin = style.boxMargin || 5, // assumes uniform margins on all sides
      colorSampleTypes = style.colorSampleTypes,
      coocurringColor = style.coocurringColor || 'orange',
      exclusiveColor = style.exclusiveColor || 'blue',
      fullWidth = style.width || 500,
      fullHeight = style.height || 300,
      geneHeight = style.geneHeight || 20,
      labelHeight = style.labelHeight || 40,
      labelWidth = style.labelWidth || 100,
      minBoxWidth = style.minBoxWidth || 20,
      mutationLegendHeight = style.mutationLegendHeight || 30,
      sampleStroke = style.sampleStroke || 1;

  var styleLookup = {
    'bgColor': bgColor,
    'blockColorMedium': blockColorMedium,
    'blockColorStrongest': blockColorStrongest,
    'boxMargin': boxMargin,
    'colorSampleTypes': colorSampleTypes,
    'coocurringColor': coocurringColor,
    'exclusiveColor': exclusiveColor,
    'fullWidth': fullWidth,
    'fullHeight': fullHeight,
    'geneHeight': geneHeight,
    'labelHeight': labelHeight,
    'labelWidth': labelWidth,
    'minBoxWidth': minBoxWidth,
    'sampleStroke': sampleStroke
  };

  var sampleTypeToColor = colorSchemes.sampleType || {};

  // These variables determine what extras to show in the chart
  var showCoverage = false,
      showLegend = false,
      showSortingMenu = false;

  function chart(selection) {
    selection.each(function(data) {
      //////////////////////////////////////////////////////////////////////////
      // General setup
      var coverage_str = data.coverage_str || '',
          M = data.M || {},
          sampleToTypes = data.sample2ty || {}, // TODO: rename sampleToTypes
          sampleTypes = data.sampleTypes || [];

      var genes = Object.keys(M),
          samples = Object.keys(sampleToTypes).slice(),
          m = samples.length,
          n = genes.length;

      var multiCancer = sampleTypes.length > 1 && colorSampleTypes,
          cancerLegendWidth = multiCancer ? 100 : 0,
          cancerTypeLegendHeight = multiCancer ? (sampleTypes.length+1)*15 : 0,
          width = fullWidth - cancerLegendWidth,
          height = genes.length * geneHeight + boxMargin,
          tickWidth,
          samplesPerCol;

      // Collect all unique types for all samples
      for(var i = 0; i < samples.length; i++) {
        if(sampleTypes.indexOf(sampleToTypes[samples[i]]) == -1) {
          sampleTypes.push(sampleToTypes[samples[i]]);
        }
      }
      sampleTypes.sort();

      // Assign colors for each type if no type coloration information exists
      if(Object.keys(sampleTypeToColor).length == 0) {
        var colors = d3.scale.category20();
        for (var i = 0; i < sampleTypes.length; i++) {
          sampleTypeToColor[sampleTypes[i]] = colors(i);
        }
      }

      // Map each gene to the samples they're mutated in
      var geneToSamples = {};
      for (i = 0; i < genes.length; i++) {
        geneToSamples[genes[i]] = Object.keys(M[genes[i]]);
      }


      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      // Parse and sort mutation data

      // Sort genes by mutation frequency and make a map of genes to their order
      var geneToIndex = {};
      genes.sort(function(g1, g2) {
        return d3.descending(geneToSamples[g1].length,
            geneToSamples[g2].length);
      });

      for (i = 0; i < genes.length; i++) {
        geneToIndex[genes[i]] = i;
      }


      // Find the index of the gene with the highest mutation frequency in each
      //    sample
      var sampleToGeneIndex = {};
      for(i = 0; i< samples.length; i++) {
        var s = samples[i],
            geneIndices = genes.map(function(g) {
              return geneToSamples[g].indexOf(s) != -1 ? geneToIndex[g] : -1;
            });
        sampleToGeneIndex[s] = d3.min(geneIndices.filter(function(i) {
          return i != -1;
        }));
      }

      // Sorting order for mutation types
      var mutTypeOrder = { inactive_snv: 0, snv: 1, amp: 2, del: 3 };

      // Constants that correspond to the different sorting functions
      var SAMPLE_TYPE = 0,
          SAMPLE_NAME = 1,
          MUTATION_TYPE = 2,
          EXCLUSIVITY = 3,
          GENE_FREQ = 4,
          sortFnName = {
            // Short descriptions of the different sorting functions
            EXCLUSIVITY : 'Exclusivity',
            GENE_FREQ : 'Gene frequency',
            MUTATION_TYPE : 'Mutation type',
            SAMPLE_NAME : 'Sample name',
            SAMPLE_TYPE : 'Sample type'
          };


      // Create a dictionary of samples to whether they are exclusively
      // mutated in the given subnetwork
      function computeMutationExclusivity(geneToSamples, genes, samples) {
        var sampleToexclusivity = {};
        for (var i = 0; i < samples.length; i++){
          // For a given sample, its mutated genes are all genes g
          // where the sample is in geneToSamples[g]
          var mutatedGenes = genes.map(function(g) {
                  return geneToSamples[g].indexOf( samples[i] );
                }).filter(function(n){ return n != -1; });

          sampleToexclusivity[samples[i]] = mutatedGenes.length;
        }
        return sampleToexclusivity;
      } // end computeMutationExclusivity


      // Parse the mutation data into a simple, sample-centric dictionary
      // sample -> { name, genes, cancer, cooccurring }
      // where genes is a list of mutations
      // gene   -> { amp, del, inactive_snv, snv, g, cancer, cooccurring }
      function createOncoprintData( M, geneToSamples, genes, samples,
          sampleToTypes ){
        var sampleMutations = [];
        for (i = 0; i < samples.length; i++){
          var s = samples[i],
              mutations = { name: s, genes: [], cancer: sampleToTypes[s] };

          // Record all mutated genes for the given sample
          for (j = 0; j < genes.length; j++){
            var g = genes[j],
                mut = {gene: g, cancer: sampleToTypes[s] };

            // Record all mutation types that the current gene has in the
            //    current sample
            if (geneToSamples[g].indexOf( s ) != -1){
              mut.amp = M[g][s].indexOf("amp") != -1;
              mut.del = M[g][s].indexOf("del") != -1;
              mut.fus = M[g][s].indexOf("fus") != -1;
              mut.inactivating = M[g][s].indexOf("inactive_snv") != -1;
              mut.snv = M[g][s].indexOf("snv") != -1 || mut.inactivating;
              mutations.genes.push(mut);
            }
          }
          // Determine if the mutations in the given sample are co-occurring
          mutations.cooccurring = mutations.genes.length > 1;
          mutations.genes.forEach(function(d) {
            d.cooccurring = mutations.cooccurring;
          });
          sampleMutations.push(mutations);
        }

        return sampleMutations;
      } // end createOncoprintData()


      // Sort sample *indices*
      function sortSamples(sortOrder) {
        // Comparison operators for pairs of samples
        function geneFrequencySort(s1, s2) {
          // Sort by the first gene in which the sample is mutated
          return d3.ascending(sampleToGeneIndex[s1], sampleToGeneIndex[s2]);
        }

        function exclusivitySort(s1, s2) {
          // Sort by the exclusivity of mutations in the samples
          return d3.ascending(sampleToExclusivity[s1], sampleToExclusivity[s2]);
        }

        function mutationTypeSort(s1, s2) {
          // Sort by the type of mutation
          var mut_type1 = M[genes[sampleToGeneIndex[s1]]][s1][0],
              mut_type2 = M[genes[sampleToGeneIndex[s2]]][s2][0];
          return d3.ascending(mutTypeOrder[mut_type1], mutTypeOrder[mut_type2]);
        }

        function sampleNameSort(s1, s2) {
          // Sort by sample name
          return d3.ascending(s1, s2);
        }

        function sampleTypeSort(s1, s2) {
          // Sort by sample type
          return d3.ascending(sampleToTypes[s1], sampleToTypes[s2]);
        }

        // Create a map of the sort constants to the functions they represent
        var sortFns = {};
        sortFns[EXCLUSIVITY] = exclusivitySort;
        sortFns[GENE_FREQ]   = geneFrequencySort;
        sortFns[MUTATION_TYPE] = mutationTypeSort;
        sortFns[SAMPLE_NAME] = sampleNameSort;
        sortFns[SAMPLE_TYPE]   = sampleTypeSort;

        return d3.range(0, samples.length).sort(function(i, j){
            var s1 = samples[i]
            , s2 = samples[j]
            , result;
            for (k = 0; k < sortOrder.length; k++){
                result =  sortFns[sortOrder[k]](s1, s2);
                if (result != 0) return result;
            }
            return result;
        });
      } // End sortSamples(sortOrder);


      // Parse the mutation data and sort the samples using a default sort order
      var sampleMutations = createOncoprintData(M, geneToSamples, genes,
              samples, sampleToTypes),
          sampleSortOrder = [GENE_FREQ, SAMPLE_TYPE, EXCLUSIVITY, MUTATION_TYPE,
              SAMPLE_NAME],
          sampleToExclusivity = computeMutationExclusivity(geneToSamples, genes,
              samples),
          sortedSampleIndices = sortSamples(sampleSortOrder);

      // Create a mapping of samples to the location index of the visualization
      //    on which they should be drawn
      var sampleToIndex = {};
      for ( var i = 0; i < samples.length; i++ ) {
        sampleToIndex[sortedSampleIndices[i]] = i;
      }


      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      // Construct the SVG

      // Select the svg element, if it exists.
      svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg');

      // Scales for the height/width of rows/columns
      var x = d3.scale.linear()
          .domain([0, m])
          .range([labelWidth + boxMargin, width - boxMargin]);

      // Zoom behavior
      var zoom = d3.behavior.zoom()
          .x(x)
          .scaleExtent([1, Math.round( minBoxWidth * m / width)])
          .on('zoom', function() { renderOncoprint(); });

      svg.attr('id', 'oncoprint')
          .attr('width', width)
          .attr('height', height + labelHeight)
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .call(zoom);

      // Offset the image placement using the margins
      var fig = svg.append("g")
          .attr('transform', 'translate(' + boxMargin + ',' + boxMargin + ')');

      // Append the rectangle that will serve as the background of the ticks
      fig.append('rect')
          .style('fill', bgColor)
          .attr('width', width - labelWidth - boxMargin)
          .attr('height', height)
          .attr('transform', 'translate(' + (labelWidth + boxMargin) + ',' +
              labelHeight + ')');

      // Add groups that include sample labels and each sample's mutations
      var g = fig.append('svg:g').attr('id', 'oncoprint');
      var matrix = g.selectAll('.sample')
          .data(sampleMutations)
          .enter()
          .append('svg:g')
            .attr('class', 'sample')
            .attr('id', function(s) { return s.name; });

      var ticks = matrix.append('g')
          .attr('transform', 'translate(0,' + labelHeight + ')');

      ticks.selectAll('.tick')
          .data(function(d){ return d.genes})
          .enter()
          .append('rect')
            .attr('class', 'tick')
            .attr('fill', function(d) {
              if (!multiCancer) {
                if (d.fus && d.snv) {
                  return bgColor;
                } else {
                  return d.cooccurring ? coocurringColor : exclusiveColor;
                }
              } else {
                if (d.fus && !d.snv) {
                  return bgColor;
                } else {
                  sampleTypeToColor[d.cancer];
                }
              }
            });

      // Add stripes to inactivating mutations
      ticks.selectAll('.inactivating')
          .data(function(d) { return d.genes; })
          .enter()
          .append('rect')
            .filter(function(d) { return d.inactivating; })
            .attr('class', 'inactivating')
            .attr('width', tickWidth)
            .attr('height', geneHeight/4)
            .style('fill', blockColorStrongest);

      // Add triangle for fusion/rearrangement/splice site
      ticks.selectAll('.fus')
          .data(function(d) { return d.genes; })
          .enter()
          .append('svg:path')
            .filter(function(d) { return d.fus })
            .attr('class', 'fusion')
            .attr('d', d3.svg.symbol().type('triangle-up').size(8))
            .style('stroke-opacity', 0)
            .style('fill', function(d) {
              if (multiCancer) {
                return sampleTypeToColor[d.cancer];
              } else {
                return d.cooccurring ? coocurringColor : exclusiveColor;
              }
            });

      // Add sample names and line separators between samples
      matrix.append('text')
          .attr('fill', blockColorMedium)
          .attr('text-anchor', 'start')
          .text(function(s) { return s.name; });

      // Add the row (gene) labels
      var geneLabels = fig.selectAll('.geneLabels')
          .data(genes)
          .enter()
          .append('svg:g')
            .attr('class', 'geneLabel')
            .attr('transform', function(d, i) {
              return 'translate(0,'+(labelHeight+geneToIndex[d]*geneHeight)+')';
            });

      geneLabels.append('text')
          .attr('class', 'gene-name')
          .attr('font-size', 14)
          .attr('text-anchor', 'end')
          .attr('transform', function(d, i) {
              return 'translate('+labelWidth+','+(geneHeight - boxMargin)+')';
          })
          .text(function(g) {
            return g+ ' (' + geneToSamples[g].length + ')';
          });

      // Add horizontal lines to separate rows (genes)
      fig.selectAll('.horizontal-line')
          .data(genes)
          .enter()
          .append('line')
            .attr('x2', width - labelWidth)
            .attr('transform', function(d, i) {
              var moveX = labelWidth + boxMargin,
                  moveY = labelHeight+i*geneHeight;
              return 'translate(' + moveX + ',' + moveY +')';
            })
            .style('stroke', '#fff');

      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      // Render function for oncoprint
      // Main function for moving sample names and ticks into place depending on
      //    zoom level
      function renderOncoprint() {
        // Identify ticks/samples that are visible form the viewport
        var activeTicks = matrix.filter(function(d,i){
              return x(sampleToIndex[i]) >= (labelWidth + boxMargin) &&
                  x(sampleToIndex[i]) <= width;
            });
        activeTicks.style('fill-opacity', 1);

        // Recalculate tick width based on the number of samples in the viewport
        var numVisible = activeTicks[0].length,
            printWidth = width - labelWidth - boxMargin;

        samplesPerCol = 1;

        while(samplesPerCol * printWidth / numVisible < 4) {
          samplesPerCol += 1;
        }

        tickWidth = printWidth / numVisible;

        // Fade inactive ticks (those out of the viewport)
        var inactiveTicks = matrix.filter(function(d, i) {
              return x(sampleToIndex[i]) < (labelWidth + boxMargin) ||
                  x(sampleToIndex[i]) > width;
            });
        inactiveTicks.style('fill-opacity', '0.25')
            .style('stroke-opacity', 1);

        // Move the small ticks of the inactivating group to the right place
        matrix.selectAll('inactivating')
            .filter(function(d) { return d.inactivating; })
            .attr('width', tickWidth)
            .attr('y', function(d, i) {
              var partialHeight = geneToIndex[d.gene] ? geneToIndex[d.gene] : 0;
              return  (partialHeight + 0.375) * geneHeight;
            });

        // Move the small ticks of the fusion group to the right place
        matrix.selectAll('.fusion')
            .filter(function(d) { return d.fus; })
            .attr('transform', function(d) {
              var translateX = tickWidth/2,
                  translateY = ((gene2index[d.gene] ? gene2index[d.gene]: 0)) *
                      geneHeight + geneHeight/2,
                  scale = tickWidth/6;

              var translateStr = 'translate('+translateX+','+translateY+')',
                  rotateStr = 'rotate(90)',
                  scaleStr = 'scale('+scale+')';

              return translateStr + ',' + rotateStr + ',' + scaleStr;
            });

        // Move the matrix
        matrix.attr('transform', function(d, i) {
          return 'translate(' + x(sampleToIndex[i]) + ')';
        });

        // Update the text size of the sample names depending on the zoom level
        //    represented by `tickWidth`
        matrix.selectAll('text')
            .style('font-size', (tickWidth < 8) ? tickWidth : 8)
            .attr('transform', 'translate(' + (tickWidth/2) + ',' + labelHeight
                + '), rotate(-90)');

        // Move the ticks to the right places
        ticks.selectAll('.tick')
            .attr('width', tickWidth)
            .attr('height', function(d) {
              return d.del || d.amp ? geneHeight/2 : geneHeight
            })
            .attr('y', function(d, i) {
              var index = geneToIndex[d.gene] ? geneToIndex[d.gene] : 0,
                  delOffset = d.del ? geneHeight / 2 : 0;
              return index * geneHeight + delOffset;
            });

        // Update the sample width legend
        d3.select('rect#sampleWidthRect')
            .attr('width', samplesPerCol * tickWidth - (2*sampleStroke));

        var sampleStr = samplesPerCol == 1 ? 'sample' : 'samples';
        d3.select('text#sampleWidthText')
            .text(samplesPerCol + ' ' + sampleStr);

        // Add sample lines
        // First remove the old sample lines
        svg.selectAll('.vert-line').remove();

        // Compute the indices of samples that are visible, and filter the
        //    indices by the number of samples per column
        var activeIndices = matrix.data().map(function(d, i) {return i; })
            .filter(function(i) {
              return x(i) >= (labelWidth + boxMargin) && x(i) <= width
            })
            .filter(function(d, i) {
              return i % samplesPerCol == 0;
            });

        svg.selectAll('.vert-line')
          .data(activeIndices)
          .enter()
          .append('line')
            .attr('x1', -height)
            .attr('y1', boxMargin)
            .attr('y2', boxMargin)
            .attr('class', 'vert-line')
            .attr('transform', function(i) {
              return 'translate(' + x(i) + ',' + (labelHeight + boxMargin) +
                  '), rotate(-90)';
            })
            .style('stroke', '#fff')
            .style('stroke-width', sampleStroke);

      } // end renderOncoprint();

      var legendMarginLeft = 10;
      function renderCoverage() {
        var coverage_span = selection.append('span')
            .style('float', 'right')
            .style('margin-right', cancerLegendWidth - legendMarginLeft + 'px');

        coverage_span.append('b').text('Coverage: ');
        coverage_span.append('span').text(coverage_str);
      }


      function renderLegend() {
        var mutationRectWidth = 10,
            legendFontSize = 11,
            left = mutationRectWidth/2;

        // Add legend SVG
        var mutationLegend = selection.append('svg')
            .attr('id', 'mutation-legend')
            .attr('height', mutationLegendHeight)
            .attr('width', width)
            .style('margin-left', labelWidth + boxMargin)
            .append('g')
              .style('font-size', legendFontSize);

        // If the data contains multiple cancer types, then mutations are
        //    colored by cancer type, so the exclusive/co-occurring cells won't
        //    be shown. The cancer type legend will float to the right of the
        //    oncoprint.
        if(!multiCancer) {
          // Exclusive ticks
          mutationLegend.append('rect')
              .attr('x', left)
              .attr('height', geneHeight)
              .attr('width', mutationRectWidth)
              .style('fill', exclusiveColor);

          mutationLegend.append('text')
              .attr('x', mutationRectWidth + 10)
              .attr('y', 3*geneHeight/4)
              .style('fill', '#000')
              .text('Exclusive');

          left += mutationRectWidth + 10 + 65;

          // Co-occurring ticks
          mutationLegend.append('rect')
              .attr('x', left)
              .attr('height', geneHeight)
              .attr('width', mutationRectWidth)
              .style('fill', coocurringColor);

          mutationLegend.append('text')
              .attr('x', left + mutationRectWidth + 10)
              .attr('y', 3*geneHeight/4)
              .style('fill', '#000')
              .text('Co-occurring');

          left += mutationRectWidth + 10 + 85;
        } else { // we are rendering multiCancer
          // Cancer type legend
          var legendBoxSize = 15,
              cancerLegend = selection.insert('svg', 'svg')
                  .attr('id', 'sample-type-legend')
                  .attr('width', cancerLegendWidth - legendMarginLeft)
                  .attr('height', cancerTypeLegendHeight)
                  .style('float', 'right')
                  .style('margin-top', labelHeight + boxMargin)
                  .style('margin-left', legendMarginLeft)
                  .style('margin-bottom', 10)
                  .style('font-size', 10);

          cancerLegend.append('text')
              .attr('x', 2)
              .attr('y', 10)
              .style('font-weight', 'bold')
              .text('Sample Types');

          var cancerTypes = cancerLegend.selectAll('.cancer-legend')
              .data(types)
              .enter()
              .append('g')
                .attr('transform', function(d, i) {
                  return 'translate(2,' + ((i+1) * legendBoxSize) + ')';
                });

          cancerTypes.append('rect')
              .attr('width', legendBoxSize)
              .attr('height', legendBoxSize)
              .style('fill', function(type) {return sampleTypeToColor[type];});

          cancerTypes.append('text')
              .attr('dy', legendBoxSize - 3)
              .attr('dx', 20)
              .text(function(type) {return type;});
        }

        // SNVs (full ticks)
        mutationLegend.append('rect')
            .attr('x', left)
            .attr('height', geneHeight)
            .attr('width', mutationRectWidth)
            .style('fill', style.blockColorMedium);

        mutationLegend.append('text')
            .attr('x', left + mutationRectWidth + 10)
            .attr('y', 3 * geneHeight / 4)
            .style('fill', '#000')
            .text('SNV');

        left += mutationRectWidth + 10 + 10 + 25;

        // Inactivating SNVs (stripped full ticks)
        mutationLegend.append('rect')
            .attr('x', left)
            .attr('height', geneHeight)
            .attr('width', mutationRectWidth)
            .style('fill', blockColorMedium);

        mutationLegend.append('rect')
            .attr('x', left)
            .attr('y', 3 * geneHeight / 8)
            .attr('height', geneHeight / 4)
            .attr('width', mutationRectWidth)
            .style('fill', '#000');

        mutationLegend.append('text')
            .attr('x', left + mutationRectWidth + 10)
            .attr('y', 3 * geneHeight / 4)
            .style('fill', '#000')
            .text('Inactivating');

        left += mutationRectWidth + 10 + 75;

        // Deletions (down ticks)
        mutationLegend.append('rect')
            .attr('x', left)
            .attr('y', geneHeight / 2)
            .attr('height', geneHeight / 2)
            .attr('width', mutationRectWidth)
            .style('fill', blockColorMedium);

        mutationLegend.append('text')
            .attr('x', left + mutationRectWidth + 5)
            .attr('y', 3 * geneHeight / 4)
            .style('fill', '#000')
            .text('Deletion');

        left += mutationRectWidth + 10 + 55;

        // Amplifications (up ticks)
        mutationLegend.append('rect')
            .attr('x', left)
            .attr('height', geneHeight / 2)
            .attr('width', mutationRectWidth)
            .style('fill', blockColorMedium);

        mutationLegend.append('text')
            .attr('x', left + mutationRectWidth + 10)
            .attr('y', 3*geneHeight / 4)
            .style('fill', '#000')
            .text('Amplification');

        left += mutationRectWidth + 10 + 75;

        // Fusion legend
        mutationLegend.append('path')
            .attr('d', d3.svg.symbol().type('triangle-up').size(30))
            .attr('transform', 'translate(' + (left + mutationRectWidth) + ','
                + 3*geneHeight/8 + '), rotate(90)')
            .style('stroke', bgColor)
            .style('fill', blockColorMedium);

        mutationLegend.append('text')
            .attr('x', left + mutationRectWidth + 10)
            .attr('y', 3 * geneHeight / 4)
            .style('fill', '#000')
            .text('Fusion/Rearrangement/Splice Variant');

        left += mutationRectWidth + 10 + 220;

        // Samples/box (the width/locations are set in renderOncoprint())
        mutationLegend.append('rect')
            .attr('x', left)
            .attr('id', 'sampleWidthRect')
            .attr('height', geneHeight)
            .style('fill', blockColorMedium);

        mutationLegend.append('text')
            .attr('id', 'sampleWidthText')
            .attr('x', left)
            .attr('y', 3 * geneHeight / 4)
            .style('fill', '#000');
      }// end renderLegend()


      function renderSortingMenu() {
        var sampleSort = selection.append('div')
            .attr('id', 'sample-sorting-interface')
            .style('margin-left', labelWidth + 'px')
            .style('font-size', 12 + 'px');

        var interfaceLink = sampleSort.append('a')
            .style('font-weight', 'bold')
            .text('Sort oncoprint by: ')
            .on('click', function() {
              // TODO enable hiding/showing menu
              d3.select('ul#sample-sort-list').style('display', 'block');
            });

        interfaceLink.append('span')
            .attr('id', 'interface-status')
            .attr('class', 'glyphicon glyphicon-chevron-up');

        var sortFnsContainer = sampleSort.append('ul')
            .attr('id', 'sample-sort-list')
            .style('padding-left', '10px')
            .style('display', 'none');

        // reorder uses the given sample sort parameters to resort the samples
        //    and then moves them to their new locations
        function reorder(sampleSortOrder) {
          // Resort the samples and update the index
          var sortedSampleIndices = sortSamples(sampleSortOrder);
          for (var i = 0; i < samples.length; i++) {
            sampleToIndex[sortedSampleIndices[i]] = i;
          }

          // Perform the transition: move elements in the order of where they
          //    will end up on the x-axis
          var t = svg.transition().duration(animationSpeed);

          t.selectAll('.sample')
              .delay(function(d, i) { return x(sampleToIndex[i]); })
              .attr('transform', function(d, i) {
                return 'translate(' + x(sampleToIndex[i]) + ',0)';
              });

          // Update the sample sorting interface (defined below)
          sampleSorterInterface();
        }

        // Shift items in the sample sort order list based on whether the user
        //    presses up/down. Then calls reorder to update the oncoprint
        function updateSampleOrder(n, move) {
          var newSampleSortOrder = sampleSortOrder,
              i = sampleSortOrder.indexOf(n),
              j = i - move;

          if (j != -1 && j < sampleSortOrder.length) {
            newSampleSortOrder[i] = newSampleSortOrder[j];
            newSampleSortOrder[j] = n;
          }
          reorder(newSampleSortOrder);
        }


        // Lists the sample sorting functions in the current order being used,
        //    along with arrows so the user can modify the order
        function sampleSorterInterface() {
          // Remove the old sample sorting interface
          sortFnsContainer.selectAll('*').remove();

          // Append a list of the way the oncoprint is sorted
          var sortFns = sortFnsContainer.selectAll('.sort-fn')
              .data(sampleSortOrder).enter()
              .append('li')
                .style('list-style-type', 'none')
                .style('margin-bottom', '5px');

          // Down and up arrows to chagne the precedence of the different
          //    sorting operators
          sortFns.append('span')
              .attr('class', 'glyphicon glyphicon-arrow-down')
              .on('click', function(d, i) { updateSampleOrder(d, -1); });

          sortFns.append('span')
              .attr('class', 'glyphicon glyphicon-arrow-up')
              .on('click', function(d, i) { updateSampleOrder(d, 1); });

          // Add a short description of what each sort parameter is
          sortFns.append('span').text(function(d){
            return ' ' + sortFnName[d];
          });
        }
      } // End renderSortingMenu()

      renderOncoprint();

      if (showCoverage) {
        renderCoverage();
      }
      if (showLegend) {
        renderLegend();
      }
      if (showSortingMenu) {
        renderSortingMenu();
      }
      //________________________________________________________________________
      //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

      // Select the svg element, if it exists.
      // var svg = d3.select(this).selectAll('svg').data([data]);

      // // Otherwise, create the skeletal chart.
      // var gEnter = svg.enter().append('svg').append('g');

      // svg.style('background-color', '#ccc');

      // var g = svg.select('g')
      //     .attr('transform', 'translate('+margin.left+','+margin.top+')');
    });
  }


  chart.addCoverage = function() {
    showCoverage = true;
    return chart;
  }

  chart.addLegend = function () {
    showLegend = true;
    return chart;
  }

  chart.addSortingMenu = function () {
    showSortingMenu = true;
    return chart;
  }


  chart.width = function(_) {
    if (!arguments.length) return width;
    fullWidth = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    fullHeight = _;
    return chart;
  };

  return chart;
}