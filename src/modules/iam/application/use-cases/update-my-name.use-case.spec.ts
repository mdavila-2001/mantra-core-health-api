import { jest } from '@jest/globals';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { UpdateMyNameUseCase } from './update-my-name.use-case';

const actor = { id: 'user-1' } as AuthenticatedUser;

function build(user: object | null) {
  const flush = jest.fn(async () => undefined);
  const tx = { flush };
  const em = { transactional: (fn: (t: unknown) => unknown) => fn(tx) };
  const usersRepo = { findById: jest.fn(async () => user) };
  const useCase = new UpdateMyNameUseCase(em as never, usersRepo as never);
  return { useCase, flush, usersRepo };
}

describe('UpdateMyNameUseCase', () => {
  it('recomposes the account name from the four parts and stamps who changed it', async () => {
    const user = { displayName: 'Wendy Jennyfer Dávila Tamal' };
    const { useCase, flush, usersRepo } = build(user);

    const result = await useCase.execute(actor, {
      name: ' Wendy ',
      middleName: 'Jennyfer',
      lastName: 'Dávila',
      motherLastName: 'Yamal',
    });

    expect(result).toEqual({ displayName: 'Wendy Jennyfer Dávila Yamal' });
    expect(user).toMatchObject({
      displayName: 'Wendy Jennyfer Dávila Yamal',
      updatedByUserId: 'user-1',
    });
    expect(usersRepo.findById).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
    );
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('drops an optional part sent empty', async () => {
    const { useCase } = build({ displayName: 'x' });

    const result = await useCase.execute(actor, {
      name: 'Wendy',
      middleName: '',
      lastName: 'Dávila',
    });

    expect(result.displayName).toBe('Wendy Dávila');
  });

  it('answers 404 when the account does not exist', async () => {
    const { useCase, flush } = build(null);

    await expect(
      useCase.execute(actor, { name: 'Wendy', lastName: 'Dávila' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(flush).not.toHaveBeenCalled();
  });
});
