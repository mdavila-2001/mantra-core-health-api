import { ForbiddenException, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { BranchMemberships } from '../../directory/entities';
import { TenantMembershipsRepository } from '../../directory/repositories';
import { TenantAdministrationService } from '../../directory/services/tenant-administration.service';
import type { CareSpaces, ClinicalUnits, PracticeSites } from '../entities';
import {
  CareSpacesRepository,
  ClinicalUnitsRepository,
  PracticeSitesRepository,
} from '../repositories';

/** Roles globales de plataforma (mismos que `TenantAdministrationService`). */
const PLATFORM_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'];

/**
 * Quién puede leer y escribir la estructura de un establecimiento (F1,
 * contrato §3 «Autorización»; matriz de permisos del PLAN §3).
 *
 * - **Pertenencia:** sede, unidad o espacio de otro tenant → 404, igual que
 *   uno inexistente. Se compara `tenant_id` de la fila (v4.2.67/67b), no el de
 *   la práctica: es la columna que el RLS y las FK compuestas protegen.
 * - **Lectura:** miembro activo del tenant o plataforma
 *   (`TenantAdministrationService.assertCanRead`).
 * - **Escritura de nivel organización** (sede, datos regulatorios,
 *   habilitaciones, capacidad declarada): plataforma, OWNER, o ADMIN con
 *   alcance de toda la organización. Un ADMIN con alcance `BRANCH` sólo «ve»
 *   esto (PLAN §3).
 * - **Escritura de estructura de una sede** (espacios, unidades, vínculos): lo
 *   anterior **o** el admin de la sucursal de esa sede: membresía activa rol
 *   ADMIN, alcance `BRANCH`, y la sucursal de la sede (`practice_sites.
 *   branch_id`) es su `primary_branch_id` o una `branch_membership` activa.
 *   Una sede sin sucursal no tiene admin de sucursal.
 */
@Injectable()
export class StructureAccessService {
  /**
   * @param tenantAdmin - Regla de administración de la organización.
   * @param membershipsRepo - Membresías del actor.
   * @param sitesRepo - Sedes.
   * @param unitsRepo - Unidades clínicas.
   * @param spacesRepo - Espacios.
   */
  constructor(
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly membershipsRepo: TenantMembershipsRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly spacesRepo: CareSpacesRepository,
  ) {}

  /**
   * Sede del tenant activo, o 404.
   *
   * @param tx - Contexto.
   * @param siteId - Sede.
   * @param tenantId - Tenant activo.
   */
  async requireSite(
    tx: EntityManager,
    siteId: string,
    tenantId: string,
  ): Promise<PracticeSites> {
    const site = await this.sitesRepo.findById(tx, siteId);
    if (!site || site.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Sitio no encontrado', { siteId });
    }
    return site;
  }

  /**
   * Espacio del tenant activo, o 404.
   *
   * @param tx - Contexto.
   * @param spaceId - Espacio.
   * @param tenantId - Tenant activo.
   */
  async requireSpace(
    tx: EntityManager,
    spaceId: string,
    tenantId: string,
  ): Promise<CareSpaces> {
    const space = await this.spacesRepo.findById(tx, spaceId);
    if (!space || space.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Espacio no encontrado', { spaceId });
    }
    return space;
  }

  /**
   * Unidad del tenant activo, o 404.
   *
   * @param tx - Contexto.
   * @param unitId - Unidad.
   * @param tenantId - Tenant activo.
   */
  async requireUnit(
    tx: EntityManager,
    unitId: string,
    tenantId: string,
  ): Promise<ClinicalUnits> {
    const unit = await this.unitsRepo.findById(tx, unitId);
    if (!unit || unit.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Unidad clínica no encontrada', {
        unitId,
      });
    }
    return unit;
  }

  /**
   * Exige poder leer el tenant (miembro activo o plataforma).
   *
   * @param tx - Contexto.
   * @param tenantId - Tenant.
   * @param actor - Actor.
   */
  assertCanRead(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    return this.tenantAdmin.assertCanRead(tx, tenantId, actor);
  }

  /**
   * Exige poder administrar la organización entera.
   *
   * @param tx - Contexto.
   * @param tenantId - Tenant.
   * @param actor - Actor.
   * @throws ForbiddenException si no es plataforma, OWNER ni ADMIN de toda la org.
   */
  async assertCanAdministerOrganization(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (await this.isOrganizationAdmin(tx, tenantId, actor)) return;
    throw new ForbiddenException(
      'Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma',
    );
  }

  /**
   * Exige poder escribir la estructura de una sede.
   *
   * @param tx - Contexto.
   * @param site - Sede (ya comprobada en el tenant).
   * @param actor - Actor.
   * @throws ForbiddenException si no es admin de la org ni de la sucursal de la sede.
   */
  async assertCanWriteSite(
    tx: EntityManager,
    site: PracticeSites,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (await this.isOrganizationAdmin(tx, site.tenantId, actor)) return;
    if (await this.isBranchAdmin(tx, site, actor)) return;
    throw new ForbiddenException(
      'Se requiere administrar la organización o la sucursal de esta sede',
    );
  }

  /**
   * `true` si el actor puede escribir la sede (para reflejarlo en lecturas).
   *
   * @param tx - Contexto.
   * @param site - Sede.
   * @param actor - Actor.
   */
  async canWriteSite(
    tx: EntityManager,
    site: PracticeSites,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    return (
      (await this.isOrganizationAdmin(tx, site.tenantId, actor)) ||
      (await this.isBranchAdmin(tx, site, actor))
    );
  }

  private isPlatform(actor: AuthenticatedUser): boolean {
    const roles = actor.roles ?? [];
    return PLATFORM_ROLES.some((role) => roles.includes(role));
  }

  private async isOrganizationAdmin(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (this.isPlatform(actor)) return true;
    if (!(await this.tenantAdmin.canAdminister(tx, tenantId, actor))) {
      return false;
    }
    // `canAdminister` deja pasar a todo ADMIN; para la estructura, un ADMIN
    // acotado a una sucursal no administra la organización entera.
    const membership = await this.membershipsRepo.findActiveByUserTenant(
      tx,
      actor.id,
      tenantId,
      DIR.MEMBERSHIP_ACTIVE,
    );
    if (!membership) return false;
    return !(
      membership.tenantRoleConceptId === DIR.ROLE_ADMIN &&
      membership.accessScopeConceptId === DIR.SCOPE_BRANCH
    );
  }

  private async isBranchAdmin(
    tx: EntityManager,
    site: PracticeSites,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (!site.branchId) return false;
    const membership = await this.membershipsRepo.findActiveByUserTenant(
      tx,
      actor.id,
      site.tenantId,
      DIR.MEMBERSHIP_ACTIVE,
    );
    if (
      !membership ||
      membership.tenantRoleConceptId !== DIR.ROLE_ADMIN ||
      membership.accessScopeConceptId !== DIR.SCOPE_BRANCH
    ) {
      return false;
    }
    if (membership.primaryBranchId === site.branchId) return true;
    const branchLink = await tx.findOne(BranchMemberships, {
      tenantMembershipId: membership.id,
      branchId: site.branchId,
      statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE,
    });
    return branchLink !== null;
  }
}
