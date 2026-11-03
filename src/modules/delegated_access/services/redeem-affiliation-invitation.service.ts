import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  DomainException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { AFF_INV } from '../../directory/affiliation-invitation.concepts';
import { ProfilesPractitionersService } from '../../profiles/application/services/profiles-practitioners.service';
import { ProfilesErrorReason } from '../../profiles/profiles.error-reasons';
import { PROF } from '../../profiles/profiles.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  AffiliationRedeemResultDto,
  RedeemAffiliationInvitationDto,
} from '../dto/affiliation-invitation.dto';
import {
  AffiliationInvitationsRepository,
  type AffiliationInvitationRow,
} from '../repositories/affiliation-invitations.repository';
import { SupportLinksRepository } from '../repositories/support-links.repository';
import {
  hashInvitationCode,
  invitationStatus,
} from './affiliation-invitations.service';
import { SupportStaffService } from './support-staff.service';

type Affiliated = Omit<
  AffiliationRedeemResultDto,
  'tenantId' | 'organizationName'
>;

/** What the claim step hands over to the affiliation step. */
interface Claimed {
  invitation: AffiliationInvitationRow;
  organizationName: string;
  practiceSiteId: string | null;
}

function precondition(
  message: string,
  reason: Reason,
): PreconditionFailedException {
  return new PreconditionFailedException(message, { reason }, reason);
}

/**
 * A person redeems an affiliation code (typed or read from a QR). The redemption never affiliates on
 * its own: it leaves the same pending request the organization already decides elsewhere — a
 * practitioner affiliation on one of its sites, or a support link for the whole organization.
 *
 * Unknown, expired, spent, revoked or someone else's code: same opaque 422, so the answer does not
 * reveal which one it was. Missing practitioner profile or organization site: 422 with a reason the
 * person can act on, and no use is spent.
 */
@Injectable()
export class RedeemAffiliationInvitationService {
  constructor(
    private readonly em: EntityManager,
    private readonly invitations: AffiliationInvitationsRepository,
    private readonly links: SupportLinksRepository,
    private readonly practitioners: ProfilesPractitionersService,
    private readonly support: SupportStaffService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedeemAffiliationInvitationService.name);
  }

  async redeem(
    dto: RedeemAffiliationInvitationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationRedeemResultDto> {
    const claimed = await this.claim(dto.code.replace(/\s+/g, ''), actor.id);
    const { invitation, organizationName } = claimed;
    try {
      const { result, created } = await this.affiliate(claimed, actor);
      // Nothing new was created (the request already existed): the use goes back.
      if (!created)
        await this.em.transactional((tx) =>
          this.invitations.releaseUse(tx, invitation.id),
        );
      this.logger.info(
        {
          operation: 'delegated_access.invitation.redeem',
          invitationId: invitation.id,
          actorId: actor.id,
        },
        'Affiliation invitation redeemed',
      );
      return {
        ...result,
        tenantId: invitation.tenant_id,
        ...(organizationName ? { organizationName } : {}),
      };
    } catch (error) {
      // The use was spent in its own transaction: give it back so the code stays usable.
      await this.em.transactional((tx) =>
        this.invitations.releaseUse(tx, invitation.id),
      );
      throw error;
    }
  }

  /** Validates the code and spends one use, atomically and in system context (tenant unknown yet). */
  private async claim(code: string, userId: string): Promise<Claimed> {
    const outcome = await this.em.transactional(
      async (tx): Promise<Claimed | Reason> => {
        const invitation = await this.invitations.findByTokenHash(
          tx,
          hashInvitationCode(code),
        );
        if (!invitation) return Reason.SUPPORT_INVITATION_INVALID;
        const person = await this.invitations.findPersonOfUser(tx, userId);
        const wrongPerson =
          invitation.target_person_id !== null &&
          invitation.target_person_id !== person?.personId;
        if (invitationStatus(invitation) !== 'ACTIVE' || wrongPerson) {
          await this.invitations.recordUse(
            tx,
            invitation,
            userId,
            AFF_INV.USE_REJECTED,
          );
          return Reason.SUPPORT_INVITATION_INVALID;
        }
        let practiceSiteId: string | null = null;
        if (invitation.kind_concept_id === AFF_INV.KIND_PRACTITIONER) {
          if (!person?.practitionerProfileId)
            return Reason.SUPPORT_PRACTITIONER_PROFILE_REQUIRED;
          practiceSiteId = await this.invitations.findFirstActiveSite(
            tx,
            invitation.tenant_id,
          );
          if (!practiceSiteId)
            return Reason.SUPPORT_AFFILIATION_PRACTICE_MISSING;
        }
        if (!(await this.invitations.claimUse(tx, invitation.id))) {
          await this.invitations.recordUse(
            tx,
            invitation,
            userId,
            AFF_INV.USE_REJECTED,
          );
          return Reason.SUPPORT_INVITATION_INVALID;
        }
        await this.invitations.recordUse(
          tx,
          invitation,
          userId,
          AFF_INV.USE_ACCEPTED,
        );
        const organizationName =
          (await this.links.findOrganizationName(tx, invitation.tenant_id)) ??
          '';
        return { invitation, organizationName, practiceSiteId };
      },
    );
    if (typeof outcome !== 'string') return outcome;
    if (outcome === Reason.SUPPORT_PRACTITIONER_PROFILE_REQUIRED) {
      throw precondition(
        'Para afiliarse como médico, su cuenta necesita un perfil profesional',
        outcome,
      );
    }
    if (outcome === Reason.SUPPORT_AFFILIATION_PRACTICE_MISSING) {
      throw precondition(
        'La organización no tiene una sede activa que reciba la solicitud',
        outcome,
      );
    }
    this.logger.warn(
      { operation: 'delegated_access.invitation.redeem', actorId: userId },
      'Invitation rejected',
    );
    throw precondition(
      'La invitación no es válida',
      Reason.SUPPORT_INVITATION_INVALID,
    );
  }

  /** Leaves the pending request through the existing flows (their own rules and transactions). */
  private async affiliate(
    { invitation, organizationName, practiceSiteId }: Claimed,
    actor: AuthenticatedUser,
  ): Promise<{ result: Affiliated; created: boolean }> {
    if (invitation.kind_concept_id !== AFF_INV.KIND_PRACTITIONER) {
      const links = await this.support.request(
        {
          tenantId: invitation.tenant_id,
          roleTemplateCode: 'SECRETARY',
          items: [{ targetKind: 'ORGANIZATION' }],
        },
        actor,
      );
      return {
        result: {
          kind: 'SUPPORT_STAFF',
          requestId: links.id,
          pendingApproval: true,
        },
        created: true,
      };
    }
    try {
      const affiliation = await this.practitioners.addOwnAffiliation(
        {
          organizationName: organizationName || 'Organización',
          practiceSiteId: practiceSiteId ?? undefined,
          startDate: new Date().toISOString().slice(0, 10),
        },
        actor,
      );
      const pendingApproval = affiliation.statusKind === 'pendiente';
      return {
        result: {
          kind: 'PRACTITIONER',
          roleAssignmentId: affiliation.id,
          pendingApproval,
        },
        created: true,
      };
    } catch (error) {
      // Redeeming twice (or after asking from the profile) is not an error: say how that request stands.
      const status = alreadyRequestedStatus(error);
      if (status === PROF.AFFILIATION_PENDING)
        return {
          result: { kind: 'PRACTITIONER', pendingApproval: true },
          created: false,
        };
      if (
        status === PROF.AFFILIATION_APPROVED ||
        status === PROF.AFFILIATION_ACTIVE
      ) {
        return {
          result: { kind: 'PRACTITIONER', pendingApproval: false },
          created: false,
        };
      }
      throw error;
    }
  }
}

/** Status of the existing request when the practitioner already asked to join that site. */
function alreadyRequestedStatus(error: unknown): unknown {
  if (!(error instanceof DomainException)) return undefined;
  if (error.reason !== ProfilesErrorReason.AFFILIATION_SITE_ALREADY_REQUESTED)
    return undefined;
  return error.details?.['statusConceptId'];
}
