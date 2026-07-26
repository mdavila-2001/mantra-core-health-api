import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { CarePlansRepository } from '../repositories';
import { CHART } from '../chart.concepts';
import {
  ActivityResponseDto,
  CarePlanResponseDto,
  CreateCarePlanDto,
  UpdateActivityDto,
  type ActivityStatus,
} from '../dto';

/** Mapa estado (DTO) → concepto de estado de actividad. */
const ACTIVITY_STATUS_CONCEPT: Record<ActivityStatus, string> = {
  SCHEDULED: CHART.ACTIVITY_SCHEDULED,
  IN_PROGRESS: CHART.ACTIVITY_IN_PROGRESS,
  COMPLETED: CHART.ACTIVITY_COMPLETED,
  CANCELLED: CHART.ACTIVITY_CANCELLED,
};

/**
 * Casos de uso de plan de cuidado (UC-15-10, UC-15-11). Crear plan y sus
 * actividades es atómico; actualizar una actividad puede completar el plan si
 * todas sus actividades quedan completadas. Ambas tablas llevan `row_version`
 * optimista.
 */
@Injectable()
export class ChartCarePlansService {
  constructor(
    private readonly em: EntityManager,
    private readonly carePlansRepo: CarePlansRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChartCarePlansService.name);
  }

  /** UC-15-10: crea un plan de cuidado activo con sus actividades iniciales. */
  async createCarePlan(
    dto: CreateCarePlanDto,
    actor: AuthenticatedUser,
  ): Promise<CarePlanResponseDto> {
    this.logger.info(
      { operation: 'chart.carePlan.create', actorId: actor.id, activities: dto.activities?.length ?? 0 },
      'Creating care plan',
    );
    return this.em.transactional(async (tx) => {
      const plan = this.carePlansRepo.createPlan(tx, {
        patientProfileId: dto.patientProfileId,
        conditionId: dto.conditionId,
        encounterId: dto.encounterId,
        statusConceptId: CHART.CAREPLAN_ACTIVE,
        intentConceptId: dto.intentConceptId ?? CHART.CAREPLAN_INTENT_PLAN,
        goalText: dto.goalText,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        authorProfileId: dto.authorProfileId,
        actorUserId: actor.id,
      });
      // FK planas: persistir el plan antes de sus actividades.
      await tx.flush();

      const activities = dto.activities ?? [];
      for (const a of activities) {
        this.carePlansRepo.createActivity(tx, {
          carePlanId: plan.id,
          activityConceptId: a.activityConceptId ?? CHART.ACTIVITY_DEFAULT,
          statusConceptId: CHART.ACTIVITY_SCHEDULED,
          scheduledAt: a.scheduledAt ? new Date(a.scheduledAt) : undefined,
          detailText: a.detailText,
          actorUserId: actor.id,
        });
      }

      this.logger.info({ operation: 'chart.carePlan.create', planId: plan.id }, 'Care plan created');
      return {
        id: plan.id,
        statusConceptId: plan.statusConceptId,
        activityCount: activities.length,
        createdAt: plan.createdAt,
      };
    });
  }

  /** UC-15-11: actualiza una actividad y completa el plan si todas terminaron. */
  async updateActivity(
    planId: string,
    activityId: string,
    dto: UpdateActivityDto,
    actor: AuthenticatedUser,
  ): Promise<ActivityResponseDto> {
    this.logger.info(
      { operation: 'chart.carePlan.updateActivity', planId, activityId },
      'Updating care plan activity',
    );
    return this.em.transactional(async (tx) => {
      const plan = await this.carePlansRepo.findPlanById(tx, planId);
      if (!plan) throw new ResourceNotFoundException('Plan de cuidado no encontrado', { planId });
      if (plan.statusConceptId !== CHART.CAREPLAN_ACTIVE) {
        throw new PreconditionFailedException('El plan de cuidado no está activo', { planId });
      }

      const activity = await this.carePlansRepo.findActivityById(tx, activityId);
      if (!activity || activity.carePlanId !== planId) {
        throw new ResourceNotFoundException('Actividad no encontrada', { planId, activityId });
      }

      if (dto.status) activity.statusConceptId = ACTIVITY_STATUS_CONCEPT[dto.status];
      if (dto.scheduledAt !== undefined) activity.scheduledAt = new Date(dto.scheduledAt);
      if (dto.detailText !== undefined) activity.detailText = dto.detailText;
      touch(activity, actor.id);

      // Completa el plan si todas sus actividades quedaron completadas.
      const siblings = await this.carePlansRepo.findActivitiesForPlan(tx, planId);
      const allCompleted =
        siblings.length > 0 &&
        siblings.every((s) => s.statusConceptId === CHART.ACTIVITY_COMPLETED);
      if (allCompleted) {
        plan.statusConceptId = CHART.CAREPLAN_COMPLETED;
        touch(plan, actor.id);
      }

      return {
        id: activity.id,
        statusConceptId: activity.statusConceptId,
        planStatusConceptId: plan.statusConceptId,
      };
    });
  }
}
