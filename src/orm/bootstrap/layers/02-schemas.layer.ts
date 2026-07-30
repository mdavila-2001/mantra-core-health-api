import { schemaCatalog } from '../../catalog';
import type { DdlLayer, DdlLayerContext } from '../ddl-layer.contract';

/**
 * Capa 02: espacios de nombres (schemas) de PostgreSQL.
 *
 * El modelo canónico reparte sus 1159 tablas en 57 schemas, uno por módulo de
 * negocio. Ese reparto no es cosmético: es la unidad sobre la que se conceden
 * permisos (`GRANT USAGE ON SCHEMA`), la que evita colisiones de nombres entre
 * dominios (`clinical.procedures` frente a `procedures_perioperative.procedure_cases`)
 * y la que da a un DBA una vista por dominio del tamaño y el crecimiento.
 *
 * Va antes que las tablas por razón obvia: `CREATE TABLE iam.users` falla si el
 * schema `iam` no existe, y el mensaje de PostgreSQL en ese caso apunta a la
 * tabla, no al schema ausente.
 *
 * Idempotencia: `CREATE SCHEMA IF NOT EXISTS` es la forma nativa. Se emiten
 * todas las sentencias en un único lote para no pagar 57 viajes de ida y vuelta.
 */
export const schemasLayer: DdlLayer = {
  order: 2,
  name: 'schemas',
  description:
    'Crea los 57 espacios de nombres del modelo antes de que se materialice ninguna tabla',

  /**
   * Ejecuta la operación apply.
   *
   * @param context - Valor de context requerido por la operación.
   * @returns Resultado de apply.
   */
  async apply(context: DdlLayerContext) {
    const existing = new Set(
      (
        await context.query<{
          /**
           * Valor de nspname mantenido por la instancia.
           */
          nspname: string;
        }>('SELECT nspname FROM pg_namespace')
      ).map((row) => row.nspname),
    );

    const missing = schemaCatalog
      .map(([schema]) => schema)
      .filter((schema) => !existing.has(schema));

    if (missing.length > 0) {
      // Lote único: la latencia de red domina el coste de un CREATE SCHEMA, así
      // que agrupar 57 sentencias triviales en un viaje es la diferencia entre
      // decenas de milisegundos y varios segundos contra una base remota.
      await context.execute(
        missing
          .map((schema) => `CREATE SCHEMA IF NOT EXISTS "${schema}"`)
          .join(';\n'),
        `creación de ${missing.length} schemas`,
      );
      context.logger.log(`Schemas creados: ${missing.join(', ')}`);
    }

    return {
      applied: missing.length,
      skipped: schemaCatalog.length - missing.length,
      failures: [],
    };
  },
};
