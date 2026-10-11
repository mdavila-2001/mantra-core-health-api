import type { UnitOfWork } from './unit-of-work';

/** El único dato de un vínculo cuenta-persona que usa el pedido. */
export interface PersonAccountLinkSnapshot {
  readonly userId: string;
}

/** Resolución de la cuenta activa de una persona (contexto profiles). */
export interface PersonAccountLinksPort {
  findActiveByPerson(
    uow: UnitOfWork,
    personId: string,
  ): Promise<PersonAccountLinkSnapshot | null>;
}

/** Token de inyección de los vínculos persona-cuenta. */
export const PERSON_ACCOUNT_LINKS_PORT = Symbol('PERSON_ACCOUNT_LINKS_PORT');
