import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Concepts for `directory.affiliation_invitations` and its uses: who the code
 * invites, its lifecycle and the outcome of each redemption attempt.
 */
export const { seeds: AFFILIATION_INVITATION_CONCEPT_SEEDS, ids: AFF_INV } =
  defineModuleConcepts('directory', {
    KIND_PRACTITIONER: {
      code: 'DIR_AFFIL_INVITE_KIND_PRACTITIONER',
      display: 'Affiliation invitation for practitioners',
    },
    KIND_SUPPORT_STAFF: {
      code: 'DIR_AFFIL_INVITE_KIND_SUPPORT_STAFF',
      display: 'Affiliation invitation for support staff',
    },
    STATUS_ACTIVE: {
      code: 'DIR_AFFIL_INVITE_ACTIVE',
      display: 'Affiliation invitation active',
    },
    STATUS_EXHAUSTED: {
      code: 'DIR_AFFIL_INVITE_EXHAUSTED',
      display: 'Affiliation invitation with all its uses spent',
    },
    STATUS_REVOKED: {
      code: 'DIR_AFFIL_INVITE_REVOKED',
      display: 'Affiliation invitation revoked',
    },
    USE_ACCEPTED: {
      code: 'DIR_AFFIL_USE_ACCEPTED',
      display: 'Affiliation invitation redeemed',
    },
    USE_REJECTED: {
      code: 'DIR_AFFIL_USE_REJECTED',
      display: 'Affiliation invitation redemption rejected',
    },
  });
