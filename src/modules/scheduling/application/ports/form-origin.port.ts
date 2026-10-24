import type { UnitOfWork } from './unit-of-work';

/**
 * Validación del formulario de origen de una reconsulta (contexto `forms`).
 *
 * P43: la reconsulta puede declarar de qué formulario médico cerrado sale.
 */
export interface FormOriginPort {
  /**
   * Exige que la instancia exista, esté cerrada y sea del encuentro dado.
   *
   * @throws PreconditionFailedException (422) si no es un origen utilizable.
   */
  assertUsableOrigin(
    uow: UnitOfWork,
    formInstanceId: string,
    encounterId: string | null,
  ): Promise<void>;
}

/** Token de inyección de la validación del formulario de origen. */
export const FORM_ORIGIN_PORT = Symbol('FORM_ORIGIN_PORT');
