import { describe, expect, it, jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../common';
import { DIAG } from '../diagnostics.concepts';
import { ReportPublishService } from './report-publish.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
// The signer publishes with their own session (practitionerProfileId === signer).
const actor = { id: 'u-lab', practitionerProfileId: 'p1' } as any;
const preparer = { id: 'u-tech' } as any;
const body = {
  version: 1,
  blocks: [{ type: 'paragraph', runs: [{ text: 'Sin hallazgos' }] }],
};

function build(draft: any) {
  const order = {
    id: 'sr1',
    patientProfileId: 'pat',
    codeConceptId: 'hemo',
    requesterProfileId: 'doc',
    createdByUserId: 'u-doc',
  };
  const em: any = {
    fork: () => em,
    transactional: mockFn(async (cb: any) => cb('tx')),
  };
  const drafts = {
    load: mockFn(async () => ({ draft, order })),
    assertEditable: mockFn(),
  };
  const signers = { assertSigner: mockFn(async () => ({})) };
  const immutability = { assertWritable: mockFn(async () => undefined) };
  const pdf = { render: mockFn(async () => Buffer.from('%PDF-1.3')) };
  const files = { storeGenerated: mockFn(async () => ({ id: 'pdf' })) };
  const writer = {
    findReport: mockFn(async () => null),
    write: mockFn(async () => 'r1'),
  };
  const labels = {
    findConceptDisplays: mockFn(async () => new Map([['hemo', 'Hemograma']])),
  };
  const notices = {
    published: mockFn(async () => undefined),
    signatureRequested: mockFn(async () => undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ReportPublishService(
    em,
    drafts as any,
    signers as any,
    immutability as any,
    pdf as any,
    files as any,
    writer as any,
    labels as any,
    notices as any,
    logger as any,
  );
  return { service, pdf, files, writer, notices, signers };
}

const draft = (over: Partial<any> = {}) => ({
  id: 'd1',
  rowVersion: 2,
  bodyJson: body,
  signerProfileId: 'p1',
  patientVisibilityCode: 'VISIBLE',
  ...over,
});

describe('ReportPublishService', () => {
  it('stores the official PDF (DOCUMENT, PHI) before the transaction and returns the publication', async () => {
    const t = build(draft());
    const result = await t.service.publish(
      'lab',
      'd1',
      { rowVersion: 2, confirmIrreversible: true },
      actor,
    );
    expect(t.pdf.render).toHaveBeenCalledWith(
      expect.anything(),
      'lab',
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        contentHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
      true,
    );
    expect(t.files.storeGenerated).toHaveBeenCalledWith(
      expect.objectContaining({
        mimeType: 'application/pdf',
        category: 'DOCUMENT',
        sensitivity: 'PHI',
      }),
      actor,
    );
    expect(t.files.storeGenerated.mock.invocationCallOrder[0]).toBeLessThan(
      t.writer.write.mock.invocationCallOrder[0],
    );
    expect(t.writer.write).toHaveBeenCalledWith(
      'tx',
      expect.objectContaining({
        officialFileId: 'pdf',
        conclusionText: 'Sin hallazgos',
        visibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
      }),
    );
    expect(result).toMatchObject({
      reportId: 'r1',
      officialFileId: 'pdf',
      status: 'PUBLISHED',
      patientVisibility: 'VISIBLE',
    });
    expect(t.notices.published).toHaveBeenCalledWith(
      expect.objectContaining({
        visible: true,
        studyName: 'Hemograma',
        requesterProfileId: 'doc',
        signerProfileId: 'p1',
      }),
    );
    expect(t.notices.published.mock.invocationCallOrder[0]).toBeGreaterThan(
      t.writer.write.mock.invocationCallOrder[0],
    );
  });

  it('HELD publishes hidden from the patient', async () => {
    const t = build(draft({ patientVisibilityCode: 'HELD' }));
    const result = await t.service.publish(
      'lab',
      'd1',
      { rowVersion: 2, confirmIrreversible: true },
      actor,
    );
    expect(t.writer.write).toHaveBeenCalledWith(
      'tx',
      expect.objectContaining({
        visibilityConceptId: DIAG.VISIBILITY_PATIENT_HIDDEN,
      }),
    );
    expect(result.patientVisibility).toBe('HELD');
  });

  it('422 without signer or without text; 409 on a stale rowVersion; nothing stored', async () => {
    for (const d of [
      draft({ signerProfileId: null }),
      draft({ bodyJson: { version: 1, blocks: [] } }),
    ]) {
      const t = build(d);
      await expect(
        t.service.publish(
          'lab',
          'd1',
          { rowVersion: 2, confirmIrreversible: true },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(t.files.storeGenerated).not.toHaveBeenCalled();
    }
    const stale = build(draft());
    await expect(
      stale.service.publish(
        'lab',
        'd1',
        { rowVersion: 1, confirmIrreversible: true },
        actor,
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(stale.files.storeGenerated).not.toHaveBeenCalled();
  });

  it('403 REPORT_SIGNER_MUST_PUBLISH when the actor is not the signer; nothing stored', async () => {
    const t = build(draft());
    await expect(
      t.service.publish(
        'lab',
        'd1',
        { rowVersion: 2, confirmIrreversible: true },
        preparer,
      ),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'REPORT_SIGNER_MUST_PUBLISH',
    });
    expect(t.files.storeGenerated).not.toHaveBeenCalled();
    expect(t.writer.write).not.toHaveBeenCalled();
  });

  it('signature request validates the draft and notifies the chosen signer', async () => {
    const t = build(draft());
    await expect(
      t.service.requestSignature('lab', 'd1', preparer),
    ).resolves.toEqual({ requested: true });
    expect(t.signers.assertSigner).toHaveBeenCalled();
    expect(t.notices.signatureRequested).toHaveBeenCalledWith(
      expect.objectContaining({
        signerProfileId: 'p1',
        studyName: 'Hemograma',
        actorUserId: 'u-tech',
      }),
    );
    const empty = build(draft({ signerProfileId: null }));
    await expect(
      empty.service.requestSignature('lab', 'd1', preparer),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('preview renders the watermarked PDF without storing anything', async () => {
    const t = build(draft());
    await t.service.preview('lab', 'd1', actor);
    expect(t.pdf.render).toHaveBeenCalledWith(
      expect.anything(),
      'lab',
      expect.anything(),
      expect.anything(),
      null,
      true,
    );
    expect(t.files.storeGenerated).not.toHaveBeenCalled();
  });

  it('preview for someone other than the signer asks for no signer images', async () => {
    const t = build(draft());
    await t.service.preview('lab', 'd1', preparer);
    expect(t.pdf.render).toHaveBeenCalledWith(
      expect.anything(),
      'lab',
      expect.anything(),
      expect.anything(),
      null,
      false,
    );
  });
});
