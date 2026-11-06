import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Concepts of the written report flow (draft → published) that live outside
 * `diagnostics.concepts.ts` (a frozen file): the content role of each file a
 * published version carries (`diagnostic_report_files.content_role_concept_id`).
 */
export const { seeds: REPORT_DRAFT_CONCEPT_SEEDS, ids: RDRAFT } =
  defineModuleConcepts('diagnostics_report_drafts', {
    REPORT_FILE_OFFICIAL: {
      code: 'REPORT_FILE_OFFICIAL',
      display: 'Official signed report (PDF)',
    },
    REPORT_FILE_ANNEX: {
      code: 'REPORT_FILE_ANNEX',
      display: 'Report annex',
    },
  });

/** Role of a report file as the patient-facing DTO exposes it. */
export type ReportFileRole = 'OFFICIAL' | 'ANNEX';

/** `files[].role` of the patient results: `null` for any other content role. */
export function reportFileRoleOf(
  contentRoleConceptId: string,
): ReportFileRole | null {
  if (contentRoleConceptId === RDRAFT.REPORT_FILE_OFFICIAL) return 'OFFICIAL';
  if (contentRoleConceptId === RDRAFT.REPORT_FILE_ANNEX) return 'ANNEX';
  return null;
}
