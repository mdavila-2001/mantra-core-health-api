import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import {
  ConsentsController,
  HipaaAuthorizationsController,
  PatientObjectionsController,
  PrivacyRestrictionsController,
  ProcessingLegalBasesController,
  TreatmentInformedConsentsController,
  ConsentEvidenceController,
  ConsentSweepController,
} from './index';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('Consent controllers (thin delegation)', () => {
  it('ConsentsController delegates capture/withdraw/amendProvisions', async () => {
    const service = {
      capture: mockFn(),
      withdraw: mockFn(),
      amendProvisions: mockFn(),
    };
    const c = new ConsentsController(service as any);
    const dto = { patientProfileId: 'p1', processingPurposeId: 'pp1' };
    await c.capture(dto, actor);
    expect(service.capture).toHaveBeenCalledWith(dto, actor);
    await c.withdraw('c1', { withdrawalReasonConceptId: 'r1' }, actor);
    expect(service.withdraw).toHaveBeenCalledWith(
      'c1',
      { withdrawalReasonConceptId: 'r1' },
      actor,
    );
    await c.amendProvisions('c1', { provisions: [] }, actor);
    expect(service.amendProvisions).toHaveBeenCalledWith(
      'c1',
      { provisions: [] },
      actor,
    );
  });

  it('HipaaAuthorizationsController delegates grant/revoke', async () => {
    const service = { grant: mockFn(), revoke: mockFn() };
    const c = new HipaaAuthorizationsController(service as any);
    const dto = { patientProfileId: 'p1' };
    await c.grant(dto as any, actor);
    expect(service.grant).toHaveBeenCalledWith(dto, actor);
    await c.revoke('h1', actor);
    expect(service.revoke).toHaveBeenCalledWith('h1', actor);
  });

  it('PatientObjectionsController delegates raise/resolve', async () => {
    const service = { raise: mockFn(), resolve: mockFn() };
    const c = new PatientObjectionsController(service as any);
    const dto = { patientProfileId: 'p1', processingPurposeId: 'pp1' };
    await c.raise(dto, actor);
    expect(service.raise).toHaveBeenCalledWith(dto, actor);
    await c.resolve('o1', { resolution: 'UPHELD' } as any, actor);
    expect(service.resolve).toHaveBeenCalledWith(
      'o1',
      { resolution: 'UPHELD' },
      actor,
    );
  });

  it('PrivacyRestrictionsController delegates apply', async () => {
    const service = { apply: mockFn() };
    const c = new PrivacyRestrictionsController(service as any);
    const dto = { patientProfileId: 'p1', dataClassConceptId: 'dc1' };
    await c.apply(dto, actor);
    expect(service.apply).toHaveBeenCalledWith(dto, actor);
  });

  it('ProcessingLegalBasesController delegates version', async () => {
    const service = { version: mockFn() };
    const c = new ProcessingLegalBasesController(service as any);
    const dto = { processingPurposeId: 'pp1' };
    await c.version(dto, actor);
    expect(service.version).toHaveBeenCalledWith(dto, actor);
  });

  it('TreatmentInformedConsentsController delegates sign', async () => {
    const service = { sign: mockFn() };
    const c = new TreatmentInformedConsentsController(service as any);
    const dto = {
      patientProfileId: 'p1',
      encounterId: 'e1',
      decision: 'ACCEPTED',
    };
    await c.sign(dto as any, actor);
    expect(service.sign).toHaveBeenCalledWith(dto, actor);
  });

  it('ConsentEvidenceController delegates record', async () => {
    const service = { record: mockFn() };
    const c = new ConsentEvidenceController(service as any);
    const dto = { subjectType: 'CONSENT', subjectId: 's1' };
    await c.record(dto as any, actor);
    expect(service.record).toHaveBeenCalledWith(dto, actor);
  });

  it('ConsentSweepController delegates sweep', async () => {
    const service = { sweep: mockFn() };
    const c = new ConsentSweepController(service as any);
    await c.sweep(actor);
    expect(service.sweep).toHaveBeenCalledWith(actor);
  });
});
