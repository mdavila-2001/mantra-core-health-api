import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

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

/** Escapa los comodines de `LIKE` para que el texto del usuario sea literal. */
function likeLiteral(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Lecturas para elegir el destino de una derivación.
 *
 * No hay en el repo una búsqueda de profesionales por nombre que cubra el
 * padrón entero: la del directorio público sólo ve perfiles publicados
 * (`community.public_profiles`) y la guía (`listPage`) no filtra por texto.
 * Esta consulta lee las tablas existentes (`profiles.health_practitioner_profiles`
 * ⋈ `profiles.persons`) y, para el tenant, la asignación vigente en
 * `practice.practitioner_role_assignments` → `practice.practices`. El nombre
 * legible lo resuelve quien llama con `findPractitionerNames`.
 */
@Injectable()
export class ReferralTargetsRepository {
  /**
   * Profesionales cuyo nombre o código contiene el texto, sin distinguir
   * mayúsculas.
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
    const pattern = `%${likeLiteral(q.toLowerCase())}%`;
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
              SELECT pp.tenant_id, pp.name
                FROM practice.practitioner_role_assignments ra
                JOIN practice.practices pp ON pp.id = ra.practice_id
               WHERE ra.practitioner_profile_id = hp.profile_id
                 AND ra.status_concept_id = ?
                 AND ra.valid_to IS NULL
               ORDER BY ra.is_primary DESC NULLS LAST, ra.created_at ASC
               LIMIT 1
         ) pr ON TRUE
        WHERE lower(concat_ws(' ', p.display_name, p.name, p.middle_name,
                              p.last_name, p.mother_last_name)) LIKE ?
           OR lower(hp.practitioner_code) LIKE ?
        ORDER BY coalesce(p.display_name, p.last_name, p.name) ASC, hp.profile_id ASC
        LIMIT ?`,
      [activeAssignmentConceptId, pattern, pattern, limit],
      'all',
    );
    return rows.map((row) => ({
      profileId: row.profileId,
      professionalTitle: row.professionalTitle ?? null,
      tenantId: row.tenantId ?? null,
      practiceName: row.practiceName ?? null,
    }));
  }
}
