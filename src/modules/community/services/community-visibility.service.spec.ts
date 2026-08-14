import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { CommunityVisibilityService } from './community-visibility.service';
import { COMM } from '../community.concepts';
import { CONCEPTS } from '../../../common';

const em = {} as any;
const patient = { id: 'user-1', roles: ['USER'] } as any;
const platform = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const profilesRepo = {
    findById: mockFn(),
    findByTarget: mockFn().mockResolvedValue(null),
  };
  const followsRepo = {
    findByFollowerTarget: mockFn(),
    listFollowedProfileIds: mockFn().mockResolvedValue([]),
  };
  const blocksRepo = {
    existsBetween: mockFn().mockResolvedValue(null),
    listBlockedPeers: mockFn().mockResolvedValue([]),
  };
  const service = new CommunityVisibilityService(
    profilesRepo as any,
    followsRepo as any,
    blocksRepo as any,
  );
  return { service, profilesRepo, followsRepo, blocksRepo };
}

describe('CommunityVisibilityService', () => {
  describe('assertOwnProfile', () => {
    it('acepta el perfil cuyo target_id es el actor', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        targetId: 'user-1',
        createdByUserId: 'otro',
      });
      await expect(
        d.service.assertOwnProfile(em, 'profile-1', patient),
      ).resolves.toBeUndefined();
    });

    it('acepta el perfil que el propio actor creó', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        targetId: 'otra-persona',
        createdByUserId: 'user-1',
      });
      await expect(
        d.service.assertOwnProfile(em, 'profile-1', patient),
      ).resolves.toBeUndefined();
    });

    it('rechaza el perfil ajeno', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        targetId: 'otra-persona',
        createdByUserId: 'otro-admin',
      });
      await expect(
        d.service.assertOwnProfile(em, 'profile-1', patient),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza un perfil inexistente sin revelar que no existe', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.assertOwnProfile(em, 'profile-x', patient),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deja pasar a plataforma sin consultar el perfil', async () => {
      const d = build();
      await expect(
        d.service.assertOwnProfile(em, 'profile-ajeno', platform),
      ).resolves.toBeUndefined();
      expect(d.profilesRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('resolveActorProfileId', () => {
    it('sin perfil pedido, resuelve el propio del actor', async () => {
      const d = build();
      d.profilesRepo.findByTarget.mockResolvedValue({ id: 'p-propio' });

      await expect(
        d.service.resolveActorProfileId(em, patient),
      ).resolves.toBe('p-propio');
    });

    it('un actor sin perfil público lee sin perfil, no falla', async () => {
      const d = build();
      d.profilesRepo.findByTarget.mockResolvedValue(null);

      await expect(
        d.service.resolveActorProfileId(em, patient),
      ).resolves.toBeUndefined();
    });

    it('acepta el perfil pedido cuando es del actor', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        id: 'p-1',
        targetId: 'user-1',
      });

      await expect(
        d.service.resolveActorProfileId(em, patient, 'p-1'),
      ).resolves.toBe('p-1');
    });

    // La regresión que motivó el método: `canViewPost` concede la lectura de
    // entrada cuando el lector es el autor, así que declarar el perfil del
    // autor en `?actorProfileId=` entregaba sus publicaciones PRIVATE a
    // cualquier sesión. El perfil ajeno tiene que rebotar antes de llegar ahí.
    it('rechaza el perfil ajeno que el cliente declaró como suyo', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        id: 'p-autor',
        targetId: 'otro-usuario',
      });

      await expect(
        d.service.resolveActorProfileId(em, patient, 'p-autor'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('plataforma puede mirar con cualquier perfil, es su trabajo', async () => {
      const d = build();

      await expect(
        d.service.resolveActorProfileId(em, platform, 'p-ajeno'),
      ).resolves.toBe('p-ajeno');
      expect(d.profilesRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('canViewPost', () => {
    it('el autor ve su propio post aunque sea privado', async () => {
      const d = build();
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_PRIVATE,
        },
        'p-1',
      );
      expect(visible).toBe(true);
    });

    it('un post sin visibilidad declarada se lee como público', async () => {
      const d = build();
      const visible = await d.service.canViewPost(
        em,
        { authorPublicProfileId: 'p-1', visibilityConceptId: undefined },
        'p-2',
      );
      expect(visible).toBe(true);
    });

    it('el bloqueo corta la lectura en cualquier sentido', async () => {
      const d = build();
      d.blocksRepo.existsBetween.mockResolvedValue({ id: 'block-1' });
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_PUBLIC,
        },
        'p-2',
      );
      expect(visible).toBe(false);
    });

    it('FOLLOWERS exige un follow activo', async () => {
      const d = build();
      d.followsRepo.findByFollowerTarget.mockResolvedValue({
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_FOLLOWERS,
        },
        'p-2',
      );
      expect(visible).toBe(true);
    });

    it('FOLLOWERS con un follow no activo no alcanza', async () => {
      const d = build();
      d.followsRepo.findByFollowerTarget.mockResolvedValue({
        statusConceptId: 'otro-estado',
      });
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_FOLLOWERS,
        },
        'p-2',
      );
      expect(visible).toBe(false);
    });

    it('PRIVATE no lo ve nadie más que el autor', async () => {
      const d = build();
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_PRIVATE,
        },
        'p-2',
      );
      expect(visible).toBe(false);
    });

    it('sin perfil lector, FOLLOWERS queda fuera', async () => {
      const d = build();
      const visible = await d.service.canViewPost(em, {
        authorPublicProfileId: 'p-1',
        visibilityConceptId: COMM.POST_VISIBILITY_FOLLOWERS,
      });
      expect(visible).toBe(false);
    });
  });

  describe('filterVisiblePosts', () => {
    const posts = [
      {
        id: 'a',
        authorPublicProfileId: 'p-1',
        visibilityConceptId: COMM.POST_VISIBILITY_PUBLIC,
      },
      {
        id: 'b',
        authorPublicProfileId: 'p-3',
        visibilityConceptId: COMM.POST_VISIBILITY_FOLLOWERS,
      },
      {
        id: 'c',
        authorPublicProfileId: 'p-4',
        visibilityConceptId: COMM.POST_VISIBILITY_PRIVATE,
      },
      {
        id: 'd',
        authorPublicProfileId: 'p-5',
        visibilityConceptId: COMM.POST_VISIBILITY_PUBLIC,
      },
    ] as any[];

    it('resuelve bloqueos y follows de la página en dos consultas', async () => {
      const d = build();
      d.blocksRepo.listBlockedPeers.mockResolvedValue(['p-5']);
      d.followsRepo.listFollowedProfileIds.mockResolvedValue(['p-3']);

      const visible = await d.service.filterVisiblePosts(em, posts, 'p-2');

      expect(visible.map((p: any) => p.id)).toEqual(['a', 'b']);
      expect(d.blocksRepo.listBlockedPeers).toHaveBeenCalledTimes(1);
      expect(d.followsRepo.listFollowedProfileIds).toHaveBeenCalledTimes(1);
    });

    it('sin lector deja sólo lo público', async () => {
      const d = build();
      const visible = await d.service.filterVisiblePosts(em, posts, undefined);
      expect(visible.map((p: any) => p.id)).toEqual(['a', 'd']);
    });

    it('una página vacía no consulta nada', async () => {
      const d = build();
      const visible = await d.service.filterVisiblePosts(em, [], 'p-2');
      expect(visible).toEqual([]);
      expect(d.blocksRepo.listBlockedPeers).not.toHaveBeenCalled();
    });
  });
});
