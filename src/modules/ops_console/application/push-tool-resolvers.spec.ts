import { describe, expect, it } from '@jest/globals';
import { readFcmSender } from '../../messaging/services/native-push.fcm';
import { isFcmServiceAccountJson } from './push-tool-resolvers';

describe('isFcmServiceAccountJson', () => {
  // The ops console must report exactly what the sender will do.
  it.each([
    ['not json'],
    ['null'],
    ['[]'],
    ['{}'],
    [JSON.stringify({ client_email: 'a@b.c' })],
    [JSON.stringify({ client_email: 1, private_key: 'k' })],
    [JSON.stringify({ client_email: 'a@b.c', private_key: 'k' })],
  ])('agrees with readFcmSender for %s', (raw) => {
    const env = { FCM_PROJECT_ID: 'p', FCM_SERVICE_ACCOUNT_JSON: raw };
    expect(isFcmServiceAccountJson(raw)).toBe(readFcmSender(env) !== null);
  });
});
