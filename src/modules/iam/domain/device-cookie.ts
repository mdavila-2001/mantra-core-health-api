import { createHmac, timingSafeEqual } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Firma de una cookie de dispositivo: HMAC con una clave derivada del secreto del servidor. */
function macOf(secret: string, userId: string, deviceId: string): Buffer {
  const key = createHmac('sha256', secret)
    .update('iam:device-cookie:v1')
    .digest();
  return createHmac('sha256', key).update(`${userId}|${deviceId}`).digest();
}

/**
 * Valor de la cookie de dispositivo: `<deviceId>.<firma>`. La firma liga el
 * dispositivo a la PERSONA: una cookie copiada a otra cuenta no vale. Lo que
 * prueba es que este navegador ya inició sesión como esa persona; la huella por
 * `User-Agent` sola no prueba nada, porque cualquiera puede declarar «Chrome en
 * Windows».
 *
 * @param secret - Secreto del servidor.
 * @param userId - Persona.
 * @param deviceId - Dispositivo (`iam.devices.id`).
 * @returns El valor firmado.
 */
export function signDeviceCookie(
  secret: string,
  userId: string,
  deviceId: string,
): string {
  return `${deviceId}.${macOf(secret, userId, deviceId).toString('base64url')}`;
}

/**
 * Lee una cookie de dispositivo y devuelve el dispositivo SOLO si la firma
 * corresponde a esta persona.
 *
 * @param secret - Secreto del servidor.
 * @param userId - Persona que inicia sesión.
 * @param value - Valor de la cookie, si vino.
 * @returns El `deviceId`, o `undefined` si falta, está mal formada o no valida.
 */
export function readDeviceCookie(
  secret: string,
  userId: string,
  value: string | undefined,
): string | undefined {
  if (!value || value.length > 200) return undefined;
  const dot = value.indexOf('.');
  if (dot < 0) return undefined;
  const deviceId = value.slice(0, dot);
  if (!UUID.test(deviceId)) return undefined;
  const given = Buffer.from(value.slice(dot + 1), 'base64url');
  const expected = macOf(secret, userId, deviceId);
  return given.length === expected.length && timingSafeEqual(given, expected)
    ? deviceId
    : undefined;
}
