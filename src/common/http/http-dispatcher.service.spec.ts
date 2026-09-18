import dns from 'node:dns';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { HttpDispatcherService } from './http-dispatcher.service';
import { PreconditionFailedException } from '../errors/domain.exception';

/**
 * MCH-006 · el despacho real no debe conectar a una dirección interna aunque la
 * URL use un nombre DNS en lugar de una IP.
 *
 * El resolvedor del sistema se reemplaza por uno de laboratorio (no se consulta
 * DNS real ni se sale a la red): todo apunta a un servidor local y se observa si
 * la petición llega, que es el efecto que importa.
 */
type Lookup = typeof dns.lookup;

describe('HttpDispatcherService · destino resuelto (MCH-006)', () => {
  const previoEnv = process.env.NODE_ENV;
  const lookupOriginal: Lookup = dns.lookup;
  let server: http.Server;
  let port: number;
  let recibidas: string[];

  /** Instala un resolvedor falso que responde, por llamada, la lista dada. */
  function resolverDeLaboratorio(respuestas: string[]): () => number {
    let llamadas = 0;
    const falso = ((
      hostname: string,
      options: unknown,
      callback?: (...args: unknown[]) => void,
    ) => {
      const cb = (typeof options === 'function' ? options : callback) as (
        ...args: unknown[]
      ) => void;
      const opts = (typeof options === 'object' && options) || {};
      const address =
        respuestas[Math.min(llamadas, respuestas.length - 1)] ?? '127.0.0.1';
      llamadas++;
      const family = address.includes(':') ? 6 : 4;
      if ((opts as { all?: boolean }).all) cb(null, [{ address, family }]);
      else cb(null, address, family);
    }) as unknown as Lookup;
    (dns as { lookup: Lookup }).lookup = falso;
    return () => llamadas;
  }

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      recibidas.push(`${req.method} ${req.headers.host}`);
      res.setHeader('content-type', 'application/json');
      res.end('{"ok":true}');
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  beforeEach(() => {
    recibidas = [];
  });

  afterEach(() => {
    (dns as { lookup: Lookup }).lookup = lookupOriginal;
    process.env.NODE_ENV = previoEnv;
  });

  it('AC02 · en producción, un dominio que resuelve a loopback se bloquea sin enviar HTTP', async () => {
    process.env.NODE_ENV = 'production';
    resolverDeLaboratorio(['127.0.0.1']);

    await expect(
      new HttpDispatcherService().post({
        url: `http://interno.laboratorio.test:${port}/hook`,
        body: { a: 1 },
        secret: 's',
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(recibidas).toEqual([]);
  });

  it('AC02 · también si sólo uno de los registros es privado', async () => {
    process.env.NODE_ENV = 'production';
    resolverDeLaboratorio(['::ffff:127.0.0.1']);

    await expect(
      new HttpDispatcherService().post({
        url: `http://mapeado.laboratorio.test:${port}/hook`,
        body: {},
        secret: 's',
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(recibidas).toEqual([]);
  });

  it('AC03 · la conexión usa la resolución validada: un segundo lookup no cambia el destino', async () => {
    // Fuera de producción los privados se permiten, así que el servidor local
    // sirve de "destino aprobado". La primera resolución apunta a él; cualquier
    // resolución posterior apunta a una dirección donde no escucha nadie. Si el
    // socket volviera a resolver, la petición fallaría con ECONNREFUSED.
    process.env.NODE_ENV = 'test';
    const llamadas = resolverDeLaboratorio(['127.0.0.1', '127.0.0.2']);

    const res = await new HttpDispatcherService().post({
      url: `http://rebinding.laboratorio.test:${port}/hook`,
      body: {},
      secret: 's',
    });

    expect(res.ok).toBe(true);
    expect(recibidas).toHaveLength(1);
    expect(llamadas()).toBe(1);
  });

  it('no sigue redirecciones: el destino del 3xx no recibe nada', async () => {
    process.env.NODE_ENV = 'test';
    const destino: string[] = [];
    const otro = http.createServer((req, res) => {
      destino.push(req.url ?? '');
      res.end('{}');
    });
    await new Promise<void>((r) => otro.listen(0, '127.0.0.1', r));
    const otroPort = (otro.address() as AddressInfo).port;
    const redirige = http.createServer((_req, res) => {
      res.statusCode = 302;
      res.setHeader('location', `http://127.0.0.1:${otroPort}/interno`);
      res.end();
    });
    await new Promise<void>((r) => redirige.listen(0, '127.0.0.1', r));
    const redirPort = (redirige.address() as AddressInfo).port;

    try {
      const res = await new HttpDispatcherService().post({
        url: `http://127.0.0.1:${redirPort}/hook`,
        body: {},
        secret: 's',
      });
      expect(res.ok).toBe(false);
      expect(res.httpStatus).toBe(302);
      expect(destino).toEqual([]);
    } finally {
      await new Promise<void>((r) => otro.close(() => r()));
      await new Promise<void>((r) => redirige.close(() => r()));
    }
  });
});
