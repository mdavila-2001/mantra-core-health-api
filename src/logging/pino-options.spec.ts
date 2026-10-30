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
