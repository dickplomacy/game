//constants

const ausColor = "red";
const engColor = "blue";
const fraColor = "teal";
const gerColor = "black";
const itaColor = "green";
const rusColor = "white";
const turColor = "orange";
    
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
    { "from": "Adr", "to": "Alb" },
    { "from": "Adr", "to": "Apu" },
    { "from": "Adr", "to": "Ion" },
    { "from": "Adr", "to": "Tri" },
    { "from": "Adr", "to": "Ven" },

    { "from": "Aeg", "to": "Bul" },
    { "from": "Aeg", "to": "Con" },
    { "from": "Aeg", "to": "Eas" },
    { "from": "Aeg", "to": "Gre" },
    { "from": "Aeg", "to": "Ion" },
    { "from": "Aeg", "to": "Smy" },

    { "from": "Alb", "to": "Gre" },
    { "from": "Alb", "to": "Ion" },
    { "from": "Alb", "to": "Ser" },
    { "from": "Alb", "to": "Tri" },

    { "from": "Ank", "to": "Arm" },
    { "from": "Ank", "to": "Bla" },
    { "from": "Ank", "to": "Con" },
    { "from": "Ank", "to": "Smy" },

    { "from": "Apu", "to": "Ion" },
    { "from": "Apu", "to": "Nap" },
    { "from": "Apu", "to": "Ven" },
    { "from": "Apu", "to": "Rom" },

    { "from": "Arm", "to": "Bla" },
    { "from": "Arm", "to": "Sev" },
    { "from": "Arm", "to": "Smy" },
    { "from": "Arm", "to": "Syr" },

    { "from": "Bal", "to": "Ber" },
    { "from": "Bal", "to": "Bot" },
    { "from": "Bal", "to": "Den" },
    { "from": "Bal", "to": "Kie" },
    { "from": "Bal", "to": "Lvn" },
    { "from": "Bal", "to": "Pru" },
    { "from": "Bal", "to": "Swe" },

    { "from": "Bar", "to": "Nrg" },
    { "from": "Bar", "to": "Nwy" },
    { "from": "Bar", "to": "Stp" },

    { "from": "Bel", "to": "Bur" },
    { "from": "Bel", "to": "Eng" },
    { "from": "Bel", "to": "Hol" },
    { "from": "Bel", "to": "Pic" },
    { "from": "Bel", "to": "Ruh" },
    { "from": "Bel", "to": "Nth" },

    { "from": "Ber", "to": "Kie" },
    { "from": "Ber", "to": "Mun" },
    { "from": "Ber", "to": "Pru" },
    { "from": "Ber", "to": "Sil" },

    { "from": "Bla", "to": "Bul" },
    { "from": "Bla", "to": "Con" },
    { "from": "Bla", "to": "Rum" },
    { "from": "Bla", "to": "Sev" },

    { "from": "Boh", "to": "Gal" },
    { "from": "Boh", "to": "Mun" },
    { "from": "Boh", "to": "Sil" },
    { "from": "Boh", "to": "Trl" },
    { "from": "Boh", "to": "Vie" },

    { "from": "Bot", "to": "Fin" },
    { "from": "Bot", "to": "Lvn" },
    { "from": "Bot", "to": "Stp" },
    { "from": "Bot", "to": "Swe" },

    { "from": "Bre", "to": "Eng" },
    { "from": "Bre", "to": "Gas" },
    { "from": "Bre", "to": "Mid" },
    { "from": "Bre", "to": "Par" },
    { "from": "Bre", "to": "Pic" },

    { "from": "Bud", "to": "Gal" },
    { "from": "Bud", "to": "Rum" },
    { "from": "Bud", "to": "Ser" },
    { "from": "Bud", "to": "Tri" },
    { "from": "Bud", "to": "Vie" },

    { "from": "Bul", "to": "Con" },
    { "from": "Bul", "to": "Gre" },
    { "from": "Bul", "to": "Rum" },
    { "from": "Bul", "to": "Ser" },

    { "from": "Bur", "to": "Gas" },
    { "from": "Bur", "to": "Mar" },
    { "from": "Bur", "to": "Par" },
    { "from": "Bur", "to": "Pic" },
    { "from": "Bur", "to": "Ruh" },

    { "from": "Cly", "to": "Edi" },
    { "from": "Cly", "to": "Lpl" },
    { "from": "Cly", "to": "Nat" },
    { "from": "Cly", "to": "Nrg" },

    { "from": "Con", "to": "Smy" },

    { "from": "Den", "to": "Hel" },
    { "from": "Den", "to": "Kie" },
    { "from": "Den", "to": "Nth" },
    { "from": "Den", "to": "Ska" },
    { "from": "Den", "to": "Swe" },
    
    { "from": "Eas", "to": "Smy" },
    { "from": "Eas", "to": "Syr" },
    { "from": "Eas", "to": "Ion" },

    { "from": "Edi", "to": "Lpl" },
    { "from": "Edi", "to": "Nrg" },
    { "from": "Edi", "to": "Nth" },
    { "from": "Edi", "to": "Yor" },

    { "from": "Eng", "to": "Iri" },
    { "from": "Eng", "to": "Lon" },
    { "from": "Eng", "to": "Mid" },
    { "from": "Eng", "to": "Nth" },
    { "from": "Eng", "to": "Pic" },
    { "from": "Eng", "to": "Wal" },

    { "from": "Fin", "to": "Nwy" },
    { "from": "Fin", "to": "Stp" },
    { "from": "Fin", "to": "Swe" },

    { "from": "Gal", "to": "Rum" },
    { "from": "Gal", "to": "Sil" },
    { "from": "Gal", "to": "Ukr" },
    { "from": "Gal", "to": "Vie" },
    { "from": "Gal", "to": "War" },

    { "from": "Gas", "to": "Mar" },
    { "from": "Gas", "to": "Mid" },
    { "from": "Gas", "to": "Par" },
    { "from": "Gas", "to": "Spa" },

    { "from": "Gre", "to": "Ion" },
    { "from": "Gre", "to": "Ser" },

    { "from": "Hel", "to": "Hol" },
    { "from": "Hel", "to": "Kie" },
    { "from": "Hel", "to": "Nth" },

    { "from": "Hol", "to": "Kie" },
    { "from": "Hol", "to": "Nth" },
    { "from": "Hol", "to": "Ruh" },

    { "from": "Ion", "to": "Nap" },
    { "from": "Ion", "to": "Tun" },
    { "from": "Ion", "to": "Tyn" },

    { "from": "Iri", "to": "Lpl" },
    { "from": "Iri", "to": "Mid" },
    { "from": "Iri", "to": "Nat" },
    { "from": "Iri", "to": "Wal" },

    { "from": "Kie", "to": "Mun" },
    { "from": "Kie", "to": "Ruh" },

    { "from": "Lon", "to": "Nth" },
    { "from": "Lon", "to": "Wal" },
    { "from": "Lon", "to": "Yor" },

    { "from": "Lpl", "to": "Nat" },
    { "from": "Lpl", "to": "Wal" },
    { "from": "Lpl", "to": "Yor" },

    { "from": "Lvn", "to": "Mos" },
    { "from": "Lvn", "to": "Pru" },
    { "from": "Lvn", "to": "Stp" },
    { "from": "Lvn", "to": "War" },

    { "from": "Lyo", "to": "Mar" },
    { "from": "Lyo", "to": "Pie" },
    { "from": "Lyo", "to": "Spa" },
    { "from": "Lyo", "to": "Tus" },
    { "from": "Lyo", "to": "Tyn" },
    { "from": "Lyo", "to": "Wes" },

    { "from": "Mar", "to": "Pie" },
    { "from": "Mar", "to": "Spa" },

    { "from": "Mid", "to": "Naf" },
    { "from": "Mid", "to": "Nat" },
    { "from": "Mid", "to": "Por" },
    { "from": "Mid", "to": "Spa" },
    { "from": "Mid", "to": "Wes" },

    { "from": "Mos", "to": "Sev" },
    { "from": "Mos", "to": "Stp" },
    { "from": "Mos", "to": "Ukr" },
    { "from": "Mos", "to": "War" },

    { "from": "Mun", "to": "Ruh" },
    { "from": "Mun", "to": "Sil" },
    { "from": "Mun", "to": "Trl" },

    { "from": "Naf", "to": "Tun" },
    { "from": "Naf", "to": "Wes" },

    { "from": "Nap", "to": "Rom" },
    { "from": "Nap", "to": "Tyn" },

    { "from": "Nat", "to": "Nrg" },

    { "from": "Nrg", "to": "Nwy" },
    { "from": "Nrg", "to": "Nth" },
    
    { "from": "Nth", "to": "Nwy" },
    { "from": "Nth", "to": "Ska" },

    { "from": "Nwy", "to": "Ska" },
    { "from": "Nwy", "to": "Swe" },

    { "from": "Par", "to": "Pic" },

    { "from": "Pie", "to": "Trl" },
    { "from": "Pie", "to": "Tus" },
    { "from": "Pie", "to": "Ven" },

    { "from": "Por", "to": "Spa" },

    { "from": "Pru", "to": "Sil" },
    { "from": "Pru", "to": "War" },

    { "from": "Rom", "to": "Tus" },
    { "from": "Rom", "to": "Tyn" },
    { "from": "Rom", "to": "Ven" },

    { "from": "Rum", "to": "Ukr" },
    { "from": "Rum", "to": "Ser" },
    { "from": "Rum", "to": "Sev" },

    { "from": "Ser", "to": "Tri" },

    { "from": "Sev", "to": "Ukr" },

    { "from": "Sil", "to": "War" },

    { "from": "Ska", "to": "Swe" },

    { "from": "Smy", "to": "Syr" },

    { "from": "Spa", "to": "Wes" },

    { "from": "Tri", "to": "Trl" },
    { "from": "Tri", "to": "Ven" },
    { "from": "Tri", "to": "Vie" },

    { "from": "Trl", "to": "Ven" },
    { "from": "Trl", "to": "Vie" },
    
    { "from": "Tun", "to": "Tyn" },
    { "from": "Tun", "to": "Wes" },

    { "from": "Tyn", "to": "Wes" },

    { "from": "Tus", "to": "Tyn" },
    { "from": "Tus", "to": "Ven" },

    { "from": "Ukr", "to": "War" },

    { "from": "Yor", "to": "Wal" },
  ]
};

let debug = false;

const unitSquareSize = 20;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let playerCountry = "";

const initialState = {
    "supplyCenters": [
        { "name": "Ank", "owner": "" },
        { "name": "Bel", "owner": "" },
        { "name": "Ber", "owner": "" },
        { "name": "Bre", "owner": "" },
        { "name": "Bud", "owner": "" },
        { "name": "Bul", "owner": "" },
        { "name": "Con", "owner": "" },
        { "name": "Den", "owner": "" },
        { "name": "Edi", "owner": "" },
        { "name": "Gre", "owner": "" },
        { "name": "Hol", "owner": "" },
        { "name": "Kie", "owner": "" },
        { "name": "Lon", "owner": "" },
        { "name": "Lpl", "owner": "" },
        { "name": "Mar", "owner": "" },
        { "name": "Mos", "owner": "" },
        { "name": "Mun", "owner": "" },
        { "name": "Nap", "owner": "" },
        { "name": "Nwy", "owner": "" },
        { "name": "Par", "owner": "" },
        { "name": "Por", "owner": "" },
        { "name": "Rom", "owner": "" },
        { "name": "Rum", "owner": "" },
        { "name": "Ser", "owner": "" },
        { "name": "Sev", "owner": "" },
        { "name": "Smy", "owner": "" },
        { "name": "Spa", "owner": "" },
        { "name": "Stp", "owner": "" },
        { "name": "Swe", "owner": "" },
        { "name": "Tri", "owner": "" },
        { "name": "Tun", "owner": "" },
        { "name": "Ven", "owner": "" },
        { "name": "Vie", "owner": "" },
        { "name": "War", "owner": "" },
    ],

    "units": [
        { "country": "AUS", "type": "A", "vertexName": "Vie"},
        { "country": "AUS", "type": "A", "vertexName": "Bud"},
        { "country": "AUS", "type": "F", "vertexName": "Tri"},

        { "country": "ENG", "type": "A", "vertexName": "Lpl"},
        { "country": "ENG", "type": "F", "vertexName": "Lon"},
        { "country": "ENG", "type": "F", "vertexName": "Edi"},
        
        { "country": "FRA", "type": "A", "vertexName": "Par"},
        { "country": "FRA", "type": "A", "vertexName": "Mar"},
        { "country": "FRA", "type": "F", "vertexName": "Bre"},

        { "country": "GER", "type": "F", "vertexName": "Kie"},
        { "country": "GER", "type": "A", "vertexName": "Ber"},
        { "country": "GER", "type": "A", "vertexName": "Mun"},

        { "country": "ITA", "type": "A", "vertexName": "Ven"},
        { "country": "ITA", "type": "A", "vertexName": "Rom"},
        { "country": "ITA", "type": "F", "vertexName": "Nap"},

        { "country": "RUS", "type": "A", "vertexName": "Mos"},
        { "country": "RUS", "type": "A", "vertexName": "War"},
        { "country": "RUS", "type": "F", "vertexName": "Sev"},
        { "country": "RUS", "type": "F", "vertexName": "Stp"},

        { "country": "TUR", "type": "A", "vertexName": "Con"},
        { "country": "TUR", "type": "A", "vertexName": "Smy"},
        { "country": "TUR", "type": "F", "vertexName": "Ank"},
    ],
    "latestOrders": [],
    "dislodgedUnits" : []
}

let state = initialState;
if (validStateHash()) {
    setTimeout(() => {decodeStateHash()}, 200); //wait for load before decoding
}

const vertexSideLength = 50;

let orders = [];

//functions
function drawVertices() {
  // Draw edges
  if (debug) {
    for (let edge of map.edges) {
        const fromVertex = map.vertices.find(vertex => vertex.name === edge.from);
        const toVertex = map.vertices.find(vertex => vertex.name === edge.to);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black'; // set stroke color to black
        ctx.beginPath();
        ctx.moveTo(fromVertex.x*(canvas.width/100), fromVertex.y*(canvas.height/100));
        ctx.lineTo(toVertex.x*(canvas.width/100), toVertex.y*(canvas.height/100));
        ctx.stroke();
      }
  }

  // Draw vertices
  for (let vertex of map.vertices) {
    let lineWidth = 4;
    ctx.strokeStyle = 'black'; // set stroke color to black
    ctx.lineWidth = lineWidth;

    let xPosition = vertex.x*(canvas.width/100) - vertexSideLength/2;
    let yPosition = vertex.y*(canvas.height/100) - vertexSideLength/2;

    ctx.strokeRect(xPosition, yPosition, vertexSideLength, vertexSideLength); // draw a rectangular border

    for (let sc of state.supplyCenters) {
        if (vertex.name === sc.name) {
            if (sc.owner === "AUS") {
                ctx.strokeStyle = ausColor;
            }
            else if (sc.owner === "ENG") {
                ctx.strokeStyle = engColor;
            }
            else if (sc.owner === "FRA") {
                ctx.strokeStyle = fraColor;
            }
            else if (sc.owner === "GER") {
                ctx.strokeStyle = gerColor;
            }
            else if (sc.owner === "ITA") {
                ctx.strokeStyle = itaColor;
            }
            else if (sc.owner === "RUS") {
                ctx.strokeStyle = rusColor;
            }
            else if (sc.owner === "TUR") {
                ctx.strokeStyle = turColor;
            }
            
            if (sc.owner) {
                ctx.strokeRect(xPosition + lineWidth, yPosition + lineWidth, vertexSideLength - 2*lineWidth, vertexSideLength - 2*lineWidth); // draw a rectangular border
            }
        }
    }

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
                if (unit.country === "AUS") {
                    ctx.fillStyle = ausColor;
                }
                else if (unit.country === "ENG") {
                    ctx.fillStyle = engColor;
                }
                else if (unit.country === "FRA") {
                    ctx.fillStyle = fraColor;
                }
                else if (unit.country === "GER") {
                    ctx.fillStyle = gerColor;
                }
                else if (unit.country === "ITA") {
                    ctx.fillStyle = itaColor;
                }
                else if (unit.country === "RUS") {
                    ctx.fillStyle = rusColor;
                }
                else if (unit.country === "TUR") {
                    ctx.fillStyle = turColor;
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
    if (playerCountry === "AUS") {
        document.getElementById("ausbutton").style.backgroundColor = "red";
    }
    else if (playerCountry === "ENG") {
        document.getElementById("engbutton").style.backgroundColor = "red";
    }
    else if (playerCountry === "FRA") {
        document.getElementById("frabutton").style.backgroundColor = "red";
    }
    else if (playerCountry === "GER") {
        document.getElementById("gerbutton").style.backgroundColor = "red";
    }
    else if (playerCountry === "ITA") {
        document.getElementById("itabutton").style.backgroundColor = "red";
    }
    else if (playerCountry === "RUS") {
        document.getElementById("rusbutton").style.backgroundColor = "red";
    }
    else if (playerCountry === "TUR") {
        document.getElementById("turbutton").style.backgroundColor = "red";
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

    orders.push({"country": unit.country, "unitType": unit.type, "action": action, "origin": originVertex, "destination": destinationVertex, "support": support});
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

function resolveEncodedOrders() {
    orders = [];

    let ausOrders = document.getElementById("ausOrders").value;
    let engOrders = document.getElementById("engOrders").value;
    let fraOrders = document.getElementById("fraOrders").value;
    let gerOrders = document.getElementById("gerOrders").value;
    let itaOrders = document.getElementById("itaOrders").value;
    let rusOrders = document.getElementById("rusOrders").value;
    let turOrders = document.getElementById("turOrders").value;

    decodeOrders(ausOrders, "AUS");
    decodeOrders(engOrders, "ENG");
    decodeOrders(fraOrders, "FRA");
    decodeOrders(gerOrders, "GER");
    decodeOrders(itaOrders, "ITA");
    decodeOrders(rusOrders, "RUS");
    decodeOrders(turOrders, "TUR");

    resolveOrders();
}

function convertToNumber(str){
    var number = "";
    for (var i=0; i<str.length; i++){
        var charCode = ('000' + str[i].charCodeAt(0)).substr(-3);
        number += charCode;
    }
    return number;
}

function convertToString(numbers){
    var origString = "";
    numbers = numbers.match(/.{3}/g);
    for(var i=0; i < numbers.length; i++){
        origString += String.fromCharCode(numbers[i]);
    }
    return origString;
}

function encodeOrders() {
    let ordersAsString = "";
    let encodedOrders = "";

    addHoldOrders();

    for (let order of orders) {
        if (order.country === playerCountry) {
            let destinationName = "";
            if (order.destination !== "") {
                destinationName = order.destination.name;
            }
            else {
                destinationName = "Non";
            }
            ordersAsString += "-" + order.origin.name.toLowerCase() + "." + order.action.substring(0,1) + "." + destinationName.toLowerCase();
        }
    }

    ordersAsString = ordersAsString.substring(1, ordersAsString.length);

    encodedOrders = convertToNumber(ordersAsString);

    console.log(encodedOrders);

    document.getElementById("encodedOrders").innerText = encodedOrders;
}

function decodeOrders(encodedOrders, orderingCountry) {
    if (encodedOrders) {
        if (encodedOrders[0] === " ") {
            encodedOrders.substring(1, encodedOrders.length);
        }
        if (encodedOrders[encodedOrders.length-1] === " ") {
            encodedOrders.substring(0, encodedOrders.length-1);
        }
    
        let decodedOrders = convertToString(encodedOrders);
    
        let decodedOrdersSplit = decodedOrders.split("-");
    
        for (let i = 0; i < decodedOrdersSplit.length; i++) {
            let orderParts = decodedOrdersSplit[i].split(".");
            let originName = orderParts[0];
            let action = orderParts[1];

            if (action === "m") {
                action = "move";
            }
            else if (action === "h") {
                action = "hold";
            }
            else if (action === "c") {
                action = "convoy";
            }
            else if (action === "s") {
                action = "support";
            }

            let destinationName = withFirstLetterUpperCase(orderParts[2]);
            let destination = "";
            if (destinationName !== "Non") {
                destination = getVertexFromName(destinationName.substring(0,3));
            }
    
            let origin = getVertexFromName(withFirstLetterUpperCase(originName));
            let unit = getUnitOnVertex(origin);
    
            if (orderHasValidComponents(unit, action, origin, destination, orderingCountry)) {
                addOrder(unit, action, origin, destination, 0);
            }
            else {
                console.log("invalid orders");
            }
        }
    }
}

function orderHasValidComponents(unit, action, origin, destination, orderingCountry) {
    let unitIsValid = false;
    for (let stateUnit of state.units) {
        if (unit === stateUnit) {
            unitIsValid = true;
        }
    }

    let countryIsValid = false;
    if(unit.country === orderingCountry) {
        countryIsValid = true;
    }
    
    let actionIsValid = false;
    if (action === "move" || action === "support" || action === "hold" || action === "convoy") {
        actionIsValid = true;
    }

    let originIsValid = false;
    let destinationIsValid = false;
    for (let vertex of map.vertices) {
        if (vertex.name === origin.name) {
            originIsValid = true;
        }
        if (vertex.name === destination.name) {
            destinationIsValid = true;
        }
    }
    if (destination === "") {
        if (action === "hold") {
            destinationIsValid = true;
        }
    }

    return unitIsValid && actionIsValid && originIsValid && destinationIsValid && countryIsValid;
}

function withFirstLetterUpperCase(str) {
    let firstLetter = str.split('')[0];
    let stringWithoutFirstLetter = str.substring(1, str.length);
    return firstLetter.toUpperCase() + stringWithoutFirstLetter;
}

function resolveOrders() {
    if (orders) { 
        addHoldOrders();

        if (state.latestOrders.length === 0) {
            for (let i = 0; i < orders.length; i++) {
                state.latestOrders.push(orders[i]);
            }
        }

        let latestOrdersForHash = state.latestOrders;

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

        refreshSupplyCenters();

        redraw();

        setLink(latestOrdersForHash);
    }
}

function refreshSupplyCenters() {
    for (let unit of state.units) {
        for (let sc of state.supplyCenters) {
            if (sc.name === unit.vertexName) {
                sc.owner = unit.country;
            }
        }
    }
}

function setLink(latestOrdersForHash) {
    let stateHash = "-";
    for (let unit of state.units) {
        stateHash += "." + unit.country + unit.type + unit.vertexName; 
    }
    stateHash += "-";

    for (let latestOrder of latestOrdersForHash) {
        stateHash += "." + latestOrder.country + latestOrder.unitType + latestOrder.origin.name + latestOrder.action;
        if (latestOrder.destination === "") {
            stateHash += "_";
        }
        else {
            stateHash += latestOrder.destination.name;
        }
    }
    
    stateHash += "-";
    for (let sc of state.supplyCenters) {
        stateHash += "." + sc.name;

        if (!sc.owner) {
            stateHash += "_";
        }
        else {
            stateHash += sc.owner;
        }
    }

    window.location.hash = stateHash;
    document.getElementById("gameLink").innerText = window.location;
    window.location.hash = "";
}

function validStateHash() {
    
    if (window.location.hash) {
        let stateHash = window.location.hash.split("#")[1];
        if (stateHash.length > 0) {
            return true;
        }
    }

    return false;
}

function decodeStateHash() {

    state.units = [];
    state.latestOrders = [];
    state.dislodgedUnits = [];
    state.supplyCenters = initialState.supplyCenters;

    let hash = window.location.hash.split("#")[1];
    let hashSplit = hash.split("-");
    hashSplit.splice(0, 1);
    let unitsString = hashSplit[0];
    let latestOrdersString = hashSplit[1];
    let supplyCentersString = hashSplit[2];

    let unitStrings = unitsString.split(".");
    unitStrings.splice(0, 1);
    for (let unitString of unitStrings) {
        let country = unitString.substring(0, 3);
        let type = unitString.substring(3, 4);
        let vertexName = unitString.substring(4, 7);
        state.units.push({"country": country, "type": type, "vertexName": vertexName});
    }

    let latestOrdersStrings = latestOrdersString.split(".");
    latestOrdersStrings.splice(0, 1);

    console.log(latestOrdersString);

    for (let latestOrderString of latestOrdersStrings) {
        let country = latestOrderString.substring(0, 3);
        let unitType = latestOrderString.substring(3,4);
        let origin = latestOrderString.substring(4,7);
        let action = latestOrderString.substring(7,11);
        let destination = "";

        if (action === "move") {
            destination = latestOrderString.substring(11,14);
        }
        else if (action === "supp") {
            destination = latestOrderString.substring(14,17);
            action = "support";
        }
        else if (action === "conv") {
            destination = latestOrderString.substring(13,16);
            action = "convoy";
        }

        state.latestOrders.push({"country": country, "unitType": unitType, "action": action, "origin": getVertexFromName(origin), "destination": getVertexFromName(destination), "support": 0});
    }

    let supplyCentersStrings = supplyCentersString.split(".");
    for (let supplyCenterString of supplyCentersStrings) {
        let name = supplyCenterString.substring(0, 3);
        let owner = supplyCenterString.substring(3, 6);

        if (owner !== "_") {
            state.supplyCenters.push({"name": name, "owner": owner});
        }
    }

    document.getElementById("latestOrders").innerText = ordersAsString(state.latestOrders);

    redraw();
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

    if (vertexName === "") {
        return "";
    }

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
    for (let order of orders) {
        if (order.action === "move" || order.action === "hold") {
            for (let supportOrder of orders) {
                if (supportOrder.action === "support") {
                    if (supportOrder.destination === order.origin) {
                        order.support += 1;
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
    document.getElementById("ausbutton").style.backgroundColor = "pink";
    document.getElementById("engbutton").style.backgroundColor = "pink";
    document.getElementById("frabutton").style.backgroundColor = "pink";
    document.getElementById("gerbutton").style.backgroundColor = "pink";
    document.getElementById("itabutton").style.backgroundColor = "pink";
    document.getElementById("rusbutton").style.backgroundColor = "pink";
    document.getElementById("turbutton").style.backgroundColor = "pink";
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