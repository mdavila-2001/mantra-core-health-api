import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, type AuthenticatedUser } from '../../../common';
import type { PracticeSites } from '../entities';
import { practiceOutOfScope } from '../services/practice-scope';
import { StructureContextService } from '../services/structure-context.service';
import type { StructureAccess } from '../services/structure-access.service';
import { FloorPlansRepository, type PlanRow } from './floor-plans.repository';
import { PlanViewerService, type PlanViewer } from './plan-viewer.service';

/** Lienzo cargado en el tenant activo, ya autorizado. */
export interface PlanScope {
  readonly tenantId: string;
  readonly plan: PlanRow;
  readonly site: PracticeSites;
  readonly access: StructureAccess;
  readonly viewer: PlanViewer;
}

/** Sede cargada en el tenant activo, ya autorizada. */
export interface PlanSiteScope {
  readonly tenantId: string;
  readonly site: PracticeSites;
  readonly access: StructureAccess;
  readonly viewer: PlanViewer;
}

/**
 * Punto único donde un caso de uso del plano **carga y autoriza** lo que toca
 * (CONTRATO-PLANO §4): tenant → alcance de sucursal → permiso. Un lienzo o
 * sede ajena responde **404**; una escritura sin permiso, 403
 * `INFRA_ACTION_NOT_ALLOWED` (se comprueba después, con
 * `PlanViewerService.assertCanEdit`).
 */
@Injectable()
export class FloorPlanContextService {
  /**
   * @param structure - Carga y autoriza sedes (el mismo de F1).
   * @param plans - Lienzos.
   * @param viewers - Alcance y capacidades del actor.
   */
  constructor(
    private readonly structure: StructureContextService,
    private readonly plans: FloorPlansRepository,
    private readonly viewers: PlanViewerService,
  ) {}

  /**
   * Carga un lienzo del tenant activo y resuelve al actor.
   *
   * @param tx - Transacción activa.
   * @param planId - Id recibido del cliente.
   * @param actor - Quien pide.
   * @param lock - Toma `FOR UPDATE` del lienzo (escrituras).
   * @returns Lienzo, sede, nivel y capacidades.
   * @throws ResourceNotFoundException (404) si no existe, es de otro tenant o está fuera de las sucursales del actor.
   */
  async plan(
    tx: EntityManager,
    planId: string,
    actor: AuthenticatedUser,
    lock = false,
  ): Promise<PlanScope> {
    const tenantId = requireTenantId();
    const plan = await this.plans.findPlan(tx, planId, tenantId, lock);
    if (!plan) throw practiceOutOfScope('Lienzo no encontrado');
    const { site, access } = await this.structure.site(
      tx,
      plan.siteId,
      actor,
      'read',
    );
    const viewer = await this.viewers.resolve(tx, tenantId, actor, site, access);
    return { tenantId, plan, site, access, viewer };
  }

  /**
   * Carga una sede del tenant activo y resuelve al actor.
   *
   * @param tx - Transacción activa.
   * @param siteId - Id recibido del cliente.
   * @param actor - Quien pide.
   * @returns Sede, nivel y capacidades.
   */
  async site(
    tx: EntityManager,
    siteId: string,
    actor: AuthenticatedUser,
  ): Promise<PlanSiteScope> {
    const { tenantId, site, access } = await this.structure.site(
      tx,
      siteId,
      actor,
      'read',
    );
    const viewer = await this.viewers.resolve(tx, tenantId, actor, site, access);
    return { tenantId, site, access, viewer };
  }
}
