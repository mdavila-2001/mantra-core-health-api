import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, deterministicId } from '../../../common/constants/concepts';
import { DIR } from '../../directory/directory.concepts';

/**
 * Concepto del rol «Jefe de quirófano» de una asignación delegada
 * (`delegated_access:ASSIGN_ROLE_OR_MANAGER`, CONTRATO-F2-F5 §0.3).
 *
 * El concepto lo declara y siembra la franja F2 en `delegated_access.concepts.ts`;
 * acá se deriva con el mismo `deterministicId` que usa `defineModuleConcepts`, de modo
 * que la comprobación no depende del orden en que se integren las ramas: el UUID es
 * el mismo se declare donde se declare.
 */
export const DA_ASSIGN_ROLE_OR_MANAGER_ID = deterministicId(
  'delegated_access:ASSIGN_ROLE_OR_MANAGER',
);

/** Quién pregunta y sobre qué espacio. */
export interface SpaceRoleScopeQuery {
  /** Usuario del actor. */
  readonly userId: string;
  /** Tenant del contexto. */
  readonly tenantId: string;
  /** Rol de la asignación (`assignment_role_concept_id`). */
  readonly roleConceptId: string;
  /** Espacio que la asignación debe contener. */
  readonly careSpaceId: string;
  /** Instante de la comprobación (vigencia). */
  readonly at?: Date;
}

/**
 * ¿Tiene el usuario una asignación delegada vigente con un rol dado cuyo alcance
 * **contiene** un espacio? (CONTRATO-F2-F5 §0.3, «Alcance ABAC»).
 *
 * El alcance contiene al espacio si la asignación es:
 *
 * - de la **sede** del espacio;
 * - del **espacio** mismo o de un ancestro suyo (camino de `parent_space_id`);
 * - de una **unidad** a la que el espacio (o un ancestro) está vinculado con un
 *   vínculo vigente (`space_unit_assignments`, incluidos SHARED y LOAN), o de una
 *   unidad antecesora de ésa (el subárbol de la unidad hereda).
 *
 * Todo en una sola sentencia de sólo lectura, acotada al tenant; un espacio de otro
 * tenant nunca coincide. Esta clase no decide 404/403: devuelve un booleano y quien la
 * llama aplica la regla de respuesta de su recurso.
 */
@Injectable()
export class SpaceRoleScopeService {
  /**
   * @param tx - Transacción o contexto de persistencia activo.
   * @param query - Usuario, tenant, rol y espacio.
   * @returns `true` si hay una asignación vigente con ese rol que contiene al espacio.
   */
  async holdsRoleOverSpace(
    tx: EntityManager,
    query: SpaceRoleScopeQuery,
  ): Promise<boolean> {
    const at = query.at ?? new Date();
    const rows = await tx.execute<{ ok: number }[]>(
      `with recursive up(id) as (
         select cs.id from practice.care_spaces cs
          where cs.id = ? and cs.tenant_id = ?
         union
         select c.parent_space_id from practice.care_spaces c
           join up on c.id = up.id
          where c.parent_space_id is not null and c.tenant_id = ?
       ),
       units(id) as (
         select sua.clinical_unit_id from practice.space_unit_assignments sua
           join up on up.id = sua.care_space_id
          where sua.valid_to is null and sua.tenant_id = ?
         union
         select cu.parent_unit_id from practice.clinical_units cu
           join units u on cu.id = u.id
          where cu.parent_unit_id is not null and cu.tenant_id = ?
       )
       select 1 as ok
         from delegated_access.organization_user_assignments a
         join directory.tenant_memberships m on m.id = a.tenant_membership_id
        where m.user_id = ?
          and m.tenant_id = ?
          and m.status_concept_id = ?
          and a.assignment_role_concept_id = ?
          and a.status_concept_id = ?
          and (a.valid_from is null or a.valid_from <= ?)
          and (a.valid_to is null or a.valid_to > ?)
          and (
            (a.care_space_id is not null and a.care_space_id in (select id from up))
            or (a.clinical_unit_id is not null and a.care_space_id is null
                and a.clinical_unit_id in (select id from units))
            or (a.practice_site_id is not null and a.care_space_id is null
                and a.clinical_unit_id is null
                and a.practice_site_id = (select practice_site_id from practice.care_spaces
                                           where id = ? and tenant_id = ?))
          )
        limit 1`,
      [
        query.careSpaceId,
        query.tenantId,
        query.tenantId,
        query.tenantId,
        query.tenantId,
        query.userId,
        query.tenantId,
        DIR.MEMBERSHIP_ACTIVE,
        query.roleConceptId,
        CONCEPTS.STATE_ACTIVE,
        at,
        at,
        query.careSpaceId,
        query.tenantId,
      ],
    );
    return rows.length > 0;
  }

  /**
   * ¿Tiene el usuario una asignación vigente con el rol dado en **alguna parte** de la
   * sede? Sirve para las lecturas por sede (listar quirófanos, bloques), donde no hay un
   * espacio concreto: cuenta una asignación de la sede, de un espacio de la sede o de
   * una unidad de la sede.
   *
   * @param tx - Transacción o contexto de persistencia activo.
   * @param query - Usuario, tenant, rol y sede.
   * @returns `true` si hay una asignación vigente con ese rol dentro de la sede.
   */
  async holdsRoleInSite(
    tx: EntityManager,
    query: Omit<SpaceRoleScopeQuery, 'careSpaceId'> & {
      readonly siteId: string;
    },
  ): Promise<boolean> {
    const at = query.at ?? new Date();
    const rows = await tx.execute<{ ok: number }[]>(
      `select 1 as ok
         from delegated_access.organization_user_assignments a
         join directory.tenant_memberships m on m.id = a.tenant_membership_id
        where m.user_id = ?
          and m.tenant_id = ?
          and m.status_concept_id = ?
          and a.assignment_role_concept_id = ?
          and a.status_concept_id = ?
          and (a.valid_from is null or a.valid_from <= ?)
          and (a.valid_to is null or a.valid_to > ?)
          and (
            a.practice_site_id = ?
            or exists (select 1 from practice.care_spaces cs
                        where cs.id = a.care_space_id and cs.tenant_id = ?
                          and cs.practice_site_id = ?)
            or exists (select 1 from practice.clinical_units cu
                        where cu.id = a.clinical_unit_id and cu.tenant_id = ?
                          and cu.practice_site_id = ?)
          )
        limit 1`,
      [
        query.userId,
        query.tenantId,
        DIR.MEMBERSHIP_ACTIVE,
        query.roleConceptId,
        CONCEPTS.STATE_ACTIVE,
        at,
        at,
        query.siteId,
        query.tenantId,
        query.siteId,
        query.tenantId,
        query.siteId,
      ],
    );
    return rows.length > 0;
  }
}
