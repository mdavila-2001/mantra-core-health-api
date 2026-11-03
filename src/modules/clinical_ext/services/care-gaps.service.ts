import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalReadService } from '../../clinical/services/clinical-read.service';
import { PersonsRepository } from '../../profiles/infrastructure/repositories';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import {
  assertBodyTenantMatches,
  assertWriteOrNotFound,
  lockLogicalKey,
} from './clinical-ext-access';
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
 * Fecha civil `YYYY-MM-DD` (UTC) de un valor de fecha, o `null` si no es una
 * fecha válida. La semántica es de fecha civil: la hora y la zona del cliente
 * no mueven el día de nacimiento.
 *
 * @param value - `Date` de la base o texto ISO 8601 del cliente.
 * @returns La fecha civil, o `null`.
 */
function toCivilDate(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/**
 * Brechas de cuidado: recomputo/upsert de brechas abiertas (UC-18-09), cierre por
 * evento clínico (UC-18-10) y proyección del plan de inmunización que abre una
 * brecha por dosis pendiente (UC-18-11). El upsert por clave lógica
 * (paciente, tipo, medida) evita brechas duplicadas.
 */
@Injectable()
export class CareGapsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param gapsRepo - Valor de gaps repo requerido por la operación.
   * @param schedulesRepo - Valor de schedules repo requerido por la operación.
   * @param clinicalRead - Política de acceso a la historia del paciente.
   * @param personsRepo - Fuente canónica de la fecha de nacimiento.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly gapsRepo: CareGapsRepository,
    private readonly schedulesRepo: ImmunizationSchedulesRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly personsRepo: PersonsRepository,
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
    await this.clinicalRead.assertCanWriteHistory(dto.patientProfileId, actor);

    return this.em.transactional(async (tx) => {
      const openedIds: string[] = [];
      let skipped = 0;

      for (const gap of dto.gaps) {
        // Sin índice único en el DDL, la lectura previa no es una garantía:
        // se serializa por clave lógica para que la segunda petición vea la
        // brecha que la primera acaba de confirmar.
        await lockLogicalKey(
          tx,
          `clinical_ext.care_gap:${dto.patientProfileId}:${gap.gapTypeConceptId}:${gap.measureConceptId ?? ''}`,
        );
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
      const notFound = {
        message: 'Brecha de cuidado no encontrada',
        reason: ClinicalExtErrorReason.CARE_GAP_NOT_FOUND,
      };
      const gap = await this.gapsRepo.findById(tx, gapId);
      if (!gap) {
        throw new ResourceNotFoundException(
          notFound.message,
          undefined,
          notFound.reason,
        );
      }
      // Una brecha de un paciente que el actor no atiende responde igual que
      // una inexistente.
      await assertWriteOrNotFound(
        this.clinicalRead,
        gap.patientProfileId,
        actor,
        notFound,
      );
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
    // El tenant del calendario sale del contexto; el del cuerpo sólo se contrasta.
    const tenantId = requireTenantId();
    assertBodyTenantMatches(dto.tenantId, tenantId);
    await this.clinicalRead.assertCanWriteHistory(patientProfileId, actor);

    return this.em.transactional(async (tx) => {
      // La fecha de nacimiento que decide cuándo vence cada dosis es la del
      // perfil, no la que envíe el cliente.
      const birth = await this.resolveBirthDate(
        tx,
        patientProfileId,
        dto.birthDate,
      );
      const schedules = await this.schedulesRepo.findActive(
        tx,
        CEXT.IMMUNIZATION_SCHEDULE_ACTIVE,
        dto.jurisdictionConceptId,
        tenantId,
      );
      const openedIds: string[] = [];

      for (const schedule of schedules) {
        await lockLogicalKey(
          tx,
          `clinical_ext.care_gap:${patientProfileId}:${CEXT.GAP_TYPE_IMMUNIZATION}:${schedule.vaccineConceptId}`,
        );
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

  /**
   * Fecha de nacimiento canónica del paciente, como fecha civil UTC.
   *
   * @param tx - Transacción activa.
   * @param patientProfileId - Paciente (su id de perfil es el de su persona).
   * @param claimed - Fecha enviada por el cliente, si la hubo.
   * @returns Medianoche UTC de la fecha de nacimiento del perfil.
   * @throws PreconditionFailedException si el perfil no tiene fecha válida, o si
   *   la enviada por el cliente no coincide con la del perfil.
   */
  private async resolveBirthDate(
    tx: EntityManager,
    patientProfileId: string,
    claimed: string | undefined,
  ): Promise<Date> {
    const person = await this.personsRepo.findById(tx, patientProfileId);
    const civil = toCivilDate(person?.birthDate);
    if (!civil) {
      throw new PreconditionFailedException(
        'El perfil del paciente no tiene una fecha de nacimiento válida',
        undefined,
        ClinicalExtErrorReason.CARE_GAP_BIRTH_DATE_UNAVAILABLE,
      );
    }
    if (claimed !== undefined && toCivilDate(claimed) !== civil) {
      // No se devuelve la fecha del perfil: es un dato del paciente.
      throw new PreconditionFailedException(
        'La fecha de nacimiento enviada no coincide con la del perfil del paciente',
        undefined,
        ClinicalExtErrorReason.CARE_GAP_BIRTH_DATE_MISMATCH,
      );
    }
    return new Date(`${civil}T00:00:00.000Z`);
  }

  /** Registra una dosis del calendario de inmunización (dato de referencia, UC-18-11). */
  async createSchedule(
    dto: CreateImmunizationScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<{
    /**
     * Identificador único de la instancia.
     */
    id: string;
  }> {
    // Un calendario con tenant sólo lo da de alta quien actúa en ese tenant.
    if (dto.tenantId !== undefined) {
      assertBodyTenantMatches(dto.tenantId, requireTenantId());
    }
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
