import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DentalController } from './dental.controller';
import { PreconditionFailedException, runWithTenant } from '../../../common';

const actor = { id: 'user-1', roles: ['CLINICIAN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const PATIENT = '22222222-2222-2222-2222-222222222222';
const CODE = '33333333-3333-3333-3333-333333333333';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const dentalService = {
    record: mockFn().mockResolvedValue({ id: 'proc-1' }),
    listByPatient: mockFn().mockResolvedValue({ items: [], total: 0 }),
    catalog: mockFn().mockReturnValue({
      procedureCodes: [],
      teeth: [],
      quadrants: [],
    }),
  };
  return {
    controller: new DentalController(dentalService as any),
    dentalService,
  };
}

describe('DentalController', () => {
  it('delega el alta con el tenant del contexto', async () => {
    const d = build();
    const dto = { patientProfileId: PATIENT, procedureCodeConceptId: CODE };

    await runWithTenant(TENANT, () =>
      d.controller.record(dto as any, actor as any),
    );

    expect(d.dentalService.record).toHaveBeenCalledWith(dto, TENANT, actor);
  });

  /**
   * El registro queda bajo la custodia de una organización y no hay forma de
   * deducirla del paciente: una persona puede atenderse en más de una. Sin
   * `X-Tenant-Id` la operación tiene que decirlo, no elegir una.
   */
  it('sin organización activa no registra', () => {
    const d = build();

    // Falla de forma síncrona, antes de devolver la promesa: el tenant se exige
    // al entrar, no dentro de la transacción.
    expect(() =>
      d.controller.record(
        { patientProfileId: PATIENT, procedureCodeConceptId: CODE } as any,
        actor as any,
      ),
    ).toThrow(PreconditionFailedException);
    expect(d.dentalService.record).not.toHaveBeenCalled();
  });

  it('delega el histórico con sus filtros', async () => {
    const d = build();
    const query = { patientProfileId: PATIENT, limit: 10 };

    await d.controller.listByPatient(query as any);

    expect(d.dentalService.listByPatient).toHaveBeenCalledWith(query);
  });

  it('sirve el catálogo', () => {
    const d = build();

    const catalogo = d.controller.catalog();

    expect(catalogo).toEqual({ procedureCodes: [], teeth: [], quadrants: [] });
  });
});
