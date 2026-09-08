import { toCents, fromCents } from './money';

/** Una cuota calculada, antes de guardarse como `LiabilitySchedules`. */
export interface AmortizationInstallment {
  readonly installmentNumber: number;
  readonly dueDate: Date;
  readonly principalDue: string;
  readonly interestDue: string;
}

/**
 * Genera el cronograma de amortización de un pasivo (FT-26).
 *
 * ## Por qué "cuota de principal fija" y no francés/alemán a elegir
 *
 * FT-24 ("Creación de cotizaciones") es quien pide explícitamente un
 * "simulador con tasa de interés, plazo, método de cálculo de intereses" — un
 * selector de método es una decisión de ESA pantalla, y hoy no existe
 * (FT-24 es de otro responsable y todavía no se construyó). Inventar acá un
 * selector de método para adelantarse sería construir la mitad de una
 * funcionalidad ajena. Lo que FT-26 pide es más simple: "los parámetros del
 * préstamo" y que se registre su pago — no un simulador.
 *
 * Se eligió principal fijo (el mismo método que ya usa
 * `AssetService.runDepreciation` para depreciación: línea recta, "más simple
 * y verificable a mano" es la única regla implícita que el resto del módulo
 * ya sigue) en vez de cuota fija (francés): con cuota fija, dividir el
 * interés de la última cuota para que cierre en cero exige iterar sobre la
 * tasa efectiva period a period, que es más código sin que el pedido haya
 * especificado cuál de los dos métodos quiere.
 *
 * ## Por qué mensual
 *
 * El pedido no declara la periodicidad. `assets.useful_life_months` es el
 * único precedente del propio módulo para expresar un plazo, y está en
 * meses — se sigue esa misma unidad acá. Documentado como una ambigüedad
 * resuelta por el patrón existente, no como un hecho que el pedido diga.
 *
 * ## El redondeo se lo queda la última cuota
 *
 * `principalAmount / installments` no siempre es exacto en centésimas: con
 * 1000.00 a 3 cuotas, 333.33 × 3 = 999.99, un centavo corto. La diferencia se
 * ajusta en la última cuota para que la suma de `principalDue` sea
 * exactamente `principalAmount`, ni un centavo más ni menos.
 */
export function buildAmortizationSchedule(params: {
  readonly principalAmount: string;
  /** Tasa anual, en por ciento (`"12.00"` = 12 % anual). `undefined` = 0. */
  readonly annualInterestRate?: string;
  readonly installments: number;
  readonly startDate: Date;
}): readonly AmortizationInstallment[] {
  const { principalAmount, installments, startDate } = params;
  if (!Number.isInteger(installments) || installments < 1) {
    throw new Error(`Número de cuotas inválido: ${installments}`);
  }

  const principalCents = toCents(principalAmount);
  const monthlyRate = Number(params.annualInterestRate ?? '0') / 100 / 12;

  const baseInstallmentCents = Math.floor(principalCents / installments);
  let outstandingCents = principalCents;
  const filas: AmortizationInstallment[] = [];

  for (let n = 1; n <= installments; n++) {
    const esLaUltima = n === installments;
    const principalDueCents = esLaUltima ? outstandingCents : baseInstallmentCents;
    const interestDueCents = Math.round(outstandingCents * monthlyRate);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + n);

    filas.push({
      installmentNumber: n,
      dueDate,
      principalDue: fromCents(principalDueCents),
      interestDue: fromCents(interestDueCents),
    });

    outstandingCents -= principalDueCents;
  }

  return filas;
}
