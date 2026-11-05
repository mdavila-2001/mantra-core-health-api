import { BlockList, isIP } from 'node:net';
/**
 * Rangos que nunca se llaman en producción, aunque el nombre esté en la lista
 * de hosts: loopback, privados, link-local (metadatos de la nube), CGNAT,
 * multicast y reservados, en IPv4 e IPv6.
 */
export const FORBIDDEN_RANGES = (() => {
  const list = new BlockList();
  for (const [net, prefix] of [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
  ] as const) {
    list.addSubnet(net, prefix, 'ipv4');
  }
  for (const [net, prefix] of [
    // Sin especificar, loopback e IPv4 compatible (`::a.b.c.d`).
    ['::', 96],
    // Prefijos que llevan una IPv4 adentro y la alcanzan por traducción:
    // NAT64, NAT64 local, 6to4 y Teredo.
    ['64:ff9b::', 96],
    ['64:ff9b:1::', 48],
    ['2002::', 16],
    ['2001::', 32],
    // Descarte, ULA, link-local y multicast.
    ['100::', 64],
    ['fc00::', 7],
    ['fe80::', 10],
    ['ff00::', 8],
  ] as const) {
    list.addSubnet(net, prefix, 'ipv6');
  }
  return list;
})();

/**
 * Los ocho grupos de 16 bits de una IPv6 válida (admite `::` y una IPv4 al
 * final, `::ffff:1.2.3.4`).
 */
export function ipv6Groups(address: string): number[] {
  let text = address.toLowerCase();
  const dotted = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (dotted) {
    const [a, b, c, d] = dotted[1].split('.').map(Number);
    text =
      text.slice(0, dotted.index) +
      `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail] = text.includes('::') ? text.split('::') : [text, null];
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const missing = 8 - left.length - right.length;
  const groups = [
    ...left,
    ...Array<string>(tail === null ? 0 : missing).fill('0'),
    ...right,
  ];
  return groups.map((group) => Number.parseInt(group, 16));
}

/** Si una IP cae en un rango que no se llama. */
export function isForbiddenAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return true;
  if (family === 6) {
    // IPv4 mapeada (`::ffff:a.b.c.d`, también en hexadecimal): vale lo que
    // vale su IPv4.
    const g = ipv6Groups(address);
    if (g.slice(0, 5).every((group) => group === 0) && g[5] === 0xffff) {
      return isForbiddenAddress(
        `${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`,
      );
    }
    return FORBIDDEN_RANGES.check(address, 'ipv6');
  }
  return FORBIDDEN_RANGES.check(address, 'ipv4');
}
