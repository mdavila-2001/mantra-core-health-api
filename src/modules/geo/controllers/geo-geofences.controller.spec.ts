import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoGeofencesController } from './geo-geofences.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = { define: mockFn(), recordEvent: mockFn() };
  const controller = new GeoGeofencesController(service as any);
  return { controller, service };
}

describe('GeoGeofencesController', () => {
  it('delegates define (UC-13-04)', async () => {
    const d = build();
    const dto = { tenantId: 't1', name: 'Z', shapeType: 'CIRCLE' };
    d.service.define.mockResolvedValue({ id: 'g1' });
    await expect(d.controller.define(dto as any, actor)).resolves.toEqual({
      id: 'g1',
    });
    expect(d.service.define).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates recordEvent (UC-13-05)', async () => {
    const d = build();
    const dto = {
      geofenceId: 'g1',
      trackedSubjectId: 's1',
      eventType: 'ENTER',
    };
    await d.controller.recordEvent(dto as any, actor);
    expect(d.service.recordEvent).toHaveBeenCalledWith(dto, actor);
  });
});
