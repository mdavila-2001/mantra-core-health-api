// =============================================================================
// DICOM PS3.16 — CID 29 «Acquisition Modality» → registros del catálogo de análisis.
//
// Fuentes (dicom.nema.org, © NEMA; «The DICOM Standard is free to download and use»):
//   ValueSet-dicom-cid-29-AcquisitionModality.json   miembros del Context Group (código + significado)
//   chapter_D.html                                   Annex D «DICOM Controlled Terminology Definitions»:
//                                                    significado, definición y notas de cada código DCM
//
// Un concepto por miembro de CID 29 (51 en la edición 2026d). El significado que se usa como
// `display` es el del Context Group (así lo publica la lista de modalidades); el del Annex D
// puede diferir sólo en mayúsculas (p. ej. «Ophthalmic photography») y va en `dicom_dcm_meaning`.
// Los demás códigos DCM (5 113) NO se cargan: no son modalidades de adquisición.
// =============================================================================

import { decodeEntities } from '../../lib/glossary-es/common.mjs';
import { compact, conceptIdFor } from './records.mjs';

export const DICOM_CODE_SYSTEM = 'dicom-dcm';
export const DCM_SYSTEM_URI = 'http://dicom.nema.org/resources/ontology/DCM';

/** @returns {{ version, uid, name, id, members: {code, display}[] }} */
export function parseCid29(json) {
  const vs = typeof json === 'string' ? JSON.parse(json) : json;
  if (vs.resourceType !== 'ValueSet' || vs.id !== 'dicom-cid-29-AcquisitionModality') throw new Error(`ValueSet inesperado: ${vs.resourceType} ${vs.id}`);
  const includes = vs.compose?.include ?? [];
  if (includes.length !== 1 || includes[0].system !== DCM_SYSTEM_URI) throw new Error(`CID 29 debía incluir sólo ${DCM_SYSTEM_URI}; trae ${includes.map((i) => i.system).join(', ')}`);
  const oid = vs.identifier?.find((i) => /^urn:oid:/.test(i.value))?.value.replace('urn:oid:', '');
  const members = includes[0].concept.map((c) => ({ code: c.code, display: c.display }));
  if (new Set(members.map((m) => m.code)).size !== members.length) throw new Error('CID 29 trae códigos repetidos');
  return { id: vs.id, name: vs.name, version: vs.version, date: vs.date, uid: oid, url: vs.url, copyright: vs.copyright, members };
}

/** Edición del estándar tal como la rotula el propio HTML: «DICOM PS3.16 2026d - Content Mapping Resource». */
export function parseStandardEdition(html) {
  const m = html.match(/DICOM PS3\.16 (\w+) - Content Mapping Resource/);
  if (!m) throw new Error('No se encontró la edición («DICOM PS3.16 <edición> - Content Mapping Resource») en el HTML');
  return m[1];
}

/**
 * Annex D: filas `<tr>` con un ancla `id="DCM_<código>"` y cuatro celdas
 * (Code Value, Code Meaning, Definition, Notes). Devuelve sólo los códigos pedidos.
 * @returns {Map<string,{meaning:string, definition:string|null, notes:string|null}>}
 */
export function parseDcmDefinitions(html, wanted) {
  const want = new Set(wanted);
  const out = new Map();
  const text = (cell) => decodeEntities(cell.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const anchor = row[1].match(/<a id="DCM_([^"]+)"/);
    if (!anchor || !want.has(anchor[1])) continue;
    if (out.has(anchor[1])) throw new Error(`DCM ${anchor[1]} aparece dos veces en el Annex D`);
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => text(c[1]));
    if (cells.length !== 4) throw new Error(`Annex D: la fila de ${anchor[1]} tiene ${cells.length} celdas (se esperaban 4)`);
    if (cells[0] !== anchor[1]) throw new Error(`Annex D: ancla ${anchor[1]} pero código ${cells[0]}`);
    out.set(anchor[1], { meaning: cells[1], definition: cells[2] || null, notes: cells[3] || null });
  }
  return out;
}

export function dicomRecords({ cid29, definitions }, prov) {
  const missing = cid29.members.filter((m) => !definitions.has(m.code)).map((m) => m.code);
  if (missing.length) throw new Error(`Códigos de CID 29 sin fila en el Annex D: ${missing.join(', ')}`);
  const category = { scheme: 'dicom-cid', code: '29', display: 'CID 29 Acquisition Modality' };
  const records = cid29.members.map((m) => {
    const d = definitions.get(m.code);
    const retired = /retired/i.test(d.notes ?? '');
    return {
      id: conceptIdFor(DICOM_CODE_SYSTEM, m.code),
      codeSystem: DICOM_CODE_SYSTEM,
      code: m.code,
      display: m.display,
      definition: d.definition,
      lang: 'en',
      selectable: !retired,
      status: retired ? 'retired' : 'active',
      category,
      domain: 'imaging',
      domainRule: `${DICOM_CODE_SYSTEM}:cid-29-acquisition-modality`,
      properties: compact({
        dicom_dcm_meaning: d.meaning,
        dicom_dcm_notes: d.notes,
        dicom_context_group: { cid: 29, name: cid29.name, uid: cid29.uid, version: cid29.version },
        dicom_coding_scheme_uri: DCM_SYSTEM_URI,
        lab_catalog_domain: 'imaging',
        lab_catalog_domain_rule: `${DICOM_CODE_SYSTEM}:cid-29-acquisition-modality`,
      }),
      designations: [],
      relations: [],
      valueSets: ['lab-catalog-dicom-dcm', `lab-catalog-dicom-dcm-cat-29`, 'lab-catalog-domain-imaging'],
      provenance: {
        source: DICOM_CODE_SYSTEM,
        sourceName: prov.sourceName,
        sourceId: `${DCM_SYSTEM_URI}#${m.code}`,
        sourceVersion: prov.sourceVersion,
        sourceUrl: prov.sourceUrl,
        sourceFile: prov.sourceFile,
        sourceSha256: prov.sourceSha256,
        retrievedAt: prov.retrievedAt,
        license: prov.license,
      },
    };
  });
  return { records, stats: { members: cid29.members.length, retired: records.filter((r) => !r.selectable).length, meaningDiffersInCase: records.filter((r) => r.properties.dicom_dcm_meaning !== r.display).length } };
}
