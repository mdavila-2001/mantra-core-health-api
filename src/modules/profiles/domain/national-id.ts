import { CONCEPTS } from '../../../common/constants/concepts';

/**
 * Forma canónica de un documento de identidad: mayúsculas, sin puntos, guiones
 * ni espacios y sin ceros de relleno a la izquierda. Es la forma con la que se
 * GUARDA y con la que se COMPARA: «1234567», «01234567», «1.234.567 » y
 * «1-234-567» son el mismo documento y no pueden dar de alta a dos personas.
 *
 * Un documento que queda sin contenido (solo ceros o solo separadores) vuelve
 * como `'0'`: nunca hay una forma vacía que coincida con todo. Quien registra
 * rechaza esos documentos; esto solo garantiza que la función es total.
 *
 * La consulta SQL que compara documentos usa la misma regla
 * ({@link normalizedNationalIdSql}) y el índice único del modelo
 * (`common.uq_identifiers_national_id_normalized`) también: si se cambia una, se
 * cambian las tres.
 *
 * @param raw - Documento tal como lo escribió quien registra.
 * @returns El documento canónico.
 */
export function normalizeNationalId(raw: string): string {
  const compact = raw.toUpperCase().replace(/[\s.-]+/g, '');
  const stripped = compact.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
}

/** Largo mínimo del documento canónico para admitirlo en un alta. */
export const MIN_NATIONAL_ID_LENGTH = 4;

/**
 * Índice único del modelo (v4.2.71) que impide dos documentos nacionales
 * activos del mismo paciente en su forma canónica.
 */
export const NATIONAL_ID_UNIQUE_INDEX = 'uq_identifiers_national_id_normalized';

/**
 * Fragmento SQL: la forma canónica de una columna de documento. Es, carácter
 * por carácter, la expresión del índice {@link NATIONAL_ID_UNIQUE_INDEX} y la
 * misma regla que {@link normalizeNationalId}.
 *
 * @param column - Columna (o alias de columna) con el documento.
 */
export const normalizedNationalIdSql = (column: string): string =>
  `coalesce(nullif(regexp_replace(upper(regexp_replace(${column}, '[\\s.-]+', '', 'g')), '^0+', ''), ''), '0')`;

/**
 * Fragmento SQL: los cuatro predicados del índice
 * {@link NATIONAL_ID_UNIQUE_INDEX} (documento nacional, activo, de paciente y sin
 * cierre), con los tres ids como literales.
 *
 * Postgres solo usa un índice parcial si la consulta repite su predicado, y con
 * un plan genérico (sentencia con nombre) no puede probar que parámetros
 * `$2..$4` lo implican: por eso los ids van inlineados. Son constantes de
 * catálogo, nunca entrada de usuario.
 *
 * @param alias - Alias de `common.identifiers` en la consulta.
 */
export const nationalIdIndexPredicateSql = (alias: string): string =>
  `${alias}.type_concept_id = '${CONCEPTS.ID_TYPE_NATIONAL}'
 and ${alias}.state_concept_id = '${CONCEPTS.STATE_ACTIVE}'
 and ${alias}.owner_type_concept_id = '${CONCEPTS.OWNER_PATIENT}'
 and ${alias}.valid_to is null`;

/**
 * ¿`error` es la violación del índice único del documento normalizado
 * (SQLSTATE `23505`, restricción {@link NATIONAL_ID_UNIQUE_INDEX})? Recorre la
 * cadena de causas porque MikroORM envuelve el error del driver.
 */
export function isNationalIdUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as {
      code?: unknown;
      constraint?: unknown;
      cause?: unknown;
    };
    if (
      candidate.constraint === NATIONAL_ID_UNIQUE_INDEX &&
      (candidate.code === undefined || candidate.code === '23505')
    ) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}
