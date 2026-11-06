import { describe, expect, it, jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import { CLIN } from '../../clinical/clinical.concepts';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { RDRAFT } from '../report-drafts.concepts';
import { ReportPublicationWriter } from './report-publication.writer';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'u-lab' } as any;

function build(
  opts: { report?: any; published?: any; draft?: any; carried?: any[] } = {},
) {
  const draft = opts.draft ?? { id: 'd1', statusCode: 'DRAFT', rowVersion: 4 };
  const tx: any = {
    find: mockFn(async () => (opts.report ? [opts.report] : [])),
    findOne: mockFn(async () => draft),
    lock: mockFn(async () => undefined),
    getReference: mockFn((_c: any, id: string) => ({ ref: id })),
    refresh: mockFn(async () => undefined),
    create: mockFn((_c: any, data: any) => data),
    flush: mockFn(async () => undefined),
    nativeUpdate: mockFn(async () => 1),
  };
  const drafts = {
    findPublishedByReport: mockFn(async () => opts.published ?? null),
    findFiles: mockFn(async () => [
      { fileId: 'doc', roleCode: 'DOCUMENT' },
      { fileId: 'audio', roleCode: 'AUDIO' },
      { fileId: 'annex', roleCode: 'ANNEX' },
    ]),
  };
  const reports = {
    findVersionsByReports: mockFn(async () =>
      opts.report ? [{ id: 'v1', versionNumber: 1 }] : [],
    ),
    findFilesByVersions: mockFn(async () => opts.carried ?? []),
    addFile: mockFn(),
    recordReleaseEvent: mockFn(),
  };
  const created: any = { id: 'r-new' };
  const clinicalReports = { create: mockFn(() => created) };
  const orders = { markReportReleased: mockFn() };
  const portal = {
    findAccessions: mockFn(async () => [{ id: 'acc1' }]),
    findWorkOrders: mockFn(async () => [{ id: 'wo1' }]),
  };
  const writer = new ReportPublicationWriter(
    drafts as any,
    reports as any,
    clinicalReports as any,
    orders as any,
    portal as any,
  );
  return {
    writer,
    tx,
    draft,
    drafts,
    reports,
    clinicalReports,
    orders,
    created,
  };
}

const publication = (over: Partial<any> = {}): any => ({
  tenantId: 'lab',
  draftId: 'd1',
  rowVersion: 4,
  order: {
    id: 'sr1',
    patientProfileId: 'pat',
    codeConceptId: 'hemo',
    categoryConceptId: 'cat',
  },
  versionId: 'v-new',
  issuedAt: new Date('2026-11-05T12:00:00Z'),
  contentHash: 'h'.repeat(64),
  conclusionText: 'Normal',
  signerProfileId: 'p1',
  officialFileId: 'pdf',
  visibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
  actor,
  ...over,
});

describe('ReportPublicationWriter', () => {
  it('first publication: creates the report and a FINAL version signed, issued and hashed', async () => {
    const t = build();
    await expect(t.writer.write(t.tx, publication())).resolves.toBe('r-new');
    expect(t.clinicalReports.create).toHaveBeenCalledWith(
      t.tx,
      expect.objectContaining({
        custodianTenantId: 'lab',
        serviceRequestId: 'sr1',
      }),
    );
    expect(t.tx.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: 'v-new',
        versionNumber: 1,
        clinicalStatusConceptId: DIAG.REPORT_FINAL,
        authorProfileId: 'p1',
        performerTenantId: 'lab',
        conclusionText: 'Normal',
        contentHash: 'h'.repeat(64),
      }),
      { partial: true },
    );
  });

  it('attaches carried files, the official PDF and the annexes, never the audio', async () => {
    const t = build({
      report: { id: 'r1', currentVersionId: 'v1' },
      carried: [{ fileId: 'old', contentRoleConceptId: DIAG.REPORT_FINAL }],
    });
    await t.writer.write(t.tx, publication());
    const files = t.reports.addFile.mock.calls.map((c: any[]) => [
      c[1].fileId,
      c[1].contentRoleConceptId,
    ]);
    expect(files).toEqual([
      ['old', DIAG.REPORT_FINAL],
      ['pdf', RDRAFT.REPORT_FILE_OFFICIAL],
      ['doc', RDRAFT.REPORT_FILE_ANNEX],
      ['annex', RDRAFT.REPORT_FILE_ANNEX],
    ]);
    expect(t.tx.lock).toHaveBeenCalledWith(
      { ref: 'r1' },
      LockMode.PESSIMISTIC_WRITE,
    );
    expect(t.tx.create.mock.calls[0][1]).toMatchObject({
      versionNumber: 2,
      supersedesVersionId: 'v1',
    });
  });

  it('releases with the chosen visibility, marks the report FINAL and the tests REPORTED, freezes the draft', async () => {
    const t = build();
    await t.writer.write(
      t.tx,
      publication({ visibilityConceptId: DIAG.VISIBILITY_PATIENT_HIDDEN }),
    );
    expect(t.reports.recordReleaseEvent).toHaveBeenCalledWith(
      t.tx,
      expect.objectContaining({
        patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_HIDDEN,
      }),
    );
    expect(t.orders.markReportReleased).toHaveBeenCalledWith(
      t.tx,
      t.created,
      'v-new',
      DIAG.VISIBILITY_PATIENT_HIDDEN,
      'u-lab',
    );
    expect(t.created.lifecycleStatusConceptId).toBe(CLIN.REPORT_FINAL);
    expect(t.tx.nativeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ serviceRequestId: 'sr1' }),
      expect.objectContaining({
        statusConceptId: DIAG.TEST_REPORTED,
        diagnosticReportId: 'r-new',
      }),
    );
    expect(t.draft).toMatchObject({
      statusCode: 'PUBLISHED',
      publishedVersionId: 'v-new',
      diagnosticReportId: 'r-new',
      publishedByUserId: 'u-lab',
    });
  });

  it('a report already published, a published draft or a stale draft writes nothing', async () => {
    const published = build({ report: { id: 'r1' }, published: { id: 'dX' } });
    await expect(
      published.writer.write(published.tx, publication()),
    ).rejects.toMatchObject({
      reason: DiagnosticsErrorReason.REPORT_ALREADY_PUBLISHED,
    });
    const frozen = build({
      draft: { id: 'd1', statusCode: 'PUBLISHED', rowVersion: 4 },
    });
    await expect(
      frozen.writer.write(frozen.tx, publication()),
    ).rejects.toMatchObject({
      reason: DiagnosticsErrorReason.REPORT_ALREADY_PUBLISHED,
    });
    const stale = build({
      draft: { id: 'd1', statusCode: 'DRAFT', rowVersion: 5 },
    });
    await expect(
      stale.writer.write(stale.tx, publication()),
    ).rejects.toMatchObject({ status: 409 });
    for (const t of [published, frozen, stale])
      expect(t.tx.create).not.toHaveBeenCalled();
  });
});
