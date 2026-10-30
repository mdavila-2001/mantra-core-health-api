import type { IncomingMessage } from 'node:http';

/** Ruta del receptor de webhooks de la pasarela (sin prefijo global). */
export const GATEWAY_WEBHOOK_PATH = '/payments/gateway-webhooks';

/** Petición con los bytes originales del cuerpo, tal como llegaron. */
export interface RawBodyRequest extends IncomingMessage {
  /** Cuerpo crudo; sólo lo captura el receptor de webhooks de la pasarela. */
  rawBody?: Buffer;
}

/**
 * `true` si la URL es la del receptor, tal como la enruta Express: sin la
 * query, sin distinguir mayúsculas y con o sin barra final (`strict routing` y
 * `case sensitive` vienen apagados). Una igualdad exacta dejaba sin cuerpo
 * crudo —y sin firma verificable— a toda entrega que la pasarela registrara con
 * barra final.
 */
export function isGatewayWebhookPath(url: string | undefined): boolean {
  const path = (url ?? '').split('?')[0].replace(/\/+$/u, '').toLowerCase();
  return path === GATEWAY_WEBHOOK_PATH;
}

/**
 * Gancho `verify` del parser JSON global (`main.ts`): conserva los bytes crudos
 * únicamente de la ruta del webhook de la pasarela.
 *
 * La firma Standard Webhooks cubre `${id}.${timestamp}.${cuerpo}` con el cuerpo
 * **byte a byte**, y volver a serializar el JSON ya interpretado cambia espacios,
 * orden de claves o escapes. Se captura sólo en esa ruta —y no con la opción
 * global `rawBody` de Nest— para no retener en memoria el cuerpo de las demás y
 * porque `main.ts` instala su propio `json()` con límite explícito.
 *
 * @param req - Petición entrante.
 * @param _res - Respuesta (no se usa).
 * @param buf - Bytes del cuerpo.
 */
export function captureGatewayWebhookRawBody(
  req: IncomingMessage,
  _res: unknown,
  buf: Buffer,
): void {
  if (isGatewayWebhookPath(req.url)) {
    (req as RawBodyRequest).rawBody = Buffer.from(buf);
  }
}
