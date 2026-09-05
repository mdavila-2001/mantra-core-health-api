import { toCents, fromCents } from '../../billing/money.util';
import type { InterestCalculationMethod } from '../dto/create-quotation.dto';

/** Una cuota simulada (o ya congelada) del plan de pagos de una cotización. */
export interface InstallmentPreview {
  /**
   * Número de orden de la cuota dentro del plan (1-based).
   */
  installmentNumber: number;
  /**
   * Fecha de vencimiento de la cuota.
   */
  dueDate: Date;
  /**
   * Porción de capital de la cuota.
   */
  principalAmount: string;
  /**
   * Porción de interés de la cuota.
   */
  interestAmount: string;
  /**
   * Importe total de la cuota (capital + interés).
   */
  totalAmount: string;
}

/**
 * Suma `months` meses a `date`, preservando el día del mes cuando el mes
 * destino lo permite (si no, `Date` normaliza al mes siguiente — igual que
 * cualquier calculadora de vencimientos mensuales sobre el día 31).
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

/**
 * Reparte `totalCents` en `count` partes lo más iguales posible, en enteros de
 * centavos, de forma que la suma sea exactamente `totalCents` (el resto de la
 * división entera queda en la última parte).
 */
function splitCentsEvenly(totalCents: number, count: number): number[] {
  const base = Math.trunc(totalCents / count);
  const parts = new Array<number>(count).fill(base);
  parts[count - 1] = totalCents - base * (count - 1);
  return parts;
}

/**
 * Simulador de financiamiento (FT-24): calcula la tabla de cuotas de un plan
 * de pagos, sin persistir nada. Es una función pura — mismos parámetros,
 * mismo resultado siempre — para que el endpoint `/quotations/simulate` y la
 * creación de una cotización (que congela el resultado) compartan una única
 * implementación.
 *
 * **Convención de la tasa**: `interestRatePercent` es una tasa **mensual**, en
 * porcentaje (p. ej. `"2.5"` = 2.5% mensual). Las cuotas vencen una por mes a
 * partir de `attentionDate` (cuota 1 = `attentionDate` + 1 mes).
 *
 * - `FLAT`: interés simple sobre el capital total —
 *   `interésTotal = capital × tasa × plazo` — repartido en partes iguales
 *   entre las cuotas; el capital también se reparte en partes iguales. El
 *   resto de la división entera (en centavos) se ajusta en la última cuota
 *   para que las sumas cierren exacto.
 * - `FRENCH`: amortización francesa estándar —
 *   `cuota = capital × i / (1 − (1 + i)^−n)`, con `i` la tasa mensual en
 *   fracción y `n` el plazo — capital creciente, interés decreciente, cuota
 *   total fija salvo el ajuste de redondeo de la última cuota (que absorbe el
 *   saldo de capital remanente, para que la suma de capital sea exactamente
 *   igual al precio ofrecido).
 */
export function simulatePaymentPlan(
  offeredPrice: string,
  installmentCount: number,
  interestRatePercent: string,
  method: InterestCalculationMethod,
  attentionDate: Date,
): InstallmentPreview[] {
  const principalCents = toCents(offeredPrice);
  const monthlyRate = Number(interestRatePercent) / 100;

  const rows: Array<{ principalCents: number; interestCents: number }> =
    method === 'FLAT'
      ? simulateFlat(principalCents, installmentCount, monthlyRate)
      : simulateFrench(principalCents, installmentCount, monthlyRate);

  return rows.map((row, index) => ({
    installmentNumber: index + 1,
    dueDate: addMonths(attentionDate, index + 1),
    principalAmount: fromCents(row.principalCents),
    interestAmount: fromCents(row.interestCents),
    totalAmount: fromCents(row.principalCents + row.interestCents),
  }));
}

/** Interés simple sobre el capital total, repartido en partes iguales. */
function simulateFlat(
  principalCents: number,
  installmentCount: number,
  monthlyRate: number,
): Array<{ principalCents: number; interestCents: number }> {
  const totalInterestCents = Math.round(
    principalCents * monthlyRate * installmentCount,
  );
  const principalParts = splitCentsEvenly(principalCents, installmentCount);
  const interestParts = splitCentsEvenly(totalInterestCents, installmentCount);
  return principalParts.map((principal, i) => ({
    principalCents: principal,
    interestCents: interestParts[i],
  }));
}

/** Amortización francesa: cuota fija, capital creciente e interés decreciente. */
function simulateFrench(
  principalCents: number,
  installmentCount: number,
  monthlyRate: number,
): Array<{ principalCents: number; interestCents: number }> {
  const paymentCents =
    monthlyRate === 0
      ? principalCents / installmentCount
      : (principalCents * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -installmentCount));

  const rows: Array<{ principalCents: number; interestCents: number }> = [];
  let balanceCents = principalCents;
  for (let k = 1; k <= installmentCount; k++) {
    const isLast = k === installmentCount;
    const interestCents = Math.round(balanceCents * monthlyRate);
    // La última cuota absorbe el saldo remanente exacto: así la suma de
    // capital de todas las cuotas siempre cierra con `offeredPrice`, sin
    // depender de que el redondeo de las anteriores haya sido perfecto.
    const principalForRow = isLast
      ? balanceCents
      : Math.round(paymentCents - interestCents);
    rows.push({ principalCents: principalForRow, interestCents });
    balanceCents -= principalForRow;
  }
  return rows;
}
