import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalOrdersController } from './clinical-orders.controller';

const actor = { id: 'user-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const serviceRequestsService = { create: mockFn() };
  const diagnosticReportsService = { create: mockFn(), release: mockFn() };
  const requisitionsService = { create: mockFn() };
  const serviceRequestReadService = { getById: mockFn() };
  const controller = new ClinicalOrdersController(
    serviceRequestsService as any,
    diagnosticReportsService as any,
    requisitionsService as any,
    serviceRequestReadService as any,
  );
  return {
    controller,
    serviceRequestsService,
    diagnosticReportsService,
    requisitionsService,
    serviceRequestReadService,
  };
}

describe('ClinicalOrdersController', () => {
  it('delegates createServiceRequest (UC-08-05)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      codeConceptId: 'c1',
    };
    await d.controller.createServiceRequest(dto, actor);
    expect(d.serviceRequestsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createRequisition (C4) with the trimmed Idempotency-Key', async () => {
    const d = build();
    const dto = { custodianTenantId: 't1', patientProfileId: 'p1', items: [] };
    await d.controller.createRequisition(dto as any, actor, '  key-1 ');
    expect(d.requisitionsService.create).toHaveBeenCalledWith(
      dto,
      actor,
      'key-1',
    );
  });

  it('passes no key when the Idempotency-Key header is blank', async () => {
    const d = build();
    await d.controller.createRequisition({} as any, actor, '   ');
    expect(d.requisitionsService.create).toHaveBeenCalledWith(
      {},
      actor,
      undefined,
    );
  });

  it('delegates getServiceRequest (C5)', async () => {
    const d = build();
    await d.controller.getServiceRequest('id-1', actor);
    expect(d.serviceRequestReadService.getById).toHaveBeenCalledWith(
      'id-1',
      actor,
    );
  });

  it('delegates createDiagnosticReport (UC-08-06)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      codeConceptId: 'c1',
    };
    await d.controller.createDiagnosticReport(dto, actor);
    expect(d.diagnosticReportsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates releaseDiagnosticReport (UC-08-07)', async () => {
    const d = build();
    await d.controller.releaseDiagnosticReport('dr1', {}, actor);
    expect(d.diagnosticReportsService.release).toHaveBeenCalledWith(
      'dr1',
      {},
      actor,
    );
  });
});
