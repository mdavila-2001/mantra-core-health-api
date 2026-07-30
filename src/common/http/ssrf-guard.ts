import { PreconditionFailedException } from '../errors/domain.exception';

/**
 * Guarda anti-SSRF para el despacho saliente de webhooks.
 *
 * Rechaza URLs cuyo host apunte a rangos privados, loopback o link-local, que
 * son los objetivos típicos de un ataque SSRF (metadatos de nube en `169.254`,
 * servicios internos en `10/8`, `192.168/16`, etc.). En entornos que no son de
 * producción se permite (para poder apuntar a `localhost` en pruebas y
 * desarrollo local): la restricción solo aplica cuando `NODE_ENV==='production'`.
 */

/** Determina si un host resuelve a un rango privado/loopback/link-local. */
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, ''); // quita corchetes de IPv6

  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '::1' || h === '::' || h === '0.0.0.0') return true;
  // IPv6 mapeado a IPv4 (p. ej. ::ffff:127.0.0.1) y ULA (fc00::/7).
  if (h.startsWith('::ffff:')) return isPrivateHost(h.slice('::ffff:'.length));
  if (/^f[cd][0-9a-f]{2}:/.test(h)) return true;
  if (h.startsWith('fe80:')) return true; // link-local IPv6

  const octets = h.split('.');
  if (octets.length === 4 && octets.every((o) => /^\d{1,3}$/.test(o))) {
    const [a, b] = octets.map(Number);
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16
    if (a === 0) return true; // 0.0.0.0/8
  }
  return false;
}

/**
 * Valida que una URL sea segura para el despacho saliente. Lanza
 * `PreconditionFailedException` si el esquema no es HTTP(S) o si el host es
 * privado en producción.
 */
export function assertOutboundUrlAllowed(rawUrl: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new PreconditionFailedException('URL de destino inválida', {
      url: rawUrl,
    });
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new PreconditionFailedException(
      'Esquema de URL no permitido (solo http/https)',
      { protocol: url.protocol },
    );
  }

  // En dev/test se permite apuntar a hosts privados (localhost).
  if (process.env.NODE_ENV !== 'production') return;

  if (isPrivateHost(url.hostname)) {
    throw new PreconditionFailedException(
      'Host de destino no permitido (privado/loopback/link-local)',
      { host: url.hostname },
    );
  }
}
