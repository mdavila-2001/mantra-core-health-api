import 'reflect-metadata';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { CommunityGroupsController } from './community-groups.controller';
import { CommunityMessagingController } from './community-messaging.controller';
import { CommunityModerationController } from './community-moderation.controller';
import { CommunityPollsController } from './community-polls.controller';
import { CommunityReviewsController } from './community-reviews.controller';
import { CommunitySocialController } from './community-social.controller';
import { CommunityTimelineController } from './community-timeline.controller';
import { CommunityTopicsController } from './community-topics.controller';

/**
 * O3-3: estas rutas no piden un rol global porque el servicio decide por
 * titularidad del perfil, participación o membresía en el grupo.
 * Lo declaran con `@Roles()` vacío para que la decisión quede escrita y el
 * informe de cobertura no las cuente como huérfanas. Si una pierde el
 * decorador —o alguien le pone un rol global sin revisar a quién deja
 * afuera—, esta prueba lo marca.
 */
const DECLARED: ReadonlyArray<readonly [object, readonly string[]]> = [
  [
    CommunityGroupsController,
    [
      'createGroup',
      'joinGroup',
      'updateMember',
      'leaveGroup',
      'createGroupPost',
      'listGroups',
      'getGroup',
      'listMembers',
      'listWall',
    ],
  ],
  [
    CommunityMessagingController,
    [
      'createConversation',
      'sendMessage',
      'editMessage',
      'deleteMessage',
      'markRead',
      'updateParticipant',
      'pinMessage',
      'unpinMessage',
      'searchContacts',
      'getAttachmentContent',
      'listConversations',
      'listMessages',
      'conversationPresence',
    ],
  ],
  [CommunityModerationController, ['report', 'appeal']],
  [CommunityPollsController, ['createPoll', 'vote', 'getPoll']],
  [
    CommunityReviewsController,
    ['publishReview', 'listProfileReviews', 'respondToReview'],
  ],
  [
    CommunitySocialController,
    [
      'upsertOwnProfile',
      'publishPost',
      'createComment',
      'react',
      'bookmark',
      'follow',
      'block',
      'unfollow',
      'unbookmark',
      'unblock',
      'getAutoReply',
      'upsertAutoReply',
      'getProfile',
      'listProfilePosts',
      'getPost',
      'listPostComments',
      'getCommentMediaContent',
      'getPostReactions',
      'listFollows',
      'listBookmarks',
      'listBlocks',
    ],
  ],
  [CommunityTimelineController, ['getFeed', 'listNotifications']],
  [CommunityTopicsController, ['listTopics']],
];

describe('community: autorización declarada en las rutas sin rol global', () => {
  it.each(
    DECLARED.map(([ctrl, handlers]) => [
      (ctrl as { name: string }).name,
      ctrl,
      handlers,
    ]),
  )('%s declara `@Roles()` vacío', (_name, ctrl, handlers) => {
    const proto = (ctrl as { prototype: Record<string, object> }).prototype;
    for (const handler of handlers as string[]) {
      expect(typeof proto[handler]).toBe('function');
      expect([handler, Reflect.getMetadata(ROLES_KEY, proto[handler])]).toEqual(
        [handler, []],
      );
    }
  });
});
