import { describe, expect, it, jest } from '@jest/globals';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { runWithTenant } from '../../../common';
import { LabStaffGuard } from '../guards';
import { DiagnosticsReceptionController } from './diagnostics-reception.controller';
import { DiagnosticsSpecimensController } from './diagnostics-specimens.controller';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('DiagnosticsReceptionController', () => {
  it('correcto: la bandeja delega con el tenant del contexto y el cuerpo tal cual', async () => {
    const service = {
      listInbox: mockFn(() =>
        Promise.resolve({ items: [], count: 0, limit: 25, nextCursor: null }),
      ),
    };
    const controller = new DiagnosticsReceptionController(service as any);
    const body = { limit: 10, patientQuery: 'ana' };
    await runWithTenant('lab-1', () => controller.listInbox(body));
    expect(service.listInbox).toHaveBeenCalledWith('lab-1', body);
  });

  it('inválido: sin tenant en el contexto no llega al servicio', async () => {
    const service = { listInbox: mockFn() };
    const controller = new DiagnosticsReceptionController(service as any);
    await expect(async () => controller.listInbox({})).rejects.toThrow(
      /tenant/i,
    );
    expect(service.listInbox).not.toHaveBeenCalled();
  });

  it('la bandeja y el circuito de especímenes los autoriza LabStaffGuard, no @Roles', () => {
    for (const controller of [
      DiagnosticsReceptionController,
      DiagnosticsSpecimensController,
    ]) {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([
        LabStaffGuard,
      ]);
      // Con `@Roles('CLINICIAN', 'PRACTITIONER')` en la clase, RolesGuard
      // —global, corre antes— rebotaría al dueño del laboratorio sin llegar
      // a mirar su membresía.
      expect(Reflect.getMetadata(ROLES_KEY, controller)).toBeUndefined();
    }
  });
});
