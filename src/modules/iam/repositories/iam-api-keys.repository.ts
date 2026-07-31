import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ApiKeys, ApiKeyScopes } from '../entities';

/**
 * Acceso a datos de claves de API y sus scopes en el esquema `iam`: `api_keys`
 * y `api_key_scopes`. Stateless: la unidad de trabajo se recibe por parámetro.
 */
@Injectable()
export class IamApiKeysRepository {
  /** Clave de API por id, acotada al tenant (evita IDOR sobre credenciales). */
  findById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<ApiKeys | null> {
    return em.findOne(ApiKeys, { id, tenantId });
  }

  /**
   * Clave de API por hash almacenado (verificación de credencial). Sin
   * `tenantId`: el hash es la única entrada disponible en esta ruta.
   */
  findByHash(em: EntityManager, keyHash: string): Promise<ApiKeys | null> {
    return em.findOne(ApiKeys, { keyHash });
  }

  /** Claves de API de las que el usuario es propietario, dentro del tenant. */
  listByUser(
    em: EntityManager,
    tenantId: string,
    ownerUserId: string,
  ): Promise<ApiKeys[]> {
    return em.find(ApiKeys, { tenantId, ownerUserId });
  }

  /** Scopes asociados a una clave de API. */
  listByApiKey(em: EntityManager, apiKeyId: string): Promise<ApiKeyScopes[]> {
    return em.find(ApiKeyScopes, { apiKeyId });
  }
}
