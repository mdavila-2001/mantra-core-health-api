import { jest } from '@jest/globals';

import { CONCEPTS } from '../../../common';
import { COMM } from '../community.concepts';
import { PublicProfiles } from '../entities';
import { PublicProfilesRepository } from './public-profiles.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('PublicProfilesRepository.searchChatContacts', () => {
  it('acota por nombre normalizado a personas públicas y excluye perfil propio y bloqueos', async () => {
    const execute = mockFn().mockResolvedValue([{ id: 'p-visible' }]);
    const find = mockFn().mockResolvedValue([{ id: 'p-visible' }]);
    const em = { find, getConnection: () => ({ execute }) } as any;
    const repository = new PublicProfilesRepository();

    await repository.searchChatContacts(em, {
      ownProfileId: 'p-propio',
      q: 'María',
      limit: 10,
    });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('NOT EXISTS'),
      [
        'p-propio',
        CONCEPTS.STATE_ACTIVE,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        COMM.PROFILE_TARGET_USER,
        COMM.PROFILE_TARGET_PRACTITIONER,
        expect.stringContaining("'maría':*"),
        '%maria%',
        CONCEPTS.STATE_ACTIVE,
        'p-propio',
        'p-propio',
        10,
      ],
      'all',
    );
    expect(execute.mock.calls[0][0]).toContain(
      'translate(lower(p.display_name)',
    );
    expect(execute.mock.calls[0][0]).toMatch(/to_tsvector\(\s*'simple'/u);
    expect(execute.mock.calls[0][0]).toContain("@@ to_tsquery('simple', ?)");
    expect(execute.mock.calls[0][0]).not.toContain('unaccent');
    expect(find).toHaveBeenCalledWith(
      PublicProfiles,
      { id: { $in: ['p-visible'] } },
      { orderBy: { displayName: 'ASC', id: 'ASC' } },
    );
  });

  it('no hace una segunda consulta si ningún perfil cumple privacidad y bloqueo', async () => {
    const execute = mockFn().mockResolvedValue([]);
    const find = mockFn();
    const em = { find, getConnection: () => ({ execute }) } as any;

    await new PublicProfilesRepository().searchChatContacts(em, {
      ownProfileId: 'p-propio',
      q: 'maria',
      limit: 10,
    });

    expect(find).not.toHaveBeenCalled();
  });
});
