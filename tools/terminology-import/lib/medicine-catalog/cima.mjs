// CIMA (AEMPS, España) → registro común. El transporte ya está resuelto por
// `import-cima.mjs` (caché en `glossary-data-build/cache/cima`); acá sólo se
// mapea. Una fila = un medicamento autorizado (`nregistro`), no un principio
// activo: eso es lo que una farmacia vende.

import { CIMA_LICENSE, CIMA_SOURCE_NAME, cimaDetailPageUrl, cimaPhoto } from '../glossary-es/cima.mjs';
import { makeRecord, normalizeAtc, textOrNull, unique } from './common.mjs';

export const CIMA_CODE_SYSTEM = 'cima-medicamentos';

/** `estado` de CIMA: `rev` = revocado, `susp` = suspendido; sin ellos, autorizado vigente. */
function regulatoryStatusOf(estado) {
  if (typeof estado?.rev === 'number') return 'REVOKED';
  if (typeof estado?.susp === 'number') return 'SUSPENDED';
  return 'ACTIVE';
}

/**
 * @param {object} detail  respuesta de `medicamento?nregistro=` (superset del listado)
 * @param {string} retrievedAt
 */
export function cimaToRecord(detail, retrievedAt) {
  const code = String(detail.nregistro);
  const display = textOrNull(detail.nombre);
  if (display === null) throw new Error(`CIMA ${code}: sin nombre`);
  const atc = unique((detail.atcs ?? []).map((a) => normalizeAtc(a.codigo)));
  return makeRecord({
    source: 'cima',
    codeSystem: CIMA_CODE_SYSTEM,
    code,
    display,
    holder: textOrNull(detail.labtitular),
    strengthText: textOrNull(detail.dosis),
    dosageForm: textOrNull(detail.formaFarmaceutica?.nombre),
    routes: unique((detail.viasAdministracion ?? []).map((v) => textOrNull(v.nombre))),
    requiresPrescription: typeof detail.receta === 'boolean' ? detail.receta : null,
    generic: typeof detail.generico === 'boolean' ? detail.generico : null,
    activeIngredients: (detail.principiosActivos ?? []).map((p) => ({
      name: String(p.nombre),
      amount: textOrNull(p.cantidad),
      unit: textOrNull(p.unidad),
    })),
    atc,
    presentations: (detail.presentaciones ?? []).map((p) => ({
      code: textOrNull(p.cn),
      name: String(p.nombre),
      gtin: null, // CIMA publica el Código Nacional (CN), no el GTIN: no se inventa.
      active: typeof p.comerc === 'boolean' ? p.comerc : null,
    })),
    regulatoryStatus: regulatoryStatusOf(detail.estado),
    photos: (detail.fotos ?? []).map((f) => {
      const photo = cimaPhoto(f, code, display);
      return {
        url: photo.url,
        thumbUrl: photo.thumbUrl,
        attribution: photo.attribution,
        license: photo.license,
      };
    }),
    sourceUrl: cimaDetailPageUrl(code),
    sourceName: CIMA_SOURCE_NAME,
    sourceLicense: CIMA_LICENSE,
    sourceRetrievedAt: retrievedAt,
  });
}
