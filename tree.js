let selected = {
  idInternal: 10,
  idtListener: function(val) {},
  set id(val) {
    this.idInternal = val;
    this.idListener(val);
  },
  get id() {
    return this.idInternal;
  },
  registerListener: function(listener) {
    this.idListener = listener;
  }
}

function parseNewick(a){
  for(var e=[], r={}, s=a.split(/\s*(;|\(|\)|,|:)\s*/), t=0;t<s.length;t++) {
    var n=s[t];
    switch(n) {
      case "(": 
        var c={};
        r.branchset=[c],
        e.push(r),
        r=c;
      break;

      case",":
        var c={};
        e[e.length-1].branchset.push(c),
        r=c;
      break;

      case")":
        r=e.pop();
      break;

      case":":
      break;

      default:
        var h=s[t-1];
        ")"==h||"("==h||","==h ? r.name = n:":"==h&&(r.length = parseFloat(n))
    }
  }
        return r;
}


// d3.json("data/flare.json")
d3.text("data/fdha_tree.nwk")
  .then(function(data) {

  // Dimension of tree
  const width = 600;
  // The height of the tree is set by node_dx in the tree function

  // Parse newick tree 
  const rawData = parseNewick(data);

  // Function to formate data into hierarchy
  let tree = (data, node_dx) => {
    const root = d3.hierarchy(parseNewick(data), function(d) { return d.branchset; })
                    .sum(d => d.branchset ? 0 : 1)
                    .sort((a, b) => {(a.value - b.value) || d3.ascending(a.data.length, b.data.length);});
  
    root.dx = node_dx;
    root.dy = width / (root.height + 1);
    return d3.cluster().nodeSize([root.dx, root.dy])(root);
  }


  // Hierarchical data
  const root = tree(data, 6);

  // root.data.length controls the length of the root?
  // Calculate length property of each node
  // by cumulative summing branch length
  setLength(root, root.data.length = 0, width / maxLength(root));


  // Find smallest (x0) and largest (x1) x assigned to nodes in root
  let x0 = Infinity;
  let x1 = -x0;
  root.each(d => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  // Create an svg element of size [width, size of cluser + 2 margin left]
  const svg = d3.select("#tree")
                .append("svg")
                .attr("width", width)
                .attr("height", x1 - x0 + root.dy)
                .style("width", "100%");
                // .style("height", "auto");

  // add group and translate to where?
  const g = svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`); 

  // Draw the branches
  const link = g.append("g")
                .attr("fill", "none")
                .attr("stroke", "#555")
                .attr("stroke-opacity", 1)
                .attr("stroke-width", 1.5)
                .selectAll("path")
                  .data(root.links())
                  .join("path")
                  .each(function(d) {d.target.linkNode = this;})
                    .attr("d", d => `
                      M${d.target.radius},${d.target.x}
                      L${d.source.radius},${d.target.x}
                      L${d.source.radius},${d.source.x}
                      `)

  // Draw wider invisible branches to help 
  // with mouse hover
  const fatlink = g.append("g")
                    .attr("fill", "none")
                    .attr("stroke-width", 15)
                    .attr("stroke", "gray")
                    .attr("opacity", 0)
                    .selectAll("path")
                      .data(root.links())
                      .join("path")
                      .each(function(d) {d.target.fatLinkNode = this;})
                        .attr("d", d => `
                          M${d.target.radius},${d.target.x}
                          L${d.source.radius},${d.target.x}
                          L${d.source.radius},${d.source.x}
                          `)
                        // .on("mouseover", link_over(true))
                        // .on("mouseout", link_over(false))


  // Create leaf nodes
  const node = g.append("g")
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", 3)
                .selectAll("g")
                .data(root.leaves())
                .join("g")
                  .attr("transform", d => `translate(${d.radius},${d.x})`);

  // Draw leaves
  node.append("text")
      .attr("class", "tree-leaf")
      .attr("font-size", 9)
      .attr("dy", "0.31em")
      .attr("x", 6)
      .text(d => d.data.name)
      .text(function(d) { return d.data.name.replace(/^FdhA_/g, ""); });
      // .on("mouseover", label_mouseover(true))
      // .on("mouseout", label_mouseover(false));


  // One-way selection: heatmap => tree
  selected.registerListener(function(s) {
    node.selectAll("text")
      .classed("active-leaf", d => s.includes(d.data.name.replace(/^FdhA_/g, "")));

});
  

  // Set the radius of each node by recursively summing and scaling the distance from the root.
  function setLength(d, y0, k) {
    d.radius = (y0 += d.data.length) * k;
    if (d.children) d.children.forEach(function(d) { setLength(d, y0, k); });
  }

  // Compute the maximum cumulative length of any node in the tree.
  function maxLength(d) {
    return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);
  }


  function label_mouseover(active) {
    return function(d) {
      d3.select(this).classed("active-leaf", active);
    };
  }

  function link_over(active) {
    return function(d) {
      d3.select(d.target.linkNode).classed("active-link", active);
      d.target.each(d => d3.select(d.linkNode).classed("active-link", active));
    };
  }


  })