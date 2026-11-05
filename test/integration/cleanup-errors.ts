/**
 * Lectura de los errores de PostgreSQL que producen las limpiezas del arnés.
 *
 * Una violación de FK (`23503`) llega con `schema` y `table` en campos
 * separados: `table` trae sólo `audit_log`, no `audit.audit_log`. El grafo que
 * lee `readSchemaGraph` (y, con él, el conjunto de tablas WORM) guarda los
 * nombres calificados por esquema, así que preguntar `noBorrables.has(pgErr.table)`
 * nunca acierta y toda violación contra una tabla inmutable se reportaba como
 * «agréguela a la lista de limpieza», que es la receta equivocada: esa tabla no
 * se puede borrar, por mucho que se la agregue.
 */

/** Los campos de un error de `pg` que identifican la tabla infractora. */
export interface PgViolationLike {
  /** Esquema de la tabla hija que tiene la FK. */
  schema?: string;
  /** Nombre de la tabla hija, sin esquema. */
  table?: string;
}

/**
 * Nombre calificado (`esquema.tabla`) de la tabla que originó la violación,
 * con el mismo formato que usa el grafo de FK.
 *
 * @param err - Error de `pg` (o cualquier objeto con `schema` y `table`).
 * @returns `esquema.tabla`; `tabla` sola si el servidor no informó esquema;
 *   `(desconocida)` si no informó ni tabla.
 */
export function qualifiedViolationTable(err: PgViolationLike): string {
  if (err.table === undefined || err.table === '') return '(desconocida)';
  if (err.schema === undefined || err.schema === '') return err.table;
  return `${err.schema}.${err.table}`;
}
