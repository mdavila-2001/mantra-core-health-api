import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunitySocialController } from './community-social.controller';

const actor = { id: 'u1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = {
    createProfile: mockFn(),
    publishPost: mockFn(),
    createComment: mockFn(),
    react: mockFn(),
    bookmark: mockFn(),
    follow: mockFn(),
    block: mockFn(),
    unfollow: mockFn(),
    unbookmark: mockFn(),
    unblock: mockFn(),
  };
  const readService = {
    getProfile: mockFn(),
    listProfilePosts: mockFn(),
    getPost: mockFn(),
    getPostsBatch: mockFn(),
    listPostComments: mockFn(),
    getPostReactions: mockFn(),
    listFollows: mockFn(),
    listBookmarks: mockFn(),
    listBlocks: mockFn(),
  };
  // F4.7 · la respuesta automática. El controlador sólo delega; la regla se
  // prueba en `community-chat-auto-reply.service.spec.ts`.
  const autoReplyService = {
    get: mockFn(),
    upsert: mockFn(),
  };
  return {
    controller: new CommunitySocialController(
      service as any,
      readService as any,
      autoReplyService as any,
    ),
    service,
    readService,
    autoReplyService,
  };
}

describe('CommunitySocialController', () => {
  it('delegates createProfile', async () => {
    const d = build();
    const dto = { tenantId: 't', targetId: 'x', slug: 's', displayName: 'N' };
    await d.controller.createProfile(dto, actor);
    expect(d.service.createProfile).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates publishPost (UC-19-01)', async () => {
    const d = build();
    const dto = { bodyText: 'hi' };
    await d.controller.publishPost('p1', dto, actor);
    expect(d.service.publishPost).toHaveBeenCalledWith('p1', dto, actor);
  });

  it('delegates createComment (UC-19-02)', async () => {
    const d = build();
    const dto = {
      authorProfileId: 'p1',
      commentableType: 'POST',
      commentableRefId: 'r',
      bodyText: 'y',
    };
    await d.controller.createComment(dto as any, actor);
    expect(d.service.createComment).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates react (UC-19-03)', async () => {
    const d = build();
    const dto = {
      actorProfileId: 'p1',
      reactableType: 'POST',
      reactableRefId: 'r',
      reactionType: 'LIKE',
    };
    await d.controller.react(dto as any, actor);
    expect(d.service.react).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates bookmark (UC-19-04)', async () => {
    const d = build();
    const dto = {
      profileId: 'p1',
      bookmarkableType: 'POST',
      bookmarkableRefId: 'r',
    };
    await d.controller.bookmark(dto as any, actor);
    expect(d.service.bookmark).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates follow (UC-19-05)', async () => {
    const d = build();
    const dto = {
      followerProfileId: 'p1',
      followableType: 'PROFILE',
      followableRefId: 'r',
    };
    await d.controller.follow(dto as any, actor);
    expect(d.service.follow).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates block (UC-19-14)', async () => {
    const d = build();
    const dto = { blockerProfileId: 'p1', blockedProfileId: 'p2' };
    await d.controller.block(dto, actor);
    expect(d.service.block).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates unfollow (UC-19-05, cara inversa)', async () => {
    const d = build();
    const query = {
      followerProfileId: 'p1',
      followableType: 'PROFILE',
      followableRefId: 'p2',
    };
    await d.controller.unfollow(query as any, actor);
    expect(d.service.unfollow).toHaveBeenCalledWith(query, actor);
  });

  it('delegates unbookmark (UC-19-04, cara inversa)', async () => {
    const d = build();
    const query = {
      profileId: 'p1',
      bookmarkableType: 'POST',
      bookmarkableRefId: 'post1',
    };
    await d.controller.unbookmark(query as any, actor);
    expect(d.service.unbookmark).toHaveBeenCalledWith(query, actor);
  });

  it('delegates unblock (UC-19-14, cara inversa)', async () => {
    const d = build();
    const query = { blockerProfileId: 'p1', blockedProfileId: 'p2' };
    await d.controller.unblock(query as any, actor);
    expect(d.service.unblock).toHaveBeenCalledWith(query, actor);
  });

  describe('getPosts (TX-27)', () => {
    const uuid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

    it('delega la lectura en lote sin repetidos', () => {
      const d = build();
      const actor = { id: 'u' } as any;
      void d.controller.getPosts(
        `${uuid(1)}, ${uuid(2)},${uuid(1)}`,
        actor,
        'p-1',
      );
      expect(d.readService.getPostsBatch).toHaveBeenCalledWith(
        [uuid(1), uuid(2)],
        actor,
        'p-1',
      );
    });

    it.each([
      ['sin ids', undefined],
      ['vacío', ' , '],
      ['uno que no es uuid', `${uuid(1)},no-es-uuid`],
      [
        'más de 50',
        Array.from(
          { length: 51 },
          (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        ).join(','),
      ],
    ])('400 %s', (_label, ids) => {
      const d = build();
      expect(() => d.controller.getPosts(ids, { id: 'u' } as any)).toThrow(
        'ids debe traer entre 1 y 50 uuid',
      );
      expect(d.readService.getPostsBatch).not.toHaveBeenCalled();
    });
  });
});
