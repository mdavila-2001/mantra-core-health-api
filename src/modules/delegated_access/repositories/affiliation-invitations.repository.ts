import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AFF_INV } from '../../directory/affiliation-invitation.concepts';
import { PRAC } from '../../practice/practice.concepts';
import { PROF } from '../../profiles/profiles.concepts';

/** Raw row of `directory.affiliation_invitations` as the service reads it. */
export interface AffiliationInvitationRow {
  id: string;
  tenant_id: string;
  kind_concept_id: string;
  target_person_id: string | null;
  max_uses: number;
  uses_count: number;
  expires_at: Date;
  status_concept_id: string;
  created_at: Date;
}

export interface NewAffiliationInvitation {
  tenantId: string;
  kindConceptId: string;
  targetPersonId?: string;
  tokenHash: string;
  maxUses: number;
  expiresAt: Date;
  createdByUserId: string;
}

const COLUMNS = `id, tenant_id, kind_concept_id, target_person_id, max_uses,
  uses_count, expires_at, status_concept_id, created_at`;

/** Persistence for affiliation codes (`directory.affiliation_invitations` and `_uses`). */
@Injectable()
export class AffiliationInvitationsRepository {
  async insert(
    em: EntityManager,
    row: NewAffiliationInvitation,
  ): Promise<string> {
    const id = randomUUID();
    const now = new Date();
    await em.execute(
      `INSERT INTO directory.affiliation_invitations
         (id, tenant_id, kind_concept_id, target_person_id, token_hash, max_uses,
          uses_count, expires_at, status_concept_id, created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      [
        id,
        row.tenantId,
        row.kindConceptId,
        row.targetPersonId ?? null,
        row.tokenHash,
        row.maxUses,
        row.expiresAt,
        AFF_INV.STATUS_ACTIVE,
        row.createdByUserId,
        now,
        now,
      ],
    );
    return id;
  }

  listByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<AffiliationInvitationRow[]> {
    return em.execute<AffiliationInvitationRow[]>(
      `SELECT ${COLUMNS} FROM directory.affiliation_invitations
        WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 200`,
      [tenantId],
    );
  }

  /** Lookup by code hash. Runs in system context: the caller does not know the tenant yet. */
  async findByTokenHash(
    em: EntityManager,
    tokenHash: string,
  ): Promise<AffiliationInvitationRow | null> {
    await em.execute("select set_config('app.system_context', 'true', true)");
    const rows = await em.execute<AffiliationInvitationRow[]>(
      `SELECT ${COLUMNS} FROM directory.affiliation_invitations WHERE token_hash = ?`,
      [tokenHash],
    );
    return rows[0] ?? null;
  }

  /** Spends one use only if the code is still active and has quota left. */
  async claimUse(em: EntityManager, id: string): Promise<boolean> {
    const rows = await em.execute<{ id: string }[]>(
      `UPDATE directory.affiliation_invitations
          SET uses_count = uses_count + 1,
              status_concept_id = CASE WHEN uses_count + 1 >= max_uses THEN ? ELSE status_concept_id END,
              updated_at = now()
        WHERE id = ? AND status_concept_id = ? AND uses_count < max_uses AND expires_at > now()
      RETURNING id`,
      [AFF_INV.STATUS_EXHAUSTED, id, AFF_INV.STATUS_ACTIVE],
    );
    return rows.length > 0;
  }

  /** Gives the use back when the affiliation step fails after the claim. */
  async releaseUse(em: EntityManager, id: string): Promise<void> {
    await em.execute("select set_config('app.system_context', 'true', true)");
    await em.execute(
      `UPDATE directory.affiliation_invitations
          SET uses_count = uses_count - 1, status_concept_id = ?, updated_at = now()
        WHERE id = ? AND uses_count > 0 AND status_concept_id <> ?`,
      [AFF_INV.STATUS_ACTIVE, id, AFF_INV.STATUS_REVOKED],
    );
  }

  async recordUse(
    em: EntityManager,
    invitation: Pick<AffiliationInvitationRow, 'id' | 'tenant_id'>,
    userId: string,
    outcomeConceptId: string,
  ): Promise<void> {
    await em.execute(
      `INSERT INTO directory.affiliation_invitation_uses
         (id, tenant_id, affiliation_invitation_id, used_by_user_id, occurred_at, outcome_concept_id)
       VALUES (?, ?, ?, ?, now(), ?)`,
      [
        randomUUID(),
        invitation.tenant_id,
        invitation.id,
        userId,
        outcomeConceptId,
      ],
    );
  }

  /** Person and practitioner profile behind the account (both may be missing). */
  async findPersonOfUser(
    em: EntityManager,
    userId: string,
  ): Promise<{
    personId: string;
    practitionerProfileId: string | null;
  } | null> {
    const rows = await em.execute<
      { person_id: string; profile_id: string | null }[]
    >(
      `SELECT l.person_id, hp.profile_id
         FROM profiles.person_account_links l
         LEFT JOIN profiles.health_practitioner_profiles hp ON hp.profile_id = l.person_id
        WHERE l.user_id = ? AND l.status_concept_id = ?
        ORDER BY hp.profile_id NULLS LAST LIMIT 1`,
      [userId, PROF.ACCOUNT_LINK_ACTIVE],
    );
    const row = rows[0];
    return row
      ? { personId: row.person_id, practitionerProfileId: row.profile_id }
      : null;
  }

  /** First active site of the organization: where a practitioner request lands. */
  async findFirstActiveSite(
    em: EntityManager,
    tenantId: string,
  ): Promise<string | null> {
    const rows = await em.execute<{ id: string }[]>(
      `SELECT ps.id FROM practice.practice_sites ps
         JOIN practice.practices p ON p.id = ps.practice_id
        WHERE (p.tenant_id = ? OR ps.managing_tenant_id = ?) AND ps.status_concept_id = ?
        ORDER BY ps.created_at LIMIT 1`,
      [tenantId, tenantId, PRAC.SITE_ACTIVE],
    );
    return rows[0]?.id ?? null;
  }
}
