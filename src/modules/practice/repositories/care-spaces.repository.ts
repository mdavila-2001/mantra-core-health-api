import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareSpaces } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear un espacio de atención bajo un sitio. */
export interface CreateCareSpaceData {
  practiceSiteId: string;
  code: string;
  name: string;
  spaceTypeConceptId: string;
  statusConceptId: string;
  operationalStatusConceptId: string;
  clinicalUnitId?: string;
  parentSpaceId?: string;
  capacity?: number;
  actorUserId?: string;
}

/** Acceso a datos de `practice.care_spaces` (stateless). */
@Injectable()
export class CareSpacesRepository {
  findById(em: EntityManager, id: string): Promise<CareSpaces | null> {
    return em.findOne(CareSpaces, { id });
  }

  findBySite(em: EntityManager, practiceSiteId: string): Promise<CareSpaces[]> {
    return em.find(CareSpaces, { practiceSiteId });
  }

  create(em: EntityManager, data: CreateCareSpaceData): CareSpaces {
    return em.create(
      CareSpaces,
      {
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        parentSpaceId: data.parentSpaceId,
        code: data.code,
        name: data.name,
        spaceTypeConceptId: data.spaceTypeConceptId,
        capacity: data.capacity,
        operationalStatusConceptId: data.operationalStatusConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
