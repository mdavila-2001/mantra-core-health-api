import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { resolveWebhookSecretRef } from '../../../common/crypto/secret-ref';
import {
  ProviderConnectionsRepository,
  ProviderCredentialsRepository,
} from '../repositories';
import { INTEG } from '../integrations.concepts';
import { IntegrationsErrorReason } from '../integrations.error-reasons';

/**
 * Prefijo de variable de entorno que le pertenece a un tenant.
 *
 * @param tenantId - UUID del tenant dueño de la conexión.
 * @returns `WEBHOOK_SECRET_<UUID sin guiones, en mayúsculas>_`.
 */
function tenantSecretPrefix(tenantId: string): string {
  return `WEBHOOK_SECRET_${tenantId.replace(/-/g, '').toUpperCase()}_`;
}

/**
 * Si todas las entradas de la referencia nombran variables del tenant.
 *
 * @param ref - Referencia de la credencial (`env:A,env:B` en una rotación).
 * @param tenantId - Tenant dueño de la conexión.
 * @returns `true` sólo si cada entrada es `env:` + el prefijo del tenant.
 */
function secretRefBelongsToTenant(ref: string, tenantId: string): boolean {
  const prefix = `env:${tenantSecretPrefix(tenantId)}`;
  return ref.split(',').every((entry) => entry.trim().startsWith(prefix));
}

/**
 * Adaptador de bóveda de las conexiones de integración (INT-02).
 *
 * Resuelve el secreto con que se firma el despacho saliente y se verifica el
 * callback entrante a partir de la `secretRef` de la **credencial activa** de la
 * conexión (`provider_credentials.secret_ref`), no de una clave derivada del
 * UUID de la conexión. La referencia nombra dónde vive el secreto
 * (`env:WEBHOOK_SECRET_<NOMBRE>`, ver `resolveWebhookSecretRef`) y admite hasta
 * dos entradas (`env:..._V2,env:..._V1`) para una ventana de rotación en la que
 * valen la clave nueva y la anterior; al cerrarla se deja sólo la nueva. Rotar
 * la credencial retira la anterior, así que su referencia deja de valer.
 *
 * Propiedad de la referencia: el entorno es un espacio de nombres único para
 * todos los tenants y quien provisiona escribe la referencia, así que una
 * referencia sólo vale si nombra variables del tenant dueño de la conexión
 * (`env:WEBHOOK_SECRET_<TENANT>_<NOMBRE>`, con el UUID del tenant en mayúsculas
 * y sin guiones). Sin ese vínculo, un administrador de un tenant apuntaría su
 * conexión al secreto de otro y obtendría firmas válidas para él. Todas las
 * entradas de la ventana de rotación deben cumplirlo.
 *
 * Fail-closed: sin credencial activa, o con una referencia que no resuelve, no
 * hay secreto y la operación se rechaza. Nunca se retrocede a una derivación.
 * Sólo se registran identificadores, nunca la referencia ni el secreto.
 */
@Injectable()
export class IntegrationsSecretsService {
  constructor(
    private readonly credentialsRepo: ProviderCredentialsRepository,
    private readonly connectionsRepo: ProviderConnectionsRepository,
  ) {}

  /**
   * Secretos válidos de la conexión, el más nuevo primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param connectionId - Conexión cuyo secreto se resuelve.
   * @param env - Entorno del que se leen los valores (inyectable en pruebas).
   * @returns Uno o dos secretos (dos sólo durante una rotación).
   * @throws PreconditionFailedException `INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE` si la bóveda no entrega un secreto activo.
   */
  async resolveActiveSecrets(
    em: EntityManager,
    connectionId: string,
    env: NodeJS.ProcessEnv = process.env,
  ): Promise<string[]> {
    const connection = await this.connectionsRepo.findById(em, connectionId);
    const credential = await this.credentialsRepo.findActiveByConnection(
      em,
      connectionId,
      INTEG.CRED_ACTIVE,
    );
    const ref = credential?.secretRef;
    const secrets =
      connection?.tenantId &&
      ref &&
      secretRefBelongsToTenant(ref, connection.tenantId)
        ? resolveWebhookSecretRef(ref, env)
        : null;
    if (!secrets) {
      throw new PreconditionFailedException(
        'La conexión no tiene un secreto activo disponible',
        { connectionId },
        IntegrationsErrorReason.INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE,
      );
    }
    return secrets;
  }
}
