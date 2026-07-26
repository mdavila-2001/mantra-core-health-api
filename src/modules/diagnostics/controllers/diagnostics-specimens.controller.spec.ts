import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsSpecimensController } from './diagnostics-specimens.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const service = {
    createSpecimen: mockFn(),
    accession: mockFn(),
    reject: mockFn(),
    createContainer: mockFn(),
    recordCustodyEvent: mockFn(),
  };
  return { controller: new DiagnosticsSpecimensController(service as any), service };
}

describe('DiagnosticsSpecimensController', () => {
  it('delegates createSpecimen', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1' };
    await d.controller.createSpecimen(dto as any, actor);
    expect(d.service.createSpecimen).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates accession (UC-20-01)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', specimenIds: ['s1'] };
    await d.controller.accession(dto as any, actor);
    expect(d.service.accession).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates reject (UC-20-02)', async () => {
    const d = build();
    await d.controller.reject('s1', { rejectionReasonConceptId: 'r1' } as any, actor);
    expect(d.service.reject).toHaveBeenCalledWith('s1', { rejectionReasonConceptId: 'r1' }, actor);
  });

  it('delegates createContainer (soporte)', async () => {
    const d = build();
    await d.controller.createContainer('s1', { containerIdentifier: 'c', containerTypeConceptId: 't' } as any, actor);
    expect(d.service.createContainer).toHaveBeenCalledWith(
      's1',
      { containerIdentifier: 'c', containerTypeConceptId: 't' },
      actor,
    );
  });

  it('delegates custodyEvent (UC-20-03)', async () => {
    const d = build();
    await d.controller.custodyEvent('c1', { specimenId: 's1' } as any, actor);
    expect(d.service.recordCustodyEvent).toHaveBeenCalledWith('c1', { specimenId: 's1' }, actor);
  });
});
