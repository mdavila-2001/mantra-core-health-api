import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunitySocialReadService } from './community-social-read.service';
import { ResourceNotFoundException } from '../../../common';
import { COMM } from '../community.concepts';
import { CONCEPTS } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { CommunityOrganizationStaffService } from './community-organization-staff.service';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => ({})) };
  const profilesRepo = {
    findById: mockFn(),
    listBadgesBySubject: mockFn().mockResolvedValue([]),
    listByTargetsTypesAndStatus: mockFn().mockResolvedValue([]),
  };
  const postsRepo = {
    findById: mockFn(),
    listByAuthorPage: mockFn().mockResolvedValue([]),
    listMedia: mockFn().mockResolvedValue([]),
    listHashtags: mockFn().mockResolvedValue([]),
    listMentions: mockFn().mockResolvedValue([]),
  };
  const commentsRepo = {
    listRootsPage: mockFn().mockResolvedValue([]),
    listRepliesOf: mockFn().mockResolvedValue([]),
    listMediaForComments: mockFn().mockResolvedValue([]),
    findById: mockFn(),
    findMediaByFileId: mockFn(),
  };
  const reactionsRepo = {
    summarizeByTarget: mockFn().mockResolvedValue([]),
    findByActorTarget: mockFn().mockResolvedValue(null),
  };
  const bookmarksRepo = { listByProfilePage: mockFn().mockResolvedValue([]) };
  const followsRepo = { listByFollowerPage: mockFn().mockResolvedValue([]) };
  const blocksRepo = { listByBlocker: mockFn().mockResolvedValue([]) };
  const prestigeRepo = { findScoreByProfile: mockFn().mockResolvedValue(null) };
  const visibility = {
    canViewPost: mockFn().mockResolvedValue(true),
    filterVisiblePosts: mockFn((_em: any, posts: any[]) =>
      Promise.resolve(posts),
    ),
    assertOwnProfile: mockFn().mockResolvedValue(undefined),
    isBlockedBetween: mockFn().mockResolvedValue(false),
    // El doble devuelve lo pedido, como haría el real tras comprobar que es
    // suyo; los casos de perfil ajeno se prueban haciéndolo rechazar.
    resolveActorProfileId: mockFn((_em: any, _actor: any, order?: string) =>
      Promise.resolve(order),
    ),
  };
  // El doble devuelve un mapa vacío: el recuento en sí se prueba en
  // `community-engagement.service.spec.ts`, con los repositorios reales de por
  // medio. Acá interesa que la lectura lo pida y con qué.
  const engagement = { ofPosts: mockFn().mockResolvedValue(new Map()) };
  // FND-01: sirve los bytes recién después de que este servicio autorizó
  // verlos; el propio doble no vuelve a decidir nada.
  const files = { downloadPublicMedia: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // El servicio real: la regla de quién atiende una vitrina es la que se
  // prueba, no un doble que la repita. Sólo las membresías son dobles.
  const membershipsRepo = { findActiveByUser: mockFn().mockResolvedValue([]) };
  const organizationStaff = new CommunityOrganizationStaffService(
    membershipsRepo as any,
  );

  const service = new CommunitySocialReadService(
    em as any,
    profilesRepo as any,
    postsRepo as any,
    commentsRepo as any,
    reactionsRepo as any,
    bookmarksRepo as any,
    followsRepo as any,
    blocksRepo as any,
    prestigeRepo as any,
    visibility as any,
    engagement as any,
    files as any,
    logger as any,
    organizationStaff,
  );
  return {
    service,
    membershipsRepo,
    engagement,
    profilesRepo,
    postsRepo,
    commentsRepo,
    reactionsRepo,
    bookmarksRepo,
    followsRepo,
    blocksRepo,
    prestigeRepo,
    visibility,
    files,
  };
}

const profile = {
  id: 'p-1',
  tenantId: 't-1',
  targetTypeConceptId: 'tt',
  slug: 'dra-quispe',
  displayName: 'Dra. Quispe',
  statusConceptId: 'st',
};

const post = {
  id: 'post-1',
  authorPublicProfileId: 'p-1',
  postTypeConceptId: 'tipo',
  bodyText: 'hola',
  publishedAt: new Date('2026-08-01T10:00:00Z'),
  createdAt: new Date('2026-08-01T10:00:00Z'),
};

describe('CommunitySocialReadService', () => {
  describe('getProfile', () => {
    it('devuelve la ficha con sellos y prestigio', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(profile);
      d.profilesRepo.listBadgesBySubject.mockResolvedValue([
        {
          id: 'b-1',
          badgeTypeConceptId: 'bt',
          verificationMethodConceptId: 'vm',
        },
      ]);
      d.prestigeRepo.findScoreByProfile.mockResolvedValue({
        totalPoints: '120',
      });

      const res = await d.service.getProfile('p-1', actor);

      expect(res.slug).toBe('dra-quispe');
      expect(res.badges).toHaveLength(1);
      expect(res.prestige?.totalPoints).toBe('120');
    });

    it('dice la vertical en claro, para que el cliente sepa a qué URL lleva', async () => {
      // El cliente no tiene la tabla de terminología: sin este campo tendría
      // que adivinar el prefijo público (`/p`, `/o`, `/f`, `/l`, `/s`) a partir
      // de un uuid, o no ofrecer el enlace nunca.
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        ...profile,
        targetTypeConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
      });
      d.profilesRepo.listBadgesBySubject.mockResolvedValue([]);
      d.prestigeRepo.findScoreByProfile.mockResolvedValue(null);

      const res = await d.service.getProfile('p-1', actor);

      expect(res.kind).toBe('PRACTITIONER');
      // Y el concepto sigue viajando: el campo nuevo no reemplaza nada.
      expect(res.targetTypeConceptId).toBe(COMM.PROFILE_TARGET_PRACTITIONER);
    });

    it('el perfil de un paciente no declara vertical: no tiene ficha pública', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        ...profile,
        targetTypeConceptId: COMM.PROFILE_TARGET_USER,
      });
      d.profilesRepo.listBadgesBySubject.mockResolvedValue([]);
      d.prestigeRepo.findScoreByProfile.mockResolvedValue(null);

      const res = await d.service.getProfile('p-1', actor);

      expect(res.kind).toBeNull();
    });

    it('404 si el perfil no existe', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);
      await expect(d.service.getProfile('p-x', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('listProfilePosts', () => {
    it('pide una fila de más y devuelve cursor cuando hay siguiente', async () => {
      const d = build();
      d.postsRepo.listByAuthorPage.mockResolvedValue([
        post,
        { ...post, id: 'post-2' },
      ]);

      const res = await d.service.listProfilePosts('p-1', actor, { limit: 1 });

      expect(d.postsRepo.listByAuthorPage).toHaveBeenCalledWith(
        expect.anything(),
        'p-1',
        COMM.PUBLICATION_PUBLISHED,
        undefined,
        2,
      );
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).not.toBeNull();
    });

    it('sin página siguiente el cursor es null', async () => {
      const d = build();
      d.postsRepo.listByAuthorPage.mockResolvedValue([post]);

      const res = await d.service.listProfilePosts('p-1', actor, { limit: 10 });

      expect(res.nextCursor).toBeNull();
      expect(res.count).toBe(1);
    });

    it('el filtro de visibilidad quita los posts que el lector no puede ver', async () => {
      const d = build();
      d.postsRepo.listByAuthorPage.mockResolvedValue([post]);
      d.visibility.filterVisiblePosts.mockResolvedValue([]);

      const res = await d.service.listProfilePosts('p-1', actor, {
        actorProfileId: 'p-2',
        limit: 10,
      });

      expect(res.items).toEqual([]);
      expect(res.count).toBe(0);
    });
  });

  describe('getPost', () => {
    it('devuelve el detalle con media, hashtags y menciones', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);
      d.postsRepo.listHashtags.mockResolvedValue([{ id: 'h-1', tag: 'salud' }]);

      const res = await d.service.getPost('post-1', actor, 'p-1');

      expect(res.id).toBe('post-1');
      expect(res.hashtags).toEqual([{ id: 'h-1', tag: 'salud' }]);
    });

    it('404 —y no 403— cuando el post existe pero no es visible', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);
      d.visibility.canViewPost.mockResolvedValue(false);

      await expect(
        d.service.getPost('post-1', actor, 'p-9'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('listPostComments', () => {
    it('anida las respuestas bajo su comentario raíz', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);
      d.commentsRepo.listRootsPage.mockResolvedValue([
        {
          id: 'c-1',
          authorProfileId: 'p-2',
          bodyText: 'raíz',
          createdAt: new Date(),
        },
      ]);
      d.commentsRepo.listRepliesOf.mockResolvedValue([
        {
          id: 'c-2',
          authorProfileId: 'p-3',
          bodyText: 'respuesta',
          parentCommentId: 'c-1',
          createdAt: new Date(),
        },
      ]);

      const res = await d.service.listPostComments('post-1', actor, {
        limit: 10,
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].replies).toHaveLength(1);
      expect(res.items[0].replies[0].id).toBe('c-2');
    });
  });

  describe('getCommentMedia', () => {
    const attachment = { id: 'cm-1', commentId: 'c-1', fileId: 'f-1' };
    const comment = {
      id: 'c-1',
      commentableTypeConceptId: COMM.CONTENT_TYPE_POST,
      commentableRefId: 'post-1',
    };

    it('sirve los bytes cuando el post del comentario es visible para el lector', async () => {
      const d = build();
      d.commentsRepo.findMediaByFileId.mockResolvedValue(attachment);
      d.commentsRepo.findById.mockResolvedValue(comment);
      d.postsRepo.findById.mockResolvedValue(post);
      d.files.downloadPublicMedia.mockResolvedValue({
        buffer: Buffer.from('img'),
        mimeType: 'image/png',
      });

      const res = await d.service.getCommentMedia('f-1', actor, 'p-2');

      // Lo que decide es la visibilidad del post, no quién subió el archivo
      // (FND-01): sólo entonces se pide el contenido, y por el mismo camino
      // que ya usa la superficie pública.
      expect(d.visibility.canViewPost).toHaveBeenCalled();
      expect(d.files.downloadPublicMedia).toHaveBeenCalledWith('f-1');
      expect(res.mimeType).toBe('image/png');
    });

    it('404 cuando el fileId no es un adjunto de comentario', async () => {
      const d = build();
      d.commentsRepo.findMediaByFileId.mockResolvedValue(null);

      await expect(
        d.service.getCommentMedia('f-ajeno', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.files.downloadPublicMedia).not.toHaveBeenCalled();
    });

    it('404 —y no 403— cuando el adjunto existe pero el post ya no es visible', async () => {
      const d = build();
      d.commentsRepo.findMediaByFileId.mockResolvedValue(attachment);
      d.commentsRepo.findById.mockResolvedValue(comment);
      d.postsRepo.findById.mockResolvedValue(post);
      d.visibility.canViewPost.mockResolvedValue(false);

      await expect(
        d.service.getCommentMedia('f-1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.files.downloadPublicMedia).not.toHaveBeenCalled();
    });
  });

  describe('getPostReactions', () => {
    it('suma el total y marca la reacción del actor', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);
      d.reactionsRepo.summarizeByTarget.mockResolvedValue([
        { reactionTypeConceptId: 'like', count: 3 },
        { reactionTypeConceptId: 'love', count: 2 },
      ]);
      d.reactionsRepo.findByActorTarget.mockResolvedValue({
        reactionTypeConceptId: 'like',
      });

      const res = await d.service.getPostReactions('post-1', actor, 'p-2');

      expect(res.total).toBe(5);
      expect(res.actorReactionTypeConceptId).toBe('like');
    });

    it('sin actor no informa reacción propia', async () => {
      const d = build();
      d.postsRepo.findById.mockResolvedValue(post);

      const res = await d.service.getPostReactions('post-1', actor);

      expect(res.actorReactionTypeConceptId).toBeUndefined();
      expect(d.reactionsRepo.findByActorTarget).not.toHaveBeenCalled();
    });
  });

  describe('lecturas privadas', () => {
    it('los marcadores exigen ser el titular del perfil', async () => {
      const d = build();
      await d.service.listBookmarks('p-1', actor, { limit: 10 });
      expect(d.visibility.assertOwnProfile).toHaveBeenCalledWith(
        expect.anything(),
        'p-1',
        actor,
      );
    });

    it('los bloqueos exigen ser el titular del perfil', async () => {
      const d = build();
      await d.service.listBlocks('p-1', actor, { limit: 10 });
      expect(d.visibility.assertOwnProfile).toHaveBeenCalledWith(
        expect.anything(),
        'p-1',
        actor,
      );
    });

    it('si no es el titular, la excepción del guardia sube tal cual', async () => {
      const d = build();
      d.visibility.assertOwnProfile.mockRejectedValue(new Error('prohibido'));
      await expect(
        d.service.listBookmarks('p-ajeno', actor, { limit: 10 }),
      ).rejects.toThrow('prohibido');
      expect(d.bookmarksRepo.listByProfilePage).not.toHaveBeenCalled();
    });
  });

  describe('listAttendableOrganizationShowcases', () => {
    const staff = { id: 'staff-1', roles: ['USER', 'PHARMACY_STAFF'] } as any;
    const membership = (tenantId: string, role: string) => ({
      tenantId,
      tenantRoleConceptId: role,
    });
    const showcase = (id: string, type = COMM.PROFILE_TARGET_PHARMACY) => ({
      id,
      tenantId: 't-plataforma',
      targetId: `tenant-${id}`,
      targetTypeConceptId: type,
      slug: `farmacia-${id}`,
      displayName: `Farmacia ${id}`,
      avatarFileId: undefined,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });

    it('busca las vitrinas activas de los tenants donde atiende, en dos consultas', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        membership('tenant-a', DIR.ROLE_STAFF),
        membership('tenant-b', DIR.ROLE_OWNER),
        membership('tenant-b', DIR.ROLE_ADMIN),
      ]);
      d.profilesRepo.listByTargetsTypesAndStatus.mockResolvedValue([
        showcase('a'),
        showcase('b', COMM.PROFILE_TARGET_ORGANIZATION),
      ]);

      const result = await d.service.listAttendableOrganizationShowcases(staff);

      expect(d.membershipsRepo.findActiveByUser).toHaveBeenCalledTimes(1);
      expect(d.membershipsRepo.findActiveByUser).toHaveBeenCalledWith(
        expect.anything(),
        'staff-1',
        DIR.MEMBERSHIP_ACTIVE,
      );
      expect(d.profilesRepo.listByTargetsTypesAndStatus).toHaveBeenCalledTimes(
        1,
      );
      expect(d.profilesRepo.listByTargetsTypesAndStatus).toHaveBeenCalledWith(
        expect.anything(),
        {
          targetIds: ['tenant-a', 'tenant-b'],
          targetTypeConceptIds: [
            COMM.PROFILE_TARGET_ORGANIZATION,
            COMM.PROFILE_TARGET_PHARMACY,
          ],
          statusConceptId: CONCEPTS.STATE_ACTIVE,
        },
      );
      expect(result).toEqual({
        items: [
          {
            profileId: 'a',
            slug: 'farmacia-a',
            displayName: 'Farmacia a',
            avatarFileId: null,
            targetTypeConceptId: COMM.PROFILE_TARGET_PHARMACY,
            kind: 'PHARMACY',
          },
          {
            profileId: 'b',
            slug: 'farmacia-b',
            displayName: 'Farmacia b',
            avatarFileId: null,
            targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
            kind: 'ORGANIZATION',
          },
        ],
      });
    });

    it('el vínculo de profesional (PRACTITIONER) no atiende la bandeja', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        membership('tenant-clinica', DIR.ROLE_PRACTITIONER),
        membership('tenant-a', DIR.ROLE_STAFF),
      ]);
      await d.service.listAttendableOrganizationShowcases(staff);
      expect(
        d.profilesRepo.listByTargetsTypesAndStatus.mock.calls[0][1].targetIds,
      ).toEqual(['tenant-a']);
    });

    it('sin PHARMACY_STAFF no se ofrecen vitrinas de farmacia, sólo de organización', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        membership('tenant-a', DIR.ROLE_ADMIN),
      ]);
      await d.service.listAttendableOrganizationShowcases({
        id: 'admin-1',
        roles: ['USER'],
      } as any);
      expect(
        d.profilesRepo.listByTargetsTypesAndStatus.mock.calls[0][1]
          .targetTypeConceptIds,
      ).toEqual([COMM.PROFILE_TARGET_ORGANIZATION]);
    });

    it('sin membresías que atiendan, lista vacía', async () => {
      const d = build();
      const result = await d.service.listAttendableOrganizationShowcases(staff);
      expect(result).toEqual({ items: [] });
    });
  });
});
