import { jest } from '@jest/globals';
import { PrescriptionExpiryRepository } from './prescription-expiry.repository';
import { PROF } from '../../profiles/profiles.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TX = { tx: true };

describe('PrescriptionExpiryRepository', () => {
  it('pide recetas emitidas en la ventana, sin aviso previo y con cuenta activa', async () => {
    const execute = mockFn().mockResolvedValue([]);
    const em: any = {
      getConnection: () => ({ execute }),
      getTransactionContext: () => TX,
    };
    const after = new Date('2026-10-25T00:00:00Z');
    const until = new Date('2026-10-28T00:00:00Z');

    await new PrescriptionExpiryRepository().findToNotify(em, {
      issuedStatusConceptId: 'issued',
      after,
      until,
      noticeKeyPrefix: 'clinical:PRESCRIPTION_EXPIRING:',
      limit: 200,
    });

    const [sql, params, mode, trx] = execute.mock.calls[0] as any[];
    expect(sql).toMatch(/^\s*select /i);
    expect(sql).not.toMatch(/\b(insert|update|delete)\b/i);
    expect(sql).toContain('m.status_concept_id = ?::uuid');
    expect(sql).toContain('m.valid_to > ?::timestamptz');
    expect(sql).toContain('m.valid_to <= ?::timestamptz');
    expect(sql).toContain('not exists');
    expect(sql).toContain('messaging.notification_requests');
    expect(sql).toContain('n.idempotency_key = ?::text || m.id::text');
    expect(sql).toMatch(/order by m\.valid_to asc, m\.id asc/);
    expect(params).toEqual([
      PROF.ACCOUNT_LINK_ACTIVE,
      'issued',
      after,
      until,
      'clinical:PRESCRIPTION_EXPIRING:',
      200,
    ]);
    expect((sql as string).match(/\?/g)).toHaveLength(params.length);
    expect(mode).toBe('all');
    expect(trx).toBe(TX);
  });
});
