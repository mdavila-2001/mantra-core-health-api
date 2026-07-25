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

  create(
    em: EntityManager,
    data: {
      tenantId: string;
      targetTypeConceptId: string;
      targetId: string;
      reasonConceptId: string;
      authorityReference?: string;
      startsAt?: Date;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): LegalHolds {
    const { actorUserId, ...rest } = data;
    return em.create(LegalHolds, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }
}
