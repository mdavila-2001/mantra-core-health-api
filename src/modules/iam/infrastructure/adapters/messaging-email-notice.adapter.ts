import { Injectable } from '@nestjs/common';
import { MESSAGING_SEED } from '../../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../../messaging/services';
import type {
  EmailNoticeInput,
  EmailNoticePort,
} from '../../application/ports/email-notice.port';

/** Encola los correos del acceso por el canal de correo de `messaging`. */
@Injectable()
export class MessagingEmailNoticeAdapter implements EmailNoticePort {
  constructor(private readonly notifications: NotificationsService) {}

  async enqueueEmail(input: EmailNoticeInput): Promise<void> {
    await this.notifications.createRequest(
      {
        channelId: MESSAGING_SEED.emailChannelId,
        recipientUserId: input.recipientUserId,
        recipientAddress: input.recipientAddress,
        payloadJson: { subject: input.subject, bodyText: input.bodyText },
      },
      { id: input.recipientUserId, roles: [] },
    );
  }
}
