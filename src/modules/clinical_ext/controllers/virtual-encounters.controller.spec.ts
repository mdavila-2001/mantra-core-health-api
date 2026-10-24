import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { VirtualEncountersController } from './virtual-encounters.controller';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';

const actor = { id: 'md-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const virtualEncountersService = {
    create: mockFn(),
    join: mockFn(),
    end: mockFn(),
  };
  const controller = new VirtualEncountersController(
    virtualEncountersService as any,
  );
  return { controller, virtualEncountersService };
}

describe('VirtualEncountersController (UC-18-12)', () => {
  it('delegates create', async () => {
    const d = build();
    const dto = { encounterId: 'e1' };
    await d.controller.create(dto, actor);
    expect(d.virtualEncountersService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates join', async () => {
    const d = build();
    await d.controller.join('ve1', actor);
    expect(d.virtualEncountersService.join).toHaveBeenCalledWith('ve1', actor);
  });

  it('permite que el rol PATIENT llegue al join para validar titularidad en el servicio', () => {
    const handler = Object.getOwnPropertyDescriptor(
      VirtualEncountersController.prototype,
      'join',
    )?.value;
    const roles = Reflect.getMetadata(ROLES_KEY, handler);

    expect(roles).toContain('PATIENT');
  });

  it('delegates end', async () => {
    const d = build();
    const dto = { recordingFileId: 'f1' };
    await d.controller.end('ve1', dto, actor);
    expect(d.virtualEncountersService.end).toHaveBeenCalledWith(
      've1',
      dto,
      actor,
    );
  });
});
