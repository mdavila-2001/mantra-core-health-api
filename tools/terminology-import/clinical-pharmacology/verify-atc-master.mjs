#!/usr/bin/env node
// Contrasta la maestra ATC bajada con `codigo=A` (la API ignora el valor y devuelve las 7 358 filas) contra
// búsquedas por `nombre=` (que sí filtran por subcadena): toda fila que devuelva una búsqueda por nombre debe
// estar, con el mismo nombre, en la maestra completa. Pocos pedidos (uno por nombre), ≤ 1/s.
// Uso: node tools/terminology-import/clinical-pharmacology/verify-atc-master.mjs [nombre …]
import { join } from 'node:path';

import { HttpClient, writeJson } from '../lib/glossary-es/common.mjs';
import { CIMA_REST } from './lib/cima.mjs';
import { readAtcMaster } from './lib/inputs.mjs';
import { cpOut } from './lib/paths.mjs';

const NAMES = process.argv.slice(2).length ? process.argv.slice(2) : ['paracetamol', 'metformina', 'amoxicilina', 'omeprazol', 'insulina', 'warfarina', 'atorvastatina', 'salbutamol', 'sertralina', 'levotiroxina', 'ibuprofeno', 'furosemida'];
const master = new Map(readAtcMaster().map((r) => [r.code, r.name]));
const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
const report = { generatedAt: new Date().toISOString(), masterRows: master.size, checks: [] };
for (const n of NAMES) {
  const res = await http.getJsonCached(`${CIMA_REST}/maestras?maestra=7&nombre=${encodeURIComponent(n)}`, join(cpOut('verify-atc-master'), `${n}.json`), { allow404: true });
  const rows = res?.resultados ?? [];
  const missing = rows.filter((r) => master.get(r.codigo) !== r.nombre).map((r) => r.codigo);
  report.checks.push({ nombre: n, filas: rows.length, totalFilas: res?.totalFilas ?? 0, ausentesOCambiadas: missing });
}
report.ok = report.checks.every((c) => c.ausentesOCambiadas.length === 0);
writeJson(cpOut('verify-atc-master.json'), report, true);
console.log(JSON.stringify(report, null, 1));
