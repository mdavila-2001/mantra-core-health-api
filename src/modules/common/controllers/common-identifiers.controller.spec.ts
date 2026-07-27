import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { CommonIdentifiersController } from './common-identifiers.controller';
import { CreateIdentifierDto, IdentifierType, OwnerType } from '../dto';
import type { AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'user-1', roles: [] };

describe('CommonIdentifiersController', () => {
  it('delegates create to the service and returns its result', async () => {
    const service = { create: fn().mockResolvedValue({ id: 'id-1' }) };
    const controller = new CommonIdentifiersController(service as never);
    const dto: CreateIdentifierDto = {
      ownerType: OwnerType.USER,
      ownerId: '11111111-1111-1111-1111-111111111111',
      type: IdentifierType.NATIONAL_ID,
      value: '123',
    };

    const result = await controller.create(dto, user);

    expect(service.create).toHaveBeenCalledWith(dto, user);
    expect(result).toEqual({ id: 'id-1' });
  });
});
