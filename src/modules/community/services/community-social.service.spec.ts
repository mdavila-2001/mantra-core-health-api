import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunitySocialService } from './community-social.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const profilesRepo = {
    findById: mockFn(),
    findByTenant: mockFn(() => Promise.resolve([])),
    findByTarget: mockFn(() => Promise.resolve(null)),
    create: mockFn(),
  };
  const postsRepo = {
    findByAuthor: mockFn(() => Promise.resolve([])),
    create: mockFn(),
    createMedia: mockFn(),
    upsertHashtag: mockFn(),
    linkHashtag: mockFn(),
    createMention: mockFn(),
  };
  const commentsRepo = { findById: mockFn(), create: mockFn() };
  const reactionsRepo = { findByActorTarget: mockFn(), create: mockFn() };
  const bookmarksRepo = { findByProfileTarget: mockFn(), create: mockFn() };
  const followsRepo = {
    findByFollowerTarget: mockFn(),
    findMutualBetween: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const blocksRepo = { findByPair: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new CommunitySocialService(
    em as any,
    profilesRepo as any,
    postsRepo as any,
    commentsRepo as any,
    reactionsRepo as any,
    bookmarksRepo as any,
    followsRepo as any,
    blocksRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    profilesRepo,
    postsRepo,
    commentsRepo,
    reactionsRepo,
    bookmarksRepo,
    followsRepo,
    blocksRepo,
  };
}

describe('CommunitySocialService', () => {
  describe('createProfile', () => {
    it('creates the public profile and returns its id/slug', async () => {
      const d = build();
      d.profilesRepo.create.mockReturnValue({
        id: 'p1',
        slug: 's',
        displayName: 'N',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const res = await d.service.createProfile(
        { tenantId: 't', targetId: 'u', slug: 's', displayName: 'N' },
        actor,
      );
      expect(res).toEqual({
        id: 'p1',
        slug: 's',
        displayName: 'N',
        status: CONCEPTS.STATE_ACTIVE,
      });
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('publishPost (UC-19-01)', () => {
    it('throws when the author profile does not exist', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishPost('missing', { bodyText: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('flushes the post before children and links hashtags', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        id: 'p1',
        commentsDefaultEnabled: true,
      });
      d.postsRepo.create.mockReturnValue({
        id: 'post1',
        authorPublicProfileId: 'p1',
        publicationStatusConceptId: 'pub',
        publishedAt: new Date(),
      });
      d.postsRepo.upsertHashtag.mockResolvedValue({ id: 'h1' });
      const res = await d.service.publishPost(
        'p1',
        {
          bodyText: 'hi',
          hashtags: ['salud'],
          media: [{ fileId: 'f1' }],
          mentions: [{ mentionedProfileId: 'm1' }],
        },
        actor,
      );
      expect(res.id).toBe('post1');
      expect(res.hashtagCount).toBe(1);
      expect(res.mediaCount).toBe(1);
      expect(d.postsRepo.linkHashtag).toHaveBeenCalledWith(
        d.tx,
        'h1',
        'post1',
        expect.any(String),
        actor.id,
      );
      expect(d.postsRepo.createMention).toHaveBeenCalled();
    });
  });

  describe('createComment (UC-19-02)', () => {
    it('computes thread depth and increments the parent reply count', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({ id: 'p1' });
      const parent = {
        id: 'c0',
        rootCommentId: null,
        threadDepth: 0,
        replyCount: 2,
        updatedAt: new Date(),
      };
      d.commentsRepo.findById.mockResolvedValue(parent);
      d.commentsRepo.create.mockReturnValue({ id: 'c1' });
      const res = await d.service.createComment(
        {
          authorProfileId: 'p1',
          commentableType: 'POST',
          commentableRefId: 'post1',
          parentCommentId: 'c0',
          bodyText: 'hi',
        } as any,
        actor,
      );
      expect(res.threadDepth).toBe(1);
      expect(res.rootCommentId).toBe('c0');
      expect(parent.replyCount).toBe(3);
    });

    it('throws when the author profile does not exist', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createComment(
          {
            authorProfileId: 'x',
            commentableType: 'POST',
            commentableRefId: 'r',
            bodyText: 'y',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('react (UC-19-03)', () => {
    it('updates the existing reaction type (created=false)', async () => {
      const d = build();
      d.reactionsRepo.findByActorTarget.mockResolvedValue({
        id: 'r1',
        reactionTypeConceptId: 'old',
        updatedAt: new Date(),
      });
      const res = await d.service.react(
        {
          actorProfileId: 'p1',
          reactableType: 'POST',
          reactableRefId: 'post1',
          reactionType: 'LOVE',
        } as any,
        actor,
      );
      expect(res).toEqual({ id: 'r1', created: false, reactionType: 'LOVE' });
      expect(d.reactionsRepo.create).not.toHaveBeenCalled();
    });

    it('creates a new reaction when none exists (created=true)', async () => {
      const d = build();
      d.reactionsRepo.findByActorTarget.mockResolvedValue(null);
      d.reactionsRepo.create.mockReturnValue({ id: 'r2' });
      const res = await d.service.react(
        {
          actorProfileId: 'p1',
          reactableType: 'POST',
          reactableRefId: 'post1',
          reactionType: 'LIKE',
        } as any,
        actor,
      );
      expect(res).toEqual({ id: 'r2', created: true, reactionType: 'LIKE' });
    });
  });

  describe('bookmark (UC-19-04)', () => {
    it('rejects duplicate bookmarks', async () => {
      const d = build();
      d.bookmarksRepo.findByProfileTarget.mockResolvedValue({ id: 'b1' });
      await expect(
        d.service.bookmark(
          {
            profileId: 'p1',
            bookmarkableType: 'POST',
            bookmarkableRefId: 'post1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('follow (UC-19-05)', () => {
    it('rejects self-follow', async () => {
      const d = build();
      await expect(
        d.service.follow(
          {
            followerProfileId: 'p1',
            followableType: 'PROFILE',
            followableRefId: 'p1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an already active follow (conflict)', async () => {
      const d = build();
      d.followsRepo.findByFollowerTarget.mockResolvedValue({
        id: 'f1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      await expect(
        d.service.follow(
          {
            followerProfileId: 'p1',
            followableType: 'PROFILE',
            followableRefId: 'p2',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('block (UC-19-14)', () => {
    it('rejects blocking oneself', async () => {
      const d = build();
      await expect(
        d.service.block(
          { blockerProfileId: 'p1', blockedProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates the block and prunes mutual follows', async () => {
      const d = build();
      d.blocksRepo.findByPair.mockResolvedValue(null);
      d.blocksRepo.create.mockReturnValue({ id: 'blk1' });
      const follow = {
        id: 'f1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      d.followsRepo.findMutualBetween.mockResolvedValue([follow]);
      const res = await d.service.block(
        {
          blockerProfileId: 'p1',
          blockedProfileId: 'p2',
          reason: 'SPAM',
        } as any,
        actor,
      );
      expect(res).toEqual({ id: 'blk1' });
      expect(follow.statusConceptId).not.toBe(CONCEPTS.STATE_ACTIVE);
    });
  });
});
