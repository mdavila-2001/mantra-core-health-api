import { CAPACITY_DERIVATION, type FormCode } from './structure-catalog';

/**
 * Capacidad derivada vs. declarada (contrato §3, `GET /sites/:siteId/capacity`)
 * y estado calculado de una habilitación.
 */

/** Lo mínimo de un espacio para contarlo. */
export interface CountableSpace {
  readonly formCode: FormCode | null;
  readonly functionCode: string | null;
  readonly active: boolean;
  readonly censable: boolean | null | undefined;
}

/** Una línea declarada (la vigente de cada tipo). */
export interface DeclaredLine {
  readonly kindCode: string;
  readonly quantity: number;
}

/**
 * Cuenta los espacios activos por tipo de capacidad.
 *
 * @param spaces - Espacios de la sede.
 * @returns Una línea por tipo de `CAPACITY_DERIVATION`, incluidas las que dan 0.
 */
export function deriveCapacity(
  spaces: readonly CountableSpace[],
): { kindCode: string; quantity: number }[] {
  return CAPACITY_DERIVATION.map((d) => ({
    kindCode: d.kindCode,
    quantity: spaces.filter(
      (s) =>
        s.active &&
        (!d.forms || (s.formCode !== null && d.forms.includes(s.formCode))) &&
        (!d.functions ||
          (s.functionCode !== null && d.functions.includes(s.functionCode))) &&
        (d.censable === undefined || Boolean(s.censable) === d.censable),
    ).length,
  }));
}

/**
 * Diferencias entre lo declarado y lo derivado (sólo tipos declarados).
 *
 * @param declared - Lo declarado vigente.
 * @param derived - Lo contado.
 */
export function capacityGaps(
  declared: readonly DeclaredLine[],
  derived: readonly { kindCode: string; quantity: number }[],
): { kindCode: string; declared: number; derived: number }[] {
  const byKind = new Map(derived.map((d) => [d.kindCode, d.quantity]));
  return declared
    .map((d) => ({
      kindCode: d.kindCode,
      declared: d.quantity,
      derived: byKind.get(d.kindCode) ?? 0,
    }))
    .filter((g) => g.declared !== g.derived);
}

/** Estado base de una habilitación antes de mirar el vencimiento. */
export type LicenseBaseStatus =
  | 'LIC_IN_PROCESS'
  | 'LIC_VALID'
  | 'LIC_SUSPENDED'
  | 'LIC_REVOKED';

/**
 * Estado que se muestra: una habilitación vigente cuyo `valid_to` ya pasó se
 * lee `LIC_EXPIRED` (contrato §3, «vencida = valid_to < hoy»). No se escribe:
 * se calcula al leer, así no hace falta un proceso que la marque.
 *
 * @param base - Estado guardado.
 * @param validTo - Fin de vigencia (fecha).
 * @param today - Hoy, en `YYYY-MM-DD`.
 */
export function effectiveLicenseStatus(
  base: LicenseBaseStatus,
  validTo: string | null,
  today: string,
): LicenseBaseStatus | 'LIC_EXPIRED' {
  if (base === 'LIC_VALID' && validTo !== null && validTo < today) {
    return 'LIC_EXPIRED';
  }
  return base;
}
