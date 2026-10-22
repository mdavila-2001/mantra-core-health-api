import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from '../harness';
import { SEED, TokenService } from '../../../src/common';
import { resolveSecret } from '../../../src/common/crypto/dev-secret';
import { SIGNED_ACCESS } from '../../../src/modules/object_storage/constants';
import {
  BUCKET,
  configureMinioFromEnv,
  ensureBucket,
  s3,
  seedNamespace,
  seedObject,
  sqlOf,
} from './object-storage.fixture';

/**
 * MCH-009 · el enlace emitido es un acceso temporal, no la URI del proveedor.
 *
 * Contra PostgreSQL y MinIO reales: el objeto está de verdad en el bucket y la
 * descarga se hace por HTTP. Lo que se prueba no es que exista un token, sino
 * que los bytes bajan con él y dejan de bajar cuando deja de valer — un doble
 * del proveedor no distinguiría ambas cosas.
 *
 * **RED contra el código previo:** antes `POST …/signed-url` respondía
 * `{ providerUri: 's3://…' }` sin `url`, así que la primera prueba fallaba en
 * la aserción del enlace y todas las demás no tenían nada que canjear: la ruta
 * de descarga no existía (404 en cualquier token).
 */
describe('MCH-009 · acceso temporal real a un objeto (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  let namespace: { id: string; code: string };

  beforeAll(async () => {
    configureMinioFromEnv();
    ctx = await bootstrapTestApp();
    await ensureBucket(s3());
    namespace = await seedNamespace(ctx);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  /** Emite el enlace para una versión y devuelve el cuerpo de la respuesta. */
  async function emitir(
    versionId: string,
    body: Record<string, unknown> = {},
  ): Promise<{ url: string; method: string; expiresAt: string }> {
    const res = await http()
      .post(`/object-storage/versions/${versionId}/signed-url`)
      .set(bearer(ctx.adminToken))
      .send({ purposeOfUseCode: 'TREATMENT', ...body })
      .expect(201);
    return res.body;
  }

  /** Token con la firma correcta pero la caducidad que la prueba elija. */
  function forjarToken(claims: Record<string, unknown>): string {
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const secreto = resolveSecret(
      SIGNED_ACCESS.SECRET_ENV,
      SIGNED_ACCESS.INSECURE_DEV_SECRET,
      'firma del acceso temporal a objetos almacenados',
    );
    const firma = createHmac('sha256', secreto)
      .update(payload)
      .digest('base64url');
    return `${payload}.${firma}`;
  }

  it('AC01 · el enlace descarga los bytes reales del objeto permitido', async () => {
    const bytes = randomBytes(2048);
    const objeto = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes,
    });

    const emitido = await emitir(objeto.versionId);

    // No se filtra la ubicación interna: ni el esquema del proveedor aparece.
    expect(JSON.stringify(emitido)).not.toContain('s3://');
    expect(emitido.method).toBe('GET');
    expect(emitido.url).toMatch(
      new RegExp(`^/object-storage/versions/${objeto.versionId}/content/`),
    );

    const descarga = await http()
      .get(emitido.url)
      .set(bearer(ctx.adminToken))
      .responseType('blob')
      .expect(200);

    expect(Buffer.from(descarga.body)).toEqual(bytes);
    expect(descarga.headers['cache-control']).toContain('no-store');
  });

  it('AC03 · el TTL anunciado es el que aplica el servidor, no el que pide el cliente', async () => {
    const objeto = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const antes = Date.now();

    const emitido = await emitir(objeto.versionId, { expiresInSeconds: 86400 });

    const vence = new Date(emitido.expiresAt).getTime();
    expect(vence).toBeGreaterThan(antes);
    expect(vence).toBeLessThanOrEqual(
      antes + SIGNED_ACCESS.MAX_SECONDS * 1000 + 2000,
    );
  });

  it('AC03 · un enlace vencido no entrega bytes aunque su firma sea válida', async () => {
    const objeto = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const token = forjarToken({
      v: objeto.versionId,
      s: ctx.adminUserId,
      m: 'GET',
      exp: Math.floor(Date.now() / 1000) - 1,
      jti: randomUUID(),
    });

    await http()
      .get(`/object-storage/versions/${objeto.versionId}/content/${token}`)
      .set(bearer(ctx.adminToken))
      .expect(404);
  });

  it('AC02 · alterar la firma, la versión o el actor invalida el enlace', async () => {
    const objeto = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const otro = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const emitido = await emitir(objeto.versionId);
    const token = emitido.url.split('/').pop() as string;

    // Firma alterada: el último carácter cambia y el HMAC deja de cuadrar.
    const alterado = token.endsWith('A')
      ? `${token.slice(0, -1)}B`
      : `${token.slice(0, -1)}A`;
    await http()
      .get(`/object-storage/versions/${objeto.versionId}/content/${alterado}`)
      .set(bearer(ctx.adminToken))
      .expect(404);

    // El mismo token, apuntado a otra versión existente.
    await http()
      .get(`/object-storage/versions/${otro.versionId}/content/${token}`)
      .set(bearer(ctx.adminToken))
      .expect(404);

    // El token es de otra persona: una sesión válida no lo rescata.
    const ajeno = ctx.app
      .get(TokenService)
      .signAccessToken(
        randomUUID(),
        'mch009-ajeno',
        ['SUPERADMIN', 'STORAGE_ADMIN'],
        [SEED.tenantId],
      );
    await http()
      .get(`/object-storage/versions/${objeto.versionId}/content/${token}`)
      .set(bearer(ajeno))
      .expect(404);

    // Y el enlace legítimo sigue sirviendo: los rechazos no son un fallo global.
    await http()
      .get(emitido.url)
      .set(bearer(ctx.adminToken))
      .responseType('blob')
      .expect(200);
  });

  it('el enlace se revoca al cerrar el objeto, sin esperar a que caduque', async () => {
    const objeto = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const emitido = await emitir(objeto.versionId);

    await sqlOf(ctx)(
      `UPDATE object_storage.object_manifests
          SET lifecycle_state = 'pending_deletion' WHERE id = ?`,
      [objeto.manifestId],
    );

    await http().get(emitido.url).set(bearer(ctx.adminToken)).expect(422);
  });

  it('el objeto ausente en el bucket falla cerrado, sin caer a la URI interna', async () => {
    const objeto = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const emitido = await emitir(objeto.versionId);

    // La clave del catálogo apunta a un objeto que no existe en MinIO.
    await sqlOf(ctx)(
      'UPDATE object_storage.object_versions SET object_key = ? WHERE id = ?',
      [`f06/ausente-${randomUUID()}`, objeto.versionId],
    );

    const res = await http()
      .get(emitido.url)
      .set(bearer(ctx.adminToken))
      .expect(503);
    expect(JSON.stringify(res.body)).not.toContain(`s3://${BUCKET}`);
  });
});
