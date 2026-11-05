import type { EntityManager } from '@mikro-orm/postgresql';
import { resolveWebhookSecretRef } from '../../../common/crypto/secret-ref';
import { GatewayConnections, PaymentIntents } from '../entities';

/** Resultado de resolver el secreto de un callback de gateway. */
export interface GatewayWebhookSecrets {
  /** Secretos válidos (más de uno sólo durante una rotación); vacío = rechazar. */
  secrets: string[];
  /** Conexión de la que salen, si se encontró. */
  connectionId?: string;
  /** Motivo cuando no hay secreto, para el log (nunca se devuelve al cliente). */
  reason?:
    | 'intent-without-connection'
    | 'connection-not-found'
    | 'connection-gateway-mismatch'
    | 'connection-tenant-mismatch'
    | 'secret-ref-not-tenant-owned'
    | 'secret-ref-unresolved';
}

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
 * @param ref - Referencia de la conexión (`env:A,env:B` en una rotación).
 * @param tenantId - Tenant dueño de la conexión.
 * @returns `true` sólo si cada entrada es `env:` + el prefijo del tenant.
 */
function secretRefBelongsToTenant(ref: string, tenantId: string): boolean {
  const prefix = `env:${tenantSecretPrefix(tenantId)}`;
  return ref.split(',').every((entry) => entry.trim().startsWith(prefix));
}

/**
 * MCH-019 · resuelve el secreto con que el gateway firma el callback de una
 * transacción: el de la conexión configurada en la intención
 * (`payment_intents.gateway_connection_id` → `gateway_connections.webhook_secret_ref`).
 *
 * Propiedad de la referencia: el entorno es un espacio de nombres único para
 * todos los tenants y quien configura la conexión escribe la referencia, así
 * que sólo vale si nombra variables del tenant dueño de la conexión
 * (`env:WEBHOOK_SECRET_<TENANT>_<NOMBRE>`, UUID en mayúsculas y sin guiones) y
 * ese tenant es el de la intención. Sin ese vínculo, el administrador de un
 * tenant apuntaría su conexión al secreto de otro y firmaría callbacks válidos
 * sobre transacciones ajenas.
 *
 * Fail-closed: sin conexión, con una conexión de otro gateway o con una
 * referencia que no resuelve, no hay secreto y el callback debe rechazarse. No
 * hay retroceso al secreto derivado por gateway: esa raíz compartida no
 * identifica la conexión y dejaría que un callback de otra conexión del mismo
 * gateway autorice la transacción.
 *
 * Lee sin bloquear; el bloqueo de la intención lo toma después quien la muta.
 */
export async function resolveGatewayWebhookSecrets(
  tx: EntityManager,
  transaction: { gatewayId: string; paymentIntentId: string },
  env: NodeJS.ProcessEnv = process.env,
): Promise<GatewayWebhookSecrets> {
  const intent = await tx.findOne(PaymentIntents, {
    id: transaction.paymentIntentId,
  });
  const connectionId = intent?.gatewayConnectionId;
  if (!connectionId)
    return { secrets: [], reason: 'intent-without-connection' };

  const connection = await tx.findOne(GatewayConnections, {
    id: connectionId,
  });
  if (!connection)
    return { secrets: [], connectionId, reason: 'connection-not-found' };
  if (connection.gatewayId !== transaction.gatewayId)
    return { secrets: [], connectionId, reason: 'connection-gateway-mismatch' };

  if (!connection.tenantId || connection.tenantId !== intent?.tenantId)
    return { secrets: [], connectionId, reason: 'connection-tenant-mismatch' };
  if (
    !connection.webhookSecretRef ||
    !secretRefBelongsToTenant(connection.webhookSecretRef, connection.tenantId)
  )
    return { secrets: [], connectionId, reason: 'secret-ref-not-tenant-owned' };

  const secrets = resolveWebhookSecretRef(connection.webhookSecretRef, env);
  if (!secrets)
    return { secrets: [], connectionId, reason: 'secret-ref-unresolved' };
  return { secrets, connectionId };
}
