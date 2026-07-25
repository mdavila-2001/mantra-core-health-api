import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalOrdersController } from './clinical-orders.controller';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const serviceRequestsService = { create: mockFn() };
  const diagnosticReportsService = { create: mockFn(), release: mockFn() };
  const controller = new ClinicalOrdersController(
    serviceRequestsService as any,
    diagnosticReportsService as any,
  );
  return { controller, serviceRequestsService, diagnosticReportsService };
}

describe('ClinicalOrdersController', () => {
  it('delegates createServiceRequest (UC-08-05)', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', codeConceptId: 'c1' };
    await d.controller.createServiceRequest(dto as any, actor);
    expect(d.serviceRequestsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createDiagnosticReport (UC-08-06)', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', codeConceptId: 'c1' };
    await d.controller.createDiagnosticReport(dto as any, actor);
    expect(d.diagnosticReportsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates releaseDiagnosticReport (UC-08-07)', async () => {
    const d = build();
    await d.controller.releaseDiagnosticReport('dr1', {} as any, actor);
    expect(d.diagnosticReportsService.release).toHaveBeenCalledWith('dr1', {}, actor);
  });
});
