#!/usr/bin/env node
// =============================================================================
// Sondeo de red de TODAS las fuentes de equipos de diagnóstico (us/eu/row/master).
// Pide cada URL con GET (cabeceras + hasta 2 KB de cuerpo) y distingue:
//   - HTTP <código>        el servidor respondió (200/3xx/4xx/5xx)
//   - PROXY-403            el túnel CONNECT fue rechazado por la política de red
//   - SIN-RESPUESTA        timeout o reset (no es un 403: no se puede afirmar causa)
// Un resultado «PROXY-403» o «SIN-RESPUESTA» NO se cuenta como saturación.
//
//   node probe-sources.mjs [salida.tsv]
// Concurrencia 4, ≤ 2 pedidos/s por host.
// =============================================================================

import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

export const TARGETS = [
  // --- US
  ['us', 'api.fda.gov device/510k', 'https://api.fda.gov/device/510k.json?limit=1'],
  ['us', 'download.open.fda.gov index', 'https://api.fda.gov/download.json'],
  ['us', 'accessgudid', 'https://accessgudid.nlm.nih.gov/download_files'],
  ['us', 'fda classification', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm'],
  // --- EU
  ['eu', 'EMDN xlsx', 'https://webgate.ec.europa.eu/dyna2/emdn/build/EMDN%20v2026_EN..xlsx'],
  ['eu', 'EUDAMED datalake /reference', 'https://api.datalake.sante.service.ec.europa.eu/eudamed/reference?LANGUAGE=en&format=json&api-version=v1.0'],
  ['eu', 'EUDAMED datalake /actors', 'https://api.datalake.sante.service.ec.europa.eu/eudamed/actors?format=json&api-version=v1.0'],
  ['eu', 'EUDAMED datalake /udi', 'https://api.datalake.sante.service.ec.europa.eu/eudamed/udi?format=json&api-version=v1.0'],
  ['eu', 'EUDAMED portal udiDiData', 'https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?page=0&pageSize=1&size=1&iso2Code=en&languageIso2Code=en'],
  ['eu', 'MHRA PARD', 'https://pard.mhra.gov.uk/'],
  ['eu', 'swissdamed', 'https://swissdamed.ch/'],
  ['eu', 'Swissmedic', 'https://www.swissmedic.ch/'],
  ['eu', 'IT BD/RDM ficha', 'https://www.dati.salute.gov.it/it/dataset/dispositivi-medici/'],
  ['eu', 'IT CND ficha', 'https://www.dati.salute.gov.it/it/dataset/classificazione-nazionale-dei-dispositivi-medici-cnd/'],
  ['eu', 'NANDO', 'https://webgate.ec.europa.eu/single-market-compliance-space/notified-bodies'],
  ['eu', 'BfArM', 'https://www.bfarm.de/EN/Medical-devices/_node.html'],
  ['eu', 'AEMPS', 'https://www.aemps.gob.es/'],
  ['eu', 'ANSM', 'https://ansm.sante.fr/'],
  // --- ROW
  ['row', 'ANVISA dados abertos', 'https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/'],
  ['row', 'Health Canada MDALL API licence', 'https://health-products.canada.ca/api/medical-devices/licence/?id=1561'],
  ['row', 'TGA www', 'https://www.tga.gov.au/resources/artg'],
  ['row', 'TGA compliance.health.gov.au', 'https://compliance.health.gov.au/artg/'],
  ['row', 'TGA DAEN', 'https://apps.tga.gov.au/Prod/devices/daen-entry.aspx'],
  ['row', 'PMDA review info', 'https://www.pmda.go.jp/review-services/drug-reviews/review-information/devices/0018.html'],
  ['row', 'NMPA UDI', 'https://udi.nmpa.gov.cn/'],
  ['row', 'MFDS data.go.kr', 'https://www.data.go.kr/'],
  ['row', 'MFDS emedi', 'https://emedi.mfds.go.kr/'],
  ['row', 'CDSCO', 'https://cdsco.gov.in/'],
  ['row', 'CDSCO MD online', 'https://cdscomdonline.gov.in/'],
  ['row', 'COFEPRIS datos.gob.mx', 'https://datos.gob.mx/'],
  ['row', 'COFEPRIS gob.mx', 'https://www.gob.mx/cofepris'],
  ['row', 'TFDA data.gov.tw 9576', 'https://data.gov.tw/api/v2/rest/dataset/9576'],
  ['row', 'HSA data.gov.sg', 'https://data.gov.sg/'],
  ['row', 'AMAR data.gov.il', 'https://data.gov.il/'],
  ['row', 'SFDA', 'https://medicaldevice.sfda.gov.sa/'],
  ['row', 'Thai FDA open', 'https://open.fda.moph.go.th/'],
  ['row', 'MDA Malaysia', 'https://portal.mda.gov.my/'],
  ['row', 'INVIMA datos.gov.co', 'https://www.datos.gov.co/'],
  ['row', 'ANMAT datos.gob.ar', 'https://datos.gob.ar/'],
  ['row', 'DIGEMID', 'https://www.datosabiertos.gob.pe/'],
  ['row', 'AGEMED', 'https://www.agemed.gob.bo/'],
  ['row', 'WHO PQ IVD', 'https://extranet.who.int/prequal/vitro-diagnostics/prequalified/in-vitro-diagnostics'],
  ['row', 'UNICEF supply', 'https://supply.unicef.org/'],
  // --- master
  ['master', 'Wikidata SPARQL', 'https://query.wikidata.org/sparql?query=SELECT%201&format=json'],
  ['master', 'GLEIF api', 'https://api.gleif.org/api/v1/lei-records?page%5Bsize%5D=1'],
  ['master', 'GLEIF golden copy', 'https://goldencopy.gleif.org/'],
  ['master', 'Zenodo', 'https://zenodo.org/api/records?size=1'],
];

function probe([region, name, url]) {
  return new Promise((resolve) => {
    const args = ['-sS', '-m', '30', '-r', '0-2047', '-D', '-', '-o', '/dev/null', '-w', '\n%{http_code}', url];
    const p = spawn('curl', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => {
      const status = Number(out.trim().split('\n').pop()) || 0;
      let verdict;
      if (status > 0) verdict = `HTTP ${status}`;
      else if (code === 56 && /CONNECT tunnel failed/.test(err)) verdict = 'PROXY-403';
      else verdict = `SIN-RESPUESTA (curl ${code}: ${err.trim().split('\n').pop()})`;
      resolve({ region, name, url, verdict });
    });
  });
}

async function main() {
  const queue = [...TARGETS];
  const results = [];
  const lastByHost = new Map();
  async function worker() {
    while (queue.length) {
      const t = queue.shift();
      const host = new URL(t[2]).host;
      const wait = Math.max(0, (lastByHost.get(host) ?? 0) + 500 - Date.now());
      lastByHost.set(host, Date.now() + wait);
      if (wait) await new Promise((r) => setTimeout(r, wait));
      results.push(await probe(t));
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  results.sort((a, b) => TARGETS.findIndex((t) => t[2] === a.url) - TARGETS.findIndex((t) => t[2] === b.url));
  const tsv = ['region\tfuente\tresultado\turl', ...results.map((r) => `${r.region}\t${r.name}\t${r.verdict}\t${r.url}`)].join('\n') + '\n';
  const outFile = process.argv[2];
  if (outFile) writeFileSync(outFile, `# sondeo ${new Date().toISOString()}\n${tsv}`);
  process.stdout.write(tsv);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
