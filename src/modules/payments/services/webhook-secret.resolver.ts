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
    | 'secret-ref-unresolved';
}

/**
 * MCH-019 · resuelve el secreto con que el gateway firma el callback de una
 * transacción: el de la conexión configurada en la intención
 * (`payment_intents.gateway_connection_id` → `gateway_connections.webhook_secret_ref`).
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

  const secrets = resolveWebhookSecretRef(connection.webhookSecretRef, env);
  if (!secrets)
    return { secrets: [], connectionId, reason: 'secret-ref-unresolved' };
  return { secrets, connectionId };
}
