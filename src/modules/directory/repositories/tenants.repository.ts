import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Tenants } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un tenant (raíz o sub-tenant). */
export interface CreateTenantData {
  code: string;
  legalName: string;
  tradeName?: string;
  tenantTypeConceptId: string;
  legalEntityTypeConceptId: string;
  statusConceptId: string;
  verificationStatusConceptId: string;
  dataResidencyRegionConceptId?: string;
  parentTenantId?: string;
  timeZone?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `directory.tenants`. Stateless: recibe el `EntityManager`
 * activo para que el servicio controle la transacción.
 */
@Injectable()
export class TenantsRepository {
  /** Busca un tenant por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Tenants | null> {
    return em.findOne(Tenants, { id });
  }

  /** Busca un tenant por su código único global. */
  findByCode(em: EntityManager, code: string): Promise<Tenants | null> {
    return em.findOne(Tenants, { code });
  }

  /** Crea la entidad tenant en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateTenantData): Tenants {
    return em.create(
      Tenants,
      {
        code: data.code,
        legalName: data.legalName,
        tradeName: data.tradeName,
        tenantTypeConceptId: data.tenantTypeConceptId,
        legalEntityTypeConceptId: data.legalEntityTypeConceptId,
        statusConceptId: data.statusConceptId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        dataResidencyRegionConceptId: data.dataResidencyRegionConceptId,
        parentTenantId: data.parentTenantId,
        timeZone: data.timeZone,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
