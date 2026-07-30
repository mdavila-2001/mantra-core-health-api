import { enumTypeCatalog } from '../../catalog';
import type { DdlLayer, DdlLayerContext } from '../ddl-layer.contract';

/**
 * Capa 03: tipos definidos por el usuario.
 *
 * Se intercala entre los schemas y las tablas porque un enum nativo es un tipo,
 * y una columna no se puede declarar con un tipo que no existe. El síntoma
 * concreto cuando falta esta capa es un error 42704 ("type
 * terminology.technical_data_type does not exist") en mitad del DDL de tablas,
 * que además aborta el lote completo y deja el esquema a medio crear.
 *
 * Idempotencia: `CREATE TYPE` no admite `IF NOT EXISTS`, así que se consulta
 * `pg_type` primero. Para los tipos que ya existen se comprueba además si el
 * modelo declara valores que la base todavía no tiene y se añaden con
 * `ALTER TYPE ... ADD VALUE IF NOT EXISTS`, que sí es idempotente. Nunca se
 * eliminan valores: quitar una etiqueta de un enum en uso rompe las filas que la
 * usan y PostgreSQL ni siquiera lo permite directamente.
 */
export const typesLayer: DdlLayer = {
  order: 3,
  name: 'types',
  description:
    'Crea los tipos enumerados nativos del modelo antes de que se declare ninguna columna que los use',

  /**
   * Ejecuta la operación apply.
   *
   * @param context - Valor de context requerido por la operación.
   * @returns Resultado de apply.
   */
  async apply(context: DdlLayerContext) {
    // Etiquetas existentes por tipo, en una sola consulta.
    const rows = await context.query<{
      /**
       * Valor de schema mantenido por la instancia.
       */
      schema: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Valor de label mantenido por la instancia.
       */
      label: string;
    }>(
      `SELECT n.nspname AS schema, t.typname AS name, e.enumlabel AS label
         FROM pg_type t
         JOIN pg_namespace n ON n.oid = t.typnamespace
         LEFT JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typtype = 'e'`,
    );

    const existing = new Map<string, Set<string>>();
    for (const row of rows) {
      const key = `${row.schema}.${row.name}`;
      const labels = existing.get(key) ?? new Set<string>();
      if (row.label) labels.add(row.label);
      existing.set(key, labels);
    }

    const failures: string[] = [];
    let applied = 0;
    let skipped = 0;

    for (const spec of enumTypeCatalog) {
      const key = `${spec.schema}.${spec.name}`;
      const present = existing.get(key);

      if (!present) {
        const values = spec.values.map((value) => `'${value}'`).join(', ');
        await context.execute(
          `CREATE TYPE "${spec.schema}"."${spec.name}" AS ENUM (${values})`,
          `tipo ${key}`,
        );
        applied += 1;
        context.logger.log(
          `Tipo ${key} creado con ${spec.values.length} valores (${spec.purpose})`,
        );
      } else {
        // Ampliación no destructiva: solo se añade lo que el modelo declara y la
        // base no tiene. Lo que la base tiene de más se respeta.
        const missing = spec.values.filter((value) => !present.has(value));
        if (missing.length === 0) {
          skipped += 1;
        } else {
          for (const value of missing) {
            await context.execute(
              `ALTER TYPE "${spec.schema}"."${spec.name}" ADD VALUE IF NOT EXISTS '${value}'`,
              `valor ${value} en ${key}`,
            );
          }
          applied += 1;
          context.logger.log(
            `Tipo ${key} ampliado con ${missing.length} valores: ${missing.join(', ')}`,
          );
        }
      }

      if (spec.provisional) {
        // Se reporta como incidencia no bloqueante para que el informe de
        // arranque deje constancia de que este dominio de valores es deuda
        // heredada del modelo y no una decisión cerrada de esta aplicación.
        failures.push(
          `${key}: conjunto de valores provisional; el modelo lo declara pendiente de definir`,
        );
      }
    }

    return { applied, skipped, failures };
  },
};
