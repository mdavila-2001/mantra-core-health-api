import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveWindow } from '../../../common/time/analytics-window';
import { MONEY_SOURCES } from './reporting-money.repository';

const TENANT = '11111111-1111-4111-8111-111111111111';
const window = resolveWindow({
  from: '2026-10-01T00:00:00Z',
  to: '2026-10-08T00:00:00Z',
});

/**
 * Sin Postgres no se puede ejecutar el SQL; estas pruebas fijan lo que sí se
 * puede verificar sin base: que cada consulta está parametrizada, acotada al
 * tenant y a la ventana, y que toda tabla/columna citada existe en las
 * entidades (lectura del código fuente, no ejecución).
 */
describe('MONEY_SOURCES (SQL sin ejecutar)', () => {
  const root = join(process.cwd(), 'src', 'modules');
  const entity = (path: string) => readFileSync(join(root, path), 'utf8');

  it.each(MONEY_SOURCES.map((s) => [s.key, s] as const))(
    '%s: tenant y ventana son parámetros, no texto; tantos ? como parámetros',
    (_key, source) => {
      const { sql, params } = source.build({ tenantId: TENANT, window });
      expect(sql).not.toContain(TENANT);
      expect(sql).not.toMatch(/2026-10/);
      expect(params[0]).toBe(TENANT);
      expect(params).toContain(window.from);
      expect(params).toContain(window.to);
      expect(sql.match(/\?/g)?.length).toBe(params.length);
      expect(sql).toMatch(/sum\(/);
      expect(sql).toMatch(/GROUP BY 1, 2\s+ORDER BY/);
    },
  );

  it('ninguna consulta suma monedas: siempre agrupa por moneda', () => {
    for (const source of MONEY_SOURCES) {
      const { sql } = source.build({ tenantId: TENANT, window });
      expect(sql).toMatch(/currency_concept_id/);
      expect(sql).toMatch(/GROUP BY 1, 2/);
    }
  });

  it('ninguna fuente expone columnas de personas', () => {
    for (const source of MONEY_SOURCES) {
      const { sql } = source.build({ tenantId: TENANT, window });
      expect(sql).not.toMatch(/patient|profile|user_id|business_partner/i);
    }
  });

  it('las columnas de importe y moneda existen en las entidades citadas', () => {
    const expectations: Array<[string, string[]]> = [
      [
        'billing/entities/invoices.entity.ts',
        [
          "fieldName: 'currency_concept_id'",
          "fieldName: 'issue_date'",
          "fieldName: 'status_concept_id'",
          'total?: string',
        ],
      ],
      [
        'billing/entities/payments_received.entity.ts',
        [
          "fieldName: 'invoice_id'",
          "fieldName: 'received_at'",
          'amount!: string',
        ],
      ],
      [
        'billing/entities/quotations.entity.ts',
        ["fieldName: 'offered_price'", "fieldName: 'currency_concept_id'"],
      ],
      [
        'payments/entities/payment_transactions.entity.ts',
        [
          "fieldName: 'payment_intent_id'",
          "fieldName: 'currency_concept_id'",
          'amount!: string',
        ],
      ],
      [
        'payments/entities/payment_intents.entity.ts',
        ["fieldName: 'tenant_id'"],
      ],
      [
        'payments/entities/refunds.entity.ts',
        [
          "fieldName: 'payment_transaction_id'",
          "fieldName: 'currency_concept_id'",
          "fieldName: 'processed_at'",
        ],
      ],
      ['practice/entities/practices.entity.ts', ["fieldName: 'tenant_id'"]],
    ];
    for (const [file, needles] of expectations) {
      const text = entity(file);
      for (const needle of needles) expect(text).toContain(needle);
    }
  });
});
