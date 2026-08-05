import { indexCatalog, type IndexTuple } from '../../catalog';
import { shortenIdentifier } from '../identifier';
import type { DdlLayer, DdlLayerContext } from '../ddl-layer.contract';

/**
 * Capa 05: índices secundarios declarados por el modelo.
 *
 * Por qué esta capa existe: las entidades se generan por introspección y solo
 * describen columnas. Los ~7000 índices del modelo viven en los elementos
 * `<<INDEX_SET>>` de la bóveda, que este proyecto materializa en el catálogo
 * declarativo. Sin esta capa, una base creada por la aplicación tendría las
 * tablas correctas y ni un índice más que las claves primarias: cada filtro por
 * `tenant_id` o cada join por `*_concept_id` degeneraría en un escaneo
 * secuencial, y el sistema sería inservible con volumen real.
 *
 * Va después de las tablas por dependencia directa: no se puede indexar una
 * columna que aún no existe.
 *
 * Coste de arranque: crear un índice sobre una tabla con datos bloquea escrituras
 * mientras se construye. En el arranque normal no se crea ninguno (ya existen
 * todos), y por eso la capa empieza leyendo `pg_indexes` de una vez para saber
 * exactamente cuáles faltan. La alternativa ingenua -lanzar 7000
 * `CREATE INDEX IF NOT EXISTS`- costaría 7000 viajes de ida y vuelta en cada
 * arranque de cada réplica para, casi siempre, no hacer nada.
 */
export const indexesLayer: DdlLayer = {
  order: 5,
  name: 'indexes',
  description:
    'Materializa los índices secundarios del modelo que aún no existen en la base',

  /**
   * Ejecuta la operación apply.
   *
   * @param context - Valor de context requerido por la operación.
   * @returns Resultado de apply.
   */
  async apply(context: DdlLayerContext) {
    // Un único viaje: nombre cualificado de todos los índices ya presentes en
    // los schemas del modelo.
    const existing = new Set(
      (
        await context.query<{
          /**
           * Valor de schemaname mantenido por la instancia.
           */
          schemaname: string; /**
           * Valor de indexname mantenido por la instancia.
           */
          indexname: string;
        }>(
          `SELECT schemaname, indexname FROM pg_indexes
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')`,
        )
      ).map((row) => `${row.schemaname}.${row.indexname}`),
    );

    const pending: string[] = [];
    let skipped = 0;

    for (const [schema, batches] of Object.entries(indexCatalog)) {
      for (const batch of batches) {
        for (const index of batch) {
          if (existing.has(`${schema}.${shortenIdentifier(index[1])}`)) {
            skipped += 1;
            continue;
          }
          pending.push(buildCreateIndex(schema, index));
        }
      }
    }

    if (pending.length === 0) {
      context.logger.log('Índices al día: los ~7000 del modelo ya existen');
      return { applied: 0, skipped, failures: [] };
    }

    context.logger.log(`Índices a crear: ${pending.length}`);

    // Se agrupan en lotes en vez de una sola sentencia gigante: un lote acotado
    // mantiene los mensajes de error legibles (se sabe en qué grupo falló) y
    // evita construir en memoria una cadena de varios megabytes.
    const failures: string[] = [];
    let applied = 0;

    for (let i = 0; i < pending.length; i += INDEX_BATCH_SIZE) {
      const batch = pending.slice(i, i + INDEX_BATCH_SIZE);
      try {
        await context.execute(
          batch.join(';\n'),
          `índices ${i + 1}-${i + batch.length}`,
        );
        applied += batch.length;
      } catch (error) {
        // Un índice que no se puede crear (por ejemplo, un UNIQUE sobre datos
        // que ya violan la restricción) no debe impedir arrancar: se reporta y
        // se continúa con el resto.
        const reason = error instanceof Error ? error.message : String(error);
        failures.push(
          `lote de índices ${i + 1}-${i + batch.length}: ${reason}`,
        );
        context.logger.warn(`Índices no aplicados en un lote: ${reason}`);
      }
    }

    return { applied, skipped, failures };
  },
};

/** Sentencias por lote. Compromiso entre viajes a la base y legibilidad del error. */
const INDEX_BATCH_SIZE = 50;

/**
 * Compone el `CREATE INDEX` de una tupla del catálogo.
 *
 * `IF NOT EXISTS` se mantiene aunque ya se haya filtrado por `pg_indexes`: entre
 * la lectura del catálogo y la ejecución puede colarse otra réplica que no esté
 * bajo el mismo cerrojo (por ejemplo, un job de migración manual).
 */
function buildCreateIndex(
  schema: string,
  [table, name, columns, unique, method]: IndexTuple,
): string {
  // Mismo motivo que en las claves foráneas: por encima de 63 bytes PostgreSQL
  // guarda un nombre distinto del que se le pidió y la comprobación de
  // existencia dejaría de casar en cada arranque.
  const safeName = shortenIdentifier(name);
  const uniqueKeyword = unique ? 'UNIQUE ' : '';
  // Una entrada del catálogo puede llevar dirección de orden ("recorded_at desc").
  // Hay que entrecomillar solo el nombre: `"recorded_at desc"` sería un
  // identificador inexistente, no una columna ordenada de forma descendente.
  // La dirección importa: un índice descendente es lo que evita un sort en el
  // patrón `ORDER BY recorded_at DESC LIMIT n`, que es como se leen los logs.
  const columnList = columns
    .map((column) => {
      const [name, direction] = column.split(/\s+/);
      return direction ? `"${name}" ${direction.toUpperCase()}` : `"${name}"`;
    })
    .join(', ');
  // PostgreSQL solo admite índices únicos con btree: gin, gist y hnsw no pueden
  // garantizar unicidad. Si el modelo declara ambas cosas, manda la unicidad,
  // que es una restricción de negocio, sobre el método, que es una optimización.
  const effectiveMethod = unique ? 'btree' : method;
  return (
    `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS "${safeName}" ` +
    `ON "${schema}"."${table}" USING ${effectiveMethod} (${columnList})`
  );
}
