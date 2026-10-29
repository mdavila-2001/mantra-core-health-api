import { ForbiddenException, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { TenantMembershipsRepository } from '../../directory/repositories';
import { BranchMembershipsRepository } from '../../directory/repositories/branch-memberships.repository';
import type { PracticeSites } from '../entities';
import { practiceOutOfScope } from './practice-scope';

/**
 * Nivel con el que el actor llega a la estructura de un tenant.
 *
 * - `PLATFORM`: rol de plataforma (`SECURITY_ADMIN`/`SUPERADMIN`) con el tenant
 *   en contexto. Soporte: ve y escribe todo el tenant.
 * - `ORG`: `OWNER` de la organización, o `ADMIN` con alcance a todo el tenant.
 * - `BRANCH_ADMIN`: `ADMIN` con alcance `BRANCH`: administra los establecimientos
 *   de **sus** sucursales y no ve los demás.
 * - `BRANCH_MEMBER`: miembro con alcance `BRANCH` sin rol de administración: lee
 *   sólo los establecimientos de sus sucursales.
 * - `MEMBER`: miembro con alcance a todo el tenant sin rol de administración:
 *   lee todo, no escribe.
 * - `NONE`: no pertenece al tenant.
 */
export type StructureLevel =
  'PLATFORM' | 'ORG' | 'BRANCH_ADMIN' | 'BRANCH_MEMBER' | 'MEMBER' | 'NONE';

/** Lo que el actor puede hacer en el tenant de la petición. */
export interface StructureAccess {
  /** Nivel resuelto. */
  readonly level: StructureLevel;
  /** Sucursales a las que llega, sólo para `BRANCH_*`. */
  readonly branchIds: ReadonlySet<string>;
}

/**
 * Decide quién lee y quién escribe la estructura de un establecimiento
 * (CONTRATO-F0-F1 §3, «Autorización en TODAS»; `matriz-de-permisos` §1–2).
 *
 * Esta clase **no** reemplaza a `TenantAdministrationService`: sigue siendo la
 * regla de «quién administra la organización». Le agrega lo que ésta no mira:
 * el alcance `BRANCH`. `assertCanAdminister` deja pasar a cualquier `ADMIN` del
 * tenant aunque su membresía sea de una sola sucursal; para la estructura eso
 * sería darle al admin de una sucursal las demás.
 *
 * Reglas de respuesta (S5 ≠ S6):
 * - un establecimiento fuera del tenant o fuera de las sucursales del actor
 *   responde **404** (no se confirma que existe);
 * - uno dentro del alcance al que el actor sólo puede mirar responde **403** al
 *   intentar escribir.
 */
@Injectable()
export class StructureAccessService {
  /**
   * @param tenantMemberships - Membresías del tenant.
   * @param branchMemberships - Sucursales de cada membresía.
   */
  constructor(
    private readonly tenantMemberships: TenantMembershipsRepository,
    private readonly branchMemberships: BranchMembershipsRepository,
  ) {}

  /**
   * Resuelve el nivel del actor en el tenant del contexto.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant del contexto (`requireTenantId()`).
   * @param actor - Quien pide la operación.
   * @returns Nivel y sucursales.
   */
  async resolve(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<StructureAccess> {
    const none: ReadonlySet<string> = new Set();
    if (
      roleAuthorizesInTenant(actor, 'SECURITY_ADMIN', tenantId) ||
      roleAuthorizesInTenant(actor, 'SUPERADMIN', tenantId)
    ) {
      return { level: 'PLATFORM', branchIds: none };
    }
    const membership = await this.tenantMemberships.findActiveByUserTenant(
      em,
      actor.id,
      tenantId,
      DIR.MEMBERSHIP_ACTIVE,
    );
    if (!membership) return { level: 'NONE', branchIds: none };

    const adminRole =
      membership.tenantRoleConceptId === DIR.ROLE_OWNER ||
      membership.tenantRoleConceptId === DIR.ROLE_ADMIN;
    // El dueño de la organización no se acota por sucursal.
    if (membership.tenantRoleConceptId === DIR.ROLE_OWNER) {
      return { level: 'ORG', branchIds: none };
    }
    if (membership.accessScopeConceptId !== DIR.SCOPE_BRANCH) {
      return { level: adminRole ? 'ORG' : 'MEMBER', branchIds: none };
    }

    const assigned = await this.branchMemberships.findByMembershipAndStatus(
      em,
      membership.id,
      DIR.BRANCH_MEMBERSHIP_ACTIVE,
    );
    const branchIds = new Set<string>(assigned.map((row) => row.branchId));
    if (membership.primaryBranchId) branchIds.add(membership.primaryBranchId);
    return { level: adminRole ? 'BRANCH_ADMIN' : 'BRANCH_MEMBER', branchIds };
  }

  /**
   * ¿Ve el actor esta sede? Nunca para un tenant ajeno (eso ya lo filtra la
   * carga de la sede en el tenant activo).
   *
   * @param access - Resultado de {@link resolve}.
   * @param site - Sede ya cargada en el tenant.
   * @returns `true` si está dentro de su alcance.
   */
  canSee(
    access: StructureAccess,
    site: Pick<PracticeSites, 'branchId'>,
  ): boolean {
    switch (access.level) {
      case 'PLATFORM':
      case 'ORG':
      case 'MEMBER':
        return true;
      case 'BRANCH_ADMIN':
      case 'BRANCH_MEMBER':
        return Boolean(site.branchId) && access.branchIds.has(site.branchId!);
      case 'NONE':
        return false;
    }
  }

  /**
   * ¿Escribe el actor la estructura de esta sede? (crear, editar, mover, ciclo
   * de vida, vínculos).
   *
   * @param access - Resultado de {@link resolve}.
   * @param site - Sede ya cargada en el tenant.
   * @returns `true` si puede escribir.
   */
  canWriteStructure(
    access: StructureAccess,
    site: Pick<PracticeSites, 'branchId'>,
  ): boolean {
    if (access.level === 'PLATFORM' || access.level === 'ORG') return true;
    return access.level === 'BRANCH_ADMIN' && this.canSee(access, site);
  }

  /**
   * Lectura de una sede: 404 si el actor no la ve.
   *
   * @param access - Resultado de {@link resolve}.
   * @param site - Sede ya cargada en el tenant.
   * @throws ResourceNotFoundException (`PRACTICE_RESOURCE_OUT_OF_SCOPE`).
   */
  assertCanRead(
    access: StructureAccess,
    site: Pick<PracticeSites, 'branchId'>,
  ): void {
    if (!this.canSee(access, site))
      throw practiceOutOfScope('Sitio no encontrado');
  }

  /**
   * Escritura de estructura: 404 fuera del alcance, 403 dentro de él sin permiso.
   *
   * @param access - Resultado de {@link resolve}.
   * @param site - Sede ya cargada en el tenant.
   * @throws ResourceNotFoundException si no la ve.
   * @throws ForbiddenException si la ve pero no la administra.
   */
  assertCanWriteStructure(
    access: StructureAccess,
    site: Pick<PracticeSites, 'branchId'>,
  ): void {
    this.assertCanRead(access, site);
    if (!this.canWriteStructure(access, site)) {
      throw new ForbiddenException(
        'Se requiere administrar la organización o la sucursal del establecimiento',
      );
    }
  }

  /**
   * Escritura regulatoria (SNIS, tipología, habilitaciones, capacidad
   * declarada): sólo la organización y la plataforma. El administrador de
   * sucursal **ve** lo regulatorio y no lo cambia (`matriz-de-permisos` §2,
   * nota 6).
   *
   * @param access - Resultado de {@link resolve}.
   * @param site - Sede ya cargada en el tenant.
   * @throws ResourceNotFoundException si no la ve.
   * @throws ForbiddenException si la ve pero no administra la organización.
   */
  assertCanWriteRegulatory(
    access: StructureAccess,
    site: Pick<PracticeSites, 'branchId'>,
  ): void {
    this.assertCanRead(access, site);
    if (access.level !== 'PLATFORM' && access.level !== 'ORG') {
      throw new ForbiddenException(
        'Los datos regulatorios los administra la organización',
      );
    }
  }
}
