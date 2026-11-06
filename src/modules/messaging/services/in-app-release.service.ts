import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, SEED, touch } from '../../../common';
import { InAppNotifications } from '../entities';
import { NotificationsGateway } from '../gateways';
import { NOTIFICATION_CATEGORY_BY_CONCEPT } from '../notifications.contract';
import type { ReleaseDueInAppResponseDto } from '../dto';
import { NativePushService } from './native-push.service';
import { PushFanout } from './push-fanout';
import { routeFromPayload } from './push-route';
import { WebPushService } from './web-push.service';

const DEFAULT_BATCH = 100;
/**
 * A row that became visible longer ago than this is released without push:
 * a buzz hours late (worker down overnight) is noise, and the row is already
 * in the bell. Same horizon as the web push TTL.
 */
const STALE_ANNOUNCE_MS = 60 * 60_000;

/**
 * Releases inbox rows deferred by quiet hours.
 *
 * A deferred row is written with `available_at` at the end of the window and
 * `sent_at` empty (every other row is written with `sent_at = now`). When the
 * window ends, this claims it (`sent_at = now`, `SKIP LOCKED` so overlapping
 * ticks never announce the same row twice) and only after the commit emits
 * `notification:new` and the push. Without this, a notice written at night
 * appeared silently in the bell in the morning and never pushed.
 *
 * Driven by the messaging worker (`POST /internal/notifications/in-app/release-due`).
 */
@Injectable()
export class InAppReleaseService {
  private readonly fanout: PushFanout;

  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
    gateway?: NotificationsGateway,
    webPush?: WebPushService,
    nativePush?: NativePushService,
  ) {
    this.logger.setContext(InAppReleaseService.name);
    this.fanout = new PushFanout(logger, gateway, webPush, nativePush);
  }

  async releaseDue(
    limit: number = DEFAULT_BATCH,
  ): Promise<ReleaseDueInAppResponseDto> {
    const now = new Date();
    const due = await this.em.transactional(async (tx) => {
      const rows = await tx.find(
        InAppNotifications,
        {
          sentAt: null,
          statusConceptId: CONCEPTS.INAPP_UNREAD,
          availableAt: { $lte: now },
        },
        {
          lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
          orderBy: { availableAt: 'ASC' },
          limit,
        },
      );
      for (const row of rows) {
        row.sentAt = now;
        touch(row, SEED.systemWorkerUserId, now);
      }
      await tx.flush();
      return rows;
    });

    let announced = 0;
    for (const row of due) {
      if (now.getTime() - row.availableAt.getTime() > STALE_ANNOUNCE_MS) {
        continue;
      }
      this.fanout.announce({
        recipientUserId: row.recipientUserId,
        notificationId: row.id,
        category:
          NOTIFICATION_CATEGORY_BY_CONCEPT.get(row.categoryConceptId ?? '') ??
          null,
        subject: row.subject ?? null,
        bodyText: row.bodyText ?? null,
        destination: row.relatedResourceType
          ? { type: row.relatedResourceType, id: row.relatedResourceId ?? '' }
          : null,
        explicitRoute: routeFromPayload(row.payloadJson),
        availableAt: row.availableAt.toISOString(),
      });
      announced += 1;
    }
    if (due.length > 0) {
      this.logger.info(
        {
          operation: 'messaging.in-app.release-due',
          released: due.length,
          announced,
        },
        'Released in-app notifications deferred by quiet hours',
      );
    }
    return { released: due.length, announced };
  }
}
