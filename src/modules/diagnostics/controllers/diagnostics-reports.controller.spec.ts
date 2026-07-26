import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsReportsController } from './diagnostics-reports.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const service = {
    createReportVersion: mockFn(),
    releaseVersion: mockFn(),
    detectCritical: mockFn(),
    acknowledgeCritical: mockFn(),
  };
  return { controller: new DiagnosticsReportsController(service as any), service };
}

describe('DiagnosticsReportsController', () => {
  it('delegates createVersion (UC-20-07)', async () => {
    const d = build();
    await d.controller.createVersion('r1', { custodianTenantId: 't1' } as any, actor);
    expect(d.service.createReportVersion).toHaveBeenCalledWith('r1', { custodianTenantId: 't1' }, actor);
  });

  it('delegates releaseVersion (UC-20-08)', async () => {
    const d = build();
    await d.controller.releaseVersion('r1', 'v1', {} as any, actor);
    expect(d.service.releaseVersion).toHaveBeenCalledWith('r1', 'v1', {}, actor);
  });

  it('delegates detectCritical (UC-20-09)', async () => {
    const d = build();
    const dto = { observationId: 'o1', patientProfileId: 'p1' };
    await d.controller.detectCritical(dto as any, actor);
    expect(d.service.detectCritical).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates acknowledge (UC-20-10)', async () => {
    const d = build();
    await d.controller.acknowledge('n1', { acknowledgedByProfileId: 'p1' } as any, actor);
    expect(d.service.acknowledgeCritical).toHaveBeenCalledWith('n1', { acknowledgedByProfileId: 'p1' }, actor);
  });
});
