import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import type { AnalyticsWindow } from '../../../common/time/analytics-window';
import { BILL } from '../../billing/billing.concepts';
import type { MoneyKind } from '../dto/reporting-money.dto';

/** Tenant y ventana de toda consulta de dinero: obligatorios, sin barrido global. */
export interface MoneyScope {
  tenantId: string;
  window: AnalyticsWindow;
}

/** Una fuente real de importes, ya declarada: de qué tabla sale y qué cuenta. */
export interface MoneySource {
  /** Clave interna estable (no sale en la respuesta). */
  key: string;
  /** Código del módulo dueño de la tabla. */
  module: string;
  moduleLabel: string;
  kind: MoneyKind;
  build: (scope: MoneyScope) => { sql: string; params: unknown[] };
}

/** Un grupo (moneda) devuelto por la base: el importe ya viene sumado y como texto. */
export interface MoneyGroupRow {
  currency_concept_id: string | null;
  currency_code: string | null;
  /** Filas de la fuente en la ventana, con o sin importe. */
  source_rows: number;
  /** Filas con importe: las únicas que entran en la suma. */
  with_amount: number;
  /** `numeric` redondeado a 2 decimales, como cadena. Nunca pasa por `number`. */
  amount: string;
}

const placeholders = (ids: readonly string[]) => ids.map(() => '?').join(', ');

/**
 * Plantilla común. Lo único que se interpola son fragmentos literales de este
 * archivo (tablas, columnas); toda entrada —tenant, ventana, estados— viaja
 * como parámetro. El importe se suma y se redondea en la base (`numeric`).
 */
function template(parts: {
  from: string;
  amount: string;
  currency: string;
  where: string;
}) {
  return `SELECT ${parts.currency} AS currency_concept_id,
                 cc.code AS currency_code,
                 count(*)::int AS source_rows,
                 count(${parts.amount})::int AS with_amount,
                 round(coalesce(sum(${parts.amount}), 0), 2)::text AS amount
            FROM ${parts.from}
            LEFT JOIN terminology.catalog_concepts cc ON cc.id = ${parts.currency}
           WHERE ${parts.where}
           GROUP BY 1, 2
           ORDER BY 1 NULLS FIRST, 2 NULLS FIRST`;
}

/** Las columnas `date` se leen como medianoche UTC para compararlas con la ventana. */
const dateAsUtc = (column: string) =>
  `(${column}::timestamp AT TIME ZONE 'UTC')`;

const INVOICE_COUNTED_STATUSES = [
  BILL.INVOICE_ISSUED,
  BILL.INVOICE_PARTIALLY_PAID,
  BILL.INVOICE_PAID,
  BILL.INVOICE_IN_COLLECTION,
  BILL.INVOICE_PAYMENT_PLAN,
  BILL.INVOICE_ADJUSTED,
] as const;
const PAYMENT_RECEIVED_STATUSES = [
  BILL.PAYMENT_CLEARED,
  BILL.PAYMENT_RECONCILED,
] as const;
const GATEWAY_CAPTURED_STATUSES = [
  CONCEPTS.TXN_CAPTURED,
  CONCEPTS.TXN_SETTLED,
] as const;

/**
 * Fuentes de dinero con tabla real verificada en las entidades (ver el
 * contrato `H2-dinero-y-heatmap.md`). Cada una acota al tenant por su propia
 * vía: `practice_id → practice.practices.tenant_id` o `payment_intents.tenant_id`.
 */
export const MONEY_SOURCES: readonly MoneySource[] = [
  {
    key: 'billing.invoices',
    module: 'billing',
    moduleLabel: 'Facturación',
    kind: 'FACTURADO',
    build: ({ tenantId, window }) => ({
      sql: template({
        from: 'billing.invoices i JOIN practice.practices p ON p.id = i.practice_id',
        amount: 'i.total',
        currency: 'i.currency_concept_id',
        where: `p.tenant_id = ?
                AND ${dateAsUtc('i.issue_date')} >= ? AND ${dateAsUtc('i.issue_date')} < ?
                AND i.status_concept_id IN (${placeholders(INVOICE_COUNTED_STATUSES)})`,
      }),
      params: [tenantId, window.from, window.to, ...INVOICE_COUNTED_STATUSES],
    }),
  },
  {
    key: 'billing.invoices.credit_notes',
    module: 'billing',
    moduleLabel: 'Facturación · notas de crédito',
    kind: 'OTRO',
    build: ({ tenantId, window }) => ({
      sql: template({
        from: 'billing.invoices i JOIN practice.practices p ON p.id = i.practice_id',
        amount: 'i.total',
        currency: 'i.currency_concept_id',
        where: `p.tenant_id = ?
                AND ${dateAsUtc('i.issue_date')} >= ? AND ${dateAsUtc('i.issue_date')} < ?
                AND i.status_concept_id = ?`,
      }),
      params: [tenantId, window.from, window.to, BILL.INVOICE_CREDIT_NOTE],
    }),
  },
  {
    key: 'billing.payments_received',
    module: 'billing',
    moduleLabel: 'Facturación · cobros registrados',
    kind: 'COBRADO',
    // `payments_received` no lleva moneda: la moneda es la de la factura que
    // salda. Sin factura (o factura sin moneda) el cobro cae en «sin moneda».
    build: ({ tenantId, window }) => ({
      sql: template({
        from: `billing.payments_received r
               JOIN practice.practices p ON p.id = r.practice_id
               LEFT JOIN billing.invoices ri ON ri.id = r.invoice_id`,
        amount: 'r.amount',
        currency: 'ri.currency_concept_id',
        where: `p.tenant_id = ?
                AND coalesce(r.received_at, r.created_at) >= ?
                AND coalesce(r.received_at, r.created_at) < ?
                AND r.status_concept_id IN (${placeholders(PAYMENT_RECEIVED_STATUSES)})`,
      }),
      params: [tenantId, window.from, window.to, ...PAYMENT_RECEIVED_STATUSES],
    }),
  },
  {
    key: 'billing.quotations',
    module: 'quotations',
    moduleLabel: 'Cotizaciones',
    kind: 'COTIZADO',
    build: ({ tenantId, window }) => ({
      sql: template({
        from: 'billing.quotations q JOIN practice.practices p ON p.id = q.practice_id',
        amount: 'q.offered_price',
        currency: 'q.currency_concept_id',
        where: 'p.tenant_id = ? AND q.created_at >= ? AND q.created_at < ?',
      }),
      params: [tenantId, window.from, window.to],
    }),
  },
  {
    key: 'payments.payment_transactions',
    module: 'payments',
    moduleLabel: 'Pagos · pasarela',
    kind: 'COBRADO',
    build: ({ tenantId, window }) => ({
      sql: template({
        from: `payments.payment_transactions t
               JOIN payments.payment_intents pi ON pi.id = t.payment_intent_id`,
        amount: 't.amount',
        currency: 't.currency_concept_id',
        where: `pi.tenant_id = ?
                AND coalesce(t.processed_at, t.created_at) >= ?
                AND coalesce(t.processed_at, t.created_at) < ?
                AND t.status_concept_id IN (${placeholders(GATEWAY_CAPTURED_STATUSES)})`,
      }),
      params: [tenantId, window.from, window.to, ...GATEWAY_CAPTURED_STATUSES],
    }),
  },
  {
    key: 'payments.refunds',
    module: 'payments',
    moduleLabel: 'Pagos · reembolsos',
    kind: 'OTRO',
    build: ({ tenantId, window }) => ({
      sql: template({
        from: `payments.refunds rf
               JOIN payments.payment_transactions t ON t.id = rf.payment_transaction_id
               JOIN payments.payment_intents pi ON pi.id = t.payment_intent_id`,
        amount: 'rf.amount',
        currency: 'rf.currency_concept_id',
        where: `pi.tenant_id = ?
                AND coalesce(rf.processed_at, rf.created_at) >= ?
                AND coalesce(rf.processed_at, rf.created_at) < ?
                AND rf.status_concept_id = ?`,
      }),
      params: [tenantId, window.from, window.to, CONCEPTS.REFUND_COMPLETED],
    }),
  },
];

/**
 * Lecturas agregadas de dinero. Solo agregados por moneda: ninguna fila lleva
 * paciente, factura ni persona. Una consulta por fuente, todas con tenant y
 * ventana, ordenadas por moneda para que la salida sea determinista.
 */
@Injectable()
export class ReportingMoneyRepository {
  constructor(private readonly em: EntityManager) {}

  /** Agrega una fuente por moneda dentro del tenant y la ventana. */
  aggregate(source: MoneySource, scope: MoneyScope): Promise<MoneyGroupRow[]> {
    const { sql, params } = source.build(scope);
    return this.em.getConnection().execute<MoneyGroupRow[]>(sql, params, 'all');
  }
}
