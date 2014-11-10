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

	var showLegend = false,
		showTooltips = false,
		addOnClick = false;

	var sampleTypeToColor = colorSchemes.sampleType || {};

	var sampleTypeToInclude = {},
		updateCNABrowser,
		onclickFunction;

	function chart(selection) {
		selection.each(function(data) {
			//////////////////////////////////////////////////////////////////////////
			// General setup
			var sampleToTypes = data.sampleToTypes || {},
				gene = data.gene || "",
				geneinfo = data.neighbors || [],
				seg = data.segments || [],
				region = data.region || {};

			var chrm = region.chr,
				allmin = 0,
				allmax = 0,
				minSegXLoc = region.minSegX,
				maxSegXLoc = region.maxSegX;

			// Determine the height
			var height = (intervalH * data.segments.length) + initIntervalH + rangeLegendOffset - 10;

			// Initialize data structures
			var geneJSON = geneinfo.map(function(d) {
				var selected = d.name == gene;
				return { fixed: selected ? true: false , start: d.start, end: d.end, label: d.name, selected: selected };
			});

			var samplelst = new Array(),
				segJSON   = new Array(),
				sampleTypes = new Array();

			// Flatten the segments data
			seg.forEach(function(d){
				samplelst.push( d.sample );
				d.segments.forEach(function(s){
					segJSON.push({
						gene: gene,
						start: s.start,
						end: s.end,
						label: s.sample,
						sample: d.sample,
						dataset: sampleToTypes[d.sample],
						ty: s.ty
					})
					if (sampleTypes.indexOf(sampleToTypes[d.sample])){
						sampleTypes.push( sampleToTypes[s.sample] );
					}
				});
			});

			// Sort the segments by cancer type and then by length
			segJSON.sort(function(a, b){
				if (a.dataset != b.dataset) return d3.ascending(a.dataset, b.dataset);
				else return d3.ascending(a.end-a.start, b.end-b.start);
			})

			// Compute the height of each segment
			var segHCount = initIntervalH;
			d3.range(0, segJSON.length).forEach(function(i){
				segJSON[i].y = segHCount += intervalH;
			});

			// Initialize the CNA browser to include all sample types
			sampleTypes.sort();
			sampleTypes.forEach(function(d){ sampleTypeToInclude[d] = true; });

			// Select the svg element, if it exists.
			var svg = d3.select(this)
				.selectAll('svg')
				.data([data])
					.enter()
					.append('svg');

			// Set up scales
			var start = region.minSegX,
				stop = region.maxSegX;

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
				.on("zoom", function(){ updateCNABrowser(); }); // MUST be wrapped in a function call

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
					.attr("width", function(d){ return normalize(d.end) - normalize(d.start); })
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
					.attr('fill', function(d){ return sampleTypeToColor[sampleToTypes[d.sample]] })
					.attr('width', function(d) {
						return normalize(d.end, minSegXLoc, maxSegXLoc) - normalize(d.start, minSegXLoc, maxSegXLoc);
					})
					.attr('height', 5)
					.attr('id', function (d, i) { return "interval-" + i; });

				// Add a vertical bar that spans the target gene
				if (data.segments.length > 0){
					verticalBars = svg.selectAll('.vert-bar')
						.data(geneJSON.filter(function(d){ return d.selected; })).enter()
						.append("rect")
						.attr("y", initIntervalH)
						.attr("width", function(d){ return normalize(d.end) - normalize(d.start); })
						.attr("height", height - initIntervalH)
						.style("fill", selectedColor)
						.style("fill-opacity", 0.5);
				}

				// Add tooltips to the intervals
				if (showTooltips){
					var tip = d3.tip()
						.attr('class', 'd3-tip')
						.offset([-10, 0])
						.html(function(d, i){
							return d.sample +"<br/>Type: "+ sampleToTypes[d.sample]+ "<br/>Start: " + d.start + "<br/>End:    " + d.end;
						});

					svg.call(tip);

					intervals.on("mouseover", function(d){
						tip.show(d);
						$("div.d3-tip").css("left", (d3.event.pageX - 50) + "px")
							.css("top", (d3.event.pageY - 65) + "px");
					})
					.on("mouseout", tip.hide);

					if (addOnClick){
						intervals.on("click", onclickFunction);
					}
				}
				else if( addOnClick ){
					intervals.on("click", onclickFunction);
				}


			}

			function updateGene(){
				// Move the genes into place
				genes.attr("transform", function(d, i){
					return "translate(" + normalize(d.start) + "," + rangeLegendOffset + ")"
				});

				// Scale the gene's blocks' width
				genes.attr("width", function(d, i){ return normalize(d.end) - normalize(d.start); });

				// Move the geneLabels
				geneLabels.attr("transform", function(d, i){
					// place the label in the center of whatever portion of the domain is shown
					var x1 = d3.max( [d.start, d3.max(normalize.domain())] ),
						x2 = d3.min( [d.end, d3.min(normalize.domain())] );
					return "translate(" + normalize(d.start + (d.end-d.start)/2) + ",0)";
				});

				// Move the vertical bar around the target genes
				verticalBars.attr("x", function(d){ return normalize(d.start); })
					.attr("width", function(d){ return normalize(d.end) - normalize(d.start); });
			}

			updateCNABrowser = function (){
				var t = zoom.translate(),
					tx = t[0],
					ty = t[1],
					scale = zoom.scale();

				tx = Math.min(tx, 0);

				zoom.translate([tx, ty]);

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
					return "translate(" + normalize(d.start) + "," + (rangeLegendOffset-15 + d.y) + ")"
				})
				.attr("width", function(d, i){ return normalize(d.end) - normalize(d.start); })

				// Fade in/out intervals that are from datasets not currently active
				var activeIntervals = intervals.filter(function(d){ return sampleTypeToInclude[sampleToTypes[d.sample]]; })
					.style("opacity", 1);
				intervals.filter(function(d){ return !sampleTypeToInclude[sampleToTypes[d.sample]]; })
					.style("opacity", 0);

			}

			// Draw the initial version of the figure
			drawSVG();
			updateCNABrowser();

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

	chart.addTooltips = function() {
		showTooltips = true;
		return chart;
	}

	chart.filterDatasets = function(datasetToInclude) {
		Object.keys(datasetToInclude).forEach(function(d){
			sampleTypeToInclude[d] = datasetToInclude[d];
		});
		updateCNABrowser();
	}

	chart.addOnClick = function (fn) {
		addOnClick = true;
		onclickFunction = fn;
		return chart; 
	}
	
	return chart;
}