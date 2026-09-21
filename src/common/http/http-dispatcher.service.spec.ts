import dns from 'node:dns';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { gzipSync } from 'node:zlib';
import {
  DEFAULT_DISPATCH_TIMEOUT_MS,
  HttpDispatcherService,
  MAX_DISPATCH_REQUEST_BYTES,
  MAX_DISPATCH_RESPONSE_BYTES,
  MAX_DISPATCH_TIMEOUT_MS,
  effectiveDispatchTimeoutMs,
} from './http-dispatcher.service';
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

/**
 * MCH-035 · presupuesto de recursos del despacho saliente.
 *
 * Todo contra servidores locales: se observa qué recibe el servidor y qué
 * devuelve el despacho, no la configuración pasada a axios.
 */
describe('HttpDispatcherService · límites de cuerpo y plazo (MCH-035)', () => {
  const abiertos: http.Server[] = [];

  /** Levanta un servidor local con el manejador dado y devuelve su URL. */
  async function servidor(
    handler: http.RequestListener,
  ): Promise<{ url: string; server: http.Server }> {
    const server = http.createServer(handler);
    abiertos.push(server);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address() as AddressInfo;
    return { url: `http://127.0.0.1:${port}/hook`, server };
  }

  afterEach(async () => {
    await Promise.all(
      abiertos.splice(0).map(
        (s) =>
          new Promise<void>((r) => {
            s.closeAllConnections();
            s.close(() => r());
          }),
      ),
    );
  });

  it('AC01 · una respuesta que excede el límite se aborta y no se devuelve', async () => {
    const trozo = Buffer.alloc(64 * 1024, 'a');
    const { url } = await servidor((_req, res) => {
      // Chunked, sin content-length: el límite no puede decidirse por cabecera.
      res.writeHead(200, { 'content-type': 'text/plain' });
      let enviados = 0;
      const enviar = () => {
        while (enviados < MAX_DISPATCH_RESPONSE_BYTES * 4) {
          enviados += trozo.length;
          if (!res.write(trozo)) return void res.once('drain', enviar);
        }
        res.end();
      };
      enviar();
    });

    const res = await new HttpDispatcherService().post({
      url,
      body: {},
      secret: 's',
    });

    expect(res.ok).toBe(false);
    expect(res.responseBody).toBeUndefined();
    expect(res.errorText).toBe('RESPONSE_TOO_LARGE');
  });

  it('AC01 · el límite cuenta los bytes descomprimidos (gzip expansivo)', async () => {
    const bomba = gzipSync(Buffer.alloc(MAX_DISPATCH_RESPONSE_BYTES * 8, 0));
    const { url } = await servidor((_req, res) => {
      res.writeHead(200, {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
        'content-length': String(bomba.length),
      });
      res.end(bomba);
    });

    const res = await new HttpDispatcherService().post({
      url,
      body: {},
      secret: 's',
    });

    expect(bomba.length).toBeLessThan(MAX_DISPATCH_RESPONSE_BYTES);
    expect(res.ok).toBe(false);
    expect(res.responseBody).toBeUndefined();
    expect(res.errorText).toBe('RESPONSE_TOO_LARGE');
  });

  it('AC02 · un proveedor que gotea bytes no evita el plazo total', async () => {
    const { url } = await servidor((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' });
      // Un byte cada 100 ms: el timeout por inactividad del socket nunca vence.
      const t = setInterval(() => res.write('.'), 100);
      res.on('close', () => clearInterval(t));
    });

    const inicio = Date.now();
    const res = await new HttpDispatcherService().post({
      url,
      body: {},
      secret: 's',
      timeoutMs: 800,
    });

    expect(res.ok).toBe(false);
    expect(res.errorText).toBe('DEADLINE_EXCEEDED');
    expect(Date.now() - inicio).toBeLessThan(5000);
  });

  it('AC02 · timeout 0 no deshabilita el plazo: se usa el de seguridad', async () => {
    const { url } = await servidor(() => {
      // Nunca responde.
    });

    const inicio = Date.now();
    const res = await new HttpDispatcherService().post({
      url,
      body: {},
      secret: 's',
      timeoutMs: 0,
    });

    expect(res.ok).toBe(false);
    expect(res.httpStatus).toBe(0);
    expect(Date.now() - inicio).toBeLessThan(
      DEFAULT_DISPATCH_TIMEOUT_MS + 3000,
    );
  }, 20000);

  it('AC02 · el plazo configurable queda acotado', () => {
    expect(effectiveDispatchTimeoutMs(undefined)).toBe(
      DEFAULT_DISPATCH_TIMEOUT_MS,
    );
    expect(effectiveDispatchTimeoutMs(0)).toBe(DEFAULT_DISPATCH_TIMEOUT_MS);
    expect(effectiveDispatchTimeoutMs(-5)).toBe(DEFAULT_DISPATCH_TIMEOUT_MS);
    expect(effectiveDispatchTimeoutMs(Number.NaN)).toBe(
      DEFAULT_DISPATCH_TIMEOUT_MS,
    );
    expect(effectiveDispatchTimeoutMs(Number.POSITIVE_INFINITY)).toBe(
      MAX_DISPATCH_TIMEOUT_MS,
    );
    expect(effectiveDispatchTimeoutMs(10 * 60 * 1000)).toBe(
      MAX_DISPATCH_TIMEOUT_MS,
    );
    expect(effectiveDispatchTimeoutMs(1200)).toBe(1200);
  });

  it('un cuerpo saliente que excede el límite se rechaza sin conectar', async () => {
    const recibidas: string[] = [];
    const { url } = await servidor((req, res) => {
      recibidas.push(req.url ?? '');
      res.end('{}');
    });

    await expect(
      new HttpDispatcherService().post({
        url,
        body: { relleno: 'x'.repeat(MAX_DISPATCH_REQUEST_BYTES) },
        secret: 's',
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(recibidas).toEqual([]);
  });

  it('las cabeceras del llamador no pisan la firma ni las de transporte', async () => {
    let vistas: http.IncomingHttpHeaders = {};
    const { url } = await servidor((req, res) => {
      vistas = req.headers;
      req.resume();
      req.on('end', () => res.end('{}'));
    });

    const res = await new HttpDispatcherService().post({
      url,
      body: { a: 1 },
      secret: 's',
      headers: {
        'X-Signature': 'sha256=forjada',
        'x-signature-algorithm': 'none',
        'Content-Type': 'text/plain',
        host: 'otro.interno',
        'x-proveedor': 'se-conserva',
      },
    });

    expect(res.ok).toBe(true);
    expect(vistas['x-signature']).toBe(`sha256=${res.signature}`);
    expect(vistas['x-signature-algorithm']).toBe('HMAC-SHA256');
    expect(vistas['content-type']).toBe('application/json');
    expect(vistas.host).toMatch(/^127\.0\.0\.1:/);
    expect(vistas['x-proveedor']).toBe('se-conserva');
  });
});
