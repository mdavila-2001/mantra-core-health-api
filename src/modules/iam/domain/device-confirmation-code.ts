import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/** Un código vale por su ventana y por la anterior: entre 10 y 20 minutos. */
const WINDOW_MS = 10 * 60_000;

function windowIndex(at: Date): number {
  return Math.floor(at.getTime() / WINDOW_MS);
}

function codeFor(
  secret: string,
  userId: string,
  deviceId: string,
  index: number,
): string {
  const key = createHmac('sha256', secret)
    .update('iam:device-confirmation-code:v1')
    .digest();
  const mac = createHmac('sha256', key)
    .update(`${userId}|${deviceId}|${index}`)
    .digest();
  return String(mac.readUInt32BE(0) % 100_000_000).padStart(8, '0');
}

/**
 * Código de 8 dígitos que se manda al correo VERIFICADO de la cuenta para
 * confirmar un dispositivo con «Fui yo». Se deriva (HMAC) de la persona, del
 * dispositivo y de la ventana de tiempo: no se guarda, y un código de otro
 * dispositivo u otra persona no sirve. Su uso único lo hace cumplir
 * {@link deviceCodeDigest}.
 *
 * @param secret - Secreto del servidor.
 * @param userId - Titular.
 * @param deviceId - Dispositivo a confirmar.
 * @param at - Instante de emisión.
 * @returns El código.
 */
export function deviceConfirmationCode(
  secret: string,
  userId: string,
  deviceId: string,
  at: Date,
): string {
  return codeFor(secret, userId, deviceId, windowIndex(at));
}

/**
 * ¿Es `code` uno de los códigos vigentes (esta ventana o la anterior)? La
 * comparación es de tiempo constante.
 *
 * @param secret - Secreto del servidor.
 * @param userId - Titular.
 * @param deviceId - Dispositivo.
 * @param code - Código presentado.
 * @param now - Instante actual.
 * @returns `true` si vale.
 */
export function isDeviceConfirmationCodeValid(
  secret: string,
  userId: string,
  deviceId: string,
  code: string,
  now: Date,
): boolean {
  const index = windowIndex(now);
  const given = Buffer.from(code);
  return [index, index - 1].some((i) => {
    const expected = Buffer.from(codeFor(secret, userId, deviceId, i));
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/**
 * Huella (SHA-256) de un código ya usado: se guarda en el evento de seguridad en
 * lugar del código para que no se pueda presentar dos veces.
 *
 * @param userId - Titular.
 * @param deviceId - Dispositivo.
 * @param code - Código aceptado.
 * @returns La huella en hexadecimal.
 */
export function deviceCodeDigest(
  userId: string,
  deviceId: string,
  code: string,
): string {
  return createHash('sha256')
    .update(`${userId}|${deviceId}|${code}`)
    .digest('hex');
}

/**
 * Enmascara una dirección para mostrarla («a***@d***.com»): la persona reconoce
 * a dónde fue el código sin que la respuesta revele el correo entero.
 *
 * @param address - Dirección.
 * @returns La dirección enmascarada.
 */
export function maskEmail(address: string): string {
  const [local, domain = ''] = address.split('@');
  const [host, ...rest] = domain.split('.');
  return `${local.slice(0, 1)}***@${host.slice(0, 1)}***${rest.length ? `.${rest.join('.')}` : ''}`;
}
