import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PROF } from '../../profiles/profiles.concepts';
import {
  bedStatusV2,
  isAssignable,
  type OccupancyCode,
} from '../domain/bed-status-v2';
import type {
  BedBoardCell,
  BedBoardPatient,
} from '../dto/care-space-ops.types';
import type { CareSpacePathItem } from '../dto/infrastructure.types';
import { FORMS, FUNCTIONS, SPACE_LIFECYCLE } from '../infrastructure-catalog';
import {
  AVAILABILITY,
  BLOCK_REASONS,
  HYGIENE,
  ISOLATION,
  OCCUPANCY,
  axisCodes,
  conceptIdOf,
} from '../ops-catalog';
import { PRAC } from '../practice.concepts';
import { practiceOutOfScope } from './practice-scope';
import { CLIN } from '../../clinical/clinical.concepts';
import type { CareSpaceOperationalState } from './care-space-ops.port';
import { OpsSettingsReader, type InfraSettings } from './ops-settings';
import {
  SPACE_OPS_COLUMNS,
  isoOrNull,
  placeholders,
  toSpaceOpsRow,
  type SpaceOpsRow,
  str,
  strOrNull,
} from './ops-rows';
import { ref } from './structure-mapper';

/** Ocupación derivada de un espacio. */
export interface OccupancyInfo {
  readonly code: OccupancyCode;
  readonly since: Date | null;
  readonly encounterId: string | null;
}

/** Orden abierta de un espacio. */
export interface OpenOrderInfo {
  readonly id: string;
  readonly statusConceptId: string;
}

/** Nodo mínimo del árbol para armar la ruta. */
interface TreeNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly code: string;
  readonly name: string;
  readonly formConceptId: string | null;
}

/**
 * ¿Está el espacio en ciclo de vida activo y dentro de su vigencia?
 *
 * @param row - El espacio.
 * @param now - Ahora.
 */
export function isLifecycleActive(row: SpaceOpsRow, now: Date): boolean {
  if (row.statusConceptId !== PRAC.SPACE_ACTIVE) return false;
  if (row.validFrom && row.validFrom.getTime() > now.getTime()) return false;
  if (row.validTo && row.validTo.getTime() <= now.getTime()) return false;
  return true;
}

/**
 * Estado operativo de un espacio a partir de su fila y de lo derivado. Función
 * pura (sin base ni reloj propio).
 *
 * @param row - El espacio.
 * @param occupancy - Ocupación derivada.
 * @param openOrderId - Orden de limpieza abierta, si hay.
 * @param settings - Configuración del establecimiento.
 * @param now - Ahora.
 */
export function computeOperationalState(
  row: SpaceOpsRow,
  occupancy: OccupancyCode,
  openOrderId: string | null,
  settings: InfraSettings,
  now: Date,
): CareSpaceOperationalState {
  const axes = axisCodes({
    operationalStatusConceptId: row.operationalStatusConceptId,
    hygieneStatusConceptId: row.hygieneStatusConceptId,
    isolationConceptId: row.isolationConceptId,
  });
  const resolved = {
    lifecycleActive: isLifecycleActive(row, now),
    ...axes,
    occupancy,
    terminalCleaningRequired: row.terminalCleaningRequired,
  };
  const options = { inspectionRequired: settings.inspectionRequired };
  return {
    careSpaceId: row.id,
    tenantId: row.tenantId,
    practiceSiteId: row.practiceSiteId,
    lifecycleActive: resolved.lifecycleActive,
    availability: axes.availability,
    availabilityReasonCode:
      BLOCK_REASONS.byConceptId(row.availabilityReasonConceptId)?.code ?? null,
    availabilityExpectedUntil: row.availabilityExpectedUntil,
    hygiene: axes.hygiene,
    terminalCleaningRequired: row.terminalCleaningRequired,
    isolation: axes.isolation,
    isolationOrganism: row.isolationOrganismText,
    occupancy,
    v2Code: bedStatusV2(resolved, options),
    assignable: isAssignable(resolved, options),
    openCleaningOrderId: openOrderId,
    opsVersion: row.opsVersion,
  };
}

/** `M`, `F` o `U` del sexo administrativo. */
function sexCodeOf(conceptId: string | null): string {
  if (conceptId === PROF.GENDER_MALE) return 'M';
  if (conceptId === PROF.GENDER_FEMALE) return 'F';
  return 'U';
}

/** Años cumplidos a `now`, o `null` si no hay fecha. */
function ageYears(birthDate: string | null, now: Date): number | null {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  let age = now.getUTCFullYear() - year;
  const beforeBirthday =
    now.getUTCMonth() + 1 < month ||
    (now.getUTCMonth() + 1 === month && now.getUTCDate() < day);
  if (beforeBirthday) age -= 1;
  return Math.max(age, 0);
}

/** Qué cargar para armar celdas. */
export interface CellOptions {
  /** ¿Se muestran los datos del paciente de este espacio? (sólo Enfermería y Admisión). */
  readonly patientVisible: (careSpaceId: string) => boolean;
  /** Ahora (se fija afuera para que toda la respuesta use el mismo instante). */
  readonly now: Date;
  /** Configuración ya leída, si el llamador la tiene. */
  readonly settings?: InfraSettings;
}

/**
 * Lectura del estado operativo: carga el espacio, deriva la ocupación y arma las
 * celdas que sirven el tablero, la ficha operativa y las respuestas de las
 * mutaciones. Sólo lee; las escrituras son de `OpsRecorder`.
 */
@Injectable()
export class OpsStateService {
  /**
   * @param settings - Configuración `infra.*`.
   */
  constructor(private readonly settings: OpsSettingsReader) {}

  /**
   * Carga un espacio del tenant. Un id ajeno o inexistente responde el mismo 404.
   *
   * @param tx - Transacción o contexto activo.
   * @param tenantId - Tenant del contexto.
   * @param id - Espacio.
   * @param lock - `true` para bloquear la fila (`FOR UPDATE`) durante la transacción.
   * @throws ResourceNotFoundException (404 `PRACTICE_RESOURCE_OUT_OF_SCOPE`).
   */
  async loadSpace(
    tx: EntityManager,
    tenantId: string,
    id: string,
    lock = false,
  ): Promise<SpaceOpsRow> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select ${SPACE_OPS_COLUMNS} from practice.care_spaces cs
        where cs.id = ? and cs.tenant_id = ? ${lock ? 'for update' : ''}`,
      [id, tenantId],
    );
    if (rows.length === 0) throw practiceOutOfScope('Espacio no encontrado');
    return toSpaceOpsRow(rows[0]);
  }

  /**
   * Espacios por id (los de otro tenant no se devuelven).
   *
   * @param tx - Transacción o contexto activo.
   * @param tenantId - Tenant del contexto.
   * @param ids - Ids.
   */
  async loadSpaces(
    tx: EntityManager,
    tenantId: string,
    ids: readonly string[],
  ): Promise<SpaceOpsRow[]> {
    if (ids.length === 0) return [];
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select ${SPACE_OPS_COLUMNS} from practice.care_spaces cs
        where cs.tenant_id = ? and cs.id in (${placeholders(ids.length)})`,
      [tenantId, ...ids],
    );
    return rows.map(toSpaceOpsRow);
  }

  /**
   * Todos los espacios de una sede.
   *
   * @param tx - Transacción o contexto activo.
   * @param tenantId - Tenant del contexto.
   * @param siteId - Establecimiento.
   */
  async loadSiteSpaces(
    tx: EntityManager,
    tenantId: string,
    siteId: string,
  ): Promise<SpaceOpsRow[]> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select ${SPACE_OPS_COLUMNS} from practice.care_spaces cs
        where cs.tenant_id = ? and cs.practice_site_id = ?`,
      [tenantId, siteId],
    );
    return rows.map(toSpaceOpsRow);
  }

  /**
   * Ocupación derivada de `clinical.encounter_locations` (INV-24): ocupada si hay
   * una ubicación de cama activa que ya empezó, reservada si sólo hay reservas.
   *
   * @param tx - Transacción o contexto activo.
   * @param scope - Los espacios (≤ 100) o la sede entera.
   * @param now - Ahora.
   */
  async occupancyOf(
    tx: EntityManager,
    scope: { spaceIds: readonly string[] } | { siteId: string },
    now: Date,
  ): Promise<Map<string, OccupancyInfo>> {
    const byIds = 'spaceIds' in scope;
    if (byIds && scope.spaceIds.length === 0) return new Map();
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select el.care_space_id, el.encounter_id, el.location_status_concept_id, el.period_start
         from clinical.encounter_locations el
        where ${
          byIds
            ? `el.care_space_id in (${placeholders(scope.spaceIds.length)})`
            : 'el.practice_site_id = ?'
        }
          and el.is_bed_assignment
          and el.location_status_concept_id in (?, ?)
          and (el.period_end is null or el.period_end > ?)
        order by el.period_start nulls last`,
      [
        ...(byIds ? scope.spaceIds : [scope.siteId]),
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_RESERVED,
        now,
      ],
    );
    const result = new Map<string, OccupancyInfo>();
    for (const raw of rows) {
      const spaceId = str(raw.care_space_id);
      const status = str(raw.location_status_concept_id);
      const start = raw.period_start ? new Date(str(raw.period_start)) : null;
      const active =
        status === CLIN.LOCATION_ACTIVE && (!start || start <= now);
      const reserved = status === CLIN.LOCATION_RESERVED;
      if (!active && !reserved) continue;
      const current = result.get(spaceId);
      if (current?.code === 'OCC_OCCUPIED') continue;
      if (current && !active) continue;
      result.set(spaceId, {
        code: active ? 'OCC_OCCUPIED' : 'OCC_RESERVED',
        since: start,
        encounterId: str(raw.encounter_id),
      });
    }
    return result;
  }

  /**
   * Orden de limpieza abierta (pendiente, en curso o hecha sin inspeccionar) de
   * cada espacio.
   *
   * @param tx - Transacción o contexto activo.
   * @param scope - Los espacios (≤ 100) o la sede entera.
   */
  async openOrdersOf(
    tx: EntityManager,
    scope: { spaceIds: readonly string[] } | { siteId: string },
  ): Promise<Map<string, OpenOrderInfo>> {
    const byIds = 'spaceIds' in scope;
    if (byIds && scope.spaceIds.length === 0) return new Map();
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select o.id, o.care_space_id, o.status_concept_id from practice.cleaning_orders o
        where ${
          byIds
            ? `o.care_space_id in (${placeholders(scope.spaceIds.length)})`
            : 'o.practice_site_id = ?'
        }
          and o.status_concept_id in (?, ?, ?)`,
      [
        ...(byIds ? scope.spaceIds : [scope.siteId]),
        PRAC.CLN_PENDING,
        PRAC.CLN_IN_PROGRESS,
        PRAC.CLN_DONE,
      ],
    );
    return new Map(
      rows.map((raw) => [
        str(raw.care_space_id),
        {
          id: str(raw.id),
          statusConceptId: str(raw.status_concept_id),
        },
      ]),
    );
  }

  /**
   * Estado operativo de un espacio ya cargado.
   *
   * @param tx - Transacción o contexto activo.
   * @param row - El espacio.
   * @param now - Ahora.
   * @param occupancyOverride - Ocupación a usar en lugar de la derivada (el evento A20 de ocupación la trae de F3).
   */
  async stateOf(
    tx: EntityManager,
    row: SpaceOpsRow,
    now: Date = new Date(),
    occupancyOverride?: OccupancyCode,
  ): Promise<CareSpaceOperationalState> {
    const [occupancy, orders, settings] = await Promise.all([
      this.occupancyOf(tx, { spaceIds: [row.id] }, now),
      this.openOrdersOf(tx, { spaceIds: [row.id] }),
      this.settings.forSite(tx, row.practiceSiteId),
    ]);
    return computeOperationalState(
      row,
      occupancyOverride ?? occupancy.get(row.id)?.code ?? 'OCC_FREE',
      orders.get(row.id)?.id ?? null,
      settings,
      now,
    );
  }

  /**
   * Árbol mínimo de la sede, para armar las rutas.
   *
   * @param tx - Transacción o contexto activo.
   * @param siteId - Establecimiento.
   */
  async treeOf(
    tx: EntityManager,
    siteId: string,
  ): Promise<Map<string, TreeNode>> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select id, parent_space_id, code, name, form_concept_id
         from practice.care_spaces where practice_site_id = ?`,
      [siteId],
    );
    return new Map(
      rows.map((raw) => [
        str(raw.id),
        {
          id: str(raw.id),
          parentId: strOrNull(raw.parent_space_id),
          code: str(raw.code),
          name: str(raw.name),
          formConceptId: raw.form_concept_id ? str(raw.form_concept_id) : null,
        },
      ]),
    );
  }

  /**
   * Arma las celdas del tablero para los espacios dados, con una consulta por
   * dato derivado (no una por celda).
   *
   * @param tx - Transacción o contexto activo.
   * @param siteId - Establecimiento de los espacios.
   * @param spaces - Los espacios (de una misma sede).
   * @param options - Instante y visibilidad del paciente.
   * @returns Las celdas, en el orden de `spaces`.
   */
  async cells(
    tx: EntityManager,
    siteId: string,
    spaces: readonly SpaceOpsRow[],
    options: CellOptions,
  ): Promise<BedBoardCell[]> {
    if (spaces.length === 0) return [];
    const { now } = options;
    const scope =
      spaces.length <= 100
        ? { spaceIds: spaces.map((space) => space.id) }
        : { siteId };
    const [occupancy, orders, settings, tree, lastEvents, blockTexts] =
      await Promise.all([
        this.occupancyOf(tx, scope, now),
        this.openOrdersOf(tx, scope),
        options.settings
          ? Promise.resolve(options.settings)
          : this.settings.forSite(tx, siteId),
        this.treeOf(tx, siteId),
        this.lastEventsOf(tx, scope),
        this.currentBlockTexts(tx, scope, now),
      ]);

    const visibleEncounterIds = spaces
      .filter((space) => options.patientVisible(space.id))
      .map((space) => occupancy.get(space.id)?.encounterId)
      .filter((id): id is string => Boolean(id));
    const patients = await this.patientsOf(tx, visibleEncounterIds, now);

    return spaces.map((row) => {
      const occ = occupancy.get(row.id);
      const state = computeOperationalState(
        row,
        occ?.code ?? 'OCC_FREE',
        orders.get(row.id)?.id ?? null,
        settings,
        now,
      );
      const visible = options.patientVisible(row.id);
      const encounterId = occ?.encounterId ?? undefined;
      const patient =
        visible && encounterId ? patients.get(encounterId) : undefined;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        path: this.pathOf(tree, row),
        form: ref(FORMS.byConceptId(row.formConceptId)),
        function: ref(FUNCTIONS.byConceptId(row.spaceTypeConceptId)),
        lifecycle: ref(SPACE_LIFECYCLE.byConceptId(row.statusConceptId)),
        availability: {
          code: state.availability,
          reasonCode: state.availabilityReasonCode,
          reasonText: blockTexts.get(row.id) ?? null,
          expectedUntil: isoOrNull(row.availabilityExpectedUntil),
          since: isoOrNull(row.availabilityChangedAt),
        },
        hygiene: {
          code: state.hygiene,
          since: isoOrNull(row.hygieneChangedAt),
          terminalRequired: state.terminalCleaningRequired,
        },
        isolation: {
          code: state.isolation,
          organism: state.isolationOrganism,
          since: isoOrNull(row.isolationChangedAt),
        },
        occupancy: {
          code: state.occupancy,
          since: isoOrNull(occ?.since),
          ...(visible && encounterId ? { encounterId } : {}),
          ...(patient ? { patient } : {}),
        },
        v2Code: state.v2Code,
        assignable: state.assignable,
        openCleaningOrderId: state.openCleaningOrderId,
        lastEventAt: isoOrNull(lastEvents.get(row.id)),
        opsVersion: row.opsVersion,
      };
    });
  }

  /** Último evento A20 de cada espacio. */
  private async lastEventsOf(
    tx: EntityManager,
    scope: { spaceIds: readonly string[] } | { siteId: string },
  ): Promise<Map<string, Date>> {
    const byIds = 'spaceIds' in scope;
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select care_space_id, max(occurred_at) as last_at
         from practice.care_space_status_events
        where ${
          byIds
            ? `care_space_id in (${placeholders(scope.spaceIds.length)})`
            : 'practice_site_id = ?'
        }
        group by care_space_id`,
      byIds ? [...scope.spaceIds] : [scope.siteId],
    );
    return new Map(
      rows.map((raw) => [str(raw.care_space_id), new Date(str(raw.last_at))]),
    );
  }

  /** Texto del motivo del bloqueo que rige hoy en cada espacio. */
  private async currentBlockTexts(
    tx: EntityManager,
    scope: { spaceIds: readonly string[] } | { siteId: string },
    now: Date,
  ): Promise<Map<string, string | null>> {
    const byIds = 'spaceIds' in scope;
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select distinct on (b.care_space_id) b.care_space_id, b.reason_text
         from practice.care_space_blocks b
        where ${
          byIds
            ? `b.care_space_id in (${placeholders(scope.spaceIds.length)})`
            : `b.care_space_id in (select id from practice.care_spaces where practice_site_id = ?)`
        }
          and b.ended_at is null and b.cancelled_at is null and b.starts_at <= ?
        order by b.care_space_id, b.starts_at desc`,
      [...(byIds ? scope.spaceIds : [scope.siteId]), now],
    );
    return new Map(
      rows.map((raw) => [str(raw.care_space_id), strOrNull(raw.reason_text)]),
    );
  }

  /** Iniciales, sexo y edad de los pacientes de los encuentros dados. */
  private async patientsOf(
    tx: EntityManager,
    encounterIds: readonly string[],
    now: Date,
  ): Promise<Map<string, BedBoardPatient>> {
    if (encounterIds.length === 0) return new Map();
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select e.id as encounter_id, p.name, p.last_name,
              to_char(p.birth_date, 'YYYY-MM-DD') as birth_date,
              p.administrative_gender_concept_id
         from clinical.encounters e
         join profiles.persons p on p.id = e.patient_profile_id
        where e.id in (${placeholders(encounterIds.length)})`,
      [...encounterIds],
    );
    return new Map(
      rows.map((raw) => {
        const initials = `${str(raw.name ?? '').charAt(0)}${str(raw.last_name ?? '').charAt(0)}`;
        return [
          str(raw.encounter_id),
          {
            initials: initials.toUpperCase(),
            sexCode: sexCodeOf(
              raw.administrative_gender_concept_id
                ? str(raw.administrative_gender_concept_id)
                : null,
            ),
            ageYears: ageYears(strOrNull(raw.birth_date), now),
          },
        ];
      }),
    );
  }

  /** Ruta desde la raíz hasta el padre del espacio. */
  private pathOf(
    tree: ReadonlyMap<string, TreeNode>,
    row: SpaceOpsRow,
  ): CareSpacePathItem[] {
    const path: CareSpacePathItem[] = [];
    const seen = new Set<string>([row.id]);
    let current = row.parentSpaceId ? tree.get(row.parentSpaceId) : undefined;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      path.unshift({
        id: current.id,
        code: current.code,
        name: current.name,
        form: ref(FORMS.byConceptId(current.formConceptId)),
      });
      current = current.parentId ? tree.get(current.parentId) : undefined;
    }
    return path;
  }
}

/** Resuelve el id de un concepto de la ocupación (para los eventos del eje OCCUPANCY). */
export function occupancyConceptId(code: OccupancyCode): string {
  return conceptIdOf(OCCUPANCY, code);
}

/** Id del concepto de higiene. */
export function hygieneConceptId(code: string): string {
  return conceptIdOf(HYGIENE, code);
}

/** Id del concepto de aislamiento. */
export function isolationConceptId(code: string): string {
  return conceptIdOf(ISOLATION, code);
}

/** Id del concepto de disponibilidad. */
export function availabilityConceptId(code: string): string {
  return conceptIdOf(AVAILABILITY, code);
}
