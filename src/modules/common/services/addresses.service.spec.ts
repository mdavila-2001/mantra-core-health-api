import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { AddressesService } from './addresses.service';
import { CreateAddressDto, OwnerType } from '../dto';
import type { AuthenticatedUser } from '../../../common';

function createEmMock() {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const em = { transactional: fn((cb: (tx: unknown) => unknown) => cb(tx)) };
  return { em, tx };
}

const actor: AuthenticatedUser = { id: 'user-1', roles: [] };

describe('AddressesService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  function build() {
    const { em, tx } = createEmMock();
    const repo = { create: fn() };
    const service = new AddressesService(em as never, repo as never, logger as never);
    return { service, tx, repo };
  }

  const dto: CreateAddressDto = {
    ownerType: OwnerType.PATIENT,
    ownerId: '11111111-1111-1111-1111-111111111111',
    lines: ['Av. Siempre Viva 742', 'Dpto 3'],
    city: 'Lima',
  };

  it('creates an address, joining lines and defaulting country to PE', async () => {
    const { service, tx, repo } = build();
    repo.create.mockImplementation((_tx: unknown, data: { lines?: string }) => ({
      id: 'addr-1',
      ownerId: dto.ownerId,
      lines: data.lines,
      city: dto.city,
      postalCode: undefined,
      createdAt: new Date(),
    }));

    const result = await service.create(dto, actor);

    expect(tx.flush).toHaveBeenCalledTimes(1);
    // Las líneas viajan al repo serializadas en una sola cadena (columna varchar).
    expect(repo.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ lines: 'Av. Siempre Viva 742\nDpto 3' }),
    );
    expect(result).toMatchObject({ id: 'addr-1', country: 'PE', ownerType: OwnerType.PATIENT });
    expect(result.lines).toEqual(dto.lines);
  });
});