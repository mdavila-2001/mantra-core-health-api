import { jest } from '@jest/globals';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from '../harness';
import { SEED } from '../../../src/common';
import { PublicSearchRepository } from '../../../src/modules/community/repositories';
import { PublicCacheStore } from '../../../src/common/http/public-cache.store';

/**
 * MCH-028 · el `ETag` se calculaba después de `next.handle()`: un 304
 * ahorraba bytes de red, pero la consulta cara del feed público —la que
 * arma `PublicSearchRepository.listFeedPublico`— ya había corrido igual.
 *
 * Acá se prueba contra Postgres real y contando invocaciones reales del
 * repositorio, no una impresión: `jest.spyOn` sobre el provider que Nest ya
 * instanció, no un mock que reemplace la cadena entera. Un espía cuenta lo
 * mismo haya cache o no; lo que cambia es cuántas veces se lo llama.
 */
describe('MCH-028 · caché de representación evita la consulta en 304 (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const auth = () => bearer(ctx.adminToken);
  const u = Date.now();

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(() => {
    // Cada caso arranca con el store vacío: si quedara algo de un caso
    // anterior, el primer GET del caso siguiente ya sería un cache hit y la
    // medición de la línea base (una llamada real) daría un falso positivo.
    ctx.app.get(PublicCacheStore).clear();
  });

  /** Crea un perfil público visible en el directorio y devuelve su id. */
  async function perfilPublico(suffix: string): Promise<string> {
    const res = await http()
      .post('/community/public-profiles')
      .set(auth())
      .send({
        tenantId: SEED.tenantId,
        targetId: ctx.adminUserId,
        slug: `mch028-${suffix}-${u}`,
        displayName: `MCH-028 ${suffix}`,
        visibility: 'PUBLIC',
      })
      .expect(201);
    return res.body.id as string;
  }

  /** Publica un post PUBLIC del perfil dado. */
  async function publicar(profileId: string, bodyText: string): Promise<void> {
    await http()
      .post(`/community/profiles/${profileId}/posts`)
      .set(auth())
      .send({ bodyText, visibility: 'PUBLIC' })
      .expect(201);
  }

  it('una relectura con If-None-Match no vuelve a consultar el repositorio', async () => {
    const repo = ctx.app.get(PublicSearchRepository);
    const espia = jest.spyOn(repo, 'listFeedPublico');
    const llamadasAntes = espia.mock.calls.length;

    const primero = await http().get('/public/posts').expect(200);
    const etag = primero.headers['etag'] as string;
    expect(etag).toBeTruthy();
    expect(espia.mock.calls.length).toBe(llamadasAntes + 1);

    const segundo = await http()
      .get('/public/posts')
      .set('If-None-Match', etag)
      .expect(304);

    // La prueba real: el conteo de llamadas al repositorio NO subió. Antes de
    // este cambio, el handler corría igual y esta aserción fallaba.
    expect(espia.mock.calls.length).toBe(llamadasAntes + 1);
    expect(segundo.body).toEqual({});

    espia.mockRestore();
  });

  it('una relectura sin If-None-Match dentro del max-age sirve el cuerpo cacheado, sin repetir la consulta', async () => {
    const repo = ctx.app.get(PublicSearchRepository);
    const espia = jest.spyOn(repo, 'listFeedPublico');
    const llamadasAntes = espia.mock.calls.length;

    const primero = await http().get('/public/posts').expect(200);
    expect(espia.mock.calls.length).toBe(llamadasAntes + 1);

    const segundo = await http().get('/public/posts').expect(200);

    expect(espia.mock.calls.length).toBe(llamadasAntes + 1);
    expect(segundo.body).toEqual(primero.body);
    expect(segundo.headers['etag']).toBe(primero.headers['etag']);

    espia.mockRestore();
  });

  it('publicar un post invalida la caché: el feed vuelve a consultar y trae el post nuevo', async () => {
    const repo = ctx.app.get(PublicSearchRepository);
    const espia = jest.spyOn(repo, 'listFeedPublico');
    const llamadasAntes = espia.mock.calls.length;

    const primero = await http().get('/public/posts').expect(200);
    expect(espia.mock.calls.length).toBe(llamadasAntes + 1);
    const etagPrevio = primero.headers['etag'] as string;

    const profileId = await perfilPublico('invalidacion');
    await publicar(profileId, `mch028-invalidacion-${u}`);

    // Mismo If-None-Match que antes de escribir: si la caché no se hubiera
    // invalidado, esto contestaría 304 con el post nuevo todavía invisible.
    const tercero = await http()
      .get('/public/posts')
      .set('If-None-Match', etagPrevio)
      .expect(200);

    expect(espia.mock.calls.length).toBe(llamadasAntes + 2);
    expect(tercero.headers['etag']).not.toBe(etagPrevio);
    const textos = (tercero.body.items as Array<{ bodyText: string }>).map(
      (item) => item.bodyText,
    );
    expect(textos).toContain(`mch028-invalidacion-${u}`);

    espia.mockRestore();
  });

  it('un endpoint con Cache-Control propio (no-store) nunca se cachea', async () => {
    // El verify de receta declara su propio `no-store` (commit 2bfa236b): la
    // caché de representación no puede pisarlo. No hace falta un paciente ni
    // una receta real para probarlo — alcanza con un id que no existe: el
    // interceptor decide por la metadata del handler, antes de que el
    // controlador siquiera intente resolver el recurso.
    const primero = await http().get(
      '/public/prescriptions/00000000-0000-4000-8000-000000000000/verify',
    );
    expect(primero.headers['cache-control']).toBe('no-store');
    expect(primero.headers['etag']).toBeUndefined();

    const segundo = await http().get(
      '/public/prescriptions/00000000-0000-4000-8000-000000000000/verify',
    );
    // Sin caché de por medio, la segunda respuesta es independiente de la
    // primera: mismo status, mismo no-store, nunca un 304 fabricado.
    expect(segundo.status).toBe(primero.status);
    expect(segundo.headers['cache-control']).toBe('no-store');
  });
});
