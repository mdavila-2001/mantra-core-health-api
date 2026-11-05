import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { FileVersions, Files } from '../../src/modules/common/entities';

/**
 * Chat voice notes: the browser records WebM (Chrome), Ogg (Firefox) or
 * MP4/M4A (Safari) and uploads it as DOCUMENT/PHI. Before the fix the byte
 * sniffing knew no audio and every voice note died with «El contenido no
 * corresponde a ningún formato de archivo permitido».
 */
describe('Subida de notas de voz del chat (integración)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  /** Minimal recordings with the real container headers. */
  const RECORDINGS = [
    {
      name: 'nota.webm',
      declared: 'audio/webm;codecs=opus',
      expected: 'audio/webm',
      bytes: Buffer.concat([
        Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01]),
        Buffer.from([0x42, 0x82, 0x84]),
        Buffer.from('webm'),
        Buffer.alloc(64, 0x01),
      ]),
    },
    {
      name: 'nota.ogg',
      declared: 'audio/ogg',
      expected: 'audio/ogg',
      bytes: Buffer.concat([Buffer.from('OggS'), Buffer.alloc(64, 0x01)]),
    },
    {
      name: 'nota.m4a',
      declared: 'audio/mp4',
      expected: 'audio/mp4',
      bytes: Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x1c]),
        Buffer.from('ftypiso5'),
        Buffer.alloc(64, 0x01),
      ]),
    },
  ];

  it.each(RECORDINGS)(
    'acepta $name como DOCUMENT y persiste el tipo real',
    async ({ name, declared, expected, bytes }) => {
      const res = await http()
        .post('/common/files/upload')
        .set(bearer(ctx.adminToken))
        .field('category', 'DOCUMENT')
        .field('sensitivity', 'PHI')
        .attach('file', bytes, { filename: name, contentType: declared })
        .expect(201);

      const em = ctx.orm.em.fork();
      const file = await em.findOneOrFail(Files, { id: res.body.id });
      const version = await em.findOneOrFail(FileVersions, {
        id: file.currentVersionId!,
      });
      expect(version.mimeType).toBe(expected);
    },
  );

  it('rechaza audio declarado como IMAGE', async () => {
    await http()
      .post('/common/files/upload')
      .set(bearer(ctx.adminToken))
      .field('category', 'IMAGE')
      .field('sensitivity', 'PHI')
      .attach('file', RECORDINGS[0].bytes, {
        filename: 'nota.webm',
        contentType: 'audio/webm',
      })
      .expect(422);
  });
});
