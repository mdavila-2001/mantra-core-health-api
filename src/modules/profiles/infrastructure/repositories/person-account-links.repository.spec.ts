import { jest } from '@jest/globals';
import { PersonAccountLinks } from '../../entities';
import { PROF } from '../../profiles.concepts';
import { PersonAccountLinksRepository } from './person-account-links.repository';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

describe('PersonAccountLinksRepository · vínculos para «su propia admisión» (S-6)', () => {
  it('hasActiveLink pregunta por el par exacto (persona, cuenta) entre los vínculos ACTIVOS, no por «el» vínculo', async () => {
    const em = { count: fn().mockResolvedValue(1) };
    const repo = new PersonAccountLinksRepository();
    await expect(
      repo.hasActiveLink(em as never, 'prac-1', 'u-doctor'),
    ).resolves.toBe(true);
    expect(em.count).toHaveBeenCalledWith(PersonAccountLinks, {
      personId: 'prac-1',
      userId: 'u-doctor',
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
  });

  it('sin ese par activo (aunque haya otros vínculos de la persona) responde false', async () => {
    const em = { count: fn().mockResolvedValue(0) };
    await expect(
      new PersonAccountLinksRepository().hasActiveLink(
        em as never,
        'prac-1',
        'u-otro',
      ),
    ).resolves.toBe(false);
  });

  it('findActivePersonIdsByUser devuelve todas las personas de la cuenta, sin repetir', async () => {
    const em = {
      find: fn().mockResolvedValue([
        { personId: 'a' },
        { personId: 'b' },
        { personId: 'a' },
      ]),
    };
    const ids =
      await new PersonAccountLinksRepository().findActivePersonIdsByUser(
        em as never,
        'u-1',
      );
    expect(ids).toEqual(['a', 'b']);
    expect(em.find).toHaveBeenCalledWith(
      PersonAccountLinks,
      { userId: 'u-1', statusConceptId: PROF.ACCOUNT_LINK_ACTIVE },
      expect.anything(),
    );
  });
});
