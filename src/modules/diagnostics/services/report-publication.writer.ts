import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ConcurrencyConflictException,
  type AuthenticatedUser,
} from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import {
  DiagnosticReports,
  type ServiceRequests,
} from '../../clinical/entities';
import { DiagnosticReportsRepository } from '../../clinical/repositories/diagnostic-reports.repository';
import { DIAG } from '../diagnostics.concepts';
import {
  DiagnosticReportVersions,
  LaboratoryWorkOrderTests,
  ReportDrafts,
} from '../entities';
import { RDRAFT } from '../report-drafts.concepts';
import {
  DiagnosticOrdersRepository,
  LabPortalRepository,
  ReportsRepository,
} from '../repositories';
import {
  DRAFT_STATUS,
  ReportDraftsRepository,
} from '../repositories/report-drafts.repository';
import { notAvailable } from './lab-portal-results.service';
import { reportAlreadyPublished } from './report-immutability.service';

/** Everything the publication transaction writes, resolved beforehand. */
export interface ReportPublication {
  readonly tenantId: string;
  readonly draftId: string;
  readonly rowVersion: number;
  readonly order: ServiceRequests;
  readonly versionId: string;
  readonly issuedAt: Date;
  readonly contentHash: string;
  readonly conclusionText: string;
  readonly signerProfileId: string;
  readonly officialFileId: string;
  readonly visibilityConceptId: string;
  readonly actor: AuthenticatedUser;
}

/** 409 when the draft moved since the client read it. */
export function assertDraftRowVersion(
  draft: ReportDrafts,
  rowVersion: number,
): void {
  if (draft.rowVersion !== rowVersion) {
    throw new ConcurrencyConflictException(
      'El borrador cambió desde que lo abrió; recárguelo',
      { currentRowVersion: draft.rowVersion },
    );
  }
}

/**
 * The transactional half of a publication: get-or-create the order's report
 * (locked, like `LabPortalResultWritesService`), a new FINAL version with the
 * carried files + the official PDF + the draft annexes (never the audio), its
 * release event, the tests REPORTED and the draft frozen.
 */
@Injectable()
export class ReportPublicationWriter {
  constructor(
    private readonly drafts: ReportDraftsRepository,
    private readonly reports: ReportsRepository,
    private readonly clinicalReports: DiagnosticReportsRepository,
    private readonly orders: DiagnosticOrdersRepository,
    private readonly portal: LabPortalRepository,
  ) {}

  /** The report the tenant keeps for the order (the oldest, if several). */
  async findReport(
    em: EntityManager,
    tenantId: string,
    orderId: string,
  ): Promise<DiagnosticReports | null> {
    const [report] = await em.find(
      DiagnosticReports,
      { serviceRequestId: orderId, custodianTenantId: tenantId },
      { orderBy: { createdAt: 'ASC' }, limit: 1 },
    );
    return report ?? null;
  }

  /** Runs inside the caller's transaction; returns the report id. */
  async write(tx: EntityManager, p: ReportPublication): Promise<string> {
    const { tenantId, order, versionId, issuedAt, actor } = p;
    const current = await this.findReport(tx, tenantId, order.id);
    if (current) {
      await tx.lock(
        tx.getReference(DiagnosticReports, current.id),
        LockMode.PESSIMISTIC_WRITE,
      );
      await tx.refresh(current);
      if (await this.drafts.findPublishedByReport(tx, current.id)) {
        throw reportAlreadyPublished();
      }
    }
    const draft = await tx.findOne(
      ReportDrafts,
      { id: p.draftId, custodianTenantId: tenantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    if (!draft) throw notAvailable();
    if (draft.statusCode !== DRAFT_STATUS.DRAFT) throw reportAlreadyPublished();
    assertDraftRowVersion(draft, p.rowVersion);

    const report =
      current ?? (await this.createReport(tx, tenantId, order, actor));
    const [latest] = await this.reports.findVersionsByReports(tx, [report.id]);
    const carried = latest
      ? await this.reports.findFilesByVersions(tx, [latest.id])
      : [];
    tx.create(
      DiagnosticReportVersions,
      {
        id: versionId,
        diagnosticReportId: report.id,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        clinicalStatusConceptId: DIAG.REPORT_FINAL,
        custodianTenantId: tenantId,
        conclusionText: p.conclusionText,
        issuedAt,
        performerTenantId: tenantId,
        authorProfileId: p.signerProfileId,
        supersedesVersionId: report.currentVersionId ?? latest?.id,
        contentHash: p.contentHash,
        releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        recordedAt: issuedAt,
        recordedByUserId: actor.id,
      },
      { partial: true },
    );
    await tx.flush();

    // The audio is the author's backup: it never reaches the published version.
    const annexes = (await this.drafts.findFiles(tx, draft.id)).filter(
      (f) => f.roleCode !== 'AUDIO',
    );
    const files = [
      ...carried.map((f) => ({
        fileId: f.fileId,
        role: f.contentRoleConceptId,
      })),
      { fileId: p.officialFileId, role: RDRAFT.REPORT_FILE_OFFICIAL },
      ...annexes.map((f) => ({
        fileId: f.fileId,
        role: RDRAFT.REPORT_FILE_ANNEX,
      })),
    ].filter((f, i, all) => all.findIndex((o) => o.fileId === f.fileId) === i);
    files.forEach((file, ordinal) =>
      this.reports.addFile(tx, {
        diagnosticReportVersionId: versionId,
        fileId: file.fileId,
        contentRoleConceptId: file.role,
        ordinal,
        createdByUserId: actor.id,
      }),
    );
    this.reports.recordReleaseEvent(tx, {
      diagnosticReportVersionId: versionId,
      actionConceptId: DIAG.RELEASE_ACTION_RELEASE,
      patientVisibilityConceptId: p.visibilityConceptId,
      recordedByUserId: actor.id,
    });
    report.lifecycleStatusConceptId = CLIN.REPORT_FINAL;
    this.orders.markReportReleased(
      tx,
      report,
      versionId,
      p.visibilityConceptId,
      actor.id,
    );
    await tx.flush();
    await this.markTestsReported(tx, tenantId, order.id, report.id, actor.id);

    Object.assign(draft, {
      statusCode: DRAFT_STATUS.PUBLISHED,
      diagnosticReportId: report.id,
      conclusionText: p.conclusionText,
      publishedVersionId: versionId,
      publishedAt: issuedAt,
      publishedByUserId: actor.id,
      updatedAt: issuedAt,
      updatedByUserId: actor.id,
    });
    await tx.flush();
    return report.id;
  }

  private async createReport(
    tx: EntityManager,
    tenantId: string,
    order: ServiceRequests,
    actor: AuthenticatedUser,
  ): Promise<DiagnosticReports> {
    const report = this.clinicalReports.create(tx, {
      custodianTenantId: tenantId,
      patientProfileId: order.patientProfileId,
      serviceRequestId: order.id,
      encounterId: order.encounterId,
      codeConceptId: order.codeConceptId,
      categoryConceptId: order.categoryConceptId,
      lifecycleStatusConceptId: CLIN.REPORT_PARTIAL,
      resultReleaseStatusConceptId: CLIN.RELEASE_HELD,
      actorUserId: actor.id,
    });
    await tx.flush();
    return report;
  }

  /** Same step as the portal attach: the order's tests of the latest accession are REPORTED. */
  private async markTestsReported(
    tx: EntityManager,
    tenantId: string,
    orderId: string,
    reportId: string,
    actorUserId: string,
  ): Promise<void> {
    const [accession] = await this.portal.findAccessions(tx, tenantId, [
      orderId,
    ]);
    if (!accession) return;
    const workOrders = await this.portal.findWorkOrders(tx, tenantId, [
      accession.id,
    ]);
    if (workOrders.length === 0) return;
    await tx.nativeUpdate(
      LaboratoryWorkOrderTests,
      {
        laboratoryWorkOrderId: { $in: workOrders.map((w) => w.id) },
        serviceRequestId: orderId,
        diagnosticReportId: null,
      },
      {
        statusConceptId: DIAG.TEST_REPORTED,
        diagnosticReportId: reportId,
        completedAt: new Date(),
        updatedAt: new Date(),
        updatedByUserId: actorUserId,
      },
    );
  }
}
