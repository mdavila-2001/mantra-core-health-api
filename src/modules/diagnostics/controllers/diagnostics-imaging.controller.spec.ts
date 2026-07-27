import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsImagingController } from './diagnostics-imaging.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const imaging = {
    createEndpoint: mockFn(),
    storeStudy: mockFn(),
    recordDoseEvent: mockFn(),
  };
  const mediaQuality = {
    attachMedia: mockFn(),
    recordDataQualityEvent: mockFn(),
  };
  return {
    controller: new DiagnosticsImagingController(
      imaging as any,
      mediaQuality as any,
    ),
    imaging,
    mediaQuality,
  };
}

describe('DiagnosticsImagingController', () => {
  it('delegates createEndpoint (soporte)', async () => {
    const d = build();
    await d.controller.createEndpoint({ baseUri: 'http://x' }, actor);
    expect(d.imaging.createEndpoint).toHaveBeenCalledWith(
      { baseUri: 'http://x' },
      actor,
    );
  });

  it('delegates storeStudy (UC-20-11)', async () => {
    const d = build();
    const dto = {
      imagingEndpointId: 'e1',
      patientProfileId: 'p1',
      dicomStudyInstanceUid: 'u',
      series: [],
    };
    await d.controller.storeStudy(dto, actor);
    expect(d.imaging.storeStudy).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates attachMedia (UC-20-12)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', fileId: 'f1' };
    await d.controller.attachMedia(dto, actor);
    expect(d.mediaQuality.attachMedia).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates recordDose (UC-20-13)', async () => {
    const d = build();
    await d.controller.recordDose('st1', { doseLengthProduct: '1' }, actor);
    expect(d.imaging.recordDoseEvent).toHaveBeenCalledWith(
      'st1',
      { doseLengthProduct: '1' },
      actor,
    );
  });

  it('delegates recordDataQuality (UC-20-14)', async () => {
    const d = build();
    const dto = { targetId: 't', ruleCode: 'R1' };
    await d.controller.recordDataQuality(dto, actor);
    expect(d.mediaQuality.recordDataQualityEvent).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });
});
