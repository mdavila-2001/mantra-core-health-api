import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsImagingService } from './diagnostics-imaging.service';
import { DIAG } from '../diagnostics.concepts';
import { ResourceNotFoundException, ConflictException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findEndpoint: mockFn(),
    findStudy: mockFn(),
    findStudyByUid: mockFn(),
    createEndpoint: mockFn(),
    createStudy: mockFn(),
    createSeries: mockFn(),
    createInstance: mockFn(),
    createObjectLocation: mockFn(),
    recordDoseEvent: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticsImagingService(em as any, repo as any, logger as any);
  return { service, tx, repo };
}

describe('DiagnosticsImagingService', () => {
  describe('storeStudy (UC-20-11)', () => {
    it('throws when endpoint missing', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue(null);
      await expect(
        d.service.storeStudy(
          { imagingEndpointId: 'e1', patientProfileId: 'p1', dicomStudyInstanceUid: 'u1', series: [] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('conflicts on duplicate study uid (idempotent resend)', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: 't1' });
      d.repo.findStudyByUid.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.storeStudy(
          { imagingEndpointId: 'e1', patientProfileId: 'p1', dicomStudyInstanceUid: 'u1', series: [] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('stores study, series and instances (no object location without backend)', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: 't1' });
      d.repo.findStudyByUid.mockResolvedValue(null);
      d.repo.createStudy.mockReturnValue({ id: 'st1', statusConceptId: DIAG.IMAGING_STUDY_STORED });
      d.repo.createSeries.mockReturnValue({ id: 'se1' });
      d.repo.createInstance.mockReturnValue({ id: 'in1' });

      const res = await d.service.storeStudy(
        {
          imagingEndpointId: 'e1',
          patientProfileId: 'p1',
          dicomStudyInstanceUid: 'u1',
          series: [{ dicomSeriesInstanceUid: 's-uid', instances: [{ dicomSopInstanceUid: 'i-uid' }] }],
        } as any,
        actor,
      );

      expect(res).toEqual({
        id: 'st1',
        status: DIAG.IMAGING_STUDY_STORED,
        numberOfSeries: 1,
        numberOfInstances: 1,
      });
      expect(d.repo.createObjectLocation).not.toHaveBeenCalled();
    });
  });

  describe('recordDoseEvent (UC-20-13)', () => {
    it('throws when study missing', async () => {
      const d = build();
      d.repo.findStudy.mockResolvedValue(null);
      await expect(d.service.recordDoseEvent('missing', {} as any, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('records a dose event on the study', async () => {
      const d = build();
      d.repo.findStudy.mockResolvedValue({
        id: 'st1',
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        statusConceptId: DIAG.IMAGING_STUDY_STORED,
        updatedAt: new Date(),
      });
      d.repo.recordDoseEvent.mockReturnValue({ id: 'dose1' });
      const res = await d.service.recordDoseEvent('st1', { doseLengthProduct: '10' } as any, actor);
      expect(res.id).toBe('dose1');
    });
  });

  describe('createEndpoint (soporte)', () => {
    it('conflicts without tenant', async () => {
      const d = build();
      await expect(
        d.service.createEndpoint({ baseUri: 'http://x' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates an active endpoint', async () => {
      const d = build();
      d.repo.createEndpoint.mockReturnValue({ id: 'e1', statusConceptId: DIAG.IMAGING_ENDPOINT_ACTIVE });
      const res = await d.service.createEndpoint({ baseUri: 'http://x', tenantId: 't1' } as any, actor);
      expect(res).toEqual({ id: 'e1', status: DIAG.IMAGING_ENDPOINT_ACTIVE });
    });
  });
});
