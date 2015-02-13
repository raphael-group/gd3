<!DOCTYPE html>
<html class="no-js">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>GD3 Testing Page</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
    hr {
      border-bottom:none;
      border-left: none;
      border-right:none;
      border-top: 1px solid #666;
    }
    </style>
  </head>
  <body>
    <div id="cna"></div>
    <hr />
    <div id="graph"></div>
    <hr />
    <div id="heatmap"></div>
    <hr />
    <div id="mutmtx"></div>
    <hr />
    <div id="transcript"></div>
    <hr/>
    <div id="dendrogram"></div>
    <div style="height:200px"></div>
    <script src="../bower_components/d3/d3.min.js"></script>
    <script src="../gd3.js"></script>
    <script>

    d3.json('testData/example-cna.json', function(data) {
      d3.select('#cna')
        .datum(data.PDGFRA)
        .call(gd3.cna());
    });

    d3.json('testData/example-graph.json', function(data) {
      var style = {
        nodeColor : ['rgb(38, 125, 255)','rgb(237, 14, 28)']
      };
        d3.select('#graph')
            .datum(data)
            .call(gd3.graph({style:style})
            );
    });

    d3.json('testData/example-heatmap.json', function(data) {
      d3.json('testData/exampleAnnotations.json', function(adata) {
        data.annotations = adata;
        var hStyle = {height: 260, width: 800};
        d3.select('#heatmap')
            .datum(data)
            .call(gd3.heatmap({style:hStyle}));
      });
    });

    d3.json('testData/example2-mutation-matrix.json', function(data) {
      d3.json('testData/exampleAnnotations.json', function(annData) {
        var mutMtxStyle = {
          width: 800
        }
        data.annotations = annData;
        d3.select('#mutmtx')
          .datum(data)
          .call(gd3.mutationMatrix({style:mutMtxStyle}));
      });
    });


    d3.json('testData/example2-transcript.json', function(data) {

      var styling = {
        height: 180,
        width: 345
      };

      var sampleTypes = {},
          params = {},
          vizData = [];

      params.style=styling;

      var categories = ['BLCA', 'BRCA', 'COADREAD', 'GBM', 'HNSC', 'LUAD', 'LUSC', 'OV', 'SCNAH'];

      for (gKey in Object.keys(data)) {
        var gene = Object.keys(data)[gKey],
            transcriptList = Object.keys(data[gene]);

        for (tKey in transcriptList) {
          var transcript = transcriptList[tKey],
              domains = data[gene][transcript].domains,
              length = data[gene][transcript].length,
              mutations = data[gene][transcript].mutations;

          var mKeys = Object.keys(mutations);
          for(mKey in mKeys) {
            var m = mKeys[mKey],
                cancer = mutations[m].cancer;
            sampleTypes[cancer] = 0;
          }

          vizData.push({gene: gene, transcript: transcript, domains: domains, length: length, mutations: mutations, mutationCategories: categories, proteinDomainDB: 'PFAM'});
        }
      }
      sampleTypes = Object.keys(sampleTypes);
      params.sampleTypes = sampleTypes;

      d3.select("#transcript")
        .append("h3")
        .html(vizData[0].gene + " <small>" + vizData[1].transcript + "</small>");
      d3.select('#transcript')
          .datum(vizData[0])
          .call(gd3.transcript(params));
    });

    d3.json('testData/example-dendrogram-N30.json', function(data) {
      var hStyle = {height: 400, width: 800};
      d3.select('#dendrogram')
          .datum(data)
          .call(gd3.dendrogram({style:hStyle}));
    });
    </script>
  </body>
</html>