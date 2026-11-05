import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createHash } from 'node:crypto';
import { CONCEPTS, touch } from '../../../../common';
import { DevicesRepository } from '../../infrastructure/repositories';

/**
 * Login request headers: `x-device-id` is the stable per-install key the client
 * generates and keeps; `user-agent` names the device.
 */
export type LoginClient = Readonly<
  Record<string, string | string[] | undefined>
>;

const header = (client: LoginClient, name: string): string | undefined => {
  const value = client[name];
  return Array.isArray(value) ? value[0] : value;
};

const DEVICE_KEY = /^[A-Za-z0-9-]{8,128}$/;

/**
 * Detects the device a session is opened from (UC-01-05, login side).
 *
 * The fingerprint is `sha256(userId:key)`: `iam.devices.device_fingerprint` is unique across
 * accounts, so two people sharing a browser must not collide, and the raw client key is never
 * stored. Without a usable key the user agent stands in, which groups identical browsers.
 */
@Injectable()
export class IamLoginDevicesService {
  constructor(private readonly devicesRepo: DevicesRepository) {}

  /** Finds or registers the device and stamps `last_seen_at`. Returns its id. */
  async link(
    tx: EntityManager,
    userId: string,
    client: LoginClient = {},
  ): Promise<string> {
    const deviceKey = header(client, 'x-device-id') ?? '';
    const userAgent = header(client, 'user-agent');
    const key = DEVICE_KEY.test(deviceKey)
      ? deviceKey
      : `ua:${userAgent ?? 'unknown'}`;
    const fingerprint = createHash('sha256')
      .update(`${userId}:${key}`)
      .digest('hex');
    const ua = describeUserAgent(userAgent);
    const known = await this.devicesRepo.findByFingerprint(tx, fingerprint);
    if (known) {
      known.lastSeenAt = new Date();
      known.name = ua.name;
      touch(known, userId);
      return known.id;
    }
    const device = this.devicesRepo.create(tx, {
      userId,
      deviceFingerprint: fingerprint,
      platformConceptId: ua.platformConceptId,
      name: ua.name,
      actorUserId: userId,
    });
    device.lastSeenAt = new Date();
    // `iam.sessions.device_id` has a non-deferred FK: the device row goes first.
    await tx.flush();
    return device.id;
  }
}

const BROWSERS: readonly [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
  [/Dart\//, 'App AloVida'],
];

const SYSTEMS: readonly [RegExp, string, string][] = [
  [/Android/, 'Android', CONCEPTS.PLATFORM_ANDROID],
  [/iPhone|iPad|iOS/, 'iOS', CONCEPTS.PLATFORM_IOS],
  [/Windows/, 'Windows', CONCEPTS.PLATFORM_WEB],
  [/Mac OS X|Macintosh/, 'macOS', CONCEPTS.PLATFORM_WEB],
  [/Linux/, 'Linux', CONCEPTS.PLATFORM_WEB],
];

/** «Chrome en Windows», plus the platform concept. Pure, for its spec. */
export function describeUserAgent(userAgent = ''): {
  name: string;
  platformConceptId?: string;
} {
  const browser = BROWSERS.find(([re]) => re.test(userAgent))?.[1];
  const system = SYSTEMS.find(([re]) => re.test(userAgent));
  if (!browser && !system) return { name: 'Dispositivo desconocido' };
  const name = [browser ?? 'Navegador', system?.[1]]
    .filter(Boolean)
    .join(' en ');
  return { name, platformConceptId: system?.[2] ?? CONCEPTS.PLATFORM_WEB };
}
