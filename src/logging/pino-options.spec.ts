import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Writable } from 'node:stream';
import pinoHttp from 'pino-http';
import {
  REDACTED_SHARE_TOKEN,
  buildPinoOptions,
  redactShareTokenInReferer,
  redactShareTokenInUrl,
  serializeRequest,
} from './pino-options';

/** Un token con la forma de los emitidos (43 caracteres base64url), sintético. */
const TOKEN = 'Q2hhbmdlTWVQbGVhc2VUaGlzSXNOb3RBUmVhbFRva2U';

/** El token del enlace compartido de receta no queda en los logs (S-6, D-6). */
describe('redacción del token del enlace compartido de receta', () => {
  describe('redactShareTokenInUrl', () => {
    it.each([
      [
        `/public/prescription-shares/${TOKEN}`,
        '/public/prescription-shares/[token]',
      ],
      [
        `/pharmacy/prescription-shares/${TOKEN}`,
        '/pharmacy/prescription-shares/[token]',
      ],
      [
        `/clinical/prescription-shares/by-token/${TOKEN}`,
        '/clinical/prescription-shares/by-token/[token]',
      ],
      [
        `/api/v1/public/prescription-shares/${TOKEN}?x=1`,
        '/api/v1/public/prescription-shares/[token]?x=1',
      ],
      [
        `/public/prescription-shares/${TOKEN}/`,
        '/public/prescription-shares/[token]/',
      ],
      [
        `/PUBLIC/Prescription-Shares/${TOKEN}`,
        '/PUBLIC/Prescription-Shares/[token]',
      ],
      [
        `/Pharmacy/prescription-shares/${TOKEN}`,
        '/Pharmacy/prescription-shares/[token]',
      ],
      [
        `/clinical/prescription-shares/BY-TOKEN/${TOKEN}`,
        '/clinical/prescription-shares/BY-TOKEN/[token]',
      ],
      [
        `Cannot GET /pharmacy/prescription-shares/${TOKEN}`,
        'Cannot GET /pharmacy/prescription-shares/[token]',
      ],
      [
        `Falló /public/prescription-shares/${TOKEN} y siguió`,
        'Falló /public/prescription-shares/[token] y siguió',
      ],
    ])('%s → %s', (url, expected) => {
      expect(redactShareTokenInUrl(url)).toBe(expected);
      expect(redactShareTokenInUrl(url)).not.toContain(TOKEN);
    });

    it.each([
      '/clinical/prescription-shares',
      '/clinical/prescription-shares?patientProfileId=11111111-1111-4111-8111-111111111111',
      '/clinical/prescription-shares/77777777-7777-4777-8777-777777777777/revoke',
      '/public/prescriptions/77777777-7777-4777-8777-777777777777/verify',
      '/health',
    ])('otra ruta no cambia: %s', (url) => {
      expect(redactShareTokenInUrl(url)).toBe(url);
    });
  });

  describe('redactShareTokenInReferer', () => {
    it.each([
      [
        `https://app.alovida.test/rx/${TOKEN}`,
        'https://app.alovida.test/rx/[token]',
      ],
      [
        `https://app.alovida.test/RX/${TOKEN}?x=1`,
        'https://app.alovida.test/RX/[token]?x=1',
      ],
      [
        `https://app.alovida.test/administration/pharmacy-orders/rx/${TOKEN}`,
        'https://app.alovida.test/administration/pharmacy-orders/rx/[token]',
      ],
      [
        `https://api.alovida.test/public/prescription-shares/${TOKEN}`,
        'https://api.alovida.test/public/prescription-shares/[token]',
      ],
    ])('%s → %s', (referer, expected) => {
      expect(redactShareTokenInReferer(referer)).toBe(expected);
    });

    it.each([
      'https://app.alovida.test/verify/rx/77777777-7777-4777-8777-777777777777',
      'https://app.alovida.test/account/pharmacy/prescriptions',
    ])('otra página no cambia: %s', (referer) => {
      expect(redactShareTokenInReferer(referer)).toBe(referer);
    });
  });

  describe('serializeRequest', () => {
    it('saca el token de url y de params sin tocar el params original', () => {
      const params = { token: TOKEN };
      const serialized = serializeRequest({
        method: 'GET',
        url: `/public/prescription-shares/${TOKEN}`,
        params,
      });
      expect(serialized.url).toBe(
        `/public/prescription-shares/${REDACTED_SHARE_TOKEN}`,
      );
      expect(serialized.params).toEqual({ token: REDACTED_SHARE_TOKEN });
      expect(params.token).toBe(TOKEN);
    });

    it('redacta el Referer de /rx/<token> sin tocar las cabeceras originales', () => {
      const headers = {
        referer: `https://app.alovida.test/rx/${TOKEN}`,
        accept: 'application/json',
      };
      const serialized = serializeRequest({
        method: 'GET',
        url: '/iam/auth/refresh',
        headers,
      });
      expect(serialized.url).toBe('/iam/auth/refresh');
      expect(serialized.headers).toEqual({
        referer: 'https://app.alovida.test/rx/[token]',
        accept: 'application/json',
      });
      expect(headers.referer).toContain(TOKEN);
    });

    it.each([
      ['public', ['public', 'prescription-shares', TOKEN]],
      ['pharmacy', ['pharmacy', 'prescription-shares', TOKEN]],
      ['clinical', ['clinical', 'prescription-shares', 'by-token', TOKEN]],
    ])(
      'saca el token de params.path (comodín de nestjs-pino) en la ruta %s',
      (_name, path) => {
        const params = { path };
        const serialized = serializeRequest({
          method: 'GET',
          url: `/${path.join('/')}`,
          params,
        });
        expect(JSON.stringify(serialized)).not.toContain(TOKEN);
        expect((serialized.params as { path: string[] }).path).toEqual([
          ...path.slice(0, -1),
          REDACTED_SHARE_TOKEN,
        ]);
        // El original no se toca: lo siguen leyendo los handlers.
        expect(params.path[path.length - 1]).toBe(TOKEN);
      },
    );

    it('saca el token aunque la url ya llegue redactada o venga en otro campo', () => {
      const serialized = serializeRequest({
        method: 'GET',
        url: `/public/prescription-shares/${REDACTED_SHARE_TOKEN}`,
        params: { path: ['public', 'prescription-shares', TOKEN] },
        query: { next: `/public/prescription-shares/${TOKEN}` },
        originalUrl: `/public/prescription-shares/${TOKEN}`,
        path: `/public/prescription-shares/${TOKEN}`,
        remoteAddress: '127.0.0.1',
      });
      expect(JSON.stringify(serialized)).not.toContain(TOKEN);
      expect(serialized.remoteAddress).toBe('127.0.0.1');
    });

    it('saca el token codificado (%XX) de params.path sin tocar otros campos', () => {
      const encoded = TOKEN.replace('Q2', 'Q%32');
      const serialized = serializeRequest({
        method: 'GET',
        url: `/public/prescription-shares/${encoded}`,
        params: { path: ['public', 'prescription-shares', TOKEN] },
        headers: { 'user-agent': 'x', host: 'api.alovida.test' },
      });
      expect(JSON.stringify(serialized)).not.toContain(TOKEN);
      expect(JSON.stringify(serialized)).not.toContain(encoded);
      expect(serialized.headers).toEqual({
        'user-agent': 'x',
        host: 'api.alovida.test',
      });
    });

    it('un tramo corto no mutila el resto de la petición', () => {
      const serialized = serializeRequest({
        method: 'GET',
        url: '/public/prescription-shares/x',
        headers: { 'user-agent': 'axios x y' },
      });
      expect(serialized.url).toBe('/public/prescription-shares/[token]');
      expect(serialized.headers).toEqual({ 'user-agent': 'axios x y' });
    });

    it('saca el token de la query y de un Referer con returnUrl (flujo «Soy farmacia»)', () => {
      const serialized = serializeRequest({
        method: 'GET',
        url: `/iam/auth/me?next=%2Frx%2F${TOKEN}`,
        query: { next: `/rx/${TOKEN}` },
        headers: {
          referer: `https://app.alovida.test/auth?returnUrl=%2Frx%2F${TOKEN}`,
        },
        remoteAddress: '10.0.0.7',
      });
      expect(JSON.stringify(serialized)).not.toContain(TOKEN);
      expect(serialized.url).toBe('/iam/auth/me?next=%2Frx%2F[token]');
      expect(serialized.query).toEqual({ next: '/rx/[token]' });
      expect((serialized.headers as { referer: string }).referer).toBe(
        'https://app.alovida.test/auth?returnUrl=%2Frx%2F[token]',
      );
      expect(serialized.remoteAddress).toBe('10.0.0.7');
    });

    it('una query sin ruta con token no cambia', () => {
      const query = {
        returnUrl: '/verify/rx/0d9f7d8c-6a0b-4f47-9a65-2a3c0a1c2b3d',
      };
      const serialized = serializeRequest({ method: 'GET', url: '/x', query });
      expect(serialized.query).toBe(query);
    });

    it('deja igual una petición de otra ruta', () => {
      const req = { method: 'GET', url: '/health', params: { token: 'x' } };
      expect(serializeRequest(req)).toEqual({
        method: 'GET',
        url: '/health',
        params: { token: 'x' },
      });
    });
  });

  describe('con pino-http real', () => {
    let server: Server;
    let lines: string[];

    beforeEach(async () => {
      lines = [];
      const sink = new Writable({
        write(chunk: Buffer, _encoding, done) {
          lines.push(chunk.toString('utf8'));
          done();
        },
      });
      const { pinoHttp: options } = buildPinoOptions() as {
        pinoHttp: Record<string, unknown>;
      };
      const logger = pinoHttp(
        { ...options, level: 'info', transport: undefined } as never,
        sink,
      );
      server = createServer((req, res) => {
        logger(req, res);
        res.statusCode = 200;
        res.end('{}');
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve),
      );
    });

    afterEach(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('ni el Referer de /rx/<token> ni una ruta en mayúsculas dejan el token; la autorización sigue fuera', async () => {
      const { port } = server.address() as AddressInfo;
      await fetch(
        `http://127.0.0.1:${port}/PUBLIC/Prescription-Shares/${TOKEN}`,
        {
          headers: {
            referer: `https://app.alovida.test/rx/${TOKEN}`,
            authorization: 'Bearer sintetico-no-real',
          },
        },
      );
      await new Promise((resolve) => setImmediate(resolve));
      const log = lines.join('');
      expect(log).toContain('/PUBLIC/Prescription-Shares/[token]');
      expect(log).toContain('https://app.alovida.test/rx/[token]');
      expect(log).not.toContain(TOKEN);
      expect(log).not.toContain('sintetico-no-real');
    });

    it.each([
      `/public//prescription-shares/${TOKEN}`,
      `/public%2Fprescription-shares/${TOKEN}`,
      `/public/prescription%2Dshares/${TOKEN}`,
      `/clinical/prescription-shares/by-token//${TOKEN}`,
    ])(
      'una ruta no canónica (%s) ni el Referer /rx//<token> dejan el token',
      async (path) => {
        const { port } = server.address() as AddressInfo;
        await fetch(`http://127.0.0.1:${port}${path}`, {
          headers: { referer: `https://app.alovida.test/rx//${TOKEN}` },
        });
        await new Promise((resolve) => setImmediate(resolve));
        const log = lines.join('');
        expect(log).toContain('[token]');
        expect(log).not.toContain(TOKEN);
      },
    );

    it.each([
      ['public', ['public', 'prescription-shares', TOKEN]],
      ['pharmacy', ['pharmacy', 'prescription-shares', TOKEN]],
      ['clinical', ['clinical', 'prescription-shares', 'by-token', TOKEN]],
    ])(
      'con params.path en la línea (%s) el token no está en ningún campo del log',
      async (_name, path) => {
        // Lo que Express deja en `req.params` con el comodín de nestjs-pino.
        const wildcard = createServer((req, res) => {
          (req as unknown as { params: unknown }).params = { path };
          wildcardLogger(req, res);
          res.statusCode = 200;
          res.end('{}');
        });
        const { pinoHttp: options } = buildPinoOptions() as {
          pinoHttp: Record<string, unknown>;
        };
        const wildcardLogger = pinoHttp(
          { ...options, level: 'info', transport: undefined } as never,
          new Writable({
            write(chunk: Buffer, _encoding, done) {
              lines.push(chunk.toString('utf8'));
              done();
            },
          }),
        );
        await new Promise<void>((resolve) =>
          wildcard.listen(0, '127.0.0.1', resolve),
        );
        try {
          const { port } = wildcard.address() as AddressInfo;
          await fetch(`http://127.0.0.1:${port}/${path.join('/')}`);
          await new Promise((resolve) => setImmediate(resolve));
        } finally {
          await new Promise<void>((resolve) => wildcard.close(() => resolve()));
        }
        const log = lines.join('');
        expect(log).toContain('"params"');
        expect(log).toContain('[token]');
        expect(log).not.toContain(TOKEN);
      },
    );

    it('la línea de la petición lleva [token] y no el token', async () => {
      const { port } = server.address() as AddressInfo;
      await fetch(
        `http://127.0.0.1:${port}/public/prescription-shares/${TOKEN}`,
      );
      await new Promise((resolve) => setImmediate(resolve));
      const log = lines.join('');
      expect(log).toContain('/public/prescription-shares/[token]');
      expect(log).not.toContain(TOKEN);
    });
  });
});
