/**
 * Reparto de un importe cubierto entre el paciente y la aseguradora.
 *
 * Es la regla que decidió el propietario el 2026-10-23 para que un cobro con
 * seguro no se pueda inflar (carril 16, REQ-16-025 y REQ-16-035):
 *
 * ```text
 * paciente    = copago + (monto − copago) × (100 − % de cobertura) / 100
 * aseguradora = monto − paciente
 * ```
 *
 * - **Redondeo a favor del paciente**: su parte se trunca a centavos y el
 *   centavo sobrante queda del lado de la aseguradora, así que
 *   `paciente + aseguradora = monto` siempre, sin un céntimo de diferencia.
 * - **Copago mayor o igual que el monto**: el paciente paga el monto y la
 *   aseguradora nada. Nunca se le cobra al paciente más que el monto.
 * - **Sin porcentaje y con copago**: el beneficio es «sólo copago» y se lee como
 *   cobertura del 100 % sobre el resto.
 * - **Sin porcentaje ni copago**: el beneficio no dice cuánto paga nadie; no se
 *   adivina, se rechaza.
 *
 * Opera con `BigInt` sobre la representación decimal literal, sin coma
 * flotante: es la misma técnica de `common/money/decimal-money.ts`, que no
 * expone un truncamiento a centavos.
 */

/** Lo que el plan dice de un servicio, tal cual sale de `insurance_plan_benefits`. */
export interface CoverageTerms {
  /** Porcentaje cubierto por la aseguradora, 0–100. `null` si el plan no lo declara. */
  readonly coveragePercent: string | null;
  /** Monto fijo a cargo del paciente. `null` si el plan no lo declara. */
  readonly copayAmount: string | null;
}

/** Cuánto paga cada parte, en cadenas decimales con dos posiciones. */
export interface CoverageSplit {
  readonly patientAmount: string;
  readonly insurerAmount: string;
}

/** Por qué un importe o unas condiciones no se pueden repartir. */
export type CoverageSplitFailure =
  | 'INVALID_AMOUNT'
  | 'INVALID_COPAY'
  | 'INVALID_COVERAGE_PERCENT'
  | 'BENEFIT_WITHOUT_TERMS';

/** Error tipificado del reparto: el servicio lo traduce a 422. */
export class CoverageSplitError extends Error {
  constructor(readonly failure: CoverageSplitFailure) {
    super(failure);
    this.name = 'CoverageSplitError';
  }
}

const MONEY = /^\d+(\.\d{1,2})?$/;
const PERCENT = /^\d+(\.\d{1,4})?$/;
const PERCENT_SCALE = 4;

/** Importe con hasta dos decimales, en centavos. */
function toCents(text: string, failure: CoverageSplitFailure): bigint {
  const clean = text.trim();
  if (!MONEY.test(clean)) throw new CoverageSplitError(failure);
  const [whole, fraction = ''] = clean.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

/** Porcentaje con hasta cuatro decimales, escalado a 10⁻⁴. */
function toScaledPercent(text: string): bigint {
  const clean = text.trim();
  if (!PERCENT.test(clean)) {
    throw new CoverageSplitError('INVALID_COVERAGE_PERCENT');
  }
  const [whole, fraction = ''] = clean.split('.');
  const scaled =
    BigInt(whole) * 10n ** BigInt(PERCENT_SCALE) +
    BigInt(fraction.padEnd(PERCENT_SCALE, '0'));
  if (scaled > 100n * 10n ** BigInt(PERCENT_SCALE)) {
    throw new CoverageSplitError('INVALID_COVERAGE_PERCENT');
  }
  return scaled;
}

/** Centavos a cadena con dos decimales. */
function formatCents(cents: bigint): string {
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, '0');
  return `${whole.toString()}.${fraction}`;
}

/**
 * Reparte `billedAmount` entre paciente y aseguradora según el beneficio.
 *
 * @param billedAmount - Monto del ítem, no negativo y con hasta dos decimales.
 * @param terms - Porcentaje de cobertura y copago del beneficio vigente.
 * @returns La parte de cada uno; suman exactamente `billedAmount`.
 * @throws CoverageSplitError si algún dato es inválido o el beneficio no tiene
 *   condiciones económicas.
 */
export function splitCoveredAmount(
  billedAmount: string,
  terms: CoverageTerms,
): CoverageSplit {
  const billed = toCents(billedAmount, 'INVALID_AMOUNT');
  const hasPercent = terms.coveragePercent != null;
  const hasCopay = terms.copayAmount != null;
  if (!hasPercent && !hasCopay) {
    throw new CoverageSplitError('BENEFIT_WITHOUT_TERMS');
  }
  const copay = hasCopay ? toCents(terms.copayAmount, 'INVALID_COPAY') : 0n;
  const full = 100n * 10n ** BigInt(PERCENT_SCALE);
  const percent = hasPercent ? toScaledPercent(terms.coveragePercent) : full;

  if (copay >= billed) {
    return { patientAmount: formatCents(billed), insurerAmount: '0.00' };
  }
  // paciente (en centavos) = copago + (monto − copago) × (100 − %) / 100,
  // truncado: la división entera de BigInt redondea hacia cero y todo es ≥ 0.
  const patient = copay + ((billed - copay) * (full - percent)) / full;
  return {
    patientAmount: formatCents(patient),
    insurerAmount: formatCents(billed - patient),
  };
}
