import 'reflect-metadata';
import {
  AUDITED_KEY,
  NOT_AUDITED_KEY,
} from '../../../../common/audit-trail/audit-trail.decorators';
import { IamAccountSecurityController } from './iam-account-security.controller';

/** El método del controlador como valor, para leer su metadata. */
const handlerOf = (method: string): object =>
  Object.getOwnPropertyDescriptor(
    IamAccountSecurityController.prototype,
    method,
  )?.value as object;

describe('IamAccountSecurityController: rastro de los dispositivos', () => {
  it('el envío del código «Fui yo» es auditable con su PROPIA acción (no se confunde con confirmar)', () => {
    const handler = handlerOf('requestDeviceCode');
    expect(Reflect.getMetadata(NOT_AUDITED_KEY, handler)).toBeUndefined();
    expect(Reflect.getMetadata(AUDITED_KEY, handler)).toEqual({
      action: 'DEVICE_CONFIRM_CODE_REQUESTED',
      entity: 'device',
      entityId: 'param:id',
    });
    expect(
      Reflect.getMetadata(AUDITED_KEY, handlerOf('confirmDevice')),
    ).toEqual(expect.objectContaining({ action: 'DEVICE_CONFIRMED' }));
  });
});
