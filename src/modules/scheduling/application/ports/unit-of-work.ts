import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * La unidad de trabajo que los casos de uso comparten con sus puertos.
 *
 * Hoy es el `EntityManager` de MikroORM porque todos los repositorios del
 * proyecto son clases sin estado que lo reciben por parámetro. Se nombra acá,
 * en un solo lugar: si los repositorios dejaran de recibirlo (separando el
 * modelo de dominio de la entidad ORM), el cambio tocaría este archivo y no
 * cada puerto.
 */
export type UnitOfWork = EntityManager;
