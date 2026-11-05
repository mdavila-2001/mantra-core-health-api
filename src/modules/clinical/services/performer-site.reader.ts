import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Lo que la validación del ejecutor necesita saber de las sedes y de la
 * afiliación de los médicos, sin que `clinical` importe `practice`.
 *
 * Es una clase abstracta y no una interfaz para servir de token de inyección:
 * `clinical.module.ts` registra la implementación que lee las tablas.
 */
export abstract class PerformerSiteReader {
  /**
   * ¿La sede ofrece el procedimiento, activo y con precio publicado?
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Sede sugerida.
   * @param procedureConceptId - Procedimiento de la orden.
   */
  abstract offersProcedureWithPrice(
    em: EntityManager,
    practiceSiteId: string,
    procedureConceptId: string,
  ): Promise<boolean>;

  /**
   * ¿El médico tiene afiliación `ACTIVE` y vigente para ese procedimiento en esa sede?
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Médico.
   * @param practiceSiteId - Sede sugerida.
   * @param procedureConceptId - Procedimiento de la orden.
   */
  abstract isActivelyAffiliated(
    em: EntityManager,
    practitionerProfileId: string,
    practiceSiteId: string,
    procedureConceptId: string,
  ): Promise<boolean>;
}
