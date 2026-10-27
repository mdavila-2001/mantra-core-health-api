// =============================================================================
// Fuentes de servicios por especialidad: definición, lectura y verificación.
//
// Cada fuente declara su organismo, versión, URI oficial, licencia y el
// transporte por el que llegaron los bytes (que NO siempre es el sitio oficial:
// ver SOURCES.md). Los parsers son puros: reciben texto o JSON y devuelven
// filas `{ code, display, … }` tal cual las publica la fuente.
// =============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { API_ROOT, clean, norm } from './common.mjs';
import { CUPS2025 } from './cups2025.mjs';

export const SOURCES = {
  fonasa: {
    key: 'fonasa',
    sourceCode: 'FONASA_CL',
    sourceName: 'FONASA — Fondo Nacional de Salud (Chile)',
    owner: 'Fondo Nacional de Salud, Ministerio de Salud de Chile',
    officialUrl: 'https://www.fonasa.gob.cl/wp-content/uploads/sites/3/2026/03/1-Libro-Arancel-MLE-2026.pdf',
    license: 'Documento público del Estado de Chile (arancel fijado por resolución exenta y publicado en el Diario Oficial); se reproduce citando la fuente. El paquete npm que lo transporta es MIT.',
    codeSystem: 'fonasa-mle-2026',
    codeSystemName: 'FONASA — Arancel de Prestaciones de Salud 2026, Modalidad Libre Elección',
    version: '2026',
    validFrom: '2026-03-16',
    transport: {
      kind: 'npm-tarball',
      package: '@mariohealthbits/fonasa-mle-open@1.0.0',
      url: 'https://registry.npmjs.org/@mariohealthbits/fonasa-mle-open/-/fonasa-mle-open-1.0.0.tgz',
      sha256: 'b622019be7a3a1e3eb560c01415d991947ac21561ed074187f2b9ee687e9e05c',
      member: 'package/data/mle-2026.json',
      note: 'Extracción del XLSX oficial hecha por el autor del paquete. Se verifica contra la extracción del PDF oficial que ya vive en el repo (grupos 03 y 04).',
    },
  },
  cups: {
    key: 'cups',
    sourceCode: 'MINSALUD_CO_CUPS',
    sourceName: 'CUPS — Clasificación Única de Procedimientos en Salud (Colombia)',
    owner: 'Ministerio de Salud y Protección Social de Colombia',
    officialUrl: 'https://web.sispro.gov.co/WebPublico/Consultas/ConsultarDetalleReferenciaBasica.aspx?Code=CUPSRips',
    license: 'Anexo de un acto administrativo del Ministerio de Salud de Colombia (resolución anual de la CUPS): texto normativo, de reproducción libre (Ley 23 de 1982, art. 41). Los repositorios que lo transportan no declaran licencia; de ellos no se toma código, sólo el dato normativo.',
    codeSystem: 'cups-co',
    codeSystemName: 'CUPS — Clasificación Única de Procedimientos en Salud (cruce de dos copias)',
    // Ninguna de las dos copias declara el año de la resolución: no se inventa.
    version: 'sin-version-declarada',
    validFrom: null,
    transport: {
      kind: 'github-raw-pair',
      copies: [
        {
          id: 'A',
          repo: 'FacturacionDacs/SecretariadeSalud',
          commit: '87164f39752df421e6649ecc9fe1ca39d800422f',
          path: 'cups_catalog.js',
          sha256: '52b261ebf33dc63b80764060b4b30b20332360f4bd2b99c3fd561fb33ed5022d',
          note: 'Tabla de referencia «Codigo, Nombre» (10 024 códigos) cargada por el usuario del repo; forma de exportación de SISPRO (comas reemplazadas por «- »).',
        },
        {
          id: 'B',
          repo: 'Ander8zerox/Galeno',
          commit: '7de30b0b79a02541cc96fbd341d0f74f56c00542',
          path: 'backend/src/main/resources/db/migration/V7__cups.sql',
          sha256: '3733a6087e5c8d64306da9f833e6440db8a02f3748e934dcd441963e09007659',
          note: 'Generada del PDF «Tabla 1. Procedimientos en salud» (7 882 códigos, con grupo quirúrgico y puntos SMLDV descartados).',
        },
      ],
    },
  },
  cups2025: {
    key: 'cups2025',
    sourceCode: 'MINSALUD_CO_CUPS_2706_2025',
    sourceName: 'CUPS 2025 — Resolución 2706 de 2025, Anexo Técnico 2 «Lista tabular» (Colombia)',
    owner: 'Ministerio de Salud y Protección Social de Colombia',
    officialUrl: CUPS2025.officialUrl,
    license: 'Acto administrativo del Ministerio de Salud y Protección Social (Resolución 2706 de 2025) con sus anexos técnicos: texto normativo, de reproducción libre (Ley 23 de 1982, art. 41; verificar). Descargado del sitio oficial del Ministerio; el normograma que lo reproduce da los mismos bytes.',
    codeSystem: 'cups-co-2706-2025',
    codeSystemName: 'CUPS 2025 — Clasificación Única de Procedimientos en Salud, Resolución 2706 de 2025 (Colombia)',
    version: CUPS2025.version,
    validFrom: CUPS2025.validFrom,
    transport: {
      kind: 'official-pdf',
      url: CUPS2025.officialUrl,
      alsoServedBy: 'https://normograma.com/documentospdf/PDF/R_MSPS_2706_2025.pdf (mismos bytes)',
      sha256: 'a9c198bb58b85ba14711acebbc91f5f041d3f67f235e0eb9aae2463f449bbece',
      pages: 395,
      extraction: 'pdftotext -raw (poppler); Anexo Técnico 2',
    },
  },
  boArancel: {
    key: 'boArancel',
    sourceCode: 'COLMED_SCZ',
    sourceName: 'Colegio Médico de Santa Cruz — Comité Científico Departamental',
    owner: 'Colegio Médico de Santa Cruz (Bolivia)',
    officialUrl: null,
    license: 'Arancel gremial publicado para su aplicación; sin licencia explícita. Ya estaba en el repo (VS_BO_MEDICAL_PROCEDURE): acá no se copia, sólo se relaciona.',
    codeSystem: 'VS_BO_MEDICAL_PROCEDURE',
    version: 'Aranceles de Honorarios Médicos, julio 2025',
    dataset: 'src/common/seed/data/bolivia/fee-schedule.dataset.json',
  },
  boDental: {
    key: 'boDental',
    sourceCode: 'COLMED_SCZ',
    sourceName: 'Listado arancel odontológico 2026',
    owner: 'Arancel odontológico (Bolivia)',
    officialUrl: null,
    license: 'Sin licencia explícita. Ya estaba en el repo (VS_BO_MEDICAL_PROCEDURE): acá no se copia, sólo se relaciona.',
    codeSystem: 'VS_BO_MEDICAL_PROCEDURE',
    version: 'Listado arancel odontológico 2026',
    dataset: 'src/common/seed/data/bolivia/fee-schedule.dataset.json',
  },
};

// --- FONASA -------------------------------------------------------------------

/** Filas del JSON del paquete: `{ code: '0101201', name, level1_total, … }`. */
export function parseFonasa(json) {
  const rows = JSON.parse(json);
  if (!Array.isArray(rows)) throw new Error('FONASA: se esperaba un arreglo');
  return rows.map((r) => ({ code: String(r.code), display: clean(r.name), level1Total: r.level1_total }));
}

/**
 * Coteja la copia npm contra la extracción del PDF oficial que el repo ya tiene
 * (`tools/bolivia-datasets/data/fonasa-mle-2026-{laboratorio,imagenologia}.json`):
 * mismo código, mismo nombre (normalizado) y mismo valor nivel 1. Un solo
 * desacuerdo aborta: si la copia difiere donde se puede comprobar, no se le cree
 * donde no.
 */
export function verifyFonasaAgainstPdf(rows, pdfExtracts) {
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const problems = [];
  let checked = 0;
  for (const extract of pdfExtracts) {
    for (const p of extract.prestaciones) {
      checked += 1;
      const code = p.codigo.replace(/-/g, '');
      const r = byCode.get(code);
      if (!r) problems.push(`${code}: falta en la copia`);
      else if (norm(r.display) !== norm(p.nombre)) problems.push(`${code}: nombre distinto`);
      else if (r.level1Total !== p.valorClp) problems.push(`${code}: valor distinto`);
    }
  }
  return { checked, problems, pdfSha256: pdfExtracts.map((e) => e.fuente.sha256) };
}

export function readFonasaPdfExtracts() {
  return ['laboratorio', 'imagenologia'].map((g) =>
    JSON.parse(readFileSync(join(API_ROOT, `tools/bolivia-datasets/data/fonasa-mle-2026-${g}.json`), 'utf8')),
  );
}

// --- CUPS ---------------------------------------------------------------------

/** Copia A: `window.CUPS_CATALOG = {"010101":"…", …};` */
export function parseCupsCopyA(js) {
  const start = js.indexOf('{');
  const end = js.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('CUPS A: no se encontró el objeto');
  return new Map(Object.entries(JSON.parse(js.slice(start, end + 1))));
}

/** Copia B: `INSERT INTO cups (codigo, descripcion) VALUES ('010101', '…'), …` */
export function parseCupsCopyB(sql) {
  const out = new Map();
  for (const m of sql.matchAll(/\('(\d{6})', '((?:[^']|'')*)'\)/g)) out.set(m[1], m[2].replace(/''/g, "'"));
  return out;
}

/** Igualdad de copias: la A escribe «- » donde la B (y la norma) escriben «, ». */
export function cupsComparable(text) {
  return norm(text.replace(/- /g, ', ').replace(/-/g, ' ')).replace(/[\s,]+/g, ' ').trim();
}

/**
 * Cruce de las dos copias. `agreed`: el código está en ambas con el mismo texto
 * (se muestra el de la copia B, que conserva la puntuación de la norma).
 * `onlyA`: sólo lo trae la copia A —la B es una tabla tarifaria que no cubre
 * toda la CUPS, así que su ausencia no contradice nada—; se muestra el texto de
 * A tal cual, con sus «- ». `disagree` y `onlyB` no entran: en el primero las
 * copias se contradicen y en el segundo la B arrastra basura de la extracción
 * del PDF (encabezados de página pegados) que no hay con qué cotejar.
 */
export function crossValidateCups(a, b) {
  const agreed = [];
  const onlyA = [];
  const onlyB = [];
  const disagree = [];
  for (const [code, textA] of a) {
    const textB = b.get(code);
    if (textB === undefined) onlyA.push({ code, display: clean(textA) });
    else if (cupsComparable(textA) === cupsComparable(textB)) agreed.push({ code, display: clean(textB) });
    else disagree.push(code);
  }
  for (const code of b.keys()) if (!a.has(code)) onlyB.push(code);
  return { agreed, onlyA, onlyB, disagree };
}

// --- Aranceles bolivianos (ya en el repo) ---------------------------------------

export function readBoDataset() {
  return JSON.parse(readFileSync(join(API_ROOT, SOURCES.boArancel.dataset), 'utf8')).datos;
}
