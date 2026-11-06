import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PublicProfiles } from '../../community/entities';
import { FileUploadService } from '../../common/services/file-upload.service';
import { loadAgendaNoticesEnv } from '../../scheduling/infrastructure/config/agenda-notices.env';
import { LabReceptionRepository } from '../repositories/lab-reception.repository';
import { ReportDraftsRepository } from '../repositories/report-drafts.repository';
import type { ReportBody } from './report-body';
import { REPORT_IMAGE_MIME_TYPES } from './report-issuer-settings.service';
import { drawReportPdf } from './report-pdf.draw';
import type { ReportDraftContext } from './report-drafts.service';
import { ReportSignersService } from './report-signers.service';

/** What only an official (published) PDF carries. */
export interface ReportPdfOfficial {
  readonly versionId: string;
  readonly contentHash: string;
  readonly issuedAt: Date;
}

/** Public verification page of a report version, printed as the PDF QR. */
export function reportVerifyUrl(versionId: string): string {
  return `${loadAgendaNoticesEnv().webAppBaseUrl}/verify/informe/${versionId}`;
}

/**
 * Official PDF of a written report (and its «BORRADOR» preview): letterhead
 * of the issuing organization and AloVida, patient and order data, the body,
 * the laboratory and signer signatures and the verification footer. Every
 * image is read on the server; none of them reaches the client.
 */
@Injectable()
export class DiagnosticReportPdfService {
  constructor(
    private readonly labels: LabReceptionRepository,
    private readonly drafts: ReportDraftsRepository,
    private readonly signers: ReportSignersService,
    private readonly files: FileUploadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticReportPdfService.name);
  }

  async render(
    em: EntityManager,
    tenantId: string,
    { draft, order }: ReportDraftContext,
    body: ReportBody,
    official: ReportPdfOfficial | null,
    showSignerImages: boolean,
  ): Promise<Buffer> {
    // Practitioner profile ids are person ids: signer and requester resolve the same way.
    const practitioners = [draft.signerProfileId, order.requesterProfileId];
    const [tenants, labels, studies, settings, profile, identities] =
      await Promise.all([
        this.labels.findTenantNames(em, [tenantId]),
        this.labels.findPatientLabels(em, [order.patientProfileId]),
        this.labels.findConceptDisplays(em, [order.codeConceptId]),
        this.drafts.findIssuerSettings(em, tenantId),
        em.findOne(PublicProfiles, { targetId: tenantId }),
        this.signers.identities(
          em,
          practitioners.filter((id): id is string => typeof id === 'string'),
        ),
      ]);
    const issuerName = tenants.get(tenantId) ?? 'Organización emisora';
    const patient = labels.get(order.patientProfileId);
    const byId = new Map(identities.map((i) => [i.profileId, i]));
    const signer = draft.signerProfileId
      ? byId.get(draft.signerProfileId)
      : undefined;
    const [logo, labSignature, labSeal, signerSignature, signerSeal] =
      await Promise.all(
        [
          profile?.avatarFileId,
          settings?.signatureFileId,
          settings?.sealFileId,
          // The signer's own images are drawn only for the signer: others see name and registration.
          showSignerImages ? signer?.signatureFileId : undefined,
          showSignerImages ? signer?.sealFileId : undefined,
        ].map((id) => this.image(id)),
      );
    return drawReportPdf({
      issuerName,
      issuerLogo: logo,
      patientName: patient?.displayName ?? 'Paciente',
      patientCode: patient?.patientCode ?? null,
      studyName: studies.get(order.codeConceptId) ?? 'Estudio',
      requesterName:
        (order.requesterProfileId
          ? byId.get(order.requesterProfileId)?.name
          : null) ?? 'No informado',
      requestedAt: order.createdAt,
      issuedAt: official?.issuedAt ?? null,
      body,
      lab: {
        signature: labSignature,
        seal: labSeal,
        lines: [
          settings?.responsibleName,
          settings?.responsibleTitle,
          issuerName,
        ].filter((line): line is string => Boolean(line)),
      },
      signer: {
        signature: signerSignature,
        seal: signerSeal,
        lines: signer
          ? [
              signer.name,
              signer.registration ? `Matrícula: ${signer.registration}` : '',
              'Médico firmante',
            ].filter(Boolean)
          : ['Sin firmante'],
      },
      official: official
        ? {
            contentHash: official.contentHash,
            verifyUrl: reportVerifyUrl(official.versionId),
          }
        : null,
    });
  }

  /** Bytes of a PNG/JPEG image, or `null` when absent or unreadable. */
  private async image(
    fileId: string | null | undefined,
  ): Promise<Buffer | null> {
    if (!fileId) return null;
    try {
      const content = await this.files.downloadForAuthorizedContext(
        fileId,
        'diagnostics.report-pdf.image',
      );
      return REPORT_IMAGE_MIME_TYPES.includes(content.mimeType)
        ? content.buffer
        : null;
    } catch (error) {
      this.logger.warn(
        { operation: 'diagnostics.report-pdf.image', fileId, err: error },
        'Report image could not be read; the PDF is drawn without it',
      );
      return null;
    }
  }
}
