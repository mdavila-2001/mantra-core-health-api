import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { FileCategory, FileSensitivity } from '../../common/dto';
import { FileUploadService } from '../../common/services/file-upload.service';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { LabReceptionRepository } from '../repositories/lab-reception.repository';
import type {
  PublishReportDraftDto,
  PublishedReportDto,
} from '../dto/report-draft-publish.dto';
import { DiagnosticReportPdfService } from './diagnostic-report-pdf.service';
import {
  isReportBodyEmpty,
  reportContentHash,
  reportPlainText,
  storedReportBody,
} from './report-body';
import { ReportDraftsService } from './report-drafts.service';
import { ReportImmutabilityService } from './report-immutability.service';
import { ReportNotificationsService } from './report-notifications.service';
import {
  assertDraftRowVersion,
  ReportPublicationWriter,
} from './report-publication.writer';
import { ReportSignersService } from './report-signers.service';

/**
 * Publishes a draft (D13/D16): checks, official PDF stored with its SHA-256
 * before the transaction, the immutable version written in one transaction
 * ({@link ReportPublicationWriter}) and the CLINICAL notices after the commit.
 */
@Injectable()
export class ReportPublishService {
  constructor(
    private readonly em: EntityManager,
    private readonly drafts: ReportDraftsService,
    private readonly signers: ReportSignersService,
    private readonly immutability: ReportImmutabilityService,
    private readonly pdf: DiagnosticReportPdfService,
    private readonly files: FileUploadService,
    private readonly writer: ReportPublicationWriter,
    private readonly labels: LabReceptionRepository,
    private readonly notices: ReportNotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReportPublishService.name);
  }

  /** «BORRADOR» PDF of the current draft; nothing is stored. */
  async preview(
    tenantId: string,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<Buffer> {
    const em = this.em.fork();
    const ctx = await this.drafts.load(em, tenantId, actor, id);
    const body = storedReportBody(ctx.draft.bodyJson);
    const isSigner =
      !!ctx.draft.signerProfileId &&
      actor.practitionerProfileId === ctx.draft.signerProfileId;
    return this.pdf.render(em, tenantId, ctx, body, null, isSigner);
  }

  /**
   * Notifies the chosen signer that a draft awaits their review and signature.
   * The preparer never publishes with someone else's signature (see publish).
   */
  async requestSignature(
    tenantId: string,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<{ readonly requested: true }> {
    const em = this.em.fork();
    const { draft, order } = await this.drafts.load(em, tenantId, actor, id);
    this.drafts.assertEditable(draft);
    const body = storedReportBody(draft.bodyJson);
    if (!draft.signerProfileId || isReportBodyEmpty(body)) {
      throw new PreconditionFailedException(
        'Para pedir la firma hacen falta un firmante y el texto del informe',
      );
    }
    await this.signers.assertSigner(em, tenantId, actor, draft.signerProfileId);
    const studies = await this.labels.findConceptDisplays(em, [
      order.codeConceptId,
    ]);
    await this.notices.signatureRequested({
      tenantId,
      serviceRequestId: order.id,
      draftId: draft.id,
      rowVersion: draft.rowVersion,
      studyName: studies.get(order.codeConceptId) ?? 'un estudio',
      signerProfileId: draft.signerProfileId,
      actorUserId: actor.id,
    });
    return { requested: true };
  }

  async publish(
    tenantId: string,
    id: string,
    dto: PublishReportDraftDto,
    actor: AuthenticatedUser,
  ): Promise<PublishedReportDto> {
    const em = this.em.fork();
    const ctx = await this.drafts.load(em, tenantId, actor, id);
    const { draft, order } = ctx;
    this.drafts.assertEditable(draft);
    assertDraftRowVersion(draft, dto.rowVersion);
    const body = storedReportBody(draft.bodyJson);
    if (!draft.signerProfileId || isReportBodyEmpty(body)) {
      throw new PreconditionFailedException(
        'Para publicar hacen falta un firmante y el texto del informe',
      );
    }
    const signerProfileId = draft.signerProfileId;
    await this.signers.assertSigner(em, tenantId, actor, signerProfileId);
    // A signature image is only embedded by its owner: anyone else asks for it.
    if (actor.practitionerProfileId !== signerProfileId) {
      throw new InsufficientRoleException(
        'Solo el profesional firmante puede publicar el informe con su firma',
        undefined,
        DiagnosticsErrorReason.REPORT_SIGNER_MUST_PUBLISH,
      );
    }
    const known = await this.writer.findReport(em, tenantId, order.id);
    if (known) await this.immutability.assertWritable(known.id, em);

    const versionId = randomUUID();
    const issuedAt = new Date();
    const contentHash = reportContentHash({
      versionId,
      serviceRequestId: order.id,
      issuerTenantId: tenantId,
      signerProfileId,
      issuedAt,
      body,
    });
    const pdf = await this.pdf.render(
      em,
      tenantId,
      ctx,
      body,
      {
        versionId,
        contentHash,
        issuedAt,
      },
      true,
    );
    const official = await this.files.storeGenerated(
      {
        buffer: pdf,
        originalName: `informe-oficial-${versionId}.pdf`,
        mimeType: 'application/pdf',
        category: FileCategory.DOCUMENT,
        sensitivity: FileSensitivity.PHI,
      },
      actor,
    );
    const visible = draft.patientVisibilityCode !== 'HELD';
    const reportId = await this.em.transactional((tx) =>
      this.writer.write(tx, {
        tenantId,
        draftId: draft.id,
        rowVersion: dto.rowVersion,
        order,
        versionId,
        issuedAt,
        contentHash,
        conclusionText: reportPlainText(body),
        signerProfileId,
        officialFileId: official.id,
        visibilityConceptId: visible
          ? DIAG.VISIBILITY_PATIENT_VISIBLE
          : DIAG.VISIBILITY_PATIENT_HIDDEN,
        actor,
      }),
    );
    this.logger.info(
      {
        operation: 'diagnostics.report-draft.publish',
        draftId: draft.id,
        reportId,
        versionId,
      },
      'Report published',
    );

    const studies = await this.labels.findConceptDisplays(this.em.fork(), [
      order.codeConceptId,
    ]);
    await this.notices.published({
      tenantId,
      reportId,
      versionId,
      studyName: studies.get(order.codeConceptId) ?? 'su estudio',
      patientProfileId: order.patientProfileId,
      visible,
      requesterProfileId: order.requesterProfileId ?? null,
      orderCreatedByUserId: order.createdByUserId ?? null,
      signerProfileId,
      actorUserId: actor.id,
    });
    return {
      reportId,
      versionId,
      officialFileId: official.id,
      status: 'PUBLISHED',
      patientVisibility: visible ? 'VISIBLE' : 'HELD',
    };
  }
}
