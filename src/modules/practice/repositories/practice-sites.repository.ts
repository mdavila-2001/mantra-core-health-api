import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeSites } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un sitio de práctica. */
export interface CreateSiteData {
  practiceId: string;
  code: string;
  name: string;
  siteTypeConceptId: string;
  statusConceptId: string;
  operationalStatusConceptId: string;
  physicalTypeConceptId?: string;
  timeZone?: string;
  addressId?: string;
  branchId?: string;
  managingTenantId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `practice.practice_sites` (stateless). */
@Injectable()
export class PracticeSitesRepository {
  findById(em: EntityManager, id: string): Promise<PracticeSites | null> {
    return em.findOne(PracticeSites, { id });
  }

  findByPracticeAndCode(
    em: EntityManager,
    practiceId: string,
    code: string,
  ): Promise<PracticeSites | null> {
    return em.findOne(PracticeSites, { practiceId, code });
  }

  create(em: EntityManager, data: CreateSiteData): PracticeSites {
    return em.create(
      PracticeSites,
      {
        practiceId: data.practiceId,
        code: data.code,
        name: data.name,
        siteTypeConceptId: data.siteTypeConceptId,
        physicalTypeConceptId: data.physicalTypeConceptId,
        operationalStatusConceptId: data.operationalStatusConceptId,
        timeZone: data.timeZone,
        addressId: data.addressId,
        branchId: data.branchId,
        managingTenantId: data.managingTenantId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
