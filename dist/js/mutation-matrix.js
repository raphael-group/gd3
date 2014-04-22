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
  var mutationTypes = params.mutationTypes || ["snv", "inactive_snv", "del", "amp", "fus", "other"],
    mutationTypeToInclude = {};

  mutationTypes.forEach(function(d){ mutationTypeToInclude[d] = true; });

  // Define globals to be used when filtering the mutation matrix by sample type
  var sampleTypeToInclude = {},
      updateMutationMatrix,
      ticks,
      annotate,
      tip;

  // These variables determine what extras to show in the chart
  var showCoverage = false,
      showSampleLegend = false,
      showMutationLegend = false,
      showSortingMenu = false,
      drawTooltips = false,
      showDuplicates = false;

  function chart(selection) {
    selection.each(function(data) {
      //////////////////////////////////////////////////////////////////////////
      // General setup
      var M = data.M || {},
          sampleToTypes = data.sampleToTypes || {},
          sampleTypes = data.sampleTypes || [],
          typeToSamples = data.typeToSamples || {},
          samples = data.samples;

      var genes = Object.keys(M),
          numGenes = genes.length;

      // If no samples were provided, construct them all with equal z_index
      if (!samples){
        samples = Object.keys(sampleToTypes).map(function(sample){
          return { _id: sample, name: sample, z_index: 1 }
        });
      }

      // Assign each sample a sample name id (snid), depending on whether
      // or not we're collapsing/showing duplicates
      samples.forEach(function(s){ s.snid = showDuplicates ? s._id : s.name });

      // Identify the unique samples by snid
      var SNIDs = {};
      samples.sort(function(a, b){ return d3.ascending(a.z_index, b. z_index); });
      samples.forEach(function(s){
        if (!SNIDs[s.snid]) SNIDs[s.snid] =  s;
      });

      var uniqueSamples = [];
      Object.keys(SNIDs).forEach(function(snid){ uniqueSamples.push( SNIDs[snid] ); });      
      var numMutatedSamples = uniqueSamples.length;

      // Collect all unique types for all samples
      for(var i = 0; i < samples.length; i++) {
        if(sampleTypes.indexOf(sampleToTypes[samples[i]._id]) == -1) {
          sampleTypes.push(sampleToTypes[samples[i]._id]);
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
      if (showDuplicates){
        var numSamples = sampleTypes.reduce(function(total, t){ return total + typeToSamples[t].length; }, 0);
      }
      else{
        var allSampleNames = {};
        sampleTypes.forEach(function(t){
          typeToSamples[t].forEach(function(s){ allSampleNames[s] = true; });
        })
        var numSamples = Object.keys(allSampleNames).length;

      }

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
        return geneToSamples[g1].length < geneToSamples[g2].length ? 1 : -1;
      });
      d3.range(0, genes.length).forEach(function(i){ geneToIndex[sortedGenes[i]] = i; })

      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      // Parse and sort mutation data

      // Sorting order for mutation types
      var mutTypeOrder = { fus: 0, inactive_snv: 1, snv: 2, amp: 3, del: 4, other: 5 };

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
        var mutatedSamples = {},
            sampleToMutations = {};

        sampleToExclusivity = {};
        geneToFreq = {};
        sampleToGeneIndex = {};
        geneToSampleMutationType = {};

        genes.forEach(function(g){
          geneToFreq[g] = 0;
          geneToSampleMutationType[g] = {};
        });

        samples.forEach(function(s){
          sampleToGeneIndex[s.snid] = Number.POSITIVE_INFINITY;
        })

        // Iterate through the mutation matrix to summarize the mutation data
        function recordMutation(sample, muts){
          if (!(sample.snid in sampleToMutations)) sampleToMutations[sample.snid] = muts;
          else{
            var mutGenes = sampleToMutations[sample.snid].genes.map(function(d){ return d.gene; });
            muts.genes.forEach(function(d){
              if (mutGenes.indexOf(d.gene) == -1){
                sampleToMutations[sample.snid].genes.push( d );
              }
            });
          }
        }

        samples.forEach(function(s){
          var muts = { _id: s._id, name: s.name, snid: s.snid, genes: [], dataset: sampleToTypes[s._id] };
          
          // Add an empty mutation if the sample type is not included
          if (!sampleTypeToInclude[sampleToTypes[s._id]]){
            muts.cooccurring = false;
            recordMutation(s, muts);
            return;
          }

          // Record all mutated genes for the given sample
          var genesMutInSample = [];
          genes.forEach(function(g){
            // Record all mutation types that the current gene has in the
            // current sample
            var mutTys = [];
            if (geneToSamples[g].indexOf( s._id ) != -1){
              mutated = false;
              M[g][s._id].filter(function(t){ return mutationTypeToInclude[t]; })
                .sort(function(ty1, ty2){ return mutTypeOrder[ty1] < mutTypeOrder[ty2] ? 1 : -1; })
                .forEach(function(t){
                    muts.genes.push( {gene: g, dataset: sampleToTypes[s._id], ty: t, sample: s } );
                    mutated = true;
                    mutTys.push( t );
                    if (genesMutInSample.indexOf(g) == -1)
                      genesMutInSample.push( g );
                  });

              if (mutated){
                geneToFreq[g] += 1;
                mutatedSamples[s.snid] = true;
                sampleToGeneIndex[s.snid] = d3.min([sampleToGeneIndex[s.snid], geneToIndex[g]]);

                // Store the minimum mutation type index for each gene and sample to make
                // sorting as simple as possible later
                var minMutTy = d3.min(mutTys.map(function(m){ return mutTypeOrder[m]; }));
                geneToSampleMutationType[g][s.snid] = d3.min([minMutTy, geneToSampleMutationType[g][s.snid]]);
              }
            }
          });

          // Determine if the mutations in the given sample are co-occurring
          muts.cooccurring = sampleToExclusivity[s.snid] = genesMutInSample.length > 1;
          muts.genes.forEach(function(d) {
            d.cooccurring = muts.cooccurring;
          });
          recordMutation(s, muts);
        });
            
        // Flatten the sample mutations
        var sampleMutations = [];
        Object.keys(sampleToMutations).forEach(function(s){
          sampleMutations.push( sampleToMutations[s] );
        });

        // Determine the coverage of the gene set
        var coverage = Object.keys(mutatedSamples).length;

        return {  sampleMutations: sampleMutations, coverage: coverage, geneToFreq: geneToFreq,
                  sampleToExclusivity: sampleToExclusivity, sampleToGeneIndex: sampleToGeneIndex,
                  geneToSampleMutationType: geneToSampleMutationType
                };
      } // end createMutationMatrixData()


      // Sort sample *indices*
      function sortSamples(sortOrder, sortedGenes, sampleToGeneIndex, sampleToExclusivity) {
        // Comparison operators for pairs of samples
        function geneFrequencySort(s1, s2) {
          // Sort by the first gene in which the sample is mutated
          return d3.ascending(sampleToGeneIndex[s1.snid], sampleToGeneIndex[s2.snid]);
        }

        function exclusivitySort(s1, s2) {
          // Sort by the exclusivity of mutations in the samples
          return d3.ascending(sampleToExclusivity[s1.snid], sampleToExclusivity[s2.snid]);
        }

        function mutationTypeSort(s1, s2) {
          // Sort by the type of mutation
          var ind1 = sampleToGeneIndex[sid(s1)],
              ind2 = sampleToGeneIndex[sid(s2)];

          if (ind1 < sortedGenes.length)
            mut_type1 = geneToSampleMutationType[sortedGenes[ind1]][s1.snid];
          if (ind2 < sortedGenes.length)
            mut_type2 = geneToSampleMutationType[sortedGenes[ind2]][s2.snid];

          return mut_type1 > mut_type2 ? 1 : mut_type1 == mut_type2 ? 0 : -1;
        }

        function sampleNameSort(s1, s2) {
          // Sort by sample name
          return d3.ascending(s1.name, s2.name);
        }

        function sampleTypeSort(s1, s2) {
          // Sort by sample type
          return d3.ascending(sampleToTypes[s1._id], sampleToTypes[s2._id]);
        }

        // Create a map of the sort constants to the functions they represent
        var sortFns = {};
        sortFns[EXCLUSIVITY] = exclusivitySort;
        sortFns[GENE_FREQ]   = geneFrequencySort;
        sortFns[MUTATION_TYPE] = mutationTypeSort;
        sortFns[SAMPLE_NAME] = sampleNameSort;
        sortFns[SAMPLE_TYPE]   = sampleTypeSort;

        return d3.range(0, numMutatedSamples).sort(function(i, j){
            var s1 = uniqueSamples[i],
                s2 = uniqueSamples[j],
                result;

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
        geneToSampleMutationType = mutationData.geneToSampleMutationType;

        // Sort the samples, then create a mapping of samples to the location index of
        // the visualization on which they should be drawn
        var sortedSampleIndices = sortSamples(sampleSortOrder, sortedGenes, sampleToGeneIndex, sampleToExclusivity);
        sampleToIndex = {};
        for ( var i = 0; i < numMutatedSamples; i++ ) {
          sampleToIndex[uniqueSamples[sortedSampleIndices[i]].snid] = i;
        }
      }

      // Parse the mutation data and sort the samples using a default sort order
      var sampleSortOrder = [GENE_FREQ, SAMPLE_TYPE, EXCLUSIVITY, MUTATION_TYPE, SAMPLE_NAME];
      var sampleMutations, sampleToGeneIndex, sampleToExclusivity,
          sampleToIndex, geneToFreq, geneToSampleMutationType, coverage;
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
      function isOther(t){ return t == "other" ;}
      function isInactivating(t){ return t == "inactive_snv" ;}
      function isFus(t){ return t == "fus" ;}

      // Add columns holding each sample and its mutations
      var cols = matrix.append('g').attr('transform', 'translate(0,' + labelHeight + ')');

      // Add the mutations in groups
      var mutations = cols.selectAll('.muts')
          .data(function(d){ return d.genes})
          .enter()
          .append("g");

      ticks = mutations.append('rect')
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

      var other = mutations.append('line')
        .filter(function(d){ return isOther(d.ty); })
        .attr('class', 'other')
        .attr('x1', function(d){ return 0; })
        .attr('y1', function(d){ return 0; })
        .attr('y2', function(d){ return geneHeight; })
        .style('stroke', '#000')
        .style('stroke-width', 2);

      /////////////////////////////////////////////////////////////////////////
      // Add annotations to the mutations (if required)
      if (drawTooltips){
        // Initialize the tooltip
        tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(annotate);

        svg.call(tip);

        // Mutation matrix tool tips are stored in a div classed m2-tooltip
        // On mouse over the tooltip:
        //  * the tooltip is shown
        //  * the div.less-info is hidden
        //  * the div.more-info is shown

        var tooltipEl = "div.m2-tooltip";

        // Toggle the more- and less-info divs appropriately
        var toggleInfo = function (more, less){
          d3.select(tooltipEl + " div.more-info").style("display", more ? "inline" : "none" );
          d3.select(tooltipEl + " div.less-info").style("display", less ? "inline" : "none") ;
        }

        // Define the bevhaior for closing out (X-ing out) the tooltip
        var closeout = function(d){
          tip.hide(d);
          d3.select(this).on("mouseout", function(){ tip.hide(d); });
          toggleInfo(false, true);
        }

        // Define the behavior for showing the tooltip
        var activate = function(d){
          tip.show(d);
          d3.select(tooltipEl).insert("span", ":first-child")
            .style("cursor", "pointer")
            .style("float", "right")
            .attr("class", "x")
            .on("click", closeout)
            .text("X");
        }

        // Activate and toggle the .more- and .less-info divs
        var activateAndToggle = function(d){
          activate(d);
          toggleInfo(true, false);
        }

        // Bind the tooltip behavior
        mutations.on("mouseover", activate)
                 .on("mouseout", tip.hide)
                 .on("click", function(d){
                    activateAndToggle(d);
                    d3.select(this).on("mouseout", activateAndToggle);
                 });
      }

      function sid(sample){ return showDuplicates ? sample._id : sample.name; }

      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      // Render function for mutation matrix
      // Main function for moving sample names and ticks into place depending on
      //    zoom level
      function renderMutationMatrix() {
        // Functions for determining which mutations and samples to fade in/out
        function inViewPort(snid){
          return x(sampleToIndex[snid]) >= (labelWidth + boxMargin) && x(sampleToIndex[snid]) <= width;
        }

        function isActive(d){
          return inViewPort(d.sample.snid) && mutationTypeToInclude[d.ty] && sampleTypeToInclude[sampleToTypes[d.sample._id]];
        }

        // Identify ticks/samples that are visible form the viewport
        var activeCols = cols.filter(function(d){ return inViewPort(d.snid); })
          .style('fill-opacity', 1)
          .style('stroke-opacity', 1);

        // Fade columns out of the viewport but still active
        cols.filter(function(d){ return !inViewPort(d.snid); })
          .style('fill-opacity', 0.25)
          .style('stroke-opacity', 1);

        // Completely fade out ticks that are out of the viewport or inactive
        mutations.style("opacity", 0).style("stroke-opacity", 0);
        mutations.filter(function(d){ return isActive(d) })
          .style("opacity", 1).style("stroke-opacity", 1);
        mutations.filter(function(d){ return !isActive(d) && mutationTypeToInclude[d.ty] && sampleTypeToInclude[sampleToTypes[d.sample._id]] })
          .style("opacity", 0.25).style("stroke-opacity", 0.25);

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

        // Move the 'other' lines to the right place
        other.attr('x2', tickWidth)
          .attr('transform', function(d) {
              var translateY = ((geneToIndex[d.gene] ? geneToIndex[d.gene]: 0)) * geneHeight;
              return 'translate(0,' + translateY + ')';

            });

        // Move the matrix
        matrix.attr('transform', function(d) { return 'translate(' + x(sampleToIndex[sid(d)]) + ')'; });

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
              return d.y = index * geneHeight + delOffset;
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
            .style('margin-right', (showSampleLegend ? datasetLegendWidth - legendMarginLeft : 0) + 'px');

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
          var sortedSampleIndices = sortSamples(sampleSortOrder, sortedGenes, sampleToGeneIndex, sampleToExclusivity);
          for (var i = 0; i < numMutatedSamples; i++) {
            sampleToIndex[uniqueSamples[sortedSampleIndices[i]].snid] = i;
          }

          // Perform the transition: move elements in the order of where they
          //    will end up on the x-axis
          matrix.transition().duration(animationSpeed)
              .delay(function(d){ return x(sampleToIndex[d.snid]); })
              .attr('transform', function(d) { return 'translate(' + x(sampleToIndex[d.snid]) + ',0)'; });

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

          // Down and up arrows to chagne the z_index of the different
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

  chart.showDuplicates = function () {
    showDuplicates = true;
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

  chart.addTooltips = function(annotater){
    drawTooltips = true;
    annotate = annotater;
    if (ticks && tip){
      tip.html(annotater);
    }
    return chart;
  }

  return chart;
}
