import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash } from 'node:crypto';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import type { DiagnosticReports } from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';
import { DiagnosticReportsRepository } from '../../clinical/repositories/diagnostic-reports.repository';
import { DIAG } from '../diagnostics.concepts';
import { LaboratoryWorkOrderTests } from '../entities';
import {
  DiagnosticOrdersRepository,
  LabPortalRepository,
  ReportsRepository,
} from '../repositories';
import type { LabResultFileDto } from '../dto/lab-portal-results.dto';
import {
  LabPortalResultsService,
  toResultFileDto,
} from './lab-portal-results.service';

/**
 * Writes of the laboratory portal result files. A file lives in
 * `diagnostics.diagnostic_report_files` of a released, patient-visible version
 * of the order's `clinical.diagnostic_reports`: exactly what
 * `GET /diagnostic-results/me` reads, so an upload reaches the patient.
 *
 * Versions are immutable: adding a file publishes a version that carries the
 * available files plus the new one; withdrawing publishes one without it, with
 * the reason in `amendment_reason_text`. Nothing is deleted.
 */
@Injectable()
export class LabPortalResultWritesService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: LabPortalRepository,
    private readonly reports: ReportsRepository,
    private readonly clinicalReports: DiagnosticReportsRepository,
    private readonly orders: DiagnosticOrdersRepository,
    private readonly reads: LabPortalResultsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LabPortalResultWritesService.name);
  }

  /** Publishes a version of the report without the file; it stays in history. */
  async withdraw(
    tenantId: string,
    fileId: string,
    reason: string,
    actor: AuthenticatedUser,
  ): Promise<LabResultFileDto> {
    this.logger.info(
      { operation: 'diagnostics.lab-portal.result.withdraw', fileId },
      'Withdrawing a result file',
    );
    await this.em.transactional(async (tx) => {
      const { view, file } = await this.reads.locate(tx, tenantId, fileId);
      if (file.status === 'WITHDRAWN') {
        throw new ConflictException('El archivo ya estaba retirado.', {
          fileId,
        });
      }
      const report = view.reports.find((r) => r.id === file.reportId)!;
      const keep = view.files
        .filter((f) => f.reportId === report.id && f.status === 'AVAILABLE')
        .map((f) => f.fileId)
        .filter((id) => id !== fileId);
      await this.publish(tx, tenantId, report, keep, actor, { reason });
    });
    const { file } = await this.reads.locate(this.em.fork(), tenantId, fileId);
    return toResultFileDto(file);
  }

  /** Attaches an already stored file to the order's report and releases it. */
  async attach(
    tenantId: string,
    orderId: string,
    fileId: string,
    note: string | null,
    actor: AuthenticatedUser,
  ): Promise<LabResultFileDto> {
    await this.em.transactional(async (tx) => {
      const view = await this.reads.assertUploadable(tx, tenantId, orderId);
      let report = view.reports[0];
      if (!report) {
        report = this.clinicalReports.create(tx, {
          custodianTenantId: tenantId,
          patientProfileId: view.order.patientProfileId,
          serviceRequestId: view.order.id,
          encounterId: view.order.encounterId,
          codeConceptId: view.order.codeConceptId,
          categoryConceptId: view.order.categoryConceptId,
          lifecycleStatusConceptId: CLIN.REPORT_PARTIAL,
          resultReleaseStatusConceptId: CLIN.RELEASE_HELD,
          actorUserId: actor.id,
        });
        await tx.flush();
      }
      const keep = view.files
        .filter((f) => f.reportId === report.id && f.status === 'AVAILABLE')
        .map((f) => f.fileId);
      await this.publish(tx, tenantId, report, [...keep, fileId], actor, {
        note,
      });
      const workOrders = view.accession
        ? await this.repo.findWorkOrders(tx, tenantId, [view.accession.id])
        : [];
      await tx.nativeUpdate(
        LaboratoryWorkOrderTests,
        {
          laboratoryWorkOrderId: { $in: workOrders.map((w) => w.id) },
          serviceRequestId: orderId,
          diagnosticReportId: null,
        },
        {
          statusConceptId: DIAG.TEST_REPORTED,
          diagnosticReportId: report.id,
          completedAt: new Date(),
          updatedAt: new Date(),
          updatedByUserId: actor.id,
        },
      );
    });
    const { file } = await this.reads.locate(this.em.fork(), tenantId, fileId);
    return toResultFileDto(file);
  }

  /** New immutable version carrying `fileIds`, released visible to the patient. */
  private async publish(
    tx: EntityManager,
    tenantId: string,
    report: DiagnosticReports,
    fileIds: readonly string[],
    actor: AuthenticatedUser,
    change: { note?: string | null; reason?: string },
  ): Promise<void> {
    const number = (await this.reports.maxVersionNumber(tx, report.id)) + 1;
    const version = this.reports.createVersion(tx, {
      diagnosticReportId: report.id,
      versionNumber: number,
      clinicalStatusConceptId: DIAG.REPORT_FINAL,
      custodianTenantId: tenantId,
      conclusionText: change.note ?? undefined,
      supersedesVersionId: report.currentVersionId,
      amendmentReasonText: change.reason,
      contentHash: createHash('sha256')
        .update(`${report.id}:${number}:${fileIds.join(',')}`)
        .digest('hex'),
      releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
      recordedByUserId: actor.id,
    });
    version.issuedAt = new Date();
    await tx.flush();
    fileIds.forEach((fileId, ordinal) =>
      this.reports.addFile(tx, {
        diagnosticReportVersionId: version.id,
        fileId,
        contentRoleConceptId: DIAG.REPORT_FINAL,
        ordinal,
        createdByUserId: actor.id,
      }),
    );
    this.reports.recordReleaseEvent(tx, {
      diagnosticReportVersionId: version.id,
      actionConceptId: DIAG.RELEASE_ACTION_RELEASE,
      patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
      recordedByUserId: actor.id,
    });
    report.lifecycleStatusConceptId = CLIN.REPORT_FINAL;
    this.orders.markReportReleased(
      tx,
      report,
      version.id,
      DIAG.VISIBILITY_PATIENT_VISIBLE,
      actor.id,
    );
    await tx.flush();
  }
}
