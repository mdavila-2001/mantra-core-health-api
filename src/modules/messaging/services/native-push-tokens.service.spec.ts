import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import {
  decryptSecret,
  encryptSecret,
} from '../../../common/crypto/secret-cipher';
import { appDeviceFingerprint } from '../../iam/domain/app-device-fingerprint';
import { NativePushService } from './native-push.service';

const platformIos = CONCEPTS.PLATFORM_IOS;
const platformAndroid = CONCEPTS.PLATFORM_ANDROID;
const seal = (token: string) => encryptSecret(JSON.stringify({ fcm: token }));

function build(devices: any[] = []) {
  // Minimal MikroORM filter: equality, `$ne`, `$like 'prefix%'` and `$in`.
  const is = (value: any, cond: any) =>
    cond === undefined ||
    (cond?.$ne !== undefined
      ? value !== cond.$ne
      : cond?.$like !== undefined
        ? String(value ?? '').startsWith(cond.$like.replace(/%$/, ''))
        : value === cond);
  const matches = (d: any, where: any) =>
    is(d.id, where.id) &&
    is(d.userId, where.userId) &&
    is(d.deviceFingerprint, where.deviceFingerprint) &&
    (where.platformConceptId === undefined ||
      where.platformConceptId.$in.includes(d.platformConceptId)) &&
    (where.pushTokenEncrypted === undefined || d.pushTokenEncrypted);
  const tx: any = {
    findOne: jest.fn(async (_e: unknown, where: any) =>
      devices.find((d) => matches(d, where)),
    ),
    find: jest.fn(async (_e: unknown, where: any) =>
      devices.filter((d) => matches(d, where)),
    ),
    create: jest.fn((_e: unknown, data: any) => {
      devices.push({ id: `d${devices.length + 1}`, ...data });
    }),
  };
  const forked = { ...tx, transactional: (cb: any) => cb(tx) };
  const em: any = { transactional: (cb: any) => cb(tx), fork: () => forked };
  const logger: any = { setContext: jest.fn(), warn: jest.fn() };
  return { service: new NativePushService(em, logger), devices, logger };
}

describe('NativePushService tokens', () => {
  it('registerToken creates the account row of the install, token encrypted', async () => {
    const d = build();
    await d.service.registerToken('u1', {
      token: 'tok',
      platform: 'ANDROID',
      deviceFingerprint: 'fp1',
    });
    expect(d.devices).toHaveLength(1);
    expect(d.devices[0]).toMatchObject({
      userId: 'u1',
      // Same derivation as `POST /iam/users/:id/devices`: one row per account.
      deviceFingerprint: appDeviceFingerprint('u1', 'fp1'),
      platformConceptId: platformAndroid,
      trusted: false,
    });
    expect(d.devices[0].pushTokenEncrypted).not.toContain('tok');
    expect(JSON.parse(decryptSecret(d.devices[0].pushTokenEncrypted))).toEqual({
      fcm: 'tok',
    });
  });

  it('registerToken refreshes the own row and keeps its trust mark', async () => {
    const d = build([
      {
        id: 'd1',
        userId: 'u1',
        deviceFingerprint: appDeviceFingerprint('u1', 'fp1'),
        trusted: true,
        pushTokenEncrypted: seal('old'),
      },
    ]);
    await d.service.registerToken('u1', {
      token: 'new',
      platform: 'IOS',
      deviceFingerprint: 'fp1',
    });
    expect(d.devices).toHaveLength(1);
    expect(d.devices[0]).toMatchObject({
      userId: 'u1',
      platformConceptId: platformIos,
      trusted: true,
    });
    expect(JSON.parse(decryptSecret(d.devices[0].pushTokenEncrypted))).toEqual({
      fcm: 'new',
    });
  });

  it('shared phone: a second account gets its own row and the same token leaves the first', async () => {
    const first = {
      id: 'd1',
      userId: 'u2',
      deviceFingerprint: appDeviceFingerprint('u2', 'fp1'),
      platformConceptId: platformIos,
      trusted: true,
      pushTokenEncrypted: seal('tok'),
    };
    const d = build([first]);
    await d.service.registerToken('u1', {
      token: 'tok',
      platform: 'IOS',
      deviceFingerprint: 'fp1',
    });
    expect(d.devices).toHaveLength(2);
    expect(first).toMatchObject({ userId: 'u2', trusted: true });
    expect(first.pushTokenEncrypted).toBeUndefined();
    expect(d.devices[1]).toMatchObject({
      userId: 'u1',
      deviceFingerprint: appDeviceFingerprint('u1', 'fp1'),
    });
  });

  it('attack: a replayed fingerprint never takes over or silences another account', async () => {
    // Victim rows: a native row on another install key, a login row
    // (bare sha256) and a browser push row. The attacker sends each stored
    // value, and the victim's install key, as its own fingerprint.
    const victimApp = {
      id: 'd1',
      userId: 'victim',
      deviceFingerprint: appDeviceFingerprint('victim', 'fpV'),
      platformConceptId: platformAndroid,
      trusted: true,
      pushTokenEncrypted: seal('victim-token'),
    };
    const login = {
      id: 'd2',
      userId: 'victim',
      deviceFingerprint: 'a'.repeat(64),
      platformConceptId: platformAndroid,
      trusted: true,
    };
    const web = {
      id: 'd3',
      userId: 'victim',
      deviceFingerprint: 'webpush:abc',
      pushTokenEncrypted: 'sealed-web',
    };
    const d = build([victimApp, login, web]);
    const before = JSON.stringify([victimApp, login, web]);
    for (const deviceFingerprint of [
      'fpV',
      victimApp.deviceFingerprint,
      login.deviceFingerprint,
      web.deviceFingerprint,
    ]) {
      await d.service.registerToken('attacker', {
        token: 'attacker-token',
        platform: 'ANDROID',
        deviceFingerprint,
      });
    }
    expect(JSON.stringify([victimApp, login, web])).toBe(before);
    expect(d.devices.slice(3).every((x) => x.userId === 'attacker')).toBe(true);
  });

  it('unregisterToken clears only the matching token of the account', async () => {
    const d = build([
      {
        id: 'd1',
        userId: 'u1',
        platformConceptId: platformIos,
        pushTokenEncrypted: seal('a'),
      },
      {
        id: 'd2',
        userId: 'u1',
        platformConceptId: platformAndroid,
        pushTokenEncrypted: seal('b'),
      },
      {
        id: 'd3',
        userId: 'u2',
        platformConceptId: platformIos,
        pushTokenEncrypted: seal('a'),
      },
    ]);
    await d.service.unregisterToken('u1', 'a');
    expect(d.devices.map((x) => Boolean(x.pushTokenEncrypted))).toEqual([
      false,
      true,
      true,
    ]);
  });
});
