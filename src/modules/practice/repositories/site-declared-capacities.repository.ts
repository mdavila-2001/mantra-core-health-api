import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SiteDeclaredCapacities } from '../entities';
import { createdBy } from '../../../common';

/** Acceso a datos de `practice.site_declared_capacities` (stateless). */
@Injectable()
export class SiteDeclaredCapacitiesRepository {
  /**
   * Declaraciones de una sede, de la más reciente a la más vieja.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Sede.
   * @returns Todas las declaraciones (vigentes o no).
   */
  findBySite(
    em: EntityManager,
    practiceSiteId: string,
  ): Promise<SiteDeclaredCapacities[]> {
    return em.find(
      SiteDeclaredCapacities,
      { practiceSiteId },
      { orderBy: { asOf: 'DESC', createdAt: 'DESC' } },
    );
  }

  /**
   * Registra una declaración: se agrega, no se sobrescribe.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la declaración.
   * @returns La declaración creada (sin flush).
   */
  create(
    em: EntityManager,
    data: {
      /** Tenant de la declaración. */
      tenantId: string;
      /** Sede. */
      practiceSiteId: string;
      /** Tipo de capacidad (concepto `CAP_*`). */
      capacityKindConceptId: string;
      /** Cantidad declarada. */
      quantity: number;
      /** Fecha de corte. */
      asOf: Date;
      /** Resolución que la respalda. */
      resolutionNumber?: string;
      /** Fin de la vigencia. */
      validTo?: Date;
      /** Quién la registró. */
      actorUserId?: string;
    },
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
