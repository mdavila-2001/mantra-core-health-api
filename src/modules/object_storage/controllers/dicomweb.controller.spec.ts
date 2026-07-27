import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DicomWebController } from './dicomweb.controller';

const actor = { id: 'user-1', roles: ['DICOM_VIEWER'] };

function build() {
  const dicomService = { resolveInstance: mockFn() };
  return {
    controller: new DicomWebController(dicomService as any),
    dicomService,
  };
}

describe('DicomWebController', () => {
  it('delegates the instance resolution with the three UIDs (UC-60-05)', async () => {
    const d = build();
    d.dicomService.resolveInstance.mockResolvedValue({ outcome: 'allowed' });

    await d.controller.resolveInstance(
      '1.2.3',
      '1.2.3.1',
      '1.2.3.1.1',
      actor,
      'TREATMENT',
    );

    expect(d.dicomService.resolveInstance).toHaveBeenCalledWith(
      '1.2.3',
      '1.2.3.1',
      '1.2.3.1.1',
      'TREATMENT',
      actor,
    );
  });

  it('passes an absent purpose of use through untouched', async () => {
    const d = build();
    d.dicomService.resolveInstance.mockResolvedValue({ outcome: 'denied' });

    await d.controller.resolveInstance('1.2.3', '1.2.3.1', '1.2.3.1.1', actor);

    expect(d.dicomService.resolveInstance).toHaveBeenCalledWith(
      '1.2.3',
      '1.2.3.1',
      '1.2.3.1.1',
      undefined,
      actor,
    );
  });
});
