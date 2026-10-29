import { randomUUID } from 'node:crypto';
import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  createdBy,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { AuthzCareRelationshipsService } from '../../authz/services';
import type { CareRelationshipRequestNotice } from '../../authz/services';
import { assertRowVersion } from '../../practice/http/row-version';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import { CLIN } from '../clinical.concepts';
import {
  ADMISSION_SOURCES,
  DISCHARGE_DISPOSITIONS,
  INCIDENT_STATUS,
  ISOLATION_PRECAUTIONS,
  ISO_NONE_ID,
  LEVELS_OF_CARE,
} from '../domain/adt-catalog';
import type { CompatibilityViolation } from '../domain/bed-compatibility-rules';
import type {
  AdtOverrideDto,
  BedAssignmentDto,
  BedSwapDto,
  CancelLocationDto,
  CreateAdmissionDto,
  DischargeDto,
  ReviewIncidentDto,
  TransferDto,
} from '../dto/adt.dto';
import { Encounters } from '../entities';
import {
  INFRA_F3_ACTIONS,
  type InfraF3Action,
} from '../policies/infra-f3.policy';
import type { OccupancyCode } from '../../practice/domain/bed-status-v2';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOpsPort,
} from '../../practice/services/care-space-ops.port';
import { toBedOpsView, type BedOpsView } from '../domain/bed-ops-view';
import {
  AdtRepository,
  type AdtEncounterRow,
  type AdtLocationRow,
  type AdtSpaceRow,
} from '../repositories/adt.repository';
import { CareEpisodesRepository, EncountersRepository } from '../repositories';
import { AdtAccessService, type AdtScope } from './adt-access.service';
import { ADT_EVENTS, AdtEventsService } from './adt-events.service';
import { AdtSettingsService } from './adt-settings.service';
import { BedCompatibilityService } from './bed-compatibility.service';
import { EncountersService } from './encounters.service';

/** Resultado de un ingreso. */
export interface AdmissionResult {
  episodeId: string | null;
  encounterId: string;
  encounterLocationId?: string;
  cell?: BedOpsView;
  incidentId?: string;
}

/** Resultado de asignar o reservar una cama. */
export interface BedAssignmentResult {
  encounterLocationId: string;
  cell: BedOpsView;
  incidentId?: string;
}

/** Resultado de un traslado. */
export interface TransferResult {
  fromLocationId: string;
  toLocationId: string;
  cleaningOrderId: string;
  cell: BedOpsView;
  incidentId?: string;
}

/** Resultado de un intercambio. */
export interface SwapResult {
  locations: {
    encounterId: string;
    closedLocationId: string;
    openedLocationId: string;
    careSpaceId: string;
  }[];
  incidentIds: string[];
}

/** Resultado de un egreso. */
export interface DischargeResult {
  encounterId: string;
  cleaningOrderId: string | null;
}

/** Datos comunes de una colocación en cama. */
interface PlaceBedInput {
  tenantId: string;
  scope: AdtScope;
  encounter: AdtEncounterRow;
  space: AdtSpaceRow;
  mode: 'ASSIGN' | 'RESERVE';
  at: Date;
  movementConceptId: string;
  previousLocationId?: string | null;
  override?: AdtOverrideDto;
  excludeEncounterIds: readonly string[];
  occupancyWaived: boolean;
  actor: AuthenticatedUser;
}

interface PlaceBedResult {
  location: AdtLocationRow;
  incidentId: string | null;
}

const CONSTRAINTS_DEFERRABLE = [
  'clinical.ex_encounter_locations_bed_occupancy',
  'clinical.ex_encounter_locations_encounter_single_bed',
  'clinical.ex_encounter_locations_encounter_one_active_bed',
].join(', ');

/**
 * Internación / ADT (CONTRATO-F2-F5 F3.3): ingreso con asignación de cama,
 * traslado, intercambio (A17), egreso, reservas y su cancelación.
 *
 * Todas las operaciones corren en **una** transacción y respetan el mismo orden
 * de bloqueos —encuentros por id y luego camas por id— para no interbloquearse
 * entre sí. La unicidad de la ocupación la garantiza la base (`EXCLUDE`); la API
 * pre-valida con el estado operativo que da el puerto de F2 para responder con el
 * motivo, y la base es la red.
 *
 * Una cama no se libera por tocar el estado: el origen de un traslado y de un
 * egreso se deja sucio a través del puerto (`markDirtyFromSource`), que crea la
 * orden de limpieza.
 */
@Injectable()
export class InpatientAdtService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - SQL de la internación.
   * @param access - Política de F3.
   * @param compat - Compatibilidad de camas.
   * @param settings - Ajustes `infra.*`.
   * @param events - Outbox.
   * @param historyRepo - Historia.
   * @param encounters - Cierre del encuentro por egreso.
   * @param encountersRepo - Alta de encuentros y participantes.
   * @param episodesRepo - Episodios de cuidado.
   * @param careRelationships - Relación asistencial del profesional tratante.
   * @param ops - Puerto de F2.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AdtRepository,
    private readonly access: AdtAccessService,
    private readonly compat: BedCompatibilityService,
    private readonly settings: AdtSettingsService,
    private readonly events: AdtEventsService,
    private readonly historyRepo: HistoryRepository,
    private readonly encounters: EncountersService,
    private readonly encountersRepo: EncountersRepository,
    private readonly episodesRepo: CareEpisodesRepository,
    private readonly careRelationships: AuthzCareRelationshipsService,
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InpatientAdtService.name);
  }

  // =========================================================================
  // Ingreso
  // =========================================================================

  /**
   * `POST /clinical/admissions`: abre la internación y, si se pidió, asigna o
   * reserva la cama en la misma transacción.
   *
   * @param dto - Cuerpo.
   * @param actor - Quien ingresa.
   * @param requestId - Id de correlación.
   */
  async admit(
    dto: CreateAdmissionDto,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<AdmissionResult> {
    const notices: CareRelationshipRequestNotice[] = [];
    const result = await this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const siteScope = await this.access.forSite(
        tx,
        dto.practiceSiteId,
        actor,
      );
      let scope = siteScope;
      if (dto.bed) {
        scope = await this.access.forSpace(tx, dto.bed.careSpaceId, actor);
        if (scope.siteId !== dto.practiceSiteId) {
          throw new PreconditionFailedException(
            'La cama es de otro establecimiento',
            undefined,
            ClinicalErrorReason.BED_SITE_MISMATCH,
          );
        }
      }
      this.access.assertCan(scope, INFRA_F3_ACTIONS.ADMIT);

      const levelOfCare = this.code(
        LEVELS_OF_CARE.byInput(dto.levelOfCareCode),
        'levelOfCareCode',
      );
      const source = this.code(
        ADMISSION_SOURCES.byInput(dto.admissionSourceCode),
        'admissionSourceCode',
      );
      const precaution = dto.isolationPrecautionCode
        ? this.code(
            ISOLATION_PRECAUTIONS.byInput(dto.isolationPrecautionCode),
            'isolationPrecautionCode',
          )
        : undefined;

      const now = new Date();
      const admittedAt = dto.admittedAt ? new Date(dto.admittedAt) : now;
      if (admittedAt.getTime() > now.getTime()) {
        throw new PreconditionFailedException(
          'La fecha del ingreso está en el futuro',
          undefined,
          ClinicalErrorReason.OCCURRED_AT_IN_FUTURE,
        );
      }

      const patient = await this.repo.patientFacts(tx, dto.patientProfileId);
      if (!patient) throw this.notFound();
      await this.assertPractitioner(tx, dto.attendingPractitionerId);

      // Un paciente, una internación en curso: se serializa por paciente para que
      // dos ingresos simultáneos no pasen la comprobación a la vez.
      await tx.execute('select pg_advisory_xact_lock(hashtextextended(?, 0))', [
        `adt:admission:${dto.patientProfileId}`,
      ]);
      const already = await tx.execute<{ id: string }[]>(
        `select id from clinical.encounters
          where patient_profile_id = ? and tenant_id = ? and class_concept_id = ?
            and status_concept_id = ? limit 1`,
        [
          dto.patientProfileId,
          tenantId,
          CLIN.ENCOUNTER_CLASS_INPATIENT,
          CLIN.ENCOUNTER_IN_PROGRESS,
        ],
      );
      if (already.length > 0) {
        throw new ConflictException(
          'El paciente ya tiene una internación en curso',
          { encounterId: already[0].id },
          ClinicalErrorReason.PATIENT_ALREADY_ADMITTED,
        );
      }

      // Cama: se bloquea antes de crear nada.
      let space: AdtSpaceRow | undefined;
      if (dto.bed) {
        const locked = await this.repo.lockSpaces(tx, [dto.bed.careSpaceId]);
        space = locked.get(dto.bed.careSpaceId);
        if (!space || space.tenantId !== tenantId) throw this.notFound();
        this.compat.assertBed(space);
      }

      const episodeId = await this.resolveEpisode(
        tx,
        dto,
        tenantId,
        admittedAt,
        actor,
      );

      const encounter = tx.create(
        Encounters,
        {
          patientProfileId: dto.patientProfileId,
          tenantId,
          episodeId: episodeId ?? undefined,
          branchId: siteScope.branchId ?? undefined,
          primaryPractitionerId: dto.attendingPractitionerId,
          classConceptId: CLIN.ENCOUNTER_CLASS_INPATIENT,
          statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
          reasonText: dto.reasonText,
          startAt: admittedAt,
          levelOfCareConceptId: levelOfCare.id,
          admissionSourceConceptId: source.id,
          isolationPrecautionConceptId: precaution?.id,
          isolationOrganismText: dto.isolationOrganismText,
          expectedDischargeAt: dto.expectedDischargeAt
            ? new Date(dto.expectedDischargeAt)
            : undefined,
          ...createdBy(actor.id),
        },
        { partial: true },
      );
      // FK planas: el encuentro se persiste antes que su participante.
      await tx.flush();
      this.encountersRepo.createParticipant(tx, {
        encounterId: encounter.id,
        practitionerProfileId: dto.attendingPractitionerId,
        participantRoleConceptId: CLIN.PARTICIPANT_ROLE_ATTENDER,
        statusConceptId: CLIN.PARTICIPANT_ACTIVE,
        isResponsible: true,
        periodStart: admittedAt,
        actorUserId: actor.id,
      });
      await tx.flush();
      const encounterRow = (await this.repo.findEncounter(tx, encounter.id))!;

      let location: AdtLocationRow | undefined;
      let incidentId: string | null = null;
      if (space && dto.bed) {
        const placed = await this.placeBed(tx, {
          tenantId,
          scope,
          encounter: encounterRow,
          space,
          mode: dto.bed.mode,
          at: admittedAt,
          movementConceptId:
            dto.bed.mode === 'ASSIGN' ? CLIN.ADT_ADMIT : CLIN.ADT_RESERVE,
          override: dto.override,
          excludeEncounterIds: [encounterRow.id],
          occupancyWaived: false,
          actor,
        });
        location = placed.location;
        incidentId = placed.incidentId;
      }
      if (!location || dto.bed?.mode === 'RESERVE') {
        // «Pendiente de cama»: queda asentada la sede donde espera.
        await this.repo.insertLocation(tx, {
          encounterId: encounterRow.id,
          tenantId,
          practiceSiteId: dto.practiceSiteId,
          clinicalUnitId: null,
          careSpaceId: null,
          statusConceptId: CLIN.LOCATION_ACTIVE,
          periodStart: admittedAt,
          movementTypeConceptId: CLIN.ADT_ADMIT,
          actorUserId: actor.id,
        });
      }

      if (space && location) {
        await this.ops.recordOccupancyChange(tx, space.id, {
          from: 'OCC_FREE',
          to:
            location.statusConceptId === CLIN.LOCATION_ACTIVE
              ? 'OCC_OCCUPIED'
              : 'OCC_RESERVED',
          sourceRefId: location.id,
          actor,
          requestId,
        });
      }

      notices.push(
        ...(await this.careRelationships.recordEncounterCareRelationships(
          tx,
          {
            patientProfileId: dto.patientProfileId,
            tenantId,
            practitionerProfileIds: [dto.attendingPractitionerId],
          },
          actor,
        )),
      );

      await this.events.publish(tx, {
        type: ADT_EVENTS.admitted,
        aggregateType: 'encounter',
        aggregateId: encounterRow.id,
        tenantId,
        actorUserId: actor.id,
        correlationId: requestId,
        payload: {
          encounterId: encounterRow.id,
          patientProfileId: dto.patientProfileId,
          episodeId,
          practiceSiteId: dto.practiceSiteId,
          encounterLocationId: location?.id ?? null,
          careSpaceId: space?.id ?? null,
          bedMode: dto.bed?.mode ?? null,
          levelOfCareCode: levelOfCare.code,
          admissionSourceCode: source.code,
          admittedAt: admittedAt.toISOString(),
          incidentId,
        },
      });
      if (incidentId) {
        await this.publishOverride(tx, tenantId, actor, requestId, {
          incidentId,
          encounterId: encounterRow.id,
          careSpaceId: space!.id,
          encounterLocationId: location!.id,
        });
      }

      this.logger.info(
        { operation: 'clinical.adt.admit', encounterId: encounterRow.id },
        'Inpatient admitted',
      );
      return {
        episodeId,
        encounterId: encounterRow.id,
        encounterLocationId: location?.id,
        cell: space ? await this.bedState(tx, space.id) : undefined,
        incidentId: incidentId ?? undefined,
      } satisfies AdmissionResult;
    });
    await this.careRelationships.notifyEncounterCareRelationshipRequests(
      notices,
      actor,
    );
    return result;
  }

  // =========================================================================
  // Asignar / reservar
  // =========================================================================

  /**
   * `POST /clinical/encounters/:id/bed-assignment`: asigna o reserva una cama a
   * un encuentro ya ingresado; convierte una reserva propia en ocupación.
   *
   * @param encounterId - Encuentro.
   * @param dto - Cama, modo y forzado.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien asigna.
   * @param requestId - Id de correlación.
   */
  async assignBed(
    encounterId: string,
    dto: BedAssignmentDto,
    expectedVersion: number,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<BedAssignmentResult> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const peek = await this.repo.findEncounter(tx, encounterId);
      if (!peek || peek.tenantId !== tenantId) throw this.notFound();
      // Autoridad sobre la ubicación ACTUAL del encuentro antes de escribir nada:
      // tener alcance sobre la cama destino no basta para tocar a un paciente ajeno.
      await this.authorizeCurrent(
        tx,
        encounterId,
        actor,
        INFRA_F3_ACTIONS.ASSIGN_BED,
      );
      const scope = await this.access.forSpace(tx, dto.careSpaceId, actor);
      this.access.assertCan(scope, INFRA_F3_ACTIONS.ASSIGN_BED);

      const encounter = await this.lockInpatient(tx, encounterId, tenantId);
      assertRowVersion(encounter.rowVersion, expectedVersion);
      // Con el encuentro bloqueado la ubicación actual ya no puede cambiar.
      const origin = await this.authorizeCurrent(
        tx,
        encounterId,
        actor,
        INFRA_F3_ACTIONS.ASSIGN_BED,
      );
      if (origin.location.practiceSiteId !== scope.siteId) {
        throw new PreconditionFailedException(
          'La cama es de otro establecimiento que el encuentro',
          undefined,
          ClinicalErrorReason.BED_SITE_MISMATCH,
        );
      }
      const at = this.occurredAt(dto.occurredAt, encounter.startAt);

      const locked = await this.repo.lockSpaces(tx, [dto.careSpaceId]);
      const space = locked.get(dto.careSpaceId);
      if (!space || space.tenantId !== tenantId) throw this.notFound();
      this.compat.assertBed(space);

      const current = await this.repo.currentBed(tx, encounter.id, true);
      if (dto.mode === 'ASSIGN' && current) {
        throw new ConflictException(
          'El encuentro ya tiene cama; para cambiarla use un traslado',
          { encounterLocationId: current.id, careSpaceId: current.careSpaceId },
          ClinicalErrorReason.ENCOUNTER_ALREADY_HAS_BED,
        );
      }
      const reservations = await this.repo.reservations(tx, encounter.id);
      const own = reservations.find((r) => r.careSpaceId === space.id);
      if (own && dto.mode === 'RESERVE') {
        throw new ConflictException(
          'El encuentro ya tiene reservada esa cama',
          { encounterLocationId: own.id },
          ClinicalErrorReason.ENCOUNTER_ALREADY_HAS_BED,
        );
      }

      const placeInput: PlaceBedInput = {
        tenantId,
        scope,
        encounter,
        space,
        mode: dto.mode,
        at,
        movementConceptId:
          dto.mode === 'ASSIGN' ? CLIN.ADT_ADMIT : CLIN.ADT_RESERVE,
        override: dto.override,
        excludeEncounterIds: [encounter.id],
        occupancyWaived: !!own,
        actor,
      };
      // Todo en una transacción: si la colocación falla, la reserva sigue como estaba.
      if (own) await this.convertReservation(tx, own, at, actor);
      const placed = await this.placeBed(tx, placeInput);

      if (dto.mode === 'ASSIGN') {
        // Las demás reservas del encuentro dejan de tener sentido: ya tiene cama.
        for (const other of reservations.filter((r) => r.id !== own?.id)) {
          await this.cancelReservationRow(tx, other, at, actor, requestId);
        }
        const site = await this.repo.currentSiteLocation(tx, encounter.id);
        if (site) {
          await this.repo.closeLocation(
            tx,
            site.id,
            {
              statusConceptId: CLIN.LOCATION_COMPLETED,
              periodEnd: at,
              endReasonConceptId: null,
            },
            actor.id,
          );
          await this.appendLocationHistory(
            tx,
            site.id,
            tenantId,
            actor,
            'UPDATE',
          );
        }
      }

      const from: OccupancyCode = own ? 'OCC_RESERVED' : 'OCC_FREE';
      await this.ops.recordOccupancyChange(tx, space.id, {
        from,
        to: dto.mode === 'ASSIGN' ? 'OCC_OCCUPIED' : 'OCC_RESERVED',
        sourceRefId: placed.location.id,
        actor,
        requestId,
      });
      await this.repo.bumpEncounter(tx, encounter.id, actor.id);

      await this.events.publish(tx, {
        type:
          dto.mode === 'ASSIGN'
            ? ADT_EVENTS.bedAssigned
            : ADT_EVENTS.reservationCreated,
        aggregateType: 'encounter',
        aggregateId: encounter.id,
        tenantId,
        actorUserId: actor.id,
        correlationId: requestId,
        payload: {
          encounterId: encounter.id,
          encounterLocationId: placed.location.id,
          careSpaceId: space.id,
          mode: dto.mode,
          occurredAt: at.toISOString(),
          convertedReservationId: own?.id ?? null,
          incidentId: placed.incidentId,
        },
      });
      if (placed.incidentId) {
        await this.publishOverride(tx, tenantId, actor, requestId, {
          incidentId: placed.incidentId,
          encounterId: encounter.id,
          careSpaceId: space.id,
          encounterLocationId: placed.location.id,
        });
      }
      return {
        encounterLocationId: placed.location.id,
        cell: await this.bedState(tx, space.id),
        incidentId: placed.incidentId ?? undefined,
      };
    });
  }

  // =========================================================================
  // Traslado
  // =========================================================================

  /**
   * `POST /clinical/encounters/:id/transfer`: cierra el origen, abre el destino y
   * deja el origen sucio, **todo o nada**.
   *
   * @param encounterId - Encuentro.
   * @param dto - Destino, instante, motivo y forzado.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien traslada.
   * @param requestId - Id de correlación.
   */
  async transfer(
    encounterId: string,
    dto: TransferDto,
    expectedVersion: number,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<TransferResult> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const peek = await this.repo.findEncounter(tx, encounterId);
      if (!peek || peek.tenantId !== tenantId) throw this.notFound();
      await this.authorizeCurrent(
        tx,
        encounterId,
        actor,
        INFRA_F3_ACTIONS.TRANSFER,
      );
      const toScope = await this.access.forSpace(tx, dto.toCareSpaceId, actor);
      this.access.assertCan(toScope, INFRA_F3_ACTIONS.TRANSFER);

      const encounter = await this.lockInpatient(tx, encounterId, tenantId);
      assertRowVersion(encounter.rowVersion, expectedVersion);
      const origin = await this.repo.currentBed(tx, encounter.id, true);
      if (!origin || !origin.careSpaceId) {
        throw new ConflictException(
          'El encuentro no tiene una cama activa que trasladar',
          undefined,
          ClinicalErrorReason.ENCOUNTER_HAS_NO_BED,
        );
      }
      if (origin.careSpaceId === dto.toCareSpaceId) {
        throw new PreconditionFailedException(
          'La cama destino es la cama actual',
          undefined,
          ClinicalErrorReason.TRANSFER_TO_SAME_BED,
        );
      }
      const fromScope = await this.access.forSpace(
        tx,
        origin.careSpaceId,
        actor,
      );
      this.access.assertCan(fromScope, INFRA_F3_ACTIONS.TRANSFER);
      if (fromScope.siteId !== toScope.siteId) {
        throw new PreconditionFailedException(
          'El traslado entre establecimientos es un egreso, no un traslado interno',
          undefined,
          ClinicalErrorReason.BED_SITE_MISMATCH,
        );
      }
      const at = this.occurredAt(dto.occurredAt, origin.periodStart);

      const locked = await this.repo.lockSpaces(tx, [
        origin.careSpaceId,
        dto.toCareSpaceId,
      ]);
      const from = locked.get(origin.careSpaceId);
      const to = locked.get(dto.toCareSpaceId);
      if (!from || !to || to.tenantId !== tenantId) throw this.notFound();
      this.compat.assertBed(to);

      const reservations = await this.repo.reservations(tx, encounter.id);
      const own = reservations.find((r) => r.careSpaceId === to.id);
      const originState = await this.bedState(tx, from.id);
      const terminal = this.needsTerminalCleaning(encounter, originState);

      // 1) cierra el origen; 2) abre el destino. Con las restricciones inmediatas
      // el orden importa: el origen termina en `at` y el destino empieza en `at`.
      await this.repo.closeLocation(
        tx,
        origin.id,
        {
          statusConceptId: CLIN.LOCATION_COMPLETED,
          periodEnd: at,
          endReasonConceptId: CLIN.ADT_END_TRANSFER_OUT,
        },
        actor.id,
      );
      if (own) await this.convertReservation(tx, own, at, actor);
      const placed = await this.placeBed(tx, {
        tenantId,
        scope: toScope,
        encounter,
        space: to,
        mode: 'ASSIGN',
        at,
        movementConceptId: CLIN.ADT_TRANSFER,
        previousLocationId: origin.id,
        override: dto.override,
        excludeEncounterIds: [encounter.id],
        occupancyWaived: !!own,
        actor,
      });
      await this.appendLocationHistory(
        tx,
        origin.id,
        tenantId,
        actor,
        'UPDATE',
      );

      const { cleaningOrderId } = await this.ops.markDirtyFromSource(
        tx,
        from.id,
        {
          trigger: 'TRANSFER',
          sourceRefId: origin.id,
          terminal,
          actor,
          requestId,
        },
      );
      await this.ops.recordOccupancyChange(tx, from.id, {
        from: 'OCC_OCCUPIED',
        to: 'OCC_FREE',
        sourceRefId: origin.id,
        actor,
        requestId,
      });
      await this.ops.recordOccupancyChange(tx, to.id, {
        from: own ? 'OCC_RESERVED' : 'OCC_FREE',
        to: 'OCC_OCCUPIED',
        sourceRefId: placed.location.id,
        actor,
        requestId,
      });
      await this.repo.bumpEncounter(tx, encounter.id, actor.id);

      await this.events.publish(tx, {
        type: ADT_EVENTS.transferred,
        aggregateType: 'encounter',
        aggregateId: encounter.id,
        tenantId,
        actorUserId: actor.id,
        correlationId: requestId,
        payload: {
          encounterId: encounter.id,
          fromLocationId: origin.id,
          toLocationId: placed.location.id,
          fromCareSpaceId: from.id,
          toCareSpaceId: to.id,
          previousEncounterLocationId: origin.id,
          occurredAt: at.toISOString(),
          reasonCode: dto.reasonCode,
          cleaningOrderId,
          terminalCleaning: terminal,
          incidentId: placed.incidentId,
        },
      });
      if (placed.incidentId) {
        await this.publishOverride(tx, tenantId, actor, requestId, {
          incidentId: placed.incidentId,
          encounterId: encounter.id,
          careSpaceId: to.id,
          encounterLocationId: placed.location.id,
        });
      }
      return {
        fromLocationId: origin.id,
        toLocationId: placed.location.id,
        cleaningOrderId,
        cell: await this.bedState(tx, to.id),
        incidentId: placed.incidentId ?? undefined,
      };
    });
  }

  // =========================================================================
  // Intercambio (A17)
  // =========================================================================

  /**
   * `POST /clinical/bed-swaps`: dos pacientes cambian de cama en una sola
   * transacción, con las restricciones de ocupación **diferidas** para que el
   * estado intermedio (dos pacientes en una cama) no falle; se verifican antes de
   * confirmar.
   *
   * @param dto - Los dos encuentros, instante, motivo y forzado.
   * @param actor - Quien intercambia.
   * @param requestId - Id de correlación.
   */
  async swap(
    dto: BedSwapDto,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<SwapResult> {
    if (dto.encounterAId === dto.encounterBId) {
      throw new ConflictException(
        'El intercambio necesita dos encuentros distintos',
        undefined,
        ClinicalErrorReason.SWAP_SAME_ENCOUNTER,
      );
    }
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      for (const id of [dto.encounterAId, dto.encounterBId]) {
        const peek = await this.repo.findEncounter(tx, id);
        if (!peek || peek.tenantId !== tenantId) throw this.notFound();
      }
      // Alcance sobre AMBOS extremos antes de bloquear o escribir nada.
      for (const id of [dto.encounterAId, dto.encounterBId]) {
        await this.authorizeCurrent(tx, id, actor, INFRA_F3_ACTIONS.TRANSFER);
      }
      const locked = await this.repo.lockEncounters(tx, [
        dto.encounterAId,
        dto.encounterBId,
      ]);
      const a = locked.get(dto.encounterAId);
      const b = locked.get(dto.encounterBId);
      if (!a || !b) throw this.notFound();
      this.assertInpatientInProgress(a);
      this.assertInpatientInProgress(b);

      const locA = await this.repo.currentBed(tx, a.id, true);
      const locB = await this.repo.currentBed(tx, b.id, true);
      if (!locA?.careSpaceId || !locB?.careSpaceId) {
        throw new ConflictException(
          'El intercambio exige dos pacientes con cama activa',
          undefined,
          ClinicalErrorReason.SWAP_REQUIRES_TWO_OCCUPIED_BEDS,
        );
      }
      const scopeA = await this.access.forSpace(tx, locA.careSpaceId, actor);
      const scopeB = await this.access.forSpace(tx, locB.careSpaceId, actor);
      this.access.assertCan(scopeA, INFRA_F3_ACTIONS.TRANSFER);
      this.access.assertCan(scopeB, INFRA_F3_ACTIONS.TRANSFER);
      if (scopeA.siteId !== scopeB.siteId) {
        throw new PreconditionFailedException(
          'Las dos camas deben ser del mismo establecimiento',
          undefined,
          ClinicalErrorReason.BED_SITE_MISMATCH,
        );
      }
      const earliest = new Date(
        Math.max(locA.periodStart!.getTime(), locB.periodStart!.getTime()),
      );
      const at = this.occurredAt(dto.occurredAt, earliest);

      const spaces = await this.repo.lockSpaces(tx, [
        locA.careSpaceId,
        locB.careSpaceId,
      ]);
      const bedA = spaces.get(locA.careSpaceId)!;
      const bedB = spaces.get(locB.careSpaceId)!;

      // Compatibilidad cruzada: A en la cama de B y B en la de A. El compañero ya
      // no es vecino ni ocupante: se va en el mismo acto.
      const crossA = await this.evaluateSwapSide(tx, scopeB, a, bedB, at, [
        a.id,
        b.id,
      ]);
      const crossB = await this.evaluateSwapSide(tx, scopeA, b, bedA, at, [
        a.id,
        b.id,
      ]);
      const forcedA = this.compat.resolveOverride(
        crossA.violations,
        dto.override,
        scopeB,
      );
      const forcedB = this.compat.resolveOverride(
        crossB.violations,
        dto.override,
        scopeA,
      );

      const settings = await this.settings.forPractice(tx, scopeA.practiceId);
      const stateA = await this.bedState(tx, bedA.id);
      const stateB = await this.bedState(tx, bedB.id);

      await tx.execute(`set constraints ${CONSTRAINTS_DEFERRABLE} deferred`);
      for (const old of [locA, locB]) {
        await this.repo.closeLocation(
          tx,
          old.id,
          {
            statusConceptId: CLIN.LOCATION_COMPLETED,
            periodEnd: at,
            endReasonConceptId: CLIN.ADT_END_SWAP,
          },
          actor.id,
        );
      }
      const openA = await this.openSwapLocation(tx, {
        tenantId,
        encounter: a,
        bed: bedB,
        previous: locA,
        at,
        forced: forcedA,
        scope: scopeB,
        override: dto.override,
        actor,
      });
      const openB = await this.openSwapLocation(tx, {
        tenantId,
        encounter: b,
        bed: bedA,
        previous: locB,
        at,
        forced: forcedB,
        scope: scopeA,
        override: dto.override,
        actor,
      });
      // Se verifican acá, no al confirmar: un choque se informa con el motivo.
      await tx.execute(`set constraints ${CONSTRAINTS_DEFERRABLE} immediate`);

      for (const old of [locA, locB]) {
        await this.appendLocationHistory(tx, old.id, tenantId, actor, 'UPDATE');
      }

      await this.ops.recordOccupancyChange(tx, bedA.id, {
        from: 'OCC_OCCUPIED',
        to: 'OCC_OCCUPIED',
        sourceRefId: openB.location.id,
        actor,
        requestId,
      });
      await this.ops.recordOccupancyChange(tx, bedB.id, {
        from: 'OCC_OCCUPIED',
        to: 'OCC_OCCUPIED',
        sourceRefId: openA.location.id,
        actor,
        requestId,
      });
      const cleaning: string[] = [];
      if (settings.swapRequiresCleaning) {
        for (const [bed, old, enc, state] of [
          [bedA, locA, a, stateA],
          [bedB, locB, b, stateB],
        ] as const) {
          const { cleaningOrderId } = await this.ops.markDirtyFromSource(
            tx,
            bed.id,
            {
              trigger: 'TRANSFER',
              sourceRefId: old.id,
              terminal: this.needsTerminalCleaning(enc, state),
              actor,
              requestId,
            },
          );
          cleaning.push(cleaningOrderId);
        }
      }
      await this.repo.bumpEncounter(tx, a.id, actor.id);
      await this.repo.bumpEncounter(tx, b.id, actor.id);

      await this.events.publish(tx, {
        type: ADT_EVENTS.swapped,
        aggregateType: 'encounter',
        aggregateId: a.id,
        tenantId,
        actorUserId: actor.id,
        correlationId: requestId,
        payload: {
          encounterAId: a.id,
          encounterBId: b.id,
          closedLocationIds: [locA.id, locB.id],
          openedLocationIds: [openA.location.id, openB.location.id],
          careSpaceAId: bedA.id,
          careSpaceBId: bedB.id,
          occurredAt: at.toISOString(),
          cleaningOrderIds: cleaning,
          incidentIds: [openA.incidentId, openB.incidentId].filter(Boolean),
        },
      });
      for (const [incidentId, encId, spaceId, locId] of [
        [openA.incidentId, a.id, bedB.id, openA.location.id],
        [openB.incidentId, b.id, bedA.id, openB.location.id],
      ] as const) {
        if (incidentId) {
          await this.publishOverride(tx, tenantId, actor, requestId, {
            incidentId,
            encounterId: encId,
            careSpaceId: spaceId,
            encounterLocationId: locId,
          });
        }
      }
      return {
        locations: [
          {
            encounterId: a.id,
            closedLocationId: locA.id,
            openedLocationId: openA.location.id,
            careSpaceId: bedB.id,
          },
          {
            encounterId: b.id,
            closedLocationId: locB.id,
            openedLocationId: openB.location.id,
            careSpaceId: bedA.id,
          },
        ],
        incidentIds: [openA.incidentId, openB.incidentId].filter(
          (id): id is string => !!id,
        ),
      };
    });
  }

  /** Estado operativo de la cama por ejes, tal como lo leen las reglas y el contrato HTTP. */
  private async bedState(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<BedOpsView> {
    return toBedOpsView(await this.ops.getOperationalState(tx, careSpaceId));
  }

  private async evaluateSwapSide(
    tx: EntityManager,
    scope: AdtScope,
    encounter: AdtEncounterRow,
    target: AdtSpaceRow,
    at: Date,
    exclude: readonly string[],
  ) {
    this.compat.assertBed(target);
    return this.compat.evaluate(tx, {
      practiceId: scope.practiceId,
      encounter,
      space: target,
      at,
      excludeEncounterIds: exclude,
      occupancyWaived: true,
    });
  }

  private async openSwapLocation(
    tx: EntityManager,
    p: {
      tenantId: string;
      encounter: AdtEncounterRow;
      bed: AdtSpaceRow;
      previous: AdtLocationRow;
      at: Date;
      forced: CompatibilityViolation[];
      scope: AdtScope;
      override?: AdtOverrideDto;
      actor: AuthenticatedUser;
    },
  ): Promise<PlaceBedResult> {
    const incidentId = await this.openIncident(tx, {
      tenantId: p.tenantId,
      encounter: p.encounter,
      careSpaceId: p.bed.id,
      forced: p.forced,
      justification: p.override?.justification,
      actor: p.actor,
    });
    const unit = await this.repo.effectiveUnit(tx, p.bed.id, p.at);
    const location = await this.repo.insertLocation(tx, {
      encounterId: p.encounter.id,
      tenantId: p.tenantId,
      practiceSiteId: p.bed.practiceSiteId,
      clinicalUnitId: unit,
      careSpaceId: p.bed.id,
      statusConceptId: CLIN.LOCATION_ACTIVE,
      periodStart: p.at,
      movementTypeConceptId: CLIN.ADT_SWAP,
      previousLocationId: p.previous.id,
      bedCategoryConceptId: p.bed.bedCategoryConceptId,
      placementIncidentId: incidentId,
      actorUserId: p.actor.id,
    });
    if (incidentId) {
      await this.repo.linkIncident(tx, incidentId, location.id);
      await this.appendIncidentHistory(
        tx,
        incidentId,
        p.tenantId,
        p.actor,
        'INSERT',
      );
    }
    await this.appendLocationHistory(
      tx,
      location.id,
      p.tenantId,
      p.actor,
      'INSERT',
    );
    return { location, incidentId };
  }

  // =========================================================================
  // Egreso
  // =========================================================================

  /**
   * `POST /clinical/encounters/:id/discharge`: cierra la ubicación, cierra el
   * encuentro (con el cierre de siempre), deja la cama sucia y crea la orden de
   * limpieza —terminal con aislamiento o contaminación—.
   *
   * @param encounterId - Encuentro.
   * @param dto - Disposición, instante real y opciones.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien registra el egreso.
   * @param requestId - Id de correlación.
   */
  async discharge(
    encounterId: string,
    dto: DischargeDto,
    expectedVersion: number,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<DischargeResult> {
    const result = await this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const peek = await this.repo.findEncounter(tx, encounterId);
      if (!peek || peek.tenantId !== tenantId) throw this.notFound();
      // La autoridad sale de la cama activa (o de la sede si espera cama): jamás
      // de una reserva ni de una ubicación cancelada.
      await this.authorizeCurrent(
        tx,
        encounterId,
        actor,
        INFRA_F3_ACTIONS.DISCHARGE,
      );

      const encounter = await this.lockInpatient(tx, encounterId, tenantId);
      assertRowVersion(encounter.rowVersion, expectedVersion);
      await this.authorizeCurrent(
        tx,
        encounterId,
        actor,
        INFRA_F3_ACTIONS.DISCHARGE,
      );

      if (!dto.dischargeDispositionCode?.trim()) {
        throw new PreconditionFailedException(
          'El egreso exige la disposición',
          undefined,
          ClinicalErrorReason.DISCHARGE_DISPOSITION_REQUIRED,
        );
      }
      const disposition = this.code(
        DISCHARGE_DISPOSITIONS.byInput(dto.dischargeDispositionCode),
        'dischargeDispositionCode',
      );
      const bed = await this.repo.currentBed(tx, encounter.id, true);
      const at = this.occurredAt(
        dto.occurredAt,
        bed?.periodStart ?? encounter.startAt,
      );

      let cleaningOrderId: string | null = null;
      let careSpaceId: string | null = null;
      if (bed?.careSpaceId) {
        const locked = await this.repo.lockSpaces(tx, [bed.careSpaceId]);
        const space = locked.get(bed.careSpaceId)!;
        careSpaceId = space.id;
        const state = await this.bedState(tx, space.id);
        const terminal = this.needsTerminalCleaning(encounter, state);
        await this.repo.closeLocation(
          tx,
          bed.id,
          {
            statusConceptId: CLIN.LOCATION_COMPLETED,
            periodEnd: at,
            endReasonConceptId: CLIN.ADT_END_DISCHARGE,
          },
          actor.id,
        );
        await this.appendLocationHistory(tx, bed.id, tenantId, actor, 'UPDATE');
        ({ cleaningOrderId } = await this.ops.markDirtyFromSource(
          tx,
          space.id,
          {
            trigger: 'DISCHARGE',
            sourceRefId: bed.id,
            terminal,
            actor,
            requestId,
          },
        ));
        await this.ops.recordOccupancyChange(tx, space.id, {
          from: 'OCC_OCCUPIED',
          to: 'OCC_FREE',
          sourceRefId: bed.id,
          actor,
          requestId,
        });
      }
      for (const reservation of await this.repo.reservations(
        tx,
        encounter.id,
      )) {
        await this.cancelReservationRow(tx, reservation, at, actor, requestId);
      }

      // El cierre de siempre: estado, fin, participantes, sello.
      await this.encounters.completeForDischarge(
        tx,
        encounter.id,
        { endAt: at, dischargeDispositionConceptId: disposition.id },
        actor,
      );

      if (dto.closeEpisode && encounter.episodeId) {
        await tx.execute(
          `update clinical.care_episodes
              set status_concept_id = ?, end_at = ?, updated_at = ?, updated_by_user_id = ?,
                  row_version = row_version + 1
            where id = ? and tenant_id = ? and status_concept_id = ?
              and not exists (select 1 from clinical.encounters e
                               where e.episode_id = care_episodes.id and e.id <> ?
                                 and e.status_concept_id = ?)`,
          [
            CLIN.EPISODE_FINISHED,
            at,
            new Date(),
            actor.id,
            encounter.episodeId,
            tenantId,
            CLIN.EPISODE_ACTIVE,
            encounter.id,
            CLIN.ENCOUNTER_IN_PROGRESS,
          ],
        );
      }

      await this.events.publish(tx, {
        type: ADT_EVENTS.discharged,
        aggregateType: 'encounter',
        aggregateId: encounter.id,
        tenantId,
        actorUserId: actor.id,
        correlationId: requestId,
        payload: {
          encounterId: encounter.id,
          encounterLocationId: bed?.id ?? null,
          careSpaceId,
          dischargeDispositionCode: disposition.code,
          occurredAt: at.toISOString(),
          cleaningOrderId,
          episodeClosed: !!dto.closeEpisode,
        },
      });
      return { encounterId: encounter.id, cleaningOrderId };
    });
    return result;
  }

  // =========================================================================
  // Cancelaciones
  // =========================================================================

  /**
   * `POST /clinical/encounter-locations/:id/cancel`: cancela una **reserva** (A11
   * parcial) o un **traslado** (A12: reabre la ubicación previa si su cama sigue
   * libre) dentro de la ventana `infra.adt_cancel_window_minutes`.
   *
   * @param locationId - Ubicación de encuentro.
   * @param dto - Motivo.
   * @param actor - Quien cancela.
   * @param requestId - Id de correlación.
   */
  async cancelLocation(
    locationId: string,
    dto: CancelLocationDto,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<{
    encounterLocationId: string;
    kind: 'RESERVATION' | 'TRANSFER';
  }> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const peek = await this.repo.findLocation(tx, locationId);
      if (!peek || peek.tenantId !== tenantId || !peek.careSpaceId)
        throw this.notFound();
      const scope = await this.access.forSpace(tx, peek.careSpaceId, actor);
      this.access.assertCan(scope, INFRA_F3_ACTIONS.CANCEL);

      const encounter = await this.lockInpatient(
        tx,
        peek.encounterId,
        tenantId,
      );
      const location = await this.repo.findLocation(tx, locationId, true);
      if (!location) throw this.notFound();
      const now = new Date();

      if (
        location.isBedAssignment &&
        location.statusConceptId === CLIN.LOCATION_RESERVED
      ) {
        await this.repo.lockSpaces(tx, [location.careSpaceId!]);
        await this.cancelReservationRow(tx, location, now, actor, requestId);
        await this.repo.bumpEncounter(tx, encounter.id, actor.id);
        await this.events.publish(tx, {
          type: ADT_EVENTS.reservationCancelled,
          aggregateType: 'encounter',
          aggregateId: encounter.id,
          tenantId,
          actorUserId: actor.id,
          correlationId: requestId,
          payload: {
            encounterId: encounter.id,
            encounterLocationId: location.id,
            careSpaceId: location.careSpaceId,
            reason: dto.reasonText,
          },
        });
        return { encounterLocationId: location.id, kind: 'RESERVATION' };
      }

      if (
        location.isBedAssignment &&
        location.statusConceptId === CLIN.LOCATION_ACTIVE &&
        location.movementTypeConceptId === CLIN.ADT_TRANSFER &&
        location.previousLocationId
      ) {
        const settings = await this.settings.forPractice(tx, scope.practiceId);
        const ageMinutes =
          (now.getTime() - location.periodStart!.getTime()) / 60_000;
        if (ageMinutes > settings.cancelWindowMinutes) {
          throw new ConflictException(
            'Pasó la ventana para cancelar el traslado',
            { windowMinutes: settings.cancelWindowMinutes },
            ClinicalErrorReason.ADT_CANCEL_WINDOW_EXPIRED,
          );
        }
        const previous = await this.repo.findLocation(
          tx,
          location.previousLocationId,
          true,
        );
        if (!previous?.careSpaceId) throw this.notFound();
        // Reabrir el origen toca esa cama: se exige alcance también sobre ella.
        this.access.assertCan(
          await this.access.forSpace(tx, previous.careSpaceId, actor),
          INFRA_F3_ACTIONS.CANCEL,
        );
        await this.repo.lockSpaces(tx, [
          previous.careSpaceId,
          location.careSpaceId!,
        ]);
        const state = await this.bedState(tx, previous.careSpaceId);
        const taken = await this.repo.otherClaimOnBed(
          tx,
          previous.careSpaceId,
          previous.periodEnd ?? now,
          [previous.id, location.id],
        );
        const unavailable = (why: string): ConflictException =>
          new ConflictException(
            'La cama de origen ya no está disponible para reabrir el traslado',
            { careSpaceId: previous.careSpaceId, why },
            ClinicalErrorReason.PREVIOUS_BED_NO_LONGER_AVAILABLE,
          );
        if (taken || state.occupancy.code !== 'OCC_FREE')
          throw unavailable('OCCUPIED');
        const reverted = await this.ops.revertDirtyFromSource(
          tx,
          previous.careSpaceId,
          {
            sourceRefId: previous.id,
            actor,
            requestId,
          },
        );
        if (!reverted.reverted) throw unavailable('CLEANING_STARTED');

        await this.repo.closeLocation(
          tx,
          location.id,
          {
            statusConceptId: CLIN.LOCATION_CANCELLED,
            periodEnd: now,
            endReasonConceptId: CLIN.ADT_END_TRANSFER_CANCELLED,
          },
          actor.id,
        );
        await this.repo.reopenLocation(tx, previous.id, actor.id);
        await this.appendLocationHistory(
          tx,
          location.id,
          tenantId,
          actor,
          'UPDATE',
        );
        await this.appendLocationHistory(
          tx,
          previous.id,
          tenantId,
          actor,
          'UPDATE',
        );
        await this.ops.recordOccupancyChange(tx, location.careSpaceId!, {
          from: 'OCC_OCCUPIED',
          to: 'OCC_FREE',
          sourceRefId: location.id,
          actor,
          requestId,
        });
        await this.ops.recordOccupancyChange(tx, previous.careSpaceId, {
          from: 'OCC_FREE',
          to: 'OCC_OCCUPIED',
          sourceRefId: previous.id,
          actor,
          requestId,
        });
        await this.repo.bumpEncounter(tx, encounter.id, actor.id);
        await this.events.publish(tx, {
          type: ADT_EVENTS.transferCancelled,
          aggregateType: 'encounter',
          aggregateId: encounter.id,
          tenantId,
          actorUserId: actor.id,
          correlationId: requestId,
          payload: {
            encounterId: encounter.id,
            cancelledLocationId: location.id,
            reopenedLocationId: previous.id,
            fromCareSpaceId: previous.careSpaceId,
            toCareSpaceId: location.careSpaceId,
            reason: dto.reasonText,
          },
        });
        return { encounterLocationId: location.id, kind: 'TRANSFER' };
      }

      throw new ConflictException(
        'La ubicación no es una reserva ni un traslado cancelable',
        { statusConceptId: location.statusConceptId },
        ClinicalErrorReason.LOCATION_NOT_CANCELLABLE,
      );
    });
  }

  // =========================================================================
  // Incidentes de colocación
  // =========================================================================

  /**
   * `PATCH /clinical/placement-incidents/:id`: revisa o cierra un incidente.
   * Sólo supervisión de enfermería o control de infecciones.
   *
   * @param incidentId - Incidente.
   * @param dto - Estado nuevo y nota.
   * @param actor - Quien revisa.
   * @param requestId - Id de correlación.
   */
  async reviewIncident(
    incidentId: string,
    dto: ReviewIncidentDto,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<{ id: string; status: string }> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const rows = await tx.execute<
        {
          id: string;
          tenant_id: string;
          care_space_id: string;
          status_concept_id: string;
          encounter_id: string;
        }[]
      >(
        `select id, tenant_id, care_space_id, status_concept_id, encounter_id
           from clinical.placement_incidents where id = ? for update`,
        [incidentId],
      );
      const incident = rows[0];
      if (!incident || incident.tenant_id !== tenantId) throw this.notFound();
      const scope = await this.access.forSpace(
        tx,
        incident.care_space_id,
        actor,
      );
      this.access.assertCan(scope, INFRA_F3_ACTIONS.INCIDENT_REVIEW);

      const target =
        dto.status === 'REVIEWED'
          ? INCIDENT_STATUS.REVIEWED
          : INCIDENT_STATUS.CLOSED;
      const allowed =
        dto.status === 'REVIEWED'
          ? incident.status_concept_id === INCIDENT_STATUS.OPEN
          : incident.status_concept_id !== INCIDENT_STATUS.CLOSED;
      if (!allowed) {
        throw new ConflictException(
          'El incidente no admite esa revisión en su estado actual',
          { to: dto.status },
          ClinicalErrorReason.PLACEMENT_INCIDENT_INVALID_TRANSITION,
        );
      }
      const now = new Date();
      await tx.execute(
        `update clinical.placement_incidents
            set status_concept_id = ?, reviewed_by_user_id = ?, reviewed_at = ?, review_note = ?,
                updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
          where id = ?`,
        [target, actor.id, now, dto.reviewNote, now, actor.id, incidentId],
      );
      await this.appendIncidentHistory(
        tx,
        incidentId,
        tenantId,
        actor,
        'UPDATE',
      );
      await this.events.publish(tx, {
        type: ADT_EVENTS.incidentReviewed,
        aggregateType: 'placement_incident',
        aggregateId: incidentId,
        tenantId,
        actorUserId: actor.id,
        correlationId: requestId,
        payload: {
          incidentId,
          encounterId: incident.encounter_id,
          careSpaceId: incident.care_space_id,
          status: dto.status,
        },
      });
      return { id: incidentId, status: dto.status };
    });
  }

  // =========================================================================
  // Piezas compartidas
  // =========================================================================

  /**
   * Evalúa la cama, resuelve el forzado y escribe incidente + ubicación.
   * La cama y el encuentro ya vienen bloqueados.
   */
  private async placeBed(
    tx: EntityManager,
    p: PlaceBedInput,
  ): Promise<PlaceBedResult> {
    this.compat.assertBed(p.space);
    if (p.space.practiceSiteId !== p.scope.siteId) throw this.notFound();
    const evaluation = await this.compat.evaluate(tx, {
      practiceId: p.scope.practiceId,
      encounter: p.encounter,
      space: p.space,
      at: p.at,
      excludeEncounterIds: p.excludeEncounterIds,
      occupancyWaived: p.occupancyWaived,
    });
    const forced = this.compat.resolveOverride(
      evaluation.violations,
      p.override,
      p.scope,
    );
    const incidentId = await this.openIncident(tx, {
      tenantId: p.tenantId,
      encounter: p.encounter,
      careSpaceId: p.space.id,
      forced,
      justification: p.override?.justification,
      actor: p.actor,
    });
    const unit = await this.repo.effectiveUnit(tx, p.space.id, p.at);
    const location = await this.repo.insertLocation(tx, {
      encounterId: p.encounter.id,
      tenantId: p.tenantId,
      practiceSiteId: p.space.practiceSiteId,
      clinicalUnitId: unit,
      careSpaceId: p.space.id,
      statusConceptId:
        p.mode === 'ASSIGN' ? CLIN.LOCATION_ACTIVE : CLIN.LOCATION_RESERVED,
      periodStart: p.at,
      movementTypeConceptId: p.movementConceptId,
      previousLocationId: p.previousLocationId,
      bedCategoryConceptId: p.space.bedCategoryConceptId,
      placementIncidentId: incidentId,
      actorUserId: p.actor.id,
    });
    if (incidentId) {
      await this.repo.linkIncident(tx, incidentId, location.id);
      await this.appendIncidentHistory(
        tx,
        incidentId,
        p.tenantId,
        p.actor,
        'INSERT',
      );
    }
    await this.appendLocationHistory(
      tx,
      location.id,
      p.tenantId,
      p.actor,
      'INSERT',
    );
    return { location, incidentId };
  }

  /** Abre el incidente de una colocación forzada; `null` si no hubo nada que forzar. */
  private async openIncident(
    tx: EntityManager,
    p: {
      tenantId: string;
      encounter: AdtEncounterRow;
      careSpaceId: string;
      forced: readonly CompatibilityViolation[];
      justification?: string;
      actor: AuthenticatedUser;
    },
  ): Promise<string | null> {
    if (p.forced.length === 0 || !p.justification) return null;
    const id = randomUUID();
    const now = new Date();
    await tx.execute(
      `insert into clinical.placement_incidents
         (id, tenant_id, encounter_id, encounter_location_id, care_space_id, patient_profile_id,
          violations_json, justification_text, authorized_by_user_id, status_concept_id,
          created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       values (?, ?, ?, null, ?, ?, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        p.tenantId,
        p.encounter.id,
        p.careSpaceId,
        p.encounter.patientProfileId,
        JSON.stringify(
          p.forced.map((v) => ({ rule: v.rule, detail: v.detail })),
        ),
        p.justification.trim(),
        p.actor.id,
        INCIDENT_STATUS.OPEN,
        now,
        now,
        p.actor.id,
        p.actor.id,
      ],
    );
    return id;
  }

  /** Cierra una reserva propia que se convierte en ocupación. */
  private async convertReservation(
    tx: EntityManager,
    reservation: AdtLocationRow,
    at: Date,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.repo.closeLocation(
      tx,
      reservation.id,
      {
        statusConceptId: CLIN.LOCATION_CANCELLED,
        periodEnd: at,
        endReasonConceptId: CLIN.ADT_END_RESERVATION_CONVERTED,
      },
      actor.id,
    );
    await this.appendLocationHistory(
      tx,
      reservation.id,
      reservation.tenantId,
      actor,
      'UPDATE',
    );
  }

  /** Cancela una reserva y avisa al puerto que la cama vuelve a estar libre. */
  private async cancelReservationRow(
    tx: EntityManager,
    reservation: AdtLocationRow,
    at: Date,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<void> {
    await this.repo.closeLocation(
      tx,
      reservation.id,
      {
        statusConceptId: CLIN.LOCATION_CANCELLED,
        periodEnd: at,
        endReasonConceptId: CLIN.ADT_END_RESERVATION_CANCELLED,
      },
      actor.id,
    );
    await this.appendLocationHistory(
      tx,
      reservation.id,
      reservation.tenantId,
      actor,
      'UPDATE',
    );
    if (reservation.careSpaceId) {
      await this.ops.recordOccupancyChange(tx, reservation.careSpaceId, {
        from: 'OCC_RESERVED',
        to: 'OCC_FREE',
        sourceRefId: reservation.id,
        actor,
        requestId,
      });
    }
  }

  private async publishOverride(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    requestId: string | undefined,
    payload: {
      incidentId: string;
      encounterId: string;
      careSpaceId: string;
      encounterLocationId: string;
    },
  ): Promise<void> {
    await this.events.publish(tx, {
      type: ADT_EVENTS.placementOverride,
      aggregateType: 'placement_incident',
      aggregateId: payload.incidentId,
      tenantId,
      actorUserId: actor.id,
      correlationId: requestId,
      payload,
    });
  }

  /** Sella en `audit.encounter_locations_history` el estado actual de la ubicación. */
  private async appendLocationHistory(
    tx: EntityManager,
    locationId: string,
    tenantId: string,
    actor: AuthenticatedUser,
    operation: 'INSERT' | 'UPDATE',
  ): Promise<void> {
    await this.historyRepo.append(tx, 'encounter_locations', locationId, {
      operationConceptId:
        operation === 'INSERT' ? AUD.OPERATION_INSERT : AUD.OPERATION_UPDATE,
      dataSnapshot: await this.repo.snapshotLocation(tx, locationId),
      changedByUserId: actor.id,
      tenantId,
      firstRevision: operation === 'INSERT',
    });
    await tx.flush();
  }

  /** Sella en `audit.placement_incidents_history` el estado actual del incidente. */
  private async appendIncidentHistory(
    tx: EntityManager,
    incidentId: string,
    tenantId: string,
    actor: AuthenticatedUser,
    operation: 'INSERT' | 'UPDATE',
  ): Promise<void> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      'select * from clinical.placement_incidents where id = ?',
      [incidentId],
    );
    await this.historyRepo.append(tx, 'placement_incidents', incidentId, {
      operationConceptId:
        operation === 'INSERT' ? AUD.OPERATION_INSERT : AUD.OPERATION_UPDATE,
      dataSnapshot: rows[0] ?? {},
      changedByUserId: actor.id,
      tenantId,
      firstRevision: operation === 'INSERT',
    });
    await tx.flush();
  }

  /**
   * Alcance del actor sobre la ubicación **autoritativa** del encuentro (cama
   * activa o, si espera cama, su sede) y exigencia de la acción ahí. Un encuentro
   * sin ubicación autoritativa responde 404 uniforme.
   *
   * @param tx - Transacción.
   * @param encounterId - Encuentro.
   * @param actor - Quien opera.
   * @param action - Acción que exige.
   */
  private async authorizeCurrent(
    tx: EntityManager,
    encounterId: string,
    actor: AuthenticatedUser,
    action: InfraF3Action,
  ) {
    // `historical`: un encuentro ya egresado conserva la autoridad de su última
    // ocupación, para que el rechazo sea el de estado (409) y no un 404 engañoso.
    const current = await this.access.forEncounter(tx, encounterId, actor, {
      historical: true,
    });
    this.access.assertCan(current.scope, action);
    return current;
  }

  /** Bloquea el encuentro y exige que sea una internación en curso. */
  private async lockInpatient(
    tx: EntityManager,
    encounterId: string,
    tenantId: string,
  ): Promise<AdtEncounterRow> {
    const encounter = await this.repo.lockEncounter(tx, encounterId);
    if (!encounter || encounter.tenantId !== tenantId) throw this.notFound();
    this.assertInpatientInProgress(encounter);
    return encounter;
  }

  private assertInpatientInProgress(encounter: AdtEncounterRow): void {
    if (encounter.classConceptId !== CLIN.ENCOUNTER_CLASS_INPATIENT) {
      throw new PreconditionFailedException(
        'El encuentro no es una internación',
        undefined,
        ClinicalErrorReason.ENCOUNTER_NOT_INPATIENT,
      );
    }
    if (encounter.statusConceptId !== CLIN.ENCOUNTER_IN_PROGRESS) {
      throw new ConflictException(
        'El encuentro no está en curso',
        { status: encounter.statusConceptId },
        ClinicalErrorReason.ENCOUNTER_NOT_IN_PROGRESS,
      );
    }
  }

  /** Limpieza terminal: aislamiento del encuentro o de la cama, o cama contaminada. */
  private needsTerminalCleaning(
    encounter: AdtEncounterRow,
    bed: BedOpsView,
  ): boolean {
    const hasPrecaution =
      !!encounter.isolationPrecautionConceptId &&
      encounter.isolationPrecautionConceptId !== ISO_NONE_ID;
    return (
      hasPrecaution ||
      bed.isolation.code !== 'ISO_NONE' ||
      bed.hygiene.code === 'HYG_CONTAMINATED' ||
      bed.hygiene.terminalRequired
    );
  }

  /** Instante del movimiento: por omisión ahora; ni futuro ni anterior al inicio vigente. */
  private occurredAt(raw: string | undefined, notBefore: Date | null): Date {
    const now = new Date();
    const at = raw ? new Date(raw) : now;
    if (at.getTime() > now.getTime()) {
      throw new PreconditionFailedException(
        'La fecha del movimiento está en el futuro',
        undefined,
        ClinicalErrorReason.OCCURRED_AT_IN_FUTURE,
      );
    }
    if (notBefore && at.getTime() < notBefore.getTime()) {
      throw new PreconditionFailedException(
        'La fecha del movimiento es anterior al inicio de la ubicación vigente',
        { notBefore: notBefore.toISOString() },
        ClinicalErrorReason.OCCURRED_AT_BEFORE_CURRENT_START,
      );
    }
    return at;
  }

  private code<T>(entry: T | undefined, field: string): T {
    if (!entry) {
      throw new PreconditionFailedException(
        `Código inválido en ${field}`,
        { field },
        ClinicalErrorReason.ADT_CODE_INVALID,
      );
    }
    return entry;
  }

  private async assertPractitioner(
    tx: EntityManager,
    practitionerProfileId: string,
  ): Promise<void> {
    const rows = await tx.execute<{ id: string }[]>(
      'select profile_id as id from profiles.health_practitioner_profiles where profile_id = ?',
      [practitionerProfileId],
    );
    if (rows.length === 0) throw this.notFound();
  }

  /** Episodio de la internación: el pedido, el activo del paciente o uno nuevo. */
  private async resolveEpisode(
    tx: EntityManager,
    dto: CreateAdmissionDto,
    tenantId: string,
    admittedAt: Date,
    actor: AuthenticatedUser,
  ): Promise<string | null> {
    if (dto.episodeId) {
      const episode = await this.episodesRepo.findById(tx, dto.episodeId);
      if (
        !episode ||
        episode.tenantId !== tenantId ||
        episode.patientProfileId !== dto.patientProfileId
      ) {
        throw new ResourceNotFoundException(
          'Episodio de cuidado no encontrado',
          undefined,
          ClinicalErrorReason.CARE_EPISODE_NOT_FOUND,
        );
      }
      return episode.id;
    }
    if (dto.openEpisode === false) return null;
    // Un paciente tiene a lo sumo un episodio activo (regla de UC-08-01): se
    // reutiliza el vigente.
    const active = await this.episodesRepo.findActiveByPatient(
      tx,
      tenantId,
      dto.patientProfileId,
    );
    if (active) return active.id;
    const episode = this.episodesRepo.create(tx, {
      patientProfileId: dto.patientProfileId,
      tenantId,
      responsiblePractitionerId: dto.attendingPractitionerId,
      typeConceptId: CLIN.EPISODE_TYPE_HOSPITALIZATION,
      statusConceptId: CLIN.EPISODE_ACTIVE,
      startAt: admittedAt,
      actorUserId: actor.id,
    });
    await tx.flush();
    return episode.id;
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Recurso no encontrado',
      undefined,
      ClinicalErrorReason.ADT_RESOURCE_OUT_OF_SCOPE,
    );
  }
}
