import { jest } from '@jest/globals';
import { ProfilesPersonAccountLinksAdapter } from './profiles-person-account-links.adapter';

describe('ProfilesPersonAccountLinksAdapter', () => {
  it('returns only the active account id needed by pharmacy notifications', async () => {
    const uow = {};
    const links = {
      findActiveByPerson: jest.fn(async () => ({
        userId: 'user-1',
        personId: 'person-1',
        id: 'link-1',
      })),
    };
    const adapter = new ProfilesPersonAccountLinksAdapter(links as any);

    await expect(
      adapter.findActiveByPerson(uow as any, 'person-1'),
    ).resolves.toEqual({ userId: 'user-1' });
    expect(links.findActiveByPerson).toHaveBeenCalledWith(uow, 'person-1');
  });

  it('preserves a missing active account as null', async () => {
    const links = { findActiveByPerson: jest.fn(async () => null) };
    const adapter = new ProfilesPersonAccountLinksAdapter(links as any);

    await expect(
      adapter.findActiveByPerson({} as any, 'person-1'),
    ).resolves.toBeNull();
  });
});
