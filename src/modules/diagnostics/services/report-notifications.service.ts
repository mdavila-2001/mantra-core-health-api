import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../messaging/services';
import { PersonAccountLinksRepository } from '../../profiles/infrastructure/repositories';

/** The facts a publication notice needs; ids only, the study name is the subject. */
export interface ReportPublishedFacts {
  readonly tenantId: string;
  readonly reportId: string;
  readonly versionId: string;
  readonly studyName: string;
  readonly patientProfileId: string;
  readonly visible: boolean;
  readonly requesterProfileId: string | null;
  readonly orderCreatedByUserId: string | null;
  readonly signerProfileId: string;
  readonly actorUserId: string;
}

interface Notice {
  readonly recipientUserId: string | null;
  readonly subject: string;
  readonly bodyText: string;
  readonly key: string;
}

/**
 * CLINICAL notices of the written-report flow (D15), always emitted AFTER the
 * commit that published or released the report: a failing bell must never
 * undo a published report, so every emission is isolated and swallowed.
 */
@Injectable()
export class ReportNotificationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly notifications: NotificationsService,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReportNotificationsService.name);
  }

  async published(facts: ReportPublishedFacts): Promise<void> {
    const [patient, requester, signer] = await Promise.all([
      this.userOf(facts.patientProfileId),
      this.userOf(facts.requesterProfileId),
      this.userOf(facts.signerProfileId),
    ]);
    const notices: Notice[] = [
      {
        recipientUserId: requester ?? facts.orderCreatedByUserId,
        subject: facts.visible
          ? `Resultado publicado: ${facts.studyName}`
          : 'Resultado retenido: entrégalo al paciente',
        bodyText: facts.visible
          ? 'El informe de su orden ya está disponible para usted y para el paciente.'
          : `El informe de ${facts.studyName} quedó retenido hasta que usted lo libere al paciente.`,
        key: 'requester',
      },
    ];
    if (facts.visible)
      notices.push(this.patientNotice(patient, facts.studyName));
    if (signer !== facts.actorUserId) {
      notices.push({
        recipientUserId: signer,
        subject: 'Se publicó un informe con tu firma',
        bodyText: `Informe de ${facts.studyName}.`,
        key: 'signer',
      });
    }
    await this.emitAll(facts, notices);
  }

  /** «Tienes un informe para firmar»: the signer reviews and publishes it. */
  async signatureRequested(facts: {
    tenantId: string;
    serviceRequestId: string;
    draftId: string;
    rowVersion: number;
    studyName: string;
    signerProfileId: string;
    actorUserId: string;
  }): Promise<void> {
    const signer = await this.userOf(facts.signerProfileId);
    if (!signer || signer === facts.actorUserId) return;
    try {
      await this.notifications.emitInApp({
        recipientUserId: signer,
        category: 'CLINICAL',
        subject: 'Tienes un informe para firmar',
        bodyText: `Informe de ${facts.studyName}: revísalo y publícalo con tu firma.`,
        destination: { type: 'SERVICE_REQUEST', id: facts.serviceRequestId },
        tenantId: facts.tenantId,
        debounceKey: `diagnostics:draft:${facts.draftId}:${facts.rowVersion}:sign`,
        actorUserId: facts.actorUserId,
      });
    } catch (error) {
      this.logger.error(
        {
          operation: 'diagnostics.report.sign-request',
          draftId: facts.draftId,
          err: error,
        },
        'Signature request notice failed',
      );
    }
  }

  /** «Tu resultado está listo» after the requester releases a held report. */
  async releasedToPatient(
    facts: Pick<
      ReportPublishedFacts,
      | 'tenantId'
      | 'reportId'
      | 'versionId'
      | 'studyName'
      | 'patientProfileId'
      | 'actorUserId'
    >,
  ): Promise<void> {
    const patient = await this.userOf(facts.patientProfileId);
    await this.emitAll(facts, [this.patientNotice(patient, facts.studyName)]);
  }

  private patientNotice(userId: string | null, studyName: string): Notice {
    return {
      recipientUserId: userId,
      subject: `Tu resultado de ${studyName} está listo`,
      bodyText: 'Puede verlo y descargar el informe oficial en sus resultados.',
      key: 'patient',
    };
  }

  private async emitAll(
    facts: Pick<
      ReportPublishedFacts,
      'tenantId' | 'reportId' | 'versionId' | 'actorUserId'
    >,
    notices: readonly Notice[],
  ): Promise<void> {
    const sent = new Set<string>();
    for (const notice of notices) {
      if (!notice.recipientUserId || sent.has(notice.recipientUserId)) continue;
      sent.add(notice.recipientUserId);
      try {
        await this.notifications.emitInApp({
          recipientUserId: notice.recipientUserId,
          category: 'CLINICAL',
          subject: notice.subject,
          bodyText: notice.bodyText,
          destination: { type: 'DIAGNOSTIC_REPORT', id: facts.reportId },
          tenantId: facts.tenantId,
          debounceKey: `diagnostics:report:${facts.versionId}:${notice.key}`,
          actorUserId: facts.actorUserId,
        });
      } catch (error) {
        this.logger.error(
          {
            operation: 'diagnostics.report.notify',
            reportId: facts.reportId,
            notice: notice.key,
            err: error,
          },
          'Report notice failed; the report stays published',
        );
      }
    }
  }

  /** Account of a person (profile ids are person ids), or `null`. */
  private async userOf(personId: string | null): Promise<string | null> {
    if (!personId) return null;
    try {
      const em = this.em.fork({ keepTransactionContext: false });
      const link = await this.accountLinks.findActiveByPerson(em, personId);
      return link?.userId ?? null;
    } catch {
      return null;
    }
  }
}
