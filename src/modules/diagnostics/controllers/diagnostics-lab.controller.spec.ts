import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsLabController } from './diagnostics-lab.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = {
    createWorkOrder: mockFn(),
    createAnalyzerRun: mockFn(),
    ingestMessage: mockFn(),
    verifyResult: mockFn(),
  };
  return { controller: new DiagnosticsLabController(service as any), service };
}

describe('DiagnosticsLabController', () => {
  it('delegates createWorkOrder (UC-20-04)', async () => {
    const d = build();
    const dto = { laboratoryAccessionId: 'a1', tests: [] };
    await d.controller.createWorkOrder(dto, actor);
    expect(d.service.createWorkOrder).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createAnalyzerRun (soporte)', async () => {
    const d = build();
    const dto = { analyzerDeviceId: 'dev1', runIdentifier: 'r1' };
    await d.controller.createAnalyzerRun(dto, actor);
    expect(d.service.createAnalyzerRun).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates ingestMessage (UC-20-05)', async () => {
    const d = build();
    await d.controller.ingestMessage('run1', { payloadHash: 'h' }, actor);
    expect(d.service.ingestMessage).toHaveBeenCalledWith(
      'run1',
      { payloadHash: 'h' },
      actor,
    );
  });

  it('delegates verifyResult (UC-20-06)', async () => {
    const d = build();
    await d.controller.verifyResult(
      'o1',
      { level: 'TECHNICAL', verifiedByProfileId: 'p1' } as any,
      actor,
    );
    expect(d.service.verifyResult).toHaveBeenCalledWith(
      'o1',
      { level: 'TECHNICAL', verifiedByProfileId: 'p1' },
      actor,
    );
  });
});
