// Script to generate src/territories.json
// Run: node build_territories.js
// Data sources:
//   - SVG paths from src/DipMap.jsx
//   - Coordinates from SvgStandardMetadata.js (AGPL-3.0, Philip Paquette, Steven Bocco)
//   - Adjacency from standard.map (AGPL-3.0, Philip Paquette, Steven Bocco)
const fs = require('fs');

// ── 1. FULL NAME MAP ─────────────────────────────────────────────────────────
const NAMES = {
  adr:'Adriatic Sea', aeg:'Aegean Sea', alb:'Albania', ank:'Ankara',
  apu:'Apulia', arm:'Armenia', bal:'Baltic Sea', bar:'Barents Sea',
  bel:'Belgium', ber:'Berlin', bla:'Black Sea', boh:'Bohemia',
  bot:'Gulf of Bothnia', bre:'Brest', bud:'Budapest', bul:'Bulgaria',
  'bul-ec':'Bulgaria (East Coast)', 'bul-sc':'Bulgaria (South Coast)',
  bur:'Burgundy', cly:'Clyde', con:'Constantinople', den:'Denmark',
  eas:'Eastern Mediterranean', edi:'Edinburgh', eng:'English Channel',
  fin:'Finland', gal:'Galicia', gas:'Gascony', gol:'Gulf of Lyon',
  gre:'Greece', hel:'Helgoland Bight', hol:'Holland', ion:'Ionian Sea',
  iri:'Irish Sea', kie:'Kiel', lon:'London', lvn:'Livonia', lvp:'Liverpool',
  mar:'Marseilles', mid:'Mid-Atlantic Ocean', mos:'Moscow', mun:'Munich',
  naf:'North Africa', nao:'North Atlantic Ocean', nap:'Naples',
  nrg:'Norwegian Sea', nth:'North Sea', nwg:'Norwegian Sea', nwy:'Norway',
  par:'Paris', pic:'Picardy', pie:'Piedmont', por:'Portugal', pru:'Prussia',
  rom:'Rome', ruh:'Ruhr', rum:'Rumania', ser:'Serbia', sev:'Sevastopol',
  sil:'Silesia', ska:'Skagerrak', smy:'Smyrna', spa:'Spain',
  'spa-nc':'Spain (North Coast)', 'spa-sc':'Spain (South Coast)',
  stp:'St Petersburg', 'stp-nc':'St Petersburg (North Coast)',
  'stp-sc':'St Petersburg (South Coast)', swe:'Sweden', swi:'Switzerland',
  syr:'Syria', tri:'Trieste', tun:'Tunis', tus:'Tuscany', tyn:'Tyrrhenian Sea',
  tyr:'Tyrolia', tys:'Tyrrhenian Sea', ukr:'Ukraine', ven:'Venice',
  vie:'Vienna', wal:'Wales', war:'Warsaw', wes:'Western Mediterranean',
  yor:'Yorkshire', nat:'North Atlantic Ocean',
};

// ── 2. TERRITORY TYPE ────────────────────────────────────────────────────────
const TYPE = {
  // water (fleet only)
  adr:'water', aeg:'water', bal:'water', bar:'water', bla:'water',
  bot:'water', eas:'water', eng:'water', gol:'water', hel:'water',
  ion:'water', iri:'water', mid:'water', nao:'water', nrg:'water',
  nth:'water', nwg:'water', ska:'water', tyn:'water', tys:'water',
  wes:'water', nat:'water',
  // impassable
  swi:'impassable',
  // coast (army or fleet)
  alb:'coast', ank:'coast', apu:'coast', arm:'coast', bel:'coast',
  ber:'coast', 'bul-ec':'coast', 'bul-sc':'coast', bre:'coast',
  bul:'coast', cly:'coast', con:'coast', den:'coast', edi:'coast',
  fin:'coast', gas:'coast', gre:'coast', hol:'coast', kie:'coast',
  lon:'coast', lvn:'coast', lvp:'coast', mar:'coast', naf:'coast',
  nap:'coast', nwy:'coast', pic:'coast', pie:'coast', por:'coast',
  pru:'coast', rom:'coast', rum:'coast', ser:'coast', sev:'coast',
  smy:'coast', 'spa-nc':'coast', 'spa-sc':'coast', spa:'coast',
  'stp-nc':'coast', 'stp-sc':'coast', stp:'coast', swe:'coast',
  syr:'coast', tri:'coast', tun:'coast', tus:'coast', ven:'coast',
  wal:'coast', yor:'coast',
  // land (army only)
  boh:'land', bud:'land', bur:'land', gal:'land', mos:'land',
  mun:'land', par:'land', ruh:'land', sil:'land', tyr:'land',
  ukr:'land', vie:'land', war:'land',
};

// ── 3. SUPPLY CENTERS ────────────────────────────────────────────────────────
const SUPPLY = new Set([
  'ank','bel','ber','bre','bud','bul','con','den','edi','gre','hol',
  'kie','lon','lvp','mar','mos','mun','nap','nwy','par','por','rom',
  'rum','ser','sev','smy','spa','stp','swe','tri','tun','vie','ven','war',
]);

// ── 4. ADJACENCY (legal moves per unit type) ──────────────────────────────────
// army moves: land borders only (lowercase in standard.map = army-only)
// fleet moves: sea borders (uppercase in standard.map)
// For coast variants: only the sea spaces that fleet at that coast can reach
const ADJ = {
  // Waters
  adr: { fleet: ['alb','apu','ion','tri','ven'] },
  aeg: { fleet: ['bul-sc','con','eas','gre','ion','smy'] },
  bal: { fleet: ['ber','bot','den','kie','lvn','pru','swe'] },
  bar: { fleet: ['nwy','nrg','stp-nc'] },
  bla: { fleet: ['ank','arm','bul-ec','con','rum','sev'] },
  bot: { fleet: ['bal','fin','lvn','stp-sc','swe'] },
  eas: { fleet: ['aeg','ion','smy','syr'] },
  eng: { fleet: ['bel','bre','iri','lon','mid','nth','pic','wal'] },
  gol: { fleet: ['lyo','mar','pie','spa-sc','tus','tyn','wes'] },
  hel: { fleet: ['den','hol','kie','nth'] },
  ion: { fleet: ['adr','aeg','alb','apu','eas','gre','nap','tun','tyn'] },
  iri: { fleet: ['eng','lvp','mid','nao','wal'] },
  mid: { fleet: ['bre','eng','gas','iri','naf','nao','por','spa-nc','spa-sc','wes'] },
  nao: { fleet: ['cly','iri','lvp','mid','nrg'] },
  nrg: { fleet: ['bar','cly','edi','nao','nwy','nth'] },
  nth: { fleet: ['bel','den','edi','eng','hel','hol','lon','nrg','nwy','ska','yor'] },
  ska: { fleet: ['den','nwy','nth','swe'] },
  tyn: { fleet: ['gol','ion','lyo','nap','rom','tus','tys','wes'] },
  tys: { fleet: ['gol','ion','nap','rom','tun','tus','tyn','wes'] },
  wes: { fleet: ['gol','mid','naf','spa-sc','tun','tyn'] },
  nat: { fleet: ['cly','iri','lvp','mid','nao','nrg'] },

  // Coasts
  alb: { army: ['gre','ser','tri'], fleet: ['adr','gre','ion','tri'] },
  ank: { army: ['arm','con','smy'], fleet: ['arm','bla','con'] },
  apu: { army: ['nap','rom','ven'], fleet: ['adr','ion','nap','ven'] },
  arm: { army: ['ank','sev','smy','syr'], fleet: ['ank','bla','sev'] },
  bel: { army: ['bur','hol','pic','ruh'], fleet: ['eng','hol','nth','pic'] },
  ber: { army: ['mun','pru','sil'], fleet: ['bal','kie','pru'] },
  bre: { army: ['gas','par','pic'], fleet: ['eng','gas','mid','pic'] },
  bul: { army: ['con','gre','rum','ser'], fleet: ['aeg','bla','con','gre','rum'] },
  'bul-ec': { fleet: ['bla','con','rum'] },
  'bul-sc': { fleet: ['aeg','con','gre'] },
  cly: { army: ['edi','lvp'], fleet: ['edi','nao','nrg'] },
  con: { army: ['ank','bul','smy'], fleet: ['aeg','bla','bul-ec','bul-sc','ank','smy'] },
  den: { army: ['kie','swe'], fleet: ['bal','hel','kie','nth','ska','swe'] },
  edi: { army: ['cly','lvp','yor'], fleet: ['cly','nth','nrg','yor'] },
  fin: { army: ['nwy','stp','swe'], fleet: ['bot','stp-sc','swe'] },
  gas: { army: ['bre','bur','mar','par','spa'], fleet: ['bre','mid','spa-nc'] },
  gre: { army: ['alb','bul','ser'], fleet: ['aeg','alb','bul-sc','ion','ser'] },
  hol: { army: ['bel','kie','ruh'], fleet: ['hel','kie','nth'] },
  kie: { army: ['ber','den','hol','mun','ruh'], fleet: ['bal','den','hel','hol'] },
  lon: { army: ['wal','yor'], fleet: ['eng','nth','wal','yor'] },
  lvn: { army: ['mos','pru','stp','war'], fleet: ['bal','bot','pru','stp-sc'] },
  lvp: { army: ['cly','edi','wal','yor'], fleet: ['cly','iri','nao','wal'] },
  mar: { army: ['bur','gas','pie','spa'], fleet: ['gol','lyo','pie','spa-sc'] },
  naf: { army: ['tun'], fleet: ['mid','tun','wes'] },
  nap: { army: ['apu','rom'], fleet: ['apu','ion','rom','tys'] },
  nwy: { army: ['fin','stp','swe'], fleet: ['bar','nth','nrg','ska','stp-nc','swe'] },
  pic: { army: ['bel','bre','bur','par'], fleet: ['bel','bre','eng'] },
  pie: { army: ['mar','tus','tyr','ven'], fleet: ['gol','lyo','mar','tus'] },
  por: { army: ['spa'], fleet: ['mid','spa-nc','spa-sc'] },
  pru: { army: ['ber','lvn','sil','war'], fleet: ['bal','ber','lvn'] },
  rom: { army: ['apu','nap','tus','ven'], fleet: ['nap','tus','tyn','tys'] },
  rum: { army: ['bud','bul','gal','ser','sev','ukr'], fleet: ['bla','bul-ec','sev'] },
  ser: { army: ['alb','bud','bul','gre','rum','tri'], fleet: [] },
  sev: { army: ['arm','mos','rum','ukr'], fleet: ['arm','bla','rum'] },
  sil: { army: ['ber','boh','gal','mun','pru','war'], fleet: [] },
  smy: { army: ['ank','arm','con','syr'], fleet: ['aeg','con','eas','syr'] },
  spa: { army: ['gas','mar','por'], fleet: ['gol','lyo','mar','mid','por','wes'] },
  'spa-nc': { fleet: ['gas','mid','por'] },
  'spa-sc': { fleet: ['gol','lyo','mar','mid','por','wes'] },
  stp: { army: ['fin','lvn','mos','nwy'], fleet: ['bar','bot','fin','lvn','nwy'] },
  'stp-nc': { fleet: ['bar','nwy'] },
  'stp-sc': { fleet: ['bot','fin','lvn'] },
  swe: { army: ['den','fin','nwy'], fleet: ['bal','bot','den','fin','nwy','ska'] },
  syr: { army: ['arm','smy'], fleet: ['eas','smy'] },
  tri: { army: ['alb','bud','ser','tyr','ven','vie'], fleet: ['adr','alb','ven'] },
  tun: { army: ['naf'], fleet: ['ion','naf','tyn','tys','wes'] },
  tus: { army: ['pie','rom','ven'], fleet: ['gol','lyo','rom','tyn','tys'] },
  ven: { army: ['apu','pie','rom','tri','tus','tyr'], fleet: ['adr','apu','tri'] },
  wal: { army: ['lon','lvp','yor'], fleet: ['eng','iri','lon','lvp'] },
  war: { army: ['gal','lvn','mos','pru','sil','ukr'], fleet: [] },
  yor: { army: ['edi','lon','lvp'], fleet: ['edi','lon','nth'] },

  // Lands
  boh: { army: ['gal','mun','sil','tyr','vie'], fleet: [] },
  bud: { army: ['gal','rum','ser','tri','vie'], fleet: [] },
  bur: { army: ['bel','gas','mar','mun','par','pic','ruh'], fleet: [] },
  gal: { army: ['boh','bud','rum','sil','ukr','vie','war'], fleet: [] },
  mos: { army: ['lvn','sev','stp','ukr','war'], fleet: [] },
  mun: { army: ['ber','boh','bur','kie','ruh','sil','tyr'], fleet: [] },
  par: { army: ['bre','bur','gas','pic'], fleet: [] },
  ruh: { army: ['bel','bur','hol','kie','mun'], fleet: [] },
  tyr: { army: ['boh','mun','pie','tri','ven','vie'], fleet: [] },
  ukr: { army: ['gal','mos','rum','sev','war'], fleet: [] },
  vie: { army: ['boh','bud','gal','tri','tyr'], fleet: [] },
  swi: {},
  // extra aliases used in metadata
  lyo: { fleet: ['gol','mar','pie','spa-sc','tus','tyn','wes'] },
  nwg: { fleet: ['bar','cly','edi','nao','nwy','nth'] },
};

// ── 5. COORDINATES (from SvgStandardMetadata.js) ─────────────────────────────
const COORDS = {
  adr:   {x:793.5,  y:1048.0},
  aeg:   {x:1043.5, y:1230.0},
  alb:   {x:906.5,  y:1113.0},
  ank:   {x:1301.5, y:1110.0},
  apu:   {x:791.5,  y:1106.0},
  arm:   {x:1484.5, y:1090.0},
  bal:   {x:878.5,  y:610.0 },
  bar:   {x:1162.5, y:73.0  },
  bel:   {x:561.5,  y:753.0 },
  ber:   {x:771.5,  y:690.0 },
  bla:   {x:1233.5, y:1000.0},
  boh:   {x:806.5,  y:814.0 },
  bot:   {x:941.5,  y:485.0 },
  bre:   {x:404.5,  y:819.0 },
  bud:   {x:950.5,  y:904.0 },
  bul:   {x:1048.5, y:1068.0},
  'bul-ec': {x:1127.0, y:1067.0},
  'bul-sc': {x:1070.0, y:1140.0},
  bur:   {x:559.5,  y:871.0 },
  cly:   {x:436.5,  y:492.0 },
  con:   {x:1145.5, y:1137.0},
  den:   {x:703.5,  y:587.0 },
  eas:   {x:1218.5, y:1311.0},
  edi:   {x:473.5,  y:514.0 },
  eng:   {x:394.5,  y:751.0 },
  fin:   {x:988.5,  y:380.0 },
  gal:   {x:999.5,  y:831.0 },
  gas:   {x:422.5,  y:912.0 },
  gol:   {x:556.0,  y:1060.0},
  gre:   {x:966.5,  y:1190.0},
  hel:   {x:651.5,  y:631.0 },
  hol:   {x:596.5,  y:711.0 },
  ion:   {x:846.5,  y:1286.0},
  iri:   {x:335.5,  y:651.0 },
  kie:   {x:683.5,  y:701.0 },
  lon:   {x:488.5,  y:675.0 },
  lvn:   {x:1025.5, y:567.0 },
  lvp:   {x:450.5,  y:576.0 },
  lyo:   {x:514.3,  y:1055.0},
  mid:   {x:126.0,  y:902.0 },
  mar:   {x:524.5,  y:975.0 },
  mos:   {x:1200.5, y:590.0 },
  mun:   {x:693.5,  y:828.0 },
  naf:   {x:325.5,  y:1281.0},
  nao:   {x:180.1,  y:288.2 },
  nap:   {x:806.5,  y:1170.0},
  nat:   {x:238.0,  y:427.0 },
  nrg:   {x:605.0,  y:250.0 },
  nth:   {x:553.5,  y:560.0 },
  nwg:   {x:652.7,  y:181.8 },
  nwy:   {x:703.5,  y:410.0 },
  par:   {x:488.5,  y:845.0 },
  pic:   {x:523.5,  y:781.0 },
  pie:   {x:630.5,  y:968.0 },
  por:   {x:181.5,  y:1013.0},
  pru:   {x:865.5,  y:690.0 },
  rom:   {x:731.5,  y:1102.0},
  ruh:   {x:636.5,  y:779.0 },
  rum:   {x:1096.5, y:967.0 },
  ser:   {x:933.5,  y:1050.0},
  sev:   {x:1284.5, y:845.0 },
  sil:   {x:832.5,  y:769.0 },
  ska:   {x:735.5,  y:508.0 },
  smy:   {x:1253.5, y:1210.0},
  spa:   {x:335.5,  y:1039.0},
  'spa-nc': {x:289.0, y:965.0},
  'spa-sc': {x:291.0, y:1166.0},
  stp:   {x:1166.5, y:405.0 },
  'stp-nc': {x:1218.0, y:222.0},
  'stp-sc': {x:1066.0, y:487.0},
  swe:   {x:829.5,  y:459.0 },
  swi:   {x:642.0,  y:928.0 },
  syr:   {x:1452.5, y:1206.0},
  tri:   {x:825.5,  y:996.0 },
  tun:   {x:622.5,  y:1300.0},
  tus:   {x:686.5,  y:1034.0},
  tyn:   {x:720.0,  y:1160.0},
  tyr:   {x:742.5,  y:904.0 },
  tys:   {x:698.5,  y:1149.1},
  ukr:   {x:1124.5, y:800.0 },
  ven:   {x:707.5,  y:994.0 },
  vie:   {x:855.5,  y:864.0 },
  wal:   {x:428.5,  y:648.0 },
  war:   {x:983.5,  y:740.0 },
  wes:   {x:462.5,  y:1163.0},
  yor:   {x:492.5,  y:616.0 },
};

// ── 6. EXTRACT SVG PATHS FROM DipMap.jsx ─────────────────────────────────────
const dipmap = fs.readFileSync('src/DipMap.jsx', 'utf8');

// Single <path id="xxx" ... d="PATHDATA" .../>
const pathRe = /<path\s+id="([^"]+)"[^>]*\sd="([^"]+)"/g;
const svgPaths = {};
let m;
while ((m = pathRe.exec(dipmap)) !== null) {
  svgPaths[m[1]] = m[2];
}

// <g id="xxx" ...> - collect all child path d= values
const gRe = /<g\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g;
while ((m = gRe.exec(dipmap)) !== null) {
  const gId = m[1];
  const inner = m[2];
  const childPaths = [];
  const cpRe = /<path\s+d="([^"]+)"/g;
  let cp;
  while ((cp = cpRe.exec(inner)) !== null) {
    if (cp[1] !== gId) childPaths.push(cp[1]); // skip the placeholder "den"/"con"
  }
  svgPaths[gId] = childPaths;
}

// ── 7. BUILD OUTPUT ──────────────────────────────────────────────────────────
const territories = {};

const allIds = new Set([
  ...Object.keys(COORDS),
  ...Object.keys(ADJ),
  ...Object.keys(svgPaths),
]);

for (const id of Array.from(allIds).sort()) {
  const adj = ADJ[id] || {};
  territories[id] = {
    id,
    name: NAMES[id] || id.toUpperCase(),
    type: TYPE[id] || 'coast',
    supplyCenter: SUPPLY.has(id),
    unitCoord: COORDS[id] || null,
    moves: {
      army:  adj.army  || [],
      fleet: adj.fleet || [],
    },
    svg: svgPaths[id] || null,
  };
}

fs.writeFileSync('src/territories.json', JSON.stringify(territories, null, 2));
console.log(`Written ${Object.keys(territories).length} territories to src/territories.json`);
