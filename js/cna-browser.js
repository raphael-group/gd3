

var browserW;
var browserH;
var browserHeaderText = 150;
var browserRightAreaW; // -10 for scroll bar
var browserSVG;

var geneBarW = browserRightAreaW;
var geneBarH = 75;
var geneBarSVG;

var highlighted_gene;
var browserViewW = browserRightAreaW;
var browserViewH = browserH - geneBarH;
var browserViewSVG;

var ids = {
 browserContainer: 'browserContainer',
 browserHeaderContainer: 'browserHeaderContainer',
 browserRightAreaContainer: 'browserRightAreaContainer',
 browserViewContainer: 'browserViewContainer',
 container : 'cnas-svg',

 geneBarContainer: 'geneBarContainer',
 geneBarSVG: 'geneBarSVG',
 browserViewSVG: 'browserView',
 headerInfoContainer: 'headerInfoContainer',
 rangeInfoContainer: 'rangeInfoContainer',

 browserLeftAreaGenes: 'browserLeftAreaGenes'
}

var style = null;
var seg = {};
var sample2ty = {};
var region = {};
var geneJSON = null;
var segJSON = new Array();
var seg_label = {};
var cliqJSON = null;
var maxpeakJSON = new Array();
var cliqUniCNA = {};
var cliqUpCNA = {};
var cliqDownCNA = {};
var weightedSeg = {};
var patOrder = new Array();
var cliqColor = {};
var peakLabel = {};
var chrm = "";
var typeCNA = "";
var samplelst = new Array();
var tmpwSegY = 0;
var init_intervalH = 50;

var xDomainStart = 0;
var xDomainEnd = browserViewW;
var allmin = 0;
var allmax = 0;
var genomeHeight = 25;
var intervalH = 7;
var x, xAxis, zoom, svg;
var genes, geneLabels, genome, geneGroups, intervals, ints;
function set_s2ty(in_sample2ty){
  sample2ty = in_sample2ty;
}
    
function cna_browser(el, in_sample2ty, selectedG, gene, cliq, in_seg, in_region, in_style){
  // Convert existing gene data into a JSON object
  seg = in_seg; 
  style = in_style
  , cna_style = style.cnabrowser
  , sampleType2color = style.global.colorSchemes.sampleType || {}
  , global_color = style.global

  region = in_region;
  sample2ty = in_sample2ty;
  width = cna_style.width;

  geneJSON = gene.map(function(d) {
    return { 'fixed':d[2]==selectedG ? true: false , 'x0':d[0], 'x1':d[1], 'label':d[2], 'selected':d[2]==selectedG ? true: false };
  });

  cliqJSON = cliq.map(function(d) {
    return { 'x0':d[0], 'x1':d[1], 'color':d[2], 'label':d[3]};
  });
  
  for (var i = 0; i < cliq.length; i++){
    cliqColor[cliq[i][3]] = cliq[i][2];    
  }
  
  var segHCount = init_intervalH;
  samplelst = new Array();
  for (var i = 0; i < seg.length; i++){
    segHCount+=intervalH;
    samplelst.push(seg[i]['pat']);
    for (var j = 0; j < seg[i]['seg'].length; j++){
      segJSON.push({'x0':seg[i]['seg'][j]['x0'], 'x1':seg[i]['seg'][j]['x1'], 'label': seg[i]['seg'][j]['label'], 'y': segHCount, 'pat': seg[i]['pat']});                
      //seg_label[seg[i]['seg'][j]['label']] = {'x0':seg[i]['seg'][j]['x0'], 'x1':seg[i]['seg'][j]['x1'], 'y': segHCount};
      //wSegY.unshift({});
    }
  }

  tmpwSegY = segHCount;
  segHCount += 23

  allmin = region[0];
  allmax = region[1]
  
  //wSegY.push({'x0': allmin, 'x1':allmax, 'y':tmpwSegY});        


  typeCNA = region[3];
  chrm = region[2];
  
  browserW = width;
  browserH = tmpwSegY + 10 + geneBarH;
  
  browserRightAreaW = browserW - 310; // -10 for scroll bar
  
  geneBarW = browserRightAreaW;
  browserViewW = browserRightAreaW;
  browserViewH = browserH - geneBarH;

  var div_browserContainer = document.createElement('div'),
  //var div_browserContainer = el.append('div')
      div_browserHeaderContainer = document.createElement('div'),
      div_browserInfoContainer = document.createElement('div'),

      div_browserLeftAreaContainer = document.createElement('div'),
      div_browserRightAreaContainer = document.createElement('div'),
      div_browserViewContainer = document.createElement('div'),

      div_rangeInfoContainer = document.createElement('div'),
      div_geneBarContainer = document.createElement('div'),
      div_headerInfoContainer = document.createElement('div');


  div_browserContainer.setAttribute('id', ids.browserContainer);
  div_browserHeaderContainer.setAttribute('id', ids.browserHeaderContainer);
  div_browserRightAreaContainer.setAttribute('id', ids.browserRightAreaContainer);
  div_browserViewContainer.setAttribute('id', ids.browserViewContainer);
  div_geneBarContainer.setAttribute('id', ids.geneBarContainer);
  div_headerInfoContainer.setAttribute('id', ids.headerInfoContainer);
  div_rangeInfoContainer.setAttribute('id', ids.rangeInfoContainer);

  div_browserContainer.appendChild(div_browserHeaderContainer);
  div_browserContainer.appendChild(div_browserInfoContainer);
  div_browserContainer.appendChild(div_browserRightAreaContainer); // container for drawing intervals
  div_browserHeaderContainer.appendChild(div_headerInfoContainer);
  div_browserHeaderContainer.appendChild(div_rangeInfoContainer);
  div_browserHeaderContainer.appendChild(div_geneBarContainer);
  
  
  var fullBrowserH = browserH+1,
      leftBrowserH = browserH - geneBarH;

  document.getElementById(ids.container).setAttribute("style", "height:"+fullBrowserH+"px");
  document.getElementById(ids.container).setAttribute("style", "width:"+browserW+"px");
  div_browserContainer.setAttribute("style", "width:" + browserW + "px");
  div_browserContainer.setAttribute("style", "height:" + fullBrowserH + "px");
  div_browserContainer.setAttribute("style", "float:left");
  div_browserRightAreaContainer.setAttribute("style", "width:" + browserRightAreaW + "px");
  div_browserRightAreaContainer.setAttribute("style", "height:" + leftBrowserH + "px");

  document.getElementById(ids.container).appendChild(div_browserContainer);
  

  BrowserHeader();    
  BrowserInfo(el, samplelst);
  BrowserView('#' + ids.browserRightAreaContainer); 
    
}

////////////////////////////////////////////////////////////////////////////
// Copy Number View
function BrowserHeader() {
  d3.select('#'+ids.rangeInfoContainer);
  var divRange = document.getElementById(ids.rangeInfoContainer);
  divRange.setAttribute("style","width:" + 4*browserHeaderText + "px");  
  d3.select('#'+ids.rangeInfoContainer).text("Chromosome: "+ chrm + ", Start-End: " +allmin + "-" + allmax);  
}

function BrowserInfo(el, samplelst) {
  var mutationRectWidth = 10
    , legend_font_size = 12
    , left = browserW-100;

    // Add legend SVG
    var mutationLegend = el.append("svg")
        .attr("id", "mutation-legend")
        .attr("width", 200)
        .attr("height", browserH)
        .style("margin-right", 10)        
        .style("float", "left")
        
    mutationLegend.append("text")
        .attr("x", 10)
        .attr("y", 40)
        .style("fill", "#555")
        .style("font-size", legend_font_size)
        .text("Gene");
    mutationLegend.append("text")
        .attr("x", 10)
        .attr("y", 65)
        .style("fill", "#555")
        .style("font-size", legend_font_size)
        .text("Copy number aberrations");

    mutationLegend.selectAll()
      .data(samplelst).enter().append('text')    
      .attr("x", 10)
      .attr("y", function(d,i){return 82.5+i*intervalH})
      .style("fill", "#555")
      .style("font-size", legend_font_size-3)
      .text(function(d){return d});

    left += mutationRectWidth + 10 + 10 + 25;
}

////////////////////////////////////////////////////////////////////////////
// Copy Number View

function BrowserView(divContainer) {
  var maxSegXLoc = region[1];
  var minSegXLoc = region[0];
  var maxSegYLoc = tmpwSegY + 10;

  browserViewSVG = createSvg('browserView', browserViewW, maxSegYLoc,
                              global_color.white, divContainer);
  
  drawGene(minSegXLoc, maxSegXLoc);
  drawSegData(segJSON, minSegXLoc, maxSegXLoc);
  update_gene(d3.min( x.domain() ), d3.max( x.domain() ));
  update_interval(d3.min( x.domain() ), d3.max( x.domain() ));
}

Array.prototype.hasObject = (
	!Array.indexOf ? function (o){
		var l = this.length + 1;
		while (l -= 1){
			if (this[l - 1] === o){
				return true;
			}
		}
    	return false;
	  } : function (o){
		return (this.indexOf(o) !== -1);
	  });

function regenerate(scliq, dcliq, dseg, min, max, dmax){ // using for get intervals inside the selecting/zomming region
   
  var newsegJSON = new Array()
  var newwSegY = new Array()
  var tmp_patOrder_inside = {};

  for (var i = 0; i < seg.length; i++){ // patient
    var hasop = 0;
    for (var j = 0; j < seg[i]['seg'].length; j++){
      
      if (!(min > seg[i]['seg'][j]['x1'] || max < seg[i]['seg'][j]['x0'])){ // inside selected region
        hasop = 1
      }
    }    
    if (hasop == 1){
      tmp_patOrder_inside[i] = '1'
    }
  }
  
  var segHCount = init_intervalH;
  var tmpwSegY = segHCount;

  Object.keys(tmp_patOrder_inside).forEach(function(i) {
    segHCount+=intervalH;
    for (var j = 0; j < seg[i]['seg'].length; j++){
      newsegJSON.push({'x0':seg[i]['seg'][j]['x0'], 'x1':seg[i]['seg'][j]['x1'], 'label': seg[i]['seg'][j]['label'], 'y': segHCount, 'pat': seg[i]['pat']});   
      seg_label[seg[i]['seg'][j]['label']] = {'x0':seg[i]['seg'][j]['x0'], 'x1':seg[i]['seg'][j]['x1'], 'y': segHCount};
      newwSegY.unshift({});
    }
  })
    
  newwSegY.push({'x0': min, 'x1':max, 'y':tmpwSegY});  
  
  return [newsegJSON, newwSegY, segHCount+intervalH];
}

function drawGene(minVal, maxVal){

  var normalize = d3.scale.linear()
        .domain([minVal, maxVal])
        .range([0, browserViewW]);

  genome = svg.append("rect")
        .attr("class", "genome")
        .attr("y", 10)
        .attr("x", 0)
        .attr("width", browserViewW)
        .attr("height", genomeHeight - 10)
        .style("fill", global_color.blockColorLight);

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
        .style('fill', function (d) {return d.selected == true ? global_color.selectedColor : global_color.blockColorMedium;})                          
        .attr('id', function (d, i) { return "gene-" + i; });


   geneLabels = geneGroups.append("text")
            .attr('id', function (d, i) { return "gene-label-" +i; })
            .attr("y", 22.5)
            .attr("text-anchor", "middle")
            .style("fill-opacity", function (d) {return d.selected ==true ? 1:0})
            .style("fill", global_color.textColorStrongest)
            .text(function(d){  return d.label; });

    geneGroups.on("mouseover", function(d, i){
            if (d.fixed == false){
              d3.select(this).selectAll("rect").style("fill", global_color.highlightColor)
              svg.select("#gene-label-" + i).style("fill-opacity", 1)
            }
        })
        .on("mouseout", function(d, i){
            if (d.fixed == false){
              d3.select(this).selectAll("rect").style("fill", function (d) {return d.selected == true ? global_color.selectedColor : global_color.blockColorMedium;})
              svg.select("#gene-label-" + i).style("fill-opacity", 0)
            }
        })
        .on("dblclick", function(d, i){
          d.fixed = d.fixed ? false : true;  
          if (d.fixed == true){ 
            d3.select(this).selectAll("rect").style("fill", function (d) {return d.selected == true ? global_color.selectedColor : global_color.highlightColor;})       
            svg.select("#gene-label-" + i).style("fill-opacity", 1)
          }          
        });
}
function drawSegData(dataSrc, minVal, maxVal) {
  // Normalize a gene location value for positioning in the gene mark bars
  function normalize(d, min, max) {
    var norm = d3.scale.linear().domain([min, max]).range([0, browserViewW]);
    return norm(d);
  }

  function setX(w){
    return w < 1? 1: w/2;
  }
  var Px = {}
  , Py = {};
  
  intervals = svg.selectAll('.intervals')
    .data(dataSrc)
    .enter().append('g')
      .attr("class", "intervals")
  
  ints = intervals.append('rect')    
      .attr('fill', function(d){return sampleType2color[sample2ty[d.pat]]})
      .attr('width', function(d) {
          return normalize(d.x1, minVal, maxVal) - normalize(d.x0, minVal, maxVal);
        })
      .attr('height', 5)
      .attr('id', function (d, i) { return "interval-"+i; });      
}


////////////////////////////////////////////////////////////////////////////
// Left Bar
function ColorLuminance(hex, lum, op) {
  // validate hex string
  //hex = String(hex).replace(/[^0-9a-f]/gi, '');
  thex = hex.slice(5,-1).split(",");
  //alert(thex[0]);
  lum = lum || 0;
  // convert to decimal and change luminosity
  var rgb = "rgba(", c, i;
  //var rgb = "#", c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(thex[i]);
    //alert(c);
    //c2 = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255));
    //alert(c);
    //console.log(c2);
    thex[i] = c//("00"+c).substr(c.length);
  }  
  return rgb + thex[0] + "," + thex[1] + "," + thex[2] + ", " + op+")";
  //return rgb + thex[0] + thex[1] + thex[2];
}


////////////////////////////////////////////////////////////////////////////
// Utility Functions

function createSvg(c, width, height, in_color, targetId) { // {string} className, width, height
  
  var start = allmin
    , stop = allmax;

    x = d3.scale.linear()
        .domain([start, stop])
        .range([0, browserViewW]);

    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5)
        .tickSize(0)
        .tickPadding(1.25);

    // Defining zoom behavior with D3's built-in zoom functionality
    zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 100])
        .on("zoom", function(){ update(svg); });
	svg = d3.select(targetId).append('svg')
              .attr('class', c)
      		    .attr('height', height)
              .attr('width', width)
    	      	.style('background', in_color)
    	      	.style('display', 'block')
    		      .style('height', height)
    	      	.style('width', width)
              .call(zoom).on("dblclick.zoom", null);

    var background = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "background")
        .style("fill", global_color.bgColor);
    return svg ;
}

function update(){
  d3.select('#'+ids.rangeInfoContainer).text("Chromosome: "+ chrm + ", Start-End: " + parseInt(d3.min( x.domain() )) + "-" +  parseInt(d3.max( x.domain()) ));
  var curMin = d3.min( x.domain() )
  , curMax = d3.max( x.domain() )
  update_gene(curMin, curMax);
  //drawData(cliqJSON, segJSON, d3.min( x.domain() ), d3.max( x.domain() ), maxpeakJSON, wSegY);
  update_interval(d3.min( x.domain() ), d3.max( x.domain() ));
}

function update_interval(curMin, curMax){
  
  var normalize = d3.scale.linear()
        .domain([curMin, curMax])
        .range([0, browserViewW]);
  

  ints.attr("transform", function(d, i){
            return "translate(" + normalize(d.x0) + "," + d.y + ")"
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
function update_gene(curMin, curMax){
  var normalize = d3.scale.linear()
        .domain([curMin, curMax])
        .range([0, browserViewW]);
  
  genes.attr("transform", function(d, i){
            return "translate(" + normalize(d.x0) + "," + 5 + ")"
        });

  genes.attr("width", function(d, i){ return normalize(d.x1) - normalize(d.x0); });
        
  geneLabels.attr("x", function(d, i){
                // place the label in the center of whatever portion of the domain is shown
                var x1 = d3.max( [d.x0, curMin] )
                ,   x2 = d3.min( [d.x1, curMax] );
                return x(x1 + (x2-x1)/2);
    })
}