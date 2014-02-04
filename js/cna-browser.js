function cna_browser(params){
	var params = params || {},
		style  = params.style || {},
		colorSchemes = style.colorSchemes || {};

	var bgColor = style.bgColor || '#F6F6F6',
		blockColorStrongest = style.blockColorStrongest || '#2C3E50',
		blockColorStrong = style.blockColorStrong || '#7F8C8D',
		blockColorMedium = style.blockColorMedium || '#95A5A6',
		blockColorLight = style.blockColorLight || '#BDC3C7',
		blockColorLightest = style.blockColorLightest || '#ECF0F1',
		highlightColor = style.highlightColor || "#f1c40f",
		selectedColor = style.selectedColor || "#E74C3C",
		textColorStrongest = style.textColorStrongest || "#2C3E50",
		textColorStrong = style.textColorStrong || "#34495E",
		textColorLight = style.textColorLight || "#BDC3C7",
		textColorLightest = style.textColorLightest || "#ECF0F1",
		fontColor = style.fontColor || '#333',
		fontFamily = style.fontFamily || '"Helvetica","Arial"',
		fontSize = style.fontSize || 10,
		height = style.height || 250,
		margins = style.margins || {bottom: 0, left: 0, right: 0, top: 0},
		width = style.width || 800,
		genomeHeight = style.genomeHeight || 25,
		intervalH = style.intervalH || 7,
		initIntervalH = style.initIntervalH || 50,
		rangeLegendY = style.rangeLegendY || 15,
		rangeLegendOffset = style.rangeLegendOffset || 25,
		rangeLegendFontSize = style.rangeLegendFontSize || 11,
		legendFontSize = 10;

	var showLegend = false;

	var sampleTypeToColor = colorSchemes.sampleType || {};

	function chart(selection) {
		selection.each(function(data) {
			//////////////////////////////////////////////////////////////////////////
			// General setup
			var sample2ty = data.sample2ty,
				gene = data.gene,
				geneinfo = data.geneinfo,
				cliq = data.cliq,
				seg = data.seg,
				region = data.region;
			
			var allmin = 0,
				allmax = 0,
				maxSegXLoc = region[1];
				minSegXLoc = region[0];

			// Create data
			var geneJSON = geneinfo.map(function(d) {
				return { fixed: d[2] == gene ? true: false , x0: d[0], x1: d[1], label: d[2], selected: d[2]== gene ? true: false };
			});
			var cliqJSON = cliq.map(function(d) {
				return { x0: d[0], x1: d[1], color: d[2], label: d[3]};
			});

			var segHCount = initIntervalH,
				samplelst = new Array(),
				segJSON   = new Array();
			for (var i = 0; i < seg.length; i++){
				segHCount+=intervalH;
				samplelst.push(seg[i]['pat']);
				for (var j = 0; j < seg[i]['seg'].length; j++){
					segJSON.push({'x0':seg[i]['seg'][j]['x0'], 'x1':seg[i]['seg'][j]['x1'], 'label': seg[i]['seg'][j]['label'], 'y': segHCount, 'pat': seg[i]['pat']});
				}
			}

			tmpwSegY = segHCount;
			segHCount += 23

			typeCNA = region[3];
			chrm = region[2];

			// Select the svg element, if it exists.
			var svg = d3.select(this)
				.selectAll('svg')
				.data([data])
					.enter()
					.append('svg');

			// Set up scales
			var start = region[0],
				stop = region[1];

			var x = d3.scale.linear()
				.domain([start, stop])
				.range([0, width]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.ticks(5)
				.tickSize(0)
				.tickPadding(1.25);

			// Defining zoom behavior with D3's built-in zoom functionality
			var zoom = d3.behavior.zoom()
				.x(x)
				.scaleExtent([1, 100])
				.on("zoom", function(){ update(svg); });

			svg.attr('id', 'cna-browser')
				.attr('height', height + margins.top + margins.bottom)
				.attr('width', width)
				.style('display', 'block')
				.style('font-family', fontFamily)
				.style('font-size', fontSize)
				.call(zoom)
					.on("dblclick.zoom", null);

			var background = svg.append("rect")
				.attr("width", width)
				.attr("height", height)
				.attr("class", "background")
				.style("fill", bgColor);

			var rangeLegend = svg.append("text")
				.attr("x", 3)
				.attr("y", rangeLegendY)
				.style("font-size", rangeLegendFontSize)
				.text("chr"+ chrm + ": " + d3.round(d3.min( x.domain() )) + "-" +  d3.round(d3.max( x.domain())) )

			function drawSVG(){
				////////////////////////////////////////////////////////////////////////
				// Draw the genome around the gene
				maxSegXLoc = region[1];
				minSegXLoc = region[0];
				var maxSegYLoc = 10;

				var normalize = d3.scale.linear()
					.domain([minSegXLoc, maxSegXLoc])
					.range([0, width]);

				genome = svg.append("rect")
					.attr("class", "genome")
					.attr("y", rangeLegendOffset + (genomeHeight-10)/2)
					.attr("x", 0)
					.attr("width", width)
					.attr("height", genomeHeight - 10)
					.style("fill", blockColorLight);

				geneGroups = svg.selectAll(".genes")
					.data(geneJSON).enter()
					.append("g")
					.attr("class", "genes")

				genes = geneGroups.append('rect')        
					.attr("width", function(d){
						return normalize(d.x1) - normalize(d.x0);
					})
					.attr('height', genomeHeight)
					.style("fill-opacity", function(d) {return d.selected == true ? 1 : 0.2;})
					.style('fill', function (d) {return d.selected == true ? selectedColor : blockColorMedium;})                          
					.attr('id', function (d, i) { return "gene-" + i; });


				geneLabels = geneGroups.append("text")
					.attr('id', function (d, i) { return "gene-label-" +i; })
					.attr("y", rangeLegendOffset + 5 + genomeHeight/2)
					.attr("text-anchor", "middle")
					.style("fill-opacity", function (d) {return d.selected ==true ? 1 : 0})
					.style("fill", textColorStrongest)
					.text(function(d){  return d.label; });

				geneGroups.on("mouseover", function(d, i){
					if (d.fixed == false){
						d3.select(this).selectAll("rect").style("fill", highlightColor)
						svg.select("#gene-label-" + i).style("fill-opacity", 1)
					}
				})
				.on("mouseout", function(d, i){
					if (d.fixed == false){
						d3.select(this).selectAll("rect").style("fill", function (d) {return d.selected == true ? selectedColor : blockColorMedium;})
						svg.select("#gene-label-" + i).style("fill-opacity", 0)
					}
				})
				.on("dblclick", function(d, i){
					d.fixed = d.fixed ? false : true;  
					if (d.fixed == true){ 
						d3.select(this).selectAll("rect").style("fill", function (d) {return d.selected == true ? selectedColor : highlightColor;})       
						svg.select("#gene-label-" + i).style("fill-opacity", 1)
					}          
				});
				
				////////////////////////////////////////////////////////////////////////
				// Draw the segments

				// Normalize a gene location value for positioning in the gene mark bars
				function norm(d, min, max) {
					var norm = d3.scale.linear().domain([min, max]).range([0, width]);
					return norm(d);
				}

				function setX(w){
					return w < 1? 1: w/2;
				}

				var Px = {},
					Py = {};

				intervals = svg.selectAll('.intervals')
					.data(segJSON)
					.enter().append('g')
					.attr("class", "intervals")

				ints = intervals.append('rect')    
					.attr('fill', function(d){ return sampleTypeToColor[sample2ty[d.pat]] })
					.attr('width', function(d) {
						return norm(d.x1, minSegXLoc, maxSegXLoc) - norm(d.x0, minSegXLoc, maxSegXLoc);
					})
					.attr('height', 5)
					.attr('id', function (d, i) { return "interval-" + i; });
			}

			function updateGene(curMin, curMax){
				var normalize = d3.scale.linear()
					.domain([curMin, curMax])
					.range([0, width]);

				genes.attr("transform", function(d, i){
					return "translate(" + normalize(d.x0) + "," + rangeLegendOffset + ")"
				});

				genes.attr("width", function(d, i){ return normalize(d.x1) - normalize(d.x0); });

				geneLabels.attr("x", function(d, i){
					// place the label in the center of whatever portion of the domain is shown
					var x1 = d3.max( [d.x0, curMin] ),
						x2 = d3.min( [d.x1, curMax] );
					return x(x1 + (x2-x1)/2);
				});
			}

			function update(){
				// Update the info about the range shown on the zoom
				rangeLegend.text("chr"+ chrm + ": " + d3.round(d3.min( x.domain() )) + "-" +  d3.round(d3.max( x.domain())) )


				// Move the genes and intervals as appropriate
				var curMin = d3.min( x.domain() ),
					curMax = d3.max( x.domain() );
				
				updateGene(curMin, curMax);
				updateInterval(d3.min( x.domain() ), d3.max( x.domain() ));
			}

			function updateInterval(curMin, curMax){
				var normalize = d3.scale.linear()
					.domain([curMin, curMax])
					.range([0, width]);


				ints.attr("transform", function(d, i){
					return "translate(" + normalize(d.x0) + "," + (rangeLegendOffset-15 + d.y) + ")"
				});

				ints.attr("width", function(d, i){ return normalize(d.x1) - normalize(d.x0); });
				
				if (ints.tooltip)
					intervals.tooltip(function(d, i) {
						var tip = d.pat +"<br/> subtype: "+sample2ty[d.pat]+ "<br/> start: " + d.x0 + "<br/> end:    " + d.x1;
						return {
							type: "tooltip",
							text: tip,
							detection: "shape",
							placement: "mouse", 
							gravity: "right",
							position: [0, 0],
							displacement: [3, 12],
							mousemove: false
						};
					}); 
			}


			// Draw the initial version of the figure
			drawSVG();
			updateGene(minSegXLoc, maxSegXLoc);
			updateInterval(d3.min( x.domain() ), d3.max( x.domain() ));

		});
	}

	// Getters and setters
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