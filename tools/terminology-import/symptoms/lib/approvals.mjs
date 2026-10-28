// =============================================================================
// Aprobación explícita del propietario para cargar contenido de HPO.
//
// La licencia de HPO (https://hpo.jax.org/license, texto verificado el 2026-10-27 en
// SOURCES.md ¹) permite el uso libre bajo tres condiciones, pero el *Warranty,
// Disclaimer, and Copyright Notice* del mismo sitio autoriza «personal, noncommercial
// use» del contenido del sitio y lo declara «for research and educational purposes».
// Si ese texto alcanza a los archivos descargables es una lectura jurídica que NO está
// resuelta: por eso ningún cargador escribe contenido de HPO sin que alguien la haya
// asumido a propósito, con `--accept-hpo-terms` o `MANTRA_HPO_TERMS_ACCEPTED=1`.
// El dry-run (sin base) no lo necesita.
// =============================================================================

export const HPO_APPROVAL_MESSAGE = [
  'HPO: falta la aprobación del propietario para cargar contenido de HPO.',
  'La licencia de HPO es de uso libre con tres condiciones (reconocer y citar al HPO Consortium; indicar fecha/versión al mostrarlo públicamente;',
  'no alterar contenido ni relaciones lógicas), pero el aviso legal del sitio habla de «personal, noncommercial use» y «research and educational purposes».',
  'Esa lectura NO está resuelta (tools/terminology-import/symptoms/SOURCES.md ¹; docs/seed-research/symptoms.md § Decisiones, punto 2).',
  'Si el propietario la asumió, repetí con --accept-hpo-terms (o MANTRA_HPO_TERMS_ACCEPTED=1).',
].join('\n');

/** @returns {boolean} true si se puede seguir; si no, imprime el motivo y fija el código de salida 3. */
export function hpoApproved(args = process.argv.slice(2), env = process.env) {
  if (args.includes('--accept-hpo-terms') || env.MANTRA_HPO_TERMS_ACCEPTED === '1') return true;
  console.error(HPO_APPROVAL_MESSAGE);
  process.exitCode = 3;
  return false;
}
