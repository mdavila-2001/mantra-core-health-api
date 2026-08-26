import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityGroupWallService } from './community-group-wall.service';
import { ResourceNotFoundException } from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => ({})),
  };
  const commentsRepo = {
    create: mockFn(),
    findById: mockFn().mockResolvedValue(null),
    listRootsPage: mockFn().mockResolvedValue([]),
    listRepliesOf: mockFn().mockResolvedValue([]),
  };
  const profilesRepo = {
    findById: mockFn().mockResolvedValue({ id: 'p1' }),
  };
  const group = {
    id: 'g1',
    tenantId: 't1',
    postCount: 0,
    updatedAt: new Date(),
  };
  const access = {
    resolve: mockFn().mockResolvedValue({
      group,
      actorProfileId: 'p1',
      membership: null,
      isMember: true,
      canAdminister: false,
      canModerate: false,
      canRead: true,
      canPost: true,
    }),
    assertCanPost: mockFn(),
    assertCanRead: mockFn(),
  };
  const notifications = {
    notifyNewPost: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityGroupWallService(
    em as any,
    commentsRepo as any,
    profilesRepo as any,
    access as any,
    notifications as any,
    logger as any,
  );
  return { service, commentsRepo, profilesRepo, access, group, notifications };
}

/** Una fila de `comments` con lo que la proyección necesita. */
function comment(over: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    authorProfileId: 'p1',
    bodyText: 'hola',
    parentCommentId: null,
    rootCommentId: 'c1',
    threadDepth: 0,
    replyCount: 0,
    createdAt: new Date('2026-08-18T00:00:00.000Z'),
    updatedAt: new Date(),
    commentableTypeConceptId: COMM.CONTENT_TYPE_GROUP,
    commentableRefId: 'g1',
    ...over,
  };
}

describe('CommunityGroupWallService (P7)', () => {
  describe('createPost', () => {
    it('cuelga la publicación del grupo, no de un post', async () => {
      const d = build();
      d.commentsRepo.create.mockReturnValue(comment());

      await d.service.createPost(
        'g1',
        { authorProfileId: 'p1', bodyText: 'hola' },
        actor,
      );

      expect(d.commentsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          commentableTypeConceptId: COMM.CONTENT_TYPE_GROUP,
          commentableRefId: 'g1',
          tenantId: 't1',
        }),
      );
    });

    it('exige ser integrante activo', async () => {
      const d = build();
      d.access.assertCanPost.mockImplementation(() => {
        throw new Error('no sos integrante');
      });

      await expect(
        d.service.createPost(
          'g1',
          { authorProfileId: 'p1', bodyText: 'hola' },
          actor,
        ),
      ).rejects.toThrow('no sos integrante');
      expect(d.commentsRepo.create).not.toHaveBeenCalled();
    });

    it('404 si el autor no tiene perfil público', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.createPost(
          'g1',
          { authorProfileId: 'p-fantasma', bodyText: 'hola' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('una publicación nueva suma al contador del grupo', async () => {
      const d = build();
      d.commentsRepo.create.mockReturnValue(comment());

      await d.service.createPost(
        'g1',
        { authorProfileId: 'p1', bodyText: 'hola' },
        actor,
      );

      expect(d.group.postCount).toBe(1);
      // El aviso sale fuera de la transaccion, ya con la publicacion en el muro.
      expect(d.notifications.notifyNewPost).toHaveBeenCalledWith(
        { id: 'g1', name: undefined, tenantId: 't1' },
        'p1',
        actor,
      );
    });

    it('una respuesta no suma al contador y sí al del hilo', async () => {
      const d = build();
      const parent = comment({ id: 'c-root', replyCount: 2 });
      d.commentsRepo.findById.mockResolvedValue(parent);
      d.commentsRepo.create.mockReturnValue(
        comment({ id: 'c2', parentCommentId: 'c-root', threadDepth: 1 }),
      );

      const res = await d.service.createPost(
        'g1',
        {
          authorProfileId: 'p1',
          bodyText: 'respondo',
          parentCommentId: 'c-root',
        },
        actor,
      );

      expect(res.parentCommentId).toBe('c-root');
      expect(parent.replyCount).toBe(3);
      // Doce publicaciones en la tarjeta tienen que ser doce hilos.
      expect(d.group.postCount).toBe(0);
      // Un hilo animado no le manda una notificacion por mensaje al grupo.
      expect(d.notifications.notifyNewPost).not.toHaveBeenCalled();
    });

    it('rechaza responder a un hilo de otro grupo', async () => {
      const d = build();
      d.commentsRepo.findById.mockResolvedValue(
        comment({ id: 'c-ajeno', commentableRefId: 'g-otro' }),
      );

      await expect(
        d.service.createPost(
          'g1',
          {
            authorProfileId: 'p1',
            bodyText: 'me cuelgo',
            parentCommentId: 'c-ajeno',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza responder a un comentario que no es de un muro de grupo', async () => {
      const d = build();
      d.commentsRepo.findById.mockResolvedValue(
        comment({
          id: 'c-post',
          commentableTypeConceptId: COMM.CONTENT_TYPE_POST,
        }),
      );

      await expect(
        d.service.createPost(
          'g1',
          {
            authorProfileId: 'p1',
            bodyText: 'me cuelgo',
            parentCommentId: 'c-post',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('listWall', () => {
    it('exige poder leer el interior del grupo', async () => {
      const d = build();
      d.access.assertCanRead.mockImplementation(() => {
        throw new Error('grupo privado');
      });

      await expect(
        d.service.listWall('g1', actor, { limit: 50 }),
      ).rejects.toThrow('grupo privado');
    });

    it('anida las respuestas bajo su publicación', async () => {
      const d = build();
      d.commentsRepo.listRootsPage.mockResolvedValue([
        comment({ id: 'c1' }),
        comment({ id: 'c2' }),
      ]);
      d.commentsRepo.listRepliesOf.mockResolvedValue([
        comment({ id: 'r1', parentCommentId: 'c1', rootCommentId: 'c1' }),
        comment({ id: 'r2', parentCommentId: 'c1', rootCommentId: 'c1' }),
      ]);

      const page = await d.service.listWall('g1', actor, { limit: 50 });

      expect(page.count).toBe(2);
      expect(page.items[0].replies.map((r) => r.id)).toEqual(['r1', 'r2']);
      expect(page.items[1].replies).toEqual([]);
      expect(page.nextCursor).toBeNull();
    });

    it('devuelve cursor cuando hay más de una página', async () => {
      const d = build();
      d.commentsRepo.listRootsPage.mockResolvedValue([
        comment({ id: 'c1' }),
        comment({ id: 'c2' }),
      ]);

      const page = await d.service.listWall('g1', actor, { limit: 1 });

      expect(page.count).toBe(1);
      expect(page.nextCursor).not.toBeNull();
    });

    it('lee el muro del grupo y no el de otro contenido', async () => {
      const d = build();

      await d.service.listWall('g1', actor, { limit: 50 });

      expect(d.commentsRepo.listRootsPage).toHaveBeenCalledWith(
        expect.anything(),
        COMM.CONTENT_TYPE_GROUP,
        'g1',
        undefined,
        51,
      );
    });
  });
});
