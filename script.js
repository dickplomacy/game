const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const graphData = {
  "vertices": [
    { "id": 0, "label": "A", "x": 100, "y": 100 },
    { "id": 1, "label": "B", "x": 200, "y": 200 },
    { "id": 2, "label": "C", "x": 300, "y": 300 }
  ],
  "edges": [
    { "from": 0, "to": 1 },
    { "from": 1, "to": 2 },
    { "from": 2, "to": 0 }
  ]
};

function drawGraph(graph) {
  const vertexRadius = 20;

  // Draw edges
  for (let edge of graph.edges) {
    const fromVertex = graph.vertices.find(vertex => vertex.id === edge.from);
    const toVertex = graph.vertices.find(vertex => vertex.id === edge.to);
    ctx.beginPath();
    ctx.moveTo(fromVertex.x, fromVertex.y);
    ctx.lineTo(toVertex.x, toVertex.y);
    ctx.stroke();
  }

  // Draw vertices
  for (let vertex of graph.vertices) {
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, vertexRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(vertex.label, vertex.x, vertex.y);
  }
}

drawGraph(graphData);
