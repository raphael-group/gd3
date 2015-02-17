function cnaData(data) {
  function braph(cdata) {
    var gene = cdata.gene || "",
        geneinfo = cdata.neighbors || [],
        region = cdata.region || {}
        samplesToTypes = cdata.sampleToTypes || {},
        seg = cdata.segments;

    var chrm = region.chr,
        allmin = 0,
        allmax = 0,
        minSegXLoc = region.minSegX,
        maxSegXLoc = region.maxSegX;

    // Initialize data structures
    var geneJSON = geneinfo.map(function(d) {
      var selected = d.name == gene;
      return { fixed: selected ? true: false , start: d.start, end: d.end, label: d.name, selected: selected };
    });

    var sampleTypes = [],
        samplelst = [],
        segJSON   = [];

    // Flatten the segments data
    seg.forEach(function(d){
      samplelst.push( d.sample );

      var dSegments = d.segments;
      dSegments.forEach(function(s){
        // create simulated annotation data if it does not exist.
        // var vote = {
        //   type: 'vote',
        //   score: 100
        // }
        // var link = {
        //   type: 'link',
        //   href: 'http://www.cs.brown.edu',
        //   text: 'BrownCS'
        // }
        // var testAnnotation = [
        //   {
        //     type: 'text',
        //     title: 'Sample',
        //     text: d.sample
        //   },
        //   {
        //     type: 'table',
        //     header: ['Cancer', 'PMIDs', 'Votes'],
        //     data: [
        //       ['1', link, vote],
        //       ['4', link, vote]
        //     ]
        //   }
        // ];

        segJSON.push({
          // annotation: testAnnotation,
          gene: gene,
          start: s.start,
          end: s.end,
          label: s.sample,
          sample: d.sample,
          dataset: samplesToTypes[d.sample],
          ty: s.ty
        })

        if (sampleTypes.indexOf(samplesToTypes[d.sample]) === -1){
          sampleTypes.push( samplesToTypes[s.sample] );
        }
      });
    });


    // Sort the segments by cancer type and then by length
    segJSON.sort(function(a, b){
      if (a.dataset != b.dataset) return d3.ascending(a.dataset, b.dataset);
      else return d3.ascending(a.end-a.start, b.end-b.start);
    });

    var sampleTypeToInclude = {};
    sampleTypes.sort().forEach(function(d){ sampleTypeToInclude[d] = true; });

    var d = {
      genes: geneJSON,
      sampleTypes: sampleTypes,
      samplesToTypes: samplesToTypes,
      segments: segJSON,
      segmentDomain: [minSegXLoc, maxSegXLoc],
      sampleTypeToInclude: sampleTypeToInclude
    };

    d.get = function(arg) {
      if (arg == 'genes') return d.genes;
      else if (arg == 'sampleTypes') return d.sampleTypes;
      else if (arg == 'samplesToTypes') return d.samplesToTypes;
      else if (arg == 'segments') return d.segments;
      else if (arg == 'amps') return d.amps;
      else if (arg == 'dels') return d.dels;
      else if (arg == 'segmentDomain') return d.segmentDomain;
      else return undefined;
    }

    // We stack amplifications above and deletions below the
    // genome bar, so we need to figure out which position in 
    // the stack each *visible* segment has
    d.recomputeSegmentIndices = function(){
      var ampIndex = 0,
          delIndex = 0;

      d.segments.forEach(function(datum){
        if (d.sampleTypeToInclude[datum.dataset]){
          if (datum.ty == "amp") datum.index = ampIndex++;
          if (datum.ty == "del") datum.index = delIndex++;
        }
      });
      d.numAmps = ampIndex;
      d.numDels = delIndex;
    }
    d.recomputeSegmentIndices();

    return d;
  }
  var cnaData = braph(data);

  return cnaData;
}