import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
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

  it('TreatmentInformedConsentsController delegates sign to create (authz por rol)', async () => {
    const service = { create: mockFn() };
    const c = new TreatmentInformedConsentsController(service as any);
    const dto = {
      patientProfileId: 'p1',
      encounterId: 'e1',
      decision: 'ACCEPTED',
    };
    await c.sign(dto as any, actor);
    expect(service.create).toHaveBeenCalledWith(dto, actor);
  });

  it('TreatmentInformedConsentsController delegates list/get/withdraw/post-emergency/evidence (v4266)', async () => {
    const service = {
      list: mockFn(),
      get: mockFn(),
      withdraw: mockFn(),
      recordPostEmergencyInformation: mockFn(),
      recordEvidence: mockFn(),
    };
    const c = new TreatmentInformedConsentsController(service as any);
    const query = { patientProfileId: 'p1', targetType: 'REFERRAL' };
    await c.list(query as any, actor);
    expect(service.list).toHaveBeenCalledWith(query, actor);
    await c.get('t1', actor);
    expect(service.get).toHaveBeenCalledWith('t1', actor);
    await c.withdraw('t1', { reason: 'cambió de opinión' }, actor);
    expect(service.withdraw).toHaveBeenCalledWith(
      't1',
      { reason: 'cambió de opinión' },
      actor,
    );
    const info = { informedAt: '2026-10-28T10:00:00Z' };
    await c.postEmergencyInformation('t1', info, actor);
    expect(service.recordPostEmergencyInformation).toHaveBeenCalledWith(
      't1',
      info,
      actor,
    );
    await c.recordEvidence('t1', {} as any, actor);
    expect(service.recordEvidence).toHaveBeenCalledWith('t1', {}, actor);
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
