import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SiteDeclaredCapacities } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una capacidad declarada. */
export interface CreateDeclaredCapacityData {
  tenantId: string;
  practiceSiteId: string;
  capacityKindConceptId: string;
  quantity: number;
  asOf: Date;
  resolutionNumber?: string;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a `practice.site_declared_capacities` (stateless). */
@Injectable()
export class SiteDeclaredCapacitiesRepository {
  /**
   * Declaraciones de una sede, de la más reciente a la más antigua por tipo
   * (usa el índice `(practice_site_id, capacity_kind_concept_id, as_of DESC)`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Sede.
   */
  findBySite(
    em: EntityManager,
    practiceSiteId: string,
  ): Promise<SiteDeclaredCapacities[]> {
    return em.find(
      SiteDeclaredCapacities,
      { practiceSiteId },
      { orderBy: { capacityKindConceptId: 'asc', asOf: 'desc' } },
    );
  }

  /**
   * Registra una declaración (sin flush). Las declaraciones no se editan: una
   * nueva con `as_of` posterior reemplaza a la anterior al leer.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos.
   */
  create(
    em: EntityManager,
    data: CreateDeclaredCapacityData,
  ): SiteDeclaredCapacities {
    return em.create(
      SiteDeclaredCapacities,
      {
        tenantId: data.tenantId,
        practiceSiteId: data.practiceSiteId,
        capacityKindConceptId: data.capacityKindConceptId,
        quantity: data.quantity,
        asOf: data.asOf,
        resolutionNumber: data.resolutionNumber,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
