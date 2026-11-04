import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { DIR, TENANT_ROLE_CONCEPT_BY_CODE } from '../directory.concepts';
import { TenantMemberships, Tenants } from '../entities';
import type {
  InvitedRoleCode,
  MembershipInvitationDecisionDto,
  MembershipInvitationListDto,
} from '../dto/membership-invitation.dto';

const ROLE_CODE_BY_CONCEPT = new Map<string, InvitedRoleCode>(
  Object.entries(TENANT_ROLE_CONCEPT_BY_CODE).map(([code, conceptId]) => [
    conceptId,
    code as InvitedRoleCode,
  ]),
);

/**
 * The caller's own organization invitations: `tenant_memberships` rows in
 * `DIR.MEMBERSHIP_INVITED`. Accepting makes the row `MEMBERSHIP_ACTIVE`;
 * declining ends it (`MEMBERSHIP_ENDED`), the same terminal state offboarding
 * uses.
 *
 * Support-staff memberships (`DIR.ROLE_SUPPORT`) are left out: they open and
 * close with their support links (`delegated_access`), and accepting the bare
 * membership would open the tenant without any link behind it.
 *
 * The routes are tenant-agnostic (someone with only invitations belongs to no
 * tenant yet), so each operation runs in the RLS system context, always
 * filtered by the caller's own `user_id`.
 */
@Injectable()
export class MembershipInvitationsService {
  constructor(private readonly em: EntityManager) {}

  list(actor: AuthenticatedUser): Promise<MembershipInvitationListDto> {
    return this.inSystemContext(async (tx) => {
      const rows = await tx.find(
        TenantMemberships,
        {
          userId: actor.id,
          statusConceptId: DIR.MEMBERSHIP_INVITED,
          tenantRoleConceptId: { $ne: DIR.ROLE_SUPPORT },
        },
        { orderBy: { createdAt: 'DESC' } },
      );
      const tenantIds = [...new Set(rows.map((row) => row.tenantId))];
      const tenants =
        tenantIds.length === 0
          ? []
          : await tx.find(Tenants, { id: { $in: tenantIds } });
      const names = new Map(
        tenants.map((t) => [t.id, t.tradeName || t.legalName || t.code]),
      );
      return {
        items: rows.map((row) => ({
          id: row.id,
          tenantId: row.tenantId,
          tenantName: names.get(row.tenantId) ?? '',
          role: ROLE_CODE_BY_CONCEPT.get(row.tenantRoleConceptId) ?? 'OTHER',
          invitedAt: row.createdAt.toISOString(),
        })),
      };
    });
  }

  accept(
    membershipId: string,
    actor: AuthenticatedUser,
  ): Promise<MembershipInvitationDecisionDto> {
    return this.inSystemContext(async (tx) => {
      const membership = await this.requireOwnPending(tx, membershipId, actor);
      const active = await tx.findOne(TenantMemberships, {
        userId: actor.id,
        tenantId: membership.tenantId,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      });
      if (active) {
        throw new ConflictException(
          'Ya es miembro activo de esta organización',
          { membershipId },
        );
      }
      membership.statusConceptId = DIR.MEMBERSHIP_ACTIVE;
      membership.startDate = new Date();
      touch(membership, actor.id);
      await tx.flush();
      return {
        id: membership.id,
        tenantId: membership.tenantId,
        status: 'ACTIVE',
      };
    });
  }

  decline(
    membershipId: string,
    actor: AuthenticatedUser,
  ): Promise<MembershipInvitationDecisionDto> {
    return this.inSystemContext(async (tx) => {
      const membership = await this.requireOwnPending(tx, membershipId, actor);
      membership.statusConceptId = DIR.MEMBERSHIP_ENDED;
      membership.endDate = new Date();
      touch(membership, actor.id);
      await tx.flush();
      return {
        id: membership.id,
        tenantId: membership.tenantId,
        status: 'DECLINED',
      };
    });
  }

  /**
   * Someone else's membership reads exactly like a missing one (404); the
   * caller's own one that is no longer pending is a 409.
   */
  private async requireOwnPending(
    tx: EntityManager,
    membershipId: string,
    actor: AuthenticatedUser,
  ): Promise<TenantMemberships> {
    const membership = await tx.findOne(TenantMemberships, {
      id: membershipId,
      userId: actor.id,
      tenantRoleConceptId: { $ne: DIR.ROLE_SUPPORT },
    });
    if (!membership) {
      throw new ResourceNotFoundException('Invitación no encontrada', {
        membershipId,
      });
    }
    if (membership.statusConceptId !== DIR.MEMBERSHIP_INVITED) {
      throw new ConflictException('La invitación ya no está pendiente', {
        membershipId,
      });
    }
    return membership;
  }

  private inSystemContext<T>(
    work: (tx: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.em.fork().transactional(async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      return work(tx);
    });
  }
}
