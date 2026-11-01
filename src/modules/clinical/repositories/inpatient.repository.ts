import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CLIN } from '../clinical.concepts';
import { PRAC } from '../../practice/practice.concepts';
import { PROF } from '../../profiles/profiles.concepts';

/** Cama con su habitación (lo que la compatibilidad necesita). */
export interface BedContextRow {
  id: string;
  tenant_id: string;
  practice_site_id: string;
  form_concept_id: string | null;
  space_type_concept_id: string;
  sex_restriction_concept_id: string | null;
  age_group_concept_id: string | null;
  bed_category_concept_id: string | null;
  room_id: string | null;
  room_form_concept_id: string | null;
  room_function_concept_id: string | null;
  room_sex_restriction_concept_id: string | null;
  room_age_group_concept_id: string | null;
  owner_unit_id: string | null;
}

/** Compañero de habitación. */
export interface RoommateRow {
  encounter_id: string;
  gender_id: string | null;
  isolation_id: string | null;
  organism: string | null;
}

/** Tramo de estancia para el censo. */
export interface SegmentRow {
  id: string;
  encounter_id: string;
  patient_profile_id: string;
  care_space_id: string;
  bed_category_concept_id: string | null;
  unit_id: string | null;
  period_start: Date | string;
  period_end: Date | string | null;
  movement_id: string | null;
  end_reason_id: string | null;
  prev_unit_id: string | null;
  next_unit_id: string | null;
  admitted_at: Date | string;
  disposition_id: string | null;
}

/**
 * Lecturas de internación (F3). SQL parametrizado sobre `practice` y
 * `profiles` porque `clinical` no los importa como módulos (la cama y el
 * paciente se leen, nunca se escriben acá). `em.execute` corre en la
 * transacción y con el tenant del llamador.
 */
@Injectable()
export class InpatientRepository {
  /** Sexo administrativo y nacimiento del paciente. */
  async patient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<{ sex: 'M' | 'F' | 'O' | null; birthDate: Date | null } | null> {
    const rows = await em.execute<
      { gender_id: string | null; birth_date: Date | string | null }[]
    >(
      `SELECT p.administrative_gender_concept_id AS gender_id, p.birth_date
         FROM profiles.patient_profiles pp
         JOIN profiles.person_profiles pr ON pr.id = pp.profile_id
         JOIN profiles.persons p ON p.id = pr.person_id
        WHERE pp.profile_id = ?`,
      [patientProfileId],
      'all',
    );
    if (rows.length === 0) return null;
    return {
      sex: sexOf(rows[0].gender_id),
      birthDate: rows[0].birth_date ? new Date(rows[0].birth_date) : null,
    };
  }

  /** La cama, su habitación padre y la unidad dueña vigente. */
  async bedContext(
    em: EntityManager,
    careSpaceId: string,
  ): Promise<BedContextRow | null> {
    const rows = await em.execute<BedContextRow[]>(
      `SELECT b.id, b.tenant_id, b.practice_site_id, b.form_concept_id, b.space_type_concept_id,
              b.sex_restriction_concept_id, b.age_group_concept_id, b.bed_category_concept_id,
              r.id AS room_id, r.form_concept_id AS room_form_concept_id,
              r.space_type_concept_id AS room_function_concept_id,
              r.sex_restriction_concept_id AS room_sex_restriction_concept_id,
              r.age_group_concept_id AS room_age_group_concept_id,
              coalesce((SELECT a.clinical_unit_id FROM practice.space_unit_assignments a
                         WHERE a.care_space_id = b.id AND a.role_concept_id = ?
                           AND a.valid_from <= now() AND (a.valid_to IS NULL OR a.valid_to > now())
                         LIMIT 1), b.clinical_unit_id) AS owner_unit_id
         FROM practice.care_spaces b
         LEFT JOIN practice.care_spaces r ON r.id = b.parent_space_id
        WHERE b.id = ?`,
      [PRAC.SPACE_UNIT_ROLE_OWNER, careSpaceId],
      'all',
    );
    return rows[0] ?? null;
  }

  /** Pacientes en las otras camas de la habitación. */
  roommates(
    em: EntityManager,
    roomId: string,
    excludeBedId: string,
    excludeEncounterIds: readonly string[],
  ): Promise<RoommateRow[]> {
    return em.execute<RoommateRow[]>(
      `SELECT l.encounter_id, p.administrative_gender_concept_id AS gender_id,
              e.isolation_precaution_concept_id AS isolation_id, e.isolation_organism_text AS organism
         FROM clinical.encounter_locations l
         JOIN practice.care_spaces b ON b.id = l.care_space_id
         JOIN clinical.encounters e ON e.id = l.encounter_id
         LEFT JOIN profiles.patient_profiles pp ON pp.profile_id = e.patient_profile_id
         LEFT JOIN profiles.person_profiles pr ON pr.id = pp.profile_id
         LEFT JOIN profiles.persons p ON p.id = pr.person_id
        WHERE b.parent_space_id = ? AND b.id <> ? AND l.is_bed_assignment
          AND l.location_status_concept_id = ? AND l.period_end IS NULL
          AND NOT (l.encounter_id = ANY(?::uuid[]))`,
      [
        roomId,
        excludeBedId,
        CLIN.LOCATION_ACTIVE,
        `{${excludeEncounterIds.join(',')}}`,
      ],
      'all',
    );
  }

  /** ¿El paciente ya tiene una internación en curso en el tenant? */
  async inpatientInProgress(
    em: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<string | null> {
    const rows = await em.execute<{ id: string }[]>(
      `SELECT id FROM clinical.encounters
        WHERE patient_profile_id = ? AND tenant_id = ? AND class_concept_id = ? AND status_concept_id = ?
        LIMIT 1`,
      [
        patientProfileId,
        tenantId,
        CLIN.ENCOUNTER_CLASS_INPATIENT,
        CLIN.ENCOUNTER_IN_PROGRESS,
      ],
      'all',
    );
    return rows[0]?.id ?? null;
  }

  /** Camas censables y disponibles por unidad dueña, de una sede. */
  bedsByUnit(
    em: EntityManager,
    siteId: string,
  ): Promise<
    { unit_id: string | null; censable: number; available: number }[]
  > {
    return em.execute(
      `SELECT coalesce(a.clinical_unit_id, b.clinical_unit_id) AS unit_id,
              count(*)::int AS censable,
              count(*) FILTER (WHERE coalesce(b.operational_status_concept_id, ?) = ?)::int AS available
         FROM practice.care_spaces b
         LEFT JOIN practice.space_unit_assignments a
           ON a.care_space_id = b.id AND a.role_concept_id = ?
          AND a.valid_from <= now() AND (a.valid_to IS NULL OR a.valid_to > now())
        WHERE b.practice_site_id = ? AND b.form_concept_id = ? AND b.censable
          AND b.status_concept_id = ?
        GROUP BY 1`,
      [
        PRAC.SPACE_OP_AVAILABLE,
        PRAC.SPACE_OP_AVAILABLE,
        PRAC.SPACE_UNIT_ROLE_OWNER,
        siteId,
        PRAC.LOC_FORM_BED,
        PRAC.SPACE_ACTIVE,
      ],
      'all',
    );
  }

  /** Tramos de cama de la sede que tocan `[from, to]`. */
  segments(
    em: EntityManager,
    siteId: string,
    from: Date,
    to: Date,
  ): Promise<SegmentRow[]> {
    return em.execute<SegmentRow[]>(
      `SELECT l.id, l.encounter_id, e.patient_profile_id, l.care_space_id, l.bed_category_concept_id,
              coalesce(a.clinical_unit_id, b.clinical_unit_id) AS unit_id,
              l.period_start, l.period_end, l.movement_type_concept_id AS movement_id,
              l.end_reason_concept_id AS end_reason_id,
              (SELECT coalesce(pa.clinical_unit_id, pb.clinical_unit_id)
                 FROM clinical.encounter_locations pl
                 JOIN practice.care_spaces pb ON pb.id = pl.care_space_id
                 LEFT JOIN practice.space_unit_assignments pa ON pa.care_space_id = pb.id AND pa.role_concept_id = ?
                     AND pa.valid_to IS NULL
                WHERE pl.id = l.previous_encounter_location_id LIMIT 1) AS prev_unit_id,
              (SELECT coalesce(na.clinical_unit_id, nb.clinical_unit_id)
                 FROM clinical.encounter_locations nl
                 JOIN practice.care_spaces nb ON nb.id = nl.care_space_id
                 LEFT JOIN practice.space_unit_assignments na ON na.care_space_id = nb.id AND na.role_concept_id = ?
                     AND na.valid_to IS NULL
                WHERE nl.previous_encounter_location_id = l.id
                  AND nl.location_status_concept_id IN (?, ?) LIMIT 1) AS next_unit_id,
              coalesce(e.start_at, l.period_start) AS admitted_at,
              e.discharge_disposition_concept_id AS disposition_id
         FROM clinical.encounter_locations l
         JOIN clinical.encounters e ON e.id = l.encounter_id
         JOIN practice.care_spaces b ON b.id = l.care_space_id
         LEFT JOIN practice.space_unit_assignments a ON a.care_space_id = b.id AND a.role_concept_id = ?
              AND a.valid_to IS NULL
        WHERE b.practice_site_id = ? AND l.is_bed_assignment
          AND l.location_status_concept_id IN (?, ?)
          AND l.period_start <= ? AND (l.period_end IS NULL OR l.period_end >= ?)`,
      [
        PRAC.SPACE_UNIT_ROLE_OWNER,
        PRAC.SPACE_UNIT_ROLE_OWNER,
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_COMPLETED,
        PRAC.SPACE_UNIT_ROLE_OWNER,
        siteId,
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_COMPLETED,
        to,
        from,
      ],
      'all',
    );
  }

  /** Tiempos de las órdenes de limpieza por egreso de la sede en el rango. */
  turnarounds(
    em: EntityManager,
    siteId: string,
    from: Date,
    to: Date,
  ): Promise<
    {
      requested_at: string;
      started_at: string | null;
      finished_at: string | null;
      inspected_at: string | null;
    }[]
  > {
    return em.execute(
      `SELECT requested_at, started_at, finished_at, inspected_at FROM practice.cleaning_orders
        WHERE practice_site_id = ? AND trigger_concept_id = ? AND requested_at >= ? AND requested_at < ?
          AND finished_at IS NOT NULL`,
      [siteId, PRAC.CLN_TRG_DISCHARGE, from, to],
      'all',
    );
  }

  /** Sedes con camas censables (para el tick del censo). */
  sitesWithBeds(em: EntityManager): Promise<
    {
      id: string;
      tenant_id: string;
      time_zone: string | null;
      practice_id: string;
    }[]
  > {
    return em.execute(
      `SELECT DISTINCT s.id, s.tenant_id, s.time_zone, s.practice_id FROM practice.practice_sites s
         JOIN practice.care_spaces b ON b.practice_site_id = s.id AND b.form_concept_id = ? AND b.censable`,
      [PRAC.LOC_FORM_BED],
      'all',
    );
  }
}

/** Sexo administrativo → `M|F|O`. */
export function sexOf(
  genderId: string | null | undefined,
): 'M' | 'F' | 'O' | null {
  if (!genderId) return null;
  if (genderId === PROF.GENDER_MALE) return 'M';
  if (genderId === PROF.GENDER_FEMALE) return 'F';
  return 'O';
}
