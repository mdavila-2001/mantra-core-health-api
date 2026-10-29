import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { DIR } from '../../directory/directory.concepts';
import { spaceBelongsToUnit } from '../../practice/services/space-unit-membership';
import {
  StructureAccessService,
  type StructureAccess,
} from '../../practice/services/structure-access.service';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';

/** Objetivos de una asignación (los ids que la fila lleva). */
export interface AssignmentTargets {
  practiceId?: string | null;
  practiceSiteId?: string | null;
  clinicalUnitId?: string | null;
  careSpaceId?: string | null;
  diagnosticUnitId?: string | null;
  pharmacyId?: string | null;
}

/** Alcance y rol resueltos contra el tenant, listos para autorizar y guardar. */
export interface ResolvedAssignmentScope {
  /** Código del alcance (`TENANT`, `PRACTICE`, `SITE`, `UNIT`, `SPACE`). */
  readonly scope: string;
  /** Código del rol. */
  readonly role: string;
  /** Objetivos que se guardan (los que no aplican quedan `null`). */
  readonly targets: Required<{
    [K in keyof AssignmentTargets]: string | null;
  }>;
  /** Sede que contiene el objetivo, si lo hay. */
  readonly siteId: string | null;
  /** Sucursal de esa sede, si la tiene. */
  readonly branchId: string | null;
}

/** Qué objetivo exige cada alcance. */
const TARGET_OF_SCOPE: Readonly<
  Record<string, keyof AssignmentTargets | undefined>
> = {
  TENANT: undefined,
  PRACTICE: 'practiceId',
  SITE: 'practiceSiteId',
  UNIT: 'clinicalUnitId',
  SPACE: 'careSpaceId',
};

/** Quién otorga un alcance sin sede (organización o práctica). */
const ORG_REQUIRED_ROLES = ['ORG_ADMIN', 'SUPERADMIN'] as const;
const SITE_ASSIGNERS = ['ORG_ADMIN', 'BRANCH_ADMIN', 'SUPERADMIN'] as const;

const EMPTY_TARGETS: ResolvedAssignmentScope['targets'] = {
  practiceId: null,
  practiceSiteId: null,
  clinicalUnitId: null,
  careSpaceId: null,
  diagnosticUnitId: null,
  pharmacyId: null,
};

/**
 * Valida que lo que una asignación apunta sea del tenant y coherente con su alcance,
 * y decide quién la puede otorgar (CONTRATO-F2-F5 F5g).
 *
 * - Todo id del cuerpo (sede, unidad, espacio, práctica, farmacia, unidad diagnóstica,
 *   membresía, supervisor) se busca **en el tenant del contexto**: uno inexistente, de
 *   otro tenant o fuera de la sucursal del actor responde el mismo 404.
 * - Organización y plataforma otorgan cualquier alcance del tenant; el administrador
 *   de sucursal sólo SITE, UNIT o SPACE dentro de **sus** sucursales y nunca a su
 *   propia membresía (separación de funciones).
 */
@Injectable()
export class OrgAssignmentScopeService {
  /**
   * @param structure - Nivel del actor en la estructura (organización, sucursal).
   */
  constructor(private readonly structure: StructureAccessService) {}

  /** El 404 uniforme de los objetivos. */
  notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Recurso no encontrado',
      undefined,
      DelegatedAccessErrorReason.DELEGATED_SCOPE_TARGET_NOT_FOUND,
    );
  }

  /**
   * Resuelve rol, alcance y objetivos contra el tenant.
   *
   * @param tx - Transacción o contexto activo.
   * @param tenantId - Tenant del contexto.
   * @param role - Código del rol.
   * @param scope - Código del alcance.
   * @param input - Objetivos del cuerpo.
   * @returns El alcance resuelto.
   * @throws ResourceNotFoundException (404) si algún id no es del tenant.
   * @throws PreconditionFailedException (422 `ASSIGNMENT_SCOPE_TARGET_REQUIRED` / `…_MISMATCH`).
   */
  async resolve(
    tx: EntityManager,
    tenantId: string,
    role: string,
    scope: string,
    input: AssignmentTargets,
  ): Promise<ResolvedAssignmentScope> {
    const required = TARGET_OF_SCOPE[scope];
    if (required && !input[required]) {
      throw new PreconditionFailedException(
        'El alcance elegido exige su objetivo',
        { scope, requiredTarget: required },
        DelegatedAccessErrorReason.ASSIGNMENT_SCOPE_TARGET_REQUIRED,
      );
    }
    if (role === 'UNIT_HEAD' && scope !== 'UNIT') {
      throw this.mismatch(
        scope,
        'El jefe de servicio se asigna con alcance de unidad',
      );
    }
    // Un objetivo que el alcance no usa sólo se admite como contexto del que sí usa.
    this.assertNoStrayTargets(scope, input);

    const site = input.practiceSiteId
      ? await this.one(
          tx,
          `select id, practice_id, branch_id from practice.practice_sites where id = ? and tenant_id = ?`,
          [input.practiceSiteId, tenantId],
        )
      : null;
    const unit = input.clinicalUnitId
      ? await this.one(
          tx,
          `select u.id, u.practice_site_id, s.practice_id, s.branch_id
             from practice.clinical_units u
             join practice.practice_sites s on s.id = u.practice_site_id and s.tenant_id = u.tenant_id
            where u.id = ? and u.tenant_id = ?`,
          [input.clinicalUnitId, tenantId],
        )
      : null;
    const space = input.careSpaceId
      ? await this.one(
          tx,
          `select c.id, c.practice_site_id, s.practice_id, s.branch_id
             from practice.care_spaces c
             join practice.practice_sites s on s.id = c.practice_site_id and s.tenant_id = c.tenant_id
            where c.id = ? and c.tenant_id = ?`,
          [input.careSpaceId, tenantId],
        )
      : null;
    const practice = input.practiceId
      ? await this.one(
          tx,
          `select id from practice.practices where id = ? and tenant_id = ?`,
          [input.practiceId, tenantId],
        )
      : null;
    if (input.pharmacyId) {
      await this.one(
        tx,
        `select id from pharmacy.pharmacies where id = ? and tenant_id = ?`,
        [input.pharmacyId, tenantId],
      );
    }
    if (input.diagnosticUnitId) {
      await this.one(
        tx,
        `select id from diagnostic_units.diagnostic_units where id = ? and tenant_id = ?`,
        [input.diagnosticUnitId, tenantId],
      );
    }

    // Coherencia: lo que se da de contexto tiene que ser de la misma sede / práctica.
    const holder = space ?? unit ?? site;
    const siteId = site
      ? String(site.id)
      : holder
        ? String(holder.practice_site_id)
        : null;
    if (site && unit && String(unit.practice_site_id) !== siteId) {
      throw this.mismatch(scope, 'La unidad no es de la sede indicada');
    }
    if (site && space && String(space.practice_site_id) !== siteId) {
      throw this.mismatch(scope, 'El espacio no es de la sede indicada');
    }
    if (
      unit &&
      space &&
      String(space.practice_site_id) !== String(unit.practice_site_id)
    ) {
      throw this.mismatch(scope, 'El espacio no es de la sede de la unidad');
    }
    const practiceOfHolder = holder ? String(holder.practice_id) : null;
    if (
      practice &&
      practiceOfHolder &&
      String(practice.id) !== practiceOfHolder
    ) {
      throw this.mismatch(scope, 'La práctica no es la de la sede indicada');
    }
    if (unit && space) {
      const linked = await spaceBelongsToUnit(
        tx,
        String(space.id),
        String(unit.id),
      );
      if (!linked) {
        throw this.mismatch(
          scope,
          'El espacio no pertenece a la unidad indicada',
        );
      }
    }

    return {
      scope,
      role,
      targets: {
        ...EMPTY_TARGETS,
        practiceId: input.practiceId ?? null,
        practiceSiteId: input.practiceSiteId ?? null,
        clinicalUnitId: input.clinicalUnitId ?? null,
        careSpaceId: input.careSpaceId ?? null,
        diagnosticUnitId: input.diagnosticUnitId ?? null,
        pharmacyId: input.pharmacyId ?? null,
      },
      siteId,
      branchId: holder ? ((holder.branch_id as string | null) ?? null) : null,
    };
  }

  /**
   * Sede y sucursal que contiene una asignación **ya guardada**, sin revalidar su
   * coherencia (para autorizar un cambio sobre filas anteriores a estas reglas).
   */
  async locate(
    tx: EntityManager,
    tenantId: string,
    row: AssignmentTargets,
  ): Promise<{ siteId: string | null; branchId: string | null }> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select s.id as site_id, s.branch_id
         from practice.practice_sites s
        where s.tenant_id = ?
          and s.id = coalesce(
            ?::uuid,
            (select u.practice_site_id from practice.clinical_units u where u.id = ?::uuid),
            (select c.practice_site_id from practice.care_spaces c where c.id = ?::uuid))`,
      [
        tenantId,
        row.practiceSiteId ?? null,
        row.clinicalUnitId ?? null,
        row.careSpaceId ?? null,
      ],
    );
    if (rows.length === 0) return { siteId: null, branchId: null };
    return {
      siteId: String(rows[0].site_id),
      branchId: rows[0].branch_id ? String(rows[0].branch_id) : null,
    };
  }

  /** Nivel del actor en el tenant. */
  access(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<StructureAccess> {
    return this.structure.resolve(tx, tenantId, actor);
  }

  /**
   * Autoriza otorgar o cambiar una asignación sobre {@link where}.
   *
   * @param access - Nivel del actor ({@link access}).
   * @param where - Sede y sucursal que contiene el objetivo (`null` si no hay).
   * @param grantee - Titular de la membresía que recibe el rol.
   * @param actor - Quien lo hace.
   * @throws ResourceNotFoundException (404) si el actor no pertenece al tenant o la sede no es de sus sucursales.
   * @throws InsufficientRoleException (403 `ASSIGNMENT_ACTION_NOT_ALLOWED`) si ve el tenant pero no puede otorgar.
   */
  assertCanManage(
    access: StructureAccess,
    where: { siteId: string | null; branchId: string | null },
    grantee: { userId: string },
    actor: AuthenticatedUser,
  ): void {
    switch (access.level) {
      case 'PLATFORM':
      case 'ORG':
        return;
      case 'BRANCH_ADMIN': {
        if (!where.siteId) {
          throw this.notAllowed(ORG_REQUIRED_ROLES);
        }
        if (!where.branchId || !access.branchIds.has(where.branchId)) {
          throw this.notFound();
        }
        if (grantee.userId === actor.id) {
          throw new InsufficientRoleException(
            'Un administrador de sucursal no se asigna roles operativos a sí mismo',
            { requiredRoles: [...SITE_ASSIGNERS] },
            DelegatedAccessErrorReason.ASSIGNMENT_SELF_NOT_ALLOWED,
          );
        }
        return;
      }
      case 'NONE':
        throw this.notFound();
      default:
        throw this.notAllowed(SITE_ASSIGNERS);
    }
  }

  /**
   * ¿Ve el actor las asignaciones de esta sede? (lecturas).
   *
   * @returns `true` para organización y plataforma; para sucursal, sólo sus sedes.
   */
  canSee(
    access: StructureAccess,
    where: { siteId: string | null; branchId: string | null },
  ): boolean {
    if (access.level === 'PLATFORM' || access.level === 'ORG') return true;
    if (access.level === 'BRANCH_ADMIN') {
      return Boolean(
        where.siteId && where.branchId && access.branchIds.has(where.branchId),
      );
    }
    return false;
  }

  /** La membresía (del tenant) que recibe el rol. */
  async membership(
    tx: EntityManager,
    tenantId: string,
    membershipId: string,
  ): Promise<{ id: string; userId: string }> {
    const row = await this.one(
      tx,
      `select id, user_id from directory.tenant_memberships
        where id = ? and tenant_id = ? and status_concept_id = ?`,
      [membershipId, tenantId, DIR.MEMBERSHIP_ACTIVE],
    );
    return { id: String(row.id), userId: String(row.user_id) };
  }

  /** El titular de la membresía de una asignación guardada, si es del tenant (activa o no). */
  async membershipOwner(
    tx: EntityManager,
    tenantId: string,
    membershipId: string,
  ): Promise<{ id: string; userId: string } | null> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select id, user_id from directory.tenant_memberships where id = ? and tenant_id = ?`,
      [membershipId, tenantId],
    );
    return rows.length === 0
      ? null
      : { id: String(rows[0].id), userId: String(rows[0].user_id) };
  }

  /** El supervisor tiene que ser miembro activo del tenant. */
  async assertSupervisor(
    tx: EntityManager,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    await this.one(
      tx,
      `select id from directory.tenant_memberships
        where user_id = ? and tenant_id = ? and status_concept_id = ?
        limit 1`,
      [userId, tenantId, DIR.MEMBERSHIP_ACTIVE],
    );
  }

  /**
   * Pre-valida el jefe de servicio único vigente (B.5-29); la base es la red
   * (`ex_org_user_assignments_unit_head`).
   *
   * @throws ConflictException (409 `UNIT_HEAD_ALREADY_ASSIGNED`).
   */
  async assertNoUnitHeadOverlap(
    tx: EntityManager,
    unitId: string,
    window: { from: Date | null; to: Date | null },
    excludeId?: string,
  ): Promise<void> {
    const rows = await tx.execute<{ id: string }[]>(
      `select a.id from delegated_access.organization_user_assignments a
        where a.clinical_unit_id = ?
          and a.assignment_role_concept_id = ?
          and a.status_concept_id = ?
          and tstzrange(a.valid_from, a.valid_to, '[)') && tstzrange(?::timestamptz, ?::timestamptz, '[)')
          ${excludeId ? 'and a.id <> ?' : ''}
        limit 1`,
      [
        unitId,
        DELEG.ASSIGN_ROLE_UNIT_HEAD,
        CONCEPTS.STATE_ACTIVE,
        window.from,
        window.to,
        ...(excludeId ? [excludeId] : []),
      ],
    );
    if (rows.length > 0) {
      throw new ConflictException(
        'La unidad ya tiene un jefe de servicio vigente en ese período',
        undefined,
        DelegatedAccessErrorReason.UNIT_HEAD_ALREADY_ASSIGNED,
      );
    }
  }

  // --------------------------------------------------------------- internos

  private notAllowed(roles: readonly string[]): InsufficientRoleException {
    return new InsufficientRoleException(
      'Ningún rol suyo permite otorgar este alcance',
      { requiredRoles: [...roles] },
      DelegatedAccessErrorReason.ASSIGNMENT_ACTION_NOT_ALLOWED,
    );
  }

  private mismatch(
    scope: string,
    message: string,
  ): PreconditionFailedException {
    return new PreconditionFailedException(
      message,
      { scope },
      DelegatedAccessErrorReason.ASSIGNMENT_SCOPE_TARGET_MISMATCH,
    );
  }

  /** Cada alcance acepta su objetivo y, como contexto, los de nivel superior. */
  private assertNoStrayTargets(scope: string, input: AssignmentTargets): void {
    const allowed: Record<string, (keyof AssignmentTargets)[]> = {
      TENANT: [],
      PRACTICE: ['practiceId'],
      SITE: ['practiceId', 'practiceSiteId'],
      UNIT: ['practiceId', 'practiceSiteId', 'clinicalUnitId'],
      SPACE: ['practiceId', 'practiceSiteId', 'clinicalUnitId', 'careSpaceId'],
    };
    const ok = allowed[scope] ?? [];
    // Farmacia y unidad diagnóstica no son un alcance: se aceptan como contexto de cualquiera.
    const stray = (
      ['practiceId', 'practiceSiteId', 'clinicalUnitId', 'careSpaceId'] as const
    ).filter((key) => input[key] && !ok.includes(key));
    if (stray.length > 0) {
      throw this.mismatch(scope, 'Hay objetivos que el alcance elegido no usa');
    }
  }

  /** Una fila del tenant o el 404 uniforme. */
  private async one(
    tx: EntityManager,
    sql: string,
    params: unknown[],
  ): Promise<Record<string, unknown>> {
    const rows = await tx.execute<Record<string, unknown>[]>(sql, params);
    if (rows.length === 0) throw this.notFound();
    return rows[0];
  }
}
