import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  createdBy,
  requireTenantId,
  roleAuthorizesInTenant,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOpsPort,
} from '../../practice/services/care-space-ops.port';
import { InfrastructureAccessService } from '../../practice/services/infrastructure-access.service';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { ImagingProcedureSteps } from '../entities';
import {
  CreateImagingStepDto,
  ImagingStepDto,
  ImagingWorklistDto,
  ImagingWorklistQueryDto,
  ScheduleImagingStepDto,
} from '../dto';
import { DiagnosticsPatientAccessService } from './diagnostics-patient-access.service';
import { DiagnosticsScopeService } from './diagnostics-scope.service';

/** Cuánto dura un estudio cuando el paso no declara otra duración (supuesto de la ventana de reserva de la sala). */
export const IMAGING_STEP_DEFAULT_MINUTES = 30;

/** Máximo de la ventana de la worklist: una estación pide su jornada, no el historial. */
export const IMAGING_WORKLIST_MAX_DAYS = 7;

/** Estados desde los que un paso se programa o se reprograma. */
const SCHEDULABLE_STEP_STATES: readonly string[] = [
  DIAG.PROCEDURE_STEP_PLANNED,
  DIAG.PROCEDURE_STEP_SCHEDULED,
];

/** Estados del equipo en los que no se programan estudios. */
const EQUIPMENT_OUT_OF_SERVICE: readonly string[] = [
  DUNIT.EQUIPMENT_MAINTENANCE,
  DUNIT.EQUIPMENT_OUT_OF_SERVICE,
];

interface StepRow {
  id: string;
  imagingStudyId: string;
  stepNumber: number;
  statusConceptId: string;
  scheduledEquipmentId: string | null;
  scheduledCareSpaceId: string | null;
  scheduledStartAt: Date | null;
}

/** Una fila de la worklist tal como la devuelve el SELECT. */
interface WorklistRow {
  step_id: string;
  imaging_study_id: string;
  dicom_study_instance_uid: string;
  accession_number: string | null;
  patient_profile_id: string;
  modality_concept_id: string | null;
  equipment_id: string;
  ae_title: string | null;
  station_name: string | null;
  scheduled_care_space_id: string | null;
  sps_location: string | null;
  scheduled_start_at: Date | string;
}

/** El 404 uniforme: inexistente y de otro tenant responden igual. */
function notAvailable(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Recurso no encontrado',
    undefined,
    DiagnosticsErrorReason.DIAGNOSTICS_RESOURCE_NOT_AVAILABLE,
  );
}

/**
 * Pasos de imagen programados y Modality Worklist (F5a).
 *
 * Un paso programado dice **dónde** se hace el estudio: el equipo y, derivada de él, la sala
 * (`scheduled_care_space_id`). La sala nunca la manda el cliente: sale de dónde está el equipo,
 * así el par equipo–sala que exige la base no se puede desarmar desde la API. Programar exige
 * que el equipo esté en servicio y que la sala se pueda reservar (F2: bloqueos, mantenimiento,
 * ciclo de vida), y serializa con la reubicación del equipo.
 *
 * El centro que ejecuta es el custodio del estudio: el estudio y el equipo tienen que ser de la
 * organización del contexto (404 uniforme si no).
 */
@Injectable()
export class DiagnosticsImagingStepsService {
  /**
   * @param em - Contexto de persistencia.
   * @param scope - Alcance de tenant de los recursos clínicos.
   * @param ops - Puerto de F2: ¿se puede reservar la sala?
   * @param logger - Logger.
   * @param infra - Política de infraestructura (quién opera la estación).
   * @param patientAccess - Política de acceso al paciente.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly scope: DiagnosticsScopeService,
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
    private readonly logger: PinoLogger,
    private readonly infra: InfrastructureAccessService,
    private readonly patientAccess: DiagnosticsPatientAccessService,
  ) {
    this.logger.setContext(DiagnosticsImagingStepsService.name);
  }

  /** Crea un paso planificado del estudio (todavía sin equipo ni sala). */
  async createStep(
    studyId: string,
    dto: CreateImagingStepDto,
    actor: AuthenticatedUser,
  ): Promise<ImagingStepDto> {
    this.logger.info(
      { operation: 'diagnostics.imagingStep.create', studyId },
      'Creating imaging procedure step',
    );
    return this.em.transactional(async (tx) => {
      const study = await this.scope.study(tx, studyId);
      // Serializa la numeración de los pasos del estudio.
      await tx.execute(
        `select 1 from diagnostics.imaging_studies where id = ? for update`,
        [study.id],
      );
      const [{ next }] = await tx.execute<{ next: number }[]>(
        `select coalesce(max(step_number), 0) + 1 as next
           from diagnostics.imaging_procedure_steps where imaging_study_id = ?`,
        [study.id],
      );
      const step = tx.create(
        ImagingProcedureSteps,
        {
          imagingStudyId: study.id,
          stepNumber: Number(next),
          codeConceptId: dto.codeConceptId,
          modalityConceptId: dto.modalityConceptId,
          bodySiteConceptId: dto.bodySiteConceptId,
          protocolReference: dto.protocolReference,
          statusConceptId: DIAG.PROCEDURE_STEP_PLANNED,
          ...createdBy(actor.id),
        },
        { partial: true },
      );
      await tx.flush();
      return this.toDto({
        id: step.id,
        imagingStudyId: study.id,
        stepNumber: Number(next),
        statusConceptId: DIAG.PROCEDURE_STEP_PLANNED,
        scheduledEquipmentId: null,
        scheduledCareSpaceId: null,
        scheduledStartAt: null,
      });
    });
  }

  /**
   * Programa el paso en un equipo y una hora. La sala es la del equipo.
   *
   * @throws ResourceNotFoundException (404 uniforme) si el paso o el equipo no son del tenant.
   * @throws PreconditionFailedException `IMAGING_EQUIPMENT_NOT_LOCATED`,
   *   `IMAGING_EQUIPMENT_UNAVAILABLE`, `SPACE_NOT_BOOKABLE` (la sala está bloqueada, en
   *   mantenimiento o no activa en esa hora).
   */
  async scheduleStep(
    stepId: string,
    dto: ScheduleImagingStepDto,
    actor: AuthenticatedUser,
  ): Promise<ImagingStepDto> {
    this.logger.info(
      { operation: 'diagnostics.imagingStep.schedule', stepId },
      'Scheduling imaging procedure step',
    );
    const tenantId = requireTenantId();
    const start = new Date(dto.scheduledStartAt);
    const end = new Date(
      start.getTime() + IMAGING_STEP_DEFAULT_MINUTES * 60_000,
    );
    return this.em.transactional(async (tx) => {
      const found = await tx.execute<{ id: string; study_id: string }[]>(
        `select s.id, s.imaging_study_id as study_id
           from diagnostics.imaging_procedure_steps s
           join diagnostics.imaging_studies st on st.id = s.imaging_study_id
          where s.id = ? and st.custodian_tenant_id = ?`,
        [stepId, tenantId],
      );
      if (found.length === 0) throw notAvailable();
      // Relee el paso bloqueado: el estado se decide con la fila que nadie más puede cambiar.
      const [locked] = await tx.execute<{ status_concept_id: string }[]>(
        `select status_concept_id from diagnostics.imaging_procedure_steps where id = ? for update`,
        [stepId],
      );
      if (!SCHEDULABLE_STEP_STATES.includes(locked.status_concept_id)) {
        throw new ConflictException(
          'El paso ya no se puede programar en su estado actual',
          undefined,
          DiagnosticsErrorReason.IMAGING_STEP_STATE_INVALID,
        );
      }

      // El equipo es de la organización del contexto; se bloquea `FOR SHARE` para que su
      // reubicación (que lo toma `FOR UPDATE`) se serialice con esta programación.
      const equipments = await tx.execute<
        {
          care_space_id: string | null;
          operational_status_concept_id: string;
        }[]
      >(
        `select e.care_space_id, e.operational_status_concept_id
           from diagnostic_units.diagnostic_equipment e
           join diagnostic_units.diagnostic_unit_sites us on us.id = e.diagnostic_unit_site_id
           join diagnostic_units.diagnostic_units u on u.id = us.diagnostic_unit_id
          where e.id = ? and u.tenant_id = ? for share of e`,
        [dto.equipmentId, tenantId],
      );
      if (equipments.length === 0) throw notAvailable();
      const equipment = equipments[0];
      if (!equipment.care_space_id) {
        throw new PreconditionFailedException(
          'El equipo no está ubicado en una sala',
          { equipmentId: dto.equipmentId },
          DiagnosticsErrorReason.IMAGING_EQUIPMENT_NOT_LOCATED,
        );
      }
      if (
        EQUIPMENT_OUT_OF_SERVICE.includes(
          equipment.operational_status_concept_id,
        )
      ) {
        throw new PreconditionFailedException(
          'El equipo está fuera de servicio',
          { equipmentId: dto.equipmentId },
          DiagnosticsErrorReason.IMAGING_EQUIPMENT_UNAVAILABLE,
        );
      }
      // La sala: se bloquea `FOR SHARE` (un bloqueo de F2 toma `FOR UPDATE`) y se comprueba.
      await tx.execute(
        `select 1 from practice.care_spaces where id = ? and tenant_id = ? for share`,
        [equipment.care_space_id, tenantId],
      );
      await this.ops.assertBookable(tx, equipment.care_space_id, {
        start,
        end,
      });

      const step = await tx.findOneOrFail(ImagingProcedureSteps, {
        id: stepId,
      });
      // Las tres columnas a la vez: la sala exige el equipo (CHECK) y es la del equipo (trigger).
      step.scheduledEquipmentId = dto.equipmentId;
      step.scheduledCareSpaceId = equipment.care_space_id;
      step.scheduledStartAt = start;
      step.statusConceptId = DIAG.PROCEDURE_STEP_SCHEDULED;
      touch(step, actor.id);
      await tx.flush();
      return this.toDto({
        id: step.id,
        imagingStudyId: step.imagingStudyId,
        stepNumber: step.stepNumber,
        statusConceptId: step.statusConceptId,
        scheduledEquipmentId: dto.equipmentId,
        scheduledCareSpaceId: equipment.care_space_id,
        scheduledStartAt: start,
      });
    });
  }

  /**
   * La Modality Worklist de una estación: los pasos programados en ese equipo, con el AE Title
   * y la sala (SPS Location). Se pide por estación —no hay un volcado de todo el centro—, en una
   * ventana de hasta {@link IMAGING_WORKLIST_MAX_DAYS} días y con tope de filas; solo viaja el
   * identificador del paciente.
   *
   * Quién ve a qué paciente: quien opera la estación (plataforma, o administración de la
   * organización o de la sede del equipo: `infra.equipment.worklist`) ve toda la lista; el resto
   * del personal clínico ve únicamente los pacientes con los que tiene una relación asistencial
   * vigente (la misma política que el resto de lo clínico). Un paciente sin relación no
   * aparece, ni cuenta.
   *
   * @throws PreconditionFailedException (`IMAGING_WORKLIST_STATION_REQUIRED`,
   *   `IMAGING_WORKLIST_WINDOW_INVALID`, `IMAGING_WORKLIST_WINDOW_TOO_LARGE`).
   */
  async worklist(
    query: ImagingWorklistQueryDto,
    actor: AuthenticatedUser,
  ): Promise<ImagingWorklistDto> {
    if (!query.equipmentId && !query.aeTitle) {
      throw new PreconditionFailedException(
        'Indique el equipo o el AE Title de la estación',
        undefined,
        DiagnosticsErrorReason.IMAGING_WORKLIST_STATION_REQUIRED,
      );
    }
    const tenantId = requireTenantId();
    const from = query.from
      ? new Date(query.from)
      : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
    const to = query.to
      ? new Date(query.to)
      : new Date(from.getTime() + 24 * 3_600_000);
    if (to.getTime() <= from.getTime()) {
      throw new PreconditionFailedException(
        'La ventana termina antes de empezar',
        undefined,
        DiagnosticsErrorReason.IMAGING_WORKLIST_WINDOW_INVALID,
      );
    }
    if (
      to.getTime() - from.getTime() >
      IMAGING_WORKLIST_MAX_DAYS * 86_400_000
    ) {
      throw new PreconditionFailedException(
        `La ventana de la worklist admite hasta ${IMAGING_WORKLIST_MAX_DAYS} días`,
        { maxDays: IMAGING_WORKLIST_MAX_DAYS },
        DiagnosticsErrorReason.IMAGING_WORKLIST_WINDOW_TOO_LARGE,
      );
    }
    const limit = Math.min(query.limit ?? 100, 200);
    const station = query.equipmentId
      ? { sql: 'e.id = ?', value: query.equipmentId }
      : { sql: 'e.ae_title = ?', value: query.aeTitle };
    const em = this.em.fork();
    const rows = await em.execute<WorklistRow[]>(
      `select s.id as step_id, s.imaging_study_id, st.dicom_study_instance_uid,
              st.accession_number, st.patient_profile_id, s.modality_concept_id,
              e.id as equipment_id, e.ae_title, e.station_name,
              s.scheduled_care_space_id, cs.code as sps_location, s.scheduled_start_at
         from diagnostics.imaging_procedure_steps s
         join diagnostics.imaging_studies st on st.id = s.imaging_study_id
         join diagnostic_units.diagnostic_equipment e on e.id = s.scheduled_equipment_id
         join diagnostic_units.diagnostic_unit_sites us on us.id = e.diagnostic_unit_site_id
         join diagnostic_units.diagnostic_units u on u.id = us.diagnostic_unit_id
         left join practice.care_spaces cs on cs.id = s.scheduled_care_space_id
        where st.custodian_tenant_id = ? and u.tenant_id = ?
          and s.status_concept_id = ? and ${station.sql}
          and s.scheduled_start_at >= ? and s.scheduled_start_at < ?
        order by s.scheduled_start_at, s.step_number
        limit ?`,
      [
        tenantId,
        tenantId,
        DIAG.PROCEDURE_STEP_SCHEDULED,
        station.value,
        from,
        to,
        limit + 1,
      ],
    );
    const truncated = rows.length > limit;
    const visible = await this.visibleRows(
      em,
      tenantId,
      rows.slice(0, limit),
      actor,
    );
    const items = visible.map((row) => ({
      stepId: row.step_id,
      imagingStudyId: row.imaging_study_id,
      studyInstanceUid: row.dicom_study_instance_uid,
      accessionNumber: row.accession_number ?? null,
      patientProfileId: row.patient_profile_id,
      modalityConceptId: row.modality_concept_id ?? null,
      scheduledStationAETitle: row.ae_title ?? null,
      scheduledStationName: row.station_name ?? null,
      spsLocation: row.sps_location ?? null,
      careSpaceId: row.scheduled_care_space_id ?? null,
      equipmentId: row.equipment_id,
      scheduledStartAt: new Date(row.scheduled_start_at).toISOString(),
    }));
    return { items, count: items.length, truncated };
  }

  /**
   * Las filas que el actor puede ver: todas las de los equipos que opera, y de los demás solo las
   * de pacientes con los que tiene relación asistencial (se consulta una vez por paciente).
   */
  private async visibleRows(
    em: EntityManager,
    tenantId: string,
    rows: WorklistRow[],
    actor: AuthenticatedUser,
  ): Promise<WorklistRow[]> {
    if (roleAuthorizesInTenant(actor, 'SUPERADMIN', tenantId)) return rows;
    const operated = new Map<string, boolean>();
    for (const row of rows) {
      if (operated.has(row.equipment_id)) continue;
      operated.set(
        row.equipment_id,
        await this.operatesStation(em, actor, row.scheduled_care_space_id),
      );
    }
    const patients = new Map<string, boolean>();
    const visible: WorklistRow[] = [];
    for (const row of rows) {
      if (operated.get(row.equipment_id)) {
        visible.push(row);
        continue;
      }
      let allowed = patients.get(row.patient_profile_id);
      if (allowed === undefined) {
        allowed = await this.patientAccess
          .assertCanReadPatient(row.patient_profile_id, actor)
          .then(
            () => true,
            (error: unknown) => {
              if (error instanceof ResourceNotFoundException) return false;
              throw error;
            },
          );
        patients.set(row.patient_profile_id, allowed);
      }
      if (allowed) visible.push(row);
    }
    return visible;
  }

  /** ¿Opera la estación? Administración de la sala del equipo; sin alcance o sin rol, no. */
  private async operatesStation(
    em: EntityManager,
    actor: AuthenticatedUser,
    careSpaceId: string | null,
  ): Promise<boolean> {
    if (!careSpaceId) return false;
    try {
      await this.infra.assertCan(
        actor,
        'infra.equipment.worklist',
        { careSpaceId },
        em,
      );
      return true;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof InsufficientRoleException
      ) {
        return false;
      }
      throw error;
    }
  }

  private toDto(row: StepRow): ImagingStepDto {
    return {
      id: row.id,
      imagingStudyId: row.imagingStudyId,
      stepNumber: row.stepNumber,
      statusConceptId: row.statusConceptId,
      scheduledEquipmentId: row.scheduledEquipmentId,
      scheduledCareSpaceId: row.scheduledCareSpaceId,
      scheduledStartAt: row.scheduledStartAt
        ? row.scheduledStartAt.toISOString()
        : null,
    };
  }
}
