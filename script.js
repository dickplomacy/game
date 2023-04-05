//constants

const unitSquareSize = 20;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const map = {
  "vertices": [
    { "name": "Bel", "x": 150, "y": 150, "type": "land"},
    { "name": "Bur", "x": 200, "y": 300, "type": "land"},
    { "name": "Hel", "x": 250, "y": 50, "type": "sea"},
    { "name": "Hol", "x": 200, "y": 100, "type": "land"},
    { "name": "Kie", "x": 300, "y": 100, "type": "land"},
    { "name": "Nth", "x": 150, "y": 50, "type": "sea"},
    { "name": "Pic", "x": 50,  "y": 250, "type": "land"},
    { "name": "Ruh", "x": 300, "y": 200, "type": "land"},
  ],
  "edges": [
    { "from": "Bel", "to": "Bur" },
    { "from": "Bel", "to": "Hol" },
    { "from": "Bel", "to": "Pic" },
    { "from": "Bel", "to": "Ruh" },

    { "from": "Bur", "to": "Pic" },
    { "from": "Bur", "to": "Ruh" },

    { "from": "Hel", "to": "Hol" },
    { "from": "Hel", "to": "Kie" },
    { "from": "Hel", "to": "Nth" },

    { "from": "Hol", "to": "Kie" },
    { "from": "Hol", "to": "Nth" },
    { "from": "Hol", "to": "Ruh" },

    { "from": "Kie", "to": "Ruh" },
  ]
};

let playerCountry = "GER";

const initialState = {
    "units": [
        { "country": "GER", "type": "F", "vertexName": "Kie"},
        { "country": "GER", "type": "A", "vertexName": "Hol"},
        { "country": "FRA", "type": "A", "vertexName": "Bel"},
    ]
}

let state = initialState;

const vertexSideLength = 50;

let orders = [];

//functions

function drawMap(map) {
  // Draw edges
  for (let edge of map.edges) {
    const fromVertex = map.vertices.find(vertex => vertex.name === edge.from);
    const toVertex = map.vertices.find(vertex => vertex.name === edge.to);
    ctx.beginPath();
    ctx.moveTo(fromVertex.x, fromVertex.y);
    ctx.lineTo(toVertex.x, toVertex.y);
    ctx.stroke();
  }

  // Draw vertices
  for (let vertex of map.vertices) {
    let lineWidth = 4;
    ctx.strokeStyle = 'black'; // set stroke color to black
    ctx.lineWidth = lineWidth; // set stroke width to 2 pixels
    ctx.strokeRect(vertex.x - vertexSideLength/2, vertex.y - vertexSideLength/2, vertexSideLength, vertexSideLength); // draw a rectangular border
    if (vertex.type === "land") {
        ctx.strokeStyle = "brown";
    }
    else if (vertex.type === "sea") {
        ctx.strokeStyle = "teal";
    }
    ctx.strokeRect(vertex.x - vertexSideLength/2 + lineWidth, vertex.y - vertexSideLength/2 + lineWidth, vertexSideLength - 2*lineWidth, vertexSideLength - 2*lineWidth); // draw a rectangular border
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(vertex.name, vertex.x, vertex.y-15);
  }
}

function drawUnits() {
    var changes = getChanges();

    for (let unit of state.units) {
        for (let vertex of map.vertices) {
            if (vertex.name === unit.vertexName) {
                if (unit.country === "GER") {
                    ctx.fillStyle = "red";
                }
                else if (unit.country === "FRA") {
                    ctx.fillStyle = "blue";
                }

                if (unit.type === "A") {
                    ctx.fillRect(vertex.x-unitSquareSize/2, vertex.y-unitSquareSize/2, unitSquareSize, unitSquareSize);

                }
                else if (unit.type === "F") {
                    ctx.fillRect(vertex.x-unitSquareSize, vertex.y-unitSquareSize/4, unitSquareSize*2, unitSquareSize/2);
                }
            }
        }
    }
}

function getChanges() {
    var hash = window.location.hash;
    if (hash) {
        var hashSplit = hash.split('#')[1];

        return hashSplit;
    }
}

function getClickedvertexName(mouseX, mouseY) {
    for (let vertex of map.vertices) {
        if ((vertex.x - vertexSideLength/2) < mouseX && mouseX < (vertex.x + vertexSideLength/2) && (vertex.y - vertexSideLength/2) < mouseY && mouseY < (vertex.y + vertexSideLength/2)) {
            return vertex.name;
        }
    }
}

function getFriendlyUnitOnVertex(vertexName) {
    for (let unit of state.units) {
        if (unit.vertexName === vertexName && unit.country === playerCountry) {
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

function addOrder(unit, action, originVertex, destinationVertex) {
    for (let order of orders) {
        if (order.origin === originVertex) {
            orders.pop();
        }
    }
    orders.push({"country": playerCountry, "unitType": unit.type, "action": action, "origin": originVertex, "destination": destinationVertex});
}

drawMap(map);
drawUnits();

window.onhashchange = function() {
    // Handle the URL hash change event here
    console.log("The URL hash has changed to: " + window.location.hash);
};

let action = "";
let actionVertex = -1;
let actionUnit = {};

canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let vertexName = getClickedvertexName(mouseX, mouseY);
    let friendlyUnit = getFriendlyUnitOnVertex(vertexName)
    if (friendlyUnit) {
        actionUnit = friendlyUnit;
        action = friendlyUnit.country + ": " + friendlyUnit.type + " ";
        actionVertex = friendlyUnit.vertexName;
    }
    else if (action ) {
        if (areAdjacent(actionVertex, vertexName)) {
            action += actionVertex + " -> " + vertexName;

            addOrder(actionUnit, "move", actionVertex, vertexName);
            document.getElementById("ordersString").innerText += action + "\n";
        }

        action = "";
        actionVertex = -1;
        actionUnit = {};
    }
});