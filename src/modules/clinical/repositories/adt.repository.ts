import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PROF } from '../../profiles/profiles.concepts';
import { PRAC } from '../../practice/practice.concepts';
import { CLIN } from '../clinical.concepts';
import { ISOLATION_PRECAUTIONS } from '../domain/adt-catalog';
import type {
  AdministrativeGender,
  RoomOccupant,
  SpaceAttributes,
} from '../domain/bed-compatibility-rules';

/** Encuentro tal como lo necesita el ADT. */
export interface AdtEncounterRow {
  id: string;
  tenantId: string;
  patientProfileId: string;
  episodeId: string | null;
  statusConceptId: string;
  classConceptId: string | null;
  rowVersion: number;
  startAt: Date | null;
  levelOfCareConceptId: string | null;
  isolationPrecautionConceptId: string | null;
  isolationOrganismText: string | null;
  dischargeDispositionConceptId: string | null;
}

/** Espacio tal como lo necesita el ADT. */
export interface AdtSpaceRow {
  id: string;
  tenantId: string;
  practiceSiteId: string;
  clinicalUnitId: string | null;
  parentSpaceId: string | null;
  formConceptId: string | null;
  functionConceptId: string;
  statusConceptId: string;
  bedCategoryConceptId: string | null;
  attributes: SpaceAttributes;
}

/** Una ubicación de encuentro. */
export interface AdtLocationRow {
  id: string;
  encounterId: string;
  tenantId: string;
  practiceSiteId: string;
  clinicalUnitId: string | null;
  careSpaceId: string | null;
  isBedAssignment: boolean;
  statusConceptId: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  movementTypeConceptId: string | null;
  previousLocationId: string | null;
  endReasonConceptId: string | null;
  bedCategoryConceptId: string | null;
  placementIncidentId: string | null;
  rowVersion: number;
}

/** Datos para insertar una ubicación. */
export interface NewLocation {
  id?: string;
  encounterId: string;
  tenantId: string;
  practiceSiteId: string;
  clinicalUnitId: string | null;
  careSpaceId: string | null;
  statusConceptId: string;
  periodStart: Date;
  periodEnd?: Date | null;
  movementTypeConceptId: string;
  previousLocationId?: string | null;
  bedCategoryConceptId?: string | null;
  placementIncidentId?: string | null;
  actorUserId: string | null;
}

const LOCATION_COLUMNS = `el.id, el.encounter_id, el.tenant_id, el.practice_site_id, el.clinical_unit_id,
  el.care_space_id, el.is_bed_assignment, el.location_status_concept_id, el.period_start, el.period_end,
  el.movement_type_concept_id, el.previous_encounter_location_id, el.end_reason_concept_id,
  el.bed_category_concept_id, el.placement_incident_id, el.row_version`;

interface RawLocation {
  id: string;
  encounter_id: string;
  tenant_id: string;
  practice_site_id: string;
  clinical_unit_id: string | null;
  care_space_id: string | null;
  is_bed_assignment: boolean;
  location_status_concept_id: string;
  period_start: Date | null;
  period_end: Date | null;
  movement_type_concept_id: string | null;
  previous_encounter_location_id: string | null;
  end_reason_concept_id: string | null;
  bed_category_concept_id: string | null;
  placement_incident_id: string | null;
  row_version: number;
}

const toLocation = (row: RawLocation): AdtLocationRow => ({
  id: row.id,
  encounterId: row.encounter_id,
  tenantId: row.tenant_id,
  practiceSiteId: row.practice_site_id,
  clinicalUnitId: row.clinical_unit_id,
  careSpaceId: row.care_space_id,
  isBedAssignment: row.is_bed_assignment,
  statusConceptId: row.location_status_concept_id,
  periodStart: row.period_start ? new Date(row.period_start) : null,
  periodEnd: row.period_end ? new Date(row.period_end) : null,
  movementTypeConceptId: row.movement_type_concept_id,
  previousLocationId: row.previous_encounter_location_id,
  endReasonConceptId: row.end_reason_concept_id,
  bedCategoryConceptId: row.bed_category_concept_id,
  placementIncidentId: row.placement_incident_id,
  rowVersion: row.row_version,
});

const ENCOUNTER_COLUMNS = `id, tenant_id, patient_profile_id, episode_id, status_concept_id, class_concept_id,
  row_version, start_at, level_of_care_concept_id, isolation_precaution_concept_id,
  isolation_organism_text, discharge_disposition_concept_id`;

interface RawEncounter {
  id: string;
  tenant_id: string;
  patient_profile_id: string;
  episode_id: string | null;
  status_concept_id: string;
  class_concept_id: string | null;
  row_version: number;
  start_at: Date | null;
  level_of_care_concept_id: string | null;
  isolation_precaution_concept_id: string | null;
  isolation_organism_text: string | null;
  discharge_disposition_concept_id: string | null;
}

const toEncounter = (row: RawEncounter): AdtEncounterRow => ({
  id: row.id,
  tenantId: row.tenant_id,
  patientProfileId: row.patient_profile_id,
  episodeId: row.episode_id,
  statusConceptId: row.status_concept_id,
  classConceptId: row.class_concept_id,
  rowVersion: row.row_version,
  startAt: row.start_at ? new Date(row.start_at) : null,
  levelOfCareConceptId: row.level_of_care_concept_id,
  isolationPrecautionConceptId: row.isolation_precaution_concept_id,
  isolationOrganismText: row.isolation_organism_text,
  dischargeDispositionConceptId: row.discharge_disposition_concept_id,
});

interface RawSpace {
  id: string;
  tenant_id: string;
  practice_site_id: string;
  clinical_unit_id: string | null;
  parent_space_id: string | null;
  form_concept_id: string | null;
  space_type_concept_id: string;
  status_concept_id: string;
  bed_category_concept_id: string | null;
  sex_restriction_concept_id: string | null;
  age_group_concept_id: string | null;
  pressure_concept_id: string | null;
  hvac_validated_on: Date | string | null;
}

const SPACE_COLUMNS = `id, tenant_id, practice_site_id, clinical_unit_id, parent_space_id, form_concept_id,
  space_type_concept_id, status_concept_id, bed_category_concept_id, sex_restriction_concept_id,
  age_group_concept_id, pressure_concept_id, hvac_validated_on`;

/** `YYYY-MM-DD` de una fecha de base (`date` llega como `Date` o texto según el driver). */
const dayOf = (value: Date | string | null): string | null => {
  if (value === null) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Marcadores `?, ?, …`: el driver no convierte un arreglo de JavaScript en uno de Postgres. */
const marks = (count: number): string => Array(count).fill('?').join(', ');

/**
 * Lecturas y escrituras de SQL de la internación (stateless; recibe la
 * transacción).
 *
 * Las ubicaciones se escriben con SQL y no con el `EntityManager` porque el
 * orden de las sentencias **importa**: las tres restricciones `EXCLUDE` de camas
 * son inmediatas salvo en el intercambio, y el ORM no garantiza el orden de un
 * `flush`. Cada escritura incrementa `row_version` a mano.
 */
@Injectable()
export class AdtRepository {
  /** Encuentro con bloqueo de fila (`FOR UPDATE`), o `null` si no existe. */
  async lockEncounter(
    tx: EntityManager,
    id: string,
  ): Promise<AdtEncounterRow | null> {
    const rows = await tx.execute<RawEncounter[]>(
      `select ${ENCOUNTER_COLUMNS} from clinical.encounters where id = ? for update`,
      [id],
    );
    return rows[0] ? toEncounter(rows[0]) : null;
  }

  /** Encuentros con bloqueo, en orden de id (no interbloquea con otro llamador). */
  async lockEncounters(
    tx: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, AdtEncounterRow>> {
    const rows = await tx.execute<RawEncounter[]>(
      `select ${ENCOUNTER_COLUMNS} from clinical.encounters where id in (${marks(ids.length)}) order by id for update`,
      [...ids],
    );
    return new Map(rows.map((row) => [row.id, toEncounter(row)]));
  }

  /** Encuentro sin bloquear. */
  async findEncounter(
    tx: EntityManager,
    id: string,
  ): Promise<AdtEncounterRow | null> {
    const rows = await tx.execute<RawEncounter[]>(
      `select ${ENCOUNTER_COLUMNS} from clinical.encounters where id = ?`,
      [id],
    );
    return rows[0] ? toEncounter(rows[0]) : null;
  }

  /** Espacios con bloqueo (`FOR UPDATE`) en orden de id. */
  async lockSpaces(
    tx: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, AdtSpaceRow>> {
    const unique = [...new Set(ids)];
    const rows = await tx.execute<RawSpace[]>(
      `select ${SPACE_COLUMNS} from practice.care_spaces where id in (${marks(unique.length)}) order by id for update`,
      unique,
    );
    return new Map(rows.map((row) => [row.id, this.toSpace(row)]));
  }

  /** Espacio sin bloquear. */
  async findSpace(tx: EntityManager, id: string): Promise<AdtSpaceRow | null> {
    const rows = await tx.execute<RawSpace[]>(
      `select ${SPACE_COLUMNS} from practice.care_spaces where id = ?`,
      [id],
    );
    return rows[0] ? this.toSpace(rows[0]) : null;
  }

  private toSpace(row: RawSpace): AdtSpaceRow {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      practiceSiteId: row.practice_site_id,
      clinicalUnitId: row.clinical_unit_id,
      parentSpaceId: row.parent_space_id,
      formConceptId: row.form_concept_id,
      functionConceptId: row.space_type_concept_id,
      statusConceptId: row.status_concept_id,
      bedCategoryConceptId: row.bed_category_concept_id,
      attributes: {
        sexRestriction: row.sex_restriction_concept_id,
        ageGroup: row.age_group_concept_id,
        pressure: row.pressure_concept_id,
        hvacValidatedOn: dayOf(row.hvac_validated_on),
      },
    };
  }

  /** Unidad vigente de una cama a un instante: préstamo > propietaria > unidad directa del espacio. */
  async effectiveUnit(
    tx: EntityManager,
    careSpaceId: string,
    at: Date,
  ): Promise<string | null> {
    const rows = await tx.execute<{ unit: string | null }[]>(
      `select coalesce(
                (select a.clinical_unit_id from practice.space_unit_assignments a
                  where a.care_space_id = cs.id and a.role_concept_id = ?
                    and a.valid_from <= ? and (a.valid_to is null or a.valid_to > ?)
                  order by a.valid_from desc limit 1),
                (select a.clinical_unit_id from practice.space_unit_assignments a
                  where a.care_space_id = cs.id and a.role_concept_id = ?
                    and a.valid_from <= ? and (a.valid_to is null or a.valid_to > ?)
                  order by a.valid_from desc limit 1),
                cs.clinical_unit_id) as unit
         from practice.care_spaces cs where cs.id = ?`,
      [
        PRAC.SPACE_UNIT_ROLE_LOAN,
        at,
        at,
        PRAC.SPACE_UNIT_ROLE_OWNER,
        at,
        at,
        careSpaceId,
      ],
    );
    return rows[0]?.unit ?? null;
  }

  /** Atributos de la habitación (padre `ROOM`) de una cama, o `null`. */
  async roomOf(
    tx: EntityManager,
    bed: AdtSpaceRow,
  ): Promise<AdtSpaceRow | null> {
    if (!bed.parentSpaceId) return null;
    const parent = await this.findSpace(tx, bed.parentSpaceId);
    return parent && parent.formConceptId === PRAC.LOC_FORM_ROOM
      ? parent
      : null;
  }

  /** Sexo administrativo y nacimiento del paciente. */
  async patientFacts(
    tx: EntityManager,
    patientProfileId: string,
  ): Promise<{
    gender: AdministrativeGender;
    birthDate: string | null;
  } | null> {
    const rows = await tx.execute<
      {
        gender: string | null;
        birth_date: Date | string | null;
      }[]
    >(
      `select p.administrative_gender_concept_id as gender, p.birth_date
         from profiles.patient_profiles pp
         join profiles.persons p on p.id = pp.profile_id
        where pp.profile_id = ?`,
      [patientProfileId],
    );
    if (rows.length === 0) return null;
    return {
      gender: genderOf(rows[0].gender),
      birthDate: dayOf(rows[0].birth_date),
    };
  }

  /** Otros pacientes con cama activa en las camas de una habitación. */
  async roomOccupants(
    tx: EntityManager,
    roomId: string,
    excludeEncounterIds: readonly string[],
  ): Promise<RoomOccupant[]> {
    const rows = await tx.execute<
      {
        encounter_id: string;
        gender: string | null;
        isolation: string | null;
        organism: string | null;
      }[]
    >(
      `select el.encounter_id, p.administrative_gender_concept_id as gender,
              e.isolation_precaution_concept_id as isolation,
              e.isolation_organism_text as organism
         from clinical.encounter_locations el
         join practice.care_spaces bed on bed.id = el.care_space_id
         join clinical.encounters e on e.id = el.encounter_id
         left join profiles.persons p on p.id = e.patient_profile_id
        where bed.parent_space_id = ? and el.is_bed_assignment
          and el.location_status_concept_id = ?
          and el.period_end is null
          and el.encounter_id not in (${marks(excludeEncounterIds.length)})`,
      [roomId, CLIN.LOCATION_ACTIVE, ...excludeEncounterIds],
    );
    return rows.map((row) => ({
      encounterId: row.encounter_id,
      gender: genderOf(row.gender),
      isolationCode: isolationCodeOf(row.isolation),
      isolationOrganism: row.organism,
    }));
  }

  /** La cama activa del encuentro (con bloqueo opcional). */
  async currentBed(
    tx: EntityManager,
    encounterId: string,
    forUpdate = false,
  ): Promise<AdtLocationRow | null> {
    const rows = await tx.execute<RawLocation[]>(
      `select ${LOCATION_COLUMNS} from clinical.encounter_locations el
        where el.encounter_id = ? and el.is_bed_assignment and el.location_status_concept_id = ?
          and el.period_end is null
        order by el.period_start desc limit 1 ${forUpdate ? 'for update' : ''}`,
      [encounterId, CLIN.LOCATION_ACTIVE],
    );
    return rows[0] ? toLocation(rows[0]) : null;
  }

  /** Reservas vigentes del encuentro. */
  async reservations(
    tx: EntityManager,
    encounterId: string,
  ): Promise<AdtLocationRow[]> {
    const rows = await tx.execute<RawLocation[]>(
      `select ${LOCATION_COLUMNS} from clinical.encounter_locations el
        where el.encounter_id = ? and el.is_bed_assignment and el.location_status_concept_id = ?
        order by el.period_start for update`,
      [encounterId, CLIN.LOCATION_RESERVED],
    );
    return rows.map(toLocation);
  }

  /** La ubicación «sin cama» vigente del encuentro (la sede donde espera cama). */
  async currentSiteLocation(
    tx: EntityManager,
    encounterId: string,
  ): Promise<AdtLocationRow | null> {
    const rows = await tx.execute<RawLocation[]>(
      `select ${LOCATION_COLUMNS} from clinical.encounter_locations el
        where el.encounter_id = ? and not el.is_bed_assignment and el.location_status_concept_id = ?
          and el.period_end is null
        order by el.period_start desc limit 1 for update`,
      [encounterId, CLIN.LOCATION_ACTIVE],
    );
    return rows[0] ? toLocation(rows[0]) : null;
  }

  /** Cualquier ubicación del encuentro (la más reciente), para resolver su sede. */
  async anyLocation(
    tx: EntityManager,
    encounterId: string,
  ): Promise<AdtLocationRow | null> {
    const rows = await tx.execute<RawLocation[]>(
      `select ${LOCATION_COLUMNS} from clinical.encounter_locations el
        where el.encounter_id = ?
        order by el.period_start desc nulls last, el.created_at desc limit 1`,
      [encounterId],
    );
    return rows[0] ? toLocation(rows[0]) : null;
  }

  /** Ubicación por id (con bloqueo opcional). */
  async findLocation(
    tx: EntityManager,
    id: string,
    forUpdate = false,
  ): Promise<AdtLocationRow | null> {
    const rows = await tx.execute<RawLocation[]>(
      `select ${LOCATION_COLUMNS} from clinical.encounter_locations el
        where el.id = ? ${forUpdate ? 'for update' : ''}`,
      [id],
    );
    return rows[0] ? toLocation(rows[0]) : null;
  }

  /** Todas las ubicaciones del encuentro, de la más antigua a la más reciente. */
  async movements(
    tx: EntityManager,
    encounterId: string,
  ): Promise<AdtLocationRow[]> {
    const rows = await tx.execute<RawLocation[]>(
      `select ${LOCATION_COLUMNS} from clinical.encounter_locations el
        where el.encounter_id = ?
        order by el.period_start nulls last, el.created_at`,
      [encounterId],
    );
    return rows.map(toLocation);
  }

  /**
   * ¿Alguien más tiene la cama desde `since` en adelante? Ocupantes activos,
   * reservas o estancias completadas que se superpongan con `[since, ∞)`.
   */
  async otherClaimOnBed(
    tx: EntityManager,
    careSpaceId: string,
    since: Date,
    exceptLocationIds: readonly string[],
  ): Promise<boolean> {
    const rows = await tx.execute<{ n: number }[]>(
      `select count(*)::int as n from clinical.encounter_locations el
        where el.care_space_id = ? and el.is_bed_assignment
          and el.location_status_concept_id in (?, ?, ?)
          and (el.period_end is null or el.period_end > ?)
          and el.id not in (${marks(exceptLocationIds.length)})`,
      [
        careSpaceId,
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_RESERVED,
        CLIN.LOCATION_COMPLETED,
        since,
        ...exceptLocationIds,
      ],
    );
    return (rows[0]?.n ?? 0) > 0;
  }

  /** Inserta una ubicación y la devuelve. */
  async insertLocation(
    tx: EntityManager,
    data: NewLocation,
  ): Promise<AdtLocationRow> {
    const id = data.id ?? randomUUID();
    const now = new Date();
    await tx.execute(
      `insert into clinical.encounter_locations
         (id, encounter_id, tenant_id, practice_site_id, clinical_unit_id, care_space_id,
          location_status_concept_id, period_start, period_end, movement_type_concept_id,
          previous_encounter_location_id, bed_category_concept_id, placement_incident_id,
          created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        data.encounterId,
        data.tenantId,
        data.practiceSiteId,
        data.clinicalUnitId,
        data.careSpaceId,
        data.statusConceptId,
        data.periodStart,
        data.periodEnd ?? null,
        data.movementTypeConceptId,
        data.previousLocationId ?? null,
        data.bedCategoryConceptId ?? null,
        data.placementIncidentId ?? null,
        now,
        now,
        data.actorUserId,
        data.actorUserId,
      ],
    );
    const row = await this.findLocation(tx, id);
    return row!;
  }

  /**
   * Cierra (o cancela) una ubicación: fija estado, fin y motivo y avanza la versión.
   *
   * @param tx - Transacción.
   * @param id - Ubicación.
   * @param change - Estado nuevo, `period_end` y motivo del cierre.
   * @param actorUserId - Quien lo hace.
   */
  async closeLocation(
    tx: EntityManager,
    id: string,
    change: {
      statusConceptId: string;
      periodEnd: Date;
      endReasonConceptId: string | null;
    },
    actorUserId: string | null,
  ): Promise<void> {
    await tx.execute(
      `update clinical.encounter_locations
          set location_status_concept_id = ?,
              period_end = greatest(?::timestamptz, period_start),
              end_reason_concept_id = ?,
              updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
        where id = ?`,
      [
        change.statusConceptId,
        change.periodEnd,
        change.endReasonConceptId,
        new Date(),
        actorUserId,
        id,
      ],
    );
  }

  /** Reabre una ubicación cerrada por un traslado que se cancela (A12). */
  async reopenLocation(
    tx: EntityManager,
    id: string,
    actorUserId: string | null,
  ): Promise<void> {
    await tx.execute(
      `update clinical.encounter_locations
          set location_status_concept_id = ?, period_end = null, end_reason_concept_id = null,
              updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
        where id = ?`,
      [CLIN.LOCATION_ACTIVE, new Date(), actorUserId, id],
    );
  }

  /** Ata el incidente a la ubicación que forzó (la ubicación ya apunta al incidente). */
  async linkIncident(
    tx: EntityManager,
    incidentId: string,
    locationId: string,
  ): Promise<void> {
    await tx.execute(
      `update clinical.placement_incidents set encounter_location_id = ? where id = ?`,
      [locationId, incidentId],
    );
  }

  /** Avanza la versión del encuentro (token de concurrencia del ADT). */
  async bumpEncounter(
    tx: EntityManager,
    encounterId: string,
    actorUserId: string | null,
  ): Promise<number> {
    const rows = await tx.execute<{ row_version: number }[]>(
      `update clinical.encounters
          set row_version = row_version + 1, updated_at = ?, updated_by_user_id = ?
        where id = ? returning row_version`,
      [new Date(), actorUserId, encounterId],
    );
    return rows[0].row_version;
  }

  /** Foto de una ubicación para la historia (`data_snapshot`). */
  async snapshotLocation(
    tx: EntityManager,
    id: string,
  ): Promise<Record<string, unknown>> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      'select * from clinical.encounter_locations where id = ?',
      [id],
    );
    return rows[0] ?? {};
  }
}

/** Sexo administrativo del concepto de `profiles`. */
export function genderOf(conceptId: string | null): AdministrativeGender {
  if (conceptId === PROF.GENDER_MALE) return 'MALE';
  if (conceptId === PROF.GENDER_FEMALE) return 'FEMALE';
  return conceptId ? 'OTHER' : 'UNKNOWN';
}

/** `ISO_*` del concepto de precaución del encuentro, o `null`. */
export function isolationCodeOf(conceptId: string | null): string | null {
  if (!conceptId) return null;
  // Se resuelve contra la familia declarada; un id desconocido se trata como «con precaución».
  return ISOLATION_CODE_BY_ID.get(conceptId) ?? 'ISO_UNKNOWN';
}

const ISOLATION_CODE_BY_ID = new Map(
  ISOLATION_PRECAUTIONS.codes().map((code) => [
    ISOLATION_PRECAUTIONS.byInput(code)!.id,
    code,
  ]),
);
