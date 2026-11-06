import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import {
  ACCESS_SCOPE_CONCEPT_BY_CODE,
  DIR,
  TENANT_ROLE_CONCEPT_BY_CODE,
} from '../directory.concepts';
import { TenantMembershipsRepository } from '../repositories';
import type { TenantMemberships } from '../entities';
import type { CreateMembershipDto } from '../dto';
import { TenantAdministrationService } from './tenant-administration.service';

/** How a membership is created: pending by default, active only if trusted. */
export interface MembershipInviteOptions {
  /** Fixed membership id. Only internal processes (seeds) pass it. */
  membershipId?: string;
  /**
   * Skips the invitation and creates the membership already `ACTIVE`. Only
   * trusted internal callers (seeds, provisioning) may set it: the public
   * endpoint never does, so a person is only added by accepting.
   */
  activate?: boolean;
}

/**
 * UC-04-05: adds a user to a tenant.
 *
 * By default the membership is created `MEMBERSHIP_INVITED`: it grants nothing
 * (no token claim, no guard, no authorization lookup treats it as active) until
 * the invitee accepts it from `GET /tenants/me/membership-invitations`
 * (`MembershipInvitationsService`). Re-inviting someone who already has a
 * pending invitation is a 409 carrying the pending membership id, and
 * inviting someone who is already active is a 409 as well.
 */
@Injectable()
export class MembershipInviteService {
  constructor(
    private readonly em: EntityManager,
    private readonly membershipsRepo: TenantMembershipsRepository,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MembershipInviteService.name);
  }

  /**
   * @param tenantId - Organization the user joins.
   * @param dto - User, role and scope.
   * @param actor - Who invites; must administer the organization.
   * @param options - Internal-only switches, see {@link MembershipInviteOptions}.
   * @returns The created membership (`INVITED`, or `ACTIVE` with `activate`).
   */
  async invite(
    tenantId: string,
    dto: CreateMembershipDto,
    actor: AuthenticatedUser,
    options: MembershipInviteOptions = {},
  ): Promise<TenantMemberships> {
    const activate = options.activate === true;
    this.logger.info(
      {
        operation: 'directory.membership.invite',
        tenantId,
        actorId: actor.id,
        activate,
      },
      'Inviting member',
    );
    return this.em.transactional(async (tx) => {
      // Whoever is OWNER/ADMIN of the organization (or the platform) manages
      // its people; granting OWNER changes who owns it, so only an OWNER or the
      // platform may do that.
      await this.tenantAdmin.assertCanAdminister(tx, tenantId, actor);
      if (dto.role === 'OWNER') {
        await this.tenantAdmin.assertCanChangeOwnership(tx, tenantId, actor);
      }
      const active = await this.membershipsRepo.findActiveByUserTenant(
        tx,
        dto.userId,
        tenantId,
        DIR.MEMBERSHIP_ACTIVE,
      );
      if (active) {
        throw new ConflictException(
          'El usuario ya tiene una membresía activa en el tenant',
          { tenantId, userId: dto.userId },
        );
      }
      const pending = activate
        ? null
        : await this.membershipsRepo.findPendingInvitationByUserTenant(
            tx,
            dto.userId,
            tenantId,
          );
      if (pending) {
        throw new ConflictException(
          'El usuario ya tiene una invitación pendiente en el tenant',
          { tenantId, userId: dto.userId, membershipId: pending.id },
        );
      }

      const membership = this.membershipsRepo.create(tx, {
        id: options.membershipId,
        userId: dto.userId,
        tenantId,
        tenantRoleConceptId: TENANT_ROLE_CONCEPT_BY_CODE[dto.role ?? 'STAFF'],
        statusConceptId: activate
          ? DIR.MEMBERSHIP_ACTIVE
          : DIR.MEMBERSHIP_INVITED,
        accessScopeConceptId:
          ACCESS_SCOPE_CONCEPT_BY_CODE[dto.accessScope ?? 'ALL_TENANT'],
        primaryBranchId: dto.primaryBranchId,
        // Re-stamped with the acceptance date when the invitee accepts.
        startDate: new Date(),
        invitedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'directory.membership.invite',
          membershipId: membership.id,
          status: activate ? 'ACTIVE' : 'INVITED',
        },
        'Member invited',
      );
      return membership;
    });
  }
}
