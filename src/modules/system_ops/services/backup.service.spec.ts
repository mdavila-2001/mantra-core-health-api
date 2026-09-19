import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BackupService } from './backup.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    createPolicy: mockFn(),
    findPolicyById: mockFn(),
    createTestRun: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new BackupService(em as any, repo as any, logger as any);
  return { service, repo };
}

describe('BackupService', () => {
  describe('createPolicy (UC-11-09)', () => {
    // MCH-022-AC01: RPO y RTO miden dimensiones distintas (pérdida de datos
    // tolerada vs. tiempo fuera de servicio tolerado). Una organización puede
    // aceptar perder una hora de datos y a la vez exigir estar arriba en quince
    // minutos: eso es una política legítima, no un error de carga.
    it('acepta RPO=3600 con RTO=900: son objetivos independientes', async () => {
      const d = build();
      d.repo.createPolicy.mockReturnValue({ id: 'bp1' });
      const res = await d.service.createPolicy(
        { rpoSeconds: 3600, rtoSeconds: 900 } as any,
        actor,
      );
      expect(res).toEqual({ id: 'bp1' });
    });

    // MCH-022-AC02: lo inválido se rechaza por su propio rango.
    it.each([
      ['RPO negativo', { rpoSeconds: -1, rtoSeconds: 900 }],
      ['RTO negativo', { rpoSeconds: 3600, rtoSeconds: -1 }],
      ['RTO en cero', { rpoSeconds: 3600, rtoSeconds: 0 }],
      ['RPO absurdo', { rpoSeconds: 31_536_001, rtoSeconds: 900 }],
      ['RTO absurdo', { rpoSeconds: 3600, rtoSeconds: 31_536_001 }],
      ['RPO no entero', { rpoSeconds: 1.5, rtoSeconds: 900 }],
    ])('rechaza %s por su propio rango', async (_caso, objetivos) => {
      const d = build();
      await expect(
        d.service.createPolicy(objetivos as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.repo.createPolicy).not.toHaveBeenCalled();
    });

    it('RPO=0 es válido: exige no perder ningún dato', async () => {
      const d = build();
      d.repo.createPolicy.mockReturnValue({ id: 'bp0' });
      await expect(
        d.service.createPolicy(
          { rpoSeconds: 0, rtoSeconds: 900 } as any,
          actor,
        ),
      ).resolves.toEqual({ id: 'bp0' });
    });

    it('creates the policy', async () => {
      const d = build();
      d.repo.createPolicy.mockReturnValue({ id: 'bp1' });
      const res = await d.service.createPolicy(
        { rpoSeconds: 10, rtoSeconds: 100 } as any,
        actor,
      );
      expect(res).toEqual({ id: 'bp1' });
    });
  });

  describe('recordRestoreTest (UC-11-10)', () => {
    it('throws when the policy is missing', async () => {
      const d = build();
      d.repo.findPolicyById.mockResolvedValue(null);
      await expect(
        d.service.recordRestoreTest(
          { backupPolicyId: 'bp1', outcomeConceptId: 'o' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('flags an objective breach when measured RPO exceeds target', async () => {
      const d = build();
      d.repo.findPolicyById.mockResolvedValue({
        id: 'bp1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        rpoSeconds: 60,
        rtoSeconds: 600,
      });
      d.repo.createTestRun.mockReturnValue({
        id: 'rt1',
        outcomeConceptId: 'o',
      });
      const res = await d.service.recordRestoreTest(
        {
          backupPolicyId: 'bp1',
          outcomeConceptId: 'o',
          measuredRpoSeconds: 120,
        },
        actor,
      );
      expect(res.objectiveBreached).toBe(true);
    });
  });
});
