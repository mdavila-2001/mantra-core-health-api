import { PreconditionFailedException } from '../../../common';

/**
 * El plan de pagos de una cotización (FT-24, v4.2.18): **sin interés**.
 *
 * Reemplaza al simulador FLAT/FRANCÉS. Acá no se calcula nada: el cronograma
 * lo arma quien atiende —anticipo y cuotas con fecha y monto propios— y el
 * servidor sólo comprueba que sea coherente. La regla que el esquema no puede
 * expresar, porque cruza filas, es que **anticipo + Σ cuotas = precio**.
 *
 * Toda la plata se compara en **centavos enteros**: los montos llegan como
 * texto con hasta dos decimales (`PRICE_PATTERN` del DTO), y sumarlos en coma
 * flotante daría diferencias de una millonésima que rechazarían un plan
 * correcto.
 */

/** Una cuota del plan, tal como llega en el alta. */
export interface PaymentPlanInstallment {
  readonly installmentNumber: number;
  readonly dueDate: string;
  readonly amount: string;
}

/** Lo que hace falta para validar un plan. */
export interface PaymentPlan {
  readonly offeredPrice: string;
  readonly downPaymentAmount: string;
  readonly paymentPlanInstallmentCount: number;
  readonly installments: readonly PaymentPlanInstallment[];
}

/** `"233.34"` → `23334`. El DTO ya garantizó el formato. */
export function toCents(amount: string): number {
  const [units, fraction = ''] = amount.split('.');
  return Number(units) * 100 + Number(fraction.padEnd(2, '0'));
}

/**
 * Comprueba que el plan cierre con el precio.
 *
 * @throws PreconditionFailedException (422) si el anticipo pasa el precio, si
 * la cantidad declarada no coincide con las cuotas enviadas, si las cuotas no
 * están numeradas 1..n, si alguna es cero, o si anticipo + cuotas no suma el
 * precio al centavo.
 */
export function assertPaymentPlanClosesOnPrice(plan: PaymentPlan): void {
  const priceCents = toCents(plan.offeredPrice);
  const downPaymentCents = toCents(plan.downPaymentAmount);

  if (downPaymentCents > priceCents) {
    throw new PreconditionFailedException(
      'El anticipo no puede superar el precio ofrecido',
      {
        offeredPrice: plan.offeredPrice,
        downPaymentAmount: plan.downPaymentAmount,
      },
    );
  }

  if (plan.paymentPlanInstallmentCount !== plan.installments.length) {
    throw new PreconditionFailedException(
      'paymentPlanInstallmentCount tiene que coincidir con las cuotas enviadas',
      {
        paymentPlanInstallmentCount: plan.paymentPlanInstallmentCount,
        installments: plan.installments.length,
      },
    );
  }

  const numberedInOrder = plan.installments.every(
    (installment, index) => installment.installmentNumber === index + 1,
  );
  if (!numberedInOrder) {
    throw new PreconditionFailedException(
      'Las cuotas tienen que venir numeradas 1, 2, 3… en orden',
    );
  }

  if (
    plan.installments.some((installment) => toCents(installment.amount) === 0)
  ) {
    throw new PreconditionFailedException(
      'Ninguna cuota puede ser de monto cero',
    );
  }

  const installmentsCents = plan.installments.reduce(
    (sum, installment) => sum + toCents(installment.amount),
    0,
  );
  if (downPaymentCents + installmentsCents !== priceCents) {
    throw new PreconditionFailedException(
      'El anticipo más las cuotas tienen que sumar el precio ofrecido',
      {
        offeredPrice: plan.offeredPrice,
        downPaymentAmount: plan.downPaymentAmount,
        installmentsTotal: (installmentsCents / 100).toFixed(2),
      },
    );
  }
}
