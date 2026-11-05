import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClinicalNoteHeaders, ClinicalNoteVersions } from '../entities';

/** Chart-side lookups for the granular read scope. */
@Injectable()
export class ChartScopeRepository {
  /**
   * Notes of the patient whose CURRENT version was written by one of the
   * practitioners. A note's responsible is the author of its current version,
   * which lives in another table, so it is resolved here in two bounded steps
   * (the patient's headers, then their current versions) instead of in memory
   * over the whole table.
   *
   * @returns Header ids, ready to be used as an `id IN (...)` clause.
   */
  async findNoteIdsAuthoredBy(
    em: EntityManager,
    patientProfileId: string,
    authorProfileIds: readonly string[],
  ): Promise<string[]> {
    if (authorProfileIds.length === 0) return [];
    const headers = await em.find(
      ClinicalNoteHeaders,
      { patientProfileId },
      { fields: ['id', 'currentVersionId'] },
    );
    const versionIds = headers
      .map((header) => header.currentVersionId)
      .filter((id): id is string => Boolean(id));
    if (versionIds.length === 0) return [];
    const authored = await em.find(
      ClinicalNoteVersions,
      {
        id: { $in: versionIds },
        authorProfileId: { $in: [...authorProfileIds] },
      },
      { fields: ['id'] },
    );
    const authoredIds = new Set(authored.map((version) => version.id));
    return headers
      .filter((h) => h.currentVersionId && authoredIds.has(h.currentVersionId))
      .map((header) => header.id);
  }
}
