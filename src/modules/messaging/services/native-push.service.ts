import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../../common';
import {
  decryptSecret,
  encryptSecret,
} from '../../../common/crypto/secret-cipher';
import {
  appDeviceFingerprint,
  appInstallPrefix,
} from '../../iam/domain/app-device-fingerprint';
import { Devices } from '../../iam/entities';
import { readFcmSender, sendFcm, type FcmData } from './native-push.fcm';
import { DEFAULT_PUSH_ROUTE, safeRoute } from './push-route';

/** Mobile platforms that receive native push through FCM. */
export type NativePlatform = 'IOS' | 'ANDROID';

const PLATFORM_CONCEPT: Readonly<Record<NativePlatform, string>> = {
  IOS: CONCEPTS.PLATFORM_IOS,
  ANDROID: CONCEPTS.PLATFORM_ANDROID,
};
const NATIVE_CONCEPTS: readonly string[] = Object.values(PLATFORM_CONCEPT);
const DEVICE_NAME: Readonly<Record<NativePlatform, string>> = {
  IOS: 'iPhone · app ALOVIDA',
  ANDROID: 'Android · app ALOVIDA',
};

/** Input of `PUT /notifications/native-push/token`. */
export interface NativeTokenInput {
  readonly token: string;
  readonly platform: NativePlatform;
  readonly deviceFingerprint: string;
}

/** What travels in one native push; the detail is read inside the app. */
export interface NativePushMessage {
  readonly recipientUserId: string;
  readonly notificationId: string;
  readonly route: string;
  readonly destinationType?: string;
  readonly destinationId?: string;
  readonly category?: string;
}

/**
 * Stored as `{"fcm": token}` so the web push sender, which reads the same
 * column, finds no `endpoint` in it and skips the row silently.
 */
function sealToken(token: string): string {
  return encryptSecret(JSON.stringify({ fcm: token }));
}

/** The FCM token of a stored row, or `null` if the row holds something else. */
function openToken(sealed: string): string | null {
  try {
    const value = JSON.parse(decryptSecret(sealed)) as { fcm?: unknown };
    return typeof value.fcm === 'string' ? value.fcm : null;
  } catch {
    return null;
  }
}

/**
 * Native push (Android and iOS) through FCM HTTP v1; FCM forwards to APNs with
 * the key uploaded to Firebase, so one sender covers both platforms.
 *
 * - Config: `FCM_PROJECT_ID` + `FCM_SERVICE_ACCOUNT_JSON`. Without them sending
 *   is a no-op with one warning; tokens are still stored, so turning FCM on
 *   later reaches devices that already registered.
 * - The token lives encrypted in `iam.devices.push_token_encrypted`, on the
 *   account's own row of the app install (`appDeviceFingerprint`). On a shared
 *   phone each account has its row; registering clears the same token from
 *   the others, so pushes follow the account signed in last.
 * - `pushToUser` never throws and never logs tokens or notification content.
 */
@Injectable()
export class NativePushService {
  private readonly sender = readFcmSender();
  private warnedDisabled = false;

  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NativePushService.name);
  }

  /** `true` when FCM credentials are configured. */
  enabled(): boolean {
    return this.sender !== null;
  }

  /**
   * Saves (or refreshes) the FCM token of this install for this account.
   *
   * The row is the account's own (`appDeviceFingerprint`), the same one
   * `POST /iam/users/:id/devices` writes: another account's row is never
   * looked up by the client value. The same token on another account's row of
   * this install (a logout that never reached the API) is cleared, so only the
   * account signed in now receives pushes on a shared phone.
   */
  async registerToken(userId: string, input: NativeTokenInput): Promise<void> {
    const deviceFingerprint = appDeviceFingerprint(
      userId,
      input.deviceFingerprint,
    );
    await this.em.transactional(async (tx) => {
      const now = new Date();
      await this.clearFromOtherAccounts(tx, userId, input, now);
      const existing = await tx.findOne(Devices, { userId, deviceFingerprint });
      if (existing) {
        existing.platformConceptId = PLATFORM_CONCEPT[input.platform];
        existing.pushTokenEncrypted = sealToken(input.token);
        existing.lastSeenAt = now;
        existing.updatedAt = now;
        existing.updatedByUserId = userId;
        return;
      }
      tx.create(Devices, {
        userId,
        deviceFingerprint,
        platformConceptId: PLATFORM_CONCEPT[input.platform],
        name: DEVICE_NAME[input.platform],
        pushTokenEncrypted: sealToken(input.token),
        trusted: false,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
        createdByUserId: userId,
        updatedByUserId: userId,
        rowVersion: 1,
      });
    });
  }

  /** Only rows of the same install are opened: a handful, never a scan. */
  private async clearFromOtherAccounts(
    tx: EntityManager,
    userId: string,
    input: NativeTokenInput,
    now: Date,
  ): Promise<void> {
    const siblings = await tx.find(Devices, {
      userId: { $ne: userId },
      deviceFingerprint: {
        $like: `${appInstallPrefix(input.deviceFingerprint)}%`,
      },
      pushTokenEncrypted: { $ne: null },
    });
    for (const device of siblings) {
      if (openToken(device.pushTokenEncrypted!) !== input.token) continue;
      device.pushTokenEncrypted = undefined;
      device.updatedAt = now;
      device.updatedByUserId = userId;
    }
  }

  /** Forgets this FCM token on the account's devices. Idempotent. */
  async unregisterToken(userId: string, token: string): Promise<void> {
    await this.em.transactional(async (tx) => {
      const devices = await this.nativeDevices(tx, userId);
      for (const device of devices) {
        if (openToken(device.pushTokenEncrypted!) !== token) continue;
        device.pushTokenEncrypted = undefined;
        device.updatedAt = new Date();
        device.updatedByUserId = userId;
      }
    });
  }

  /** Pushes the notice to every native device of the account. */
  async pushToUser(message: NativePushMessage): Promise<void> {
    if (!this.sender) {
      this.warnOnceDisabled();
      return;
    }
    try {
      // Fire-and-forget: the caller transaction may already be committed.
      const em = this.em.fork({ keepTransactionContext: false });
      const devices = await this.nativeDevices(em, message.recipientUserId);
      const data = toData(message);
      for (const device of devices) {
        const token = openToken(device.pushTokenEncrypted!);
        if (!token) continue;
        const outcome = await sendFcm(this.sender, token, data);
        if (outcome.kind === 'gone') await this.forget(device.id);
        if (outcome.kind === 'failed') {
          this.logger.warn(
            {
              operation: 'messaging.native-push.device',
              deviceId: device.id,
              status: outcome.status,
              code: outcome.code,
            },
            'FCM rejected the native push',
          );
        }
      }
    } catch (error: unknown) {
      this.logger.warn(
        {
          operation: 'messaging.native-push.send',
          recipientUserId: message.recipientUserId,
          errorName: error instanceof Error ? error.name : 'unknown',
        },
        'Native push failed; the in-app notification is already stored',
      );
    }
  }

  private nativeDevices(em: EntityManager, userId: string): Promise<Devices[]> {
    return em.find(Devices, {
      userId,
      platformConceptId: { $in: [...NATIVE_CONCEPTS] },
      pushTokenEncrypted: { $ne: null },
    });
  }

  /** FCM said the token is dead: drop it so it is not retried forever. */
  private async forget(deviceId: string): Promise<void> {
    await this.em
      .fork({ keepTransactionContext: false })
      .transactional(async (tx) => {
        const device = await tx.findOne(Devices, { id: deviceId });
        if (device) device.pushTokenEncrypted = undefined;
      });
  }

  private warnOnceDisabled(): void {
    if (this.warnedDisabled) return;
    this.warnedDisabled = true;
    this.logger.warn(
      { operation: 'messaging.native-push.disabled' },
      'FCM_PROJECT_ID / FCM_SERVICE_ACCOUNT_JSON missing: native push is off',
    );
  }
}

/** Contract payload as the FCM `data` map (string values only). */
function toData(message: NativePushMessage): FcmData {
  return {
    notificationId: message.notificationId,
    route: safeRoute(message.route) ?? DEFAULT_PUSH_ROUTE,
    destinationType: message.destinationType ?? '',
    destinationId: message.destinationId ?? '',
    category: message.category ?? '',
  };
}
