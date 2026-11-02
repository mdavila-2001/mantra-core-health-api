import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { CONCEPTS, deterministicId, SEED } from '../constants/concepts';
import { createdBy } from '../persistence/audit-fields';
import { DIR } from '../../modules/directory/directory.concepts';
import { TenantMemberships } from '../../modules/directory/entities';
import { UserGlobalRoles } from '../../modules/iam/entities';
import {
  ROLE_CONCEPT_BY_CODE,
  type RoleCode,
} from '../../modules/iam/domain/role-mapping';
import { SEED_ACTOR_ID, ensureSeedActor } from './seed-actor';

/** Personal roles granting individual personal space memberships. */
export const PERSONAL_SPACE_ROLE_CODES: readonly RoleCode[] = [
  'PATIENT',
  'PRACTITIONER',
  'CLINICIAN',
  'SUPPORT_STAFF',
];

/** Execution metrics for personal space memberships seed. */
export interface PersonalSpaceMembershipsResult {
  /** Newly provisioned personal space memberships. */
  created: number;
  /** Users that already possess a tenant membership. */
  alreadyMember: number;
  /** Users with both personal and global admin roles requiring manual review. */
  needsReview: number;
  /** Failed operations with error messages. */
  failed: string[];
}

/** Deterministic personal space membership UUID for a user. */
export function personalSpaceMembershipId(userId: string): string {
  return deterministicId(`seed:membership:personal-space:${userId}`);
}

/**
 * Assigns default personal space memberships to individual accounts without existing memberships.
 * Prevents 403 TENANT_REQUIRED errors on personal user interactions.
 */
@Injectable()
export class PersonalSpaceMembershipsSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PersonalSpaceMembershipsSeedService.name);
  }

  /** Runs the idempotent personal space membership assignment. */
  async run(): Promise<PersonalSpaceMembershipsResult> {
    const result: PersonalSpaceMembershipsResult = {
      created: 0,
      alreadyMember: 0,
      needsReview: 0,
      failed: [],
    };

    const em = this.orm.em.fork();
    await ensureSeedActor(em);

    const personal = new Set<string>(
      PERSONAL_SPACE_ROLE_CODES.map((code) => ROLE_CONCEPT_BY_CODE[code]),
    );
    const rolesByUser = await this.activeGlobalRoleConceptsByUser(em);

    const eligible: string[] = [];
    for (const [userId, concepts] of rolesByUser) {
      const hasPersonal = concepts.some((c) => personal.has(c));
      if (!hasPersonal) continue;
      const onlyPersonal = concepts.every((c) => personal.has(c));
      if (!onlyPersonal) {
        result.needsReview++;
        continue;
      }
      eligible.push(userId);
    }

    const withAnyMembership = await this.usersWithAnyMembership(em, eligible);
    for (const userId of eligible) {
      if (withAnyMembership.has(userId)) {
        result.alreadyMember++;
        continue;
      }
      try {
        em.create(
          TenantMemberships,
          {
            id: personalSpaceMembershipId(userId),
            userId,
            tenantId: SEED.tenantId,
            tenantRoleConceptId: DIR.ROLE_STAFF,
            statusConceptId: DIR.MEMBERSHIP_ACTIVE,
            accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
            startDate: new Date(),
            ...createdBy(SEED_ACTOR_ID),
          },
          { partial: true },
        );
        await em.flush();
        result.created++;
      } catch (error) {
        em.clear();
        const message = error instanceof Error ? error.message : String(error);
        result.failed.push(`${userId}: ${message}`);
        this.logger.error(
          { operation: 'seed.personal-space-memberships', userId, err: error },
          'Failed to assign personal space membership',
        );
      }
    }

    this.logger.info(
      {
        operation: 'seed.personal-space-memberships',
        created: result.created,
        alreadyMember: result.alreadyMember,
        needsReview: result.needsReview,
        failed: result.failed.length,
      },
      'Personal space memberships seeded',
    );
    return result;
  }

  /** Maps active global role concepts grouped by user UUID. */
  private async activeGlobalRoleConceptsByUser(
    em: EntityManager,
  ): Promise<Map<string, string[]>> {
    const rows = await em.find(UserGlobalRoles, {
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const byUser = new Map<string, string[]>();
    for (const row of rows) {
      const list = byUser.get(row.userId) ?? [];
      list.push(row.roleConceptId);
      byUser.set(row.userId, list);
    }
    return byUser;
  }

  /** Finds which users already have an existing membership in any tenant or status. */
  private async usersWithAnyMembership(
    em: EntityManager,
    userIds: string[],
  ): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();
    const rows = await em.find(
      TenantMemberships,
      { userId: { $in: userIds } },
      { fields: ['userId'] },
    );
    return new Set(rows.map((row) => row.userId));
  }
}
