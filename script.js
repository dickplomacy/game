//constants

const unitSquareSize = 20;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let w = canvas.width/100; //map width percentage
let h = canvas.height/100; //map height percentage
    
const map = {
  "vertices": [
    { "name": "Adr", "x": 51, "y": 76, "type": "sea"},
    { "name": "Aeg", "x": 66, "y": 89, "type": "sea"},
    { "name": "Alb", "x": 57, "y": 81, "type": "coast"},
    { "name": "Ank", "x": 80, "y": 77, "type": "coast"},
    { "name": "Apu", "x": 52, "y": 81, "type": "coast"},
    { "name": "Arm", "x": 90, "y": 77, "type": "coast"},
    { "name": "Bal", "x": 54, "y": 42, "type": "sea"},
    { "name": "Bar", "x": 70, "y": 10, "type": "sea"},
    { "name": "Bel", "x": 35, "y": 55, "type": "coast"},
    { "name": "Ber", "x": 47, "y": 52, "type": "coast"},
    { "name": "Bla", "x": 80, "y": 70, "type": "sea"},
    { "name": "Boh", "x": 49, "y": 60, "type": "land"},
    { "name": "Bot", "x": 56, "y": 37, "type": "sea"},
    { "name": "Bre", "x": 25, "y": 61, "type": "coast"},
    { "name": "Bud", "x": 59, "y": 66, "type": "land"},
    { "name": "Bul", "x": 65, "y": 76, "type": "coast"},
    { "name": "Bur", "x": 35, "y": 64, "type": "land"},
    { "name": "Cly", "x": 25, "y": 37, "type": "coast"},
    { "name": "Con", "x": 71, "y": 79, "type": "coast"},
    { "name": "Den", "x": 44, "y": 45, "type": "coast"},
    { "name": "Eas", "x": 75, "y": 92, "type": "sea"},
    { "name": "Edi", "x": 29, "y": 41, "type": "coast"},
    { "name": "Eng", "x": 24, "y": 56, "type": "sea"},
    { "name": "Fin", "x": 60, "y": 30, "type": "coast"},
    { "name": "Gal", "x": 61, "y": 59, "type": "land"},
    { "name": "Gas", "x": 26, "y": 69, "type": "coast"},
    { "name": "Gre", "x": 61, "y": 85, "type": "coast"},
    { "name": "Hel", "x": 39, "y": 47, "type": "sea"},
    { "name": "Hol", "x": 37, "y": 51, "type": "coast"},
    { "name": "Ion", "x": 55, "y": 91, "type": "sea"},
    { "name": "Iri", "x": 20, "y": 51, "type": "sea"},
    { "name": "Kie", "x": 42, "y": 52, "type": "coast"},
    { "name": "Lon", "x": 30, "y": 53, "type": "coast"},
    { "name": "Lpl", "x": 26, "y": 45, "type": "coast"},
    { "name": "Lvn", "x": 62, "y": 42, "type": "coast"},
    { "name": "Lyo", "x": 35, "y": 78, "type": "sea"},
    { "name": "Mar", "x": 33, "y": 73, "type": "coast"},
    { "name": "Mid", "x": 10, "y": 62, "type": "sea"},
    { "name": "Mos", "x": 75, "y": 41, "type": "land"},
    { "name": "Mun", "x": 43, "y": 62, "type": "land"},
    { "name": "Naf", "x": 25, "y": 90, "type": "coast"},
    { "name": "Nap", "x": 48, "y": 82, "type": "coast"},
    { "name": "Nat", "x": 15, "y": 35, "type": "sea"},
    { "name": "Nrg", "x": 40, "y": 20, "type": "sea"},
    { "name": "Nth", "x": 35, "y": 42, "type": "sea"},
    { "name": "Nwy", "x": 43, "y": 33, "type": "coast"},
    { "name": "Par", "x": 31, "y": 62, "type": "land"},
    { "name": "Pic", "x": 31, "y": 57, "type": "coast"},
    { "name": "Pie", "x": 40, "y": 70, "type": "coast"},
    { "name": "Por", "x":  9, "y": 78, "type": "coast"},
    { "name": "Pru", "x": 53, "y": 51, "type": "coast"},
    { "name": "Rom", "x": 45, "y": 78, "type": "coast"},
    { "name": "Ruh", "x": 39, "y": 60, "type": "land"},
    { "name": "Rum", "x": 67, "y": 70, "type": "coast"},
    { "name": "Ser", "x": 59, "y": 75, "type": "land"},
    { "name": "Sev", "x": 77, "y": 65, "type": "coast"},
    { "name": "Sil", "x": 50, "y": 56, "type": "land"},
    { "name": "Ska", "x": 44, "y": 40, "type": "sea"},
    { "name": "Smy", "x": 77, "y": 85, "type": "coast"},
    { "name": "Spa", "x": 19, "y": 77, "type": "coast"},
    { "name": "Stp", "x": 73, "y": 30, "type": "coast"},
    { "name": "Swe", "x": 49, "y": 37, "type": "coast"},
    { "name": "Syr", "x": 90, "y": 90, "type": "coast"},
    { "name": "Tri", "x": 52, "y": 72, "type": "coast"},
    { "name": "Trl", "x": 48, "y": 66, "type": "land"},
    { "name": "Tun", "x": 40, "y": 90, "type": "coast"},
    { "name": "Tus", "x": 42, "y": 74, "type": "coast"},
    { "name": "Tyn", "x": 43, "y": 84, "type": "sea"},
    { "name": "Ukr", "x": 70, "y": 57, "type": "land"},
    { "name": "Ven", "x": 45, "y": 70, "type": "coast"},
    { "name": "Yor", "x": 30, "y": 48, "type": "coast"},
    { "name": "Vie", "x": 52, "y": 65, "type": "land"},
    { "name": "Wal", "x": 25, "y": 51, "type": "coast"},
    { "name": "War", "x": 58, "y": 54, "type": "land"},
    { "name": "Wes", "x": 30, "y": 85, "type": "sea"},
  ],
  "edges": [
    { "from": "Bel", "to": "Bur" },
    { "from": "Bel", "to": "Hol" },
    { "from": "Bel", "to": "Pic" },
    { "from": "Bel", "to": "Ruh" },

    { "from": "Eng", "to": "Bel" },
    { "from": "Eng", "to": "Nth" },
    { "from": "Eng", "to": "Pic" },

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

let playerCountry = "";

const initialState = {
    "units": [
        { "country": "GER", "type": "F", "vertexName": "Hol"},
        { "country": "GER", "type": "A", "vertexName": "Ruh"},
        { "country": "FRA", "type": "A", "vertexName": "Bel"},
    ],
    "latestOrders": [],
    "dislodgedUnits" : []
}

let state = initialState;

const vertexSideLength = 50;

let orders = [];

//functions
function drawVertices() {
  // Draw edges
  for (let edge of map.edges) {
    const fromVertex = map.vertices.find(vertex => vertex.name === edge.from);
    const toVertex = map.vertices.find(vertex => vertex.name === edge.to);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black'; // set stroke color to black
    ctx.beginPath();
    ctx.moveTo(fromVertex.x*(canvas.width/100), fromVertex.y*(canvas.height/100));
    ctx.lineTo(toVertex.x*(canvas.width/100), toVertex.y*(canvas.height/100));
    ctx.stroke();
  }

  // Draw vertices
  for (let vertex of map.vertices) {
    let lineWidth = 4;
    ctx.strokeStyle = 'black'; // set stroke color to black
    ctx.lineWidth = lineWidth; // set stroke width to 2 pixels

    let xPosition = vertex.x*(canvas.width/100) - vertexSideLength/2;
    let yPosition = vertex.y*(canvas.height/100) - vertexSideLength/2;

    ctx.strokeRect(xPosition, yPosition, vertexSideLength, vertexSideLength); // draw a rectangular border
    if (vertex.type === "land") {
        ctx.strokeStyle = "brown";
    }
    else if (vertex.type === "coast") {
        ctx.strokeStyle = "orange";
    }
    else if (vertex.type === "sea") {
        ctx.strokeStyle = "teal";
    }
    ctx.strokeRect(xPosition + lineWidth, yPosition + lineWidth, vertexSideLength - 2*lineWidth, vertexSideLength - 2*lineWidth); // draw a rectangular border
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(vertex.name, xPosition + vertexSideLength/2, yPosition + vertexSideLength/2 - 15);
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
                    ctx.fillRect(vertex.x*(canvas.width/100)-unitSquareSize/2, vertex.y*(canvas.height/100)-unitSquareSize/2, unitSquareSize, unitSquareSize);

                }
                else if (unit.type === "F") {
                    ctx.fillRect(vertex.x*(canvas.width/100)-unitSquareSize, vertex.y*(canvas.height/100)-unitSquareSize/4, unitSquareSize*2, unitSquareSize/2);
                }
            }
        }
    }
}

function drawMap() {
    var backgroundImage = new Image();
    backgroundImage.src = "dipmap.jpg";
    backgroundImage.onload = function() {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        drawVertices(map);
        drawUnits();
    };
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
        if ((vertex.x*(canvas.width/100) - vertexSideLength/2) < mouseX && mouseX < (vertex.x*(canvas.width/100) + vertexSideLength/2) && (vertex.y*(canvas.height/100) - vertexSideLength/2) < mouseY && mouseY < (vertex.y*(canvas.height/100) + vertexSideLength/2)) {
            return vertex;
        }
    }
}

function getFriendlyUnitOnVertex(vertex) {
    let unit = getUnitOnVertex(vertex);
    if (unit.country === playerCountry) {
        return unit;
    }
    return false;
}

function getUnitOnVertex(vertex) {
    for (let unit of state.units) {
        if (unit.vertexName === vertex.name) {
            return unit;
        }
    }
    return false;
}

function selectCountry(countryName) {
    playerCountry = countryName;
    setCountryButtonColors();
    if (playerCountry === "GER") {
        document.getElementById("gerbutton").style.backgroundColor = "red";
    }
    else if (playerCountry === "FRA") {
        document.getElementById("frabutton").style.backgroundColor = "red";
    }
}

function areAdjacent(vertexA, vertexB) {
    for (let vertexPair of map.edges) {
        if ((vertexPair.from === vertexA.name && vertexPair.to === vertexB.name) || (vertexPair.to === vertexA.name && vertexPair.from === vertexB.name)) {
            return true;
        }
    }
    return false;
}

function addOrder(unit, action, originVertex, destinationVertex, support) {
    for (let i = 0; i < orders.length; i++) {
        if (orders[i].origin.name === originVertex.name) {
            orders.splice(i, 1);
        }
    }

    orders.push({"country": playerCountry, "unitType": unit.type, "action": action, "origin": originVertex, "destination": destinationVertex, "support": support});
    document.getElementById("ordersString").innerText = ordersAsString(orders);
}

function validMove(unit, destinationVertex) {
    if ((destinationVertex.type === "land" && unit.type === "F") 
    || (destinationVertex.type === "sea") && unit.type === "A") {
        return false;
    }
    else {
        if (destinationVertex !== getVertexFromName(unit.vertexName)) {
            return true;
        }
    }
}

function redraw() {
    ctx.clearRect(0,0,400,400);
    drawMap();
}

function resolveOrders() {
    if (orders) { 
        addHoldOrders();

        for (let i = 0; i < orders.length; i++) {
            state.latestOrders.push(orders[i]);
        }

        document.getElementById("latestOrders").innerText = ordersAsString(state.latestOrders);
        state.latestOrders = [];

        console.log(orders);
        performUncontestedMoveOrders();
        resolveSupport();
        dislodgeUnits();
        resolveDislodgedUnits();
        performDislodgingMoveOrders();
        resolveCircularOrders();

        orders = [];
        document.getElementById("ordersString").innerText = ordersAsString(orders);



        redraw();
    }
}

function resolveCircularOrders() {
    let circular = [];
    for (let order1 of orders) {
        if (order1.action === "move") {
            for (let order2 of orders) {
                if (order2.action === "move" && order1.destination.name === order2.origin.name) {
                    if (!contains(circular, order1)) {
                        circular.push(order1);
                    }
                }
            }
        }
    }
    if (circular.length > 0) {
        if (circular[0].origin.name === circular[circular.length-1].destination.name) {
            for (let co of circular) {
                performMoveOrder(co);
            }
        }
    }
}

function contains(array, element) {
    for (let e of array) {
        if (e === element) {
            return true;
        }
    }
    return false;
}

function performDislodgingMoveOrders() {
    for (let i = 0; i < orders.length; i++) { //do enough times to resolve all dislodging moves;
        for (let order of orders) {
            if (unitAtDestinationIsDislodged(order)) {
                performMoveOrder(order);
            }
        }
    }
}

function unitAtDestinationIsDislodged(order) {
    for (let unit of state.dislodgedUnits) {
        if (unit.vertexName === order.destination.name) {
            return true;
        }
    }
    return false;
}

function resolveDislodgedUnits() {
    if (state.dislodgedUnits) {
        for (let unit of state.dislodgedUnits) {
            let possibleRetreatDestinations = getPossibleRetreatDestinations(unit);
            if (possibleRetreatDestinations.length > 0) {
                //TOOD;
            }
            else {
                removeUnit(unit);
            }
        }
    }
}

function removeUnit(unit) {
    for (let i = 0; i < state.units.length; i++) {
        if (state.units[i].vertexName === unit.vertexName) {
            state.units.splice(i, 1);
        }
    }
}

function getPossibleRetreatDestinations(unit) {
    return []; //TODO
}

function addHoldOrders() {
    for (let unit of state.units) {
        let hasOrder = false;
        for (let order of orders) {
            if (order.origin.name === unit.vertexName) {
                hasOrder = true;
            }
        }
        if (!hasOrder) {
            orders.push({"country": unit.country, "unitType": unit.type, "action": "hold", "origin": getVertexFromName(unit.vertexName), "destination": "", "support": 0});
        }
    }
}

function getVertexFromName(vertexName) {

    for (let vertex of map.vertices) {
        if (vertex.name === vertexName) {
            return vertex;
        }
    }
    return null;
}

function dislodgeUnits() {
    dislodgeHoldOrders();
    //TODO
}

function dislodgeHoldOrders() {
    for (let order1 of orders) {
        if (order1.action === "hold") {
            for (let order2 of orders) {
                if (order2.destination === order1.origin) {
                    if (order2.support > order1.support) {
                        state.dislodgedUnits.push(getUnitOnVertex(order1.origin))
                    }
                }
            }
        }
    }
}

function resolveSupport() {
    for (let moveOrder of orders) {
        if (moveOrder.action === "move") {
            for (let supportOrder of orders) {
                if (supportOrder.action === "support") {
                    if (supportOrder.destination === moveOrder.origin) {
                        moveOrder.support += 1;
                    }
                }
            }
        }
    }
}

function performUncontestedMoveOrders() {
    for (let i = 0; i < 100 && orders.length > 0; i++) { //do enough times to resolve all uncontested moves;
        for (let order of orders) {
            if (destinationIsUncontested(order) && order.action === "move") {
                performMoveOrder(order);
            }
        }
    }
}

function destinationIsUncontested(order) {
    for (let unit of state.units) { 
        if (unit.vertexName === order.destination.name) { //destination is occupied
            return false;
        }
    }    
    for (let otherOrder of orders) { 
        if (otherOrder.destination === order.destination && otherOrder.origin !== order.origin) { //destination is contested
            return false;
        }
    }

    return true;
}

function getOrderAtVertex(vertex) {
    for (let order of orders) {
        if (order.origin.name === vertex.name) {
            return order;
        }
    }
    for (let order of state.latestOrders) {
        if (order.origin.name === vertex.name) {
            return order;
        }
    }

    return {};
}

function performMoveOrder(order) {
    if (order.action === "move") {
        if (areAdjacent(order.origin, order.destination) || isConvoyed(order)) {
            for (unit of state.units) {
                if (unit.country === order.country &&
                    unit.type === order.unitType &&
                    unit.vertexName === order.origin.name
                ) {
                    unit.vertexName = order.destination.name;
                }
            }
            state.latestOrders.push(order);
            for (let i = 0; i < orders.length; i++) {
                if (orders[i].origin.name === order.origin.name) {
                    orders.splice(i, 1);
                }
            }
        }
    }
}

function isConvoyed(order) {
    return false;
}

function ordersAsString(outputOrders) {
    let result = "";
    if (outputOrders) {
        for (let order of outputOrders) {
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
                else if (orderToSupport.action === "hold") {
                    result += " H )";
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

drawMap();

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

function setCountryButtonColors() {
    document.getElementById("gerbutton").style.backgroundColor = "pink";
    document.getElementById("frabutton").style.backgroundColor = "pink";
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
            addOrder(friendlyUnit, "hold", clickedVertex, "", 0);
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
                addOrder(actionUnit, "move", unitOriginVertex, clickedVertex, 0);
            }
        }
        else if (action === "support") {
            let orderToSupport = getOrderAtVertex(clickedVertex);

            if (orderToSupport && orderToSupport.origin !== unitOriginVertex) {
                if (orderToSupport.action === "hold" && areAdjacent(unitOriginVertex, orderToSupport.origin)
                    ||(orderToSupport.action === "move" && validMove(actionUnit, orderToSupport.destination) && areAdjacent(unitOriginVertex, orderToSupport.destination))) {
                    addOrder(actionUnit, "support", unitOriginVertex, clickedVertex, 0);
                }
            }
        }
        else if (action === "convoy") {

        }

        orderInProgress = false;
        unitOriginVertex = -1;
        actionUnit = {};
    }
});