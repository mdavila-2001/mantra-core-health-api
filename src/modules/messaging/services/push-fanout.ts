import type { PinoLogger } from 'nestjs-pino';
import { deferAfterTenantCommit } from '../../../common/tenant/tenant-transaction-completion';
import type { NotificationsGateway } from '../gateways';
import type { NotificationDestination } from '../notifications.contract';
import type { NativePushService } from './native-push.service';
import type { WebPushService } from './web-push.service';
import { resolvePushRoute, type PushDestination } from './push-route';

/** An inbox row that just became visible to its recipient. */
export interface InboxAnnouncement {
  readonly recipientUserId: string;
  /** `messaging.in_app_notifications.id`. */
  readonly notificationId: string;
  /** Category name (`CLINICAL`, `MESSAGES`…), or `null` if it has none. */
  readonly category: string | null;
  readonly subject: string | null;
  readonly bodyText: string | null;
  readonly destination: PushDestination | null;
  /** `payload.route` of the notice, if the emitting module set one. */
  readonly explicitRoute?: string;
  /** ISO 8601. */
  readonly availableAt: string;
}

/** What a push needs; the socket also wants the text. */
export type PushNotice = Pick<
  InboxAnnouncement,
  | 'recipientUserId'
  | 'notificationId'
  | 'category'
  | 'destination'
  | 'explicitRoute'
>;

/**
 * The one place that tells the outside world an inbox row exists: the socket
 * (`notification:new`, live bell) plus web push and native push.
 *
 * Every delivery path (direct `emitInApp`, `createRequest` + inline delivery,
 * worker delivery, and the release of rows deferred by quiet hours) goes
 * through here, so all of them carry the same route and the same payload.
 *
 * Fire-and-forget and never throws. It only ever fires after the COMMIT: the
 * callers' own transactions are savepoints inside the request transaction
 * (`TenantContextInterceptor`), so both methods queue on
 * `deferAfterTenantCommit` and a rollback drops the announcement. Outside any
 * boundary (worker, tests) the caller's transaction already returned, and the
 * announcement goes out at once. A push that fails cannot undo the act.
 */
export class PushFanout {
  constructor(
    private readonly logger: PinoLogger,
    private readonly gateway?: NotificationsGateway,
    private readonly webPush?: WebPushService,
    private readonly nativePush?: NativePushService,
  ) {}

  /** New row: socket + push. */
  announce(notice: InboxAnnouncement): void {
    this.afterCommit(() => this.announceNow(notice));
  }

  /**
   * Push only, for a notice the bell already shows (e.g. a new message in a
   * conversation whose earlier notice is still unread). The bell row is not
   * duplicated, but the phone still buzzes for the new message.
   */
  push(notice: PushNotice): void {
    this.afterCommit(() => this.pushNow(notice));
  }

  private afterCommit(send: () => void): void {
    const task = async (): Promise<void> => {
      try {
        send();
      } catch (error: unknown) {
        // Never fail the HTTP result of a committed act because of a socket.
        this.logger.warn(
          {
            operation: 'messaging.push.fanout',
            errorName: error instanceof Error ? error.name : 'unknown',
          },
          'Announcement failed; the inbox row is already stored',
        );
      }
    };
    if (!deferAfterTenantCommit(task)) void task();
  }

  private announceNow(notice: InboxAnnouncement): void {
    this.gateway?.notifyUser(notice.recipientUserId, {
      id: notice.notificationId,
      category: notice.category,
      subject: notice.subject,
      bodyText: notice.bodyText,
      // Stored as varchar; the bell already projects it the same way.
      destination: notice.destination as NotificationDestination | null,
      availableAt: notice.availableAt,
    });
    this.pushNow(notice);
  }

  private pushNow(notice: PushNotice): void {
    const message = {
      recipientUserId: notice.recipientUserId,
      notificationId: notice.notificationId,
      route: resolvePushRoute(notice.destination, notice.explicitRoute),
      destinationType: notice.destination?.type ?? '',
      destinationId: notice.destination?.id ?? '',
      category: notice.category ?? '',
    };
    for (const sender of [this.webPush, this.nativePush]) {
      if (!sender) continue;
      sender.pushToUser(message).catch((error: unknown) => {
        // Both senders already swallow their own failures; this is a guard.
        this.logger.warn(
          {
            operation: 'messaging.push.fanout',
            recipientUserId: notice.recipientUserId,
            errorName: error instanceof Error ? error.name : 'unknown',
          },
          'Push fan-out failed; the inbox row is already stored',
        );
      });
    }
  }
}
