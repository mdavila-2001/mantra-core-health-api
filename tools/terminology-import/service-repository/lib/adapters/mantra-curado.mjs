// Servicios curados con cita — las listas de control por especialidad que
// armaron los agentes de investigación (docs/trabajo/2026-10-27-…/checklists/).
//
// Cada ítem trae al menos una fuente autorizada citada (programa formativo
// oficial, cartera de una sociedad científica, arancel o nomenclador público).
// Dos destinos posibles, nunca los dos:
//  1. Si el ítem tiene un código EXACTO verificado en un sistema que el
//     repositorio carga (CUPS, FONASA), no se crea nada: se adjunta a ese
//     concepto la especialidad (con su cita) y el nombre del ítem como sinónimo
//     (`attachOnly`: si el código no está en el corpus, se descarta).
//  2. Si no, nace un concepto `mantra-curado` con el nombre del ítem, su
//     equivalente en inglés como sinónimo y la cita en la propiedad de fuente.
// Las equivalencias marcadas `aproximado` no cuentan.
// Las especialidades que el modelo no tiene se guardan como propuesta en
// `sourceRef.proposedSpecialty`, sin relación.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { API_ROOT, clean, count, newReport, norm } from '../common.mjs';

export const CHECKLISTS_DIR = join(API_ROOT, 'docs/trabajo/2026-10-27-repositorio-universal-servicios/investigacion/checklists');
const MODEL = new Set(
  JSON.parse(readFileSync(join(API_ROOT, 'src/common/seed/data/specialty-services/model-specialties.json'), 'utf8')).specialties.map((s) => s.code),
);

export const meta = {
  internalCode: 'mantra-curado',
  name: 'Servicios curados con cita (Mantra Core Health)',
  version: '2026.10.27',
  validFrom: null,
  mergeOnly: true,
  source: {
    code: 'MANTRA_CURADO',
    name: 'Mantra Core Health — servicios por especialidad con fuente citada',
    owner: 'Mantra Core Technologies',
    officialUrl: 'https://github.com/mdavila-2001/mantra-core-health-api/tree/master/docs/trabajo/2026-10-27-repositorio-universal-servicios/investigacion/checklists',
    license: 'Curación propia. Cada servicio cita su fuente (propiedad service-repository:source); los nombres de prestaciones son datos fácticos, no se copia texto protegido.',
  },
  files: [],
};

/** Sistemas de las listas → sistema del corpus, y cómo normalizar el código. */
const SYSTEMS = [
  [/^CUPS/i, 'cups-co', (c) => String(c).replace(/\D/g, '').padStart(6, '0')],
  [/^FONASA/i, 'fonasa-mle-2026', (c) => String(c).replace(/\D/g, '').padStart(7, '0')],
];

export const slug = (text) => norm(text).replace(/ /g, '-').slice(0, 120);

export function parse(checklists) {
  const report = newReport();
  report.proposedSpecialties = {};
  const records = [];
  for (const list of checklists) {
    for (const esp of list.especialidades ?? []) {
      const inModel = MODEL.has(esp.codigo) && !esp.faltanteEnModelo;
      if (!inModel) report.proposedSpecialties[esp.codigo] = (report.proposedSpecialties[esp.codigo] ?? 0) + (esp.servicios ?? []).length;
      for (const s of esp.servicios ?? []) {
        report.read += 1;
        const nombre = clean(s.nombre);
        const evidencia = (s.evidencia ?? []).filter((e) => e.url && e.fuente);
        if (!nombre || evidencia.length === 0) { count(report, 'sin nombre o sin cita'); continue; }
        const cita = { fuente: evidencia[0].fuente, url: evidencia[0].url, ubicacion: evidencia[0].ubicacion ?? null };
        const specialties = inModel ? [{ code: esp.codigo, method: 'checklist-citation', detail: cita.url }] : [];

        const exact = [];
        for (const eq of s.equivalentes ?? []) {
          if (eq.aproximado) continue;
          const sys = SYSTEMS.find(([re]) => re.test(eq.sistema ?? ''));
          if (!sys || !eq.codigo) continue;
          exact.push({ codeSystem: sys[1], code: sys[2](eq.codigo) });
        }
        if (exact.length > 0) {
          for (const e of exact) {
            records.push({ ...e, attachOnly: true, display: nombre, synonyms: [], specialties, reviewStatus: 'curated-cited' });
          }
          report.attached = (report.attached ?? 0) + 1;
          continue;
        }
        records.push({
          codeSystem: meta.internalCode,
          code: slug(nombre),
          display: nombre,
          synonyms: s.nombreEn ? [{ value: clean(s.nombreEn), lang: 'en' }] : [],
          chapter: s.categoria ?? null,
          specialties,
          price: null,
          reviewStatus: 'curated-cited',
          sourceRef: { citas: evidencia.slice(0, 5), ...(inModel ? {} : { proposedSpecialty: esp.codigo }) },
        });
      }
    }
  }
  // El mismo servicio puede venir de dos especialidades: una sola fila, todas sus especialidades.
  const byCode = new Map();
  for (const r of records) {
    const key = `${r.codeSystem}|${r.code}`;
    const prev = byCode.get(key);
    if (!prev) { byCode.set(key, r); continue; }
    for (const sp of r.specialties) if (!prev.specialties.some((x) => x.code === sp.code)) prev.specialties.push(sp);
  }
  const out = [...byCode.values()];
  report.kept = out.length;
  return { records: out, report };
}

export async function build() {
  const files = readdirSync(CHECKLISTS_DIR).filter((f) => f.endsWith('.json')).sort();
  return parse(files.map((f) => JSON.parse(readFileSync(join(CHECKLISTS_DIR, f), 'utf8'))));
}
