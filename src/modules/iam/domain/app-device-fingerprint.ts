import { createHash } from 'node:crypto';

/**
 * Prefix of the `iam.devices` rows of a mobile app install. Login rows are a
 * bare sha256 and browser push rows start with `webpush:`, so a client value
 * can never land on one of them.
 */
export const APP_DEVICE_PREFIX = 'app:';

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

/**
 * Stored fingerprint of one app install for one account:
 * `app:<sha256(install)>:<sha256(userId:install)>`.
 *
 * - The account part makes the row per account: a second account on a shared
 *   phone gets its own row instead of colliding with (or taking over) the
 *   first one's on `uq_devices_device_fingerprint`.
 * - The install part is shared by every account of that install, so the
 *   install can be found again (`appInstallPrefix`) without the raw key,
 *   which is never stored.
 */
export function appDeviceFingerprint(
  userId: string,
  installKey: string,
): string {
  return `${appInstallPrefix(installKey)}${sha256(`${userId}:${installKey}`)}`;
}

/** `LIKE` prefix shared by the rows of every account on one install. */
export function appInstallPrefix(installKey: string): string {
  return `${APP_DEVICE_PREFIX}${sha256(installKey)}:`;
}
