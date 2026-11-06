import { describe, expect, it } from '@jest/globals';
import {
  LAB_ORDER_TRANSITIONS,
  deriveLabOrderStatus,
  fileHistory,
  readableSize,
  resultKindOf,
} from './lab-portal.projection';

const none = {
  revoked: false,
  performerOutcome: null,
  rejected: false,
  processed: false,
  received: false,
  availableFiles: 0,
};

describe('lab portal projection', () => {
  it('derives every state from real facts, in precedence order', () => {
    expect(deriveLabOrderStatus(none)).toBe('DRAFT');
    expect(deriveLabOrderStatus({ ...none, received: true })).toBe('RECEIVED');
    expect(
      deriveLabOrderStatus({ ...none, received: true, processed: true }),
    ).toBe('PROCESSED');
    expect(
      deriveLabOrderStatus({
        ...none,
        received: true,
        processed: true,
        availableFiles: 1,
      }),
    ).toBe('UPLOADED');
    expect(
      deriveLabOrderStatus({ ...none, received: true, rejected: true }),
    ).toBe('REJECTED');
    expect(
      deriveLabOrderStatus({ ...none, revoked: true, availableFiles: 2 }),
    ).toBe('CANCELLED');
  });

  it("the performer's own event ends the order, ahead of the workflow rows", () => {
    const workflow = { ...none, received: true, processed: true };
    expect(
      deriveLabOrderStatus({ ...workflow, performerOutcome: 'CANCELLED' }),
    ).toBe('CANCELLED');
    expect(
      deriveLabOrderStatus({
        ...none,
        received: true,
        performerOutcome: 'REJECTED',
      }),
    ).toBe('REJECTED');
    // An imaging order has no accession item to reject: the event alone is enough.
    expect(
      deriveLabOrderStatus({ ...none, performerOutcome: 'REJECTED' }),
    ).toBe('REJECTED');
  });

  it('allows only the documented steps', () => {
    expect(LAB_ORDER_TRANSITIONS).toEqual({
      RECEIVE: ['DRAFT'],
      PROCESS: ['RECEIVED'],
      CANCEL: ['DRAFT', 'RECEIVED'],
      REJECT: ['RECEIVED'],
    });
  });

  it('decides the kind by extension first, then by MIME type', () => {
    expect(resultKindOf('hemograma.PDF', 'application/octet-stream')).toBe(
      'PDF',
    );
    expect(resultKindOf('torax.dcm', '')).toBe('DICOM');
    expect(resultKindOf('scan', 'image/png')).toBe('IMAGE');
    expect(resultKindOf('scan', 'image/tiff')).toBe('OTHER');
    expect(resultKindOf('datos', 'application/json')).toBe('TEXT');
    expect(resultKindOf('eco', 'video/mp4')).toBe('VIDEO');
  });

  it('prints sizes like the activity feed', () => {
    expect(readableSize(512)).toBe('512 B');
    expect(readableSize(2.4 * 1024 * 1024)).toBe('2,4 MB');
  });

  it('a file is available while the latest version carries it, withdrawn after', () => {
    const at = (n: number) => new Date(`2026-11-0${n}T10:00:00Z`);
    const versions: any[] = [
      {
        id: 'v1',
        diagnosticReportId: 'r1',
        versionNumber: 1,
        conclusionText: 'nota',
        recordedAt: at(1),
      },
      {
        id: 'v2',
        diagnosticReportId: 'r1',
        versionNumber: 2,
        recordedAt: at(2),
      },
      {
        id: 'v3',
        diagnosticReportId: 'r1',
        versionNumber: 3,
        amendmentReasonText: 'Paciente equivocado',
        recordedAt: at(3),
      },
    ];
    const files: any[] = [
      {
        diagnosticReportVersionId: 'v1',
        fileId: 'f1',
        createdAt: at(1),
        createdByUserId: 'u1',
      },
      {
        diagnosticReportVersionId: 'v2',
        fileId: 'f1',
        createdAt: at(2),
        createdByUserId: 'u2',
      },
      {
        diagnosticReportVersionId: 'v2',
        fileId: 'f2',
        createdAt: at(2),
        createdByUserId: 'u2',
      },
      {
        diagnosticReportVersionId: 'v3',
        fileId: 'f2',
        createdAt: at(3),
        createdByUserId: 'u2',
      },
    ];
    const history = fileHistory(versions, files);
    const f1 = history.find((h) => h.fileId === 'f1')!;
    const f2 = history.find((h) => h.fileId === 'f2')!;
    expect(f1).toMatchObject({
      status: 'WITHDRAWN',
      withdrawnReason: 'Paciente equivocado',
      uploadedByUserId: 'u1',
      note: 'nota',
    });
    expect(f1.uploadedAt).toEqual(at(1));
    expect(f1.withdrawnAt).toEqual(at(3));
    expect(f2).toMatchObject({ status: 'AVAILABLE', withdrawnReason: null });
  });
});
