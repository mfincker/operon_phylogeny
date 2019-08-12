// URL: https://observablehq.com/@d3/cluster-dendrogram
// Title: Cluster Dendrogram
// Author: D3 (@d3)
// Version: 133
// Runtime version: 1

const m0 = {
  id: "b686454b1f3dff84@133",
  variables: [
    {
      inputs: ["md"],
      value: (function(md){return(
md`# Cluster Dendrogram

D3’s [cluster layout](https://github.com/d3/d3-hierarchy/blob/master/README.md#cluster) produces node-link diagrams with leaf nodes at equal depth. These are less compact than [tidy trees](/@d3/tidy-tree), but are useful for dendrograms, hierarchical clustering and [phylogenetic trees](/@mbostock/tree-of-life). See also the [radial variant](/@d3/radial-dendrogram).`
)})
    },
    {
      name: "chart",
      inputs: ["tree","data","d3","DOM","width"],
      value: (function(tree,data,d3,DOM,width)
{
  const root = tree(data);

  let x0 = Infinity;
  let x1 = -x0;
  root.each(d => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  const svg = d3.select(DOM.svg(width, x1 - x0 + root.dx * 2))
      .style("width", "100%")
      .style("height", "auto");

  const g = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`);

  const link = g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
  .selectAll("path")
    .data(root.links())
    .join("path")
      .attr("d", d => `
        M${d.target.y},${d.target.x}
        C${d.source.y + root.dy / 2},${d.target.x}
         ${d.source.y + root.dy / 2},${d.source.x}
         ${d.source.y},${d.source.x}
      `);

  const node = g.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants().reverse())
    .join("g")
      .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
      .attr("fill", d => d.children ? "#555" : "#999")
      .attr("r", 2.5);

  node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -6 : 6)
      .text(d => d.data.name)
    .filter(d => d.children)
      .attr("text-anchor", "end")
    .clone(true).lower()
      .attr("stroke", "white");

  return svg.node();
}
)
    },
    {
      name: "data",
      inputs: ["d3"],
      value: (function(d3){return(
d3.json("https://raw.githubusercontent.com/d3/d3-hierarchy/v1.1.8/test/data/flare.json")
)})
    },
    {
      name: "tree",
      inputs: ["d3","width"],
      value: (function(d3,width){return(
data => {
  const root = d3.hierarchy(data)
      .sort((a, b) => (a.height - b.height) || a.data.name.localeCompare(b.data.name));
  root.dx = 10;
  root.dy = width / (root.height + 1);
  return d3.cluster().nodeSize([root.dx, root.dy])(root);
}
)})
    },
    {
      name: "width",
      value: (function(){return(
932
)})
    },
    {
      name: "d3",
      inputs: ["require"],
      value: (function(require){return(
require("d3@5")
)})
    }
  ]
};

const notebook = {
  id: "b686454b1f3dff84@133",
  modules: [m0]
};

export default notebook;
