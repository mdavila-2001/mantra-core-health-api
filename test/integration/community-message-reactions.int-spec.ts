import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  identidadProfesional,
} from './harness';

/**
 * Reactions to direct messages (patch v4.2.91), end to end against Postgres.
 *
 * Bug of 2026-11-06: reacting to a chat message always failed because
 * `PUT /community/conversations/:id/messages/:messageId/reaction` was only
 * answered by the web mock. This suite proves the full chain: request →
 * persisted row → the reaction comes back when the thread is read again.
 */
describe('Reacciones a mensajes directos (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  let doctorToken: string;
  let doctorProfileId: string;
  let pacienteToken: string;
  let pacienteProfileId: string;
  let conversationId: string;
  let messageId: string;

  const claims = (raw: string): Record<string, unknown> =>
    JSON.parse(Buffer.from(raw.split('.')[1], 'base64url').toString('utf8'));

  const react = (token: string, profileId: string, emoji: string | null) =>
    http()
      .put(
        `/community/conversations/${conversationId}/messages/${messageId}/reaction`,
      )
      .set(bearer(token))
      .send({ profileId, emoji });

  const reloadedReactions = async () => {
    const page = await http()
      .get(`/community/conversations/${conversationId}/messages`)
      .query({ profileId: pacienteProfileId })
      .set(bearer(pacienteToken))
      .expect(200);
    return (page.body.items as { id: string; reactions: unknown }[]).find(
      (m) => m.id === messageId,
    )?.reactions;
  };

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const camposDePaciente = await camposObligatoriosDePaciente(ctx);
    const sufijo = randomUUID().slice(0, 8);

    const emailDoctor = `react-doc-${sufijo}@example.test`;
    await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(emailDoctor),
        email: emailDoctor,
        password: 'S3cret-passw0rd',
        name: 'Renata',
        lastName: 'Chávez',
        licenseNumber: `LIC-REACT-${sufijo}`,
        credentialNumber: `CRED-REACT-${sufijo}`,
      })
      .expect(201);
    doctorToken = (
      await http()
        .post('/iam/auth/login')
        .send({ email: emailDoctor, password: 'S3cret-passw0rd' })
        .expect(200)
    ).body.accessToken;
    const tenantId = (claims(doctorToken)['tenants'] as string[])[0];
    doctorProfileId = (
      await http()
        .put('/community/profiles/me')
        .set(bearer(doctorToken))
        .send({
          tenantId,
          slug: `react-doc-${sufijo}`,
          displayName: 'Dra. Renata',
        })
        .expect(200)
    ).body.id;

    const nationalId = `CI-REACT-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password: 'S3cret-passw0rd',
        name: 'Iván',
        lastName: 'Mamani',
        email: `react-pac-${sufijo}@example.test`,
      })
      .expect(201);
    pacienteToken = (
      await http()
        .post('/iam/auth/login')
        .send({ nationalId, password: 'S3cret-passw0rd' })
        .expect(200)
    ).body.accessToken;
    pacienteProfileId = (
      await http()
        .put('/community/profiles/me')
        .set(bearer(pacienteToken))
        .send({
          tenantId,
          slug: `react-pac-${sufijo}`,
          displayName: 'Iván Mamani',
          visibility: 'PUBLIC',
        })
        .expect(200)
    ).body.id;

    conversationId = (
      await http()
        .post('/community/conversations')
        .set(bearer(doctorToken))
        .send({ participantProfileIds: [doctorProfileId, pacienteProfileId] })
        .expect(201)
    ).body.id;
    messageId = (
      await http()
        .post(`/community/conversations/${conversationId}/messages`)
        .set(bearer(doctorToken))
        .send({ senderProfileId: doctorProfileId, bodyText: 'Hola Iván' })
        .expect(201)
    ).body.id;
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('reacting persists and the reaction comes back on reload', async () => {
    const res = await react(pacienteToken, pacienteProfileId, '❤️').expect(200);
    expect(res.body.reactions).toEqual([
      { emoji: '❤️', profileIds: [pacienteProfileId] },
    ]);
    expect(await reloadedReactions()).toEqual([
      { emoji: '❤️', profileIds: [pacienteProfileId] },
    ]);
  });

  it('one reaction per profile: another emoji replaces it, twice is idempotent', async () => {
    await react(pacienteToken, pacienteProfileId, '👍').expect(200);
    await react(pacienteToken, pacienteProfileId, '👍').expect(200);
    await react(doctorToken, doctorProfileId, '👍').expect(200);
    expect(await reloadedReactions()).toEqual([
      { emoji: '👍', profileIds: [pacienteProfileId, doctorProfileId] },
    ]);
  });

  it('emoji: null removes only the own reaction', async () => {
    await react(pacienteToken, pacienteProfileId, null).expect(200);
    expect(await reloadedReactions()).toEqual([
      { emoji: '👍', profileIds: [doctorProfileId] },
    ]);
  });

  it('a profile that is not the actor’s cannot react (fail closed)', async () => {
    const res = await react(pacienteToken, doctorProfileId, '😂');
    expect([403, 404]).toContain(res.status);
    expect(await reloadedReactions()).toEqual([
      { emoji: '👍', profileIds: [doctorProfileId] },
    ]);
  });

  it('rejects text, an oversized value or an omitted emoji with 400, not 500', async () => {
    await react(pacienteToken, pacienteProfileId, 'x'.repeat(40)).expect(400);
    await react(pacienteToken, pacienteProfileId, 'hola que tal').expect(400);
    await http()
      .put(
        `/community/conversations/${conversationId}/messages/${messageId}/reaction`,
      )
      .set(bearer(pacienteToken))
      .send({ profileId: pacienteProfileId })
      .expect(400);
    // None of them touched what was stored.
    expect(await reloadedReactions()).toEqual([
      { emoji: '👍', profileIds: [doctorProfileId] },
    ]);
  });
});
