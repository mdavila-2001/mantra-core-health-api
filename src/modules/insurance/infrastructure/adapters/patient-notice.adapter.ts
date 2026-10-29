import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../../messaging/services';
import { PersonAccountLinksRepository } from '../../../profiles/infrastructure/repositories';
import type {
  PatientNoticeInput,
  PatientNoticePort,
} from '../../application/ports/patient-notice.port';

/**
 * Aviso in-app al paciente sobre `NotificationsService` (carril 16,
 * REQ-16-032).
 *
 * Sigue la plantilla de `pharmacy_inventory`: el perfil del paciente es su
 * `personId`, de ahí se llega a la cuenta de usuario activa y se emite en la
 * categoría clínica (el contrato de avisos no tiene una familia de facturación;
 * ver la ambigüedad registrada en el plan del carril).
 *
 * Nunca lanza. Sólo registra identificadores, no el contenido del aviso.
 */
@Injectable()
export class PatientNoticeAdapter implements PatientNoticePort {
  constructor(
    private readonly em: EntityManager,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PatientNoticeAdapter.name);
  }

  async notifyPatient(input: PatientNoticeInput): Promise<void> {
    try {
      const link = await this.accountLinks.findActiveByPerson(
        this.em.fork(),
        input.patientProfileId,
      );
      if (!link) {
        this.logger.info(
          {
            operation: 'insurance.patient.notice',
            patientProfileId: input.patientProfileId,
            claimId: input.destination.id,
          },
          'Patient has no active account: notice skipped',
        );
        return;
      }
      await this.notifications.emitInApp({
        recipientUserId: link.userId,
        category: 'CLINICAL',
        subject: input.subject,
        bodyText: input.bodyText,
        destination: input.destination,
        tenantId: input.tenantId,
        debounceKey: input.debounceKey,
        payloadJson: input.payloadJson,
        actorUserId: input.actorUserId,
      });
    } catch (error) {
      this.logger.error(
        {
          operation: 'insurance.patient.notice',
          patientProfileId: input.patientProfileId,
          claimId: input.destination.id,
          error: error instanceof Error ? error.message : 'unknown',
        },
        'Patient notice failed: the committed operation is not affected',
      );
    }
  }
}
