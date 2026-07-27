import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeAccreditations } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una acreditación de práctica/sitio. */
export interface CreateAccreditationData {
  practiceId: string;
  accreditationTypeConceptId: string;
  verificationStatusConceptId: string;
  practiceSiteId?: string;
  accreditationNumber?: string;
  issuerTenantId?: string;
  issuerName?: string;
  validFrom?: Date;
  validTo?: Date;
  evidenceFileId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `practice.practice_accreditations` (stateless). */
@Injectable()
export class PracticeAccreditationsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PracticeAccreditations | null> {
    return em.findOne(PracticeAccreditations, { id });
  }

  create(
    em: EntityManager,
    data: CreateAccreditationData,
  ): PracticeAccreditations {
    return em.create(
      PracticeAccreditations,
      {
        practiceId: data.practiceId,
        practiceSiteId: data.practiceSiteId,
        accreditationTypeConceptId: data.accreditationTypeConceptId,
        accreditationNumber: data.accreditationNumber,
        issuerTenantId: data.issuerTenantId,
        issuerName: data.issuerName,
        validFrom: data.validFrom,
        validTo: data.validTo,
        evidenceFileId: data.evidenceFileId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
