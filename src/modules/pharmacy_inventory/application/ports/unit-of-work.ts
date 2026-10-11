import type { EntityManager } from '@mikro-orm/postgresql';

/** Unidad de trabajo compartida por los repositorios y puertos del módulo. */
export type UnitOfWork = EntityManager;
