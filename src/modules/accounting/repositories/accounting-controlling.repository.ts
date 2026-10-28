import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ControllingAreas,
  CostCenters,
  ProfitCenters,
  AccountingSegments,
} from '../entities';

/**
 * Acceso de solo-catálogo a las áreas de control (`accounting.controlling_areas`).
 * Métodos stateless que reciben el `EntityManager`/transacción activa como
 * primer parámetro; sin lógica de negocio, solo lecturas por clave lógica.
 */
@Injectable()
export class AccountingControllingRepository {
  /** Área de control por id, acotada al tenant. */
  findById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<ControllingAreas | null> {
    return em.findOne(ControllingAreas, { id, tenantId });
  }

  /** Área de control por su código dentro de un tenant (clave lógica única). */
  findByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<ControllingAreas | null> {
    return em.findOne(ControllingAreas, { tenantId, code });
  }

  /** Áreas de control de un tenant, ordenadas por código. */
  listByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<ControllingAreas[]> {
    return em.find(
      ControllingAreas,
      { tenantId },
      { orderBy: { code: 'asc' } },
    );
  }

  /**
   * Los centros de costo con esos ids, sin acotar: el llamador contrasta la
   * práctica de cada uno.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Identificadores pedidos.
   * @returns Los que existen.
   */
  findCostCentersByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<CostCenters[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(CostCenters, { id: { $in: [...ids] } });
  }

  /**
   * Los centros de beneficio con esos ids, sin acotar: el llamador contrasta el
   * tenant de cada uno.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Identificadores pedidos.
   * @returns Los que existen.
   */
  findProfitCentersByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<ProfitCenters[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(ProfitCenters, { id: { $in: [...ids] } });
  }

  /** Centros de coste de una práctica (D-9), ordenados por código. */
  listCostCentersByPractice(
    em: EntityManager,
    practiceId: string,
  ): Promise<CostCenters[]> {
    return em.find(CostCenters, { practiceId }, { orderBy: { code: 'asc' } });
  }

  /**
   * Centros de beneficio de un tenant (D-9: `profit_centers` no tiene
   * `practice_id`, así que no hay puente por práctica), ordenados por código.
   */
  listProfitCentersByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<ProfitCenters[]> {
    return em.find(ProfitCenters, { tenantId }, { orderBy: { code: 'asc' } });
  }

  /**
   * Segmentos de un tenant (D-9: `segments` no tiene `practice_id`, así que
   * no hay puente por práctica), ordenados por código.
   */
  listSegmentsByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<AccountingSegments[]> {
    return em.find(
      AccountingSegments,
      { tenantId },
      { orderBy: { code: 'asc' } },
    );
  }
}
