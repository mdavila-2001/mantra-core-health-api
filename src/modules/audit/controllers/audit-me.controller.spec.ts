import { jest } from '@jest/globals';
import { AuditMeController } from './audit-me.controller';
import { ACCESS_LOGGED_KEY } from '../../../common/audit-trail';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

// Se lee la metadata del handler tal cual está en el prototipo, sin invocarlo.
const listHandler: object = (AuditMeController.prototype as any).list;

describe('AuditMeController', () => {
  it('delega en el servicio con el actor y los filtros, sin tocar nada más', async () => {
    const page = { items: [], nextCursor: null, limit: 25 };
    const service = { list: mockFn().mockResolvedValue(page) };
    const controller = new AuditMeController(service as any);
    const actor = { id: 'u1', roles: ['PATIENT'] } as any;
    const query = { limit: 10 } as any;

    await expect(controller.list(actor, query)).resolves.toBe(page);

    expect(service.list).toHaveBeenCalledWith(actor, query);
  });

  it('exige el rol PATIENT', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AuditMeController)).toEqual([
      'PATIENT',
    ]);
  });

  it('cuelga de audit/me y no declara ningún parámetro de paciente', () => {
    expect(Reflect.getMetadata('path', AuditMeController)).toBe('audit/me');
    expect(Reflect.getMetadata('path', listHandler)).toBe('data-access');
  });

  it('anota la consulta como lectura del propio titular (@AccessLogged)', () => {
    expect(Reflect.getMetadata(ACCESS_LOGGED_KEY, listHandler)).toEqual({
      resourceType: 'PATIENT_DATA_ACCESS_LOG',
      patient: 'actor',
    });
  });
});
