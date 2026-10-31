import { HttpStatus, Injectable } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import { addDecimals } from '../../../common/money/decimal-money';
import {
  WindowError,
  resolveWindow,
  type AnalyticsWindow,
} from '../../../common/time/analytics-window';
import { resolveInsuranceCurrencyCode } from '../../insurance/domain/insurance-currency';
import type {
  MoneyItemDto,
  MoneyNotMeasuredDto,
  MoneyQueryDto,
  MoneyResponseDto,
} from '../dto/reporting-money.dto';
import {
  MONEY_SOURCES,
  ReportingMoneyRepository,
  type MoneyGroupRow,
  type MoneySource,
} from '../repositories/reporting-money.repository';

/** ISO-4217: tres letras mayúsculas. Lo demás no es una moneda reconocida. */
const ISO_4217 = /^[A-Z]{3}$/;

/**
 * Módulos pedidos que NO tienen fuente verificable de importes por módulo, con
 * la razón. Se declaran siempre: «sin dato» no es lo mismo que «cero».
 */
export const STATIC_NOT_MEASURED: readonly MoneyNotMeasuredDto[] = [
  {
    module: 'pharmacy',
    reason:
      'pharmacy.* es catálogo de precios (pharmacy_product_prices), no movimiento. El movimiento está en pharmacy_inventory.medication_dispensation_lines (patient_amount/insurer_amount), pero esas líneas no llevan moneda; solo la reserva asociada, nullable. No se infiere la moneda ni se estima.',
  },
  {
    module: 'insurance',
    reason:
      'insurance.insurance_claims.total_amount tiene moneda y estado, pero el tenant dueño del siniestro es ambiguo (aseguradora o proveedor facturante). Decisión de negocio pendiente; la siniestralidad por aseguradora ya existe en la analítica de seguros.',
  },
  {
    module: 'accounting',
    reason:
      'accounting.ledger_entries es partida doble (debe = haber): sumarlo no da dinero del módulo. accounting.sales replica billing.invoices (sales.invoice_id): contarlo duplicaría lo facturado.',
  },
];

/**
 * Dinero por módulo, tipo y moneda para el portal de gestión. Todo se suma en
 * la base con decimales exactos; este servicio solo reconoce la moneda, une
 * los conceptos que son la misma moneda y declara lo que no pudo medir. No
 * suma monedas distintas entre sí ni importes de tipos distintos.
 */
@Injectable()
export class ReportingMoneyService {
  constructor(private readonly repo: ReportingMoneyRepository) {}

  private window(query: MoneyQueryDto): AnalyticsWindow {
    try {
      return resolveWindow({ from: query.from, to: query.to });
    } catch (error) {
      if (error instanceof WindowError) {
        throw new DomainException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.VALIDATION_FAILED,
          error.message,
          { reason: error.reason },
        );
      }
      throw error;
    }
  }

  async money(
    query: MoneyQueryDto,
    tenantId: string,
  ): Promise<MoneyResponseDto> {
    const window = this.window(query);
    const scope = { tenantId, window };
    const perSource = await Promise.all(
      MONEY_SOURCES.map(async (source) => ({
        source,
        groups: await this.repo.aggregate(source, scope),
      })),
    );

    const items: MoneyItemDto[] = [];
    const notMeasured: MoneyNotMeasuredDto[] = [...STATIC_NOT_MEASURED];
    for (const { source, groups } of perSource) {
      const folded = this.fold(source, groups);
      items.push(...folded.items);
      notMeasured.push(...folded.notMeasured);
    }

    items.sort(
      (a, b) =>
        a.module.localeCompare(b.module) ||
        a.moduleLabel.localeCompare(b.moduleLabel) ||
        a.kind.localeCompare(b.kind) ||
        a.currency.localeCompare(b.currency),
    );
    notMeasured.sort(
      (a, b) =>
        a.module.localeCompare(b.module) || a.reason.localeCompare(b.reason),
    );

    return {
      window: {
        from: window.from.toISOString(),
        to: window.to.toISOString(),
      },
      items,
      notMeasured,
    };
  }

  /**
   * Une los grupos de una fuente que son la misma moneda ISO y aparta lo que no
   * se puede sumar con honestidad: filas sin importe y filas sin moneda
   * reconocible. Se informan con su conteo; no se estiman ni se ponen en cero.
   */
  private fold(
    source: MoneySource,
    groups: readonly MoneyGroupRow[],
  ): { items: MoneyItemDto[]; notMeasured: MoneyNotMeasuredDto[] } {
    const byCurrency = new Map<
      string,
      { operations: number; amounts: string[] }
    >();
    let withoutAmount = 0;
    let withoutCurrency = 0;

    for (const group of groups) {
      withoutAmount += group.source_rows - group.with_amount;
      const currency = this.isoCurrency(group);
      if (currency === null) {
        withoutCurrency += group.with_amount;
        continue;
      }
      if (group.with_amount === 0) continue;
      const entry = byCurrency.get(currency) ?? { operations: 0, amounts: [] };
      entry.operations += group.with_amount;
      entry.amounts.push(group.amount);
      byCurrency.set(currency, entry);
    }

    const items: MoneyItemDto[] = [];
    for (const [currency, entry] of byCurrency) {
      items.push({
        module: source.module,
        moduleLabel: source.moduleLabel,
        kind: source.kind,
        currency,
        operations: entry.operations,
        amount: addDecimals(entry.amounts) ?? '0.00',
      });
    }

    const notMeasured: MoneyNotMeasuredDto[] = [];
    if (withoutAmount > 0) {
      notMeasured.push({
        module: source.module,
        reason: `${withoutAmount} fila(s) de «${source.moduleLabel}» (${source.kind}) sin importe registrado; no entran en la suma.`,
      });
    }
    if (withoutCurrency > 0) {
      notMeasured.push({
        module: source.module,
        reason: `${withoutCurrency} operación(es) de «${source.moduleLabel}» (${source.kind}) sin moneda reconocible; no se suman ni se asume una moneda.`,
      });
    }
    return { items, notMeasured };
  }

  private isoCurrency(group: MoneyGroupRow): string | null {
    const code = resolveInsuranceCurrencyCode(
      group.currency_concept_id,
      group.currency_code,
    );
    return code !== null && ISO_4217.test(code) ? code : null;
  }
}
