import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoTrackedSubjectsController } from './geo-tracked-subjects.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = {
    enroll: mockFn(),
    ingestPings: mockFn(),
    lastPosition: mockFn(),
    revokeConsent: mockFn(),
  };
  const controller = new GeoTrackedSubjectsController(service as any);
  return { controller, service };
}

describe('GeoTrackedSubjectsController', () => {
  it('delegates enroll (UC-13-01)', async () => {
    const d = build();
    const dto = { subjectId: 'subj-1' };
    d.service.enroll.mockResolvedValue({ id: 's1' });
    await expect(d.controller.enroll(dto as any, actor)).resolves.toEqual({
      id: 's1',
    });
    expect(d.service.enroll).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates ingestPings (UC-13-03)', async () => {
    const d = build();
    const dto = { pings: [{ latitude: 0, longitude: 0 }] };
    await d.controller.ingestPings('s1', dto, actor);
    expect(d.service.ingestPings).toHaveBeenCalledWith('s1', dto, actor);
  });

  it('delegates lastPosition (UC-13-09)', async () => {
    const d = build();
    await d.controller.lastPosition('s1');
    expect(d.service.lastPosition).toHaveBeenCalledWith('s1');
  });

  it('delegates revokeConsent (UC-13-10)', async () => {
    const d = build();
    await d.controller.revokeConsent('s1', actor);
    expect(d.service.revokeConsent).toHaveBeenCalledWith('s1', actor);
  });
});
