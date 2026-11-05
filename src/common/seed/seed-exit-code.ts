/**
 * Código de salida del paso de migración y siembra.
 *
 * Falla (1) si algún paso de la siembra falló o si el DDL quedó con incidencias de
 * integridad bloqueantes (FK o índice único crítico ausente). Con `ORM_SCHEMA_SYNC=off`
 * el proceso no materializa el DDL, no registra reporte y la integridad cuenta como
 * completa: ese caso no lo cubre este código de salida.
 *
 * @param failedSeeds - Pasos de siembra que fallaron.
 * @param schemaIntegrityComplete - Verdadero si no hay incidencias bloqueantes del esquema.
 * @returns 0 si todo quedó íntegro, 1 en otro caso.
 */
export function seedExitCode(
  failedSeeds: number,
  schemaIntegrityComplete: boolean,
): 0 | 1 {
  return failedSeeds > 0 || !schemaIntegrityComplete ? 1 : 0;
}
