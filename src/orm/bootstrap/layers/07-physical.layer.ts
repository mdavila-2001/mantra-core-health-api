import { physicalCatalog } from '../../catalog';
import type { DdlLayer, DdlLayerContext } from '../ddl-layer.contract';

/**
 * Capa 07: materialización física especializada.
 *
 * Última de la secuencia porque opera sobre tablas que ya deben existir y estar
 * indexadas. Cubre lo que ningún ORM relacional sabe expresar:
 *
 *   - Hypertables de TimescaleDB (módulo 58). Convertir una tabla en hypertable
 *     la reemplaza por una jerarquía particionada por tiempo con gestión
 *     automática de chunks. Sin esto, `time_series.normalized_vital_series` sería
 *     una tabla plana que crece sin límite y cuya consulta por rango temporal
 *     acaba escaneándolo todo.
 *   - Índices vectoriales de pgvector (módulo 59). Un índice HNSW no se puede
 *     declarar con la sintaxis de índice genérica porque depende de una clase de
 *     operador que solo existe si la extensión está instalada.
 *
 * Dependencia de extensiones: cada sentencia declara de qué extensión depende.
 * Si esa extensión no llegó a instalarse en la capa 01 (por falta de permisos en
 * un PostgreSQL gestionado, por ejemplo), la sentencia se omite con un aviso en
 * vez de reventar el arranque. El sistema queda funcional con la capacidad
 * degradada, que es la respuesta correcta para una característica opcional.
 */
export const physicalLayer: DdlLayer = {
  order: 7,
  name: 'physical',
  description:
    'Aplica hypertables de TimescaleDB e índices vectoriales de pgvector sobre las tablas ya creadas',

  /**
   * Ejecuta la operación apply.
   *
   * @param context - Valor de context requerido por la operación.
   * @returns Resultado de apply.
   */
  async apply(context: DdlLayerContext) {
    const installed = new Set(
      (
        await context.query<{
          /**
           * Valor de extname mantenido por la instancia.
           */
          extname: string;
        }>('SELECT extname FROM pg_extension')
      ).map((row) => row.extname),
    );

    const failures: string[] = [];
    let applied = 0;
    let skipped = 0;

    for (const statement of physicalCatalog) {
      if (
        statement.requiresExtension &&
        !installed.has(statement.requiresExtension)
      ) {
        skipped += 1;
        context.logger.warn(
          `Omitido "${statement.id}": requiere la extensión ` +
            `"${statement.requiresExtension}", que no está instalada`,
        );
        continue;
      }

      // Condición previa declarada: distingue "no se puede todavía, y por esto"
      // de "falló inesperadamente". Lo primero es información; lo segundo, una
      // incidencia que alguien debe mirar.
      if (
        statement.precondition &&
        !(await isSatisfied(context, statement.precondition))
      ) {
        skipped += 1;
        const message = `Omitido "${statement.id}": ${statement.preconditionReason ?? 'condición previa no cumplida'}`;
        if (statement.preconditionSeverity === 'info') {
          context.logger.log(message);
        } else {
          context.logger.warn(message);
        }
        continue;
      }

      try {
        // Todas las sentencias de este catálogo son idempotentes por sí mismas
        // (`if_not_exists => TRUE`, `CREATE INDEX IF NOT EXISTS`), así que no
        // hace falta consultar antes si el objeto existe: se ejecutan siempre y
        // la propia base decide si hay algo que hacer.
        await context.execute(statement.sql, statement.id);
        applied += 1;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        failures.push(`${statement.id}: ${reason}`);
        context.logger.warn(
          `Materialización física fallida en "${statement.id}": ${reason}`,
        );
      }
    }

    return { applied, skipped, failures };
  },
};

/**
 * Evalúa una condición previa declarada en el catálogo.
 *
 * Un error al evaluarla (por ejemplo, la tabla todavía no existe) se interpreta
 * como condición no cumplida: si no se puede ni comprobar el terreno, tampoco
 * tiene sentido intentar la sentencia.
 */
async function isSatisfied(
  context: DdlLayerContext,
  precondition: string,
): Promise<boolean> {
  try {
    const [row] = await context.query<{
      /**
       * Valor de ok mantenido por la instancia.
       */
      ok: boolean | null;
    }>(precondition);
    return row?.ok === true;
  } catch {
    return false;
  }
}
