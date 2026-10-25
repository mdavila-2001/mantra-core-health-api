import {
  deriveWebhookSecret,
  signPayload,
  verifySignature,
} from '../../common/crypto/webhook-signature';
import type { MemberType } from './dto';

/** Vigencia por defecto de un token de destinatario (7 días). */
export const DEFAULT_LINK_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Destinatario resuelto de un token válido. */
export interface LinkTokenRecipient {
  readonly memberType: MemberType;
  readonly memberRefId: string;
}

/** Clave por enlace: un token firmado para un enlace no vale en otro. */
function linkKey(linkId: string): string {
  return deriveWebhookSecret('marketing-tracked-link', linkId);
}

/**
 * Emite un token opaco, firmado y con vencimiento que liga un enlace
 * rastreable con un destinatario. El click público lo presenta en lugar de
 * declarar quién es: la identidad sale del servidor, no del llamador.
 *
 * Formato: `base64url(JSON{m,r,e}).hex(HMAC-SHA256(linkId.payload))`.
 *
 * @param linkId - Enlace al que queda ligado el token.
 * @param recipient - Destinatario ya verificado como miembro de la campaña.
 * @param ttlSeconds - Vigencia en segundos.
 * @param now - Reloj inyectable para pruebas.
 * @returns El token y su vencimiento.
 */
export function issueLinkToken(
  linkId: string,
  recipient: LinkTokenRecipient,
  ttlSeconds: number,
  now: Date = new Date(),
): { token: string; expiresAt: Date } {
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const payload = Buffer.from(
    JSON.stringify({
      m: recipient.memberType,
      r: recipient.memberRefId,
      e: Math.floor(expiresAt.getTime() / 1000),
    }),
    'utf8',
  ).toString('base64url');
  const signature = signPayload(linkKey(linkId), `${linkId}.${payload}`);
  return { token: `${payload}.${signature}`, expiresAt };
}

/**
 * Verifica un token de destinatario contra un enlace.
 *
 * @param linkId - Enlace que se está resolviendo.
 * @param token - Token presentado en el click.
 * @param now - Reloj inyectable para pruebas.
 * @returns El destinatario, o `null` si la firma no corresponde a ese enlace,
 *   el formato es inválido o el token venció.
 */
export function verifyLinkToken(
  linkId: string,
  token: string,
  now: Date = new Date(),
): LinkTokenRecipient | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!verifySignature(linkKey(linkId), `${linkId}.${payload}`, signature)) {
    return null;
  }
  try {
    const claims = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { m?: unknown; r?: unknown; e?: unknown };
    if (
      (claims.m !== 'PATIENT' && claims.m !== 'CONTACT') ||
      typeof claims.r !== 'string' ||
      typeof claims.e !== 'number' ||
      claims.e * 1000 <= now.getTime()
    ) {
      return null;
    }
    return { memberType: claims.m, memberRefId: claims.r };
  } catch {
    return null;
  }
}
