function mutation_matrix(params) {
  var params = params || {},
      style  = params.style || {},
      colorSchemes = style.colorSchemes || {};

  var animationSpeed = style.animationSpeed || 300,
      bgColor = style.bgColor || '#F6F6F6',
      blockColorMedium = style.blockColorMedium || '#95A5A6',
      blockColorStrongest = style.blockColorStrongest || '#2C3E50',
      boxMargin = style.boxMargin || 5, // assumes uniform margins on all sides
      colorSampleTypes = style.colorSampleTypes || true,
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

  // Define the set of mutation types we are considering, and by default show them all
  var mutationTypes = params.mutationTypes || ["snv", "inactive_snv", "del", "amp", "fus"],
    mutationTypeToInclude = {};

  mutationTypes.forEach(function(d){ mutationTypeToInclude[d] = true; });

  // Define globals to be used when filtering the mutation matrix by sample type
  var sampleTypeToInclude = {},
      updateMutationMatrix;

  // These variables determine what extras to show in the chart
  var showCoverage = false,
      showSampleLegend = false,
      showMutationLegend = false,
      showSortingMenu = false;

  function chart(selection) {
    selection.each(function(data) {
      //////////////////////////////////////////////////////////////////////////
      // General setup
      var M = data.M || {},
          sampleToTypes = data.sampleToTypes || {},
          sampleTypes = data.sampleTypes || [],
          typeToNumSamples = data.typeToNumSamples || {};

      var genes = Object.keys(M),
          samples = Object.keys(sampleToTypes).slice(),
          numMutatedSamples = samples.length,
          numGenes = genes.length;

      // Collect all unique types for all samples
      for(var i = 0; i < samples.length; i++) {
        if(sampleTypes.indexOf(sampleToTypes[samples[i]]) == -1) {
          sampleTypes.push(sampleToTypes[samples[i]]);
        }
      }
      sampleTypes.sort();
      sampleTypes.forEach(function(t){ sampleTypeToInclude[t] = true; });

      // Then determine whether the data includes multiple datasets
      var multiDataset = (sampleTypes.length > 1) && colorSampleTypes,
          datasetLegendWidth = multiDataset ? 100 : 0,
          datasetTypeLegendHeight = multiDataset ? (sampleTypes.length+1)*15 : 0,
          width = fullWidth - (showSampleLegend ? datasetLegendWidth : 0),
          height = genes.length * geneHeight + boxMargin,
          tickWidth,
          samplesPerCol;

      // Count the total number of samples across all datasets
      var numSamples = sampleTypes.reduce(function(total, t){ return total + typeToNumSamples[t]; }, 0);

      // Assign colors for each type if no type coloration information exists
      var sampleTypesWithColors = sampleTypes.reduce(function(total, d){
        return sampleTypeToColor[d] ? total + 1 : total;
      }, 0);
      if (sampleTypesWithColors != sampleTypes.length) {
        var colors = d3.scale.category20();
        for (var i = 0; i < sampleTypes.length; i++) {
          if (!sampleTypeToColor[sampleTypes[i]])
            sampleTypeToColor[sampleTypes[i]] = colors(i);
        }
      }

      // Map each gene to the samples they're mutated in
      var geneToSamples = {};
      for (i = 0; i < genes.length; i++) {
        geneToSamples[genes[i]] = Object.keys(M[genes[i]]);
      }

      // Sort genes by their coverage, and make a map of each gene to its row index
      var geneToIndex = {};
      var sortedGenes = genes.sort(function(g1, g2){
        return geneToSamples[g1].length < geneToSamples[g2].length;
      });
      d3.range(0, genes.length).forEach(function(i){ geneToIndex[sortedGenes[i]] = i; })

      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      // Parse and sort mutation data

      // Sorting order for mutation types
      var mutTypeOrder = { inactive_snv: 0, snv: 1, amp: 2, del: 3 };

      // Constants that correspond to the different sorting functions
      var SAMPLE_TYPE = 0,
          SAMPLE_NAME = 1,
          MUTATION_TYPE = 2,
          EXCLUSIVITY = 3,
          GENE_FREQ = 4,
          // Short descriptions of the different sorting functions
          sortFnName = { };
          sortFnName[EXCLUSIVITY] = 'Exclusivity';
          sortFnName[GENE_FREQ] = 'Gene frequency';
          sortFnName[MUTATION_TYPE] = 'Mutation type';
          sortFnName[SAMPLE_NAME] = 'Sample name';
          sortFnName[SAMPLE_TYPE] = 'Sample type';


      // Parse the mutation data into a simple, sample-centric dictionary
      // sample -> { name, genes, dataset, cooccurring }
      // where genes is a list of mutations
      // gene   -> { amp, del, inactive_snv, snv, g, dataset, cooccurring }
      function createMutationMatrixData( M, geneToSamples, genes, samples, sampleToTypes ){
        // Define the data structures we'll populate while iterating through the mutation matrix
        var sampleMutations = [],
            sampleToExclusivity = {},
            geneToFreq = {},
            mutatedSamples = {};
        
        genes.forEach(function(g){ geneToFreq[g] = 0; });
        samples.forEach(function(s){ mutatedSamples[s] = false; })

        // Iterate through the mutation matrix to summarize the mutation data
        for (i = 0; i < samples.length; i++){
          var s = samples[i],
              muts = { name: s, genes: [], dataset: sampleToTypes[s] };

          // Add an empty mutation if the sample type is not included
          if (!sampleTypeToInclude[sampleToTypes[s]]){
            muts.cooccurring = false;
            sampleMutations.push( muts );
            continue;
          }

          // Record all mutated genes for the given sample
          for (j = 0; j < genes.length; j++){
            var g = genes[j];

            // Record all mutation types that the current gene has in the
            // current sample
            if (geneToSamples[g].indexOf( s ) != -1){
              mutated = false;
              M[g][s].filter(function(t){ return mutationTypeToInclude[t]; })
                .forEach(function(t){
                    muts.genes.push( {gene: g, dataset: sampleToTypes[s], ty: t, sample: s } )
                    mutated = true;
                  });
              if (mutated){
                geneToFreq[g] += 1;
                mutatedSamples[s] = true;
              }
            }
          }
          // Determine if the mutations in the given sample are co-occurring
          muts.cooccurring = sampleToExclusivity[s] = muts.genes.length > 1;
          muts.genes.forEach(function(d) {
            d.cooccurring = muts.cooccurring;
          });
          sampleMutations.push(muts);
        }

        // Determine the coverage of the gene set
        var coverage = samples.reduce(function(total, s){ return total + (mutatedSamples[s] ? 1 : 0);}, 0);

        // Sort genes by their frequency, and then map each sample to the minimum 
        // index of the genes they're mutated in
        var sampleToGeneIndex = {};

        for (var i = 0; i < sampleMutations.length; i++){
          var s = sampleMutations[i];
          if (s.genes.length > 0){
            sampleToGeneIndex[s.name] = d3.min(s.genes.map(function(g){ return geneToIndex[g.gene]; }))
          }
          else{
            sampleToGeneIndex[s.name] = Number.POSITIVE_INFINITY;
          }
        }

        return {  sampleMutations: sampleMutations, coverage: coverage, geneToFreq: geneToFreq,
                  sampleToExclusivity: sampleToExclusivity, sampleToGeneIndex: sampleToGeneIndex,
                };
      } // end createMutationMatrixData()


      // Sort sample *indices*
      function sortSamples(sortOrder, sortedGenes, sampleToGeneIndex, sampleToExclusivity) {
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
          var ind1 = sampleToGeneIndex[s1],
              ind2 = sampleToGeneIndex[s2];
          if (ind1 < sortedGenes.length) mut_type1 = M[sortedGenes[ind1]][s1][0];
          if (ind2 < sortedGenes.length) mut_type2 = M[sortedGenes[ind2]][s2][0];

          if (mut_type1 != -1 && mut_type2 != -1)
            return d3.ascending(mutTypeOrder[mut_type1], mutTypeOrder[mut_type2]);
          else
            return 0;
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

      function updateMutationData(){
        // Load the mutation data, taking into account the restrictions on mutation- and sample-types
        mutationData = createMutationMatrixData(M, geneToSamples, genes, samples, sampleToTypes);
        sampleMutations = mutationData.sampleMutations;
        sampleToGeneIndex = mutationData.sampleToGeneIndex;
        sampleToExclusivity = mutationData.sampleToExclusivity;
        geneToFreq = mutationData.geneToFreq;
        coverage = mutationData.coverage;

        // Sort the samples, then create a mapping of samples to the location index of
        // the visualization on which they should be drawn
        sortedSampleIndices = sortSamples(sampleSortOrder, sortedGenes, sampleToGeneIndex, sampleToExclusivity);
        sampleToIndex = {};
        for ( var i = 0; i < samples.length; i++ ) {
          sampleToIndex[samples[sortedSampleIndices[i]]] = i;
        }
      }

      // Parse the mutation data and sort the samples using a default sort order
      var sampleSortOrder = [GENE_FREQ, SAMPLE_TYPE, EXCLUSIVITY, MUTATION_TYPE, SAMPLE_NAME];
      var sampleMutations, sampleToGeneIndex, sampleToExclusivity,
          sortedSampleIndices, sampleToIndex, geneToFreq, coverage;
      updateMutationData();

      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      // Construct the SVG

      // Select the svg element, if it exists.
      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg');

      // Scales for the height/width of rows/columns
      var x = d3.scale.linear()
          .domain([0, numMutatedSamples])
          .range([labelWidth + boxMargin, width - boxMargin]);

      // Zoom behavior
      var zoom = d3.behavior.zoom()
          .x(x)
          .scaleExtent([1, Math.round( minBoxWidth * numMutatedSamples / width)])
          .on('zoom', function() { renderMutationMatrix(); });

      svg.attr('id', 'mutation-matrix')
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
      var g = fig.append('svg:g').attr('id', 'mutation-matrix');
      var matrix = g.selectAll('.sample')
          .data(sampleMutations)
          .enter()
          .append('svg:g')
            .attr('class', 'sample')
            .attr('id', function(s) { return s.name; });

      // Add sample names and line separators between samples
      matrix.append('text')
          .attr('fill', blockColorMedium)
          .attr('text-anchor', 'start')
          .text(function(s) { return s.name; });

      // Add the row (gene) labels
      var geneLabelGroups = fig.selectAll('.geneLabels')
          .data(genes)
          .enter()
          .append('svg:g')
            .attr('class', 'geneLabel')
            .attr('transform', function(d, i) {
              return 'translate(0,'+(labelHeight+geneToIndex[d]*geneHeight)+')';
            });

      var geneLabels = geneLabelGroups.append('text')
          .attr('class', 'gene-name')
          .attr('font-size', 14)
          .attr('text-anchor', 'end')
          .attr('transform', function(d, i) {
              return 'translate('+labelWidth+','+(geneHeight - boxMargin)+')';
          })
          .text(function(g) { return g+ ' (' + geneToFreq[g] + ')'; });

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

      // Helper functions for determining the type of mutation
      function isDel(t){ return t == "del" ;}
      function isAmp(t){ return t == "amp" ;}
      function isSnv(t){ return t == "snv" ;}
      function isInactivating(t){ return t == "inactive_snv" ;}
      function isFus(t){ return t == "fus" ;}

      // Add columns holding each sample and its mutations
      var cols = matrix.append('g').attr('transform', 'translate(0,' + labelHeight + ')');

      // Add the mutations in groups
      var mutations = cols.selectAll('.tick')
          .data(function(d){ return d.genes})
          .enter()
          .append("g");

      var ticks = mutations.append('rect')
            .attr('class', function(d){ return "tick " + d.ty; })
            .attr('fill', function(d) {
              if (!multiDataset) {
                if (isFus(d.ty) && isSnv(d.ty)) {
                  return bgColor;
                } else {
                  return d.cooccurring ? coocurringColor : exclusiveColor;
                }
              } else {
                if (isFus(d.ty) && isSnv(d.ty)) {
                  return bgColor;
                } else {
                  return sampleTypeToColor[d.dataset];
                }
              }
            });

      // Add stripes to inactivating mutations
      var inactivating = mutations.append('rect')
            .filter(function(d) { return isInactivating(d.ty); })
            .attr('class', 'inactivating')
            .attr('width', tickWidth)
            .attr('height', geneHeight/4)
            .style('fill', blockColorStrongest);

      // Add triangle for fusion/rearrangement/splice site
      var fus = mutations.append('svg:path')
            .filter(function(d) { return isFus(d.ty); })
            .attr('class', 'fusion')
            .attr('d', d3.svg.symbol().type('triangle-up').size(8))
            .style('stroke-opacity', 0)
            .style('fill', function(d) {
              if (multiDataset) {
                return sampleTypeToColor[d.dataset];
              } else {
                return d.cooccurring ? coocurringColor : exclusiveColor;
              }
            });

      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      // Render function for mutation matrix
      // Main function for moving sample names and ticks into place depending on
      //    zoom level
      function renderMutationMatrix() {
        // Functions for determining which mutations and samples to fade in/out
        function inViewPort(name){
          return x(sampleToIndex[name]) >= (labelWidth + boxMargin) && x(sampleToIndex[name]) <= width;
        }

        function isActive(d){
          return inViewPort(d.sample) && mutationTypeToInclude[d.ty] && sampleTypeToInclude[sampleToTypes[d.sample]];
        }

        // Identify ticks/samples that are visible form the viewport
        var activeCols = cols.filter(function(d){ return inViewPort(d.name); })
          .style('fill-opacity', 1)
          .style('stroke-opacity', 1);

        // Fade columns out of the viewport but still active
        cols.filter(function(d){ return !inViewPort(d.name); })
          .style('fill-opacity', 0.25)
          .style('stroke-opacity', 1);

        // Completely fade out ticks that are out of the viewport or inactive
        mutations.style('opacity', function(d){
          if (isActive(d)) return 1;
          else if (mutationTypeToInclude[d.ty] && sampleTypeToInclude[sampleToTypes[d.sample]]) return 0.25
          else return 0;
        });

        // Recalculate tick width based on the number of samples in the viewport
        var numVisible = activeCols[0].length,
            printWidth = width - labelWidth - boxMargin;

        samplesPerCol = 1;

        while(samplesPerCol * printWidth / numVisible < 4) {
          samplesPerCol += 1;
        }

        tickWidth = printWidth / numVisible;

        // Move the small ticks of the inactivating group to the right place
        inactivating.attr('width', tickWidth)
            .attr('y', function(d, i) {
              var partialHeight = geneToIndex[d.gene] ? geneToIndex[d.gene] : 0;
              return  (partialHeight + 0.375) * geneHeight;
            });

        // Move the small ticks of the fusion group to the right place
        fus.attr('transform', function(d) {
              var translateX = tickWidth/2,
                  translateY = ((geneToIndex[d.gene] ? geneToIndex[d.gene]: 0)) *
                      geneHeight + geneHeight/2,
                  scale = tickWidth/6;

              var translateStr = 'translate('+translateX+','+translateY+')',
                  rotateStr = 'rotate(90)',
                  scaleStr = 'scale('+scale+')';

              return translateStr + ',' + rotateStr + ',' + scaleStr;
            });

        // Move the matrix
        matrix.attr('transform', function(d) { return 'translate(' + x(sampleToIndex[d.name]) + ')'; });

        // Update the text size of the sample names depending on the zoom level
        // represented by `tickWidth`
        matrix.selectAll('text')
            .style('font-size', (tickWidth < 8) ? tickWidth : 8)
            .attr('transform', 'translate(' + (tickWidth/2) + ',' + labelHeight
                + '), rotate(-90)');

        // Move the ticks to the right places
        ticks.attr('width', tickWidth)
            .attr('height', function(d) {
              return isDel(d.ty) || isAmp(d.ty) ? geneHeight/2 : geneHeight
            })
            .attr('y', function(d, i) {
              var index = geneToIndex[d.gene] ? geneToIndex[d.gene] : 0,
                  delOffset = isDel(d.ty) ? geneHeight / 2 : 0;
              return index * geneHeight + delOffset;
            });

        // Update the sample width legend
        d3.select('rect#sampleWidthRect')
            .attr('width', samplesPerCol * tickWidth - (2*sampleStroke));

        var sampleStr = samplesPerCol == 1 ? 'sample' : 'samples';
        d3.select('text#sampleWidthText')
            .attr("transform", "translate(" + (tickWidth + 5) + ",0)")
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

      } // end renderMutationMatrix();

      var legendMarginLeft = 10, coverageContainer;
      function generateCoverageStr(){
        return ((coverage*100. / numSamples).toFixed(2)) + "% (" + coverage + "/" + numSamples + ")"
      }

      function renderCoverage() {
        var coverage_span = selection.append('span')
            .style('float', 'right')
            .style('margin-right', datasetLegendWidth - legendMarginLeft + 'px');

        coverage_span.append('b').text('Coverage: ');
        coverageContainer = coverage_span.append('span').text(generateCoverageStr());
      }

      // Functions for making the legends interactive
      updateMutationMatrix = function (){
          updateMutationData();
          geneLabels.text(function(g) { return g+ ' (' + geneToFreq[g] + ')'; });
          coverageContainer.text(generateCoverageStr());
          renderMutationMatrix();
      }
      
      // Function for toggling sampleTypes
      function toggleSampleType(el, ty){
        var active = sampleTypeToInclude[ty],
        opacity = active ? 0.5 : 1;

        d3.select(el).selectAll("*")
        .style("fill-opacity", opacity)
        .style("stroke-opacity", opacity);

        sampleTypeToInclude[ty] = !active;
        updateMutationMatrix();
      }

      function renderSampleLegend() {
          // There is no sample legend if the mutation matirx isn't multiDataset
          if (!multiDataset) return;

          // Dataset legend
          var legendBoxSize = 15,
              datasetLegend = selection.insert('svg', 'svg')
                  .attr('id', 'sample-type-legend')
                  .attr('width', datasetLegendWidth - legendMarginLeft)
                  .attr('height', datasetTypeLegendHeight)
                  .style('float', 'right')
                  .style('margin-top', labelHeight + boxMargin)
                  .style('margin-left', legendMarginLeft)
                  .style('margin-bottom', 10)
                  .style('font-size', 10);

          datasetLegend.append('text')
              .attr('x', 2)
              .attr('y', 10)
              .style('font-weight', 'bold')
              .text('Sample Types');

          var datasetTypes = datasetLegend.selectAll('.dataset-legend')
              .data(sampleTypes)
              .enter()
              .append('g')
                .attr('transform', function(d, i) { return 'translate(2,' + ((i+1) * legendBoxSize) + ')'; })
                .style("cursor", "pointer")
                .on("click", function(ty){ toggleSampleType(this, ty); });

          datasetTypes.append('rect')
              .attr('width', legendBoxSize)
              .attr('height', legendBoxSize)
              .style('fill', function(type) {return sampleTypeToColor[type];});

          datasetTypes.append('text')
              .attr('dy', legendBoxSize - 3)
              .attr('dx', 20)
              .text(function(type) {return type;});
    
      }// end renderSampleLegend()

    function renderMutationLegend(){
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


        function toggleMutationType(el, ty){
            var active = mutationTypeToInclude[ty],
              opacity = active ? 0.5 : 1;

            d3.select(el).selectAll("*")
              .style("fill-opacity", opacity)
              .style("stroke-opacity", opacity);
            
            mutationTypeToInclude[ty] = !active;
            updateMutationMatrix();
        }

        // If the data contains multiple datasets, then mutations are
        //    colored by dataset, so the exclusive/co-occurring cells won't
        //    be shown. The dataset legend will float to the right of the
        //    mutation matrix.
        if(!multiDataset) {
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
        }

        // Add groups to hold each legend item
        var snvLegend = mutationLegend.append("g")
          .attr("transform", "translate(" + left + ",0)")
          .style("cursor", "pointer")
          .on("click", function(){ toggleMutationType(this, "snv"); });

        left += mutationRectWidth + 10 + 10 + 25;

        var inactiveSNVLegend = mutationLegend.append("g")
          .attr("transform", "translate(" + left + ",0)")
          .style("cursor", "pointer")
          .on("click", function(){ toggleMutationType(this, "inactive_snv"); });

        left += mutationRectWidth + 10 + 75;

        var delLegend = mutationLegend.append("g")
          .attr("transform", "translate(" + left + ",0)")
          .style("cursor", "pointer")
          .on("click", function(){ toggleMutationType(this, "del"); });

        left += mutationRectWidth + 10 + 55;

        var ampLegend = mutationLegend.append("g")
          .attr("transform", "translate(" + left + ",0)")
          .style("cursor", "pointer")
          .on("click", function(){ toggleMutationType(this, "amp"); });

        left += mutationRectWidth + 10 + 75;

        var fusionLegend = mutationLegend.append("g")
          .attr("transform", "translate(" + left + ",0)")
          .style("cursor", "pointer")
          .on("click", function(){ toggleMutationType(this, "fus"); });

        left += mutationRectWidth + 10 + 220;

        // SNVs (full ticks)
        snvLegend.append('rect')
            .attr('height', geneHeight)
            .attr('width', mutationRectWidth)
            .style('fill', blockColorMedium);

        snvLegend.append('text')
            .attr('dx', mutationRectWidth + 10)
            .attr('dy', 3 * geneHeight / 4)
            .style('fill', '#000')
            .text('SNV');

        // Inactivating SNVs (stripped full ticks)
        inactiveSNVLegend.append('rect')
            .attr('height', geneHeight)
            .attr('width', mutationRectWidth)
            .style('fill', blockColorMedium);

        inactiveSNVLegend.append('rect')
            .attr('y', 3 * geneHeight / 8)
            .attr('height', geneHeight / 4)
            .attr('width', mutationRectWidth)
            .style('fill', '#000');

        inactiveSNVLegend.append('text')
            .attr('dx', mutationRectWidth + 10)
            .attr('dy', 3 * geneHeight / 4)
            .style('fill', '#000')
            .text('Inactivating');

        // Deletions (down ticks)
        delLegend.append('rect')
            .attr('y', geneHeight / 2)
            .attr('height', geneHeight / 2)
            .attr('width', mutationRectWidth)
            .style('fill', blockColorMedium);

        delLegend.append('text')
            .attr('dx', mutationRectWidth + 5)
            .attr('dy', 3 * geneHeight / 4)
            .style('fill', '#000')
            .text('Deletion');

        // Amplifications (up ticks)
        ampLegend.append('rect')
            .attr('height', geneHeight / 2)
            .attr('width', mutationRectWidth)
            .style('fill', blockColorMedium);

        ampLegend.append('text')
            .attr('dx', mutationRectWidth + 10)
            .attr('dy', 3*geneHeight / 4)
            .style('fill', '#000')
            .text('Amplification');

        // Fusion legend
        fusionLegend.append('path')
            .attr('d', d3.svg.symbol().type('triangle-up').size(30))
            .attr('transform', 'translate(0,' + 3*geneHeight/8 + ')rotate(90)')
            .style('stroke', bgColor)
            .style('fill', blockColorMedium);

        fusionLegend.append('text')
            .attr('dx', mutationRectWidth + 10)
            .attr('dy', 3 * geneHeight / 4)
            .style('fill', '#000')
            .text('Fusion/Rearrangement/Splice Variant');

        // Samples/box (the width/locations are set in renderMutationMatrix())
        mutationLegend.append('rect')
            .attr('x', left)
            .attr('id', 'sampleWidthRect')
            .attr('width', samplesPerCol * tickWidth - (2*sampleStroke))
            .attr('height', geneHeight)
            .style('fill', blockColorMedium);

        mutationLegend.append('text')
            .attr('id', 'sampleWidthText')
            .attr('x', left)
            .attr('y', 3 * geneHeight / 4)
            .attr("transform", "translate(" + (tickWidth + 5) + ",0)")
            .style('fill', '#000')
            .text(samplesPerCol == 1 ? '1 sample' : samplesPerCol + ' samples')
      }// end renderMutationLegend()


      function renderSortingMenu() {
        var sampleSort = selection.append('div')
            .attr('id', 'sample-sorting-interface')
            .style('margin-left', labelWidth + 'px')
            .style('font-size', 12 + 'px');

        var interfaceLink = sampleSort.append('a')
            .style('font-weight', 'bold')
            .text('Sort mutation matrix by: ')
            .on('click', function() {
              // TODO enable hiding/showing menu
              // d3.select('ul#sample-sort-list').style('display', 'block');
              if($('ul#sample-sort-list').is(':visible')) {
                $('ul#sample-sort-list').slideUp();
                $('span#interface-status').html("&uarr;")
              } else {
                $('ul#sample-sort-list').slideDown();
                $('span#interface-status').html("&darr;")
              }
            });

        interfaceLink.append('span')
            .attr('id', 'interface-status')
            .style("cursor", "pointer")
            .html("&uarr;")

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
            sampleToIndex[samples[sortedSampleIndices[i]]] = i;
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
        //    presses up/down. Then calls reorder to update the mutation matrix
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

          // Append a list of the way the mutation matrix is sorted
          var sortFns = sortFnsContainer.selectAll('.sort-fn')
              .data(sampleSortOrder).enter()
              .append('li')
                .style('list-style-type', 'none')
                .style('margin-bottom', '5px');

          // Down and up arrows to chagne the precedence of the different
          //    sorting operators
          sortFns.append('span')
              .style("cursor", "pointer")
              .html('&darr;')
              .on("mouseover", function(){ d3.select(this).style("color", "red"); })
              .on("mouseout", function(){ d3.select(this).style("color", "black"); })
              .on('click', function(d, i) { updateSampleOrder(d, -1); });

          sortFns.append('span')
              .style("cursor", "pointer")
              .html('&uarr;')
              .on("mouseover", function(){ d3.select(this).style("color", "red"); })
              .on("mouseout", function(){ d3.select(this).style("color", "black"); })
              .on('click', function(d, i) { updateSampleOrder(d, 1); });

          // Add a short description of what each sort parameter is
          sortFns.append('span').text(function(d){
            var name = sortFnName[d];
            return ' ' + sortFnName[d];
          });
        }
        sampleSorterInterface();
      } // End renderSortingMenu()

      renderMutationMatrix();

      if (showCoverage) {
        renderCoverage();
      }
      if (showSampleLegend) {
        renderSampleLegend();
      }
      if (showMutationLegend) {
        renderMutationLegend();
      }
      if (showSortingMenu) {
        renderSortingMenu();
      }

    });
  }

  chart.addCoverage = function() {
    showCoverage = true;
    return chart;
  }

  chart.addSampleLegend = function () {
    showSampleLegend = true;
    return chart;
  }

  chart.addMutationLegend = function () {
    showMutationLegend = true;
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

  chart.filterDatasets = function(datasetToInclude) {
    Object.keys(datasetToInclude).forEach(function(d){
      sampleTypeToInclude[d] = datasetToInclude[d];
    });
    updateMutationMatrix();
  }

  return chart;
}
