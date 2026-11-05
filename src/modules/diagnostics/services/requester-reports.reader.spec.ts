import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { DiagnosticReports, ServiceRequests } from '../../clinical/entities';
import { DIAG } from '../diagnostics.concepts';
import { RequesterReportsReader } from './requester-reports.reader';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const CLINIC = 'clinic';
const PATIENT = 'pat';
const FILTER = { profileIds: ['hp-cardio'], userIds: [], encounterIds: [] };

function build(opts: { visible?: string[]; all?: string[] } = {}) {
  const visible = opts.visible ?? ['sr1'];
  const all = opts.all ?? visible;
  const tx: any = {
    execute: mockFn(async () => []),
    find: mockFn(async (cls: any, where: any) => {
      if (cls === ServiceRequests) {
        return (where.$or ? visible : all).map((id) => ({ id }));
      }
      return [{ id: 'r-lab', createdAt: new Date() }];
    }),
    count: mockFn(async (_cls: any, where: any) =>
      where.serviceRequestId.$in.length === all.length ? 5 : 2,
    ),
  };
  const em: any = { fork: () => tx };
  const reports = { findReleaseEventsByVersions: mockFn(async () => []) };
  return {
    reader: new RequesterReportsReader(em, reports as any),
    tx,
    reports,
  };
}

describe('RequesterReportsReader', () => {
  const rls = process.env.RLS_ENFORCE;
  afterEach(() => {
    process.env.RLS_ENFORCE = rls;
  });

  it('reaches only reports of orders the caller tenant issued, custodied elsewhere', async () => {
    const t = build();
    const out = await t.reader.ofIssuedOrders(CLINIC, PATIENT, 51, null);

    expect(t.tx.find).toHaveBeenCalledWith(
      ServiceRequests,
      { custodianTenantId: CLINIC, patientProfileId: PATIENT },
      { fields: ['id'] },
    );
    expect(t.tx.find).toHaveBeenCalledWith(
      DiagnosticReports,
      {
        patientProfileId: PATIENT,
        custodianTenantId: { $ne: CLINIC },
        serviceRequestId: { $in: ['sr1'] },
      },
      { orderBy: { createdAt: 'DESC' }, limit: 51 },
    );
    expect(out.rows.map((r) => r.id)).toEqual(['r-lab']);
    expect(out.hidden).toBe(0);
    expect(t.tx.count).not.toHaveBeenCalled();
  });

  it('runs as a bounded read-only system read when RLS is enforced', async () => {
    process.env.RLS_ENFORCE = 'true';
    const t = build();
    t.tx.transactional = mockFn(async (cb: any) => cb(t.tx));
    t.tx.isInTransaction = () => false;
    t.tx.getTransactionContext = () => undefined;

    await t.reader.ofIssuedOrders(CLINIC, PATIENT, 51, null);

    expect(t.tx.execute).toHaveBeenCalledWith(
      "select set_config('app.system_context', 'true', true)",
    );
    expect(t.tx.transactional).toHaveBeenCalledWith(expect.any(Function), {
      readOnly: true,
    });
  });

  it('without any issued order it reads no report', async () => {
    const t = build({ visible: [] });
    const out = await t.reader.ofIssuedOrders(CLINIC, PATIENT, 51, null);
    expect(out.rows).toEqual([]);
    expect(t.tx.find).toHaveBeenCalledTimes(1);
  });

  it('under a SPECIALTIES scope a report follows its order and the rest counts as hidden', async () => {
    const t = build({ visible: ['sr1'], all: ['sr1', 'sr2'] });
    const out = await t.reader.ofIssuedOrders(CLINIC, PATIENT, 51, FILTER);

    const scoped = t.tx.find.mock.calls[0][1];
    expect(scoped).toMatchObject({
      custodianTenantId: CLINIC,
      patientProfileId: PATIENT,
      $or: [{ requesterProfileId: { $in: ['hp-cardio'] } }],
    });
    expect(out.hidden).toBe(3);
  });

  it('the latest release event of each version decides HELD or VISIBLE', async () => {
    const t = build();
    t.reports.findReleaseEventsByVersions.mockResolvedValue([
      {
        diagnosticReportVersionId: 'v1',
        patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
      },
      {
        diagnosticReportVersionId: 'v1',
        patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_HIDDEN,
      },
      {
        diagnosticReportVersionId: 'v2',
        patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_HIDDEN,
      },
      { diagnosticReportVersionId: 'v3', patientVisibilityConceptId: 'x' },
    ]);

    const out = await t.reader.visibilityOf(['v1', 'v2', 'v3']);

    expect([...out]).toEqual([
      ['v1', 'VISIBLE'],
      ['v2', 'HELD'],
      ['v3', null],
    ]);
  });
});
