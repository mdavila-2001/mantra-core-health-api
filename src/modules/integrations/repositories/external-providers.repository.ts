import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ExternalProviders } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar un proveedor externo (UC-12-01). */
export interface CreateProviderData {
  code: string;
  name: string;
  providerTypeConceptId: string;
  stateConceptId: string;
  baseUrl?: string;
  authTypeConceptId?: string;
  docUrl?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `integrations.external_providers`.
 *
 * Stateless: cada método recibe el `EntityManager` activo para que el servicio
 * controle la transacción. No contiene reglas de negocio.
 */
@Injectable()
export class ExternalProvidersRepository {
  findById(em: EntityManager, id: string): Promise<ExternalProviders | null> {
    return em.findOne(ExternalProviders, { id });
  }

  /** Busca por código global (UK) para validar unicidad en el alta. */
  findByCode(em: EntityManager, code: string): Promise<ExternalProviders | null> {
    return em.findOne(ExternalProviders, { code });
  }

  create(em: EntityManager, data: CreateProviderData): ExternalProviders {
    return em.create(
      ExternalProviders,
      {
        code: data.code,
        name: data.name,
        providerTypeConceptId: data.providerTypeConceptId,
        stateConceptId: data.stateConceptId,
        baseUrl: data.baseUrl,
        authTypeConceptId: data.authTypeConceptId,
        docUrl: data.docUrl,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
