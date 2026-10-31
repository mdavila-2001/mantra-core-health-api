import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { PRAC } from '../../practice/practice.concepts';

/** Doctor de la organización: una asignación de rol con su nombre. */
export interface CatalogDoctorRow {
  readonly roleAssignmentId: string;
  readonly practitionerProfileId: string;
  readonly displayName: string;
  readonly practiceSiteId?: string;
  readonly healthcareServiceId?: string;
}

/** Servicio de la organización, con su nombre. */
export interface CatalogServiceRow {
  readonly id: string;
  readonly name: string;
  readonly practiceSiteId?: string;
}

/** Sede o espacio de la organización. */
export interface CatalogLocationRow {
  readonly id: string;
  readonly kind: 'SITE' | 'SPACE';
  readonly name: string;
  readonly code: string;
  readonly parentId?: string;
  readonly practiceSiteId: string;
}

/** Espacio donde atiende una asignación de rol. */
export interface CatalogLocationAssignmentRow {
  readonly roleAssignmentId: string;
  readonly careSpaceId: string;
}

/**
 * Lecturas de estructura de una organización para armar los editores de
 * permisos de apoyo: doctores, servicios y ubicaciones con sus nombres.
 * SQL directo porque cruza `practice`, `profiles` y `terminology` solo para leer.
 */
@Injectable()
export class SupportCatalogRepository {
  /**
   * Doctores con asignación de rol vigente en las prácticas de la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Una fila por asignación de rol.
   */
  async doctors(
    em: EntityManager,
    tenantId: string,
  ): Promise<CatalogDoctorRow[]> {
    const rows = await em.execute<
      {
        id: string;
        practitioner_profile_id: string;
        display_name: string | null;
        practice_site_id: string | null;
        healthcare_service_id: string | null;
      }[]
    >(
      `select r.id, r.practitioner_profile_id, p.display_name,
              r.practice_site_id, r.healthcare_service_id
         from practice.practitioner_role_assignments r
         join practice.practices pr on pr.id = r.practice_id
         left join profiles.persons p on p.id = r.practitioner_profile_id
        where pr.tenant_id = ?
          and r.status_concept_id = ?
        order by p.display_name asc nulls last, r.id asc`,
      [tenantId, PRAC.ROLE_ASSIGNMENT_ACTIVE],
    );
    return rows.map((r) => ({
      roleAssignmentId: r.id,
      practitionerProfileId: r.practitioner_profile_id,
      displayName: r.display_name ?? '',
      practiceSiteId: r.practice_site_id ?? undefined,
      healthcareServiceId: r.healthcare_service_id ?? undefined,
    }));
  }

  /**
   * Servicios activos de las prácticas de la organización, con su nombre.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Los servicios.
   */
  async services(
    em: EntityManager,
    tenantId: string,
  ): Promise<CatalogServiceRow[]> {
    const rows = await em.execute<
      { id: string; name: string; practice_site_id: string | null }[]
    >(
      `select s.id, c.display as name, s.practice_site_id
         from practice.healthcare_services s
         join practice.practices pr on pr.id = s.practice_id
         join terminology.catalog_concepts c on c.id = s.service_concept_id
        where pr.tenant_id = ?
          and s.status_concept_id = ?
        order by c.display asc, s.id asc`,
      [tenantId, PRAC.SERVICE_ACTIVE],
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      practiceSiteId: r.practice_site_id ?? undefined,
    }));
  }

  /**
   * Sedes y espacios activos de la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Sedes y espacios, con su padre.
   */
  async locations(
    em: EntityManager,
    tenantId: string,
  ): Promise<CatalogLocationRow[]> {
    // `em.execute` (y no la conexión) para que la consulta corra en la transacción activa.
    const connection = em;
    const sites = await connection.execute<
      { id: string; name: string; code: string }[]
    >(
      `select s.id, s.name, s.code
         from practice.practice_sites s
         join practice.practices pr on pr.id = s.practice_id
        where pr.tenant_id = ?
          and s.operational_status_concept_id is distinct from ?
        order by s.name asc, s.id asc`,
      [tenantId, PRAC.SITE_OP_CLOSED],
    );
    const spaces = await connection.execute<
      {
        id: string;
        name: string;
        code: string;
        parent_space_id: string | null;
        practice_site_id: string;
      }[]
    >(
      `select c.id, c.name, c.code, c.parent_space_id, c.practice_site_id
         from practice.care_spaces c
         join practice.practice_sites s on s.id = c.practice_site_id
         join practice.practices pr on pr.id = s.practice_id
        where pr.tenant_id = ?
          and c.status_concept_id = ?
        order by c.code asc, c.id asc`,
      [tenantId, PRAC.SPACE_ACTIVE],
    );
    return [
      ...sites.map((s): CatalogLocationRow => ({
        id: s.id,
        kind: 'SITE',
        name: s.name,
        code: s.code,
        practiceSiteId: s.id,
      })),
      ...spaces.map((c): CatalogLocationRow => ({
        id: c.id,
        kind: 'SPACE',
        name: c.name,
        code: c.code,
        parentId: c.parent_space_id ?? c.practice_site_id,
        practiceSiteId: c.practice_site_id,
      })),
    ];
  }

  /**
   * Espacios donde atiende cada asignación de rol, vigentes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param roleAssignmentIds - Asignaciones de rol.
   * @returns Pares asignación ↔ espacio.
   */
  async locationAssignments(
    em: EntityManager,
    roleAssignmentIds: readonly string[],
  ): Promise<CatalogLocationAssignmentRow[]> {
    if (roleAssignmentIds.length === 0) return [];
    const rows = await em.execute<
      { practitioner_role_assignment_id: string; care_space_id: string }[]
    >(
      `select practitioner_role_assignment_id, care_space_id
         from practice.practitioner_location_assignments
        where practitioner_role_assignment_id = any(?::uuid[])
          and status_concept_id = ?
          and (valid_from is null or valid_from <= now())
          and (valid_to is null or valid_to > now())`,
      [`{${roleAssignmentIds.join(',')}}`, CONCEPTS.STATE_ACTIVE],
    );
    return rows.map((r) => ({
      roleAssignmentId: r.practitioner_role_assignment_id,
      careSpaceId: r.care_space_id,
    }));
  }
}
