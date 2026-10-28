// =============================================================================
// CUPS (Colombia) · exámenes de laboratorio del Plan de Beneficios en Salud (POSpópuli).
//
// Fuente: datos.gov.co, conjunto «POSPOPULI-LABORATORIO» (id s5f2-yivs) del Ministerio de
// Salud y Protección Social (MinSalud). Licencia declarada por el portal: CC BY-SA 4.0
// (Creative Commons Atribución-CompartirIgual). COMPARTIR IGUAL: este repo no tiene un
// precedente aceptado de cargar contenido SA al catálogo, así que la capa NO entra en el build
// ni en la carga por omisión: se construye sólo con `--include-share-alike` y la decisión de
// incorporarla es del propietario (ver SOURCES.md).
//
// Cada fila trae el código CUPS (`codigocups`), el nombre en MAYÚSCULAS, una explicación en
// lenguaje llano (`quees`) y la cobertura por el plan. Los códigos vienen como número de seis
// dígitos; los dos de esta hoja son siempre de seis (en el conjunto de procedimientos 811 de
// 8 114 pierden el cero inicial). Nada se infiere: el dominio es «laboratorio» porque el
// propio conjunto es el de laboratorio.
// =============================================================================

import { slugify } from '../../lib/glossary-es/common.mjs';
import { displayCase } from '../../lib/glossary-es/inlasa.mjs';
import { compact, conceptIdFor } from './records.mjs';

export const CUPS_CODE_SYSTEM = 'cups-co';
const COLUMNS = ['codigolaboratorio', 'codigocups', 'descripcion', 'quees', 'coberturaplanbeneficiosupc', 'exclusionesplanbeneficiosupc', 'rankingbusqueda'];
const sinDato = (v) => (v == null || v === '' || /^sin dato$/i.test(v.trim()) ? null : v.trim());

/** @param {object[]} rows  JSON de la API SODA de datos.gov.co */
export function cupsLabRecords(rows, prov) {
  const records = [];
  const seen = new Set();
  const stats = { rows: rows.length, withExplanation: 0, coverage: {} };
  for (const r of rows) {
    for (const c of ['codigocups', 'descripcion']) if (!r[c]) throw new Error(`CUPS: fila sin ${c}: ${JSON.stringify(r).slice(0, 120)}`);
    if (!/^\d{6}$/.test(r.codigocups)) throw new Error(`CUPS laboratorio: código que no es de seis dígitos «${r.codigocups}»`);
    if (seen.has(r.codigocups)) throw new Error(`CUPS: código repetido ${r.codigocups}`);
    seen.add(r.codigocups);
    const cover = sinDato(r.coberturaplanbeneficiosupc);
    stats.coverage[cover ?? '(sin dato)'] = (stats.coverage[cover ?? '(sin dato)'] ?? 0) + 1;
    if (sinDato(r.quees)) stats.withExplanation += 1;
    records.push({
      id: conceptIdFor(CUPS_CODE_SYSTEM, r.codigocups),
      codeSystem: CUPS_CODE_SYSTEM,
      code: r.codigocups,
      display: displayCase(r.descripcion.replace(/\s+/g, ' ').trim()),
      definition: sinDato(r.quees),
      lang: 'es',
      selectable: true,
      status: 'active',
      category: { scheme: 'cups-co', code: 'pospopuli-laboratorio', display: 'POSpópuli — Laboratorio' },
      domain: 'laboratory',
      domainRule: `${CUPS_CODE_SYSTEM}:conjunto-pospopuli-laboratorio`,
      properties: compact({
        tariff_official_name: r.descripcion,
        cups_pospopuli_laboratory_id: r.codigolaboratorio,
        cups_plan_coverage: cover,
        cups_plan_exclusions: sinDato(r.exclusionesplanbeneficiosupc),
        cups_search_ranking: r.rankingbusqueda ? Number(r.rankingbusqueda) : null,
        lab_catalog_domain: 'laboratory',
        lab_catalog_domain_rule: `${CUPS_CODE_SYSTEM}:conjunto-pospopuli-laboratorio`,
      }),
      designations: [{ lang: 'es', type: 'preferred', value: displayCase(r.descripcion.replace(/\s+/g, ' ').trim()) }],
      relations: [],
      valueSets: ['lab-catalog-cups-co', `lab-catalog-cups-co-cat-${slugify('pospopuli-laboratorio')}`, 'lab-catalog-domain-laboratory'],
      provenance: {
        source: CUPS_CODE_SYSTEM,
        sourceName: prov.sourceName,
        sourceId: r.codigocups,
        sourceVersion: prov.sourceVersion,
        sourceUrl: prov.sourceUrl,
        sourceFile: prov.sourceFile,
        sourceSha256: prov.sourceSha256,
        retrievedAt: prov.retrievedAt,
        license: prov.license,
      },
    });
  }
  return { records, stats };
}

export { COLUMNS as CUPS_LAB_COLUMNS };
