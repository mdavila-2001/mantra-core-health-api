import type { DdlLayer } from '../ddl-layer.contract';
import { extensionsLayer } from './01-extensions.layer';
import { schemasLayer } from './02-schemas.layer';
import { typesLayer } from './03-types.layer';
import { tablesLayer } from './04-tables.layer';
import { indexesLayer } from './05-indexes.layer';
import { foreignKeysLayer } from './06-foreign-keys.layer';
import { physicalLayer } from './07-physical.layer';

/**
 * Secuencia completa de materialización del DDL, en orden de ejecución.
 *
 * El orden refleja dependencias duras de PostgreSQL, no preferencias:
 *
 *   01 extensiones  -> aportan los tipos base y los operadores
 *   02 schemas      -> contienen los tipos y las tablas
 *   03 tipos        -> los enums nativos que declaran algunas columnas
 *   04 tablas       -> contienen las columnas que se indexan y referencian
 *   05 índices      -> incluyen los únicos a los que apuntan las FKs
 *   06 claves ajenas-> exigen origen y destino ya materializados
 *   07 físico       -> transforma tablas existentes (hypertables, HNSW)
 *
 * Cada eslabón se descubrió aplicando la secuencia contra una base vacía: la
 * capa 03, por ejemplo, se añadió porque sin ella el DDL de tablas aborta con
 * "type terminology.technical_data_type does not exist" a mitad del lote.
 *
 * Se ordena en tiempo de ejecución por el campo `order` en vez de confiar en el
 * orden del array, para que reordenar los imports no cambie el comportamiento.
 */
export const ddlLayers: readonly DdlLayer[] = [
  extensionsLayer,
  schemasLayer,
  typesLayer,
  tablesLayer,
  indexesLayer,
  foreignKeysLayer,
  physicalLayer,
].sort((a, b) => a.order - b.order);

export type { DdlLayer } from '../ddl-layer.contract';
