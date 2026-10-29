import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import { CLIN } from '../clinical.concepts';
import {
  ADMISSION_SOURCES,
  DISCHARGE_DISPOSITIONS,
  ISOLATION_PRECAUTIONS,
  LEVELS_OF_CARE,
} from '../domain/adt-catalog';
import { stayDays } from '../domain/census-calculation';
import type { InpatientsQueryDto } from '../dto/adt.dto';
import { INFRA_F3_ACTIONS } from '../policies/infra-f3.policy';
import { AdtRepository } from '../repositories/adt.repository';
import { AdtAccessService } from './adt-access.service';

/** Código legible de un concepto de `clinical` por su id (la clave declarada). */
const CLIN_KEY_BY_ID: ReadonlyMap<string, string> = new Map(
  Object.entries(CLIN).map(([key, id]) => [id, key]),
);

/** Código de un concepto de `clinical`, o `null`. */
export const clinCode = (id: string | null | undefined): string | null =>
  id ? (CLIN_KEY_BY_ID.get(id) ?? null) : null;

/** Una fila de la lista de internados. */
export interface InpatientRow {
  encounterId: string;
  patient: {
    profileId: string;
    displayName: string | null;
    initials: string;
    administrativeGender: string | null;
    birthDate: string | null;
  };
  bed: {
    careSpaceId: string;
    code: string;
    name: string;
    room: { id: string; code: string; name: string } | null;
    encounterLocationId: string;
  } | null;
  since: string | null;
  levelOfCare: string | null;
  isolation: { code: string | null; organism: string | null };
  expectedDischargeAt: string | null;
  losDays: number;
  rowVersion: number;
}

/** Iniciales (máximo dos) a partir del nombre para mostrar. */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** Lecturas de la internación: censo vivo y ficha de estancia. */
@Injectable()
export class InpatientReadService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - SQL de la internación.
   * @param access - Política de F3.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AdtRepository,
    private readonly access: AdtAccessService,
  ) {}

  /**
   * `GET /sites/:siteId/inpatients`: los pacientes internados hoy, con su cama.
   *
   * @param siteId - Establecimiento.
   * @param query - Unidad, cursor y tamaño de página.
   * @param actor - Quien consulta (Enfermería o Admisión: lleva datos de paciente).
   */
  async inpatients(
    siteId: string,
    query: InpatientsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<{
    items: InpatientRow[];
    nextCursor: string | null;
    generatedAt: string;
  }> {
    return this.em.transactional(async (tx) => {
      const scope = await this.access.forSite(tx, siteId, actor);
      this.access.assertCan(scope, INFRA_F3_ACTIONS.INPATIENT_VIEW);
      if (query.unitId) {
        const unit = await tx.execute<{ id: string }[]>(
          'select id from practice.clinical_units where id = ? and tenant_id = ? and practice_site_id = ?',
          [query.unitId, scope.tenantId, siteId],
        );
        if (unit.length === 0) throw this.notFound();
      }
      const limit = query.limit ?? 50;
      const cursor = this.decodeCursor(query.cursor);
      const timeZone = await this.timeZone(tx, siteId);
      const params: unknown[] = [
        scope.tenantId,
        siteId,
        CLIN.ENCOUNTER_CLASS_INPATIENT,
        CLIN.ENCOUNTER_IN_PROGRESS,
        CLIN.LOCATION_ACTIVE,
      ];
      let unitFilter = '';
      if (query.unitId) {
        unitFilter = 'and bl.clinical_unit_id = ?';
        params.push(query.unitId);
      }
      let cursorFilter = '';
      if (cursor) {
        cursorFilter = 'and (e.start_at, e.id) > (?::timestamptz, ?::uuid)';
        params.push(cursor.startAt, cursor.id);
      }
      params.push(limit + 1);
      const rows = await tx.execute<
        {
          encounter_id: string;
          start_at: Date | null;
          patient_profile_id: string;
          display_name: string | null;
          gender: string | null;
          birth_date: Date | string | null;
          level: string | null;
          isolation: string | null;
          organism: string | null;
          expected: Date | null;
          row_version: number;
          loc_id: string | null;
          bed_id: string | null;
          bed_code: string | null;
          bed_name: string | null;
          room_id: string | null;
          room_code: string | null;
          room_name: string | null;
          since: Date | null;
        }[]
      >(
        `select e.id as encounter_id, e.start_at, e.patient_profile_id, p.display_name,
                p.administrative_gender_concept_id as gender, p.birth_date,
                e.level_of_care_concept_id as level, e.isolation_precaution_concept_id as isolation,
                e.isolation_organism_text as organism, e.expected_discharge_at as expected,
                e.row_version,
                bl.id as loc_id, bed.id as bed_id, bed.code as bed_code, bed.name as bed_name,
                room.id as room_id, room.code as room_code, room.name as room_name,
                bl.period_start as since
           from clinical.encounters e
           left join profiles.persons p on p.id = e.patient_profile_id
           left join clinical.encounter_locations bl
                  on bl.encounter_id = e.id and bl.is_bed_assignment
                 and bl.location_status_concept_id = ? and bl.period_end is null
           left join practice.care_spaces bed on bed.id = bl.care_space_id
           left join practice.care_spaces room on room.id = bed.parent_space_id
          where e.tenant_id = ? and e.class_concept_id = ? and e.status_concept_id = ?
            and exists (select 1 from clinical.encounter_locations x
                         where x.encounter_id = e.id and x.practice_site_id = ?)
            ${unitFilter} ${cursorFilter}
          order by e.start_at, e.id
          limit ?`,
        [
          CLIN.LOCATION_ACTIVE,
          scope.tenantId,
          CLIN.ENCOUNTER_CLASS_INPATIENT,
          CLIN.ENCOUNTER_IN_PROGRESS,
          siteId,
          ...params.slice(5),
        ],
      );
      const now = new Date();
      const page = rows.slice(0, limit);
      const items: InpatientRow[] = page.map((row) => ({
        encounterId: row.encounter_id,
        patient: {
          profileId: row.patient_profile_id,
          displayName: row.display_name,
          initials: initialsOf(row.display_name),
          administrativeGender: row.gender,
          birthDate: row.birth_date
            ? new Date(row.birth_date).toISOString().slice(0, 10)
            : null,
        },
        bed: row.bed_id
          ? {
              careSpaceId: row.bed_id,
              code: row.bed_code!,
              name: row.bed_name!,
              room: row.room_id
                ? {
                    id: row.room_id,
                    code: row.room_code!,
                    name: row.room_name!,
                  }
                : null,
              encounterLocationId: row.loc_id!,
            }
          : null,
        since: row.since ? new Date(row.since).toISOString() : null,
        levelOfCare: LEVELS_OF_CARE.byConceptId(row.level)?.code ?? null,
        isolation: {
          code: ISOLATION_PRECAUTIONS.byConceptId(row.isolation)?.code ?? null,
          organism: row.organism,
        },
        expectedDischargeAt: row.expected
          ? new Date(row.expected).toISOString()
          : null,
        losDays: row.start_at
          ? stayDays(new Date(row.start_at), now, timeZone)
          : 1,
        rowVersion: row.row_version,
      }));
      const last = page[page.length - 1];
      return {
        items,
        nextCursor:
          rows.length > limit && last
            ? this.encodeCursor(new Date(last.start_at!), last.encounter_id)
            : null,
        generatedAt: now.toISOString(),
      };
    });
  }

  /**
   * `GET /clinical/encounters/:id/stay`: la ficha de internación —encuentro,
   * todos sus movimientos y los incidentes de colocación—.
   *
   * @param encounterId - Encuentro.
   * @param actor - Quien consulta.
   */
  async stay(encounterId: string, actor: AuthenticatedUser) {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const encounter = await this.repo.findEncounter(tx, encounterId);
      if (!encounter || encounter.tenantId !== tenantId) throw this.notFound();
      const last = await this.repo.anyLocation(tx, encounterId);
      if (!last) throw this.notFound();
      const scope = last.careSpaceId
        ? await this.access.forSpace(tx, last.careSpaceId, actor)
        : await this.access.forSite(tx, last.practiceSiteId, actor);
      this.access.assertCan(scope, INFRA_F3_ACTIONS.INPATIENT_VIEW);

      const [header] = await tx.execute<
        {
          end_at: Date | null;
          admission_source: string | null;
          disposition: string | null;
          expected: Date | null;
          display_name: string | null;
          gender: string | null;
          birth_date: Date | string | null;
          reason_text: string | null;
        }[]
      >(
        `select e.end_at, e.admission_source_concept_id as admission_source,
                e.discharge_disposition_concept_id as disposition,
                e.expected_discharge_at as expected, p.display_name,
                p.administrative_gender_concept_id as gender, p.birth_date, e.reason_text
           from clinical.encounters e
           left join profiles.persons p on p.id = e.patient_profile_id
          where e.id = ?`,
        [encounterId],
      );
      const movements = await tx.execute<
        {
          id: string;
          care_space_id: string | null;
          code: string | null;
          name: string | null;
          status: string;
          movement: string | null;
          period_start: Date | null;
          period_end: Date | null;
          end_reason: string | null;
          previous: string | null;
          incident: string | null;
          category: string | null;
        }[]
      >(
        `select el.id, el.care_space_id, cs.code, cs.name, el.location_status_concept_id as status,
                el.movement_type_concept_id as movement, el.period_start, el.period_end,
                el.end_reason_concept_id as end_reason, el.previous_encounter_location_id as previous,
                el.placement_incident_id as incident, el.bed_category_concept_id as category
           from clinical.encounter_locations el
           left join practice.care_spaces cs on cs.id = el.care_space_id
          where el.encounter_id = ?
          order by el.period_start nulls last, el.created_at`,
        [encounterId],
      );
      const incidents = await tx.execute<
        {
          id: string;
          care_space_id: string;
          encounter_location_id: string | null;
          violations_json: unknown;
          justification_text: string;
          status: string;
          authorized_by_user_id: string;
          reviewed_by_user_id: string | null;
          reviewed_at: Date | null;
          review_note: string | null;
          created_at: Date;
        }[]
      >(
        `select id, care_space_id, encounter_location_id, violations_json, justification_text,
                status_concept_id as status, authorized_by_user_id, reviewed_by_user_id,
                reviewed_at, review_note, created_at
           from clinical.placement_incidents where encounter_id = ? order by created_at`,
        [encounterId],
      );
      return {
        encounter: {
          id: encounter.id,
          patientProfileId: encounter.patientProfileId,
          patient: {
            displayName: header?.display_name ?? null,
            initials: initialsOf(header?.display_name),
            administrativeGender: header?.gender ?? null,
            birthDate: header?.birth_date
              ? new Date(header.birth_date).toISOString().slice(0, 10)
              : null,
          },
          episodeId: encounter.episodeId,
          status: clinCode(encounter.statusConceptId),
          startAt: encounter.startAt?.toISOString() ?? null,
          endAt: header?.end_at ? new Date(header.end_at).toISOString() : null,
          reasonText: header?.reason_text ?? null,
          levelOfCare:
            LEVELS_OF_CARE.byConceptId(encounter.levelOfCareConceptId)?.code ??
            null,
          admissionSource:
            ADMISSION_SOURCES.byConceptId(header?.admission_source)?.code ??
            null,
          dischargeDisposition:
            DISCHARGE_DISPOSITIONS.byConceptId(header?.disposition)?.code ??
            null,
          isolation: {
            code:
              ISOLATION_PRECAUTIONS.byConceptId(
                encounter.isolationPrecautionConceptId,
              )?.code ?? null,
            organism: encounter.isolationOrganismText,
          },
          expectedDischargeAt: header?.expected
            ? new Date(header.expected).toISOString()
            : null,
          rowVersion: encounter.rowVersion,
        },
        movements: movements.map((row) => ({
          id: row.id,
          careSpaceId: row.care_space_id,
          careSpaceCode: row.code,
          careSpaceName: row.name,
          status: clinCode(row.status),
          movement: clinCode(row.movement),
          startsAt: row.period_start
            ? new Date(row.period_start).toISOString()
            : null,
          endsAt: row.period_end
            ? new Date(row.period_end).toISOString()
            : null,
          endReason: clinCode(row.end_reason),
          previousEncounterLocationId: row.previous,
          placementIncidentId: row.incident,
          bedCategoryConceptId: row.category,
        })),
        incidents: incidents.map((row) => ({
          id: row.id,
          careSpaceId: row.care_space_id,
          encounterLocationId: row.encounter_location_id,
          violations: row.violations_json,
          justification: row.justification_text,
          status: clinCode(row.status),
          authorizedByUserId: row.authorized_by_user_id,
          reviewedByUserId: row.reviewed_by_user_id,
          reviewedAt: row.reviewed_at
            ? new Date(row.reviewed_at).toISOString()
            : null,
          reviewNote: row.review_note,
          createdAt: new Date(row.created_at).toISOString(),
        })),
      };
    });
  }

  private async timeZone(tx: EntityManager, siteId: string): Promise<string> {
    const rows = await tx.execute<{ tz: string | null }[]>(
      `select coalesce(s.time_zone, p.time_zone, 'UTC') as tz
         from practice.practice_sites s join practice.practices p on p.id = s.practice_id
        where s.id = ?`,
      [siteId],
    );
    return rows[0]?.tz ?? 'UTC';
  }

  private encodeCursor(startAt: Date, id: string): string {
    return Buffer.from(
      JSON.stringify({ startAt: startAt.toISOString(), id }),
    ).toString('base64url');
  }

  private decodeCursor(
    raw: string | undefined,
  ): { startAt: string; id: string } | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(
        Buffer.from(raw, 'base64url').toString('utf8'),
      ) as {
        startAt?: unknown;
        id?: unknown;
      };
      if (
        typeof parsed.startAt === 'string' &&
        typeof parsed.id === 'string' &&
        !Number.isNaN(Date.parse(parsed.startAt))
      ) {
        return { startAt: parsed.startAt, id: parsed.id };
      }
    } catch {
      // cae al error de abajo
    }
    throw new PreconditionFailedException(
      'El cursor no es válido',
      undefined,
      ClinicalErrorReason.ADT_CODE_INVALID,
    );
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Recurso no encontrado',
      undefined,
      ClinicalErrorReason.ADT_RESOURCE_OUT_OF_SCOPE,
    );
  }
}
