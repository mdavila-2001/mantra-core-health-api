import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ContactPointsService } from './contact-points.service';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import { ContactSystem, CreateContactPointDto, OwnerType } from '../dto';
import type { AuthenticatedUser } from '../../../common';

/**
 * Crea create em mock.
 * @returns Resultado de create em mock.
 */
function createEmMock() {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const em = { transactional: fn((cb: (tx: unknown) => unknown) => cb(tx)) };
  return { em, tx };
}

const actor: AuthenticatedUser = { id: 'user-1', roles: [] };

describe('ContactPointsService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const { em, tx } = createEmMock();
    const repo = { findById: fn(), create: fn(), findVigentesByOwner: fn() };
    const service = new ContactPointsService(
      em as never,
      repo,
      logger as never,
    );
    return { service, tx, repo };
  }

  const dto: CreateContactPointDto = {
    ownerType: OwnerType.USER,
    ownerId: '11111111-1111-1111-1111-111111111111',
    system: ContactSystem.EMAIL,
    value: 'a@b.com',
  };

  it('creates an unverified contact point', async () => {
    const { service, tx, repo } = build();
    repo.create.mockReturnValue({
      id: 'cp-1',
      ownerId: dto.ownerId,
      ownerTypeConceptId: CONCEPTS.OWNER_USER,
      systemConceptId: CONCEPTS.CONTACT_EMAIL,
      value: dto.value,
      verified: false,
      createdAt: new Date(),
    });

    const result = await service.create(dto, actor);

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(tx.flush).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: 'cp-1',
      verified: false,
      system: ContactSystem.EMAIL,
    });
  });

  it('verifies an existing contact point', async () => {
    const { service, tx, repo } = build();
    const entity = {
      id: 'cp-1',
      ownerId: dto.ownerId,
      ownerTypeConceptId: CONCEPTS.OWNER_USER,
      systemConceptId: CONCEPTS.CONTACT_EMAIL,
      value: dto.value,
      verified: false,
      createdAt: new Date(),
    };
    repo.findById.mockResolvedValue(entity);

    const result = await service.verify('cp-1', { code: '000000' }, actor);

    expect(entity.verified).toBe(true);
    expect(tx.flush).toHaveBeenCalledTimes(1);
    expect(result.verified).toBe(true);
  });

  it('throws ResourceNotFoundException when verifying a missing contact point', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue(null);

    await expect(service.verify('missing', {}, actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });
});
