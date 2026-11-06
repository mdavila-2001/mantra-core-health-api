import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DiagnosticsOrdersController } from './diagnostics-orders.controller';
import { runWithTenant } from '../../../common';
import { ClinicalRecordAccessGuard } from '../../clinical/guards';
import {
  IPS_ONLY_READ_SCOPE,
  type ClinicalReadScope,
} from '../../clinical/domain/clinical-read-scope';

const FULL: ClinicalReadScope = { kind: 'FULL' };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = { getPatientOrders: mockFn() };
  const results = {
    getReleasedResult: mockFn(),
    getReleasedResultFileContent: mockFn().mockResolvedValue({
      buffer: Buffer.from('%PDF'),
      mimeType: 'application/pdf',
      originalName: 'informe final.pdf',
    }),
  };
  return {
    controller: new DiagnosticsOrdersController(service as any, results as any),
    service,
    results,
  };
}

/** Guards montados en un handler del controlador. */
const guardsOf = (handler: string): unknown[] =>
  (Reflect.getMetadata(
    GUARDS_METADATA,
    Object.getOwnPropertyDescriptor(
      DiagnosticsOrdersController.prototype,
      handler,
    )!.value,
  ) as unknown[]) ?? [];

describe('DiagnosticsOrdersController', () => {
  it('delega la lectura con el tenant del contexto', async () => {
    const d = build();

    await runWithTenant('t1', () =>
      d.controller.getPatientOrders('p1', 10, FULL),
    );

    expect(d.service.getPatientOrders).toHaveBeenCalledWith(
      't1',
      'p1',
      10,
      FULL,
    );
  });

  it('aplica 50 como tope por omisión', async () => {
    const d = build();

    await runWithTenant('t1', () =>
      d.controller.getPatientOrders('p1', undefined, FULL),
    );

    expect(d.service.getPatientOrders).toHaveBeenCalledWith(
      't1',
      'p1',
      50,
      FULL,
    );
  });

  it('sin alcance en la petición cae al más restrictivo, nunca al completo', async () => {
    const d = build();

    await runWithTenant('t1', () => d.controller.getPatientOrders('p1'));

    expect(d.service.getPatientOrders).toHaveBeenCalledWith(
      't1',
      'p1',
      50,
      IPS_ONLY_READ_SCOPE,
    );
  });

  it('el resultado liberado delega con tenant, paciente e informe', async () => {
    const d = build();

    await runWithTenant('t1', () => d.controller.getReleasedResult('p1', 'r1'));

    expect(d.results.getReleasedResult).toHaveBeenCalledWith('t1', 'p1', 'r1');
  });

  it('la descarga envía los bytes con su tipo y nombre', async () => {
    const d = build();
    const res = { setHeader: mockFn(), send: mockFn() };

    await runWithTenant('t1', () =>
      d.controller.getReleasedResultFileContent('p1', 'r1', 'f1', res as any),
    );

    expect(d.results.getReleasedResultFileContent).toHaveBeenCalledWith(
      't1',
      'p1',
      'r1',
      'f1',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      "attachment; filename*=UTF-8''informe%20final.pdf",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-store',
    );
    expect(res.send).toHaveBeenCalled();
  });

  it('un archivo declarado como HTML sale opaco y como descarga, no se abre en línea', async () => {
    const d = build();
    d.results.getReleasedResultFileContent.mockResolvedValue({
      buffer: Buffer.from('<script>alert(1)</script>'),
      mimeType: 'text/html',
      originalName: null,
    });
    const res = { setHeader: mockFn(), send: mockFn() };

    await runWithTenant('t1', () =>
      d.controller.getReleasedResultFileContent('p1', 'r1', 'f1', res as any),
    );

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/octet-stream',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringMatching(/^attachment/),
    );
    expect(res.setHeader).not.toHaveBeenCalledWith('Content-Type', 'text/html');
  });

  it.each([
    'getPatientOrders',
    'getReleasedResult',
    'getReleasedResultFileContent',
  ])(
    '%s monta la misma puerta de la historia que la lista de órdenes',
    (handler) => {
      expect(guardsOf(handler)).toContain(ClinicalRecordAccessGuard);
    },
  );

  it('sin acceso a la historia la puerta corta con 403 antes del handler', async () => {
    // En lectura la puerta resuelve el alcance (`resolveReadScope`), que es
    // quien niega el acceso. Sin tenant resuelto no abre la transacción RLS.
    const readService = {
      resolveReadScope: mockFn().mockRejectedValue(
        new ForbiddenException('Sin acceso a la historia'),
      ),
    };
    const guard = new ClinicalRecordAccessGuard(readService as any, {} as any);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'u1', roles: ['CLINICIAN'] },
          params: { patientProfileId: 'p1', reportId: 'r1' },
          method: 'GET',
        }),
      }),
    } as any;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(readService.resolveReadScope).toHaveBeenCalledWith('p1', {
      id: 'u1',
      roles: ['CLINICIAN'],
    });
  });
});
