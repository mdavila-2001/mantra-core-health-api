import { jest } from '@jest/globals';
import { PatientAccessLogRepository } from './patient-access-log.repository';
import { PROF } from '../../profiles/profiles.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PATIENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TX = { tx: true };

function build() {
  const execute = mockFn().mockResolvedValue([]);
  const em: any = {
    getConnection: () => ({ execute }),
    getTransactionContext: () => TX,
  };
  return { repo: new PatientAccessLogRepository(), em, execute };
}

describe('PatientAccessLogRepository', () => {
  it('siempre acota por paciente y sólo lee (SELECT)', async () => {
    const d = build();

    await d.repo.accessesTo(d.em, { patientProfileId: PATIENT, limit: 25 });

    const [sql, params, mode, trx] = d.execute.mock.calls[0] as any[];
    expect(sql).toMatch(/^\s*select /i);
    expect(sql).not.toMatch(/\b(insert|update|delete)\b/i);
    expect(sql).toContain('d.patient_profile_id = ?::uuid');
    expect(params).toEqual([PROF.ACCOUNT_LINK_ACTIVE, PATIENT, 26]);
    expect(mode).toBe('all');
    expect(trx).toBe(TX);
  });

  it('no trae IP, organización, identificador del recurso ni base legal', async () => {
    const d = build();

    await d.repo.accessesTo(d.em, { patientProfileId: PATIENT, limit: 5 });

    const [sql] = d.execute.mock.calls[0] as any[];
    const selected = (sql as string).split(/\bfrom\b/i)[0];
    for (const column of [
      'tenant_id',
      'resource_id',
      'legal_basis',
      'recorded_by',
    ]) {
      expect(selected).not.toContain(column);
    }
    expect(selected).not.toMatch(/\bip\b/);
  });

  it('agrega rango, exclusión del titular y cursor en el orden de los placeholders', async () => {
    const d = build();
    const from = new Date('2026-10-01T00:00:00Z');
    const to = new Date('2026-10-20T00:00:00Z');

    await d.repo.accessesTo(d.em, {
      patientProfileId: PATIENT,
      from,
      to,
      excludeUserId: 'user-1',
      cursor: { t: '2026-10-10T00:00:00.000000Z', i: 'row-1' },
      limit: 10,
    });

    const [sql, params] = d.execute.mock.calls[0] as any[];
    expect(sql).toContain('d.recorded_at >= ?::timestamptz');
    expect(sql).toContain('d.recorded_at < ?::timestamptz');
    expect(sql).toContain('d.user_id <> ?::uuid');
    expect(sql).toContain('(d.recorded_at, d.id) < (?::timestamptz, ?::uuid)');
    expect(sql).toMatch(/order by d\.recorded_at desc, d\.id desc/);
    expect(params).toEqual([
      PROF.ACCOUNT_LINK_ACTIVE,
      PATIENT,
      from,
      to,
      'user-1',
      '2026-10-10T00:00:00.000000Z',
      'row-1',
      11,
    ]);
    // Un placeholder por parámetro.
    expect((sql as string).match(/\?/g)).toHaveLength(params.length);
  });
});
