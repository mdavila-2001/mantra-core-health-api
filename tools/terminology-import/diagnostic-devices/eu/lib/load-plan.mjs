// =============================================================================
// Plan de carga de la EMDN a `terminology.*`: ids estables y propiedades por
// concepto. Puro (sin base), para poder probarlo sin conexión.
// =============================================================================

import { md5uuid } from './common.mjs';

export const conceptRowId = (versionId, code) =>
  md5uuid(`mantra:dx-devices:emdn:concept:${versionId}:${code}`);
export const propertyRowId = (conceptId, propertyCode) =>
  md5uuid(`mantra:dx-devices:emdn:property:${conceptId}:${propertyCode}`);

export function conceptProperties(c) {
  return [
    ['emdn_level', c.level],
    ['emdn_parent_code', c.parentCode],
    ['emdn_terminal', c.terminal],
    ['emdn_category', c.category],
    ['dx_device_scope', c.scope],
    ['source_url', c.sourceUrl],
    ['source_file_url', c.sourceFileUrl],
    ['retrieved_at', c.retrievedAt],
  ].filter(([, v]) => v !== null && v !== undefined);
}
