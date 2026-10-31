import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException, touch } from '../../../../common';
import { OutboxService } from '../../../messaging/services/outbox.service';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOperationalState,
  type CareSpaceOpsPort,
} from '../../../practice/services/care-space-ops.port';
import { translateInfraWriteError } from '../../../practice/services/ops/ops-errors';
import type { InfraRole } from '../../../practice/domain/ops/infra-scope';
import { PRAC } from '../../../practice/practice.concepts';
import { CLIN } from '../../clinical.concepts';
import {
  EncounterLocations,
  Encounters,
  PlacementIncidents,
} from '../../entities';
import {
  InpatientRepository,
  sexOf,
} from '../../repositories/inpatient.repository';
import {
  evaluateCompatibility,
  judgePlacement,
  type Violation,
} from '../../domain/inpatient/bed-compatibility';
import type { PlacementOverrideDto } from '../../dto/inpatient.dto';
import { adtError } from './adt-errors';

/** Código de concepto de clinical por id (para cruzar con practice). */
const ISO_CODE_BY_PRAC_ID = new Map(
  [
    'ISO_NONE',
    'ISO_CONTACT',
    'ISO_DROPLET',
    'ISO_AIRBORNE',
    'ISO_PROTECTIVE',
  ].map((c) => [PRAC[c as keyof typeof PRAC], c]),
);
const LEVEL_CODE_BY_ID = new Map(
  [
    'LOC_CARE_GENERAL',
    'LOC_CARE_INTERMEDIATE',
    'LOC_CARE_ICU',
    'LOC_CARE_NEONATAL_ICU',
  ].map((c) => [CLIN[c as keyof typeof CLIN], c]),
);
const PRAC_CODE_BY_ID = new Map(
  (
    [
      'SEX_ANY',
      'SEX_FEMALE',
      'SEX_MALE',
      'AGE_ANY',
      'AGE_ADULT',
      'AGE_PEDIATRIC',
      'AGE_NEONATAL',
      'SPACE_FN_BED_ICU',
      'SPACE_FN_BED_STANDARD',
      'SPACE_FN_CRIB',
      'SPACE_FN_ISOLATION_AIIR',
    ] as const
  ).map((c) => [PRAC[c], c as string]),
);

/** Petición ADT. */
export interface AdtRequest {
  readonly actor: { id: string; roles?: string[] };
  readonly tenantId: string;
  readonly requestId?: string;
}

/** Eventos ADT (asyncapi `AdtEvent`). */
export const ADT_EVENTS = {
  admitted: 'clinical.adt.admitted',
  bedAssigned: 'clinical.adt.bed_assigned',
  reservationCreated: 'clinical.adt.reservation_created',
  transferred: 'clinical.adt.transferred',
  swapped: 'clinical.adt.swapped',
  discharged: 'clinical.adt.discharged',
  reservationCancelled: 'clinical.adt.reservation_cancelled',
  transferCancelled: 'clinical.adt.transfer_cancelled',
  placementOverride: 'clinical.adt.placement_override',
  incidentReviewed: 'clinical.adt.placement_incident_reviewed',
  censusClosed: 'clinical.census_day.closed',
  censusAdjusted: 'clinical.census_day.adjusted',
} as const;

/** Resultado de colocar a un paciente en una cama. */
export interface Placement {
  readonly location: EncounterLocations;
  readonly incidentId: string | null;
  readonly state: CareSpaceOperationalState;
}

/**
 * Colaborador común de los casos de uso de ADT (F3): carga del encuentro del
 * tenant, compatibilidad, colocación en cama (con incidente si se fuerza),
 * cierre de una ubicación y publicación de eventos. Todo dentro de la
 * transacción del llamador; la cama se opera sólo por `CareSpaceOpsPort`.
 */
@Injectable()
export class AdtSupport {
  constructor(
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
    private readonly repo: InpatientRepository,
    private readonly outbox: OutboxService,
  ) {}

  /** Puerto de F2 (para los casos de uso). */
  get port(): CareSpaceOpsPort {
    return this.ops;
  }

  /**
   * Encuentro del tenant, o 404.
   *
   * @param tx - Transacción.
   * @param encounterId - Encuentro.
   * @param tenantId - Tenant activo.
   */
  async encounter(
    tx: EntityManager,
    encounterId: string,
    tenantId: string,
  ): Promise<Encounters> {
    const enc = await tx.findOne(Encounters, { id: encounterId });
    if (!enc || enc.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }
    return enc;
  }

  /**
   * Ubicación de cama vigente (ACTIVE abierta) del encuentro.
   *
   * @param tx - Transacción.
   * @param encounterId - Encuentro.
   */
  activeBed(
    tx: EntityManager,
    encounterId: string,
  ): Promise<EncounterLocations | null> {
    return tx.findOne(EncounterLocations, {
      encounterId,
      isBedAssignment: true,
      locationStatusConceptId: CLIN.LOCATION_ACTIVE,
      periodEnd: null,
    });
  }

  /**
   * Reglas de compatibilidad del encuentro con la cama.
   *
   * @param tx - Transacción.
   * @param encounter - Encuentro (paciente, aislamiento, nivel).
   * @param careSpaceId - Cama.
   * @param options - Reserva, y camas/encuentros que salen (intercambio).
   */
  async compatibility(
    tx: EntityManager,
    encounter: Encounters,
    careSpaceId: string,
    options: {
      reserve?: boolean;
      ignoreOccupancy?: boolean;
      leaving?: string[];
      siteId?: string;
    } = {},
  ): Promise<{ violations: Violation[]; state: CareSpaceOperationalState }> {
    return this.compatibilityFor(
      tx,
      {
        encounterId: encounter.id,
        patientProfileId: encounter.patientProfileId,
        isolation:
          ISO_CODE_BY_PRAC_ID.get(
            encounter.isolationPrecautionConceptId ?? '',
          ) ?? 'ISO_NONE',
        organism: encounter.isolationOrganismText ?? null,
        levelOfCare:
          LEVEL_CODE_BY_ID.get(encounter.levelOfCareConceptId ?? '') ?? null,
      },
      careSpaceId,
      options,
    );
  }

  /**
   * Las mismas reglas para un sujeto que todavía puede no tener encuentro
   * (evaluación prospectiva del paso «Cama» del ingreso).
   *
   * @param tx - Transacción.
   * @param subject - Paciente, aislamiento, organismo y nivel de cuidado.
   * @param careSpaceId - Cama.
   * @param options - Reserva, y camas/encuentros que salen (intercambio).
   */
  async compatibilityFor(
    tx: EntityManager,
    subject: {
      encounterId: string | null;
      patientProfileId: string;
      isolation: string;
      organism: string | null;
      levelOfCare: string | null;
    },
    careSpaceId: string,
    options: {
      reserve?: boolean;
      ignoreOccupancy?: boolean;
      leaving?: string[];
      siteId?: string;
    } = {},
  ): Promise<{ violations: Violation[]; state: CareSpaceOperationalState }> {
    const state = await this.ops.getOperationalState(tx, careSpaceId);
    if (state.formCode !== 'LOC_FORM_BED')
      throw adtError('SPACE_NOT_A_BED', { careSpaceId });
    if (options.siteId && state.practiceSiteId !== options.siteId) {
      throw new ResourceNotFoundException('Cama no encontrada en la sede', {
        careSpaceId,
      });
    }
    const ctx = await this.repo.bedContext(tx, careSpaceId);
    const patient = await this.repo.patient(tx, subject.patientProfileId);
    const roommates = ctx?.room_id
      ? await this.repo.roommates(
          tx,
          ctx.room_id,
          careSpaceId,
          [subject.encounterId, ...(options.leaving ?? [])].filter(
            (x): x is string => !!x,
          ),
        )
      : [];
    const isolation = subject.isolation;
    const violations = evaluateCompatibility({
      bedViolations: state.violations.filter(
        (v) => !(options.ignoreOccupancy && v === 'OCCUPANCY'),
      ),
      reserve: options.reserve ?? false,
      bedFunction: state.functionCode,
      airborneCapable:
        state.functionCode === 'SPACE_FN_ISOLATION_AIIR' ||
        PRAC_CODE_BY_ID.get(ctx?.room_function_concept_id ?? '') ===
          'SPACE_FN_ISOLATION_AIIR',
      sexRestriction:
        PRAC_CODE_BY_ID.get(ctx?.room_sex_restriction_concept_id ?? '') ??
        PRAC_CODE_BY_ID.get(ctx?.sex_restriction_concept_id ?? '') ??
        null,
      ageGroup:
        PRAC_CODE_BY_ID.get(ctx?.age_group_concept_id ?? '') ??
        PRAC_CODE_BY_ID.get(ctx?.room_age_group_concept_id ?? '') ??
        null,
      patientSex: patient?.sex ?? null,
      patientBirthDate: patient?.birthDate ?? null,
      isolation,
      organism: subject.organism,
      levelOfCare: subject.levelOfCare,
      roommates: roommates.map((r) => ({
        sex: sexOf(r.gender_id),
        isolation: ISO_CODE_BY_PRAC_ID.get(r.isolation_id ?? '') ?? 'ISO_NONE',
        organism: r.organism,
      })),
      now: new Date(),
    });
    return { violations, state };
  }

  /**
   * Coloca al encuentro en la cama: compatibilidad (409/422 del contrato),
   * override sólo con supervisión (403), ubicación con `tenant_id`,
   * incidente si se forzó, evento A20 de ocupación por el puerto.
   *
   * @param tx - Transacción.
   * @param input - Encuentro, cama, modo, override y contexto.
   */
  async place(
    tx: EntityManager,
    input: {
      encounter: Encounters;
      careSpaceId: string;
      siteId?: string;
      mode: 'ASSIGN' | 'RESERVE';
      movement: 'ADT_ADMIT' | 'ADT_TRANSFER' | 'ADT_SWAP' | 'ADT_RESERVE';
      override?: PlacementOverrideDto;
      roles: ReadonlySet<InfraRole>;
      canOverride: boolean;
      at: Date;
      previousLocationId?: string;
      ignoreOccupancy?: boolean;
      leaving?: string[];
      req: AdtRequest;
    },
  ): Promise<Placement> {
    const { violations, state } = await this.compatibility(
      tx,
      input.encounter,
      input.careSpaceId,
      {
        reserve: input.mode === 'RESERVE',
        ignoreOccupancy: input.ignoreOccupancy,
        leaving: input.leaving,
        siteId: input.siteId,
      },
    );
    const verdict = judgePlacement(violations, input.override);
    if (!verdict.ok) throw adtError(verdict.reason, verdict.details);
    if (verdict.forced.length > 0 && !input.canOverride) {
      throw adtError('BED_COMPATIBILITY_OVERRIDE_REQUIRED', {
        violations,
        requiredRoles: ['NURSE_SUPERVISOR'],
      });
    }
    const ctx = await this.repo.bedContext(tx, input.careSpaceId);
    const now = new Date();
    const location = tx.create(
      EncounterLocations,
      {
        tenantId: input.encounter.tenantId,
        encounterId: input.encounter.id,
        practiceSiteId: state.practiceSiteId,
        clinicalUnitId: ctx?.owner_unit_id ?? undefined,
        careSpaceId: input.careSpaceId,
        locationStatusConceptId:
          input.mode === 'RESERVE'
            ? CLIN.LOCATION_RESERVED
            : CLIN.LOCATION_ACTIVE,
        periodStart: input.at,
        isBedAssignment: true,
        movementTypeConceptId:
          CLIN[input.mode === 'RESERVE' ? 'ADT_RESERVE' : input.movement],
        previousEncounterLocationId: input.previousLocationId,
        bedCategoryConceptId: state.bedCategoryConceptId ?? undefined,
        createdAt: now,
        updatedAt: now,
        createdByUserId: input.req.actor.id,
        updatedByUserId: input.req.actor.id,
      },
      { partial: true },
    );
    await this.flush(tx);
    let incidentId: string | null = null;
    if (verdict.forced.length > 0) {
      const incident = tx.create(
        PlacementIncidents,
        {
          tenantId: input.encounter.tenantId,
          encounterId: input.encounter.id,
          encounterLocationId: location.id,
          careSpaceId: input.careSpaceId,
          patientProfileId: input.encounter.patientProfileId,
          violationsJson: violations.filter((v) =>
            verdict.forced.includes(v.rule),
          ),
          justificationText: (input.override as PlacementOverrideDto)
            .justification,
          authorizedByUserId: input.req.actor.id,
          statusConceptId: CLIN.PLC_INC_OPEN,
          createdAt: now,
          updatedAt: now,
          createdByUserId: input.req.actor.id,
          updatedByUserId: input.req.actor.id,
        },
        { partial: true },
      );
      await this.flush(tx);
      location.placementIncidentId = incident.id;
      await this.flush(tx);
      incidentId = incident.id;
      await this.publish(
        tx,
        ADT_EVENTS.placementOverride,
        input.encounter,
        incident.id,
        {
          incidentId: incident.id,
          encounterLocationId: location.id,
          careSpaceId: input.careSpaceId,
          rules: verdict.forced,
        },
        input.req,
      );
    }
    if (!input.ignoreOccupancy) {
      await this.ops.recordOccupancyChange(tx, input.careSpaceId, {
        from: 'OCC_FREE',
        to: input.mode === 'RESERVE' ? 'OCC_RESERVED' : 'OCC_OCCUPIED',
        sourceRefId: location.id,
        actor: input.req.actor,
        requestId: input.req.requestId,
      });
    }
    return {
      location,
      incidentId,
      state: await this.ops.getOperationalState(tx, input.careSpaceId),
    };
  }

  /**
   * Cierra una ubicación en `at` con su motivo y estado.
   *
   * @param tx - Transacción.
   * @param location - Ubicación.
   * @param endReason - `ADT_END_*`.
   * @param at - Fin.
   * @param actorId - Actor.
   * @param status - COMPLETED (por defecto) o CANCELLED.
   */
  async close(
    tx: EntityManager,
    location: EncounterLocations,
    endReason: keyof typeof CLIN,
    at: Date,
    actorId: string,
    status: 'LOCATION_COMPLETED' | 'LOCATION_CANCELLED' = 'LOCATION_COMPLETED',
  ): Promise<void> {
    location.periodEnd = at;
    location.locationStatusConceptId = CLIN[status];
    location.endReasonConceptId = CLIN[endReason];
    touch(location, actorId);
    await this.flush(tx);
  }

  /**
   * Publica un evento ADT (payload con ids; nunca datos del paciente).
   *
   * @param tx - Transacción.
   * @param eventType - Evento.
   * @param encounter - Encuentro (tenant).
   * @param aggregateId - Agregado.
   * @param payload - Carga.
   * @param req - Petición.
   */
  async publish(
    tx: EntityManager,
    eventType: (typeof ADT_EVENTS)[keyof typeof ADT_EVENTS],
    encounter: Pick<Encounters, 'tenantId' | 'id'>,
    aggregateId: string,
    payload: Record<string, unknown>,
    req: AdtRequest,
  ): Promise<void> {
    try {
      await this.outbox.publishDomainEvent(tx, {
        tenantId: encounter.tenantId,
        eventType,
        aggregateType: eventType.startsWith('clinical.census_day')
          ? 'clinical.inpatient_census_days'
          : eventType.includes('placement')
            ? 'clinical.placement_incidents'
            : 'clinical.encounters',
        aggregateId,
        payloadJson: {
          encounterId: encounter.id,
          ...payload,
          requestId: req.requestId ?? null,
        },
        actorUserId: req.actor.id,
      });
    } catch (error) {
      throw translateInfraWriteError(error);
    }
  }

  /** `flush` con 23503 → 404 y 23P01 → reason del mapa. */
  async flush(tx: EntityManager): Promise<void> {
    try {
      await tx.flush();
    } catch (error) {
      throw translateInfraWriteError(error);
    }
  }
}
