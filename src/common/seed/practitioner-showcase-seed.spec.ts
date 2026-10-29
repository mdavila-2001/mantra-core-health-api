import { describe, it, expect, jest } from '@jest/globals';
import { PractitionerShowcaseSeed } from './practitioner-showcase-seed';
import { SEED } from '../constants/concepts';

function build(existing: unknown = null) {
  const em = { findOne: jest.fn(() => Promise.resolve(existing)) };
  const orm = { em: { fork: () => em } };
  const social = {
    upsertOwnProfile: jest.fn((..._args: unknown[]) => Promise.resolve({})),
  };
  const seed = new PractitionerShowcaseSeed(orm as never, social as never);
  return { seed, social };
}

const input = {
  userId: 'user-1',
  practitionerProfileId: 'profile-1',
  displayName: 'Xiomara Cuéllar Justiniano',
  email: 'xiomara.cuellar@alovida.test',
  headline: 'Cirujano odontólogo',
};

describe('PractitionerShowcaseSeed', () => {
  it('crea la vitrina pública con la identidad del profesional, sin iniciar sesión', async () => {
    const { seed, social } = build();

    const created = await seed.ensure(input);

    expect(created).toBe(true);
    const [dto, actor] = social.upsertOwnProfile.mock.calls[0] as any[];
    expect(actor).toEqual({
      id: 'user-1',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'profile-1',
    });
    expect(dto.tenantId).toBe(SEED.tenantId);
    expect(dto.visibility).toBe('PUBLIC');
    expect(dto.headline).toBe('Cirujano odontólogo');
    expect(dto.biography).toContain('No fue verificada por el profesional');
  });

  it('el enlace público es legible y determinista', async () => {
    const first = build();
    const second = build();

    await first.seed.ensure(input);
    await second.seed.ensure(input);

    const slug = (first.social.upsertOwnProfile.mock.calls[0] as any[])[0].slug;
    expect(slug).toMatch(/^xiomara-cuellar-justiniano-[0-9a-f]{6}$/);
    expect(
      (second.social.upsertOwnProfile.mock.calls[0] as any[])[0].slug,
    ).toBe(slug);
  });

  it('si ya tiene vitrina no la toca', async () => {
    const { seed, social } = build({ id: 'ya-existe' });

    const created = await seed.ensure(input);

    expect(created).toBe(false);
    expect(social.upsertOwnProfile).not.toHaveBeenCalled();
  });

  it('un nombre sin letras usa un enlace genérico que sigue siendo válido', async () => {
    const { seed, social } = build();

    await seed.ensure({ ...input, displayName: '???' });

    expect((social.upsertOwnProfile.mock.calls[0] as any[])[0].slug).toMatch(
      /^profesional-[0-9a-f]{6}$/,
    );
  });
});
