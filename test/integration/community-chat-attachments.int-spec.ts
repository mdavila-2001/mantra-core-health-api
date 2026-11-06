import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  identidadProfesional,
} from './harness';
import { STICKER_PACK_FILE_IDS } from '../../src/common';

/**
 * Chat attachments end to end: upload → send → read.
 *
 * The client sends an attachment without caption as `bodyText: ''`. The DTO
 * rejected it (`@MinLength(1)`) with a 400, so voice notes, pack stickers,
 * own stickers and uncaptioned photos never became messages, and retrying
 * failed the same way. An own sticker also travels as `contentType:
 * 'STICKER'`, which the DTO did not know.
 */
describe('Adjuntos del chat: nota de voz y stickers (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  let token: string;
  let profileId: string;
  let conversationId: string;

  const WEBM = Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01]),
    Buffer.from([0x42, 0x82, 0x84]),
    Buffer.from('webm'),
    Buffer.alloc(64, 0x01),
  ]);
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(64, 0x01),
  ]);

  async function upload(
    bytes: Buffer,
    category: 'DOCUMENT' | 'IMAGE',
    name: string,
  ): Promise<string> {
    const res = await http()
      .post('/common/files/upload')
      .set(bearer(token))
      .field('category', category)
      .field('sensitivity', 'PHI')
      .attach('file', bytes, { filename: name })
      .expect(201);
    return res.body.id as string;
  }

  const send = (body: Record<string, unknown>) =>
    http()
      .post(`/community/conversations/${conversationId}/messages`)
      .set(bearer(token))
      .send({ senderProfileId: profileId, ...body });

  async function readBack(messageId: string) {
    const res = await http()
      .get(`/community/conversations/${conversationId}/messages`)
      .query({ profileId })
      .set(bearer(token))
      .expect(200);
    return (res.body.items as Array<Record<string, unknown>>).find(
      (m) => m.id === messageId,
    );
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const sufijo = randomUUID().slice(0, 8);
    const email = `adj-doc-${sufijo}@example.test`;
    await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: 'S3cret-passw0rd',
        name: 'Renata',
        lastName: 'Chávez',
        licenseNumber: `LIC-ADJ-${sufijo}`,
        credentialNumber: `CRED-ADJ-${sufijo}`,
      })
      .expect(201);
    const doctorToken = (
      await http()
        .post('/iam/auth/login')
        .send({ email, password: 'S3cret-passw0rd' })
        .expect(200)
    ).body.accessToken as string;
    const tenantId = (
      JSON.parse(
        Buffer.from(doctorToken.split('.')[1], 'base64url').toString('utf8'),
      ) as { tenants: string[] }
    ).tenants[0];
    const doctorProfileId = (
      await http()
        .put('/community/profiles/me')
        .set(bearer(doctorToken))
        .send({ tenantId, slug: `adj-doc-${sufijo}`, displayName: 'Dra. R' })
        .expect(200)
    ).body.id as string;

    const nationalId = `CI-ADJ-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...(await camposObligatoriosDePaciente(ctx)),
        nationalId,
        password: 'S3cret-passw0rd',
        name: 'Iván',
        lastName: 'Mamani',
        email: `adj-pac-${sufijo}@example.test`,
      })
      .expect(201);
    token = (
      await http()
        .post('/iam/auth/login')
        .send({ nationalId, password: 'S3cret-passw0rd' })
        .expect(200)
    ).body.accessToken as string;
    profileId = (
      await http()
        .put('/community/profiles/me')
        .set(bearer(token))
        .send({
          tenantId,
          slug: `adj-pac-${sufijo}`,
          displayName: 'Iván Mamani',
          visibility: 'PUBLIC',
        })
        .expect(200)
    ).body.id as string;
    conversationId = (
      await http()
        .post('/community/conversations')
        .set(bearer(doctorToken))
        .send({ participantProfileIds: [doctorProfileId, profileId] })
        .expect(201)
    ).body.id as string;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('una nota de voz sin texto se envía y se lee como MEDIA', async () => {
    const fileId = await upload(WEBM, 'DOCUMENT', 'nota.webm');
    const sent = await send({
      bodyText: '',
      contentType: 'MEDIA',
      attachmentFileId: fileId,
    }).expect(201);
    const read = await readBack(sent.body.id);
    expect(read).toMatchObject({
      attachmentFileId: fileId,
      contentType: 'MEDIA',
      bodyText: null,
    });
  });

  it('un sticker del paquete sin texto se envía', async () => {
    const sent = await send({
      bodyText: '',
      contentType: 'MEDIA',
      attachmentFileId: STICKER_PACK_FILE_IDS[0],
    }).expect(201);
    expect(await readBack(sent.body.id)).toMatchObject({
      attachmentFileId: STICKER_PACK_FILE_IDS[0],
    });
  });

  it('un sticker propio viaja y se lee como STICKER', async () => {
    const fileId = await upload(PNG, 'IMAGE', 'sticker.png');
    const sent = await send({
      bodyText: '',
      contentType: 'STICKER',
      attachmentFileId: fileId,
    }).expect(201);
    expect(await readBack(sent.body.id)).toMatchObject({
      attachmentFileId: fileId,
      contentType: 'STICKER',
    });
  });

  it('un sticker propio tiene que ser una imagen', async () => {
    const fileId = await upload(WEBM, 'DOCUMENT', 'nota.webm');
    await send({
      contentType: 'STICKER',
      attachmentFileId: fileId,
    }).expect(422);
  });

  it('un sticker sin adjunto, o un mensaje sin texto ni adjunto, se rechaza', async () => {
    await send({ contentType: 'STICKER' }).expect(400);
    await send({ bodyText: '   ' }).expect(400);
    await send({}).expect(400);
  });

  it('el texto sigue funcionando y se lee como TEXT', async () => {
    const sent = await send({ bodyText: 'hola' }).expect(201);
    expect(await readBack(sent.body.id)).toMatchObject({
      bodyText: 'hola',
      contentType: 'TEXT',
    });
  });
});
