import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DiagnosticReportFiles,
  ReportDraftFiles,
  ReportDrafts,
  ReportIssuerSettings,
} from '../entities';
import { RDRAFT } from '../report-drafts.concepts';

export const DRAFT_STATUS = { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED' } as const;

/**
 * Stateless reads of the written-report flow. Drafts and settings are scoped
 * by `custodian_tenant_id`, the tenant that writes the report.
 */
@Injectable()
export class ReportDraftsRepository {
  findById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<ReportDrafts | null> {
    return em.findOne(ReportDrafts, { id, custodianTenantId: tenantId });
  }

  findByOrder(
    em: EntityManager,
    tenantId: string,
    serviceRequestId: string,
  ): Promise<ReportDrafts | null> {
    return em.findOne(ReportDrafts, {
      serviceRequestId,
      custodianTenantId: tenantId,
    });
  }

  /** The tenant's drafts of several orders, in one query. */
  findByOrders(
    em: EntityManager,
    tenantId: string,
    serviceRequestIds: readonly string[],
  ): Promise<ReportDrafts[]> {
    if (serviceRequestIds.length === 0) return Promise.resolve([]);
    return em.find(ReportDrafts, {
      serviceRequestId: { $in: [...serviceRequestIds] },
      custodianTenantId: tenantId,
    });
  }

  /** The official PDF a published version carries, if any. */
  async findOfficialFileId(
    em: EntityManager,
    versionId: string,
  ): Promise<string | null> {
    const file = await em.findOne(DiagnosticReportFiles, {
      diagnosticReportVersionId: versionId,
      contentRoleConceptId: RDRAFT.REPORT_FILE_OFFICIAL,
    });
    return file?.fileId ?? null;
  }

  findFiles(em: EntityManager, draftId: string): Promise<ReportDraftFiles[]> {
    return em.find(
      ReportDraftFiles,
      { reportDraftId: draftId },
      { orderBy: { ordinal: 'ASC', createdAt: 'ASC' } },
    );
  }

  /** The published draft of a report, if the report came from this flow. */
  findPublishedByReport(
    em: EntityManager,
    diagnosticReportId: string,
  ): Promise<ReportDrafts | null> {
    return em.findOne(ReportDrafts, {
      diagnosticReportId,
      statusCode: DRAFT_STATUS.PUBLISHED,
    });
  }

  /** The published draft that produced a report version. */
  findPublishedByVersion(
    em: EntityManager,
    versionId: string,
  ): Promise<ReportDrafts | null> {
    return em.findOne(ReportDrafts, {
      publishedVersionId: versionId,
      statusCode: DRAFT_STATUS.PUBLISHED,
    });
  }

  findIssuerSettings(
    em: EntityManager,
    tenantId: string,
  ): Promise<ReportIssuerSettings | null> {
    return em.findOne(ReportIssuerSettings, { custodianTenantId: tenantId });
  }
}
