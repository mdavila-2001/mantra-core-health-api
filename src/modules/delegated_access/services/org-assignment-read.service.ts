import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import type { StructureAccess } from '../../practice/services/structure-access.service';
import { FUNCTIONS } from '../../practice/infrastructure-catalog';
import { PRAC } from '../../practice/practice.concepts';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
import type {
  AssignmentCatalogView,
  AssignmentNodeRef,
  AssignmentTargetView,
  OrgAssignmentView,
} from '../dto/org-assignment-read.types';
import type { AssignmentTargetsQueryDto } from '../dto/org-assignment-targets-query.dto';
import {
  ACCESS_SCOPE_BY_CONCEPT,
  ASSIGNMENT_ROLE_BY_CONCEPT,
  STATUS,
} from './concept-maps';
import { OrgAssignmentScopeService } from './org-assignment-scope.service';

/** Roles operativos de la infraestructura (los que `InfrastructureAccessService` evalúa). */
const OPERATIONAL_ROLES: Readonly<Record<string, string>> = {
  NURSE: 'Enfermería',
  NURSE_SUPERVISOR: 'Supervisión de enfermería',
  ADMISSION: 'Admisión',
  HOUSEKEEPING: 'Limpieza',
  HOUSEKEEPING_SUPERVISOR: 'Supervisión de limpieza',
  MAINTENANCE: 'Mantenimiento y biomédica',
  OR_MANAGER: 'Jefatura de quirófano',
  INFECTION_CONTROL: 'Control de infecciones',
  BILLING: 'Facturación',
};

const ALL_SCOPES = ['TENANT', 'PRACTICE', 'SITE', 'UNIT', 'SPACE'] as const;

/** Catálogo fijo: roles con sus alcances y alcances con su objetivo. */
export const ASSIGNMENT_CATALOG: AssignmentCatalogView = {
  roles: [
    ...Object.entries(OPERATIONAL_ROLES).map(([code, label]) => ({
      code,
      label,
      operational: true,
      allowedScopes: ALL_SCOPES,
    })),
    {
      code: 'UNIT_HEAD',
      label: 'Jefatura de servicio',
      operational: false,
      allowedScopes: ['UNIT'],
    },
    ...[
      ['STAFF', 'Personal'],
      ['SECRETARY', 'Secretaría'],
      ['ASSISTANT', 'Asistente'],
    ].map(([code, label]) => ({
      code,
      label,
      operational: false,
      allowedScopes: ALL_SCOPES,
    })),
  ],
  scopes: [
    { code: 'TENANT', label: 'Toda la organización', target: null },
    { code: 'PRACTICE', label: 'Una práctica', target: 'practiceId' },
    { code: 'SITE', label: 'Un establecimiento', target: 'practiceSiteId' },
    { code: 'UNIT', label: 'Una unidad clínica', target: 'clinicalUnitId' },
    { code: 'SPACE', label: 'Un espacio', target: 'careSpaceId' },
  ],
};

/** Una fila cruda de la lectura de asignaciones. */
interface AssignmentRow {
  id: string;
  tenant_membership_id: string;
  assignment_role_concept_id: string;
  access_scope_concept_id: string;
  status_concept_id: string;
  supervisor_user_id: string | null;
  valid_from: Date | null;
  valid_to: Date | null;
  row_version: number;
  practice_id: string | null;
  practice_name: string | null;
  practice_code: string | null;
  site_id: string | null;
  site_code: string | null;
  site_name: string | null;
  branch_id: string | null;
  unit_id: string | null;
  unit_code: string | null;
  unit_name: string | null;
  space_id: string | null;
  space_code: string | null;
  space_name: string | null;
}

const ASSIGNMENT_SELECT = `
  select a.id, a.tenant_membership_id, a.assignment_role_concept_id, a.access_scope_concept_id,
         a.status_concept_id, a.supervisor_user_id, a.valid_from, a.valid_to, a.row_version,
         p.id as practice_id, p.code as practice_code, p.name as practice_name,
         s.id as site_id, s.code as site_code, s.name as site_name, s.branch_id,
         u.id as unit_id, u.code as unit_code, u.name as unit_name,
         c.id as space_id, c.code as space_code, c.name as space_name
    from delegated_access.organization_user_assignments a
    join directory.tenant_memberships m on m.id = a.tenant_membership_id
    left join practice.clinical_units u on u.id = a.clinical_unit_id and u.tenant_id = m.tenant_id
    left join practice.care_spaces c on c.id = a.care_space_id and c.tenant_id = m.tenant_id
    left join practice.practice_sites s on s.tenant_id = m.tenant_id
         and s.id = coalesce(a.practice_site_id, u.practice_site_id, c.practice_site_id)
    left join practice.practices p on p.tenant_id = m.tenant_id
         and p.id = coalesce(a.practice_id, s.practice_id)
   where m.tenant_id = ?`;

const ref = (
  id: string | null,
  code: string | null,
  name: string | null,
): AssignmentNodeRef | null =>
  id ? { id, code, name: name ?? code ?? id } : null;

/**
 * Lecturas del acceso delegado para las pantallas de asignación: las asignaciones de
 * una membresía con su alcance resuelto (nombres, no UUID), el catálogo de roles y
 * alcances y los candidatos de los selectores sede → unidad → espacio.
 *
 * Todo se acota al tenant del contexto y al alcance del actor: una sede fuera de sus
 * sucursales no figura, y una asignación que no ve responde 404.
 */
@Injectable()
export class OrgAssignmentReadService {
  /**
   * @param em - Contexto de persistencia.
   * @param scope - Resolución de alcance del actor.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly scope: OrgAssignmentScopeService,
  ) {}

  /** Catálogo de roles y alcances (sin datos del tenant). */
  catalog(): AssignmentCatalogView {
    return ASSIGNMENT_CATALOG;
  }

  /**
   * Asignaciones de una membresía del tenant que el actor puede ver.
   *
   * @param membershipId - Membresía.
   * @param actor - Quien lee.
   */
  async listForMembership(
    membershipId: string,
    actor: AuthenticatedUser,
  ): Promise<OrgAssignmentView[]> {
    const tenantId = requireTenantId();
    const tx = this.em.fork();
    const access = await this.assertCanRead(tx, tenantId, actor);
    const owner = await this.scope.membershipOwner(tx, tenantId, membershipId);
    if (!owner) throw this.scope.notFound();
    const rows = await tx.execute<AssignmentRow[]>(
      `${ASSIGNMENT_SELECT} and a.tenant_membership_id = ? order by a.created_at desc, a.id`,
      [tenantId, membershipId],
    );
    return rows
      .filter((row) => this.visible(access, row))
      .map((row) => this.view(row));
  }

  /**
   * Una asignación del tenant, si el actor la ve.
   *
   * @throws ResourceNotFoundException (404) si no existe, es de otro tenant o está fuera de su alcance.
   */
  async get(id: string, actor: AuthenticatedUser): Promise<OrgAssignmentView> {
    const tenantId = requireTenantId();
    const tx = this.em.fork();
    const access = await this.assertCanRead(tx, tenantId, actor);
    const rows = await tx.execute<AssignmentRow[]>(
      `${ASSIGNMENT_SELECT} and a.id = ?`,
      [tenantId, id],
    );
    const row = rows[0];
    if (!row || !this.visible(access, row)) {
      throw new ResourceNotFoundException('Asignación no encontrada', {
        assignmentId: id,
      });
    }
    return this.view(row);
  }

  /**
   * Candidatos de un selector, acotados a lo que el actor puede otorgar.
   *
   * @param query - Qué nodo, de qué sede, con qué texto.
   * @param actor - Quien lee.
   */
  async targets(
    query: AssignmentTargetsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<AssignmentTargetView[]> {
    const tenantId = requireTenantId();
    const tx = this.em.fork();
    const access = await this.assertCanRead(tx, tenantId, actor);
    const limit = query.limit ?? 50;
    const like = query.q ? `%${query.q.replace(/[\\%_]/g, '\\$&')}%` : null;
    const wide = access.level === 'PLATFORM' || access.level === 'ORG';

    if (query.kind === 'practice') {
      if (!wide) throw this.notAllowed();
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select id, code, name from practice.practices
          where tenant_id = ? ${like ? 'and (code ilike ? or name ilike ?)' : ''}
          order by name limit ?`,
        [tenantId, ...(like ? [like, like] : []), limit],
      );
      return rows.map((r) => ({
        id: String(r.id),
        code: r.code ? String(r.code) : null,
        name: String(r.name),
        siteId: null,
        parentId: null,
        functionCode: null,
      }));
    }

    if (query.kind === 'site') {
      const branches = wide ? null : [...access.branchIds];
      if (branches && branches.length === 0) return [];
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select id, code, name from practice.practice_sites
          where tenant_id = ?
            ${branches ? `and branch_id in (${branches.map(() => '?').join(', ')})` : ''}
            ${like ? 'and (code ilike ? or name ilike ?)' : ''}
          order by name limit ?`,
        [tenantId, ...(branches ?? []), ...(like ? [like, like] : []), limit],
      );
      return rows.map((r) => ({
        id: String(r.id),
        code: r.code ? String(r.code) : null,
        name: String(r.name),
        siteId: String(r.id),
        parentId: null,
        functionCode: null,
      }));
    }

    // Unidades y espacios cuelgan de una sede que el actor tiene que ver.
    if (!query.siteId) {
      throw new PreconditionFailedException(
        'La sede es obligatoria para listar unidades y espacios',
        { requiredTarget: 'siteId' },
        DelegatedAccessErrorReason.ASSIGNMENT_SCOPE_TARGET_REQUIRED,
      );
    }
    const where = await this.scope.locate(tx, tenantId, {
      practiceSiteId: query.siteId,
    });
    if (!where.siteId || !this.scope.canSee(access, where)) {
      throw this.scope.notFound();
    }

    if (query.kind === 'unit') {
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select id, code, name, parent_unit_id from practice.clinical_units
          where tenant_id = ? and practice_site_id = ?
            ${like ? 'and (code ilike ? or name ilike ?)' : ''}
          order by name limit ?`,
        [tenantId, query.siteId, ...(like ? [like, like] : []), limit],
      );
      return rows.map((r) => ({
        id: String(r.id),
        code: r.code ? String(r.code) : null,
        name: String(r.name),
        siteId: query.siteId!,
        parentId: r.parent_unit_id ? String(r.parent_unit_id) : null,
        functionCode: null,
      }));
    }

    const rows = await tx.execute<Record<string, unknown>[]>(
      `select cs.id, cs.code, cs.name, cs.parent_space_id, cs.space_type_concept_id
         from practice.care_spaces cs
        where cs.tenant_id = ? and cs.practice_site_id = ?
          and cs.status_concept_id <> ?
          ${like ? 'and (cs.code ilike ? or cs.name ilike ?)' : ''}
          ${
            query.unitId
              ? `and (cs.clinical_unit_id = ? or exists (
              select 1 from practice.space_unit_assignments sua
               where sua.care_space_id = cs.id and sua.clinical_unit_id = ?
                 and (sua.valid_to is null or sua.valid_to > now())))`
              : ''
          }
        order by cs.name limit ?`,
      [
        tenantId,
        query.siteId,
        PRAC.SPACE_RETIRED,
        ...(like ? [like, like] : []),
        ...(query.unitId ? [query.unitId, query.unitId] : []),
        limit,
      ],
    );
    return rows.map((r) => ({
      id: String(r.id),
      code: r.code ? String(r.code) : null,
      name: String(r.name),
      siteId: query.siteId!,
      parentId: r.parent_space_id ? String(r.parent_space_id) : null,
      functionCode:
        FUNCTIONS.byConceptId(String(r.space_type_concept_id))?.code ?? null,
    }));
  }

  // --------------------------------------------------------------- internos

  /** Lee sólo organización, plataforma y administración de sucursal. */
  private async assertCanRead(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<StructureAccess> {
    const access = await this.scope.access(tx, tenantId, actor);
    if (access.level === 'NONE') throw this.scope.notFound();
    if (
      access.level !== 'PLATFORM' &&
      access.level !== 'ORG' &&
      access.level !== 'BRANCH_ADMIN'
    ) {
      throw this.notAllowed();
    }
    return access;
  }

  private notAllowed(): InsufficientRoleException {
    return new InsufficientRoleException(
      'Ningún rol suyo permite ver las asignaciones',
      { requiredRoles: ['ORG_ADMIN', 'BRANCH_ADMIN', 'SUPERADMIN'] },
      DelegatedAccessErrorReason.ASSIGNMENT_ACTION_NOT_ALLOWED,
    );
  }

  private visible(access: StructureAccess, row: AssignmentRow): boolean {
    return this.scope.canSee(access, {
      siteId: row.site_id,
      branchId: row.branch_id,
    });
  }

  private view(row: AssignmentRow): OrgAssignmentView {
    return {
      id: String(row.id),
      tenantMembershipId: String(row.tenant_membership_id),
      role:
        ASSIGNMENT_ROLE_BY_CONCEPT[row.assignment_role_concept_id] ?? 'STAFF',
      accessScope:
        ACCESS_SCOPE_BY_CONCEPT[row.access_scope_concept_id] ?? 'TENANT',
      status:
        row.status_concept_id === STATUS.ACTIVE
          ? 'ACTIVE'
          : row.status_concept_id === STATUS.SUSPENDED
            ? 'SUSPENDED'
            : 'OTHER',
      practice: ref(row.practice_id, row.practice_code, row.practice_name),
      site: ref(row.site_id, row.site_code, row.site_name),
      unit: ref(row.unit_id, row.unit_code, row.unit_name),
      space: ref(row.space_id, row.space_code, row.space_name),
      supervisorUserId: row.supervisor_user_id,
      validFrom: row.valid_from ? new Date(row.valid_from).toISOString() : null,
      validTo: row.valid_to ? new Date(row.valid_to).toISOString() : null,
      rowVersion: Number(row.row_version),
    };
  }
}
