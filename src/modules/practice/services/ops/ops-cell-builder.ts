import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PROF } from '../../../profiles/profiles.concepts';
import type {
  CareSpaceBlocks,
  CareSpaces,
  CleaningOrders,
  CareSpaceStatusEvents,
} from '../../entities';
import {
  CareSpaceOpsRepository,
  type ChainRow,
  type PatientBadgeRow,
} from '../../repositories';
import type {
  BedBoardCellDto,
  BedPatientDto,
  CareSpaceBlockDto,
  CleaningOrderDto,
  StatusEventDto,
} from '../../dto';
import {
  AXIS,
  BLOCK_KIND,
  BLOCK_REASONS,
  CLEANING_PRIORITY,
  CLEANING_STATUS,
  CLEANING_TRIGGER,
  CLEANING_TYPE,
  OCCUPANCY,
  SOURCE,
  AVAILABILITY,
  HYGIENE,
  ISOLATION,
  codeFor,
} from '../../domain/ops/ops-catalog';
import type { CleaningStatusCode } from '../../domain/ops/ops-catalog';
import {
  allowedCleaningActions,
  cleaningInspectionRequired,
} from '../../domain/ops/cleaning-rules';
import { PRAC } from '../../practice.concepts';
import { codeOf } from '../structure-input';
import {
  CareSpaceOpsCore,
  type OperationalSnapshot,
} from './care-space-ops-core';

/** Motivo de bloqueo por concepto. */
const REASON_CODE_BY_ID = new Map(
  Object.entries(BLOCK_REASONS).map(([code, r]) => [r.id, code]),
);

/** Fecha ISO o `null`. */
function iso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return (d instanceof Date ? d : new Date(d)).toISOString();
}

/** Código de cualquier eje A20 por concepto. */
function axisValueCode(id: string | null | undefined): string | null {
  return (
    (codeFor(AVAILABILITY, id) as string | undefined) ??
    (codeFor(HYGIENE, id) as string | undefined) ??
    (codeFor(ISOLATION, id) as string | undefined) ??
    (codeFor(OCCUPANCY, id) as string | undefined) ??
    null
  );
}

/**
 * Edad cumplida en años.
 *
 * @param birth - Nacimiento.
 * @param now - Referencia.
 */
export function ageInYears(birth: Date, now: Date): number {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

/**
 * Lo mínimo del paciente para el tablero (§F2.3): iniciales, sexo y edad.
 * Nunca el nombre completo.
 *
 * @param row - Datos del encuentro.
 * @param now - Referencia.
 */
export function patientBadge(
  row: PatientBadgeRow,
  now = new Date(),
): BedPatientDto {
  const initials = [row.name, row.last_name]
    .map((part) => (part ?? '').trim().charAt(0).toUpperCase())
    .join('');
  const sexCode =
    row.gender_id === PROF.GENDER_MALE
      ? 'M'
      : row.gender_id === PROF.GENDER_FEMALE
        ? 'F'
        : row.gender_id
          ? 'O'
          : null;
  return {
    initials,
    sexCode,
    ageYears: row.birth_date ? ageInYears(new Date(row.birth_date), now) : null,
  };
}

/**
 * Arma las vistas de F2 (`BedBoardCell`, bloqueos, órdenes, eventos A20).
 * Sin reglas: traduce filas a contrato.
 */
@Injectable()
export class OpsCellBuilder {
  /**
   * @param core - Estado operativo.
   * @param opsRepo - Lecturas.
   */
  constructor(
    private readonly core: CareSpaceOpsCore,
    private readonly opsRepo: CareSpaceOpsRepository,
  ) {}

  /**
   * Celda de un espacio suelto (respuestas de mutación y ficha operativa).
   *
   * @param tx - Contexto.
   * @param space - Espacio.
   * @param practiceId - Práctica.
   * @param withPatient - El actor puede ver al paciente.
   */
  async cellFor(
    tx: EntityManager,
    space: CareSpaces,
    practiceId: string,
    withPatient = false,
    actions: string[] = [],
  ): Promise<BedBoardCellDto> {
    const snap = await this.core.snapshot(tx, space, practiceId);
    const chain = await this.opsRepo.chain(tx, space.id);
    const [order] = await this.opsRepo.openCleaningOrders(tx, [space.id]);
    const last = await this.opsRepo.lastEventBySpace(tx, [space.id]);
    let patient: BedPatientDto | undefined;
    if (withPatient && snap.occupancy.encounterId) {
      const [row] = await this.opsRepo.patientBadges(tx, [
        snap.occupancy.encounterId,
      ]);
      if (row) patient = patientBadge(row);
    }
    const [owner] = await tx.execute<{ clinical_unit_id: string }[]>(
      `SELECT clinical_unit_id FROM practice.space_unit_assignments
        WHERE care_space_id = ? AND role_concept_id = ?
          AND valid_from <= now() AND (valid_to IS NULL OR valid_to > now())
        ORDER BY valid_from DESC LIMIT 1`,
      [space.id, PRAC.SPACE_UNIT_ROLE_OWNER],
      'all',
    );
    return this.cell(
      space,
      snap,
      chain,
      order?.id ?? null,
      last.get(space.id) ?? null,
      patient,
      {
        unitId: owner?.clinical_unit_id ?? space.clinicalUnitId ?? null,
        actions,
        clinical: withPatient,
      },
    );
  }

  /**
   * Celda con todo ya cargado (tablero).
   *
   * @param space - Espacio.
   * @param snap - Estado operativo.
   * @param chain - Camino (del espacio a la raíz).
   * @param openOrderId - Orden de limpieza abierta.
   * @param lastEventAt - Último evento A20.
   * @param patient - Paciente, si el actor lo puede ver.
   */
  cell(
    space: CareSpaces,
    snap: OperationalSnapshot,
    chain: readonly Pick<
      ChainRow,
      'id' | 'code' | 'name' | 'form_concept_id'
    >[],
    openOrderId: string | null,
    lastEventAt: Date | null,
    patient?: BedPatientDto,
    extra: {
      unitId?: string | null;
      actions?: string[];
      /** El actor tiene rol clínico (`PATIENT_VIEWERS`). */
      clinical?: boolean;
    } = {},
  ): BedBoardCellDto {
    return {
      id: space.id,
      code: space.code,
      name: space.name,
      path: [...chain]
        .slice(1)
        .reverse()
        .map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          form: codeOf(c.form_concept_id),
        })),
      form: codeOf(space.formConceptId),
      function: codeOf(space.spaceTypeConceptId),
      lifecycle: snap.axes.lifecycle,
      availability: {
        code: snap.axes.availability,
        reasonCode:
          REASON_CODE_BY_ID.get(space.availabilityReasonConceptId ?? '') ??
          null,
        reasonText: null,
        expectedUntil: iso(space.availabilityExpectedUntil),
        since: iso(space.availabilityChangedAt),
      },
      hygiene: {
        code: snap.axes.hygiene,
        since: iso(space.hygieneChangedAt),
        terminalRequired: snap.axes.terminalCleaningRequired,
      },
      isolation: {
        code: snap.axes.isolation,
        organism: space.isolationOrganismText ?? null,
        since: iso(space.isolationChangedAt),
      },
      occupancy: {
        code: snap.occupancy.code,
        since: iso(snap.occupancy.since),
        encounterId: patient ? snap.occupancy.encounterId : null,
        encounterLocationId:
          patient || extra.clinical ? snap.occupancy.locationId : null,
        ...(patient ? { patient } : {}),
      },
      v2Code: snap.v2Code,
      assignable: snap.assignable,
      openCleaningOrderId: openOrderId,
      lastEventAt: iso(lastEventAt),
      opsVersion: space.opsVersion,
      unitId: extra.unitId ?? space.clinicalUnitId ?? null,
      actions: extra.actions ?? [],
    };
  }

  /**
   * Bloqueo como lo ve el cliente.
   *
   * @param b - Fila.
   */
  block(b: CareSpaceBlocks): CareSpaceBlockDto {
    return {
      id: b.id,
      careSpaceId: b.careSpaceId,
      kindCode: (codeFor(BLOCK_KIND, b.kindConceptId) as string) ?? '',
      reasonCode: REASON_CODE_BY_ID.get(b.reasonConceptId) ?? '',
      reasonText: b.reasonText ?? null,
      startsAt: iso(b.startsAt) as string,
      expectedEndAt: iso(b.expectedEndAt),
      endedAt: iso(b.endedAt),
      cancelledAt: iso(b.cancelledAt),
      endNote: b.endNote ?? null,
      cancelReason: b.cancelReason ?? null,
      rowVersion: b.rowVersion,
    };
  }

  /**
   * Orden de limpieza (sin paciente).
   *
   * @param o - Fila.
   * @param space - Código y nombre del espacio.
   * @param now - Referencia.
   */
  order(
    o: CleaningOrders,
    space: { code: string; name: string; terminalCleaningRequired?: boolean },
    now = new Date(),
    ctx: {
      settingsInspectionRequired?: boolean;
      allows?: (permission: string) => boolean;
    } = {},
  ): CleaningOrderDto {
    const status =
      (codeFor(CLEANING_STATUS, o.statusConceptId) as string) ?? '';
    return {
      id: o.id,
      careSpaceId: o.careSpaceId,
      careSpaceCode: space.code,
      careSpaceName: space.name,
      clinicalUnitId: o.clinicalUnitId ?? null,
      typeCode:
        (codeFor(CLEANING_TYPE, o.cleaningTypeConceptId) as string) ?? '',
      triggerCode:
        (codeFor(CLEANING_TRIGGER, o.triggerConceptId) as string) ?? '',
      priorityCode:
        (codeFor(CLEANING_PRIORITY, o.priorityConceptId) as string) ?? '',
      statusCode: status,
      requestedAt: iso(o.requestedAt) as string,
      dueAt: iso(o.dueAt),
      assignedUserId: o.assignedUserId ?? null,
      startedAt: iso(o.startedAt),
      finishedAt: iso(o.finishedAt),
      finishedByUserId: o.finishedByUserId ?? null,
      inspectedAt: iso(o.inspectedAt),
      inspectionResult: o.inspectionResultConceptId
        ? o.inspectionResultConceptId === PRAC.CLN_INSPECTION_PASS
          ? 'PASS'
          : 'FAIL'
        : null,
      rejectionReason: o.rejectionReason ?? null,
      previousOrderId: o.previousOrderId ?? null,
      ageMinutes: Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(o.requestedAt).getTime()) / 60_000,
        ),
      ),
      rowVersion: o.rowVersion,
      allowedTransitions: status
        ? allowedCleaningActions(status as CleaningStatusCode, ctx.allows)
        : [],
      inspectionRequired: cleaningInspectionRequired({
        terminal:
          o.cleaningTypeConceptId === CLEANING_TYPE.CLEAN_TERMINAL ||
          !!space.terminalCleaningRequired,
        settingsInspectionRequired: !!ctx.settingsInspectionRequired,
      }),
    };
  }

  /**
   * Evento A20.
   *
   * @param e - Fila.
   */
  event(e: CareSpaceStatusEvents): StatusEventDto {
    return {
      id: e.id,
      axis: (codeFor(AXIS, e.axisConceptId) as string) ?? '',
      from: axisValueCode(e.fromConceptId),
      to: axisValueCode(e.toConceptId) ?? '',
      v2Code: e.v20116Code,
      reasonCode: REASON_CODE_BY_ID.get(e.reasonConceptId ?? '') ?? null,
      reasonText: e.reasonText ?? null,
      expectedUntil: iso(e.expectedUntil),
      source: (codeFor(SOURCE, e.sourceConceptId) as string) ?? '',
      sourceRefId: e.sourceRefId ?? null,
      occurredAt: iso(e.occurredAt) as string,
      recordedByUserId: e.recordedByUserId ?? null,
      requestId: e.requestId ?? null,
    };
  }
}
