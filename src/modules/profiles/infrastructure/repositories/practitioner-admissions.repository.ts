import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy } from '../../../../common';
import { isoTimestampSql } from '../../../../common/pagination/iso-timestamp-sql';
import {
  PractitionerAdmissions,
  PractitionerAdmissionEvents,
} from '../../entities';
import {
  ADMISSION_STATUS_CONCEPT,
  type AdmissionStatusCode,
} from '../../domain/admissions/admission-status';
import { todayLaPaz } from '../../domain/admissions/business-days';

/** Datos para abrir una admisión. */
export interface CreateAdmissionData {
  readonly practitionerProfileId: string;
  readonly admissionTypeConceptId: string;
  readonly statusConceptId: string;
  readonly submittedAt: Date;
  readonly dueAt: Date;
  readonly submittedSnapshot?: Record<string, unknown>;
  readonly attestedAt?: Date;
  readonly attestationTextVersion?: string;
  readonly validUntil?: Date;
  readonly actorUserId?: string;
}

/** Filtros de la bandeja. */
export interface AdmissionListFilters {
  readonly typeConceptId?: string;
  readonly statusConceptId?: string;
  readonly assignedToUserId?: string;
  readonly unassigned?: boolean;
  readonly overdue?: boolean;
  /** Perfil que NO debe aparecer: el del propio llamador (nadie ve su admisión en la bandeja). */
  readonly excludePractitionerProfileId?: string;
  /** Texto libre: nombre, cédula o matrícula. */
  readonly q?: string;
  readonly now: Date;
}

/** Una fila de la bandeja, tal como sale de la consulta. */
export interface AdmissionListRow {
  readonly id: string;
  readonly practitionerProfileId: string;
  readonly typeConceptId: string;
  readonly statusConceptId: string;
  readonly submittedAt: Date;
  readonly dueAt: Date;
  readonly dueAtIso: string;
  readonly assignedToUserId: string | null;
  readonly rowVersion: number;
  readonly fullName: string | null;
  readonly professionName: string | null;
  readonly professionalTitle: string | null;
  readonly nationalId: string | null;
}

/** Escapa los comodines de LIKE para que el texto buscado se lea literal. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

interface RawListRow {
  id: string;
  practitioner_profile_id: string;
  admission_type_concept_id: string;
  status_concept_id: string;
  submitted_at: Date | string;
  due_at: Date | string;
  due_at_iso: string;
  assigned_to_user_id: string | null;
  row_version: number | string;
  full_name: string | null;
  profession_name: string | null;
  professional_title: string | null;
  national_id: string | null;
}

/**
 * Acceso a datos de `profiles.practitioner_admissions` (v4.2.67): la solicitud
 * de admisión de un profesional.
 */
@Injectable()
export class PractitionerAdmissionsRepository {
  /** Crea la admisión. El llamador hace el flush. */
  create(em: EntityManager, data: CreateAdmissionData): PractitionerAdmissions {
    return em.create(
      PractitionerAdmissions,
      {
        practitionerProfileId: data.practitionerProfileId,
        admissionTypeConceptId: data.admissionTypeConceptId,
        statusConceptId: data.statusConceptId,
        submittedAt: data.submittedAt,
        dueAt: data.dueAt,
        resubmissionCount: 0,
        submittedSnapshot: data.submittedSnapshot,
        attestedAt: data.attestedAt,
        attestationTextVersion: data.attestationTextVersion,
        validUntil: data.validUntil,
        ...createdBy(data.actorUserId, data.submittedAt),
      },
      { partial: true },
    );
  }

  /** La admisión por id, sin bloquear. */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerAdmissions | null> {
    return em.findOne(PractitionerAdmissions, { id });
  }

  /** La admisión con la fila bloqueada: dos revisores no se pisan. */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerAdmissions | null> {
    return em.findOne(
      PractitionerAdmissions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** La admisión abierta (no retirada) del profesional para un tipo. */
  findOpenByPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
    admissionTypeConceptId: string,
  ): Promise<PractitionerAdmissions | null> {
    return em.findOne(PractitionerAdmissions, {
      practitionerProfileId,
      admissionTypeConceptId,
      closedAt: null,
    });
  }

  /** Igual que {@link findOpenByPractitioner}, con la fila bloqueada. */
  findOpenByPractitionerForUpdate(
    em: EntityManager,
    practitionerProfileId: string,
    admissionTypeConceptId: string,
  ): Promise<PractitionerAdmissions | null> {
    return em.findOne(
      PractitionerAdmissions,
      { practitionerProfileId, admissionTypeConceptId, closedAt: null },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * La admisión vigente de cada profesional, en una consulta: la abierta si la
   * hay y, si no, la más reciente. Lo que no vuelve en el mapa no tiene
   * admisión (padrón cargado).
   */
  async findCurrentByPractitioners(
    em: EntityManager,
    practitionerProfileIds: readonly string[],
  ): Promise<Map<string, PractitionerAdmissions>> {
    const result = new Map<string, PractitionerAdmissions>();
    if (practitionerProfileIds.length === 0) return result;
    const rows = await em.find(
      PractitionerAdmissions,
      { practitionerProfileId: { $in: [...practitionerProfileIds] } },
      { orderBy: { submittedAt: 'desc', id: 'asc' } },
    );
    for (const row of rows) {
      const current = result.get(row.practitionerProfileId);
      if (!current || (current.closedAt && !row.closedAt)) {
        result.set(row.practitionerProfileId, row);
      }
    }
    return result;
  }

  /** Admisiones VERIFICADAS cuya vigencia ya pasó (fin de día en La Paz). */
  findExpired(
    em: EntityManager,
    now: Date,
    limit: number,
  ): Promise<PractitionerAdmissions[]> {
    return em.find(
      PractitionerAdmissions,
      {
        statusConceptId: ADMISSION_STATUS_CONCEPT.VERIFICADA,
        validUntil: { $lt: new Date(`${todayLaPaz(now)}T00:00:00.000Z`) },
      },
      { orderBy: { validUntil: 'asc', id: 'asc' }, limit },
    );
  }

  /** Admisiones con información pedida cuyo plazo de respuesta venció. */
  findAbandoned(
    em: EntityManager,
    now: Date,
    limit: number,
  ): Promise<PractitionerAdmissions[]> {
    return em.find(
      PractitionerAdmissions,
      {
        statusConceptId: ADMISSION_STATUS_CONCEPT.INFORMACION_REQUERIDA,
        infoDueAt: { $lt: now },
      },
      { orderBy: { infoDueAt: 'asc', id: 'asc' }, limit },
    );
  }

  /** Cambia el estado y deja la marca de auditoría; el llamador hace el flush. */
  setStatus(
    admission: PractitionerAdmissions,
    status: AdmissionStatusCode,
    actorUserId: string | undefined,
    now: Date,
  ): void {
    admission.statusConceptId = ADMISSION_STATUS_CONCEPT[status];
    admission.updatedAt = now;
    admission.updatedByUserId = actorUserId;
  }

  /**
   * Una página de la bandeja, ordenada por vencimiento (`due_at`, `id`) con
   * paginación keyset.
   *
   * SQL a mano y no el `QueryBuilder` por tres razones: el orden y el cursor
   * necesitan el vencimiento con la precisión de microsegundos de Postgres, la
   * búsqueda cruza cuatro tablas (persona, identificadores, matrículas,
   * credenciales) y la bandeja se consulta todo el día.
   */
  async listPage(
    em: EntityManager,
    filters: AdmissionListFilters,
    after: { dueAtIso: string; id: string } | undefined,
    limit: number,
  ): Promise<AdmissionListRow[]> {
    const { where, params } = this.buildWhere(filters, true);
    const keyset = after
      ? ' AND (a.due_at, a.id) > (?::timestamptz, ?::uuid)'
      : '';
    const keysetParams = after ? [after.dueAtIso, after.id] : [];
    const sql = `
      SELECT a.id, a.practitioner_profile_id, a.admission_type_concept_id,
             a.status_concept_id, a.submitted_at, a.due_at,
             ${isoTimestampSql('a.due_at')} AS due_at_iso,
             a.assigned_to_user_id, a.row_version,
             ${NAME_SQL} AS full_name,
             (SELECT cc.display FROM profiles.professional_credentials pc
                JOIN terminology.catalog_concepts cc ON cc.id = pc.profession_concept_id
               WHERE pc.practitioner_profile_id = a.practitioner_profile_id
                 AND pc.profession_concept_id IS NOT NULL
               ORDER BY pc.created_at, pc.id LIMIT 1) AS profession_name,
             hp.professional_title,
             (SELECT i.value FROM common.identifiers i
               WHERE i.owner_id = p.id AND i.type_concept_id = ?
               ORDER BY i.created_at LIMIT 1) AS national_id
        FROM profiles.practitioner_admissions a
        JOIN profiles.persons p ON p.id = a.practitioner_profile_id
        JOIN profiles.health_practitioner_profiles hp
          ON hp.profile_id = a.practitioner_profile_id
       WHERE ${where}${keyset}
       ORDER BY a.due_at ASC, a.id ASC
       LIMIT ?`;
    const rows = await em.execute<RawListRow[]>(sql, [
      NATIONAL_ID_TYPE,
      ...params,
      ...keysetParams,
      limit,
    ]);
    return rows.map((row) => ({
      id: row.id,
      practitionerProfileId: row.practitioner_profile_id,
      typeConceptId: row.admission_type_concept_id,
      statusConceptId: row.status_concept_id,
      submittedAt: new Date(row.submitted_at),
      dueAt: new Date(row.due_at),
      dueAtIso: row.due_at_iso,
      assignedToUserId: row.assigned_to_user_id,
      rowVersion: Number(row.row_version),
      fullName: row.full_name,
      professionName: row.profession_name,
      professionalTitle: row.professional_title,
      nationalId: row.national_id,
    }));
  }

  /** Cantidad de admisiones por estado con los mismos filtros, sin el de estado. */
  async countByStatus(
    em: EntityManager,
    filters: AdmissionListFilters,
  ): Promise<Map<string, number>> {
    const { where, params } = this.buildWhere(
      { ...filters, statusConceptId: undefined },
      true,
    );
    const rows = await em.execute<{ status_concept_id: string; n: string }[]>(
      `SELECT a.status_concept_id, count(*) AS n
         FROM profiles.practitioner_admissions a
         JOIN profiles.persons p ON p.id = a.practitioner_profile_id
         JOIN profiles.health_practitioner_profiles hp
           ON hp.profile_id = a.practitioner_profile_id
        WHERE ${where}
        GROUP BY a.status_concept_id`,
      params,
    );
    return new Map(rows.map((r) => [r.status_concept_id, Number(r.n)]));
  }

  private buildWhere(
    filters: AdmissionListFilters,
    joinsPerson: boolean,
  ): { where: string; params: unknown[] } {
    void joinsPerson;
    const clauses: string[] = ['1 = 1'];
    const params: unknown[] = [];
    if (filters.typeConceptId) {
      clauses.push('a.admission_type_concept_id = ?');
      params.push(filters.typeConceptId);
    }
    if (filters.statusConceptId) {
      clauses.push('a.status_concept_id = ?');
      params.push(filters.statusConceptId);
    }
    if (filters.assignedToUserId) {
      clauses.push('a.assigned_to_user_id = ?');
      params.push(filters.assignedToUserId);
    }
    if (filters.unassigned) {
      clauses.push('a.assigned_to_user_id IS NULL');
    }
    if (filters.excludePractitionerProfileId) {
      clauses.push('a.practitioner_profile_id <> ?::uuid');
      params.push(filters.excludePractitionerProfileId);
    }
    if (filters.overdue) {
      // Vencida: pasó su plazo y la plataforma todavía le debe una respuesta.
      clauses.push(
        'a.due_at < ?::timestamptz AND a.status_concept_id IN (?, ?)',
      );
      params.push(
        filters.now.toISOString(),
        ADMISSION_STATUS_CONCEPT.ENVIADA,
        ADMISSION_STATUS_CONCEPT.EN_REVISION,
      );
    }
    if (filters.q) {
      const like = `%${escapeLike(filters.q.toLowerCase())}%`;
      clauses.push(`(
        lower(${NAME_SQL}) LIKE ? ESCAPE '\\'
        OR EXISTS (SELECT 1 FROM common.identifiers i
                    WHERE i.owner_id = p.id AND lower(i.value) LIKE ? ESCAPE '\\')
        OR EXISTS (SELECT 1 FROM profiles.jurisdiction_authorizations j
                    WHERE j.practitioner_profile_id = a.practitioner_profile_id
                      AND lower(j.license_number) LIKE ? ESCAPE '\\')
        OR EXISTS (SELECT 1 FROM profiles.professional_credentials c
                    WHERE c.practitioner_profile_id = a.practitioner_profile_id
                      AND lower(c.number) LIKE ? ESCAPE '\\')
      )`);
      params.push(like, like, like, like);
    }
    return { where: clauses.join(' AND '), params };
  }
}

/** Identificador oficial «cédula» (concepto). */
const NATIONAL_ID_TYPE = CONCEPTS.ID_TYPE_NATIONAL;

const NAME_SQL = `trim(concat_ws(' ', p.name, p.middle_name, p.last_name, p.mother_last_name))`;

/** Acceso a la bitácora append-only de las admisiones. */
@Injectable()
export class PractitionerAdmissionEventsRepository {
  /** Agrega un evento. No hay actualización ni borrado: la base los rechaza. */
  append(
    em: EntityManager,
    data: {
      admissionId: string;
      eventTypeConceptId: string;
      fromStatusConceptId?: string;
      toStatusConceptId?: string;
      itemTypeConceptId?: string;
      itemId?: string;
      requirementId?: string;
      verificationSourceUri?: string;
      reasonCodeConceptId?: string;
      reasonText?: string;
      actorUserId?: string;
      actorRoleCode?: string;
      requestId?: string;
      occurredAt: Date;
    },
  ): PractitionerAdmissionEvents {
    return em.create(PractitionerAdmissionEvents, data, { partial: true });
  }

  /** Los eventos de una admisión, del más antiguo al más reciente. */
  findByAdmission(
    em: EntityManager,
    admissionId: string,
  ): Promise<PractitionerAdmissionEvents[]> {
    return em.find(
      PractitionerAdmissionEvents,
      { admissionId },
      { orderBy: { occurredAt: 'asc', id: 'asc' } },
    );
  }
}
