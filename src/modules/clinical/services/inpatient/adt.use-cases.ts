import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException, touch } from '../../../../common';
import { InfrastructureAccessService } from '../../../practice/services/infrastructure-access.service';
import { AuthzClinicalScopeService } from '../../../authz/services/authz-clinical-scope.service';
import { CLIN } from '../../clinical.concepts';
import { PRAC } from '../../../practice/practice.concepts';
import {
  CareEpisodes,
  EncounterLocations,
  EncounterParticipants,
  Encounters,
  PlacementIncidents,
} from '../../entities';
import { InpatientRepository } from '../../repositories/inpatient.repository';
import { EncounterSealService } from '../encounter-seal.service';
import type {
  AdtResultDto,
  BedAssignmentDto,
  BedSwapDto,
  CreateAdmissionDto,
  DischargeDto,
  ReviewIncidentDto,
  TransferDto,
} from '../../dto/inpatient.dto';
import type { Violation } from '../../domain/inpatient/bed-compatibility';
import {
  IfMatchFailedException,
  PracticeErrorReason,
} from '../../../practice/practice.error-reasons';
import { adtError } from './adt-errors';
import { ADT_EVENTS, AdtSupport, type AdtRequest } from './adt-support';

/** Id de concepto de clinical por código del contrato. */
const clin = (code: string | undefined): string | undefined =>
  code ? (CLIN as Record<string, string>)[code] : undefined;

/**
 * `POST /clinical/admissions` (§F3.3, A01): episodio (existente o nuevo),
 * encuentro `ENC_IMP` y, si se pide cama, ocupación o reserva. Sin cama queda
 * «pendiente de cama».
 */
@Injectable()
export class AdmitPatientUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly support: AdtSupport,
    private readonly repo: InpatientRepository,
    private readonly scope: AuthzClinicalScopeService,
  ) {}

  /**
   * @param dto - Ingreso.
   * @param req - Actor, tenant, requestId.
   */
  execute(dto: CreateAdmissionDto, req: AdtRequest): Promise<AdtResultDto> {
    return this.em.transactional(async (tx) => {
      const { target, roles } = await this.access.assertCan(
        req.actor as never,
        'f3.adt.place',
        { siteId: dto.practiceSiteId },
        tx,
        req.tenantId,
      );
      if (
        !(await this.scope.isPatientInTenant(
          tx,
          dto.patientProfileId,
          req.tenantId,
        ))
      ) {
        throw new ResourceNotFoundException('Paciente no encontrado', {
          patientProfileId: dto.patientProfileId,
        });
      }
      if (
        await this.repo.inpatientInProgress(
          tx,
          dto.patientProfileId,
          req.tenantId,
        )
      ) {
        throw adtError('PATIENT_ALREADY_ADMITTED');
      }
      if (dto.bed)
        await this.support.port.lockSpaces(tx, [dto.bed.careSpaceId]);
      const now = new Date();
      let episodeId = dto.episodeId;
      if (episodeId) {
        const ep = await tx.findOne(CareEpisodes, { id: episodeId });
        if (
          !ep ||
          ep.tenantId !== req.tenantId ||
          ep.patientProfileId !== dto.patientProfileId
        ) {
          throw new ResourceNotFoundException(
            'Episodio de cuidado no encontrado',
            { episodeId },
          );
        }
      } else if (dto.openEpisode !== false) {
        const ep = tx.create(
          CareEpisodes,
          {
            patientProfileId: dto.patientProfileId,
            tenantId: req.tenantId,
            responsiblePractitionerId: dto.attendingPractitionerId,
            typeConceptId: CLIN.EPISODE_TYPE_HOSPITALIZATION,
            statusConceptId: CLIN.EPISODE_ACTIVE,
            startAt: now,
            createdAt: now,
            updatedAt: now,
            createdByUserId: req.actor.id,
            updatedByUserId: req.actor.id,
          },
          { partial: true },
        );
        await this.support.flush(tx);
        episodeId = ep.id;
      }
      const encounter = tx.create(
        Encounters,
        {
          patientProfileId: dto.patientProfileId,
          tenantId: req.tenantId,
          episodeId,
          branchId: target.site.branchId,
          primaryPractitionerId: dto.attendingPractitionerId,
          classConceptId: CLIN.ENCOUNTER_CLASS_INPATIENT,
          statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
          reasonText: dto.reasonText,
          startAt: now,
          levelOfCareConceptId: clin(dto.levelOfCareCode),
          admissionSourceConceptId: clin(dto.admissionSourceCode),
          isolationPrecautionConceptId: dto.isolationPrecautionCode
            ? PRAC[dto.isolationPrecautionCode as keyof typeof PRAC]
            : PRAC.ISO_NONE,
          isolationOrganismText: dto.isolationOrganismText,
          expectedDischargeAt: dto.expectedDischargeAt,
          createdAt: now,
          updatedAt: now,
          createdByUserId: req.actor.id,
          updatedByUserId: req.actor.id,
        },
        { partial: true },
      );
      await this.support.flush(tx);
      const result: AdtResultDto = { episodeId, encounterId: encounter.id };
      if (dto.bed) {
        const placed = await this.support.place(tx, {
          encounter,
          careSpaceId: dto.bed.careSpaceId,
          siteId: dto.practiceSiteId,
          mode: dto.bed.mode,
          movement: 'ADT_ADMIT',
          override: dto.override,
          roles,
          canOverride: this.access.can('f3.adt.override', roles),
          at: now,
          req,
        });
        result.encounterLocationId = placed.location.id;
        result.cell = { ...placed.state };
        result.incidentId = placed.incidentId ?? undefined;
      }
      await this.support.publish(
        tx,
        ADT_EVENTS.admitted,
        encounter,
        encounter.id,
        {
          hl7: 'A01',
          siteId: dto.practiceSiteId,
          encounterLocationId: result.encounterLocationId ?? null,
          careSpaceId: dto.bed?.careSpaceId ?? null,
          mode: dto.bed?.mode ?? null,
        },
        req,
      );
      return result;
    });
  }
}

/**
 * `POST /clinical/encounters/:id/bed-assignment` (A01/A02): da cama a un
 * encuentro sin cama, o convierte su reserva en ocupación.
 */
@Injectable()
export class AssignBedUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly support: AdtSupport,
  ) {}

  /**
   * @param encounterId - Encuentro.
   * @param dto - Cama, modo, override.
   * @param ifMatch - `If-Match` (row_version del encuentro), opcional.
   * @param req - Actor, tenant, requestId.
   */
  execute(
    encounterId: string,
    dto: BedAssignmentDto,
    ifMatch: string | undefined,
    req: AdtRequest,
  ): Promise<AdtResultDto> {
    return this.em.transactional(async (tx) => {
      const encounter = await this.support.encounter(
        tx,
        encounterId,
        req.tenantId,
      );
      const { roles } = await this.access.assertCan(
        req.actor as never,
        'f3.adt.place',
        { careSpaceId: dto.careSpaceId },
        tx,
        req.tenantId,
      );
      checkIfMatch(ifMatch, encounter.rowVersion);
      if (encounter.statusConceptId !== CLIN.ENCOUNTER_IN_PROGRESS)
        throw adtError('ENCOUNTER_NOT_IN_PROGRESS');
      await this.support.port.lockSpaces(tx, [dto.careSpaceId]);
      if (await this.support.activeBed(tx, encounterId))
        throw adtError('ENCOUNTER_ALREADY_HAS_BED');
      const now = new Date();
      const reservation = await tx.findOne(EncounterLocations, {
        encounterId,
        careSpaceId: dto.careSpaceId,
        isBedAssignment: true,
        locationStatusConceptId: CLIN.LOCATION_RESERVED,
        periodEnd: null,
      });
      if (reservation && dto.mode === 'ASSIGN') {
        // La propia reserva se cierra y se abre la ocupación desde ahora.
        await this.support.close(
          tx,
          reservation,
          'ADT_END_RESERVATION_CONVERTED',
          now,
          req.actor.id,
          'LOCATION_CANCELLED',
        );
        await this.support.port.recordOccupancyChange(tx, dto.careSpaceId, {
          from: 'OCC_RESERVED',
          to: 'OCC_FREE',
          sourceRefId: reservation.id,
          actor: req.actor,
          requestId: req.requestId,
        });
      }
      const placed = await this.support.place(tx, {
        encounter,
        careSpaceId: dto.careSpaceId,
        mode: dto.mode,
        movement: 'ADT_ADMIT',
        override: dto.override,
        roles,
        canOverride: this.access.can('f3.adt.override', roles),
        at: now,
        req,
      });
      await this.support.publish(
        tx,
        dto.mode === 'RESERVE'
          ? ADT_EVENTS.reservationCreated
          : ADT_EVENTS.bedAssigned,
        encounter,
        encounter.id,
        {
          hl7: dto.mode === 'RESERVE' ? null : 'A01',
          encounterLocationId: placed.location.id,
          careSpaceId: dto.careSpaceId,
        },
        req,
      );
      return {
        encounterId,
        encounterLocationId: placed.location.id,
        cell: { ...placed.state },
        incidentId: placed.incidentId ?? undefined,
      };
    });
  }
}

/**
 * `POST /clinical/encounters/:id/transfer` (A02), atómico: cierra el origen
 * (`TRANSFER_OUT`), abre el destino con `previous_encounter_location_id`, y el
 * origen queda sucio con orden `CLN_TRG_TRANSFER` (TERMINAL con aislamiento).
 */
@Injectable()
export class TransferPatientUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly support: AdtSupport,
  ) {}

  /**
   * @param encounterId - Encuentro.
   * @param dto - Destino y momento.
   * @param ifMatch - `If-Match` del encuentro, opcional.
   * @param req - Actor, tenant, requestId.
   */
  execute(
    encounterId: string,
    dto: TransferDto,
    ifMatch: string | undefined,
    req: AdtRequest,
  ): Promise<AdtResultDto> {
    return this.em.transactional(async (tx) => {
      const encounter = await this.support.encounter(
        tx,
        encounterId,
        req.tenantId,
      );
      const { roles } = await this.access.assertCan(
        req.actor as never,
        'f3.adt.place',
        { careSpaceId: dto.toCareSpaceId },
        tx,
        req.tenantId,
      );
      checkIfMatch(ifMatch, encounter.rowVersion);
      const from = await this.support.activeBed(tx, encounterId);
      if (!from) throw adtError('ENCOUNTER_HAS_NO_BED');
      await this.access.assertCan(
        req.actor as never,
        'f3.adt.place',
        { careSpaceId: from.careSpaceId as string },
        tx,
        req.tenantId,
      );
      if (from.careSpaceId === dto.toCareSpaceId)
        throw adtError('TRANSFER_TO_SAME_BED');
      const now = new Date();
      const at = dto.occurredAt ?? now;
      if (at.getTime() > now.getTime() + 60_000)
        throw adtError('OCCURRED_AT_IN_FUTURE');
      if (from.periodStart && at < from.periodStart)
        throw adtError('OCCURRED_AT_BEFORE_CURRENT_START');
      await this.support.port.lockSpaces(tx, [
        from.careSpaceId as string,
        dto.toCareSpaceId,
      ]);
      const fromState = await this.support.port.getOperationalState(
        tx,
        from.careSpaceId as string,
      );
      await this.support.close(
        tx,
        from,
        'ADT_END_TRANSFER_OUT',
        at,
        req.actor.id,
      );
      const placed = await this.support.place(tx, {
        encounter,
        careSpaceId: dto.toCareSpaceId,
        mode: 'ASSIGN',
        movement: 'ADT_TRANSFER',
        override: dto.override,
        roles,
        canOverride: this.access.can('f3.adt.override', roles),
        at,
        previousLocationId: from.id,
        req,
      });
      await this.support.port.recordOccupancyChange(
        tx,
        from.careSpaceId as string,
        {
          from: 'OCC_OCCUPIED',
          to: 'OCC_FREE',
          sourceRefId: from.id,
          actor: req.actor,
          requestId: req.requestId,
        },
      );
      const terminal =
        (encounter.isolationPrecautionConceptId ?? PRAC.ISO_NONE) !==
          PRAC.ISO_NONE || fromState.isolation !== 'ISO_NONE';
      const { cleaningOrderId } = await this.support.port.markDirtyFromSource(
        tx,
        from.careSpaceId as string,
        {
          trigger: 'CLN_TRG_TRANSFER',
          sourceRefId: from.id,
          terminal,
          actor: req.actor,
          requestId: req.requestId,
        },
      );
      await this.support.publish(
        tx,
        ADT_EVENTS.transferred,
        encounter,
        encounter.id,
        {
          hl7: 'A02',
          fromLocationId: from.id,
          toLocationId: placed.location.id,
          pv1_3: dto.toCareSpaceId,
          pv1_6: from.careSpaceId,
          occurredAt: at.toISOString(),
          reasonCode: dto.reasonCode ?? null,
        },
        req,
      );
      return {
        encounterId,
        fromLocationId: from.id,
        toLocationId: placed.location.id,
        cleaningOrderId,
        incidentId: placed.incidentId ?? undefined,
      };
    });
  }
}

/**
 * `POST /clinical/bed-swaps` (A17): intercambio entre dos pacientes ocupados
 * con las dos restricciones de cama `DEFERRED` en la transacción;
 * compatibilidad cruzada; las camas no quedan sucias.
 */
@Injectable()
export class SwapBedsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly support: AdtSupport,
  ) {}

  /**
   * @param dto - Encuentros A y B.
   * @param req - Actor, tenant, requestId.
   */
  execute(dto: BedSwapDto, req: AdtRequest): Promise<AdtResultDto> {
    return this.em.transactional(async (tx) => {
      if (dto.encounterAId === dto.encounterBId)
        throw adtError('SWAP_SAME_ENCOUNTER');
      const a = await this.support.encounter(
        tx,
        dto.encounterAId,
        req.tenantId,
      );
      const b = await this.support.encounter(
        tx,
        dto.encounterBId,
        req.tenantId,
      );
      const la = await this.support.activeBed(tx, a.id);
      const lb = await this.support.activeBed(tx, b.id);
      if (!la || !lb) throw adtError('SWAP_REQUIRES_TWO_OCCUPIED_BEDS');
      const bedA = la.careSpaceId as string;
      const bedB = lb.careSpaceId as string;
      const { roles } = await this.access.assertCan(
        req.actor as never,
        'f3.adt.place',
        { careSpaceId: bedA },
        tx,
        req.tenantId,
      );
      await this.access.assertCan(
        req.actor as never,
        'f3.adt.place',
        { careSpaceId: bedB },
        tx,
        req.tenantId,
      );
      await this.support.port.lockSpaces(tx, [bedA, bedB]);
      await tx.execute(
        'SET CONSTRAINTS clinical.ex_encounter_locations_bed_occupancy, clinical.ex_encounter_locations_encounter_single_bed DEFERRED',
      );
      const at = dto.occurredAt ?? new Date();
      const canOverride = this.access.can('f3.adt.override', roles);
      // Compatibilidad cruzada antes de tocar nada (la cama del otro está ocupada por quien sale).
      for (const [enc, bed, other] of [
        [a, bedB, b],
        [b, bedA, a],
      ] as const) {
        const { violations } = await this.support.compatibility(tx, enc, bed, {
          ignoreOccupancy: true,
          leaving: [other.id],
        });
        assertSwappable(violations, dto, canOverride);
      }
      await this.support.close(tx, la, 'ADT_END_SWAP', at, req.actor.id);
      await this.support.close(tx, lb, 'ADT_END_SWAP', at, req.actor.id);
      const common = {
        mode: 'ASSIGN' as const,
        movement: 'ADT_SWAP' as const,
        override: dto.override,
        roles,
        canOverride,
        at,
        ignoreOccupancy: true,
        req,
      };
      const na = await this.support.place(tx, {
        ...common,
        encounter: a,
        careSpaceId: bedB,
        previousLocationId: la.id,
        leaving: [b.id],
      });
      const nb = await this.support.place(tx, {
        ...common,
        encounter: b,
        careSpaceId: bedA,
        previousLocationId: lb.id,
        leaving: [a.id],
      });
      await this.support.flush(tx);
      for (const enc of [a, b]) {
        await this.support.publish(
          tx,
          ADT_EVENTS.swapped,
          enc,
          enc.id,
          {
            hl7: 'A17',
            swapId: la.id,
            encounterAId: a.id,
            encounterBId: b.id,
            occurredAt: at.toISOString(),
            reasonText: dto.reasonText,
          },
          req,
        );
      }
      return {
        locations: [la, lb, na.location, nb.location].map(locationView),
      };
    });
  }
}

/**
 * `POST /clinical/encounters/:id/discharge` (A03): cierra la cama
 * (`ADT_END_DISCHARGE`), cierra el encuentro con su disposición y sella el
 * contenido; la cama queda sucia con orden `CLN_TRG_DISCHARGE` (TERMINAL con
 * aislamiento o contaminación).
 */
@Injectable()
export class DischargePatientUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly support: AdtSupport,
    private readonly seal: EncounterSealService,
  ) {}

  /**
   * @param encounterId - Encuentro.
   * @param dto - Disposición y momento.
   * @param ifMatch - `If-Match` del encuentro, opcional.
   * @param req - Actor, tenant, requestId.
   */
  execute(
    encounterId: string,
    dto: DischargeDto,
    ifMatch: string | undefined,
    req: AdtRequest,
  ): Promise<AdtResultDto> {
    return this.em.transactional(async (tx) => {
      const encounter = await this.support.encounter(
        tx,
        encounterId,
        req.tenantId,
      );
      const bed = await this.support.activeBed(tx, encounterId);
      if (bed) {
        await this.access.assertCan(
          req.actor as never,
          'f3.adt.place',
          { careSpaceId: bed.careSpaceId as string },
          tx,
          req.tenantId,
        );
      } else {
        await this.access.assertCan(
          req.actor as never,
          'f3.adt.read',
          { siteId: await siteOf(tx, encounterId) },
          tx,
          req.tenantId,
        );
        throw adtError('ENCOUNTER_HAS_NO_BED');
      }
      checkIfMatch(ifMatch, encounter.rowVersion);
      if (encounter.statusConceptId !== CLIN.ENCOUNTER_IN_PROGRESS)
        throw adtError('ENCOUNTER_NOT_IN_PROGRESS');
      if (!dto.dischargeDispositionCode)
        throw adtError('DISCHARGE_DISPOSITION_REQUIRED');
      const now = new Date();
      const at = dto.occurredAt ?? now;
      if (at.getTime() > now.getTime() + 60_000)
        throw adtError('OCCURRED_AT_IN_FUTURE');
      const bedId = bed.careSpaceId as string;
      await this.support.port.lockSpaces(tx, [bedId]);
      const state = await this.support.port.getOperationalState(tx, bedId);
      await this.support.close(tx, bed, 'ADT_END_DISCHARGE', at, req.actor.id);
      // Mismos pasos que EncountersService.close (participantes, ubicaciones,
      // sello), sin su chequeo de rol asistencial: el egreso lo firma
      // Enfermería/Admisión con la regla de §0.3.
      for (const p of await tx.find(EncounterParticipants, {
        encounterId,
        statusConceptId: CLIN.PARTICIPANT_ACTIVE,
      })) {
        p.periodEnd = at;
        p.statusConceptId = CLIN.PARTICIPANT_COMPLETED;
        touch(p, req.actor.id);
      }
      for (const l of await tx.find(EncounterLocations, {
        encounterId,
        locationStatusConceptId: CLIN.LOCATION_ACTIVE,
        periodEnd: null,
      })) {
        await this.support.close(tx, l, 'ADT_END_DISCHARGE', at, req.actor.id);
      }
      encounter.statusConceptId = CLIN.ENCOUNTER_FINISHED;
      encounter.endAt = at;
      encounter.dischargeDispositionConceptId = clin(
        dto.dischargeDispositionCode,
      );
      touch(encounter, req.actor.id);
      await this.support.flush(tx);
      encounter.contentHash = await this.seal.computeHash(tx, encounter);
      encounter.sealedAt = now;
      if (dto.closeEpisode !== false && encounter.episodeId) {
        const ep = await tx.findOne(CareEpisodes, { id: encounter.episodeId });
        if (ep && ep.statusConceptId === CLIN.EPISODE_ACTIVE) {
          ep.statusConceptId = CLIN.EPISODE_FINISHED;
          ep.endAt = at;
          touch(ep, req.actor.id);
        }
      }
      await this.support.flush(tx);
      await this.support.port.recordOccupancyChange(tx, bedId, {
        from: 'OCC_OCCUPIED',
        to: 'OCC_FREE',
        sourceRefId: bed.id,
        actor: req.actor,
        requestId: req.requestId,
      });
      const terminal =
        (encounter.isolationPrecautionConceptId ?? PRAC.ISO_NONE) !==
          PRAC.ISO_NONE ||
        state.isolation !== 'ISO_NONE' ||
        state.hygiene === 'HYG_CONTAMINATED';
      const { cleaningOrderId } = await this.support.port.markDirtyFromSource(
        tx,
        bedId,
        {
          trigger: 'CLN_TRG_DISCHARGE',
          sourceRefId: bed.id,
          terminal,
          actor: req.actor,
          requestId: req.requestId,
        },
      );
      await this.support.publish(
        tx,
        ADT_EVENTS.discharged,
        encounter,
        encounter.id,
        {
          hl7: 'A03',
          encounterLocationId: bed.id,
          careSpaceId: bedId,
          disposition: dto.dischargeDispositionCode,
          occurredAt: at.toISOString(),
        },
        req,
      );
      return { encounterId, cleaningOrderId };
    });
  }
}

/**
 * `POST /clinical/encounter-locations/:id/cancel`: anula una reserva (A11
 * parcial) o un traslado (A12, reabre la ubicación previa si su cama sigue
 * libre) dentro de `infra.adt_cancel_window_minutes`.
 */
@Injectable()
export class CancelLocationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly support: AdtSupport,
  ) {}

  /**
   * @param locationId - Ubicación.
   * @param reasonText - Motivo.
   * @param req - Actor, tenant, requestId.
   */
  execute(
    locationId: string,
    reasonText: string,
    req: AdtRequest,
  ): Promise<AdtResultDto> {
    return this.em.transactional(async (tx) => {
      const loc = await tx.findOne(EncounterLocations, { id: locationId });
      if (!loc || loc.tenantId !== req.tenantId || !loc.careSpaceId) {
        throw new ResourceNotFoundException('Ubicación no encontrada', {
          locationId,
        });
      }
      await this.access.assertCan(
        req.actor as never,
        'f3.adt.place',
        { careSpaceId: loc.careSpaceId },
        tx,
        req.tenantId,
      );
      const encounter = await this.support.encounter(
        tx,
        loc.encounterId,
        req.tenantId,
      );
      const state = await this.support.port.getOperationalState(
        tx,
        loc.careSpaceId,
      );
      const windowMin = 120;
      const now = new Date();
      if (
        loc.locationStatusConceptId === CLIN.LOCATION_RESERVED &&
        !loc.periodEnd
      ) {
        await this.support.port.lockSpaces(tx, [loc.careSpaceId]);
        await this.support.close(
          tx,
          loc,
          'ADT_END_RESERVATION_CANCELLED',
          now,
          req.actor.id,
          'LOCATION_CANCELLED',
        );
        await this.support.port.recordOccupancyChange(tx, loc.careSpaceId, {
          from: 'OCC_RESERVED',
          to: 'OCC_FREE',
          sourceRefId: loc.id,
          actor: req.actor,
          requestId: req.requestId,
        });
        await this.support.publish(
          tx,
          ADT_EVENTS.reservationCancelled,
          encounter,
          encounter.id,
          { encounterLocationId: loc.id, reasonText },
          req,
        );
        return { encounterId: encounter.id, encounterLocationId: loc.id };
      }
      const isTransfer =
        loc.locationStatusConceptId === CLIN.LOCATION_ACTIVE &&
        !loc.periodEnd &&
        loc.movementTypeConceptId === CLIN.ADT_TRANSFER &&
        !!loc.previousEncounterLocationId;
      if (!isTransfer) throw adtError('LOCATION_NOT_CANCELLABLE');
      if (
        loc.periodStart &&
        now.getTime() - loc.periodStart.getTime() > windowMin * 60_000
      ) {
        throw adtError('ADT_CANCEL_WINDOW_EXPIRED', {
          windowMinutes: windowMin,
        });
      }
      const prev = await tx.findOne(EncounterLocations, {
        id: loc.previousEncounterLocationId as string,
      });
      if (!prev?.careSpaceId) throw adtError('LOCATION_NOT_CANCELLABLE');
      await this.support.port.lockSpaces(tx, [
        loc.careSpaceId,
        prev.careSpaceId,
      ]);
      const prevState = await this.support.port.getOperationalState(
        tx,
        prev.careSpaceId,
      );
      if (
        prevState.occupancy !== 'OCC_FREE' ||
        prevState.availability !== 'SPACE_OP_AVAILABLE'
      ) {
        throw adtError('PREVIOUS_BED_NO_LONGER_AVAILABLE');
      }
      await this.support.close(
        tx,
        loc,
        'ADT_END_TRANSFER_CANCELLED',
        now,
        req.actor.id,
        'LOCATION_CANCELLED',
      );
      prev.periodEnd = undefined;
      prev.locationStatusConceptId = CLIN.LOCATION_ACTIVE;
      prev.endReasonConceptId = undefined;
      touch(prev, req.actor.id);
      await this.support.flush(tx);
      await this.support.port.recordOccupancyChange(tx, loc.careSpaceId, {
        from: state.occupancy as 'OCC_OCCUPIED',
        to: 'OCC_FREE',
        sourceRefId: loc.id,
        actor: req.actor,
        requestId: req.requestId,
      });
      await this.support.port.recordOccupancyChange(tx, prev.careSpaceId, {
        from: 'OCC_FREE',
        to: 'OCC_OCCUPIED',
        sourceRefId: prev.id,
        actor: req.actor,
        requestId: req.requestId,
      });
      await this.support.publish(
        tx,
        ADT_EVENTS.transferCancelled,
        encounter,
        encounter.id,
        {
          hl7: 'A12',
          cancelledLocationId: loc.id,
          reopenedLocationId: prev.id,
          reasonText,
        },
        req,
      );
      return {
        encounterId: encounter.id,
        fromLocationId: loc.id,
        toLocationId: prev.id,
      };
    });
  }
}

/** `PATCH /clinical/placement-incidents/:id`. */
@Injectable()
export class ReviewPlacementIncidentUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly support: AdtSupport,
  ) {}

  /**
   * @param incidentId - Incidente.
   * @param dto - Estado y nota.
   * @param req - Actor, tenant, requestId.
   */
  execute(
    incidentId: string,
    dto: ReviewIncidentDto,
    req: AdtRequest,
  ): Promise<{ id: string; status: string }> {
    return this.em.transactional(async (tx) => {
      const inc = await tx.findOne(PlacementIncidents, { id: incidentId });
      if (!inc || inc.tenantId !== req.tenantId)
        throw new ResourceNotFoundException('Incidente no encontrado', {
          incidentId,
        });
      await this.access.assertCan(
        req.actor as never,
        'f3.incident.review',
        { careSpaceId: inc.careSpaceId },
        tx,
        req.tenantId,
      );
      inc.statusConceptId =
        dto.status === 'CLOSED' ? CLIN.PLC_INC_CLOSED : CLIN.PLC_INC_REVIEWED;
      inc.reviewedByUserId = req.actor.id;
      inc.reviewedAt = new Date();
      inc.reviewNote = dto.reviewNote;
      touch(inc, req.actor.id);
      await this.support.flush(tx);
      await this.support.publish(
        tx,
        ADT_EVENTS.incidentReviewed,
        { tenantId: inc.tenantId, id: inc.encounterId },
        inc.id,
        {
          incidentId: inc.id,
          status: dto.status,
        },
        req,
      );
      return { id: inc.id, status: dto.status };
    });
  }
}

/** `If-Match` opcional con la `row_version` del encuentro (412 si no coincide). */
function checkIfMatch(header: string | undefined, rowVersion: number): void {
  if (!header?.trim()) return;
  const m = /^(?:W\/)?"?(\d+)"?$/.exec(header.trim());
  if (!m || Number(m[1]) !== rowVersion) {
    throw new IfMatchError(rowVersion, header);
  }
}

class IfMatchError extends IfMatchFailedException {
  constructor(actual: number, expected: string) {
    super(PracticeErrorReason.ROW_VERSION_MISMATCH, { expected, actual });
  }
}

/** Compatibilidad del intercambio (mismas reglas que una colocación). */
function assertSwappable(
  violations: Violation[],
  dto: BedSwapDto,
  canOverride: boolean,
): void {
  const blocking = violations.filter((v) => v.severity === 'BLOCKING');
  if (blocking.length > 0) throw adtError('BED_NOT_ASSIGNABLE', { violations });
  const soft = violations.filter((v) => v.severity === 'OVERRIDABLE');
  if (soft.length > 0 && (!dto.override || !canOverride)) {
    throw adtError('BED_COMPATIBILITY_OVERRIDE_REQUIRED', { violations });
  }
}

/** Vista de una ubicación (sin datos de paciente). */
export function locationView(l: EncounterLocations): Record<string, unknown> {
  return {
    id: l.id,
    encounterId: l.encounterId,
    careSpaceId: l.careSpaceId ?? null,
    status:
      Object.entries(CLIN).find(
        ([, id]) => id === l.locationStatusConceptId,
      )?.[0] ?? null,
    movement:
      Object.entries(CLIN).find(
        ([, id]) => id === l.movementTypeConceptId,
      )?.[0] ?? null,
    endReason:
      Object.entries(CLIN).find(([, id]) => id === l.endReasonConceptId)?.[0] ??
      null,
    periodStart: l.periodStart?.toISOString() ?? null,
    periodEnd: l.periodEnd?.toISOString() ?? null,
    previousEncounterLocationId: l.previousEncounterLocationId ?? null,
    placementIncidentId: l.placementIncidentId ?? null,
  };
}

/** Sede de la última ubicación del encuentro (para autorizar sin cama). */
async function siteOf(tx: EntityManager, encounterId: string): Promise<string> {
  const loc = await tx.findOne(
    EncounterLocations,
    { encounterId },
    { orderBy: { createdAt: 'desc' } },
  );
  if (!loc)
    throw new ResourceNotFoundException('Encuentro sin ubicación', {
      encounterId,
    });
  return loc.practiceSiteId;
}
