import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { LegalHolds } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/**
 * Acceso a datos de legal holds (UC-11-08). Un objetivo no puede tener dos holds
 * ACTIVE simultáneos (unique parcial en BD); aquí se ofrece la verificación previa.
 */
@Injectable()
export class LegalHoldRepository {
  /** Includes foreign-tenant and revoked/unknown rows: applicability is not a SQL omission. */
  findForLifecycleGraph(
    em: EntityManager,
    targetIds: string[],
  ): Promise<LegalHolds[]> {
    return em.find(LegalHolds, { targetId: { $in: targetIds } });
  }
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<LegalHolds | null>`.
   */
  findById(em: EntityManager, id: string): Promise<LegalHolds | null> {
    return em.findOne(LegalHolds, { id });
  }

  /** Hold ACTIVE existente para (tenant, tipo, objetivo). */
  findActive(
    em: EntityManager,
    tenantId: string,
    targetTypeConceptId: string,
    targetId: string,
  ): Promise<LegalHolds | null> {
    return em.findOne(LegalHolds, {
      tenantId,
      targetTypeConceptId,
      targetId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `LegalHolds`.
   */
  create(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a target type concept.
       */
      targetTypeConceptId: string;
      /**
       * Identificador asociado a target.
       */
      targetId: string;
      /**
       * Identificador asociado a reason concept.
       */
      reasonConceptId: string;
      /**
       * Valor de authority reference mantenido por la instancia.
       */
      authorityReference?: string;
      /**
       * Valor de starts at mantenido por la instancia.
       */
      startsAt?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): LegalHolds {
    const { actorUserId, ...rest } = data;
    return em.create(
      LegalHolds,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
