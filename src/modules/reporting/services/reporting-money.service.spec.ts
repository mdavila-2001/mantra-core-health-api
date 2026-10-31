import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common/constants/concepts';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import type {
  MoneyGroupRow,
  MoneySource,
  ReportingMoneyRepository,
} from '../repositories/reporting-money.repository';
import {
  ReportingMoneyService,
  STATIC_NOT_MEASURED,
} from './reporting-money.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const QUERY = { from: '2026-10-01T00:00:00Z', to: '2026-10-08T00:00:00Z' };

const group = (over: Partial<MoneyGroupRow>): MoneyGroupRow => ({
  currency_concept_id: CONCEPTS.CURRENCY_BOB,
  currency_code: 'BOB',
  source_rows: 1,
  with_amount: 1,
  amount: '0.00',
  ...over,
});

/**
 * Doble declarado del repositorio (sin Postgres): responde por clave de fuente.
 * Lo que exige base real (las SQL contra tablas verdaderas) queda BLOQUEADO y
 * se declara en el reporte; aquí se prueba el plegado de monedas y decimales.
 */
function build(byKey: Record<string, MoneyGroupRow[]>) {
  const aggregate = mockFn(
    async (source: MoneySource) => byKey[source.key] ?? [],
  );
  const service = new ReportingMoneyService({
    aggregate,
  } as unknown as ReportingMoneyRepository);
  return { service, aggregate };
}

describe('ReportingMoneyService (repositorio doblado)', () => {
  describe('Correcto', () => {
    it('devuelve el importe como cadena decimal exacta con 2 decimales', async () => {
      const { service } = build({
        'billing.invoices': [
          group({ with_amount: 3, source_rows: 3, amount: '1250.40' }),
        ],
      });
      const res = await service.money(QUERY, TENANT);
      expect(res.items).toEqual([
        {
          module: 'billing',
          moduleLabel: 'Facturación',
          kind: 'FACTURADO',
          currency: 'BOB',
          operations: 3,
          amount: '1250.40',
        },
      ]);
      expect(typeof res.items[0].amount).toBe('string');
    });

    it('consulta cada fuente acotada al tenant y a la ventana pedida', async () => {
      const { service, aggregate } = build({});
      await service.money(QUERY, TENANT);
      expect(aggregate).toHaveBeenCalledTimes(6);
      for (const call of aggregate.mock.calls) {
        expect(call[1].tenantId).toBe(TENANT);
        expect(call[1].window.from.toISOString()).toBe(
          '2026-10-01T00:00:00.000Z',
        );
        expect(call[1].window.to.toISOString()).toBe(
          '2026-10-08T00:00:00.000Z',
        );
      }
    });

    it('no pierde centavos al unir dos conceptos que son la misma moneda', async () => {
      // Dos ids de concepto distintos que ambos son BOB: se unen con decimal exacto.
      const { service } = build({
        'billing.quotations': [
          group({
            currency_concept_id: CONCEPTS.CURRENCY_BOB,
            with_amount: 1,
            amount: '0.10',
          }),
          group({
            currency_concept_id: DUNIT.CURRENCY_BOB,
            currency_code: 'DUNIT_CURRENCY_BOB',
            with_amount: 2,
            source_rows: 2,
            amount: '0.20',
          }),
        ],
      });
      const res = await service.money(QUERY, TENANT);
      expect(res.items).toEqual([
        expect.objectContaining({
          module: 'quotations',
          kind: 'COTIZADO',
          currency: 'BOB',
          operations: 3,
          amount: '0.30',
        }),
      ]);
    });

    it('ordena de forma determinista por módulo, etiqueta, tipo y moneda', async () => {
      const { service } = build({
        'payments.payment_transactions': [
          group({
            currency_concept_id: CONCEPTS.CURRENCY_USD,
            currency_code: 'USD',
            amount: '5.00',
          }),
          group({ amount: '9.00' }),
        ],
        'billing.invoices': [group({ amount: '1.00' })],
      });
      const res = await service.money(QUERY, TENANT);
      expect(
        res.items.map((i) => `${i.module}/${i.kind}/${i.currency}`),
      ).toEqual([
        'billing/FACTURADO/BOB',
        'payments/COBRADO/BOB',
        'payments/COBRADO/USD',
      ]);
    });
  });

  describe('Límite', () => {
    it('la moneda nunca se mezcla: BOB y USD son renglones separados', async () => {
      const { service } = build({
        'billing.invoices': [
          group({ amount: '100.00' }),
          group({
            currency_concept_id: CONCEPTS.CURRENCY_USD,
            currency_code: 'USD',
            amount: '7.00',
          }),
        ],
      });
      const res = await service.money(QUERY, TENANT);
      expect(res.items).toHaveLength(2);
      expect(res.items.map((i) => [i.currency, i.amount])).toEqual([
        ['BOB', '100.00'],
        ['USD', '7.00'],
      ]);
    });

    it('vacío honesto: sin operaciones, items es [] y no hay ceros inventados', async () => {
      const { service } = build({});
      const res = await service.money(QUERY, TENANT);
      expect(res.items).toEqual([]);
      expect(res.notMeasured).toEqual(
        expect.arrayContaining([...STATIC_NOT_MEASURED]),
      );
    });

    it('un grupo sin importes no genera renglón con 0.00', async () => {
      const { service } = build({
        'billing.invoices': [
          group({ source_rows: 4, with_amount: 0, amount: '0.00' }),
        ],
      });
      const res = await service.money(QUERY, TENANT);
      expect(res.items).toEqual([]);
      expect(
        res.notMeasured.some(
          (n) => n.module === 'billing' && n.reason.includes('4 fila(s)'),
        ),
      ).toBe(true);
    });

    it('los módulos sin fuente verificable van a notMeasured con razón', async () => {
      const { service } = build({});
      const res = await service.money(QUERY, TENANT);
      const modules = res.notMeasured.map((n) => n.module);
      expect(modules).toEqual(
        expect.arrayContaining(['pharmacy', 'insurance', 'accounting']),
      );
      for (const n of res.notMeasured)
        expect(n.reason.length).toBeGreaterThan(20);
    });
  });

  describe('Inválido', () => {
    it('sin moneda o con moneda no ISO: se aparta y se declara, no se suma ni se asume BOB', async () => {
      const { service } = build({
        'billing.payments_received': [
          group({
            currency_concept_id: null,
            currency_code: null,
            source_rows: 2,
            with_amount: 2,
            amount: '300.00',
          }),
          group({
            currency_concept_id: '99999999-9999-4999-8999-999999999999',
            currency_code: 'PUNTOS_LEALTAD',
            amount: '50.00',
          }),
        ],
      });
      const res = await service.money(QUERY, TENANT);
      expect(res.items).toEqual([]);
      const note = res.notMeasured.find((n) =>
        n.reason.includes('sin moneda reconocible'),
      );
      expect(note?.reason).toContain('3 operación(es)');
    });

    it.each([
      [
        'from posterior a to',
        { from: '2026-10-08T00:00:00Z', to: '2026-10-01T00:00:00Z' },
        'EMPTY_WINDOW',
      ],
      [
        'ventana > 92 días',
        { from: '2026-01-01T00:00:00Z', to: '2026-10-01T00:00:00Z' },
        'WINDOW_TOO_LARGE',
      ],
    ])(
      '%s → 422 VALIDATION_FAILED y no consulta',
      async (_n, query, reason) => {
        const { service, aggregate } = build({});
        await expect(service.money(query, TENANT)).rejects.toMatchObject({
          status: 422,
          details: { reason },
        });
        expect(aggregate).not.toHaveBeenCalled();
      },
    );
  });
});
