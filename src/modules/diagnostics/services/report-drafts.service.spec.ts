import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { expectNotAvailable, T1, T2 } from './diagnostics.testing';
import { ReportDraftsService } from './report-drafts.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const labStaff = { id: 'u-lab', roles: ['USER'] } as any;
const clinician = { id: 'u-doc', roles: ['CLINICIAN'], tenantIds: [T1] } as any;
const body = {
  version: 1,
  blocks: [{ type: 'paragraph', runs: [{ text: 'Normal' }] }],
};

const draftRow = (over: Partial<any> = {}): any => ({
  id: 'd1',
  custodianTenantId: T1,
  serviceRequestId: 'sr1',
  bodyJson: { version: 1, blocks: [] },
  patientVisibilityCode: 'VISIBLE',
  statusCode: 'DRAFT',
  rowVersion: 3,
  updatedAt: new Date('2026-11-05T10:00:00Z'),
  ...over,
});

function build(order: any, draft: any = draftRow(), files: any[] = []) {
  const tx: any = {
    findOne: mockFn(async (_cls: any, where: any) =>
      where.reportDraftId
        ? (files.find((f) => f.id === where.id) ?? null)
        : order,
    ),
    create: mockFn((_cls: any, data: any) => ({ id: 'new', ...data })),
    flush: mockFn(async () => undefined),
    remove: mockFn(),
  };
  const em: any = {
    fork: () => tx,
    transactional: mockFn(async (cb: any) => cb(tx)),
  };
  const repo = {
    findById: mockFn(async (_em: any, tenantId: string, id: string) =>
      draft && draft.id === id && draft.custodianTenantId === tenantId
        ? draft
        : null,
    ),
    findByOrder: mockFn(async () => null),
    findFiles: mockFn(async () => files),
  };
  const attachable = { assertUsableBy: mockFn(async () => ({})) };
  const signers = { assertSigner: mockFn(async () => ({})) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ReportDraftsService(
    em,
    repo as any,
    attachable as any,
    signers as any,
    logger as any,
  );
  return { service, tx, repo, attachable, signers };
}

const labOrder = { id: 'sr1', performerTenantId: T1, custodianTenantId: T2 };
const ownOrder = { id: 'sr1', performerTenantId: null, custodianTenantId: T1 };

describe('ReportDraftsService', () => {
  it('open: the performer laboratory gets (or creates) the draft of the order', async () => {
    const t = build(labOrder);
    const dto = await t.service.open(T1, 'sr1', labStaff);
    expect(t.tx.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        custodianTenantId: T1,
        serviceRequestId: 'sr1',
        statusCode: 'DRAFT',
      }),
      { partial: true },
    );
    expect(dto).toMatchObject({
      status: 'DRAFT',
      patientVisibility: 'VISIBLE',
      body: { version: 1, blocks: [] },
    });
  });

  it('open: idempotent, an existing (even published) draft is returned as is', async () => {
    const t = build(labOrder);
    t.repo.findByOrder.mockResolvedValue(draftRow({ statusCode: 'PUBLISHED' }));
    const dto = await t.service.open(T1, 'sr1', labStaff);
    expect(t.tx.create).not.toHaveBeenCalled();
    expect(dto.status).toBe('PUBLISHED');
  });

  it('open: a clinician reports their own order without performer', async () => {
    const t = build(ownOrder);
    await expect(t.service.open(T1, 'sr1', clinician)).resolves.toMatchObject({
      status: 'DRAFT',
    });
  });

  it('open: 404 for the issuer when a laboratory performs it, for a non-clinician and for anyone else', async () => {
    await expectNotAvailable(
      build({
        ...labOrder,
        performerTenantId: T2,
        custodianTenantId: T1,
      }).service.open(T1, 'sr1', clinician),
    );
    await expectNotAvailable(build(ownOrder).service.open(T1, 'sr1', labStaff));
    await expectNotAvailable(
      build({ ...labOrder, performerTenantId: T2 }).service.open(
        T1,
        'sr1',
        labStaff,
      ),
    );
    await expectNotAvailable(build(null).service.open(T1, 'sr1', labStaff));
  });

  it('update: saves body, derived conclusion, signer and visibility', async () => {
    const draft = draftRow();
    const t = build(labOrder, draft);
    await t.service.update(
      T1,
      'd1',
      { rowVersion: 3, body, signerProfileId: 'p1', patientVisibility: 'HELD' },
      labStaff,
    );
    expect(t.signers.assertSigner).toHaveBeenCalledWith(
      t.tx,
      T1,
      labStaff,
      'p1',
    );
    expect(draft).toMatchObject({
      conclusionText: 'Normal',
      signerProfileId: 'p1',
      patientVisibilityCode: 'HELD',
      updatedByUserId: 'u-lab',
    });
    expect(t.tx.flush).toHaveBeenCalled();
  });

  it('update: a stale rowVersion is 409 and a published draft is 409 REPORT_ALREADY_PUBLISHED', async () => {
    const dto = {
      rowVersion: 2,
      body,
      signerProfileId: null,
      patientVisibility: 'VISIBLE' as const,
    };
    await expect(
      build(labOrder).service.update(T1, 'd1', dto, labStaff),
    ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    await expect(
      build(labOrder, draftRow({ statusCode: 'PUBLISHED' })).service.update(
        T1,
        'd1',
        { ...dto, rowVersion: 3 },
        labStaff,
      ),
    ).rejects.toMatchObject({
      reason: DiagnosticsErrorReason.REPORT_ALREADY_PUBLISHED,
    });
  });

  it('update: a signer outside the list is refused before writing', async () => {
    const t = build(labOrder);
    t.signers.assertSigner.mockRejectedValue(
      new PreconditionFailedException('x'),
    );
    await expect(
      t.service.update(
        T1,
        'd1',
        {
          rowVersion: 3,
          body,
          signerProfileId: 'p9',
          patientVisibility: 'VISIBLE',
        },
        labStaff,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(t.tx.flush).not.toHaveBeenCalled();
  });

  it('files: attaches an own file with its role and next ordinal; refuses duplicates and published drafts', async () => {
    const files = [{ id: 'df1', fileId: 'f1', roleCode: 'AUDIO', ordinal: 0 }];
    const t = build(labOrder, draftRow(), files);
    await t.service.attachFile(
      T1,
      'd1',
      { fileId: 'f2', role: 'ANNEX' },
      labStaff,
    );
    expect(t.attachable.assertUsableBy).toHaveBeenCalledWith(
      t.tx,
      'f2',
      labStaff,
      expect.anything(),
    );
    expect(t.tx.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        reportDraftId: 'd1',
        custodianTenantId: T1,
        fileId: 'f2',
        roleCode: 'ANNEX',
        ordinal: 1,
      }),
    );
    await expect(
      t.service.attachFile(T1, 'd1', { fileId: 'f1', role: 'ANNEX' }, labStaff),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      build(labOrder, draftRow({ statusCode: 'PUBLISHED' })).service.attachFile(
        T1,
        'd1',
        { fileId: 'f2', role: 'DOCUMENT' },
        labStaff,
      ),
    ).rejects.toMatchObject({
      reason: DiagnosticsErrorReason.REPORT_ALREADY_PUBLISHED,
    });
  });

  it("files: someone else's or a missing file is the uniform 404", async () => {
    const t = build(labOrder);
    t.attachable.assertUsableBy.mockRejectedValue(new ForbiddenException());
    await expectNotAvailable(
      t.service.attachFile(T1, 'd1', { fileId: 'f9', role: 'ANNEX' }, labStaff),
    );
    t.attachable.assertUsableBy.mockRejectedValue(
      new ResourceNotFoundException(),
    );
    await expectNotAvailable(
      t.service.attachFile(T1, 'd1', { fileId: 'f9', role: 'ANNEX' }, labStaff),
    );
    expect(t.tx.create).not.toHaveBeenCalled();
  });

  it('files: removes a file of the draft; another draft file id is 404', async () => {
    const files = [
      { id: 'df1', fileId: 'f1', roleCode: 'DOCUMENT', ordinal: 0 },
    ];
    const t = build(labOrder, draftRow(), files);
    await t.service.removeFile(T1, 'd1', 'df1', labStaff);
    expect(t.tx.remove).toHaveBeenCalledWith(files[0]);
    await expectNotAvailable(t.service.removeFile(T1, 'd1', 'df9', labStaff));
  });

  it("get: another tenant's draft is the uniform 404", async () => {
    await expectNotAvailable(
      build(labOrder, draftRow({ custodianTenantId: T2 })).service.get(
        T1,
        'd1',
        labStaff,
      ),
    );
  });
});
