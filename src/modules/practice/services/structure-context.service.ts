import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import type { CareSpaces, ClinicalUnits, PracticeSites } from '../entities';
import {
  CareSpacesRepository,
  ClinicalUnitsRepository,
  PracticeSitesRepository,
} from '../repositories';
import { PRAC } from '../practice.concepts';
import { assertPracticeScope } from './practice-scope';
import {
  StructureAccessService,
  type StructureAccess,
} from './structure-access.service';

/** Qué quiere hacer el actor con el recurso. */
export type StructureMode = 'read' | 'write' | 'regulatory';

/** Sede cargada en el tenant activo y ya autorizada. */
export interface SiteScope {
  /** Tenant del contexto. */
  readonly tenantId: string;
  /** La sede. */
  readonly site: PracticeSites;
  /** Alcance del actor. */
  readonly access: StructureAccess;
}

/** Espacio cargado en el tenant activo y ya autorizado. */
export interface SpaceScope extends SiteScope {
  /** El espacio. */
  readonly space: CareSpaces;
}

/** Unidad clínica cargada en el tenant activo y ya autorizada. */
export interface UnitScope extends SiteScope {
  /** La unidad. */
  readonly unit: ClinicalUnits;
}

/**
 * Punto único donde un caso de uso de estructura **carga y autoriza** el
 * recurso que toca. Ningún servicio de F1 llama a un repositorio con un id del
 * cliente antes de pasar por acá.
 *
 * El orden es el que fija el contrato (§3): tenant → alcance de sucursal →
 * permiso. Un recurso fuera del tenant o fuera de las sucursales del actor
 * responde 404 uniforme; dentro del alcance pero sin permiso, 403.
 */
@Injectable()
export class StructureContextService {
  /**
   * @param sitesRepo - Establecimientos.
   * @param spacesRepo - Espacios.
   * @param unitsRepo - Unidades.
   * @param access - Regla de quién lee y quién escribe.
   */
  constructor(
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly access: StructureAccessService,
  ) {}

  /**
   * Carga un establecimiento del tenant activo y autoriza la acción.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param siteId - Id recibido del cliente.
   * @param actor - Quien pide.
   * @param mode - `read`, `write` (estructura) o `regulatory`.
   * @returns Tenant, sede y alcance.
   * @throws ResourceNotFoundException (404) si no existe, es de otro tenant o está fuera de las sucursales del actor.
   * @throws ForbiddenException (403) si la ve pero no puede hacer eso.
   */
  async site(
    em: EntityManager,
    siteId: string,
    actor: AuthenticatedUser,
    mode: StructureMode,
  ): Promise<SiteScope> {
    const tenantId = requireTenantId();
    const found = await this.sitesRepo.findById(em, siteId);
    const site = assertPracticeScope(
      found,
      found?.tenantId,
      tenantId,
      'Sitio no encontrado',
    );
    const access = await this.access.resolve(em, tenantId, actor);
    this.authorize(access, site, mode);
    return { tenantId, site, access };
  }

  /**
   * Carga un espacio del tenant activo, resuelve su sede y autoriza.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param spaceId - Id recibido del cliente.
   * @param actor - Quien pide.
   * @param mode - `read` o `write`.
   * @returns Tenant, sede, alcance y espacio.
   * @throws ResourceNotFoundException (404) fuera del tenant o del alcance.
   */
  async space(
    em: EntityManager,
    spaceId: string,
    actor: AuthenticatedUser,
    mode: Exclude<StructureMode, 'regulatory'>,
  ): Promise<SpaceScope> {
    const tenantId = requireTenantId();
    const found = await this.spacesRepo.findByIdInTenant(em, spaceId, tenantId);
    const space = assertPracticeScope(
      found,
      found?.tenantId,
      tenantId,
      'Espacio no encontrado',
    );
    const scope = await this.site(em, space.practiceSiteId, actor, mode);
    return { ...scope, space };
  }

  /**
   * Carga una unidad clínica del tenant activo, resuelve su sede y autoriza.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param unitId - Id recibido del cliente.
   * @param actor - Quien pide.
   * @param mode - `read` o `write`.
   * @returns Tenant, sede, alcance y unidad.
   * @throws ResourceNotFoundException (404) fuera del tenant o del alcance.
   */
  async unit(
    em: EntityManager,
    unitId: string,
    actor: AuthenticatedUser,
    mode: Exclude<StructureMode, 'regulatory'>,
  ): Promise<UnitScope> {
    const tenantId = requireTenantId();
    const found = await this.unitsRepo.findById(em, unitId);
    const unit = assertPracticeScope(
      found,
      found?.tenantId,
      tenantId,
      'Unidad no encontrada',
    );
    const scope = await this.site(em, unit.practiceSiteId, actor, mode);
    return { ...scope, unit };
  }

  /**
   * La sede tiene que estar activa para colgar estructura nueva.
   *
   * @param site - La sede.
   * @throws PreconditionFailedException (422) si no lo está.
   */
  assertSiteActive(site: PracticeSites): void {
    if (site.statusConceptId !== PRAC.SITE_ACTIVE) {
      throw new PreconditionFailedException('El sitio no está activo', {
        siteId: site.id,
      });
    }
  }

  private authorize(
    access: StructureAccess,
    site: PracticeSites,
    mode: StructureMode,
  ): void {
    if (mode === 'read') this.access.assertCanRead(access, site);
    else if (mode === 'write')
      this.access.assertCanWriteStructure(access, site);
    else this.access.assertCanWriteRegulatory(access, site);
  }
}
