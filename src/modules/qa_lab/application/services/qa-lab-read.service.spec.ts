import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QaLabReadService } from './qa-lab-read.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../../common';
import { QaLabErrorReason } from '../../qa_lab.error-reasons';
import {
  TestDefects,
  TestEnvironments,
  TestRuns,
  TestSuites,
} from '../../entities';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const SUITE = '11111111-1111-1111-1111-111111111111';
const RUN = '33333333-3333-3333-3333-333333333333';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns El servicio y sus dobles.
 */
function build() {
  const connection = { execute: mockFn().mockResolvedValue([]) };
  const em = {
    find: mockFn().mockResolvedValue([]),
    findOne: mockFn().mockResolvedValue(null),
    getConnection: mockFn().mockReturnValue(connection),
  };
  const service = new QaLabReadService(em as any);
  return { service, em, connection };
}

describe('QaLabReadService · alcance de tenant (QALAB-01)', () => {
  it('sin tenant en el contexto ninguna lectura toca la base', async () => {
    const d = build();

    for (const read of [
      () => d.service.listEnvironments(),
      () => d.service.listSuites(),
      () => d.service.getSuite(SUITE),
      () => d.service.listRuns({}),
      () => d.service.getRun(RUN),
      () => d.service.listDefects({}),
    ]) {
      await expect(read()).rejects.toBeInstanceOf(PreconditionFailedException);
    }
    expect(d.em.find).not.toHaveBeenCalled();
    expect(d.em.findOne).not.toHaveBeenCalled();
  });

  it('los listados filtran por el tenant activo en la consulta', async () => {
    const d = build();

    await runWithTenant(TENANT_A, async () => {
      await d.service.listEnvironments();
      await d.service.listSuites();
      await d.service.listRuns({ limit: 10 });
      await d.service.listDefects({});
    });

    const filterOf = (entity: unknown) =>
      d.em.find.mock.calls.find((call: unknown[]) => call[0] === entity)?.[1];
    expect(filterOf(TestEnvironments)).toEqual({ tenantId: TENANT_A });
    expect(filterOf(TestSuites)).toEqual({ tenantId: TENANT_A });
    expect(filterOf(TestRuns)).toEqual({ tenantId: TENANT_A });
    expect(filterOf(TestDefects)).toEqual({ tenantId: TENANT_A });
  });

  it('el filtro por suite no saca del tenant activo', async () => {
    const d = build();

    await runWithTenant(TENANT_A, () => d.service.listRuns({ suiteId: SUITE }));

    expect(d.em.find.mock.calls[0][1]).toEqual({
      suiteId: SUITE,
      tenantId: TENANT_A,
    });
  });

  it('la última corrida sólo se consulta para las suites del tenant (y no se consulta sin suites)', async () => {
    const d = build();

    await runWithTenant(TENANT_A, () => d.service.listSuites());
    expect(d.connection.execute).not.toHaveBeenCalled();

    d.em.find.mockResolvedValueOnce([
      {
        id: SUITE,
        code: 'S-1',
        name: 'S',
        version: 1,
        stateConceptId: 'x',
        suiteTypeConceptId: 'x',
      },
    ]);
    await runWithTenant(TENANT_A, () => d.service.listSuites());

    const [sql, params] = d.connection.execute.mock.calls[0];
    expect(sql).toContain('WHERE suite_id IN (?)');
    expect(params).toEqual([SUITE]);
  });

  it('suite y corrida por UUID: la consulta lleva el tenant y lo ajeno responde igual que lo inexistente', async () => {
    const d = build();

    const errors: ResourceNotFoundException[] = [];
    const reads: Array<() => Promise<unknown>> = [
      () => d.service.getSuite(SUITE),
      () => d.service.getRun(RUN),
    ];
    for (const read of reads) {
      const error = await runWithTenant(TENANT_A, read).then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      errors.push(error as ResourceNotFoundException);
    }

    expect(d.em.findOne).toHaveBeenCalledWith(TestSuites, {
      id: SUITE,
      tenantId: TENANT_A,
    });
    expect(d.em.findOne).toHaveBeenCalledWith(TestRuns, {
      id: RUN,
      tenantId: TENANT_A,
    });
    for (const error of errors) {
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(QaLabErrorReason.QA_LAB_RESOURCE_OUT_OF_SCOPE);
      expect(error.details).toBeUndefined();
    }
  });

  it('una suite sin tenant (huérfana) no se entrega aunque la consulta la devolviera', async () => {
    const d = build();
    d.em.findOne.mockResolvedValue({ id: SUITE, code: 'S-1' });

    await expect(
      runWithTenant(TENANT_A, () => d.service.getSuite(SUITE)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
