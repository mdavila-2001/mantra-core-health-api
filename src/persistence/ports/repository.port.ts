import type { ReadContext, WriteContext } from './persistence-context';

/**
 * Superficie general de acceso a datos, separada en lectura y escritura.
 *
 * Estos contratos son el mínimo común que cualquier adaptador debe cumplir, y
 * existen sobre todo para que la suite de contrato del §53 pueda ejercer a
 * PostgreSQL y a cualquier motor futuro con el mismo cuerpo de pruebas.
 *
 * NO son la interfaz que los casos de uso deben consumir por defecto. Un puerto
 * genérico `findMany(criteria)` obliga al criterio a ser un objeto opaco que
 * acaba pareciéndose al `where` del ORM, y entonces la abstracción no abstrae
 * nada. Los casos de uso consumen puertos específicos del dominio -con nombres
 * de negocio, como `findOpenSlotsInWindow`- y son esos puertos los que un
 * adaptador implementa. El §7 lo dice de forma explícita: nada de repositorio
 * universal gigantesco.
 */

/** Lecturas genéricas sobre un agregado. */
export interface ReadRepository<TEntity, TId, TCriteria = unknown> {
  /** Recupera por identificador, o `null` si no existe. */
  findById(id: TId, context?: ReadContext): Promise<TEntity | null>;
  /** Primera coincidencia del criterio, o `null`. */
  findOne(criteria: TCriteria, context?: ReadContext): Promise<TEntity | null>;
  /** Todas las coincidencias del criterio. */
  findMany(criteria: TCriteria, context?: ReadContext): Promise<TEntity[]>;
  /** Si existe al menos una coincidencia. */
  exists(criteria: TCriteria, context?: ReadContext): Promise<boolean>;
  /** Número de coincidencias. */
  count(criteria: TCriteria, context?: ReadContext): Promise<number>;
}

/** Escrituras genéricas sobre un agregado. */
export interface WriteRepository<TEntity, TId> {
  /** Inserta y devuelve la entidad materializada. */
  insert(entity: TEntity, context?: WriteContext): Promise<TEntity>;
  /** Actualiza y devuelve la entidad resultante. */
  update(entity: TEntity, context?: WriteContext): Promise<TEntity>;
  /** Elimina por identificador. */
  delete(id: TId, context?: WriteContext): Promise<void>;
}
