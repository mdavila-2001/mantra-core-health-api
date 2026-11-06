import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/** A script header row, as the queries project it. */
export interface QuestionScriptRow {
  id: string;
  title: string;
  description: string | null;
  specialtyCode: string | null;
  status: string;
  version: number;
  updatedAt: Date;
}

/** A script row in the owner's list, with its question count. */
export interface QuestionScriptSummaryRow extends Omit<
  QuestionScriptRow,
  'version'
> {
  itemCount: number;
}

/** A question row of a script. */
export interface QuestionScriptItemRow {
  id: string;
  position: number;
  questionText: string;
  helpText: string | null;
  answerType: string;
  options: string[] | null;
  required: boolean;
}

/** A question to store; its position is its index in the list plus one. */
export interface QuestionScriptItemData {
  questionText: string;
  helpText?: string | null;
  answerType: string;
  options?: string[] | null;
  required: boolean;
}

/** Header fields a PATCH may change; `undefined` keeps the stored value. */
export interface QuestionScriptHeaderPatch {
  title?: string;
  description?: string | null;
  specialtyCode?: string | null;
}

const HEADER_COLUMNS = `s.id, s.title, s.description,
       s.specialty_code AS "specialtyCode", s.status,
       s.row_version AS version,
       s.updated_at AS "updatedAt"`;

/**
 * Raw SQL over `forms.question_scripts` and `forms.question_script_items`.
 * Every read and write filters by `owner_practitioner_id`: a row of another
 * practitioner is indistinguishable from a missing one.
 */
@Injectable()
export class QuestionScriptsRepository {
  /** The owner's active scripts, most recently edited first. */
  listActive(
    em: EntityManager,
    ownerId: string,
  ): Promise<QuestionScriptSummaryRow[]> {
    return em.execute(
      `SELECT s.id, s.title, s.description,
              s.specialty_code AS "specialtyCode", s.status,
              s.updated_at AS "updatedAt",
              (SELECT count(*)::int FROM forms.question_script_items i
                WHERE i.script_id = s.id) AS "itemCount"
         FROM forms.question_scripts s
        WHERE s.owner_practitioner_id = ? AND s.status = 'active'
        ORDER BY s.updated_at DESC, s.id`,
      [ownerId],
      'all',
    );
  }

  /** One active script of the owner, optionally locked for an update. */
  async findActiveOwned(
    em: EntityManager,
    id: string,
    ownerId: string,
    forUpdate = false,
  ): Promise<QuestionScriptRow | null> {
    const rows: QuestionScriptRow[] = await em.execute(
      `SELECT ${HEADER_COLUMNS}
         FROM forms.question_scripts s
        WHERE s.id = ? AND s.owner_practitioner_id = ? AND s.status = 'active'
        ${forUpdate ? 'FOR UPDATE' : ''}`,
      [id, ownerId],
      'all',
    );
    return rows[0] ?? null;
  }

  /** The questions of a script, in order. */
  listItems(
    em: EntityManager,
    scriptId: string,
  ): Promise<QuestionScriptItemRow[]> {
    return em.execute(
      `SELECT id, position, question_text AS "questionText",
              help_text AS "helpText", answer_type AS "answerType",
              options, required
         FROM forms.question_script_items
        WHERE script_id = ?
        ORDER BY position`,
      [scriptId],
      'all',
    );
  }

  /** Inserts a new active script at version 1 and returns its id. */
  async insertScript(
    em: EntityManager,
    ownerId: string,
    header: Required<QuestionScriptHeaderPatch>,
    actorUserId: string,
  ): Promise<string> {
    const id = randomUUID();
    await em.execute(
      `INSERT INTO forms.question_scripts
         (id, owner_practitioner_id, title, description, specialty_code,
          status, created_at, updated_at, created_by_user_id,
          updated_by_user_id, row_version)
       VALUES (?, ?, ?, ?, ?, 'active', now(), now(), ?, ?, 1)`,
      [
        id,
        ownerId,
        header.title,
        header.description,
        header.specialtyCode,
        actorUserId,
        actorUserId,
      ],
    );
    return id;
  }

  /** Applies the header patch and bumps `row_version` and `updated_at`. */
  async touchScript(
    em: EntityManager,
    id: string,
    patch: QuestionScriptHeaderPatch,
    actorUserId: string,
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    const columns: [keyof QuestionScriptHeaderPatch, string][] = [
      ['title', 'title'],
      ['description', 'description'],
      ['specialtyCode', 'specialty_code'],
    ];
    for (const [key, column] of columns) {
      if (patch[key] === undefined) continue;
      sets.push(`${column} = ?`);
      values.push(patch[key]);
    }
    await em.execute(
      `UPDATE forms.question_scripts
          SET ${[...sets, 'row_version = row_version + 1', 'updated_at = now()', 'updated_by_user_id = ?'].join(', ')}
        WHERE id = ?`,
      [...values, actorUserId, id],
    );
  }

  /** Replaces every question of a script with `items`, in the order given. */
  async replaceItems(
    em: EntityManager,
    scriptId: string,
    items: readonly QuestionScriptItemData[],
    actorUserId: string,
  ): Promise<void> {
    await em.execute(
      'DELETE FROM forms.question_script_items WHERE script_id = ?',
      [scriptId],
    );
    if (items.length === 0) return;
    const values = items.flatMap((item, index) => [
      randomUUID(),
      scriptId,
      index + 1,
      item.questionText,
      item.helpText ?? null,
      item.answerType,
      item.options == null ? null : JSON.stringify(item.options),
      item.required,
      actorUserId,
      actorUserId,
    ]);
    await em.execute(
      `INSERT INTO forms.question_script_items
         (id, script_id, position, question_text, help_text, answer_type,
          options, required, created_by_user_id, updated_by_user_id)
       VALUES ${items.map(() => '(?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?)').join(', ')}`,
      values,
    );
  }

  /** Archives a script (soft delete) and bumps its `row_version`. */
  async archive(
    em: EntityManager,
    id: string,
    actorUserId: string,
  ): Promise<void> {
    await em.execute(
      `UPDATE forms.question_scripts
          SET status = 'archived', row_version = row_version + 1,
              updated_at = now(), updated_by_user_id = ?
        WHERE id = ?`,
      [actorUserId, id],
    );
  }
}
