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
			
			var chrm = region[2],
				allmin = 0,
				allmax = 0,
				maxSegXLoc = region[1];
				minSegXLoc = region[0];

			// Initialize data structures
			var geneJSON = geneinfo.map(function(d) {
				var selected = d[2] == gene;
				return { fixed: selected ? true: false , x0: d[0], x1: d[1], label: d[2], selected: selected };
			});

			var cliqJSON = cliq.map(function(d) {
				return { x0: d[0], x1: d[1], color: d[2], label: d[3]};
			});

			var segHCount = initIntervalH,
				samplelst = new Array(),
				segJSON   = new Array();

			for (var i = 0; i < seg.length; i++){
				var si = seg[i];
				segHCount+=intervalH;
				samplelst.push( si.pat );
				for (var j = 0; j < si.seg.length; j++){
					var sj = si.seg[j];
					segJSON.push({ x0: sj.x0, x1: sj.x1, label: sj.label, y: segHCount, pat: si.pat });
				}
			}

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

			var normalize = d3.scale.linear()
				.domain([start, stop])
				.range([0, width]);

			// Defining zoom behavior with D3's built-in zoom functionality
			var zoom = d3.behavior.zoom()
				.x(x)
				.scaleExtent([1, 100])
				.on("zoom", update);

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
				.style("font-size", rangeLegendFontSize);

			function drawSVG(){
				////////////////////////////////////////////////////////////////////////
				// Draw the genome around the gene
				var maxSegYLoc = 10;

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
					.style("fill-opacity", function(d) {return d.selected ? 1 : 0.2;})
					.style('fill', function (d) {return d.selected ? selectedColor : blockColorMedium;})                          
					.attr('id', function (d, i) { return "gene-" + i; });


				geneLabels = geneGroups.append("text")
					.attr("id", function (d, i) { return "gene-label-" + i; })
					.attr("y", rangeLegendOffset + 5 + genomeHeight/2)
					.attr("text-anchor", "middle")
					.style("fill-opacity", function (d) {return d.selected ? 1 : 0})
					.style("fill", textColorStrongest)
					.text(function(d){  return d.label; });

				geneGroups.on("mouseover", function(d, i){
						if (!d.fixed){
							// Highlight the gene's block
							d3.select(this)
								.select("rect")
								.style("fill", highlightColor);

							// And show the label
							d3.select(this)
								.select("text")
								.style("fill-opacity", 1)
						}
					})
					.on("mouseout", function(d, i){
						if (!d.fixed){
							// Reset the gene block color
							d3.select(this)
								.select("rect")
								.style("fill", function (d) {return d.selected ? selectedColor : blockColorMedium;});

							// And hide the label
							d3.select(this)
								.select("text")
								.style("fill-opacity", 0);
						}
					})
					.on("dblclick", function(d, i){
						d.fixed = d.fixed ? false : true;  
						if (d.fixed){ 
							// Highlight the block
							d3.select(this)
								.select("rect")
								.style("fill", function (d) {return d.selected ? selectedColor : highlightColor;});

							// Permanently show the label
							d3.select(this)
								.select("text")
								.style("fill-opacity", 1)
						}          
					});
				
				////////////////////////////////////////////////////////////////////////
				// Draw the segments
				intervals = svg.selectAll('.intervals')
					.data(segJSON)
					.enter().append('g')
					.attr("class", "intervals")

				ints = intervals.append('rect')    
					.attr('fill', function(d){ return sampleTypeToColor[sample2ty[d.pat]] })
					.attr('width', function(d) {
						return normalize(d.x1, minSegXLoc, maxSegXLoc) - normalize(d.x0, minSegXLoc, maxSegXLoc);
					})
					.attr('height', 5)
					.attr('id', function (d, i) { return "interval-" + i; });
			}

			function updateGene(){
				// Move the genes into place
				genes.attr("transform", function(d, i){
					return "translate(" + normalize(d.x0) + "," + rangeLegendOffset + ")"
				});

				// Scale the gene's blocks' width
				genes.attr("width", function(d, i){ return normalize(d.x1) - normalize(d.x0); });

				// Move the geneLabels
				geneLabels.attr("transform", function(d, i){
					// place the label in the center of whatever portion of the domain is shown
					var x1 = d3.max( [d.x0, d3.max(normalize.domain())] ),
						x2 = d3.min( [d.x1, d3.min(normalize.domain())] );
					return "translate(" + normalize(d.x0 + (d.x1-d.x0)/2) + ",0)";
				});
			}

			function update(){
				// Find the start/stop points after the zoom
				var curMin = d3.min( x.domain() ),
					curMax = d3.max( x.domain() );

				normalize.domain([curMin, curMax]);

				// Update the info about the range shown on the zoom
				rangeLegend.text("chr"+ chrm + ": " + d3.round(curMin) + "-" +  d3.round(curMax) );

				// Move the genes and intervals as appropriate
				updateGene(curMin, curMax);
				updateInterval(curMin, curMax);
			}

			function updateInterval(){
				// Move the intervals into place
				ints.attr("transform", function(d, i){
					return "translate(" + normalize(d.x0) + "," + (rangeLegendOffset-15 + d.y) + ")"
				});

				// Scale the intervals' widths
				ints.attr("width", function(d, i){ return normalize(d.x1) - normalize(d.x0); });
				
				// Add the tooltips
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
			update();

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