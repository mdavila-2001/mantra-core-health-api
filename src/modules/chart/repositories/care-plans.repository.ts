import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CarePlans, CarePlanActivities } from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de un plan de cuidado. */
export interface CreateCarePlanData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a condition.
   */
  conditionId?: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a intent concept.
   */
  intentConceptId?: string;
  /**
   * Valor de goal text mantenido por la instancia.
   */
  goalText?: string;
  /**
   * Valor de start date mantenido por la instancia.
   */
  startDate?: Date;
  /**
   * Valor de end date mantenido por la instancia.
   */
  endDate?: Date;
  /**
   * Identificador asociado a author profile.
   */
  authorProfileId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de alta de una actividad del plan de cuidado. */
export interface CreateActivityData {
  /**
   * Identificador asociado a care plan.
   */
  carePlanId: string;
  /**
   * Identificador asociado a activity concept.
   */
  activityConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  scheduledAt?: Date;
  /**
   * Valor de detail text mantenido por la instancia.
   */
  detailText?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos del agregado "plan de cuidado": el plan y sus actividades.
 * Métodos stateless que reciben el `EntityManager` activo.
 */
@Injectable()
export class CarePlansRepository {
  /**
   * Obtiene find plan by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find plan by id conforme al contrato `Promise<CarePlans | null>`.
   */
  findPlanById(em: EntityManager, id: string): Promise<CarePlans | null> {
    return em.findOne(CarePlans, { id });
  }

  /**
   * Obtiene find activity by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find activity by id conforme al contrato `Promise<CarePlanActivities | null>`.
   */
  findActivityById(
    em: EntityManager,
    id: string,
  ): Promise<CarePlanActivities | null> {
    return em.findOne(CarePlanActivities, { id });
  }

  /**
   * Obtiene find activities for plan.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param carePlanId - Identificador de care plan.
   * @returns Resultado de find activities for plan conforme al contrato `Promise<CarePlanActivities[]>`.
   */
  findActivitiesForPlan(
    em: EntityManager,
    carePlanId: string,
  ): Promise<CarePlanActivities[]> {
    return em.find(CarePlanActivities, { carePlanId });
  }

  /**
   * Crea create plan.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create plan conforme al contrato `CarePlans`.
   */
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

  /**
   * Crea create activity.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create activity conforme al contrato `CarePlanActivities`.
   */
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
