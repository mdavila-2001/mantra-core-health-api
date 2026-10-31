import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy, touch } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import { PRAC } from '../../practice/practice.concepts';
import { PractitionerSupportAssignments } from '../../practice/entities';
import { PROF } from '../../profiles/profiles.concepts';
import { DELEG } from '../delegated_access.concepts';
import { OrganizationUserAssignments } from '../entities';
import type {
  SupportLinkKind,
  SupportLinkRow,
  SupportLinkStatus,
} from '../domain/support-links';

/** Concepto de estado ↔ estado del vínculo, por tabla. */
const LOCATION_STATUS: Readonly<Record<SupportLinkStatus, string>> = {
  PENDING: CONCEPTS.STATE_PENDING,
  ACTIVE: CONCEPTS.STATE_ACTIVE,
  REJECTED: DELEG.DECISION_DENIED,
  ENDED: CONCEPTS.STATE_REVOKED,
};
const PRACTITIONER_STATUS: Readonly<Record<SupportLinkStatus, string>> = {
  PENDING: PRAC.SUPPORT_PENDING,
  ACTIVE: PRAC.SUPPORT_ACTIVE,
  REJECTED: PRAC.SUPPORT_REJECTED,
  ENDED: PRAC.SUPPORT_ENDED,
};

/** El concepto de estado que se escribe para un vínculo. */
export function statusConceptFor(
  kind: SupportLinkKind,
  status: SupportLinkStatus,
): string {
  return (kind === 'LOCATION' ? LOCATION_STATUS : PRACTITIONER_STATUS)[status];
}

/** El estado del vínculo para un concepto leído, o `null` si no es de este flujo. */
function statusFromConcept(
  kind: SupportLinkKind,
  conceptId: string,
): SupportLinkStatus | null {
  const map = kind === 'LOCATION' ? LOCATION_STATUS : PRACTITIONER_STATUS;
  const found = (Object.keys(map) as SupportLinkStatus[]).find(
    (status) => map[status] === conceptId,
  );
  return found ?? null;
}

/** Fila cruda de la consulta unificada de vínculos. */
interface RawLinkRow {
  id: string;
  kind: SupportLinkKind;
  tenant_id: string;
  organization_name: string | null;
  support_user_id: string;
  support_person_id: string | null;
  support_name: string | null;
  status_concept_id: string;
  created_by_user_id: string | null;
  created_at: Date | string;
  practice_site_id: string | null;
  clinical_unit_id: string | null;
  care_space_id: string | null;
  practitioner_role_assignment_id: string | null;
  practitioner_profile_id: string | null;
  practitioner_user_id: string | null;
  target_name: string | null;
}

/** Filtro de la lectura de vínculos; al menos uno de los campos. */
export interface SupportLinkFilter {
  readonly id?: string;
  readonly supportUserId?: string;
  readonly tenantId?: string;
  readonly practitionerProfileId?: string;
  readonly statuses?: readonly SupportLinkStatus[];
}

/** Un lugar o doctor del catálogo de una organización. */
export interface SupportCatalogEntry {
  readonly id: string;
  readonly name: string | null;
  readonly practiceSiteId: string | null;
  readonly clinicalUnitId?: string | null;
}

/**
 * Lecturas y escrituras de los vínculos de la secretaria.
 *
 * Las lecturas cruzan `delegated_access`, `practice`, `directory` y `profiles`
 * en una sola consulta con SQL explícito —como `ProfilesAffiliationsService`
 * con las membresías—, porque los dos tipos de vínculo viven en tablas de
 * módulos distintos y la pantalla los quiere en una lista. Las escrituras usan
 * las entidades de cada tabla.
 */
@Injectable()
export class SupportLinksRepository {
  /**
   * Vínculos de secretaria que cumplen el filtro, de los dos tipos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Qué vínculos.
   * @returns Los vínculos normalizados, más nuevos primero.
   */
  async findLinks(
    em: EntityManager,
    filter: SupportLinkFilter,
  ): Promise<SupportLinkRow[]> {
    const where: string[] = [];
    const params: unknown[] = [
      PROF.ACCOUNT_LINK_ACTIVE,
      DELEG.ASSIGN_ROLE_SECRETARY,
      PROF.ACCOUNT_LINK_ACTIVE,
      PROF.ACCOUNT_LINK_ACTIVE,
      PRAC.SUPPORT_ROLE_SECRETARY,
    ];
    if (filter.id) {
      where.push('l.id = ?');
      params.push(filter.id);
    }
    if (filter.supportUserId) {
      where.push('l.support_user_id = ?');
      params.push(filter.supportUserId);
    }
    if (filter.tenantId) {
      where.push('l.tenant_id = ?');
      params.push(filter.tenantId);
    }
    if (filter.practitionerProfileId) {
      where.push('l.practitioner_profile_id = ?');
      params.push(filter.practitionerProfileId);
    }
    if (filter.statuses && filter.statuses.length > 0) {
      const concepts = filter.statuses.flatMap((status) => [
        LOCATION_STATUS[status],
        PRACTITIONER_STATUS[status],
      ]);
      where.push(
        `l.status_concept_id IN (${concepts.map(() => '?').join(', ')})`,
      );
      params.push(...concepts);
    }
    const rows = await em.execute<RawLinkRow[]>(
      `SELECT * FROM (
         SELECT 'LOCATION' AS kind, oua.id, m.tenant_id,
                COALESCE(t.trade_name, t.legal_name) AS organization_name,
                m.user_id AS support_user_id,
                pal.person_id AS support_person_id,
                COALESCE(per.display_name, u.display_name) AS support_name,
                oua.status_concept_id, oua.created_by_user_id, oua.created_at,
                oua.practice_site_id, oua.clinical_unit_id, oua.care_space_id,
                NULL::uuid AS practitioner_role_assignment_id,
                NULL::uuid AS practitioner_profile_id,
                NULL::uuid AS practitioner_user_id,
                COALESCE(cs.name, cu.name, ps.name) AS target_name
           FROM delegated_access.organization_user_assignments oua
           JOIN directory.tenant_memberships m ON m.id = oua.tenant_membership_id
           JOIN directory.tenants t ON t.id = m.tenant_id
           JOIN iam.users u ON u.id = m.user_id
           LEFT JOIN LATERAL (
             SELECT person_id FROM profiles.person_account_links
              WHERE user_id = m.user_id AND status_concept_id = ?
              ORDER BY created_at LIMIT 1
           ) pal ON true
           LEFT JOIN profiles.persons per ON per.id = pal.person_id
           LEFT JOIN practice.practice_sites ps ON ps.id = oua.practice_site_id
           LEFT JOIN practice.clinical_units cu ON cu.id = oua.clinical_unit_id
           LEFT JOIN practice.care_spaces cs ON cs.id = oua.care_space_id
          WHERE oua.assignment_role_concept_id = ?
         UNION ALL
         SELECT 'PRACTITIONER' AS kind, psa.id, p.tenant_id,
                COALESCE(t.trade_name, t.legal_name) AS organization_name,
                sal.user_id AS support_user_id,
                psa.support_profile_id AS support_person_id,
                per.display_name AS support_name,
                psa.status_concept_id, psa.created_by_user_id, psa.created_at,
                pra.practice_site_id, NULL::uuid AS clinical_unit_id,
                NULL::uuid AS care_space_id,
                psa.practitioner_role_assignment_id,
                pra.practitioner_profile_id,
                dal.user_id AS practitioner_user_id,
                dper.display_name AS target_name
           FROM practice.practitioner_support_assignments psa
           JOIN practice.practitioner_role_assignments pra
             ON pra.id = psa.practitioner_role_assignment_id
           JOIN practice.practices p ON p.id = pra.practice_id
           JOIN directory.tenants t ON t.id = p.tenant_id
           JOIN LATERAL (
             SELECT user_id FROM profiles.person_account_links
              WHERE person_id = psa.support_profile_id AND status_concept_id = ?
              ORDER BY created_at LIMIT 1
           ) sal ON true
           LEFT JOIN LATERAL (
             SELECT user_id FROM profiles.person_account_links
              WHERE person_id = pra.practitioner_profile_id AND status_concept_id = ?
              ORDER BY created_at LIMIT 1
           ) dal ON true
           LEFT JOIN profiles.persons per ON per.id = psa.support_profile_id
           LEFT JOIN profiles.persons dper ON dper.id = pra.practitioner_profile_id
          WHERE psa.support_role_concept_id = ?
       ) l
       ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY l.created_at DESC, l.id
       LIMIT 500`,
      params,
    );
    return rows.flatMap((row) => {
      const status = statusFromConcept(row.kind, row.status_concept_id);
      if (status === null) return [];
      return [
        {
          id: row.id,
          kind: row.kind,
          tenantId: row.tenant_id,
          organizationName: row.organization_name,
          supportUserId: row.support_user_id,
          supportPersonId: row.support_person_id,
          supportName: row.support_name,
          status,
          createdByUserId: row.created_by_user_id,
          createdAt: new Date(row.created_at),
          practiceSiteId: row.practice_site_id,
          clinicalUnitId: row.clinical_unit_id,
          careSpaceId: row.care_space_id,
          practitionerRoleAssignmentId: row.practitioner_role_assignment_id,
          practitionerProfileId: row.practitioner_profile_id,
          practitionerUserId: row.practitioner_user_id,
          targetName: row.target_name,
        },
      ];
    });
  }

  /**
   * La persona con perfil de secretaria que encarna esa cuenta, o `null`.
   *
   * @param em - Contexto de persistencia.
   * @param userId - Cuenta.
   */
  async findSecretaryPersonId(
    em: EntityManager,
    userId: string,
  ): Promise<string | null> {
    const rows = await em.execute<{ person_id: string }[]>(
      `SELECT pal.person_id
         FROM profiles.person_account_links pal
         JOIN profiles.secretary_profiles sp ON sp.profile_id = pal.person_id
        WHERE pal.user_id = ? AND pal.status_concept_id = ?
        ORDER BY pal.created_at LIMIT 1`,
      [userId, PROF.ACCOUNT_LINK_ACTIVE],
    );
    return rows[0]?.person_id ?? null;
  }

  /**
   * La cuenta de secretaria cuyo documento de login es ese, o `null`.
   *
   * Sólo cuentas con perfil de secretaria: el hospital no puede «invitar» como
   * apoyo a un paciente o a un médico por conocer su documento.
   *
   * @param em - Contexto de persistencia.
   * @param nationalId - Documento con el que inicia sesión.
   */
  async findSecretaryByNationalId(
    em: EntityManager,
    nationalId: string,
  ): Promise<{ userId: string; personId: string } | null> {
    const rows = await em.execute<{ user_id: string; person_id: string }[]>(
      `SELECT c.user_id, pal.person_id
         FROM iam.authentication_credentials c
         JOIN profiles.person_account_links pal
           ON pal.user_id = c.user_id AND pal.status_concept_id = ?
         JOIN profiles.secretary_profiles sp ON sp.profile_id = pal.person_id
        WHERE c.external_subject = ? AND c.method_concept_id = ?
          AND c.state_concept_id = ?
        ORDER BY c.created_at LIMIT 1`,
      [
        PROF.ACCOUNT_LINK_ACTIVE,
        nationalId,
        CONCEPTS.CRED_PASSWORD,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    const row = rows[0];
    return row ? { userId: row.user_id, personId: row.person_id } : null;
  }

  /** Si el usuario es OWNER o ADMIN activo de la organización. */
  async isOrganizationAdmin(
    em: EntityManager,
    tenantId: string,
    userId: string,
  ): Promise<boolean> {
    const rows = await em.execute<{ n: string | number }[]>(
      `SELECT count(*) AS n FROM directory.tenant_memberships
        WHERE tenant_id = ? AND user_id = ? AND status_concept_id = ?
          AND tenant_role_concept_id IN (?, ?)`,
      [tenantId, userId, DIR.MEMBERSHIP_ACTIVE, DIR.ROLE_OWNER, DIR.ROLE_ADMIN],
    );
    return Number(rows[0]?.n ?? 0) > 0;
  }

  /** Tenants donde la cuenta tiene membresía ACTIVA (los que entran a su token). */
  async findActiveMembershipTenantIds(
    em: EntityManager,
    userId: string,
  ): Promise<string[]> {
    const rows = await em.execute<{ tenant_id: string }[]>(
      `SELECT DISTINCT tenant_id FROM directory.tenant_memberships
        WHERE user_id = ? AND status_concept_id = ?`,
      [userId, DIR.MEMBERSHIP_ACTIVE],
    );
    return rows.map((row) => row.tenant_id);
  }

  /** Nombre visible de la organización, o `null` si no existe. */
  async findOrganizationName(
    em: EntityManager,
    tenantId: string,
  ): Promise<string | null | undefined> {
    const rows = await em.execute<{ name: string | null }[]>(
      `SELECT COALESCE(trade_name, legal_name) AS name
         FROM directory.tenants WHERE id = ?`,
      [tenantId],
    );
    return rows.length === 0 ? undefined : rows[0].name;
  }

  /** La sede, si es de esa organización. */
  async findSiteInTenant(
    em: EntityManager,
    tenantId: string,
    siteId: string,
  ): Promise<{ practiceId: string } | null> {
    const rows = await em.execute<{ practice_id: string }[]>(
      `SELECT ps.practice_id
         FROM practice.practice_sites ps
         JOIN practice.practices p ON p.id = ps.practice_id
        WHERE ps.id = ? AND (p.tenant_id = ? OR ps.managing_tenant_id = ?)`,
      [siteId, tenantId, tenantId],
    );
    return rows[0] ? { practiceId: rows[0].practice_id } : null;
  }

  /** El servicio (unidad clínica), si es de esa organización. */
  async findUnitInTenant(
    em: EntityManager,
    tenantId: string,
    unitId: string,
  ): Promise<{ practiceId: string; practiceSiteId: string } | null> {
    const rows = await em.execute<
      { practice_id: string; practice_site_id: string }[]
    >(
      `SELECT ps.practice_id, cu.practice_site_id
         FROM practice.clinical_units cu
         JOIN practice.practice_sites ps ON ps.id = cu.practice_site_id
         JOIN practice.practices p ON p.id = ps.practice_id
        WHERE cu.id = ? AND (p.tenant_id = ? OR ps.managing_tenant_id = ?)`,
      [unitId, tenantId, tenantId],
    );
    const row = rows[0];
    return row
      ? { practiceId: row.practice_id, practiceSiteId: row.practice_site_id }
      : null;
  }

  /** El piso u otro espacio, si es de esa organización. */
  async findSpaceInTenant(
    em: EntityManager,
    tenantId: string,
    spaceId: string,
  ): Promise<{
    practiceId: string;
    practiceSiteId: string;
    clinicalUnitId: string | null;
  } | null> {
    const rows = await em.execute<
      {
        practice_id: string;
        practice_site_id: string;
        clinical_unit_id: string | null;
      }[]
    >(
      `SELECT ps.practice_id, cs.practice_site_id, cs.clinical_unit_id
         FROM practice.care_spaces cs
         JOIN practice.practice_sites ps ON ps.id = cs.practice_site_id
         JOIN practice.practices p ON p.id = ps.practice_id
        WHERE cs.id = ? AND (p.tenant_id = ? OR ps.managing_tenant_id = ?)`,
      [spaceId, tenantId, tenantId],
    );
    const row = rows[0];
    return row
      ? {
          practiceId: row.practice_id,
          practiceSiteId: row.practice_site_id,
          clinicalUnitId: row.clinical_unit_id,
        }
      : null;
  }

  /** La vinculación ACTIVA de un doctor, si es de esa organización. */
  async findActiveRoleAssignmentInTenant(
    em: EntityManager,
    tenantId: string,
    roleAssignmentId: string,
  ): Promise<{ practitionerProfileId: string } | null> {
    const rows = await em.execute<{ practitioner_profile_id: string }[]>(
      `SELECT pra.practitioner_profile_id
         FROM practice.practitioner_role_assignments pra
         JOIN practice.practices p ON p.id = pra.practice_id
        WHERE pra.id = ? AND p.tenant_id = ? AND pra.status_concept_id = ?`,
      [roleAssignmentId, tenantId, PRAC.ROLE_ASSIGNMENT_ACTIVE],
    );
    return rows[0]
      ? { practitionerProfileId: rows[0].practitioner_profile_id }
      : null;
  }

  /**
   * Las vinculaciones ACTIVAS de un doctor con su organización.
   *
   * @param em - Contexto de persistencia.
   * @param practitionerProfileId - El doctor.
   */
  async findActiveRoleAssignmentsOfPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<{ id: string; tenantId: string }[]> {
    const rows = await em.execute<{ id: string; tenant_id: string }[]>(
      `SELECT pra.id, p.tenant_id
         FROM practice.practitioner_role_assignments pra
         JOIN practice.practices p ON p.id = pra.practice_id
        WHERE pra.practitioner_profile_id = ? AND pra.status_concept_id = ?`,
      [practitionerProfileId, PRAC.ROLE_ASSIGNMENT_ACTIVE],
    );
    return rows.map((row) => ({ id: row.id, tenantId: row.tenant_id }));
  }

  /**
   * Sedes, servicios, pisos y doctores de una organización: lo que se puede
   * pedir o asignar. Los pisos son los espacios de forma `LOC_FORM_LEVEL`.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - La organización.
   */
  async findCatalog(
    em: EntityManager,
    tenantId: string,
  ): Promise<{
    sites: SupportCatalogEntry[];
    services: SupportCatalogEntry[];
    floors: SupportCatalogEntry[];
    practitioners: (SupportCatalogEntry & {
      practitionerProfileId: string;
    })[];
  }> {
    const siteRows = await em.execute<{ id: string; name: string | null }[]>(
      `SELECT ps.id, ps.name
         FROM practice.practice_sites ps
         JOIN practice.practices p ON p.id = ps.practice_id
        WHERE p.tenant_id = ? OR ps.managing_tenant_id = ?
        ORDER BY ps.name`,
      [tenantId, tenantId],
    );
    const siteIds = siteRows.map((row) => row.id);
    if (siteIds.length === 0) {
      return { sites: [], services: [], floors: [], practitioners: [] };
    }
    const marks = siteIds.map(() => '?').join(', ');
    const unitRows = await em.execute<
      { id: string; name: string | null; practice_site_id: string }[]
    >(
      `SELECT id, name, practice_site_id FROM practice.clinical_units
        WHERE practice_site_id IN (${marks}) ORDER BY name`,
      siteIds,
    );
    const floorRows = await em.execute<
      {
        id: string;
        name: string | null;
        practice_site_id: string;
        clinical_unit_id: string | null;
      }[]
    >(
      `SELECT id, name, practice_site_id, clinical_unit_id
         FROM practice.care_spaces
        WHERE practice_site_id IN (${marks}) AND form_concept_id = ?
        ORDER BY floor_number NULLS LAST, name`,
      [...siteIds, PRAC.LOC_FORM_LEVEL],
    );
    const doctorRows = await em.execute<
      {
        id: string;
        name: string | null;
        practice_site_id: string | null;
        practitioner_profile_id: string;
      }[]
    >(
      `SELECT pra.id, per.display_name AS name, pra.practice_site_id,
              pra.practitioner_profile_id
         FROM practice.practitioner_role_assignments pra
         JOIN practice.practices p ON p.id = pra.practice_id
         LEFT JOIN profiles.persons per ON per.id = pra.practitioner_profile_id
        WHERE p.tenant_id = ? AND pra.status_concept_id = ?
        ORDER BY per.display_name`,
      [tenantId, PRAC.ROLE_ASSIGNMENT_ACTIVE],
    );
    return {
      sites: siteRows.map((row) => ({
        id: row.id,
        name: row.name,
        practiceSiteId: row.id,
      })),
      services: unitRows.map((row) => ({
        id: row.id,
        name: row.name,
        practiceSiteId: row.practice_site_id,
      })),
      floors: floorRows.map((row) => ({
        id: row.id,
        name: row.name,
        practiceSiteId: row.practice_site_id,
        clinicalUnitId: row.clinical_unit_id,
      })),
      practitioners: doctorRows.map((row) => ({
        id: row.id,
        name: row.name,
        practiceSiteId: row.practice_site_id,
        practitionerProfileId: row.practitioner_profile_id,
      })),
    };
  }

  /**
   * Turnos de la agenda de un doctor en una organización, en un rango.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - La organización.
   * @param practitionerProfileId - El doctor (dueño del recurso de agenda).
   * @param from - Desde (incluido).
   * @param to - Hasta (excluido).
   */
  async findPractitionerAgenda(
    em: EntityManager,
    tenantId: string,
    practitionerProfileId: string,
    from: Date,
    to: Date,
  ): Promise<
    {
      bookingId: string;
      startAt: Date;
      endAt: Date;
      statusCode: string | null;
      patientProfileId: string;
      patientName: string | null;
    }[]
  > {
    const rows = await em.execute<
      {
        id: string;
        start_at: Date | string;
        end_at: Date | string;
        status_code: string | null;
        patient_profile_id: string;
        patient_name: string | null;
      }[]
    >(
      `SELECT b.id, s.start_at, s.end_at, c.code AS status_code,
              b.patient_profile_id, per.display_name AS patient_name
         FROM scheduling.appointment_bookings b
         JOIN scheduling.bookable_slots s ON s.id = b.bookable_slot_id
         JOIN scheduling.schedulable_resources r ON r.id = b.resource_id
         LEFT JOIN terminology.catalog_concepts c ON c.id = b.status_concept_id
         LEFT JOIN profiles.persons per ON per.id = b.patient_profile_id
        WHERE b.tenant_id = ? AND r.resource_ref_id = ?
          AND s.start_at >= ? AND s.start_at < ?
        ORDER BY s.start_at
        LIMIT 500`,
      [tenantId, practitionerProfileId, from, to],
    );
    return rows.map((row) => ({
      bookingId: row.id,
      startAt: new Date(row.start_at),
      endAt: new Date(row.end_at),
      statusCode: row.status_code,
      patientProfileId: row.patient_profile_id,
      patientName: row.patient_name,
    }));
  }

  /**
   * La membresía viva (activa o invitada) de la secretaria en la organización,
   * o una nueva `INVITED` con el rol acotado de apoyo.
   *
   * `INVITED` no cuenta para el token: mientras el vínculo no se acepte, la
   * organización sigue cerrada para ella.
   */
  async findOrCreateMembership(
    em: EntityManager,
    userId: string,
    tenantId: string,
    actorUserId: string,
  ): Promise<TenantMemberships> {
    const existing = await em.findOne(
      TenantMemberships,
      {
        userId,
        tenantId,
        statusConceptId: {
          $in: [DIR.MEMBERSHIP_ACTIVE, DIR.MEMBERSHIP_INVITED],
        },
      },
      { orderBy: { createdAt: 'ASC' } },
    );
    if (existing) return existing;
    const membership = em.create(
      TenantMemberships,
      {
        userId,
        tenantId,
        tenantRoleConceptId: DIR.ROLE_SUPPORT,
        statusConceptId: DIR.MEMBERSHIP_INVITED,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        invitedByUserId: actorUserId,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
    await em.flush();
    return membership;
  }

  /**
   * Abre la organización para el token: una membresía `INVITED` pasa a
   * `ACTIVE`. Una ya activa (con el rol que tenga) no se toca: aceptar un
   * vínculo sólo suma acceso.
   */
  async activateMembership(
    em: EntityManager,
    userId: string,
    tenantId: string,
    actorUserId: string,
  ): Promise<void> {
    const membership = await this.findOrCreateMembership(
      em,
      userId,
      tenantId,
      actorUserId,
    );
    if (membership.statusConceptId === DIR.MEMBERSHIP_INVITED) {
      membership.statusConceptId = DIR.MEMBERSHIP_ACTIVE;
      membership.startDate = new Date();
      touch(membership, actorUserId);
    }
  }

  /**
   * Cierra la membresía de apoyo si ya no queda ningún vínculo vivo en esa
   * organización. Sólo la de rol `DIR.ROLE_SUPPORT`: la de alguien que ya era
   * personal del hospital por otra vía no depende de estos vínculos.
   */
  async closeMembershipIfUnused(
    em: EntityManager,
    userId: string,
    tenantId: string,
    actorUserId: string,
  ): Promise<void> {
    const live = await this.findLinks(em, {
      supportUserId: userId,
      tenantId,
      statuses: ['PENDING', 'ACTIVE'],
    });
    if (live.length > 0) return;
    const memberships = await em.find(TenantMemberships, {
      userId,
      tenantId,
      tenantRoleConceptId: DIR.ROLE_SUPPORT,
      statusConceptId: { $in: [DIR.MEMBERSHIP_ACTIVE, DIR.MEMBERSHIP_INVITED] },
    });
    for (const membership of memberships) {
      membership.statusConceptId = DIR.MEMBERSHIP_ENDED;
      membership.endDate = new Date();
      touch(membership, actorUserId);
    }
  }

  /** Crea un vínculo de lugar `PENDING`. */
  createLocationLink(
    em: EntityManager,
    data: {
      readonly tenantMembershipId: string;
      readonly practiceId?: string;
      readonly practiceSiteId?: string;
      readonly clinicalUnitId?: string;
      readonly careSpaceId?: string;
      readonly accessScopeConceptId: string;
      readonly actorUserId: string;
    },
  ): OrganizationUserAssignments {
    return em.create(
      OrganizationUserAssignments,
      {
        tenantMembershipId: data.tenantMembershipId,
        practiceId: data.practiceId,
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        careSpaceId: data.careSpaceId,
        assignmentRoleConceptId: DELEG.ASSIGN_ROLE_SECRETARY,
        accessScopeConceptId: data.accessScopeConceptId,
        statusConceptId: LOCATION_STATUS.PENDING,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crea un vínculo con un doctor `PENDING`. */
  createPractitionerLink(
    em: EntityManager,
    data: {
      readonly practitionerRoleAssignmentId: string;
      readonly supportPersonId: string;
      readonly actorUserId: string;
    },
  ): PractitionerSupportAssignments {
    return em.create(
      PractitionerSupportAssignments,
      {
        practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
        supportProfileId: data.supportPersonId,
        supportRoleConceptId: PRAC.SUPPORT_ROLE_SECRETARY,
        statusConceptId: PRACTITIONER_STATUS.PENDING,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Cambia el estado de un vínculo.
   *
   * @param em - Transacción activa.
   * @param kind - Tabla del vínculo.
   * @param id - El vínculo.
   * @param status - Estado de destino.
   * @param actorUserId - Quien decide.
   */
  async setStatus(
    em: EntityManager,
    kind: SupportLinkKind,
    id: string,
    status: SupportLinkStatus,
    actorUserId: string,
  ): Promise<void> {
    const entity =
      kind === 'LOCATION'
        ? await em.findOneOrFail(OrganizationUserAssignments, { id })
        : await em.findOneOrFail(PractitionerSupportAssignments, { id });
    entity.statusConceptId = statusConceptFor(kind, status);
    const now = new Date();
    if (status === 'ACTIVE') entity.validFrom = now;
    if (status === 'ENDED') entity.validTo = now;
    touch(entity, actorUserId, now);
  }
}
