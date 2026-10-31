import { jest } from '@jest/globals';
import 'reflect-metadata';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { PORTAL_READ_ROLES } from '../../data_catalog/data_catalog.constants';
import {
  ListGovernancePiiFieldsQueryDto,
  ListGovernancePoliciesQueryDto,
} from '../dto';
import { GovernanceReadController } from './governance-read.controller';

describe('GovernanceReadController', () => {
  const service = {
    listPolicies: mockFn(),
    getPolicy: mockFn(),
    listPiiFields: mockFn(),
  };
  const controller = new GovernanceReadController(service as any);

  it('delega cada lectura en el servicio', async () => {
    await controller.listPolicies({ type: 'WRITE' } as any);
    expect(service.listPolicies).toHaveBeenCalledWith({ type: 'WRITE' });
    await controller.getPolicy('id-1');
    expect(service.getPolicy).toHaveBeenCalledWith('id-1');
    await controller.listPiiFields({ q: 'x' } as any);
    expect(service.listPiiFields).toHaveBeenCalledWith({ q: 'x' });
  });

  it('las tres lecturas exigen los roles del portal de datos', () => {
    for (const method of [
      'listPolicies',
      'getPolicy',
      'listPiiFields',
    ] as const) {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        Reflect.get(GovernanceReadController.prototype, method) as object,
      ) as readonly string[] | undefined;
      expect(roles).toEqual([...PORTAL_READ_ROLES]);
    }
  });
});

describe('validación de los filtros', () => {
  const check = async (cls: any, input: object) =>
    validate(plainToInstance(cls, input), {
      forbidNonWhitelisted: true,
      whitelist: true,
    });

  it('acepta filtros válidos y números en texto', async () => {
    expect(
      await check(ListGovernancePoliciesQueryDto, {
        type: 'RETENTION',
        limit: '20',
        q: 'ret',
      }),
    ).toEqual([]);
    expect(
      await check(ListGovernancePiiFieldsQueryDto, {
        sensitivity: 'PERSONAL',
        schema: 'iam',
        source: 'BOTH',
      }),
    ).toEqual([]);
  });

  it('rechaza un tipo desconocido, un límite fuera de rango y claves no declaradas', async () => {
    expect(
      (await check(ListGovernancePoliciesQueryDto, { type: 'OTRO' })).length,
    ).toBeGreaterThan(0);
    expect(
      (await check(ListGovernancePoliciesQueryDto, { limit: '999' })).length,
    ).toBeGreaterThan(0);
    expect(
      (await check(ListGovernancePoliciesQueryDto, { sql: 'x' })).length,
    ).toBeGreaterThan(0);
    expect(
      (await check(ListGovernancePiiFieldsQueryDto, { schema: 'a;drop table' }))
        .length,
    ).toBeGreaterThan(0);
    expect(
      (await check(ListGovernancePiiFieldsQueryDto, { sensitivity: 'PUBLIC' }))
        .length,
    ).toBeGreaterThan(0);
  });
});
