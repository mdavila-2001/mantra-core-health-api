import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ExternalProviders } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar un proveedor externo (UC-12-01). */
export interface CreateProviderData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a provider type concept.
   */
  providerTypeConceptId: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Valor de base url mantenido por la instancia.
   */
  baseUrl?: string;
  /**
   * Identificador asociado a auth type concept.
   */
  authTypeConceptId?: string;
  /**
   * Valor de doc url mantenido por la instancia.
   */
  docUrl?: string;
  /**
   * Identificador asociado a actor user.
   */
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
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ExternalProviders | null>`.
   */
  findById(em: EntityManager, id: string): Promise<ExternalProviders | null> {
    return em.findOne(ExternalProviders, { id });
  }

  /** Busca por código global (UK) para validar unicidad en el alta. */
  findByCode(
    em: EntityManager,
    code: string,
  ): Promise<ExternalProviders | null> {
    return em.findOne(ExternalProviders, { code });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ExternalProviders`.
   */
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
