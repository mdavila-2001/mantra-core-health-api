import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/** An FAQ entry row, as the queries project it. */
export interface FaqEntryRow {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  position: number;
  isPublished: boolean;
  updatedAt: Date;
}

/** Fields an FAQ PATCH may change; `undefined` keeps the stored value. */
export interface FaqEntryPatch {
  question?: string;
  answer?: string;
  category?: string | null;
  isPublished?: boolean;
}

const COLUMNS = `id, question, answer, category, position,
       is_published AS "isPublished", updated_at AS "updatedAt"`;

/**
 * Raw SQL over `forms.faq_entries`. Every owner-side statement filters by
 * `owner_practitioner_id`, so another practitioner's entry reads as missing.
 */
@Injectable()
export class FaqEntriesRepository {
  /** The owner's entries in display order. */
  listOwned(em: EntityManager, ownerId: string): Promise<FaqEntryRow[]> {
    return em.execute(
      `SELECT ${COLUMNS} FROM forms.faq_entries
        WHERE owner_practitioner_id = ?
        ORDER BY position, id`,
      [ownerId],
      'all',
    );
  }

  /** One entry of the owner, or `null`. */
  async findOwned(
    em: EntityManager,
    id: string,
    ownerId: string,
  ): Promise<FaqEntryRow | null> {
    const rows: FaqEntryRow[] = await em.execute(
      `SELECT ${COLUMNS} FROM forms.faq_entries
        WHERE id = ? AND owner_practitioner_id = ?`,
      [id, ownerId],
      'all',
    );
    return rows[0] ?? null;
  }

  /**
   * Inserts an entry after the owner's last one. A transaction-scoped advisory
   * lock per owner serialises concurrent inserts: `FOR UPDATE` alone locks
   * nothing while the owner has no rows yet, and two first inserts would read
   * the same maximum position.
   */
  async insertLast(
    em: EntityManager,
    ownerId: string,
    data: Required<FaqEntryPatch>,
    actorUserId: string,
  ): Promise<string> {
    await em.execute('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [
      `forms.faq_entries:${ownerId}`,
    ]);
    const id = randomUUID();
    await em.execute(
      `INSERT INTO forms.faq_entries
         (id, owner_practitioner_id, question, answer, category, position,
          is_published, created_at, updated_at, created_by_user_id,
          updated_by_user_id, row_version)
       SELECT ?, ?, ?, ?, ?, COALESCE(MAX(position), 0) + 1, ?, now(), now(),
              ?, ?, 1
         FROM forms.faq_entries WHERE owner_practitioner_id = ?`,
      [
        id,
        ownerId,
        data.question,
        data.answer,
        data.category,
        data.isPublished,
        actorUserId,
        actorUserId,
        ownerId,
      ],
    );
    return id;
  }

  /** Applies the patch to an owned entry; returns whether a row matched. */
  async updateOwned(
    em: EntityManager,
    id: string,
    ownerId: string,
    patch: FaqEntryPatch,
    actorUserId: string,
  ): Promise<boolean> {
    const sets: string[] = [
      'updated_at = now()',
      'updated_by_user_id = ?',
      'row_version = row_version + 1',
    ];
    const values: unknown[] = [actorUserId];
    const columns: [keyof FaqEntryPatch, string][] = [
      ['question', 'question'],
      ['answer', 'answer'],
      ['category', 'category'],
      ['isPublished', 'is_published'],
    ];
    for (const [key, column] of columns) {
      if (patch[key] === undefined) continue;
      sets.push(`${column} = ?`);
      values.push(patch[key]);
    }
    const result: { affectedRows: number } = await em.execute(
      `UPDATE forms.faq_entries SET ${sets.join(', ')}
        WHERE id = ? AND owner_practitioner_id = ?`,
      [...values, id, ownerId],
      'run',
    );
    return result.affectedRows > 0;
  }

  /** Deletes an owned entry; returns whether a row matched. */
  async deleteOwned(
    em: EntityManager,
    id: string,
    ownerId: string,
  ): Promise<boolean> {
    const result: { affectedRows: number } = await em.execute(
      'DELETE FROM forms.faq_entries WHERE id = ? AND owner_practitioner_id = ?',
      [id, ownerId],
      'run',
    );
    return result.affectedRows > 0;
  }

  /**
   * The owner's ids, locked for a reorder. Takes the same per-owner advisory
   * lock as `insertLast`, so an insert cannot slip in between the check and
   * the update.
   */
  async lockOwnedIds(em: EntityManager, ownerId: string): Promise<string[]> {
    await em.execute('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [
      `forms.faq_entries:${ownerId}`,
    ]);
    const rows: { id: string }[] = await em.execute(
      'SELECT id FROM forms.faq_entries WHERE owner_practitioner_id = ? FOR UPDATE',
      [ownerId],
      'all',
    );
    return rows.map((row) => row.id);
  }

  /**
   * Sets each entry's position to its index in `ids` plus one. A single
   * statement: `uq_faq_entries_owner_position` is DEFERRABLE INITIALLY
   * IMMEDIATE, so it is checked at the end of the statement and swapped
   * positions do not collide midway.
   */
  async applyOrder(
    em: EntityManager,
    ownerId: string,
    ids: readonly string[],
    actorUserId: string,
  ): Promise<void> {
    await em.execute(
      `UPDATE forms.faq_entries f
          SET position = o.ord, updated_at = now(), updated_by_user_id = ?,
              row_version = f.row_version + 1
         FROM unnest(?::uuid[]) WITH ORDINALITY AS o(id, ord)
        WHERE f.id = o.id AND f.owner_practitioner_id = ?
          AND f.position IS DISTINCT FROM o.ord`,
      [actorUserId, `{${ids.join(',')}}`, ownerId],
    );
  }

  /**
   * Published entries of the practitioner behind a visible public profile
   * slug, or `null` when the slug is not a visible practitioner profile.
   */
  async listPublishedBySlug(
    em: EntityManager,
    slug: string,
    practitionerTargetConceptId: string,
    visibilityConceptId: string,
    activeStateConceptId: string,
  ): Promise<FaqEntryRow[] | null> {
    const profiles: { targetId: string }[] = await em.execute(
      `SELECT target_id AS "targetId" FROM community.public_profiles
        WHERE slug = ? AND target_type_concept_id = ?
          AND visibility_concept_id = ? AND status_concept_id = ?
        LIMIT 1`,
      [
        slug,
        practitionerTargetConceptId,
        visibilityConceptId,
        activeStateConceptId,
      ],
      'all',
    );
    const profile = profiles[0];
    if (!profile) return null;
    return em.execute<FaqEntryRow[]>(
      `SELECT ${COLUMNS} FROM forms.faq_entries
        WHERE owner_practitioner_id = ? AND is_published = true
        ORDER BY position, id`,
      [profile.targetId],
      'all',
    );
  }
}
