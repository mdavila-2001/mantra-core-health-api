/**
 * Tipos del catálogo declarativo del modelo canónico SALUD v4.0.x.
 *
 * Contexto: las entidades MikroORM de `src/modules/**\/entities` se generan por
 * introspección de la base y, por convención del repositorio, no se editan a
 * mano. Eso deja fuera del código dos piezas del modelo físico que MikroORM no
 * puede inferir de una entidad escalar:
 *
 *   1. los índices secundarios (los `<<INDEX_SET>>` del modelo), y
 *   2. las claves foráneas (las columnas FK están mapeadas como `uuid` planos,
 *      sin relación `@ManyToOne`, para no acoplar los 57 módulos entre sí).
 *
 * Este catálogo las declara aparte, en archivos generados desde la bóveda, y la
 * secuencia de arranque las materializa. Así el DDL que emite la aplicación es
 * fiel al modelo oficial sin tener que reescribir 1159 entidades.
 *
 * El formato es de tuplas a propósito: una restricción por línea, sin ruido
 * sintáctico, para que ~13 000 declaraciones sigan siendo legibles y ningún
 * archivo del catálogo supere las 300 líneas.
 */

/**
 * Clave foránea entre dos tablas del modelo relacional.
 *
 * Orden de la tupla:
 *   [0] tabla origen      — dentro del schema que da nombre al archivo
 *   [1] columna origen    — la columna `*_id` que porta la referencia
 *   [2] schema destino    — puede ser distinto del origen (FK cross-schema)
 *   [3] tabla destino
 *   [4] columna destino   — la PK de la tabla destino (casi siempre `id`)
 *
 * Ejemplo: `['sessions', 'user_id', 'iam', 'users', 'id']` se materializa como
 * `ALTER TABLE iam.sessions ADD CONSTRAINT fk_sessions_user_id
 *  FOREIGN KEY (user_id) REFERENCES iam.users (id)`.
 */
export type ForeignKeyTuple = readonly [
  table: string,
  column: string,
  targetSchema: string,
  targetTable: string,
  targetColumn: string,
];

/**
 * Índice secundario (o restricción UNIQUE) declarado por el modelo.
 *
 * Orden de la tupla:
 *   [0] tabla
 *   [1] nombre del índice — se respeta el nombre del modelo para que el
 *       diagnóstico de un plan de ejecución en producción sea rastreable hasta
 *       la nota de la bóveda que lo declaró
 *   [2] columnas en orden — el orden importa: un índice compuesto (a, b) sirve
 *       para filtrar por `a` o por `a AND b`, pero no por `b` solo
 *   [3] único — true emite UNIQUE INDEX (restricción de negocio, no solo acceso)
 *   [4] método — btree por defecto; gin/gist para jsonb, texto y rangos;
 *       hnsw/ivfflat para similitud vectorial (pgvector)
 */
export type IndexTuple = readonly [
  table: string,
  name: string,
  columns: readonly string[],
  unique: boolean,
  method: string,
];

/**
 * Un schema PostgreSQL del modelo, con su trazabilidad al módulo de negocio.
 *
 * Orden de la tupla:
 *   [0] nombre del schema en PostgreSQL
 *   [1] número de módulo del modelo oficial (M01..M63); null si no se resolvió
 *   [2] carpeta del módulo NestJS que lo implementa en `src/modules`
 *   [3] tablas mapeadas por entidades en ese schema
 *
 * El campo [3] no se usa para generar DDL: es el contador que el verificador de
 * fidelidad compara contra `information_schema` para detectar deriva.
 */
export type SchemaSpec = readonly [
  schema: string,
  moduleNumber: number | null,
  moduleDir: string,
  mappedTables: number,
];

/**
 * Extensión de PostgreSQL requerida por el modelo físico.
 *
 * `required: false` significa que la ausencia de la extensión degrada una
 * capacidad concreta (por ejemplo, búsqueda vectorial) pero no impide arrancar:
 * la capa de extensiones registra el fallo y continúa.
 */
export interface ExtensionSpec {
  /**
   * Valor de name mantenido por la instancia.
   */
  readonly name: string;
  /**
   * Valor de purpose mantenido por la instancia.
   */
  readonly purpose: string;
  /**
   * Valor de required mantenido por la instancia.
   */
  readonly required: boolean;
}

/**
 * Sentencia de materialización física que MikroORM no sabe emitir desde una
 * entidad: conversión a hypertable de TimescaleDB, índice HNSW de pgvector,
 * política de retención, etc.
 *
 * `sql` debe ser idempotente por sí misma (IF NOT EXISTS, `if_not_exists =>
 * TRUE`, o un bloque DO con captura de `duplicate_object`), porque la secuencia
 * de arranque la ejecuta en cada despliegue.
 */
export interface PhysicalStatementSpec {
  /**
   * Identificador único de la instancia.
   */
  readonly id: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  readonly description: string;
  /**
   * Valor de sql mantenido por la instancia.
   */
  readonly sql: string;
  /** Extensión de la que depende; si no está instalada, la sentencia se omite. */
  readonly requiresExtension?: string;
  /**
   * Condición previa opcional: SQL que debe devolver una única fila con una
   * columna booleana `ok`. Si devuelve falso, la sentencia se omite con el
   * motivo de `preconditionReason` en lugar de intentarse y fallar.
   *
   * Existe para distinguir dos situaciones que un try/catch confunde: "esto
   * falló y hay que investigarlo" frente a "esto no se puede hacer todavía y ya
   * sabemos por qué".
   */
  readonly precondition?: string;
  /** Explicación que se registra cuando la condición previa no se cumple. */
  readonly preconditionReason?: string;
  /**
   * Nivel con el que se registra la omisión. `info` para estados normales ("ya
   * está hecho"), `warn` para capacidades que quedan sin materializar y alguien
   * debería revisar. Por defecto, `warn`.
   */
  readonly preconditionSeverity?: 'info' | 'warn';
}
