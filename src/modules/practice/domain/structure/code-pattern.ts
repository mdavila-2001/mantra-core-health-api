import type { Verdict } from './structure-rules';

/**
 * Patrones de alta masiva (contrato §3, `POST …/care-spaces/bulk`):
 * `301-{A..H}` → `301-A … 301-H`; `CAMA-{1..12}` → `CAMA-1 … CAMA-12`;
 * `{01..12}` conserva el ancho (`01 … 12`).
 *
 * El patrón tiene **exactamente un** rango. El nombre (`namePattern`) puede
 * repetir el mismo rango o usar `{}` para el elemento generado; sin marcador,
 * se le agrega el elemento al final con un espacio.
 */

/** Tope de espacios por alta masiva (contrato §3). */
export const BULK_MAX = 200;

const RANGE = /\{([A-Za-z]|\d+)\.\.([A-Za-z]|\d+)\}/g;

/** Elementos generados por un patrón. */
export interface ExpandedItem {
  readonly token: string;
  readonly code: string;
  readonly name: string;
}

function tokensOf(from: string, to: string): string[] | null {
  const numeric = /^\d+$/.test(from) && /^\d+$/.test(to);
  if (numeric) {
    const a = Number(from);
    const b = Number(to);
    if (b < a) return null;
    const width = from.startsWith('0') && from.length > 1 ? from.length : 0;
    const out: string[] = [];
    // Corta antes de reservar memoria para un rango absurdo.
    if (b - a + 1 > BULK_MAX) return Array.from({ length: BULK_MAX + 1 }, String);
    for (let n = a; n <= b; n += 1) out.push(String(n).padStart(width, '0'));
    return out;
  }
  const sameCase =
    from.length === 1 &&
    to.length === 1 &&
    /[A-Z]/.test(from) === /[A-Z]/.test(to) &&
    /[A-Za-z]/.test(from) &&
    /[A-Za-z]/.test(to);
  if (!sameCase) return null;
  const a = from.charCodeAt(0);
  const b = to.charCodeAt(0);
  if (b < a) return null;
  return Array.from({ length: b - a + 1 }, (_, i) =>
    String.fromCharCode(a + i),
  );
}

/**
 * Expande un patrón de código y nombre.
 *
 * @param codePattern - Patrón con un rango.
 * @param namePattern - Patrón del nombre.
 * @returns Los elementos, o el veredicto de por qué el patrón no sirve.
 */
export function expandPattern(
  codePattern: string,
  namePattern: string,
): { ok: true; items: ExpandedItem[] } | (Verdict & { ok: false }) {
  const ranges = [...codePattern.matchAll(RANGE)];
  if (ranges.length !== 1) {
    return {
      ok: false,
      reason: 'BULK_PATTERN_INVALID',
      details: { codePattern, expected: 'un solo rango {A..H} o {1..12}' },
    };
  }
  const [whole, from, to] = ranges[0];
  const tokens = tokensOf(from, to);
  if (!tokens) {
    return {
      ok: false,
      reason: 'BULK_PATTERN_INVALID',
      details: { codePattern, range: whole },
    };
  }
  if (tokens.length > BULK_MAX) {
    return {
      ok: false,
      reason: 'BULK_LIMIT_EXCEEDED',
      details: { max: BULK_MAX },
    };
  }
  const items = tokens.map((token) => {
    const code = codePattern.replace(whole, token);
    let name: string;
    if (namePattern.includes(whole)) name = namePattern.split(whole).join(token);
    else if (namePattern.includes('{}'))
      name = namePattern.split('{}').join(token);
    else name = `${namePattern} ${token}`.trim();
    return { token, code, name };
  });
  return { ok: true, items };
}
