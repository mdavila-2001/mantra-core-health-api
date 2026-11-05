import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import 'reflect-metadata';
import { RequestMethod } from '@nestjs/common';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AUDITED_KEY } from '../../../common/audit-trail/audit-trail.decorators';
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
    listAttendableOrganizationShowcases: mockFn(),
    getProfile: mockFn(),
    listProfilePosts: mockFn(),
    getPost: mockFn(),
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

  describe('GET profiles/organization-showcases/me', () => {
    it('delega en la lectura con la sesión, sin parámetros del cliente', async () => {
      const d = build();
      const page = { items: [] };
      d.readService.listAttendableOrganizationShowcases.mockResolvedValue(page);
      await expect(
        d.controller.listOwnOrganizationShowcases(actor),
      ).resolves.toBe(page);
      expect(
        d.readService.listAttendableOrganizationShowcases,
      ).toHaveBeenCalledWith(actor);
    });

    it('se declara antes que by-slug y que toda ruta profiles/:profileId (el router prueba en orden)', () => {
      const proto = CommunitySocialController.prototype as any;
      const getPaths = Object.getOwnPropertyNames(proto)
        .filter(
          (name) =>
            name !== 'constructor' &&
            Reflect.getMetadata('method', proto[name]) === RequestMethod.GET,
        )
        .map((name) => Reflect.getMetadata('path', proto[name]) as string);
      const own = getPaths.indexOf('profiles/organization-showcases/me');
      expect(own).toBeGreaterThanOrEqual(0);
      const generic = getPaths.findIndex(
        (path) =>
          path.startsWith('profiles/:profileId') ||
          path === 'profiles/by-slug/:slug',
      );
      expect(own).toBeLessThan(generic);
    });

    it('es un GET sin @Roles ni @Audited', () => {
      const handler = Object.getOwnPropertyDescriptor(
        CommunitySocialController.prototype,
        'listOwnOrganizationShowcases',
      )?.value as object;
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
      expect(Reflect.getMetadata(AUDITED_KEY, handler)).toBeUndefined();
    });
  });
});
