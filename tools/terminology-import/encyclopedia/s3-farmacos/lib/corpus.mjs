// =============================================================================
// Lectura del corpus que ya existe (solo lectura): `cima.ndjson` (un término por
// principio activo, VTM) y los shards de la semilla del glosario (los términos
// contra los que se resuelve `conceptRef`).
//
// `cima.ndjson` trae dentro de `drugFacts.sections` el texto de la sección 4.2
// (lo bajó el importador anterior). Este módulo lo descarta en el mismo instante
// en que parsea cada línea y SOLO conserva los campos de la lista de abajo: ni se
// procesa ni se reenvía a ninguna salida.
// =============================================================================

import { createReadStream, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

/** Fecha ISO completa → AAAA-MM-DD en UTC (para fechas de descarga, que son instantes). */
export function isoDay(iso) {
  return typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : null;
}

const MADRID_DAY = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });

/**
 * Instante (ms epoch o ISO) → día civil AAAA-MM-DD en hora de Madrid. La API de CIMA
 * entrega las fechas en hora peninsular española (GMT+1/+2, ver su documentación v1.23);
 * cortar el ISO en UTC corre el día hacia atrás para los documentos modificados después
 * de las 22:00/23:00 UTC.
 */
export function madridDay(instant) {
  const ms = typeof instant === 'number' ? instant : Date.parse(instant);
  return Number.isFinite(ms) ? MADRID_DAY.format(new Date(ms)) : null;
}

/** Fila de `cima.ndjson` → registro mínimo. NO copia `drugFacts.sections` (ahí vive la 4.2). */
export function slimVtm(row) {
  const facts = row.drugFacts ?? {};
  const products = (facts.products ?? []).map((p) => ({
    nregistro: p.nregistro,
    name: p.name,
    dosageForm: p.dosageForm ?? null,
    routes: p.routes ?? [],
    commercialized: p.commercialized ?? null,
    generic: p.generic ?? null,
    authorizedAt: p.authorizedAt ?? null,
    fichaTecnicaUrl: p.fichaTecnicaUrl ?? null,
    fichaTecnicaDate: p.fichaTecnicaDate ?? null,
    fichaTecnicaSegmented: p.fichaTecnicaSegmented === true,
    presentationCount: (p.presentations ?? []).length,
    presentationCommercializedCount: (p.presentations ?? []).filter((x) => x.commercialized).length,
    cimaUrl: p.cimaUrl ?? null,
    photos: p.photos ?? [],
  }));
  const ref = facts.referenceProduct ?? null;
  return {
    code: row.code,
    slug: row.slug,
    display: row.display,
    esName: row.esName,
    atc: facts.atc ?? [],
    wikidataQ: row.externalIds?.wikidata ?? null,
    referenceNregistro: ref?.nregistro ?? null,
    referenceName: ref?.name ?? null,
    products,
  };
}

/** Recorre `cima.ndjson` por líneas y devuelve los registros mínimos. */
export async function loadVtmIndex(ndjsonPath) {
  const out = [];
  const rl = createInterface({ input: createReadStream(ndjsonPath, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    out.push(slimVtm(JSON.parse(line)));
  }
  return out;
}

/** Todas las filas de farmacología de la semilla (2 833 términos). */
export function loadSeedPharmacology(dir) {
  return readdirSync(dir)
    .filter((f) => /^page-\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}
