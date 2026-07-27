import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsMediaQualityService } from './diagnostics-media-quality.service';
import { DIAG } from '../diagnostics.concepts';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findMediaByFile: mockFn().mockResolvedValue(null),
    createMedia: mockFn(),
    addAnnotation: mockFn(),
    createDataQualityEvent: mockFn(),
    addProvenanceLink: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticsMediaQualityService(
    em as any,
    repo as any,
    logger as any,
  );
  return { service, tx, repo };
}

describe('DiagnosticsMediaQualityService', () => {
  describe('attachMedia (UC-20-12)', () => {
    it('requires custodian tenant', async () => {
      const d = build();
      await expect(
        d.service.attachMedia(
          { patientProfileId: 'p1', fileId: 'f1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('conflicts when file already attached', async () => {
      const d = build();
      d.repo.findMediaByFile.mockResolvedValue({ id: 'm0' });
      await expect(
        d.service.attachMedia(
          {
            patientProfileId: 'p1',
            fileId: 'f1',
            custodianTenantId: 't1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('attaches media and its annotations', async () => {
      const d = build();
      d.repo.createMedia.mockReturnValue({
        id: 'm1',
        statusConceptId: DIAG.MEDIA_STATUS_ACTIVE,
      });
      const res = await d.service.attachMedia(
        {
          patientProfileId: 'p1',
          fileId: 'f1',
          custodianTenantId: 't1',
          annotations: [{ labelText: 'x' }],
        },
        actor,
      );
      expect(res).toEqual({ id: 'm1', status: DIAG.MEDIA_STATUS_ACTIVE });
      expect(d.repo.addAnnotation).toHaveBeenCalled();
    });
  });

  describe('recordDataQualityEvent (UC-20-14)', () => {
    it('requires custodian tenant', async () => {
      const d = build();
      await expect(
        d.service.recordDataQualityEvent(
          { targetId: 't', ruleCode: 'R1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('records event and provenance link when source given', async () => {
      const d = build();
      d.repo.createDataQualityEvent.mockReturnValue({
        id: 'dq1',
        statusConceptId: DIAG.DQ_OPEN,
      });
      const res = await d.service.recordDataQualityEvent(
        {
          targetId: 'tgt',
          ruleCode: 'R1',
          custodianTenantId: 't1',
          provenanceSourceId: 'src',
        },
        actor,
      );
      expect(res).toEqual({ id: 'dq1', status: DIAG.DQ_OPEN });
      expect(d.repo.addProvenanceLink).toHaveBeenCalled();
    });

    it('records event without provenance when no source', async () => {
      const d = build();
      d.repo.createDataQualityEvent.mockReturnValue({
        id: 'dq2',
        statusConceptId: DIAG.DQ_OPEN,
      });
      await d.service.recordDataQualityEvent(
        { targetId: 'tgt', ruleCode: 'R1', custodianTenantId: 't1' },
        actor,
      );
      expect(d.repo.addProvenanceLink).not.toHaveBeenCalled();
    });
  });
});
