import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { CommonContactPointsController } from './common-contact-points.controller';
import { ContactSystem, CreateContactPointDto, OwnerType } from '../dto';
import type { AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'user-1', roles: [] };

describe('CommonContactPointsController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const service = { create: fn(), verify: fn() };
    const controller = new CommonContactPointsController(service as never);
    return { service, controller };
  }

  it('delegates create to the service', async () => {
    const { service, controller } = build();
    service.create.mockResolvedValue({ id: 'cp-1' });
    const dto: CreateContactPointDto = {
      ownerType: OwnerType.USER,
      ownerId: '11111111-1111-1111-1111-111111111111',
      system: ContactSystem.EMAIL,
      value: 'a@b.com',
    };

    const result = await controller.create(dto, user);

    expect(service.create).toHaveBeenCalledWith(dto, user);
    expect(result).toEqual({ id: 'cp-1' });
  });

  it('delegates verify to the service with the id, dto and user', async () => {
    const { service, controller } = build();
    service.verify.mockResolvedValue({ id: 'cp-1', verified: true });

    const result = await controller.verify('cp-1', { code: '000000' }, user);

    expect(service.verify).toHaveBeenCalledWith(
      'cp-1',
      { code: '000000' },
      user,
    );
    expect(result).toEqual({ id: 'cp-1', verified: true });
  });
});
