import { randomUUID } from 'node:crypto';
import { jest } from '@jest/globals';
import pg from 'pg';
import request from 'supertest';
import webpush from 'web-push';
import { decryptSecret } from '../../src/common/crypto/secret-cipher';
import { appInstallPrefix } from '../../src/modules/iam/domain/app-device-fingerprint';
import {
  NativePushService,
  type NativePushMessage,
} from '../../src/modules/messaging/services/native-push.service';
import { WebPushService } from '../../src/modules/messaging/services/web-push.service';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  identidadProfesional,
} from './harness';

/**
 * Push notifications end to end against Postgres (commit 32020b53): native
 * tokens on per-account device rows of a shared phone, the second account's
 * device registration (it used to collide), a real in-app notice readable from
 * the bell and pushed only after COMMIT with a deep-link route (never
 * `/notifications`, an API prefix), and the VAPID config.
 *
 * `RLS_ENFORCE=true`, the compose default, makes each request one transaction
 * (`TenantContextInterceptor`): a push fired before COMMIT would not see the
 * row from another connection. The harness seeds through the app connection,
 * so it runs as the owner role (the runtime role cannot seed under RLS).
 */
const previousRlsEnforce = process.env.RLS_ENFORCE;
process.env.RLS_ENFORCE = 'true';
const VAPID = webpush.generateVAPIDKeys();
process.env.VAPID_PUBLIC_KEY = VAPID.publicKey;
process.env.VAPID_PRIVATE_KEY = VAPID.privateKey;
process.env.VAPID_SUBJECT = 'mailto:push-it@example.test';

const PASSWORD = 'S3cret-passw0rd';

type DeviceRow = Record<'id' | 'user_id' | 'device_fingerprint', string> & {
  push_token_encrypted: string | null;
};
const SEEN_SQL = 'select 1 from messaging.in_app_notifications where id = $1';

/** `committed`: another connection saw the inbox row when the push started. */
type PushCall = NativePushMessage & { sender: string; committed: boolean };

describe('Push web y nativo (integración)', () => {
  let ctx: TestContext;
  let owner: pg.Pool;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const pushCalls: Promise<PushCall>[] = [];

  let doctorToken: string;
  let doctorProfileId: string;
  let tenantId: string;
  const pacientes: { token: string; userId: string }[] = [];

  const claims = (raw: string): Record<string, unknown> =>
    JSON.parse(Buffer.from(raw.split('.')[1], 'base64url').toString('utf8'));

  const devicesOfInstall = async (install: string): Promise<DeviceRow[]> =>
    (
      await owner.query<DeviceRow>(
        `select id, user_id, device_fingerprint, push_token_encrypted
           from iam.devices where device_fingerprint like $1 order by created_at`,
        [`${appInstallPrefix(install)}%`],
      )
    ).rows;

  const sealedToken = (row: DeviceRow | undefined): unknown =>
    row?.push_token_encrypted
      ? JSON.parse(decryptSecret(row.push_token_encrypted))
      : null;

  /** Public sign-up, then a real login: the token carries the real session. */
  const signUp = async (path: string, body: Record<string, unknown>) => {
    const by = path === 'register-patient' ? 'nationalId' : 'email';
    const account = { ...body, password: PASSWORD };
    await http().post(`/iam/auth/${path}`).send(account).expect(201);
    const res = await http()
      .post('/iam/auth/login')
      .send({ [by]: body[by], password: PASSWORD })
      .expect(200);
    const token = res.body.accessToken as string;
    return { token, userId: claims(token)['sub'] as string };
  };
  const registerPatient = async (tag: string) =>
    signUp('register-patient', {
      ...(await camposObligatoriosDePaciente(ctx)),
      nationalId: `CI-PUSH-${tag}-${sufijo}`,
      name: `Paciente ${tag}`,
      lastName: 'Push',
      email: `push-${tag}-${sufijo}@example.test`,
    });
  /** Community profile of the account (a conversation participant). */
  const showcase = async (token: string, body: Record<string, unknown>) =>
    (
      await http()
        .put('/community/profiles/me')
        .set(bearer(token))
        .send({ tenantId, ...body })
        .expect(200)
    ).body.id as string;

  /** Spies a sender through DI; records whether the row was committed, then calls through. */
  const spyOn = (
    sender: 'web' | 'native',
    service: WebPushService | NativePushService,
  ) => {
    const original = service.pushToUser.bind(service);
    jest.spyOn(service, 'pushToUser').mockImplementation((message) => {
      const seen = owner
        .query(SEEN_SQL, [message.notificationId])
        .then(
          (r) =>
            ({ sender, ...message, committed: r.rowCount === 1 }) as PushCall,
        );
      pushCalls.push(seen);
      return seen.then(() => original(message as never));
    });
  };

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    owner = new pg.Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5434),
      user: process.env.DB_USER ?? 'mantra',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME ?? 'mantra_redesa_health',
    });

    const emailDoctor = `push-doc-${sufijo}@example.test`;
    doctorToken = (
      await signUp('register-practitioner', {
        ...identidadProfesional(emailDoctor),
        email: emailDoctor,
        name: 'Renata',
        lastName: 'Push',
        licenseNumber: `LIC-PUSH-${sufijo}`,
        credentialNumber: `CRED-PUSH-${sufijo}`,
      })
    ).token;
    tenantId = (claims(doctorToken)['tenants'] as string[])[0];
    doctorProfileId = await showcase(doctorToken, {
      slug: `push-doc-${sufijo}`,
      displayName: 'Dra. Renata',
    });

    pacientes.push(await registerPatient('a'), await registerPatient('b'));
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await owner?.end();
    await ctx?.app.close();
    if (previousRlsEnforce === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = previousRlsEnforce;
  });

  it('native token: each account keeps its own row; only the same token is cleared from the other', async () => {
    const [a, b] = pacientes;
    const install = `install-${randomUUID()}`;
    const fcmToken = `fcm-${randomUUID()}`;
    const put = (token: string) =>
      http().put('/notifications/native-push/token').set(bearer(token)).send({
        token: fcmToken,
        platform: 'ANDROID',
        deviceFingerprint: install,
      });

    await put(a.token).expect(204);
    const [rowA] = await devicesOfInstall(install);
    expect(rowA.user_id).toBe(a.userId);
    expect(rowA.push_token_encrypted).not.toContain(fcmToken);
    expect(sealedToken(rowA)).toEqual({ fcm: fcmToken });

    await put(b.token).expect(204);
    const afterB = await devicesOfInstall(install);
    expect(afterB.map((r) => r.user_id)).toEqual([a.userId, b.userId]);
    expect(afterB[0].id).toBe(rowA.id);
    expect(afterB[0].device_fingerprint).toBe(rowA.device_fingerprint);
    expect(afterB[0].push_token_encrypted).toBeNull();
    expect(sealedToken(afterB[1])).toEqual({ fcm: fcmToken });

    await http()
      .delete('/notifications/native-push/token')
      .set(bearer(b.token))
      .send({ token: fcmToken })
      .expect(204);
    const afterDelete = await devicesOfInstall(install);
    expect(afterDelete.map((r) => r.push_token_encrypted)).toEqual([
      null,
      null,
    ]);
  });

  it('POST /iam/users/:id/devices: two accounts with the same fingerprint both get 201', async () => {
    const install = `shared-phone-${randomUUID()}`;
    const register = (p: { token: string; userId: string }) =>
      http().post(`/iam/users/${p.userId}/devices`).set(bearer(p.token)).send({
        deviceFingerprint: install,
        platform: 'ANDROID',
        name: 'Pixel',
      });

    const first = await register(pacientes[0]).expect(201);
    const second = await register(pacientes[1]).expect(201);
    expect(second.body.id).not.toBe(first.body.id);
    // A repeated sign-in refreshes the own row instead of creating another.
    const again = await register(pacientes[0]).expect(201);
    expect(again.body.id).toBe(first.body.id);

    const rows = await devicesOfInstall(install);
    expect(rows.map((r) => [r.id, r.user_id])).toEqual([
      [first.body.id, pacientes[0].userId],
      [second.body.id, pacientes[1].userId],
    ]);
    expect(rows[0].device_fingerprint).not.toBe(rows[1].device_fingerprint);
    // The raw install key is never stored.
    expect(rows.map((r) => r.device_fingerprint).join()).not.toContain(install);
  });

  it('a direct message reaches the bell and is pushed after COMMIT with a deep-link route', async () => {
    const recipient = pacientes[0];
    spyOn('web', ctx.app.get(WebPushService));
    spyOn('native', ctx.app.get(NativePushService));
    const patientProfileId = await showcase(recipient.token, {
      slug: `push-pac-${sufijo}`,
      displayName: 'Paciente A',
      visibility: 'PUBLIC',
    });
    const conversationId = (
      await http()
        .post('/community/conversations')
        .set(bearer(doctorToken))
        .send({ participantProfileIds: [doctorProfileId, patientProfileId] })
        .expect(201)
    ).body.id;
    await http()
      .post(`/community/conversations/${conversationId}/messages`)
      .set(bearer(doctorToken))
      .send({ senderProfileId: doctorProfileId, bodyText: 'Hola' })
      .expect(201);

    const stored = await owner.query<{ id: string }>(
      `select id from messaging.in_app_notifications
        where recipient_user_id = $1 and related_resource_type = 'CONVERSATION'
          and related_resource_id = $2`,
      [recipient.userId, conversationId],
    );
    expect(stored.rows).toHaveLength(1);
    const notificationId = stored.rows[0].id;

    const bell = await http()
      .get('/notifications/me')
      .set(bearer(recipient.token))
      .expect(200);
    expect(bell.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: notificationId,
          category: 'MESSAGES',
          unread: true,
          destination: { type: 'CONVERSATION', id: conversationId },
        }),
      ]),
    );

    const calls = (await Promise.all(pushCalls)).filter(
      (c) => c.notificationId === notificationId,
    );
    expect(calls.map((c) => c.sender).sort()).toEqual(['native', 'web']);
    for (const call of calls) {
      expect(call).toMatchObject({
        recipientUserId: recipient.userId,
        committed: true,
        route: `/messaging/${conversationId}?responder=1`,
        destinationType: 'CONVERSATION',
        destinationId: conversationId,
      });
      expect(call.route).not.toBe('/notifications');
    }
  });

  it('web push config reflects the VAPID environment', async () => {
    const res = await http()
      .get('/notifications/web-push/config')
      .set(bearer(pacientes[1].token))
      .expect(200);
    expect(res.body).toEqual({ enabled: true, publicKey: VAPID.publicKey });
  });
});
