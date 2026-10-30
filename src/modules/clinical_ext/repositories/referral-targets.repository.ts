import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { COMM } from '../../community/community.concepts';
import {
  containsPattern,
  normalizeSearchText,
  sqlSearchKey,
} from '../../terminology/repositories/glossary-search.sql';

/** Un profesional candidato a destino de derivación. */
export interface PractitionerTargetRow {
  /** `profiles.health_practitioner_profiles.profile_id`. */
  profileId: string;
  /** Título profesional declarado, si lo hay. */
  professionalTitle: string | null;
  /** Tenant de su práctica vigente principal, si tiene alguna. */
  tenantId: string | null;
  /** Nombre de esa práctica. */
  practiceName: string | null;
}

/** Una organización candidata a destino de derivación. */
export interface OrganizationTargetRow {
  /** `directory.tenants.id`. */
  tenantId: string;
  /** Razón social. */
  legalName: string;
  /** Nombre comercial, si lo hay. */
  tradeName: string | null;
}

/**
 * Qué hace «listable» a un sujeto: la misma regla del directorio público
 * (`PublicSearchRepository`, `community.public_profiles`) — vitrina con
 * visibilidad `PROFILE_VISIBILITY_PUBLIC` **y** estado `STATE_ACTIVE`, del tipo
 * de sujeto pedido. Se compara por igualdad, como allá: un valor nulo o
 * desconocido queda fuera. Un profesional que no publicó su vitrina, o que la
 * despublicó, no aparece como destino aunque exista en el padrón.
 */
const LISTABLE_PROFILE_SQL = `EXISTS (
            SELECT 1
              FROM community.public_profiles pp
             WHERE pp.target_id = %TARGET%
               AND pp.target_type_concept_id = ?
               AND pp.visibility_concept_id = ?
               AND pp.status_concept_id = ?
          )`;

/**
 * Lecturas para elegir el destino de una derivación.
 *
 * Aplica la regla de visibilidad del directorio público (ver
 * {@link LISTABLE_PROFILE_SQL}) y compara sólo **nombres** —sin tildes ni
 * mayúsculas, con los mismos helpers del buscador—: nunca códigos internos
 * (`practitioner_code`, `tenants.code`), que el directorio público tampoco
 * expone. El nombre legible lo resuelve quien llama con `findPractitionerNames`.
 *
 * No reutiliza `PublicSearchRepository.searchProfiles` tal cual porque su
 * camino SQL pagina antes de filtrar por texto (está pensado como respaldo del
 * índice) y acá no hay índice delante: con más de veinte vitrinas, una
 * búsqueda por nombre devolvería páginas incompletas.
 */
@Injectable()
export class ReferralTargetsRepository {
  /**
   * Profesionales listables cuyo nombre contiene el texto.
   *
   * @param em - Contexto de persistencia.
   * @param q - Texto ya recortado (mínimo dos caracteres, lo valida el DTO).
   * @param activeAssignmentConceptId - Estado vigente de la asignación a práctica.
   * @param limit - Tope de filas.
   * @returns Los perfiles encontrados, por nombre.
   */
  async searchPractitioners(
    em: EntityManager,
    q: string,
    activeAssignmentConceptId: string,
    limit: number,
  ): Promise<PractitionerTargetRow[]> {
    const pattern = containsPattern(normalizeSearchText(q));
    const rows = await em.getConnection().execute<
      {
        profileId: string;
        professionalTitle: string | null;
        tenantId: string | null;
        practiceName: string | null;
      }[]
    >(
      `SELECT hp.profile_id          AS "profileId",
              hp.professional_title  AS "professionalTitle",
              pr.tenant_id           AS "tenantId",
              pr.name                AS "practiceName"
         FROM profiles.health_practitioner_profiles hp
         JOIN profiles.persons p ON p.id = hp.profile_id
         LEFT JOIN LATERAL (
              SELECT pq.tenant_id, pq.name
                FROM practice.practitioner_role_assignments ra
                JOIN practice.practices pq ON pq.id = ra.practice_id
               WHERE ra.practitioner_profile_id = hp.profile_id
                 AND ra.status_concept_id = ?
                 AND ra.valid_to IS NULL
               ORDER BY ra.is_primary DESC NULLS LAST, ra.created_at ASC
               LIMIT 1
         ) pr ON TRUE
        WHERE ${LISTABLE_PROFILE_SQL.replace('%TARGET%', 'hp.profile_id')}
          AND ${sqlSearchKey(
            `concat_ws(' ', p.display_name, p.name, p.middle_name, p.last_name, p.mother_last_name)`,
          )} LIKE ?
        ORDER BY coalesce(p.display_name, p.last_name, p.name) ASC, hp.profile_id ASC
        LIMIT ?`,
      [
        activeAssignmentConceptId,
        COMM.PROFILE_TARGET_PRACTITIONER,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
        pattern,
        limit,
      ],
      'all',
    );
    return rows.map((row) => ({
      profileId: row.profileId,
      professionalTitle: row.professionalTitle ?? null,
      tenantId: row.tenantId ?? null,
      practiceName: row.practiceName ?? null,
    }));
  }

  /**
   * Organizaciones activas y listables cuyo nombre (comercial o razón social)
   * contiene el texto.
   *
   * @param em - Contexto de persistencia.
   * @param q - Texto ya recortado.
   * @param limit - Tope de filas.
   * @returns Las organizaciones encontradas, por nombre.
   */
  async searchOrganizations(
    em: EntityManager,
    q: string,
    limit: number,
  ): Promise<OrganizationTargetRow[]> {
    const pattern = containsPattern(normalizeSearchText(q));
    const rows = await em
      .getConnection()
      .execute<
        { tenantId: string; legalName: string; tradeName: string | null }[]
      >(
        `SELECT t.id         AS "tenantId",
              t.legal_name AS "legalName",
              t.trade_name AS "tradeName"
         FROM directory.tenants t
        WHERE t.status_concept_id = ?
          AND ${LISTABLE_PROFILE_SQL.replace('%TARGET%', 't.id')}
          AND (${sqlSearchKey('t.legal_name')} LIKE ?
               OR ${sqlSearchKey("coalesce(t.trade_name, '')")} LIKE ?)
        ORDER BY coalesce(t.trade_name, t.legal_name) ASC, t.id ASC
        LIMIT ?`,
        [
          CONCEPTS.TENANT_ACTIVE,
          COMM.PROFILE_TARGET_ORGANIZATION,
          COMM.PROFILE_VISIBILITY_PUBLIC,
          CONCEPTS.STATE_ACTIVE,
          pattern,
          pattern,
          limit,
        ],
        'all',
      );
    return rows.map((row) => ({
      tenantId: row.tenantId,
      legalName: row.legalName,
      tradeName: row.tradeName ?? null,
    }));
  }

  /**
   * ¿Saldría este profesional en {@link searchPractitioners}? Misma regla de
   * visibilidad, sin el filtro por nombre.
   *
   * @param em - Contexto de persistencia.
   * @param profileId - `health_practitioner_profiles.profile_id`.
   * @returns `true` sólo si tiene vitrina pública activa de profesional.
   */
  async isListablePractitioner(
    em: EntityManager,
    profileId: string,
  ): Promise<boolean> {
    const rows = await em.getConnection().execute<{ ok: number }[]>(
      `SELECT 1 AS ok
         FROM profiles.health_practitioner_profiles hp
        WHERE hp.profile_id = ?
          AND ${LISTABLE_PROFILE_SQL.replace('%TARGET%', 'hp.profile_id')}`,
      [
        profileId,
        COMM.PROFILE_TARGET_PRACTITIONER,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
      ],
      'all',
    );
    return rows.length > 0;
  }

  /**
   * ¿Está activo el tenant? Es lo que se exige a la organización cuando el
   * destino es un profesional: la búsqueda lo devuelve con el tenant de su
   * práctica principal, que no necesita vitrina de organización.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - `directory.tenants.id`.
   * @returns `true` sólo si el tenant existe y está activo.
   */
  async isActiveTenant(em: EntityManager, tenantId: string): Promise<boolean> {
    const rows = await em.getConnection().execute<{ ok: number }[]>(
      `SELECT 1 AS ok
         FROM directory.tenants t
        WHERE t.id = ?
          AND t.status_concept_id = ?`,
      [tenantId, CONCEPTS.TENANT_ACTIVE],
      'all',
    );
    return rows.length > 0;
  }

  /**
   * ¿Saldría esta organización en {@link searchOrganizations}? Tenant activo y
   * vitrina pública activa de organización, sin el filtro por nombre.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - `directory.tenants.id`.
   * @returns `true` sólo si es un destino listable.
   */
  async isListableOrganization(
    em: EntityManager,
    tenantId: string,
  ): Promise<boolean> {
    const rows = await em.getConnection().execute<{ ok: number }[]>(
      `SELECT 1 AS ok
         FROM directory.tenants t
        WHERE t.id = ?
          AND t.status_concept_id = ?
          AND ${LISTABLE_PROFILE_SQL.replace('%TARGET%', 't.id')}`,
      [
        tenantId,
        CONCEPTS.TENANT_ACTIVE,
        COMM.PROFILE_TARGET_ORGANIZATION,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
      ],
      'all',
    );
    return rows.length > 0;
  }
}
