#!/usr/bin/env node
// Validador cruzado de los catálogos de estudios (laboratorio, imagenología y
// regiones del cuerpo 3D). Sin base de datos. exit 0 = coherente, 1 = errores.
//
//   node tools/study-catalogs/check-study-catalogs.mjs [--json] [--strict]
//
// --strict  además falla si queda algo marcado verificar (pendiente clínico).
// Lo marcado verificar / verificar_composicion nunca cuenta como válido: se lista
// aparte y el cargador no lo siembra.

import { SNAKE, classify, readCatalogs } from './lib/catalogs.mjs';

const args = process.argv.slice(2);

export function validate(cat) {
  const { lab, img, reg } = cat;
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const dup = (what, codes) => {
    const seen = new Set();
    for (const c of codes) {
      if (seen.has(c)) err(`${what}: código duplicado ${c}`);
      seen.add(c);
    }
    return seen;
  };
  const snake = (what, c) => { if (typeof c !== 'string' || !SNAKE.test(c)) err(`${what}: código no MAYUSCULAS_SNAKE: ${c}`); };

  // --- laboratorio ---
  const secciones = dup('seccion', lab.secciones.map((s) => s.codigo));
  const muestras = dup('muestra', lab.muestras.map((m) => m.codigo));
  const fuentesLab = new Set(lab.fuentes.map((f) => f.id));
  [...secciones].forEach((c) => snake('seccion', c));
  [...muestras].forEach((c) => snake('muestra', c));
  const analisis = dup('analisis', lab.analisis.map((a) => a.codigo));
  for (const a of lab.analisis) {
    snake('analisis', a.codigo);
    if (!secciones.has(a.seccion)) err(`analisis ${a.codigo}: sección inexistente ${a.seccion}`);
    if (!muestras.has(a.muestra)) err(`analisis ${a.codigo}: muestra inexistente ${a.muestra}`);
    if (a.es_panel === false && a.componentes.length > 0) err(`analisis ${a.codigo}: no es panel pero trae componentes`);
    const comps = dup(`componentes de ${a.codigo}`, a.componentes.map((c) => c.codigo));
    comps.forEach((c) => snake(`componente de ${a.codigo}`, c));
    if (a.codigo_api_existente != null && !/^LAB_[A-Z0-9_]+$/.test(a.codigo_api_existente)) err(`analisis ${a.codigo}: codigo_api_existente inválido ${a.codigo_api_existente}`);
    for (const f of [].concat(a.fuente ?? [])) for (const id of String(f).split(';')) if (id && !fuentesLab.has(id)) err(`analisis ${a.codigo}: fuente no declarada ${id}`);
  }
  const existentesLab = lab.analisis.filter((a) => a.codigo_api_existente).map((a) => a.codigo_api_existente);
  dup('codigo_api_existente (lab)', existentesLab);
  for (const m of lab.muestras) for (const id of m.fuente ?? []) if (!fuentesLab.has(id)) err(`muestra ${m.codigo}: fuente no declarada ${id}`);

  // --- imagenología ---
  const modal = dup('modalidad', img.modalidades.map((m) => m.codigo));
  modal.forEach((c) => snake('modalidad', c));
  const lat = dup('lateralidad', img.lateralidades.map((m) => m.codigo));
  const regiones = dup('region', img.regiones.map((r) => r.codigo));
  regiones.forEach((c) => snake('region', c));
  for (const r of img.regiones) {
    if (r.padre != null && !regiones.has(r.padre)) err(`region ${r.codigo}: padre inexistente ${r.padre}`);
    if (r.padre === r.codigo) err(`region ${r.codigo}: es su propio padre`);
  }
  // ciclos en la jerarquía de regiones
  const padre = new Map(img.regiones.map((r) => [r.codigo, r.padre]));
  for (const r of img.regiones) {
    const vistos = new Set();
    for (let c = r.codigo; c; c = padre.get(c)) {
      if (vistos.has(c)) { err(`region ${r.codigo}: ciclo en la jerarquía`); break; }
      vistos.add(c);
    }
  }
  const estudios = dup('estudio', img.estudios.map((e) => e.codigo));
  for (const e of img.estudios) {
    snake('estudio', e.codigo);
    if (!modal.has(e.modalidad)) err(`estudio ${e.codigo}: modalidad inexistente ${e.modalidad}`);
    if (!regiones.has(e.region)) err(`estudio ${e.codigo}: región inexistente ${e.region}`);
    if (!['sin', 'con', 'sin_y_con'].includes(e.contraste)) err(`estudio ${e.codigo}: contraste desconocido ${e.contraste}`);
    if (e.codigo_api_existente != null && !/^IMG_[A-Z0-9_]+$/.test(e.codigo_api_existente)) err(`estudio ${e.codigo}: codigo_api_existente inválido ${e.codigo_api_existente}`);
    if (e.requiere_lateralidad && regiones.has(e.region)) {
      const r = img.regiones.find((x) => x.codigo === e.region);
      if (!r.admite_lateralidad) warnings.push(`estudio ${e.codigo}: requiere_lateralidad pero la región ${e.region} no admite lateralidad (decisión clínica; el cargador conserva ambos datos)`);
    }
  }
  dup('codigo_api_existente (img)', img.estudios.filter((e) => e.codigo_api_existente).map((e) => e.codigo_api_existente));
  // un código de estudio no puede coincidir con uno de laboratorio (mismo espacio de nombres)
  for (const c of estudios) if (analisis.has(c)) err(`código compartido entre laboratorio e imagenología: ${c}`);

  // --- regiones del cuerpo 3D ---
  const reg3d = new Set();
  for (const r of reg.regiones) {
    if (reg3d.has(r.region)) err(`regiones-cuerpo-3d: región repetida ${r.region}`);
    reg3d.add(r.region);
    if (!regiones.has(r.region)) err(`regiones-cuerpo-3d: la región ${r.region} no existe en imagenologia.json`);
  }
  for (const c of regiones) if (!reg3d.has(c)) err(`imagenologia.json: la región ${c} no figura en regiones-cuerpo-3d.json`);

  // --- pendientes: nada con verificar se marca válido ---
  const { pending, labSeed, imgSeed } = classify(cat);
  const sembrables = new Set([...labSeed.map((a) => a.codigo), ...imgSeed.map((e) => e.codigo)]);
  for (const p of pending) if ((p.kind === 'analisis' || p.kind === 'estudio') && sembrables.has(p.code)) err(`${p.kind} ${p.code} marcado ${p.why} pero figura como válido`);

  const counts = {
    secciones: lab.secciones.length, muestras: lab.muestras.length, analisis: lab.analisis.length,
    componentes: lab.analisis.reduce((n, a) => n + a.componentes.length, 0),
    modalidades: img.modalidades.length, regiones: img.regiones.length, estudios: img.estudios.length,
    regiones3d: reg.regiones.length,
    analisisSembrables: labSeed.length, estudiosSembrables: imgSeed.length,
    enlacesLAB: existentesLab.length, enlacesIMG: img.estudios.filter((e) => e.codigo_api_existente).length,
  };
  return { errors, warnings, pending, counts };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  let result;
  try {
    const cat = readCatalogs();
    result = { ...validate(cat), sha256: cat.sha256 };
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    process.exit(1);
  }
  const { errors, warnings, pending, counts, sha256 } = result;
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('SHA-256:'); for (const [f, h] of Object.entries(sha256)) console.log(`  ${h}  ${f}`);
    console.log('Conteos:'); for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
    console.log(`Pendientes clínicos (verificar; NO se siembran como válidos): ${pending.length}`);
    for (const p of pending) console.log(`  - ${p.kind} ${p.code} [${p.why}]`);
    console.log(`Avisos: ${warnings.length}`);
    for (const w of warnings) console.log(`  ! ${w}`);
    console.log(`Errores: ${errors.length}`);
    for (const e of errors) console.log(`  ✗ ${e}`);
  }
  const strictFail = args.includes('--strict') && pending.length > 0;
  process.exit(errors.length > 0 || strictFail ? 1 : 0);
}
