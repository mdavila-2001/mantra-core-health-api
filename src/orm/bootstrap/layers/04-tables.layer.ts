import type { DdlLayer, DdlLayerContext } from '../ddl-layer.contract';

/**
 * Capa 04: tablas y columnas, derivadas de la metadata de las entidades.
 *
 * Esta es la capa que hace que la aplicación sea la dueña de su propia
 * estructura. MikroORM compara el modelo descubierto (1159 entidades) contra el
 * estado real de la base y produce el DDL de la diferencia.
 *
 * Garantías del generador que se aprovechan:
 *
 *   - `safe: true`. En modo seguro no se emiten sentencias que puedan perder
 *     datos de una columna existente.
 *   - `dropTables: false`. Una tabla que exista en la base y no en el modelo se
 *     deja intacta: puede pertenecer a otro servicio o a una migración en curso.
 *
 * Y una garantía que el generador NO da y que esta capa tiene que añadir,
 * descrita abajo en `keepAdditiveStatements`.
 *
 * Idempotencia: no se consigue con `IF NOT EXISTS`, sino por construcción. El
 * DDL se calcula contra el estado actual, así que en un arranque donde no falta
 * nada la diferencia es vacía y no se ejecuta una sola sentencia.
 */
export const tablesLayer: DdlLayer = {
  order: 4,
  name: 'tables',
  description:
    'Sincroniza tablas y columnas contra la metadata de las entidades, en modo estrictamente aditivo',

  async apply(context: DdlLayerContext) {
    // `getUpdateSchemaSQL` calcula el diff sin aplicarlo. Se usa siempre esta
    // variante, incluso fuera de dry-run, porque el DDL hay que filtrarlo antes
    // de ejecutarlo (ver `keepAdditiveStatements`) y porque así es esta capa, y
    // no MikroORM, quien decide cómo y con qué traza se aplica.
    const sql = await context.orm.schema.getUpdateSchemaSQL({
      safe: true,
      dropTables: false,
      wrap: false,
    });

    const all = splitStatements(sql);
    const { kept, discarded } = keepAdditiveStatements(all);

    if (discarded.length > 0) {
      context.logger.log(
        `Descartadas ${discarded.length} sentencias destructivas del diff ` +
          '(índices y restricciones cuyo dueño es el catálogo, no la metadata de las entidades)',
      );
    }

    if (kept.length === 0) {
      context.logger.log(
        'Estructura de tablas al día: el modelo y la base coinciden',
      );
      return { applied: 0, skipped: all.length, failures: [] };
    }

    context.logger.log(
      `Diferencia de estructura detectada: ${kept.length} sentencias a aplicar`,
    );

    // Se aplica por lotes y no en un único envío. Motivo concreto: cada ALTER
    // TABLE toma un bloqueo ACCESS EXCLUSIVE y PostgreSQL mantiene los bloqueos
    // hasta el fin de la transacción. Un envío único de miles de sentencias se
    // ejecuta como una sola transacción implícita y agota la tabla de bloqueos
    // compartida ("out of shared memory: you might need to increase
    // max_locks_per_transaction"). Trocear acota los bloqueos vivos a la vez.
    let applied = 0;

    for (let i = 0; i < kept.length; i += TABLE_BATCH_SIZE) {
      const batch = kept.slice(i, i + TABLE_BATCH_SIZE);
      await context.execute(
        batch.map((statement) => `${statement};`).join('\n'),
        `estructura ${i + 1}-${i + batch.length}`,
      );
      applied += batch.length;
    }

    return { applied, skipped: all.length - kept.length, failures: [] };
  },
};

/**
 * Sentencias por lote.
 *
 * Con `max_locks_per_transaction` en su valor por defecto (64) y unas decenas de
 * conexiones, la tabla de bloqueos admite del orden de miles de entradas. 200
 * sentencias por transacción deja margen amplio sin multiplicar los viajes.
 */
const TABLE_BATCH_SIZE = 200;

/**
 * Descarta del diff toda sentencia destructiva.
 *
 * Por qué hace falta, que es el punto menos obvio de toda la secuencia de
 * arranque: `safe: true` protege los *datos*, no los *objetos de esquema*. El
 * generador sigue emitiendo `drop index` y `alter table ... drop constraint`
 * para todo índice o restricción que exista en la base y no aparezca en la
 * metadata de las entidades.
 *
 * En este proyecto eso sería catastrófico: los ~7000 índices y las 5993 claves
 * foráneas los declara el catálogo, no las entidades. Sin este filtro, la capa
 * 04 borraría en cada arranque exactamente lo que las capas 05 y 06 acababan de
 * crear, y el ciclo se repetiría indefinidamente: la base nunca convergería y
 * cada despliegue abriría una ventana sin índices ni integridad referencial.
 *
 * El reparto de responsabilidades queda entonces así, y es deliberado:
 *   - la metadata de las entidades manda sobre tablas y columnas;
 *   - el catálogo manda sobre índices y restricciones.
 *
 * Cada capa toca solo lo suyo.
 */
function keepAdditiveStatements(statements: string[]): {
  kept: string[];
  discarded: string[];
} {
  const kept: string[] = [];
  const discarded: string[] = [];

  for (const statement of statements) {
    if (DESTRUCTIVE_PATTERN.test(statement)) {
      discarded.push(statement);
    } else {
      kept.push(statement);
    }
  }

  return { kept, discarded };
}

/**
 * Formas destructivas que se filtran.
 *
 * Se enumeran de forma explícita en lugar de aplicar una heurística sobre la
 * palabra "drop": si una versión futura de MikroORM emitiera una forma nueva,
 * conviene que el filtro no la deje pasar por accidente ni descarte de más.
 */
const DESTRUCTIVE_PATTERN =
  /^\s*(drop\s+(index|table|schema|type)|alter\s+table\s+.*\s+drop\s+(constraint|column))/i;

/**
 * Parte un volcado SQL en sentencias.
 *
 * Es un troceo por `;` a propósito: el DDL que emite MikroORM no contiene
 * literales con punto y coma ni cuerpos de función, así que un analizador SQL
 * completo sería complejidad sin beneficio. Si algún día se emitiera un bloque
 * `DO $$ ... $$`, esta función habría que revisarla.
 */
function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0 && !statement.startsWith('--'));
}
