//constants

const unitSquareSize = 20;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const map = {
  "vertices": [
    { "id": 0, "name": "A", "x": 100, "y": 100, "type": "land"},
    { "id": 1, "name": "B", "x": 200, "y": 200, "type": "land"},
    { "id": 2, "name": "C", "x": 300, "y": 100, "type": "land"}
  ],
  "edges": [
    { "from": 0, "to": 1 },
    { "from": 1, "to": 2 },
    { "from": 2, "to": 0 }
  ]
};

let playerCountry = "GER";

const initialState = {
    "units": [
        { "country": "GER", "type": "army", "vertexId": 0}
    ]
}

let state = initialState;

const vertexSideLength = 40;

let orders = [];

//functions

function drawMap(map) {
  // Draw edges
  for (let edge of map.edges) {
    const fromVertex = map.vertices.find(vertex => vertex.id === edge.from);
    const toVertex = map.vertices.find(vertex => vertex.id === edge.to);
    ctx.beginPath();
    ctx.moveTo(fromVertex.x, fromVertex.y);
    ctx.lineTo(toVertex.x, toVertex.y);
    ctx.stroke();
  }

  // Draw vertices
  for (let vertex of map.vertices) {
    ctx.strokeStyle = 'black'; // set stroke color to black
    ctx.lineWidth = 2; // set stroke width to 2 pixels
    ctx.strokeRect(vertex.x - vertexSideLength/2, vertex.y - vertexSideLength/2, vertexSideLength, vertexSideLength); // draw a rectangular border
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(vertex.name, vertex.x, vertex.y-25);
  }
}

function drawUnits() {
    var changes = getChanges();

    for (let unit of state.units) {
        for (let vertex of map.vertices) {
            if (vertex.id === unit.vertexId) {
                let size = 20;
                ctx.fillStyle = "red";
                ctx.fillRect(vertex.x-unitSquareSize/2, vertex.y-unitSquareSize/2, unitSquareSize, unitSquareSize);
            }
        }
    }
}

function getChanges() {
    var hash = window.location.hash;
    if (hash) {
        var hashSplit = hash.split('#')[1].split('/');

        for (var change of hashSplit) {
            var changeSplit = change.split('.');
    
        }
    }
}

function getClickedVertexId(mouseX, mouseY) {
    for (let vertex of map.vertices) {
        if ((vertex.x - vertexSideLength/2) < mouseX && mouseX < (vertex.x + vertexSideLength/2) && (vertex.y - vertexSideLength/2) < mouseY && mouseY < (vertex.y + vertexSideLength/2)) {
            return vertex.id;
        }
    }
}

function getFriendlyUnitOnVertex(vertexId) {
    for (let unit of state.units) {
        if (unit.vertexId === vertexId && unit.country === playerCountry) {
            return unit;
        }
    }
    return false;
}

function selectCountry(countryName) {
    playerCountry = countryName;
}

function areAdjacent(vertexA, vertexB) {
    for (let vertexPair of map.edges) {
        if ((vertexPair.from === vertexA && vertexPair.to === vertexB) || (vertexPair.to === vertexA && vertexPair.from === vertexB)) {
            return true;
        }
    }
    return false;
}

drawMap(map);
drawUnits();

window.onhashchange = function() {
    // Handle the URL hash change event here
    console.log("The URL hash has changed to: " + window.location.hash);
};

let action = "";
let actionVertex = -1;

canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let vertexId = getClickedVertexId(mouseX, mouseY);
    let friendlyUnit = getFriendlyUnitOnVertex(vertexId)
    if (friendlyUnit) {
        action = friendlyUnit.country + ": " + friendlyUnit.type + " ";
        actionVertex = friendlyUnit.vertexId;
    }
    else if (action ) {
        if (areAdjacent(actionVertex, vertexId)) {
            action += actionVertex + " -> " + vertexId;
            document.getElementById("ordersString").innerText += action + "\n";
        }

        action = "";
        actionVertex = -1;
    }
});