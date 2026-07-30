import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { CommonAddressesController } from './common-addresses.controller';
import { CreateAddressDto, OwnerType } from '../dto';
import type { AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'user-1', roles: [] };

describe('CommonAddressesController', () => {
  it('delegates create to the service and returns its result', async () => {
    const service = { create: fn().mockResolvedValue({ id: 'addr-1' }) };
    const controller = new CommonAddressesController(service as never);
    const dto: CreateAddressDto = {
      ownerType: OwnerType.PATIENT,
      ownerId: '11111111-1111-1111-1111-111111111111',
      lines: ['Line 1'],
    };

    const result = await controller.create(dto, user);

    expect(service.create).toHaveBeenCalledWith(dto, user);
    expect(result).toEqual({ id: 'addr-1' });
  });
});
