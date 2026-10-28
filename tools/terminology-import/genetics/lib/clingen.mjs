// =============================================================================
// ClinGen (Clinical Genome Resource, CC0 1.0): VOCABULARIO de clasificaciones.
//
// Los archivos `gene-validity.csv` (validez gen–enfermedad), `gene-dosage.csv`
// (sensibilidad a la dosis) y los TSV de actionability publican AFIRMACIONES por gen. Eso es dato, no
// vocabulario, y no se carga acá. Lo que sí es vocabulario son los valores
// controlados de sus columnas: clasificación de validez, modo de herencia (MOI),
// procedimiento operativo (SOP), panel de curación (GCEP), categorías de
// haploinsuficiencia y triplosensibilidad.
//
// ClinGen NO publica en estos archivos ni códigos ni definiciones de los
// valores: el código es `<lista>:<valor>` armado con el texto verbatim, el
// display es el valor, y no se escribe ninguna definición (la fuente no la
// trae; no se redacta). La cantidad de apariciones en el archivo es un conteo
// del propio archivo, no un dato de ClinGen.
// =============================================================================

import { cleanProps, designationList, prop, withProvenance } from './rows.mjs';
import { readDelimited, rowObject } from './delimited.mjs';

const VALIDITY_COLUMNS = ['GENE SYMBOL', 'GENE ID (HGNC)', 'DISEASE LABEL', 'DISEASE ID (MONDO)', 'MOI', 'SOP', 'CLASSIFICATION', 'ONLINE REPORT', 'CLASSIFICATION DATE', 'GCEP'];
const DOSAGE_COLUMNS = ['GENE SYMBOL', 'HGNC ID', 'HAPLOINSUFFICIENCY', 'TRIPLOSENSITIVITY', 'ONLINE REPORT', 'DATE'];

/** Lee un CSV de ClinGen: salta las líneas de presentación y las de «++++». */
export async function readClingenCsv(path, expectedColumns) {
  const out = [];
  const { header } = await readDelimited(
    path,
    (f, _n, h) => out.push(rowObject(h, f)),
    { delimiter: ',', headerMatch: (l) => l.startsWith('"GENE SYMBOL"'), skipLines: (l) => l.startsWith('"+++') },
  );
  if (header.join('|') !== expectedColumns.join('|')) throw new Error(`${path}: columnas inesperadas: ${header.join('|')}`);
  return out;
}

/** Cuenta valores no vacíos de una columna, conservando el orden alfabético estable. */
function distinct(rows, column) {
  const counts = new Map();
  for (const r of rows) {
    const v = r[column];
    if (v == null || v.trim() === '') continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

const ACTIONABILITY_COLUMNS = ['docId', 'iri', 'curationType', 'latestSearchDate', 'lastUpdated', 'lastAuthor', 'context', 'contextIri', 'release', 'geneOrVariant', 'geneOmim', 'disease', 'omim', 'mondo', 'consensusAssertion', 'status-assertion', 'status-overall', 'status-stg1'];

/** TSV de actionability (`# docId<TAB>iri<TAB>…`): sin comillas. */
export async function readActionabilityTsv(path) {
  const out = [];
  // El encabezado real es «# docId<TAB>iri…»: queda un espacio delante del primer nombre.
  const { header } = await readDelimited(path, (f, _n, h) => out.push(rowObject(h.map((x) => x.trim()), f)), { quote: null, stripHash: true });
  if (header.map((x) => x.trim()).join('|') !== ACTIONABILITY_COLUMNS.join('|')) throw new Error(`${path}: columnas inesperadas: ${header.join('|')}`);
  return out;
}

export const CLINGEN_LISTS = [
  { id: 'validity-classification', file: 'validity', column: 'CLASSIFICATION', label: 'Clasificación de validez gen–enfermedad (columna CLASSIFICATION de gene-validity.csv)' },
  { id: 'validity-moi', file: 'validity', column: 'MOI', label: 'Modo de herencia (columna MOI de gene-validity.csv)' },
  { id: 'validity-sop', file: 'validity', column: 'SOP', label: 'Procedimiento operativo estándar de curación (columna SOP de gene-validity.csv)' },
  { id: 'validity-gcep', file: 'validity', column: 'GCEP', label: 'Panel de curación (columna GCEP de gene-validity.csv)' },
  { id: 'dosage-haploinsufficiency', file: 'dosage', column: 'HAPLOINSUFFICIENCY', label: 'Categoría de haploinsuficiencia (columna HAPLOINSUFFICIENCY de gene-dosage.csv)' },
  { id: 'dosage-triplosensitivity', file: 'dosage', column: 'TRIPLOSENSITIVITY', label: 'Categoría de triplosensibilidad (columna TRIPLOSENSITIVITY de gene-dosage.csv)' },
  { id: 'actionability-consensus-assertion', file: 'actionability', column: 'consensusAssertion', label: 'Afirmación de consenso de accionabilidad clínica (columna consensusAssertion de los TSV de actionability, adultos y pediatría)' },
  { id: 'actionability-curation-type', file: 'actionability', column: 'curationType', label: 'Tipo de curación de accionabilidad (columna curationType de los TSV de actionability)' },
];

/** Procedencia de varios archivos que alimentan los mismos conceptos. */
function mergeProv(provs) {
  return {
    version: [...new Set(provs.map((p) => p.version))].sort().join(' + '),
    retrievedAt: provs.map((p) => p.retrievedAt).sort()[0],
    sourceSha256: provs.map((p) => p.sourceSha256).join(' '),
    license: provs[0].license,
    sourceUrl: provs.map((p) => p.sourceUrl).join(' '),
  };
}

export async function clingenTermRows({ validityPath, dosagePath, actionabilityPaths = [] }, provValidity, provDosage, provActionability = []) {
  const data = { validity: await readClingenCsv(validityPath, VALIDITY_COLUMNS), dosage: await readClingenCsv(dosagePath, DOSAGE_COLUMNS), actionability: [] };
  for (const path of actionabilityPaths) data.actionability.push(...(await readActionabilityTsv(path)));
  const prov = { validity: provValidity, dosage: provDosage, actionability: provActionability.length ? mergeProv(provActionability) : null };
  const rows = [];
  const stats = { validityAssertions: data.validity.length, dosageAssertions: data.dosage.length, actionabilityAssertions: data.actionability.length, lists: {} };
  for (const l of CLINGEN_LISTS) {
    if (l.file === 'actionability' && !prov.actionability) continue;
    const values = distinct(data[l.file], l.column);
    stats.lists[l.id] = values.length;
    values.forEach(([value, count], i) => {
      rows.push(
        withProvenance(
          {
            codeSystem: 'clingen-terms',
            code: `${l.id}:${value}`,
            display: value,
            designations: designationList(value, []),
            definition: null,
            properties: cleanProps([
              prop('list_name', 'string', l.id),
              prop('list_kind', 'string', `valores distintos de ${l.label}; ClinGen no publica en el archivo código ni definición de cada valor`),
              prop('list_position', 'string', String(i + 1)),
              prop('occurrences_in_file', 'string', String(count)),
            ]),
            parents: [],
            maps: [],
            relations: [],
          },
          prov[l.file],
          { source: { validity: 'clingen-gene-validity', dosage: 'clingen-dosage', actionability: 'clingen-actionability' }[l.file], sourceUrl: prov[l.file].sourceUrl },
        ),
      );
    });
  }
  return { rows, stats };
}
