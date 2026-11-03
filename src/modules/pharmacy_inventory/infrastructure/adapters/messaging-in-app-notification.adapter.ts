import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../../../messaging/services';
import type {
  InAppNotificationPort,
  PharmacyNotificationInput,
} from '../../application/ports/in-app-notification.port';

/** Adaptador del emisor local al servicio in-app del contexto messaging. */
@Injectable()
export class MessagingInAppNotificationAdapter implements InAppNotificationPort {
  constructor(private readonly notifications: NotificationsService) {}

  emit(input: PharmacyNotificationInput) {
    return this.notifications.emitInApp(input);
  }
}
