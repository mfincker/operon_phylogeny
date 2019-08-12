// 



//Read the data
d3.tsv("data/fdha_heatmap.tsv")
	.then(function(data) {

  ////////////////////////
  // Heatmap dimensions //
  ////////////////////////
  const margin = {top: 80, right: 300, bottom: 300, left: 50},
        width = 700 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

  ////////////////
  // SVG canvas //
  ////////////////
  const svg = d3.select("#heatmap")
                .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                .append("g")
                  .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");


  /////////////////
  // Axis Labels //
  /////////////////

  // X-axis labels
  const id_fdh = d3.nest()
                    .key(d => d.id_fdh)
                  	.rollup(v => v[0].idx_fdh)
                  	.entries(data)
                  	.sort((a,b) => d3.ascending(parseInt(a.value), parseInt(b.value)))
                  	.map(d => d.key);

  // Y-axis labels
  const gene = d3.nest()
                	.key(d => d.name)
                	.rollup(v => v[0].idx_name)
                	.entries(data)
                	.sort((a,b) => d3.ascending(parseInt(a.value), parseInt(b.value)))
                	.map(d => d.key);

  /////////////////
  // Axis scales //
  /////////////////

  // X scale
  const x = d3.scaleBand()
              .range([ 0, width ])
              .domain(id_fdh)
              .padding(0.05);

  // Y scale
  const y = d3.scaleBand()
              .range([ height, 0 ])
              .domain(gene)
              .padding(0.05);

  // Color scale
  const myColor = d3.scaleSequential(d3.extent(data, d => d.n), 
                                     d3.interpolateOranges);

  ////////////////
  // Axis build //
  ////////////////

  // X-axis
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSize(0))
    .selectAll("text")
      .style("font-size", 8)
      .attr("class", "axis")
    	.attr("y", 0)
	    .attr("x", 9)
	    .attr("dy", ".35em")
	    .attr("transform", "rotate(45)")
	    .style("text-anchor", "start");
  
  // Y-axis
  svg.append("g")
    .attr("transform", "translate(" + width + ", 0)")
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll("text")
      .style("font-size", 10)
      .attr("class", "axis")
    	.attr("dx", 9)
	    .style("text-anchor", "start");

  ///////////////////
  // Heatmap build //
  ///////////////////

  svg.append("g")
      .attr("class", "g3")
      .selectAll(".square")
      .data(data)
      .enter()
      .append("rect")
        .attr("x", function(d) { return x(d.id_fdh) })
        .attr("y", function(d) { return y(d.name) })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .attr("class", "cell")
        .style("fill", "#626872")
        .style("stroke-width", 1)
        .style("opacity", 0.8);
  //   .on("mouseover", cellHover(true))
  // //   .on("mousemove", mousemove)
  //   .on("mouseleave", cellHover(false))

  function cellHover(active) {
        return function(d) {

      d3.select(this).classed("colhover", active);

      const curr_col = d3.select(this).datum().id_fdh;

      d3.selectAll(".cell")
        .filter(d => d.id_fdh === curr_col)
        .classed("colhover", active);
      }

  }

  ///////////
  // BRUSH //
  ///////////

  // Define brush
  let brush = d3.brushX()
                .on("brush", brushed)
                .extent([[0, 0], [width, height]]);

  // Invert band scale
  function scaleBandInvert(scale) {
    var domain = scale.domain();
    var paddingOuter = scale(domain[0]);
    var eachBand = scale.step();
    return function (value) {
      var index = Math.floor(((value - paddingOuter) / eachBand));
      return domain[Math.max(0,Math.min(index, domain.length-1))];
    }
  }


  function brushed() {

    if (d3.event.sourceEvent.type === "brush") {
      // console.log("in weird brush section")
      return;
    }

    if (d3.event.selection) {

      // Snap brush to cell edges
      const [x0, x1] = d3.event.selection;
      const b0 = d3.selectAll(".cell")
                  .filter(d => (x0 >= x(d.id_fdh) - x.padding()/2 
                                && x0 < x(d.id_fdh) + x.bandwidth() + x.padding()/2 ))

      const b0x = b0.empty() ? 0 : x(b0.datum().id_fdh);

      const b1 = d3.selectAll(".cell")
                  .filter(d => (x1 >= x(d.id_fdh) - x.padding()/2  
                                && x1 < x(d.id_fdh) + x.bandwidth() + x.padding()/2 ))

      
      const b1x = b1.empty() ? width : x(b1.datum().id_fdh);
      // console.log(`${b0x}, ${b1x}`);

      const dRangeX = d3.event.selection.map(scaleBandInvert(x));
      console.log(dRangeX);

      d3.select(this).call(d3.event.target.move, 
                           [x(dRangeX[0]) - x.padding()/3, x(dRangeX[1]) + x.step()]);


      // Make sure we are removing brush if selection isn't large enough
      // if (x1 - x0 > x.bandwidth()/5) {
      const c = d3.selectAll(".cell")
                  .classed("brushed", d => (x(dRangeX[0]) - x.padding()/2 < x(d.id_fdh) 
                                            && x(dRangeX[1]) + x.padding()/2 > x(d.id_fdh)));

      // Gene ids of selected cells
      const ids = [... new Set(d3.selectAll(".cell.brushed").data().map(e => e.id_fdh))];
      
      // Update selection object
      selected.id = ids;

      // Update brushed labels
      d3.selectAll("text.axis")
        .classed("brushed", d => ids.includes(d));


      // }

    } else {
      // Reset selection
      d3.selectAll(".brushed")
        .classed("brushed", false);

      selected.id = [];
    }
  } // end of function brushed()




  // Initialize brush
  svg.append("g")
    .attr("class", "brush")
    .call(brush);
  

});