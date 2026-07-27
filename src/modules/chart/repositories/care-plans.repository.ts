import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CarePlans, CarePlanActivities } from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de un plan de cuidado. */
export interface CreateCarePlanData {
  patientProfileId: string;
  conditionId?: string;
  encounterId?: string;
  statusConceptId: string;
  intentConceptId?: string;
  goalText?: string;
  startDate?: Date;
  endDate?: Date;
  authorProfileId?: string;
  actorUserId?: string;
}

/** Datos de alta de una actividad del plan de cuidado. */
export interface CreateActivityData {
  carePlanId: string;
  activityConceptId: string;
  statusConceptId: string;
  scheduledAt?: Date;
  detailText?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos del agregado "plan de cuidado": el plan y sus actividades.
 * Métodos stateless que reciben el `EntityManager` activo.
 */
@Injectable()
export class CarePlansRepository {
  findPlanById(em: EntityManager, id: string): Promise<CarePlans | null> {
    return em.findOne(CarePlans, { id });
  }

  findActivityById(
    em: EntityManager,
    id: string,
  ): Promise<CarePlanActivities | null> {
    return em.findOne(CarePlanActivities, { id });
  }

  findActivitiesForPlan(
    em: EntityManager,
    carePlanId: string,
  ): Promise<CarePlanActivities[]> {
    return em.find(CarePlanActivities, { carePlanId });
  }

  createPlan(em: EntityManager, data: CreateCarePlanData): CarePlans {
    return em.create(
      CarePlans,
      {
        patientProfileId: data.patientProfileId,
        conditionId: data.conditionId,
        encounterId: data.encounterId,
        statusConceptId: data.statusConceptId,
        intentConceptId: data.intentConceptId,
        goalText: data.goalText,
        startDate: data.startDate,
        endDate: data.endDate,
        authorProfileId: data.authorProfileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createActivity(
    em: EntityManager,
    data: CreateActivityData,
  ): CarePlanActivities {
    return em.create(
      CarePlanActivities,
      {
        carePlanId: data.carePlanId,
        activityConceptId: data.activityConceptId,
        statusConceptId: data.statusConceptId,
        scheduledAt: data.scheduledAt,
        detailText: data.detailText,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
