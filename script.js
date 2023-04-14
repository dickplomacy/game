//constants

const unitSquareSize = 20;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const map = {
  "vertices": [
    { "name": "Bel", "x": 150, "y": 150, "type": "coast"},
    { "name": "Bur", "x": 200, "y": 300, "type": "land"},
    { "name": "Hel", "x": 250, "y": 50, "type": "sea"},
    { "name": "Hol", "x": 200, "y": 100, "type": "coast"},
    { "name": "Kie", "x": 300, "y": 100, "type": "coast"},
    { "name": "Nth", "x": 150, "y": 50, "type": "sea"},
    { "name": "Pic", "x": 50,  "y": 250, "type": "coast"},
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
        { "country": "GER", "type": "F", "vertexName": "Hol"},
        { "country": "GER", "type": "A", "vertexName": "Ruh"},
        { "country": "FRA", "type": "A", "vertexName": "Bel"},
    ],
    "latestOrders": {}
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
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black'; // set stroke color to black
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
    if (vertex.type === "land" || vertex.type === "coast") {
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
    var changes = getState();

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

function getState() {
    var hash = window.location.hash;
    if (hash) {
        var hashSplit = hash.split('#')[1];

        return hashSplit;
    }
}

function getClickedVertex(mouseX, mouseY) {
    for (let vertex of map.vertices) {
        if ((vertex.x - vertexSideLength/2) < mouseX && mouseX < (vertex.x + vertexSideLength/2) && (vertex.y - vertexSideLength/2) < mouseY && mouseY < (vertex.y + vertexSideLength/2)) {
            return vertex;
        }
    }
}

function getFriendlyUnitOnVertex(vertex) {
    for (let unit of state.units) {
        if (unit.vertexName === vertex.name && unit.country === playerCountry) {
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
        if ((vertexPair.from === vertexA.name && vertexPair.to === vertexB.name) || (vertexPair.to === vertexA.name && vertexPair.from === vertexB.name)) {
            return true;
        }
    }
    return false;
}

function addOrder(unit, action, originVertex, destinationVertex) {
    for (let i = 0; i < orders.length; i++) {
        if (orders[i].origin.name === originVertex.name) {
            orders.splice(i, 1);
        }
    }

    orders.push({"country": playerCountry, "unitType": unit.type, "action": action, "origin": originVertex, "destination": destinationVertex});
    document.getElementById("ordersString").innerText = ordersAsString();
}

function validMove(unit, destinationVertex) {
    if ((destinationVertex.type === "land" && unit.type === "F") 
    || (destinationVertex.type === "sea") && unit.type === "A") {
        return false;
    }
    else {
        return true;
    }
}

function resolveOrders() {
    resolveSupport();

    if (orders) {
        for (var order of orders) {   
            performMoveOrder(order);
        }

        state.latestOrders = orders;
        ctx.clearRect(0,0,400,400);
        drawMap(map);
        drawUnits();
        document.getElementById("latestOrders").innerText = ordersAsString();
        orders = [];
        document.getElementById("ordersString").innerText = ordersAsString();
    }
}

function resolveSupport() {
    for (let order of orders) {
        if (order.action === "support") {
            //asd;
        }
    }
}

function destinationIsContested(order) {
    return false;
}

function hasEnoughSupport(order) {
    return false;
}

function getOrderAtVertex(vertex) {
    for (let order of orders) {
        if (order.origin.name === vertex.name) {
            return order;
        }
    }

    return {};
}

function performMoveOrder(order) {
    if (order.action === "move") {
        if (areAdjacent(order.origin, order.destination) || isConvoyed(order)) {
            if ((destinationIsContested(order) &&
                hasEnoughSupport(order)) ||
                !destinationIsContested(order)) {
            }
            for (unit of state.units) {
                if (unit.country === order.country &&
                    unit.type === order.unitType &&
                    unit.vertexName === order.origin.name
                ) {
                    unit.vertexName = order.destination.name;
                }
            }
        }
    }
}

function isConvoyed(order) {
    return false;
}

function ordersAsString() {
    let result = "";
    if (orders) {
        console.log(orders);
        for (let order of orders) {
            result += order.country + ": " + order.unitType + " " + order.origin.name;

            if (order.action === "hold") {
                result += " H";
            }
            else if (order.action === "move") {
                result += " -> " + order.destination.name;
            }
            else if (order.action === "support") {
                let orderToSupport = getOrderAtVertex(order.destination);
                result += " S (" + orderToSupport.unitType + " " + orderToSupport.origin.name;
                if (orderToSupport.action === "move") {
                    result += " -> " + orderToSupport.destination.name + ")";
                }
            }
            else if (order.action === "convoy") {
                result += " C " + order.destination.name;
            }

            result += "\n";
        }
    }
    return result;
}

drawMap(map);
drawUnits();

window.onhashchange = function() {
    // Handle the URL hash change event here
    console.log("The URL hash has changed to: " + window.location.hash);
};

let action = "";
function setAction (actionInput) {
    action = actionInput;
    setButtonColors();
    if (action === "hold") {
        document.getElementById("holdbutton").style.backgroundColor = "red";
    }
    else if (action === "move") {
        document.getElementById("movebutton").style.backgroundColor = "red";
    }
    else if (action === "support") {
        document.getElementById("supportbutton").style.backgroundColor = "red";
    }
    else if (action === "convoy") {
        document.getElementById("convoybutton").style.backgroundColor = "red";
    }
}

function setButtonColors() {
    document.getElementById("holdbutton").style.backgroundColor = "pink";
    document.getElementById("movebutton").style.backgroundColor = "pink";
    document.getElementById("supportbutton").style.backgroundColor = "pink";
    document.getElementById("convoybutton").style.backgroundColor = "pink";
}

let orderInProgress = false;
let unitOriginVertex = -1;
let actionUnit = {};
let friendlyUnit = {};

canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let clickedVertex = getClickedVertex(mouseX, mouseY);
    
    friendlyUnit = getFriendlyUnitOnVertex(clickedVertex)

    if (friendlyUnit && !orderInProgress) {
        if (action === "hold") {
            addOrder(friendlyUnit, "hold", clickedVertex, "");
        }
        else {
            orderInProgress = true;
            unitOriginVertex = clickedVertex;
            actionUnit = friendlyUnit;
        }
    }
    else if (orderInProgress) {
        if (action === "move") {
            if (validMove(actionUnit, clickedVertex)) {
                addOrder(actionUnit, "move", unitOriginVertex, clickedVertex);
            }
        }
        else if (action === "support") {
            let orderToSupport = getOrderAtVertex(clickedVertex);
            if (orderToSupport && areAdjacent(unitOriginVertex, orderToSupport.destination) && validMove(actionUnit, orderToSupport.destination)) {
                addOrder(actionUnit, "support", unitOriginVertex, clickedVertex);
            }
        }
        else if (action === "convoy") {

        }

        orderInProgress = false;
        unitOriginVertex = -1;
        actionUnit = {};
    }




/*
    else if (friendlyUnit && !orderInProgress) {
        actionUnit = friendlyUnit;
        orderInProgress = friendlyUnit.country + ": " + friendlyUnit.type + " ";
        actionOriginVertex = friendlyUnit.vertexName;
    }
    else if (orderInProgress) {
        if (action === "move") {
            
        }
        else if (action === "support") {
            
        }
        else if (action === "convoy") {
            
        }

        orderInProgress = "";
        actionOriginVertex = "";
        actionUnit = {};
    }

    
    if (friendlyUnit && !action) {
        actionUnit = friendlyUnit;
        action = friendlyUnit.country + ": " + friendlyUnit.type + " ";
        actionOriginVertex = friendlyUnit.vertexName;
    }
    else if (action) {
        if (areAdjacent(actionOriginVertex, vertex.name)) {
            if (friendlyUnit) {
                console.log("asdasd");
            }
            if (validMove(actionUnit, vertex)) {
                addOrder(actionUnit, "move", actionOriginVertex, vertex.name);
                action += actionOriginVertex + " -> " + vertex.name;
            }
        }
        action = "";
        actionOriginVertex = -1;
        actionUnit = {};
    }

*/

});