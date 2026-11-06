import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  readWithSystemRls,
  withSystemRlsInTransaction,
} from '../../../common/tenant/rls-transaction';
import { DiagnosticReports, ServiceRequests } from '../../clinical/entities';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticReportVersions } from '../entities';
import { DiagnosticOrdersRepository, ReportsRepository } from '../repositories';
import { LabReceptionRepository } from '../repositories/lab-reception.repository';
import { ReportDraftsRepository } from '../repositories/report-drafts.repository';
import type {
  PatientReleaseResultDto,
  ReportVerificationDto,
} from '../dto/report-draft-publish.dto';
import { notAvailable } from './lab-portal-results.service';
import { ReportNotificationsService } from './report-notifications.service';

/**
 * After publication (D14): the requester releases a HELD report to the
 * patient, and anyone verifies an official PDF by its QR without PHI.
 */
@Injectable()
export class ReportReleaseService {
  constructor(
    private readonly em: EntityManager,
    private readonly drafts: ReportDraftsRepository,
    private readonly reports: ReportsRepository,
    private readonly orders: DiagnosticOrdersRepository,
    private readonly labels: LabReceptionRepository,
    private readonly notices: ReportNotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReportReleaseService.name);
  }

  /**
   * New VISIBLE release event on the same published version; only the tenant
   * that issued the order (`service_requests.custodian_tenant_id`) may do it.
   * The report is custodied by the performer, so the step runs in a bounded
   * system window whose every read is tied to that verified order.
   */
  async releaseToPatient(
    tenantId: string,
    reportId: string,
    actor: AuthenticatedUser,
  ): Promise<PatientReleaseResultDto> {
    const released = await this.em.transactional((tx) =>
      withSystemRlsInTransaction(tx, async () => {
        const report = await tx.findOne(DiagnosticReports, { id: reportId });
        const order = report?.serviceRequestId
          ? await tx.findOne(ServiceRequests, { id: report.serviceRequestId })
          : null;
        if (!report || !order || order.custodianTenantId !== tenantId) {
          throw notAvailable();
        }
        const draft = await this.drafts.findPublishedByReport(tx, report.id);
        if (!draft?.publishedVersionId) throw notAvailable();
        await tx.lock(report, LockMode.PESSIMISTIC_WRITE);
        const versionId = draft.publishedVersionId;
        const [last] = await this.reports.findReleaseEventsByVersions(tx, [
          versionId,
        ]);
        if (
          last?.patientVisibilityConceptId === DIAG.VISIBILITY_PATIENT_VISIBLE
        ) {
          throw new ConflictException(
            'El resultado ya está visible para el paciente',
          );
        }
        this.reports.recordReleaseEvent(tx, {
          diagnosticReportVersionId: versionId,
          actionConceptId: DIAG.RELEASE_ACTION_RELEASE,
          patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
          recordedByUserId: actor.id,
        });
        this.orders.markReportReleased(
          tx,
          report,
          versionId,
          DIAG.VISIBILITY_PATIENT_VISIBLE,
          actor.id,
        );
        await tx.flush();
        return { report, order, versionId };
      }),
    );
    this.logger.info(
      { operation: 'diagnostics.report.patient-release', reportId },
      'Held report released to the patient',
    );
    const studies = await this.labels.findConceptDisplays(this.em.fork(), [
      released.order.codeConceptId,
    ]);
    await this.notices.releasedToPatient({
      tenantId,
      reportId,
      versionId: released.versionId,
      studyName: studies.get(released.order.codeConceptId) ?? 'su estudio',
      patientProfileId: released.report.patientProfileId,
      actorUserId: actor.id,
    });
    return {
      reportId,
      versionId: released.versionId,
      patientVisibility: 'VISIBLE',
    };
  }

  /**
   * Public verification by version id: status, date, issuer, study and hash.
   * Never the patient. A version that did not come from this flow is a 404.
   */
  verify(versionId: string): Promise<ReportVerificationDto> {
    // Public route without tenant: every read is keyed by the published draft of this version.
    return readWithSystemRls(this.em, async (em) => {
      const draft = await this.drafts.findPublishedByVersion(em, versionId);
      const version = draft
        ? await em.findOne(DiagnosticReportVersions, { id: versionId })
        : null;
      const order = draft
        ? await em.findOne(ServiceRequests, { id: draft.serviceRequestId })
        : null;
      if (!draft || !version?.contentHash || !order) {
        throw new ResourceNotFoundException('Informe no encontrado');
      }
      const [issuers, studies] = await Promise.all([
        this.labels.findTenantNames(em, [draft.custodianTenantId]),
        this.labels.findConceptDisplays(em, [order.codeConceptId]),
      ]);
      return {
        status: 'PUBLISHED',
        issuedAt: (version.issuedAt ?? version.recordedAt).toISOString(),
        issuerName:
          issuers.get(draft.custodianTenantId) ?? 'Organización emisora',
        studyName: studies.get(order.codeConceptId) ?? 'Estudio',
        contentHash: version.contentHash,
      };
    });
  }
}
