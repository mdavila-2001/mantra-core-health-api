import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import { ProceduresPerioperativeErrorReason } from '../procedures_perioperative.error-reasons';

/** Un id de profesional que llegó del cliente y el campo que lo traía. */
export interface PractitionerRef {
  /** Ruta del campo en el cuerpo (`airwayAssessment.assessedByProfileId`). */
  readonly field: string;
  /** El id, ya con forma de UUID. */
  readonly profileId: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Estados de afiliación que significan «la organización lo aceptó». */
const APPROVED_AFFILIATION: readonly string[] = [
  PROF.AFFILIATION_APPROVED,
  PROF.AFFILIATION_ACTIVE,
];

/**
 * Recorre un cuerpo y reúne los ids de **profesional** que trae (campos `…ProfileId`), salvo
 * los del paciente. Mira objetos y listas anidados. Sólo toma cadenas con forma de UUID: lo
 * demás lo rechaza después la validación del DTO.
 *
 * La regla es por nombre a propósito: un campo de profesional que se agregue mañana queda
 * cubierto sin que nadie tenga que acordarse de listarlo.
 *
 * @param body - Cuerpo de la petición.
 * @returns Las referencias, sin repetir (campo, id).
 */
export function collectPractitionerRefs(body: unknown): PractitionerRef[] {
  const refs: PractitionerRef[] = [];
  const visit = (value: unknown, path: string, depth: number): void => {
    if (depth > 6 || value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => visit(item, `${path}[${i}]`, depth + 1));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      const here = path ? `${path}.${key}` : key;
      if (
        /ProfileId$/.test(key) &&
        !/^patient/i.test(key) &&
        typeof child === 'string' &&
        UUID.test(child)
      ) {
        refs.push({ field: here, profileId: child.toLowerCase() });
      } else {
        visit(child, here, depth + 1);
      }
    }
  };
  visit(body, '', 0);
  return refs;
}

/**
 * Comprueba que un id de profesional que manda el cliente es un profesional **del tenant
 * activo**. Sin esto, un cliente podía citar el perfil de un profesional de otra organización:
 * se guardaba una referencia cruzada y la ficha mostraba después sus datos (IDOR).
 *
 * Un profesional pertenece al tenant si:
 *
 * - una cuenta suya (`person_account_links` activo) tiene una **membresía vigente** en el
 *   tenant, o
 * - tiene una **afiliación aprobada** (no sólo declarada) con una sede del tenant: una
 *   afiliación declarada la escribe el propio profesional y no prueba nada.
 *
 * El inexistente y el ajeno responden **exactamente lo mismo** (422
 * `PRACTITIONER_NOT_IN_TENANT`, con el campo y sin el id): distinguirlos confirmaría que el
 * perfil existe en otra organización.
 */
@Injectable()
export class PractitionerScopeService {
  /**
   * @param tx - Contexto de lectura o transacción.
   * @param tenantId - Tenant del contexto de la petición.
   * @param refs - Los ids a comprobar.
   * @throws PreconditionFailedException (`PRACTITIONER_NOT_IN_TENANT`) si alguno no es del tenant.
   */
  async assertInTenant(
    tx: EntityManager,
    tenantId: string,
    refs: readonly PractitionerRef[],
  ): Promise<void> {
    if (refs.length === 0) return;
    const ids = [...new Set(refs.map((r) => r.profileId.toLowerCase()))];
    const marks = ids.map(() => '?').join(', ');
    const rows = await tx.execute<{ profile_id: string }[]>(
      `select h.profile_id
         from profiles.health_practitioner_profiles h
        where h.profile_id in (${marks})
          and (
            exists (
              select 1
                from profiles.person_account_links l
                join directory.tenant_memberships m on m.user_id = l.user_id
               where l.person_id = h.profile_id
                 and l.status_concept_id = ?
                 and (l.valid_to is null or l.valid_to > now())
                 and m.tenant_id = ?
                 and m.status_concept_id = ?
                 and (m.end_date is null or m.end_date > now())
            )
            or exists (
              select 1
                from profiles.practitioner_affiliations a
                join practice.practice_sites s on s.id = a.practice_site_id
               where a.practitioner_profile_id = h.profile_id
                 and a.status_concept_id in (${APPROVED_AFFILIATION.map(() => '?').join(', ')})
                 and (a.end_date is null or a.end_date >= current_date)
                 and s.tenant_id = ?
            )
          )`,
      [
        ...ids,
        PROF.ACCOUNT_LINK_ACTIVE,
        tenantId,
        DIR.MEMBERSHIP_ACTIVE,
        ...APPROVED_AFFILIATION,
        tenantId,
      ],
    );
    const linked = new Set(rows.map((r) => r.profile_id.toLowerCase()));
    const rejected = refs.filter((r) => !linked.has(r.profileId.toLowerCase()));
    if (rejected.length > 0) {
      throw new PreconditionFailedException(
        'El profesional indicado no pertenece a esta organización',
        { fields: [...new Set(rejected.map((r) => r.field))] },
        ProceduresPerioperativeErrorReason.PRACTITIONER_NOT_IN_TENANT,
      );
    }
  }
}
