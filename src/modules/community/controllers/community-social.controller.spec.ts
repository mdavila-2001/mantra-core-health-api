import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunitySocialController } from './community-social.controller';

const actor = { id: 'u1', roles: [] } as any;

function build() {
  const service = {
    createProfile: mockFn(),
    publishPost: mockFn(),
    createComment: mockFn(),
    react: mockFn(),
    bookmark: mockFn(),
    follow: mockFn(),
    block: mockFn(),
  };
  return { controller: new CommunitySocialController(service as any), service };
}

describe('CommunitySocialController', () => {
  it('delegates createProfile', async () => {
    const d = build();
    const dto = { tenantId: 't', targetId: 'x', slug: 's', displayName: 'N' };
    await d.controller.createProfile(dto as any, actor);
    expect(d.service.createProfile).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates publishPost (UC-19-01)', async () => {
    const d = build();
    const dto = { bodyText: 'hi' };
    await d.controller.publishPost('p1', dto as any, actor);
    expect(d.service.publishPost).toHaveBeenCalledWith('p1', dto, actor);
  });

  it('delegates createComment (UC-19-02)', async () => {
    const d = build();
    const dto = { authorProfileId: 'p1', commentableType: 'POST', commentableRefId: 'r', bodyText: 'y' };
    await d.controller.createComment(dto as any, actor);
    expect(d.service.createComment).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates react (UC-19-03)', async () => {
    const d = build();
    const dto = { actorProfileId: 'p1', reactableType: 'POST', reactableRefId: 'r', reactionType: 'LIKE' };
    await d.controller.react(dto as any, actor);
    expect(d.service.react).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates bookmark (UC-19-04)', async () => {
    const d = build();
    const dto = { profileId: 'p1', bookmarkableType: 'POST', bookmarkableRefId: 'r' };
    await d.controller.bookmark(dto as any, actor);
    expect(d.service.bookmark).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates follow (UC-19-05)', async () => {
    const d = build();
    const dto = { followerProfileId: 'p1', followableType: 'PROFILE', followableRefId: 'r' };
    await d.controller.follow(dto as any, actor);
    expect(d.service.follow).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates block (UC-19-14)', async () => {
    const d = build();
    const dto = { blockerProfileId: 'p1', blockedProfileId: 'p2' };
    await d.controller.block(dto as any, actor);
    expect(d.service.block).toHaveBeenCalledWith(dto, actor);
  });
});
