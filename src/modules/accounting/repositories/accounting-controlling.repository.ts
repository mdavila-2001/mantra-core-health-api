import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ControllingAreas } from '../entities';

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
}
