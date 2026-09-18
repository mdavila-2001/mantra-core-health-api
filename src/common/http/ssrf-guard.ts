import dns from 'node:dns';
import { isIP } from 'node:net';
import { PreconditionFailedException } from '../errors/domain.exception';

/**
 * Guarda anti-SSRF para el despacho saliente de webhooks.
 *
 * Rechaza destinos que apunten a rangos privados, loopback, link-local u otros
 * no enrutables en Internet, que son los objetivos típicos de un ataque SSRF
 * (metadatos de nube en `169.254`, servicios internos en `10/8`, etc.).
 *
 * MCH-006: la decisión se toma sobre la dirección en binario, no sobre el texto
 * del host (URL normaliza `::ffff:127.0.0.1` a `::ffff:7f00:1` y un filtro por
 * prefijo textual no lo reconoce). Un nombre DNS se resuelve, se validan todas
 * sus direcciones A/AAAA y el socket se conecta a una de esas direcciones ya
 * validadas (ver `pinnedLookup`): no se vuelve a resolver entre la validación y
 * la conexión, así un DNS que cambia de respuesta (rebinding) no gana la carrera.
 *
 * En entornos que no son de producción se permite apuntar a hosts privados
 * (`localhost` en pruebas y desarrollo local): la restricción solo aplica cuando
 * `NODE_ENV==='production'`. La resolución y el anclaje se hacen igual.
 */

/** Dirección resuelta con su familia, como la entrega `dns.lookup`. */
export interface ResolvedAddress {
  /** Dirección IP en texto. */
  address: string;
  /** 4 o 6. */
  family: 4 | 6;
}

/** Destino ya validado: URL, host y las direcciones a las que se puede conectar. */
export interface OutboundDestination {
  /** URL normalizada. */
  url: URL;
  /** Host tal como lo usa la conexión (sin corchetes). */
  hostname: string;
  /** Direcciones validadas; la conexión sólo puede ir a una de estas. */
  addresses: ResolvedAddress[];
}

/** Resolvedor de nombres; por defecto `dns.lookup` con todas las direcciones. */
export type OutboundResolver = (hostname: string) => Promise<ResolvedAddress[]>;

/** Rangos IPv4 bloqueados (dirección base, prefijo). */
const BLOCKED_V4: ReadonlyArray<readonly [string, number]> = [
  ['0.0.0.0', 8], // "esta red"
  ['10.0.0.0', 8], // privada
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local (metadatos de nube)
  ['172.16.0.0', 12], // privada
  ['192.0.0.0', 24], // asignaciones IETF
  ['192.0.2.0', 24], // documentación
  ['192.88.99.0', 24], // relay 6to4
  ['192.168.0.0', 16], // privada
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentación
  ['203.0.113.0', 24], // documentación
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reservada + broadcast
];

/** Convierte una IPv4 en texto a entero de 32 bits (sin validar). */
function v4ToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) | Number(octet)) >>> 0, 0);
}

/** Convierte una IPv6 en texto (incluida la forma con IPv4 al final) a 16 bytes. */
function v6ToBytes(ip: string): number[] {
  let text = ip.toLowerCase().split('%')[0]; // descarta zone id (fe80::1%eth0)
  // Cola IPv4 embebida (::ffff:1.2.3.4) → dos grupos hex.
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (tail) {
    const n = v4ToInt(tail[1]);
    text =
      text.slice(0, tail.index) +
      `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const [head, rest] = text.split('::');
  const left = head ? head.split(':') : [];
  const right = rest !== undefined && rest !== '' ? rest.split(':') : [];
  const fill =
    rest === undefined
      ? []
      : new Array<string>(8 - left.length - right.length).fill('0');
  const groups = [...left, ...fill, ...right].map((g) => parseInt(g, 16));
  return groups.flatMap((g) => [(g >> 8) & 0xff, g & 0xff]);
}

/** true si la IPv4 cae en un rango no público. */
function isBlockedV4(ip: string): boolean {
  const n = v4ToInt(ip);
  return BLOCKED_V4.some(([base, prefix]) => {
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (n & mask) >>> 0 === (v4ToInt(base) & mask) >>> 0;
  });
}

/** IPv4 formada por los 4 bytes indicados. */
function bytesToV4(bytes: number[]): string {
  return bytes.join('.');
}

/** true si la IPv6 no es unicast global o encapsula una IPv4 no pública. */
function isBlockedV6(ip: string): boolean {
  const b = v6ToBytes(ip);
  const isZero = (from: number, to: number) =>
    b.slice(from, to).every((x) => x === 0);

  // ::ffff:0:0/96 (IPv4 mapeada): decide la IPv4 embebida.
  if (isZero(0, 10) && b[10] === 0xff && b[11] === 0xff)
    return isBlockedV4(bytesToV4(b.slice(12, 16)));
  // 64:ff9b::/96 (NAT64 bien conocido): decide la IPv4 embebida.
  if (
    b[0] === 0x00 &&
    b[1] === 0x64 &&
    b[2] === 0xff &&
    b[3] === 0x9b &&
    isZero(4, 12)
  )
    return isBlockedV4(bytesToV4(b.slice(12, 16)));

  // Fuera de 2000::/3 (unicast global) nada es destino legítimo: cubre ::,
  // ::1, IPv4-compatible, fc00::/7 (ULA), fe80::/10 completo, fec0::/10,
  // ff00::/8 (multicast), 100::/64 y el resto de reservados.
  if ((b[0] & 0xe0) !== 0x20) return true;

  // 2002::/16 (6to4): decide la IPv4 embebida.
  if (b[0] === 0x20 && b[1] === 0x02)
    return isBlockedV4(bytesToV4(b.slice(2, 6)));
  // 2001::/32 (Teredo, IPv4 ofuscada) y 2001:db8::/32 (documentación).
  if (b[0] === 0x20 && b[1] === 0x01) {
    if (b[2] === 0x00 && b[3] === 0x00) return true;
    if (b[2] === 0x0d && b[3] === 0xb8) return true;
  }
  // 3fff::/20 (documentación).
  if (b[0] === 0x3f && b[1] === 0xff && (b[2] & 0xf0) === 0x00) return true;
  return false;
}

/**
 * true si la dirección IP (v4 o v6, en texto) no es un destino público.
 * Una entrada que no es IP se considera bloqueada (fail-closed).
 */
export function isBlockedAddress(ip: string): boolean {
  const clean = ip.replace(/^\[|\]$/g, '');
  const family = isIP(clean.split('%')[0]);
  if (family === 4) return isBlockedV4(clean);
  if (family === 6) return isBlockedV6(clean);
  return true;
}

/** Nombres que resuelven a la propia máquina sin pasar por DNS. */
function isLocalName(host: string): boolean {
  const h = host.toLowerCase().replace(/\.+$/, ''); // `localhost.` es localhost
  return h === 'localhost' || h.endsWith('.localhost');
}

/** Parsea la URL y exige http/https; devuelve la URL y el host sin corchetes. */
function parseOutboundUrl(rawUrl: string): { url: URL; hostname: string } {
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
  return { url, hostname: url.hostname.replace(/^\[|\]$/g, '') };
}

/** Error uniforme para un destino rechazado por la política. */
function blocked(host: string, address?: string): PreconditionFailedException {
  return new PreconditionFailedException(
    'Host de destino no permitido (privado/loopback/link-local)',
    address ? { host, address } : { host },
  );
}

/** Aplica la política a un host literal (IP o nombre local); no resuelve DNS. */
function assertLiteralHostAllowed(hostname: string): void {
  if (isLocalName(hostname)) throw blocked(hostname);
  if (isIP(hostname) && isBlockedAddress(hostname)) throw blocked(hostname);
}

/** Resolvedor por defecto: todas las direcciones A/AAAA, en el orden del sistema. */
export const systemResolver: OutboundResolver = (hostname) =>
  new Promise((resolve, reject) => {
    // Se llama a través del módulo (no desestructurado) para poder sustituirlo
    // en pruebas por un resolvedor de laboratorio.
    dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) reject(err);
      else
        resolve(
          addresses.map((a) => ({
            address: a.address,
            family: a.family === 6 ? 6 : 4,
          })),
        );
    });
  });

/**
 * Valida que una URL sea segura para el despacho saliente sin resolver DNS.
 * Lanza `PreconditionFailedException` si el esquema no es HTTP(S) o si el host
 * es una IP no pública o un nombre local en producción. Para despachar se debe
 * usar `resolveOutboundDestination`, que además valida lo que resuelve el DNS.
 */
export function assertOutboundUrlAllowed(rawUrl: string): void {
  const { hostname } = parseOutboundUrl(rawUrl);
  // En dev/test se permite apuntar a hosts privados (localhost).
  if (process.env.NODE_ENV !== 'production') return;
  assertLiteralHostAllowed(hostname);
}

/**
 * Resuelve y valida el destino de un despacho saliente.
 *
 * Un host IP se valida tal cual. Un nombre se resuelve una sola vez y se exige
 * que TODAS sus direcciones sean públicas (en producción): si un solo registro
 * apunta a una red interna se rechaza sin enviar nada. El resultado se usa con
 * `pinnedLookup` para que el socket no vuelva a consultar el DNS.
 *
 * Los errores de la política lanzan `PreconditionFailedException`; los fallos
 * de resolución (ENOTFOUND, etc.) se propagan tal cual para que el llamador los
 * registre como fallo de entrega.
 */
export async function resolveOutboundDestination(
  rawUrl: string,
  resolver: OutboundResolver = systemResolver,
): Promise<OutboundDestination> {
  const { url, hostname } = parseOutboundUrl(rawUrl);
  const enforce = process.env.NODE_ENV === 'production';
  if (enforce) assertLiteralHostAllowed(hostname);

  const literal = isIP(hostname);
  if (literal) {
    return {
      url,
      hostname,
      addresses: [{ address: hostname, family: literal === 6 ? 6 : 4 }],
    };
  }

  const addresses = await resolver(hostname);
  if (addresses.length === 0) throw blocked(hostname);
  if (enforce) {
    const privada = addresses.find((a) => isBlockedAddress(a.address));
    if (privada) throw blocked(hostname, privada.address);
  }
  return { url, hostname, addresses };
}

/** Firma de `lookup` que aceptan `http.request`/`net.connect`. */
type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | ResolvedAddress[],
  family?: number,
) => void;

/**
 * `lookup` para el socket que sólo devuelve las direcciones ya validadas. Si el
 * transporte pidiera otro host (p. ej. tras una redirección) falla en lugar de
 * resolverlo sin validar.
 */
export function pinnedLookup(destination: OutboundDestination) {
  return (
    hostname: string,
    options: { all?: boolean } | number | undefined,
    callback: LookupCallback,
  ): void => {
    if (hostname.replace(/^\[|\]$/g, '') !== destination.hostname) {
      const err: NodeJS.ErrnoException = new Error(
        `Host no validado por la política de egreso: ${hostname}`,
      );
      err.code = 'EOUTBOUNDPOLICY';
      callback(err, []);
      return;
    }
    const all = typeof options === 'object' && options?.all;
    const list = destination.addresses.map((a) => ({ ...a }));
    if (all) callback(null, list);
    else callback(null, list[0].address, list[0].family);
  };
}
