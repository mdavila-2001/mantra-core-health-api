import { BlockList, isIP } from 'node:net';

/** Tipo de una regla de red de la organización (`authz.ip_access_rules`). */
export type IpRuleType = 'ALLOW' | 'DENY';

/** Lo que la evaluación necesita de una regla de red vigente. */
export interface IpRuleFacts {
  /** Permite o niega el origen que cae en el rango. */
  readonly type: IpRuleType;
  /** Rango en notación CIDR (`10.0.0.0/8`, `2001:db8::/32`). */
  readonly cidr: string;
}

/** Veredicto de las reglas de red sobre un origen. */
export type NetworkVerdict = 'ALLOWED' | 'DENIED' | 'NO_RULES';

const MAPPED_V4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

/**
 * Deja una dirección en su forma canónica comparable: sin corchetes ni zona, y
 * una IPv4 mapeada en IPv6 (`::ffff:1.2.3.4`) como IPv4.
 *
 * @param raw - Dirección tal como la entrega la petición (`req.ip`).
 * @returns La dirección normalizada, o `undefined` si no es una IP válida.
 */
export function normalizeIp(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  let ip = raw.trim();
  if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);
  const zone = ip.indexOf('%');
  if (zone >= 0) ip = ip.slice(0, zone);
  const mapped = MAPPED_V4.exec(ip);
  if (mapped) ip = mapped[1];
  return isIP(ip) === 0 ? undefined : ip;
}

/** Familia de una dirección ya normalizada. */
function familyOf(ip: string): 'ipv4' | 'ipv6' {
  return isIP(ip) === 4 ? 'ipv4' : 'ipv6';
}

/** Descompone un CIDR; `undefined` si no es una dirección válida con prefijo en rango. */
function parseCidr(
  cidr: string,
): { address: string; prefix: number; family: 'ipv4' | 'ipv6' } | undefined {
  const [address, prefixText, ...rest] = cidr.trim().split('/');
  if (rest.length > 0 || !address || !prefixText) return undefined;
  if (!/^\d{1,3}$/.test(prefixText)) return undefined;
  const normalized = normalizeIp(address);
  if (!normalized) return undefined;
  const family = familyOf(normalized);
  const prefix = Number(prefixText);
  if (prefix > (family === 'ipv4' ? 32 : 128)) return undefined;
  return { address: normalized, prefix, family };
}

/**
 * ¿Es un CIDR válido? Se comprueba al guardar una regla y antes de evaluarla.
 *
 * @param cidr - Texto `dirección/prefijo`.
 * @returns `true` si se puede evaluar.
 */
export function isValidCidr(cidr: string): boolean {
  return parseCidr(cidr) !== undefined;
}

/**
 * ¿Cae la dirección en el rango? Un CIDR o una dirección inválidos no coinciden.
 *
 * @param ip - Dirección ya normalizada.
 * @param cidr - Rango.
 * @returns `true` si la dirección pertenece al rango.
 */
export function matchesCidr(ip: string, cidr: string): boolean {
  const parsed = parseCidr(cidr);
  if (!parsed) return false;
  const family = familyOf(ip);
  if (family !== parsed.family) return false;
  const list = new BlockList();
  list.addSubnet(parsed.address, parsed.prefix, parsed.family);
  return list.check(ip, family);
}

/**
 * Evalúa un origen contra las reglas de red de UNA organización: una regla
 * `DENY` que coincide lo niega siempre; si hay reglas `ALLOW`, el origen debe
 * caer en alguna; sin reglas no hay restricción (una política que se enciende
 * antes de cargar la primera red no deja a nadie fuera, tampoco a quien tendría
 * que corregirla). Un origen que no se puede determinar se trata como fuera de
 * toda red permitida: ante la duda, se niega.
 *
 * @param ip - Origen ya normalizado, o `undefined` si no se pudo determinar.
 * @param rules - Reglas vigentes de la organización.
 * @returns `NO_RULES` si no hay reglas, `ALLOWED` o `DENIED`.
 */
export function evaluateNetworkRules(
  ip: string | undefined,
  rules: readonly IpRuleFacts[],
): NetworkVerdict {
  if (rules.length === 0) return 'NO_RULES';
  if (!ip) return 'DENIED';
  if (rules.some((r) => r.type === 'DENY' && matchesCidr(ip, r.cidr))) {
    return 'DENIED';
  }
  const allows = rules.filter((r) => r.type === 'ALLOW');
  if (allows.length === 0) return 'ALLOWED';
  return allows.some((r) => matchesCidr(ip, r.cidr)) ? 'ALLOWED' : 'DENIED';
}

/** Una regla de red con su vigencia. */
export interface ScheduledIpRule extends IpRuleFacts {
  /** Desde cuándo rige; ausente = desde siempre. */
  readonly validFrom?: Date;
  /** Hasta cuándo rige (exclusive); ausente = sin fin. */
  readonly validTo?: Date;
}

/**
 * Las reglas que rigen en un instante.
 *
 * @param rules - Reglas con vigencia.
 * @param at - Instante.
 * @returns Las que rigen en `at`.
 */
export function rulesEffectiveAt(
  rules: readonly ScheduledIpRule[],
  at: Date,
): IpRuleFacts[] {
  return rules
    .filter(
      (r) =>
        (!r.validFrom || r.validFrom <= at) && (!r.validTo || r.validTo > at),
    )
    .map((r) => ({ type: r.type, cidr: r.cidr.trim() }));
}

/**
 * ¿Queda el origen fuera de las reglas AHORA o en algún momento futuro en que
 * cambia el conjunto vigente? Una regla `ALLOW` programada para mañana no
 * puede dejarse pasar: el día que entre en vigor encerraría a todos los que no
 * estén en ella, incluido quien la guarda. Se evalúa el conjunto vigente en
 * `now` y en cada inicio o fin de vigencia posterior.
 *
 * @param ip - Origen ya normalizado, o `undefined` si no se pudo determinar.
 * @param rules - Reglas con su vigencia.
 * @param now - Instante actual.
 * @returns `true` si en algún momento el origen quedaría negado.
 */
export function isDeniedNowOrLater(
  ip: string | undefined,
  rules: readonly ScheduledIpRule[],
  now: Date,
): boolean {
  const boundaries = rules
    .flatMap((r) => [r.validFrom, r.validTo])
    .filter((d): d is Date => d instanceof Date && d > now);
  return [now, ...boundaries].some(
    (at) => evaluateNetworkRules(ip, rulesEffectiveAt(rules, at)) === 'DENIED',
  );
}
