// =============================================================================
// NCI Thesaurus, edición oficial (Thesaurus.owl de EVS, RDF/XML) en streaming.
//
// Devuelve la misma forma que `readNcit` (edición OBO), para que
// `ncitProcedureAssertions` aplique exactamente las mismas reglas:
//   parents  `rdfs:subClassOf rdf:resource` directos
//   names    P108 «Preferred_Name»
//   obsolete P310 «Concept_Status» = Retired_Concept
//   roles    restricciones `owl:onProperty #Rnnn` + `owl:someValuesFrom #Cnnn`
//            (en subClassOf o equivalentClass), solo los de NCIT_PROCEDURE_ROLES
// El archivo pesa ~750 MB: se lee por bloques `<owl:Class>` sin cargarlo entero.
// =============================================================================

import { spawn } from 'node:child_process';
import { own } from '../common.mjs';
import { NCIT_PROCEDURE_ROLES } from '../relation-types.mjs';

const BASE = 'http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl#';

/** Un bloque `<owl:Class …>…</owl:Class>` → partes que usa el normalizador. */
export function parseNcitClass(block) {
  const code =
    block.match(/<NHC0>(C\d+)<\/NHC0>/)?.[1] ??
    block.match(/rdf:about="[^"]*#(C\d+)"/)?.[1];
  if (!code) return null;
  const parents = [
    ...block.matchAll(/<rdfs:subClassOf rdf:resource="[^"]*#(C\d+)"\/>/g),
  ].map((m) => own(`NCIT:${m[1]}`));
  const name = block.match(/<P108>([^<]*)<\/P108>/)?.[1] ?? null;
  const retired = /<P310>Retired_Concept<\/P310>/.test(block);
  const roles = [];
  for (const m of block.matchAll(
    /<owl:onProperty rdf:resource="[^"]*#(R\d+)"\/>\s*<owl:someValuesFrom rdf:resource="[^"]*#(C\d+)"\/>/g,
  )) {
    if (NCIT_PROCEDURE_ROLES.includes(m[1]))
      roles.push({
        subject: own(`NCIT:${code}`),
        role: own(m[1]),
        target: own(`NCIT:${m[2]}`),
      });
  }
  return {
    id: own(`NCIT:${code}`),
    parents,
    name: own(
      name?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
    ),
    retired,
    roles,
  };
}

/** Lee Thesaurus.OWL.zip con `unzip -p` y arma la estructura de `readNcit`. */
export async function readNcitOwlZip(zipPath) {
  const child = spawn('unzip', ['-p', zipPath], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  child.stdout.setEncoding('utf8');
  const parents = new Map();
  const names = new Map();
  const obsolete = new Set();
  const roles = [];
  let versionInfo = null;
  let buf = '';
  for await (const chunk of child.stdout) {
    buf += chunk;
    if (!versionInfo)
      versionInfo =
        buf.match(/<owl:versionInfo>([^<]+)<\/owl:versionInfo>/)?.[1] ?? null;
    let end;
    while ((end = buf.indexOf('</owl:Class>')) >= 0) {
      const start = buf.lastIndexOf(`<owl:Class rdf:about="${BASE}`, end);
      if (start >= 0) {
        const c = parseNcitClass(buf.slice(start, end));
        if (c) {
          parents.set(c.id, c.parents);
          names.set(c.id, c.name);
          if (c.retired) obsolete.add(c.id);
          roles.push(...c.roles);
        }
      }
      buf = buf.slice(end + '</owl:Class>'.length);
    }
    // Los tramos sin clases (axiomas, propiedades) no se acumulan: solo se guarda
    // desde el último inicio de clase, o la cola por si una etiqueta quedó partida.
    const lastStart = buf.lastIndexOf('<owl:Class rdf:about=');
    buf = lastStart >= 0 ? buf.slice(lastStart) : buf.slice(-65536);
  }
  const code = await new Promise((resolve) => child.on('close', resolve));
  if (code !== 0)
    throw new Error(`unzip terminó con código ${code} leyendo ${zipPath}`);
  return {
    parents,
    names,
    obsolete,
    roles,
    version: { versionInfo, dataVersion: null },
  };
}
