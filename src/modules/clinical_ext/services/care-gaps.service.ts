import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CareGapsRepository,
  ImmunizationSchedulesRepository,
} from '../repositories';
import {
  RecomputeCareGapsDto,
  CloseCareGapDto,
  ProjectImmunizationPlanDto,
  CreateImmunizationScheduleDto,
  RecomputeCareGapsResponseDto,
  ImmunizationPlanResponseDto,
  StatusResultDto,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';

/**
 * Brechas de cuidado: recomputo/upsert de brechas abiertas (UC-18-09), cierre por
 * evento clínico (UC-18-10) y proyección del plan de inmunización que abre una
 * brecha por dosis pendiente (UC-18-11). El upsert por clave lógica
 * (paciente, tipo, medida) evita brechas duplicadas.
 */
@Injectable()
export class CareGapsService {
  constructor(
    private readonly em: EntityManager,
    private readonly gapsRepo: CareGapsRepository,
    private readonly schedulesRepo: ImmunizationSchedulesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CareGapsService.name);
  }

  /** UC-18-09: abre las brechas vigentes que aún no existen (upsert idempotente). */
  async recompute(
    dto: RecomputeCareGapsDto,
    actor: AuthenticatedUser,
  ): Promise<RecomputeCareGapsResponseDto> {
    this.logger.info(
      {
        operation: 'clinical_ext.care_gap.recompute',
        patientProfileId: dto.patientProfileId,
      },
      'Recomputing care gaps',
    );
    return this.em.transactional(async (tx) => {
      const openedIds: string[] = [];
      let skipped = 0;

      for (const gap of dto.gaps) {
        const existing = await this.gapsRepo.findOpen(
          tx,
          dto.patientProfileId,
          gap.gapTypeConceptId,
          gap.measureConceptId,
          CEXT.CARE_GAP_OPEN,
        );
        if (existing) {
          skipped++;
          continue;
        }
        const created = this.gapsRepo.create(tx, {
          patientProfileId: dto.patientProfileId,
          gapTypeConceptId: gap.gapTypeConceptId,
          measureConceptId: gap.measureConceptId,
          dueDate: gap.dueDate ? new Date(gap.dueDate) : undefined,
          statusConceptId: CEXT.CARE_GAP_OPEN,
          actorUserId: actor.id,
        });
        await tx.flush();
        openedIds.push(created.id);
      }

      return { opened: openedIds.length, skipped, openedIds };
    });
  }

  /** UC-18-10: cierra una brecha abierta por evidencia clínica. */
  async close(
    gapId: string,
    dto: CloseCareGapDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'clinical_ext.care_gap.close', gapId },
      'Closing care gap',
    );
    return this.em.transactional(async (tx) => {
      const gap = await this.gapsRepo.findById(tx, gapId);
      if (!gap)
        throw new ResourceNotFoundException('Brecha de cuidado no encontrada', {
          gapId,
        });
      if (gap.statusConceptId !== CEXT.CARE_GAP_OPEN) {
        throw new PreconditionFailedException('La brecha no está abierta', {
          gapId,
        });
      }

      gap.statusConceptId = CEXT.CARE_GAP_CLOSED;
      gap.closedAt = new Date();
      gap.closedByResourceType = dto.closedByResourceType;
      gap.closedByResourceId = dto.closedByResourceId;
      touch(gap, actor.id);

      return { ok: true };
    });
  }

  /** UC-18-11: proyecta el calendario y abre una brecha por dosis pendiente. */
  async projectImmunizationPlan(
    patientProfileId: string,
    dto: ProjectImmunizationPlanDto,
    actor: AuthenticatedUser,
  ): Promise<ImmunizationPlanResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.immunization.project', patientProfileId },
      'Projecting immunization plan',
    );
    return this.em.transactional(async (tx) => {
      const schedules = await this.schedulesRepo.findActive(
        tx,
        CEXT.IMMUNIZATION_SCHEDULE_ACTIVE,
        dto.jurisdictionConceptId,
        dto.tenantId,
      );
      const birth = new Date(dto.birthDate);
      const openedIds: string[] = [];

      for (const schedule of schedules) {
        const existing = await this.gapsRepo.findOpen(
          tx,
          patientProfileId,
          CEXT.GAP_TYPE_IMMUNIZATION,
          schedule.vaccineConceptId,
          CEXT.CARE_GAP_OPEN,
        );
        if (existing) continue;

        const dueDate = new Date(birth);
        dueDate.setUTCDate(
          dueDate.getUTCDate() + (schedule.recommendedAgeDays ?? 0),
        );

        const created = this.gapsRepo.create(tx, {
          patientProfileId,
          gapTypeConceptId: CEXT.GAP_TYPE_IMMUNIZATION,
          measureConceptId: schedule.vaccineConceptId,
          dueDate,
          statusConceptId: CEXT.CARE_GAP_OPEN,
          actorUserId: actor.id,
        });
        await tx.flush();
        openedIds.push(created.id);
      }

      return {
        gapsOpened: openedIds.length,
        dosesEvaluated: schedules.length,
        openedIds,
      };
    });
  }

  /** Registra una dosis del calendario de inmunización (dato de referencia, UC-18-11). */
  async createSchedule(
    dto: CreateImmunizationScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.em.transactional(async (tx) => {
      const schedule = this.schedulesRepo.create(tx, {
        tenantId: dto.tenantId,
        vaccineConceptId: dto.vaccineConceptId,
        name: dto.name,
        recommendedAgeDays: dto.recommendedAgeDays,
        doseNumber: dto.doseNumber,
        intervalDays: dto.intervalDays,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        statusConceptId: CEXT.IMMUNIZATION_SCHEDULE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: schedule.id };
    });
  }
}
