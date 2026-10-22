import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * La unidad de trabajo que los casos de uso comparten con sus puertos.
 *
 * Hoy es el `EntityManager` de MikroORM porque todos los repositorios del
 * proyecto son clases sin estado que lo reciben por parámetro. Se nombra acá,
 * en un solo lugar, para que el día que los repositorios dejen de recibirlo
 * (decisión pendiente: separar el modelo de dominio de la entidad ORM) el
 * cambio toque este archivo y no cada puerto.
 */
export type UnitOfWork = EntityManager;
