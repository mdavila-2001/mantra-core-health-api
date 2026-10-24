import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { IdentifiersService } from './identifiers.service';
import { ConflictException } from '../../../common';
import { CreateIdentifierDto, IdentifierType, OwnerType } from '../dto';
import type { AuthenticatedUser } from '../../../common';

/** Crea un doble de `EntityManager` cuyo `transactional` ejecuta el callback con un tx falso. */
function createEmMock() {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const em = {
    transactional: fn((cb: (tx: unknown) => unknown) => cb(tx)),
  };
  return { em, tx };
}

const actor: AuthenticatedUser = { id: 'user-1', roles: [] };
const dto: CreateIdentifierDto = {
  ownerType: OwnerType.USER,
  ownerId: '11111111-1111-1111-1111-111111111111',
  type: IdentifierType.NATIONAL_ID,
  value: '12345678',
};

describe('IdentifiersService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const { em, tx } = createEmMock();
    const repo = {
      findActiveDuplicate: fn(),
      findByIds: fn(),
      findCurrentByOwner: fn(),
      create: fn(),
    };
    const service = new IdentifiersService(em as never, repo, logger as never);
    return { service, em, tx, repo };
  }

  it('creates an active identifier when there is no duplicate', async () => {
    const { service, tx, repo } = build();
    repo.findActiveDuplicate.mockResolvedValue(null);
    repo.create.mockReturnValue({
      id: 'id-1',
      ownerId: dto.ownerId,
      system: undefined,
      value: dto.value,
      createdAt: new Date('2026-01-01'),
    });

    const result = await service.create(dto, actor);

    expect(repo.findActiveDuplicate).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ value: dto.value }),
    );
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(tx.flush).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: 'id-1',
      state: 'ACTIVE',
      value: dto.value,
    });
  });

  it('rejects a duplicate active identifier with ConflictException', async () => {
    const { service, repo } = build();
    repo.findActiveDuplicate.mockResolvedValue({ id: 'existing' });

    await expect(service.create(dto, actor)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });
});
