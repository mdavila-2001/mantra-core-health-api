import { isIP } from 'node:net';

/**
 * Guarda de destinos del runner de QA. El servidor nunca llama a una URL que
 * no resuelva, por esquema + host + puerto + prefijo de ruta, a un destino
 * registrado por administración; y nunca conecta a una IP de red interna,
 * loopback, link-local o metadata cloud salvo que el destino lo autorice
 * explícitamente (y metadata/link-local, ni así).
 *
 * Pura y sin red: la resolución DNS la hace el cliente HTTP y le pasa aquí
 * cada dirección obtenida, antes de conectar y fijando esa IP.
 */

export interface TargetAllowlist {
  scheme: 'http' | 'https';
  host: string;
  port: number;
  allowedPathPrefixes: string[];
  allowPrivateNetwork: boolean;
}

export interface GuardViolation {
  code: string;
  message: string;
}

export type AddressClass =
  | 'PUBLIC'
  | 'PRIVATE'
  | 'LOOPBACK'
  | 'LINK_LOCAL'
  | 'UNSPECIFIED'
  | 'SHARED_CGNAT'
  | 'MULTICAST'
  | 'RESERVED'
  | 'INVALID';

const DEFAULT_PORT = { http: 80, https: 443 } as const;

/** Construye la URL de un caso sobre el destino, sin dejar que el path escape de él. */
export function buildCaseUrl(
  target: TargetAllowlist,
  requestPath: string,
): string {
  const path = requestPath.startsWith('/') ? requestPath : `/${requestPath}`;
  const defaultPort = DEFAULT_PORT[target.scheme];
  const port = target.port === defaultPort ? '' : `:${target.port}`;
  return `${target.scheme}://${target.host}${port}${path}`;
}

/**
 * Comprueba que una URL cae dentro del destino. Se compara la URL YA
 * normalizada por el parser (host en minúsculas, puntos resueltos, `%2e%2e`
 * decodificado en segmentos), no la cadena que llegó.
 */
export function urlViolations(
  rawUrl: string,
  target: TargetAllowlist,
): GuardViolation[] {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return [{ code: 'URL_INVALID', message: 'La URL del caso no es válida' }];
  }
  const violations: GuardViolation[] = [];
  const scheme = url.protocol.replace(/:$/, '');
  if (scheme !== target.scheme) {
    violations.push({
      code: 'SCHEME_NOT_ALLOWED',
      message: `Esquema ${scheme} fuera del destino`,
    });
  }
  if (url.username || url.password) {
    violations.push({
      code: 'USERINFO_NOT_ALLOWED',
      message: 'La URL no puede llevar credenciales',
    });
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host !== target.host.toLowerCase()) {
    violations.push({
      code: 'HOST_NOT_ALLOWED',
      message: `Host ${host} fuera del destino`,
    });
  }
  const port = url.port
    ? Number(url.port)
    : DEFAULT_PORT[scheme as 'http' | 'https'];
  if (port !== target.port) {
    violations.push({
      code: 'PORT_NOT_ALLOWED',
      message: `Puerto ${port} fuera del destino`,
    });
  }
  const path = url.pathname;
  const inPrefix = target.allowedPathPrefixes.some((prefix) => {
    const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return path === prefix || path.startsWith(normalized) || prefix === '/';
  });
  if (!inPrefix) {
    violations.push({
      code: 'PATH_NOT_ALLOWED',
      message: `Ruta ${path} fuera de los prefijos aprobados`,
    });
  }
  return violations;
}

function ipv4ToInt(ip: string): number {
  return (
    ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0
  );
}

function inCidr4(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

/** Expande una IPv6 a 8 grupos de 16 bits. */
function ipv6Groups(ip: string): number[] {
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const parse = (part: string) => (part ? part.split(':') : []);
  let headParts = parse(head);
  let tailParts = parse(tail);
  // IPv4 embebida al final (::ffff:1.2.3.4).
  const convert = (parts: string[]) => {
    const last = parts[parts.length - 1];
    if (last && last.includes('.')) {
      const n = ipv4ToInt(last);
      return [
        ...parts.slice(0, -1),
        (n >>> 16).toString(16),
        (n & 0xffff).toString(16),
      ];
    }
    return parts;
  };
  headParts = convert(headParts);
  tailParts = convert(tailParts);
  const missing = ip.includes('::')
    ? 8 - headParts.length - tailParts.length
    : 0;
  const zeros: string[] = new Array<string>(missing).fill('0');
  return [...headParts, ...zeros, ...tailParts].map((g) => parseInt(g, 16));
}

/** Clasifica una dirección IP (v4 o v6) por su rango. */
export function classifyAddress(address: string): AddressClass {
  const version = isIP(address);
  if (version === 4) {
    if (inCidr4(address, '0.0.0.0', 8)) return 'UNSPECIFIED';
    if (inCidr4(address, '127.0.0.0', 8)) return 'LOOPBACK';
    if (inCidr4(address, '169.254.0.0', 16)) return 'LINK_LOCAL';
    if (
      inCidr4(address, '10.0.0.0', 8) ||
      inCidr4(address, '172.16.0.0', 12) ||
      inCidr4(address, '192.168.0.0', 16)
    ) {
      return 'PRIVATE';
    }
    if (inCidr4(address, '100.64.0.0', 10)) return 'SHARED_CGNAT';
    if (inCidr4(address, '224.0.0.0', 4)) return 'MULTICAST';
    if (inCidr4(address, '240.0.0.0', 4)) return 'RESERVED';
    return 'PUBLIC';
  }
  if (version === 6) {
    const g = ipv6Groups(address);
    if (g.every((x) => x === 0)) return 'UNSPECIFIED';
    if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return 'LOOPBACK';
    // IPv4 mapeada: se clasifica como la IPv4 que es.
    if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
      return classifyAddress(
        [g[6] >> 8, g[6] & 0xff, g[7] >> 8, g[7] & 0xff].join('.'),
      );
    }
    if ((g[0] & 0xffc0) === 0xfe80) return 'LINK_LOCAL';
    if ((g[0] & 0xfe00) === 0xfc00) return 'PRIVATE';
    if ((g[0] & 0xff00) === 0xff00) return 'MULTICAST';
    return 'PUBLIC';
  }
  return 'INVALID';
}

/**
 * ¿Se puede conectar a esta dirección? Link-local (que incluye la metadata
 * de nubes, 169.254.169.254), sin especificar, multicast y reservadas nunca.
 * Privadas y loopback sólo si el destino lo autoriza: hay entornos de prueba
 * legítimos en red interna, pero abrirla tiene que ser una decisión.
 */
export function addressViolation(
  address: string,
  allowPrivateNetwork: boolean,
): GuardViolation | null {
  const kind = classifyAddress(address);
  if (kind === 'PUBLIC') return null;
  if (
    (kind === 'PRIVATE' || kind === 'LOOPBACK' || kind === 'SHARED_CGNAT') &&
    allowPrivateNetwork
  ) {
    return null;
  }
  return {
    code: `ADDRESS_${kind}`,
    message: `El destino resuelve a una dirección ${kind.toLowerCase()} no autorizada`,
  };
}

/** Cabeceras que nunca se reenvían desde la definición de un caso ni se guardan en claro. */
export const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'proxy-authorization',
  'x-api-key',
  'x-auth-token',
];

/** Redacción total (no prefijo ni sufijo): un fragmento de un secreto sigue siendo un secreto. */
export function redactHeaders(
  headers: Record<string, unknown>,
  extraSensitive: readonly string[] = [],
): Record<string, unknown> {
  const sensitive = new Set([
    ...SENSITIVE_HEADERS,
    ...extraSensitive.map((h) => h.toLowerCase()),
  ]);
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) =>
      sensitive.has(name.toLowerCase()) ? [name, '[redactado]'] : [name, value],
    ),
  );
}

/** Sólo se aceptan referencias a secretos de prueba, nunca a secretos de la plataforma. */
export const SECRET_REF_PATTERN = /^QA_TARGET_[A-Z0-9_]{1,60}$/;
