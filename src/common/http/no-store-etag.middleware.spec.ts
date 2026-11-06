import express, { type Express } from 'express';
import request from 'supertest';
import { stripEtagOnNoStore } from './no-store-etag.middleware';

/**
 * Arma una app de Express real con el `ETag` por defecto de Express 5 y el
 * middleware delante, igual que en `main.ts`.
 *
 * @returns La app con las rutas de prueba.
 */
function buildApp(): Express {
  const app = express();
  app.use(stripEtagOnNoStore);

  app.get('/no-store', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(404).json({ message: 'Receta no encontrada' });
  });
  app.get('/private-no-store', (_req, res) => {
    res.set('Cache-Control', 'private, no-store');
    res.json({ ok: true });
  });
  app.get('/no-store-mayusculas', (_req, res) => {
    res.set('Cache-Control', 'No-Store, max-age=0');
    res.json({ ok: true });
  });
  // Orden inverso: el `ETag` llega antes que el `no-store`.
  app.get('/etag-antes', (_req, res) => {
    res.set('ETag', 'W/"manual"');
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true });
  });
  // `res.end()` sin `send`: las cabeceras salen por el `writeHead` implícito.
  app.get('/end-crudo', (_req, res) => {
    res.setHeader('ETag', '"crudo"');
    res.setHeader('Cache-Control', 'no-store');
    res.end('crudo');
  });
  app.get('/cacheable', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ items: [1, 2, 3] });
  });
  app.get('/sin-cache-control', (_req, res) => {
    res.json({ items: [1] });
  });
  // `no-cache` obliga a revalidar, no prohíbe guardar: el `ETag` se queda.
  app.get('/no-cache', (_req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.json({ items: [2] });
  });
  return app;
}

describe('stripEtagOnNoStore (api#1242)', () => {
  const app = buildApp();

  it('una respuesta no-store (el 404 del verify) sale sin ETag', async () => {
    const res = await request(app).get('/no-store');
    expect(res.status).toBe(404);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['etag']).toBeUndefined();
    expect(res.body).toEqual({ message: 'Receta no encontrada' });
  });

  it('private, no-store también sale sin ETag', async () => {
    const res = await request(app).get('/private-no-store');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers['etag']).toBeUndefined();
  });

  it('reconoce la directiva sin importar mayúsculas ni compañía', async () => {
    const res = await request(app).get('/no-store-mayusculas');
    expect(res.headers['etag']).toBeUndefined();
  });

  it('un ETag puesto antes que el no-store se borra al escribir las cabeceras', async () => {
    const res = await request(app).get('/etag-antes');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['etag']).toBeUndefined();
  });

  it('cubre también res.end() directo, sin pasar por res.send', async () => {
    const res = await request(app).get('/end-crudo');
    expect(res.text).toBe('crudo');
    expect(res.headers['etag']).toBeUndefined();
  });

  it('una respuesta no-store nunca contesta 304, aunque el cliente adivine el ETag', async () => {
    // El ETag que Express le habría puesto a este cuerpo sin el middleware.
    const sinMiddleware = express();
    sinMiddleware.get('/no-store', (_req, res) => {
      res.set('Cache-Control', 'no-store');
      res.status(404).json({ message: 'Receta no encontrada' });
    });
    const original = await request(sinMiddleware).get('/no-store');
    const etagDeExpress = original.headers['etag'] as string;
    expect(etagDeExpress).toMatch(/^W\//);

    const res = await request(app)
      .get('/no-store')
      .set('If-None-Match', etagDeExpress);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Receta no encontrada' });
    expect(res.headers['etag']).toBeUndefined();
  });

  it('una ruta cacheable conserva el ETag débil de Express', async () => {
    const res = await request(app).get('/cacheable');
    expect(res.status).toBe(200);
    expect(res.headers['etag']).toMatch(/^W\/"/);
  });

  it('el 304 sigue funcionando en una ruta cacheable', async () => {
    const primero = await request(app).get('/cacheable');
    const etag = primero.headers['etag'] as string;
    expect(etag).toBeTruthy();

    const segundo = await request(app)
      .get('/cacheable')
      .set('If-None-Match', etag);
    expect(segundo.status).toBe(304);
    expect(segundo.headers['etag']).toBe(etag);
    expect(segundo.text).toBe('');
  });

  it('sin Cache-Control, o con no-cache, el ETag se queda', async () => {
    const sinCc = await request(app).get('/sin-cache-control');
    expect(sinCc.headers['etag']).toMatch(/^W\/"/);
    const noCache = await request(app).get('/no-cache');
    expect(noCache.headers['etag']).toMatch(/^W\/"/);
  });
});
