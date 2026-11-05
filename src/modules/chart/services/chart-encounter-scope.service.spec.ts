import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { ChartErrorReason } from '../chart.error-reasons';
import { ChartEncounterScopeService } from './chart-encounter-scope.service';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Construye el servicio con repositorios de prueba: el encuentro `enc-1` y el
 * diagnóstico `cond-1` existen, son del paciente `p1` y de la organización B.
 *
 * @returns El servicio y sus repositorios.
 */
function build() {
  const encountersRepo = {
    findById: mockFn(async (_tx: unknown, id: string) => ({
      id,
      patientProfileId: 'p1',
      tenantId: TENANT_B,
      sealedAt: undefined,
    })),
  };
  const conditionsRepo = {
    findById: mockFn(async (_tx: unknown, id: string) => ({
      id,
      patientProfileId: 'p1',
      custodianTenantId: TENANT_B,
    })),
  };
  const service = new ChartEncounterScopeService(
    encountersRepo as any,
    conditionsRepo as any,
  );
  return { service, encountersRepo, conditionsRepo };
}

/**
 * Captura el rechazo de una promesa para inspeccionarlo.
 *
 * @param promise - Operación que debe fallar.
 * @returns El error lanzado.
 */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba un rechazo');
}

describe('ChartEncounterScopeService · alcance por tenant', () => {
  describe('assertEncounterBelongsToPatientAndWritable', () => {
    it('sin tenant en el contexto deniega por defecto y ni consulta el encuentro', async () => {
      const d = build();

      const error = await rejection(
        d.service.assertEncounterBelongsToPatientAndWritable(
          {} as any,
          'enc-1',
          'p1',
        ),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
      expect(d.encountersRepo.findById).not.toHaveBeenCalled();
    });

    it('un encuentro de otro tenant responde como inexistente', async () => {
      const d = build();

      const error = await rejection(
        runWithTenant(TENANT_A, () =>
          d.service.assertEncounterBelongsToPatientAndWritable(
            {} as any,
            'enc-1',
            'p1',
          ),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_OUT_OF_SCOPE);
    });

    it('un encuentro del tenant activo y del paciente pasa', async () => {
      const d = build();

      await expect(
        runWithTenant(TENANT_B, () =>
          d.service.assertEncounterBelongsToPatientAndWritable(
            {} as any,
            'enc-1',
            'p1',
          ),
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertConditionBelongsToPatient', () => {
    it('sin tenant en el contexto deniega por defecto y ni consulta el diagnóstico', async () => {
      const d = build();

      const error = await rejection(
        d.service.assertConditionBelongsToPatient({} as any, 'cond-1', 'p1'),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
      expect(d.conditionsRepo.findById).not.toHaveBeenCalled();
    });

    it('un diagnóstico del mismo paciente bajo custodia de otro tenant responde igual que uno inexistente', async () => {
      const foreign = build();
      const absent = build();
      absent.conditionsRepo.findById.mockResolvedValue(null);

      const a = await rejection(
        runWithTenant(TENANT_A, () =>
          foreign.service.assertConditionBelongsToPatient(
            {} as any,
            'cond-1',
            'p1',
          ),
        ),
      );
      const b = await rejection(
        runWithTenant(TENANT_A, () =>
          absent.service.assertConditionBelongsToPatient(
            {} as any,
            'cond-1',
            'p1',
          ),
        ),
      );

      expect(a).toBeInstanceOf(ResourceNotFoundException);
      expect(a.reason).toBe(ChartErrorReason.CHART_CONDITION_OUT_OF_SCOPE);
      expect(a.details).toBeUndefined();
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('un diagnóstico del tenant activo y del paciente pasa', async () => {
      const d = build();

      await expect(
        runWithTenant(TENANT_B, () =>
          d.service.assertConditionBelongsToPatient({} as any, 'cond-1', 'p1'),
        ),
      ).resolves.toBeUndefined();
    });
  });
});
