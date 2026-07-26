import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClinicalUnits } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una unidad clínica jerárquica. */
export interface CreateClinicalUnitData {
  practiceSiteId: string;
  code: string;
  name: string;
  unitTypeConceptId: string;
  statusConceptId: string;
  parentUnitId?: string;
  specialtyConceptId?: string;
  serviceModeConceptId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `practice.clinical_units` (stateless). */
@Injectable()
export class ClinicalUnitsRepository {
  findById(em: EntityManager, id: string): Promise<ClinicalUnits | null> {
    return em.findOne(ClinicalUnits, { id });
  }

  findBySite(em: EntityManager, practiceSiteId: string): Promise<ClinicalUnits[]> {
    return em.find(ClinicalUnits, { practiceSiteId });
  }

  create(em: EntityManager, data: CreateClinicalUnitData): ClinicalUnits {
    return em.create(
      ClinicalUnits,
      {
        practiceSiteId: data.practiceSiteId,
        parentUnitId: data.parentUnitId,
        code: data.code,
        name: data.name,
        unitTypeConceptId: data.unitTypeConceptId,
        specialtyConceptId: data.specialtyConceptId,
        serviceModeConceptId: data.serviceModeConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
