import 'reflect-metadata';
import { jest } from '@jest/globals';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import {
  AUDITED_KEY,
  NOT_AUDITED_KEY,
} from '../../../../common/audit-trail/audit-trail.decorators';
import { IS_TENANT_AGNOSTIC_KEY } from '../../../../common/tenant/tenant-agnostic.decorator';
import { IamStepUpController } from './iam-step-up.controller';

const handlerOf = (method: string): object =>
  Object.getOwnPropertyDescriptor(IamStepUpController.prototype, method)
    ?.value as object;

describe('IamStepUpController', () => {
  it('cuelga de /iam y es agnóstico de organización (no toca datos de ningún tenant)', () => {
    expect(Reflect.getMetadata(PATH_METADATA, IamStepUpController)).toBe('iam');
    expect(
      Reflect.getMetadata(IS_TENANT_AGNOSTIC_KEY, IamStepUpController),
    ).toBe(true);
  });

  it('POST /iam/me/step-up y GET /iam/me/step-up', () => {
    const post = handlerOf('verify');
    const get = handlerOf('status');
    expect(Reflect.getMetadata(PATH_METADATA, post)).toBe('me/step-up');
    expect(Reflect.getMetadata(METHOD_METADATA, post)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(PATH_METADATA, get)).toBe('me/step-up');
    expect(Reflect.getMetadata(METHOD_METADATA, get)).toBe(RequestMethod.GET);
  });

  it('POST responde 200 (no crea un recurso)', () => {
    expect(Reflect.getMetadata('__httpCode__', handlerOf('verify'))).toBe(200);
  });

  it('POST es auditable con SUPPORT_STEP_UP_VERIFIED (y no está excluido de la bitácora)', () => {
    const handler = handlerOf('verify');
    expect(Reflect.getMetadata(NOT_AUDITED_KEY, handler)).toBeUndefined();
    expect(Reflect.getMetadata(AUDITED_KEY, handler)).toEqual({
      action: 'SUPPORT_STEP_UP_VERIFIED',
      entity: 'session',
    });
  });

  it('POST tiene límite de tasa de 5 por minuto', () => {
    const handler = handlerOf('verify');
    expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(5);
    expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(60_000);
  });

  it('sin @Roles: autoriza el servicio por identidad (sesión propia)', () => {
    expect(
      Reflect.getMetadata('requiredRoles', handlerOf('verify')),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata('requiredRoles', handlerOf('status')),
    ).toBeUndefined();
  });

  it('delega en IamStepUpService con el actor del token', async () => {
    const service = {
      verify: (jest.fn as any)(async () => ({
        verifiedAt: new Date(0),
        validForMinutes: 60,
      })),
      status: (jest.fn as any)(async () => ({ fresh: true, ageMinutes: 1 })),
    };
    const controller = new IamStepUpController(service as any);
    const actor = { id: 'u1', sessionId: 's1', roles: [] } as any;
    await controller.verify(actor, { code: '123456' }, '1.2.3.4');
    expect(service.verify).toHaveBeenCalledWith(
      actor,
      { code: '123456' },
      '1.2.3.4',
    );
    await controller.status(actor, { maxAgeMinutes: 5 });
    expect(service.status).toHaveBeenCalledWith(actor, 5);
    await controller.status(actor, {});
    expect(service.status).toHaveBeenLastCalledWith(actor, undefined);
  });
});
