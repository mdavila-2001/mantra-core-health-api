// =============================================================================
// Ciqual 2025 (ANSES) · alimentos, grupos, constituyentes, fuentes y composición.
// Nombres en francés e inglés tal cual los publica la tabla; nada se traduce. El grupo de cada alimento es el
// de nivel más profundo que la tabla informa (000000 / 0000 = «sin nivel»).
// =============================================================================
import { readFileSync } from 'node:fs';
import { parseFlatRows } from './xml.mjs';

const read = (p) => readFileSync(p, 'utf8').replace(/^﻿/, '');
const put = (o, k, v) => { if (v !== undefined && v !== '') o[k] = v; return o; };

/** Grupos: la tabla repite en cada fila grupo / subgrupo / sub-subgrupo; se deduplica por código (2, 4 y 6 dígitos). */
export function readGroups(path) {
  const rows = parseFlatRows(read(path), 'ALIM_GRP');
  const groups = new Map();
  const add = (code, nameFr, nameEn, parent, level) => {
    if (!code || /^0+$/.test(code)) return;
    const prev = groups.get(code);
    if (prev) {
      if (prev.nameFr !== nameFr || prev.nameEn !== nameEn || prev.parent !== parent) throw new Error(`Ciqual: grupo ${code} aparece con nombres/padre distintos`);
      return;
    }
    groups.set(code, { code, nameFr, nameEn, parent, level });
  };
  for (const r of rows) {
    add(r.alim_grp_code, r.alim_grp_nom_fr, r.alim_grp_nom_eng, null, 'grupo');
    add(r.alim_ssgrp_code, r.alim_ssgrp_nom_fr, r.alim_ssgrp_nom_eng, r.alim_grp_code, 'subgrupo');
    add(r.alim_ssssgrp_code, r.alim_ssssgrp_nom_fr, r.alim_ssssgrp_nom_eng, r.alim_ssgrp_code, 'sub-subgrupo');
  }
  return { groups: [...groups.values()], rowCount: rows.length };
}

export function groupRecords({ groups, cs, prov }) {
  return groups.map((g) => ({
    cs,
    code: g.code,
    display: g.nameEn,
    designations: [{ lang: 'en', value: g.nameEn, preferred: true }, { lang: 'fr', value: g.nameFr, preferred: false }],
    parents: g.parent ? [[cs, g.parent]] : [],
    properties: { ciqual_level: g.level },
    prov,
  }));
}

export function readConstituents(path) {
  return parseFlatRows(read(path), 'CONST');
}

export function constituentRecords({ rows, cs, prov }) {
  return rows.map((r) => ({
    cs,
    code: r.const_code,
    display: r.const_nom_eng,
    designations: [{ lang: 'en', value: r.const_nom_eng, preferred: true }, ...(r.const_nom_fr ? [{ lang: 'fr', value: r.const_nom_fr, preferred: false }] : [])],
    parents: [],
    properties: put({}, 'infoods_tagname', r.code_INFOODS),
    prov,
  }));
}

export function readSources(path) {
  return parseFlatRows(read(path), 'SOURCES');
}

export function sourceRecords({ rows, cs, prov }) {
  const skipped = rows.filter((r) => !r.ref_citation).length;
  const records = rows
    .filter((r) => r.ref_citation)
    .map((r) => ({ cs, code: r.source_code, display: r.ref_citation, designations: [], parents: [], properties: {}, prov }));
  return { records, skippedWithoutCitation: skipped };
}

/** compo.xml → Map alim_code → [{const_code, teneur, min, max, code_confiance, source_code}] (valores como texto de la fuente). */
export function readComposition(path) {
  const rows = parseFlatRows(read(path), 'COMPO');
  const byFood = new Map();
  for (const r of rows) {
    const e = {};
    put(e, 'const_code', r.const_code);
    put(e, 'teneur', r.teneur);
    put(e, 'min', r.min);
    put(e, 'max', r.max);
    put(e, 'code_confiance', r.code_confiance);
    put(e, 'source_code', r.source_code);
    let list = byFood.get(r.alim_code);
    if (!list) byFood.set(r.alim_code, (list = []));
    list.push(e);
  }
  return { byFood, rowCount: rows.length };
}

/** El grupo más profundo que informa la fila del alimento. */
export function deepestGroup(r) {
  for (const k of ['alim_ssssgrp_code', 'alim_ssgrp_code', 'alim_grp_code']) if (r[k] && !/^0+$/.test(r[k])) return r[k];
  return null;
}

export function foodRecords({ alimPath, composition, groupCs, cs, prov }) {
  const rows = parseFlatRows(read(alimPath), 'ALIM');
  return rows.map((r) => {
    const g = deepestGroup(r);
    const props = {};
    put(props, 'scientific_name', r.alim_nom_sci);
    put(props, 'facteur_jones', r.facteur_Jones);
    put(props, 'alim_grp_code', r.alim_grp_code);
    put(props, 'alim_ssgrp_code', r.alim_ssgrp_code);
    put(props, 'alim_ssssgrp_code', r.alim_ssssgrp_code);
    const comp = composition?.get(r.alim_code);
    if (comp) props.ciqual_composition = comp;
    return {
      cs,
      code: r.alim_code,
      display: r.alim_nom_eng ?? r.alim_nom_fr,
      designations: [...(r.alim_nom_eng ? [{ lang: 'en', value: r.alim_nom_eng, preferred: true }] : []), ...(r.alim_nom_fr ? [{ lang: 'fr', value: r.alim_nom_fr, preferred: !r.alim_nom_eng }] : [])],
      parents: g ? [[groupCs, g]] : [],
      properties: props,
      prov,
    };
  });
}
