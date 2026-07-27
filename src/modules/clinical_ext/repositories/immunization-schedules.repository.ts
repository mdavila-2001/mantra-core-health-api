import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ImmunizationSchedules } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una dosis de un calendario de inmunización. */
export interface CreateImmunizationScheduleData {
  tenantId?: string;
  vaccineConceptId: string;
  name: string;
  recommendedAgeDays?: number;
  doseNumber?: number;
  intervalDays?: number;
  jurisdictionConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.immunization_schedules`. */
@Injectable()
export class ImmunizationSchedulesRepository {
  /** Calendario activo para una jurisdicción (o global) — base de la proyección. */
  findActive(
    em: EntityManager,
    statusConceptId: string,
    jurisdictionConceptId?: string,
    tenantId?: string,
  ): Promise<ImmunizationSchedules[]> {
    return em.find(
      ImmunizationSchedules,
      {
        statusConceptId,
        ...(jurisdictionConceptId ? { jurisdictionConceptId } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      { orderBy: { doseNumber: 'asc' } },
    );
  }

  create(
    em: EntityManager,
    data: CreateImmunizationScheduleData,
  ): ImmunizationSchedules {
    return em.create(
      ImmunizationSchedules,
      {
        tenantId: data.tenantId,
        vaccineConceptId: data.vaccineConceptId,
        name: data.name,
        recommendedAgeDays: data.recommendedAgeDays,
        doseNumber: data.doseNumber,
        intervalDays: data.intervalDays,
        jurisdictionConceptId: data.jurisdictionConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
