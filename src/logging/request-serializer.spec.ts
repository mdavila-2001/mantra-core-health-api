import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Writable } from 'node:stream';
import { pinoHttp } from 'pino-http';
import { buildPinoOptions, serializeRequest } from './pino-options';

/**
 * El log de peticiones no guarda los valores de la query string: en este
 * backend llevan nombres, documentos y correos de personas.
 */
describe('serializeRequest', () => {
  it('correcto — redacta `url` y `query` y deja el resto de la petición', () => {
    const req = {
      id: 'req-1',
      method: 'GET',
      url: '/profiles/patients?q=Ana&nationalId=4455667',
      query: { q: 'Ana', nationalId: '4455667' },
      headers: { accept: 'application/json' },
    };

    const out = serializeRequest(req);

    expect(out).toEqual({
      id: 'req-1',
      method: 'GET',
      url: '/profiles/patients?q=[REDACTED]&nationalId=[REDACTED]',
      query: { q: '[REDACTED]', nationalId: '[REDACTED]' },
      headers: { accept: 'application/json' },
    });
  });

  it('límite — una ruta sin query y sin `query` parseado sale igual', () => {
    expect(serializeRequest({ url: '/health' })).toEqual({ url: '/health' });
  });

  it('inválido — sin url no inventa una', () => {
    expect(serializeRequest({})).toEqual({ url: undefined });
  });

  it('buildPinoOptions lo registra como serializador de `req`', () => {
    const options = buildPinoOptions().pinoHttp as {
      serializers?: Record<string, unknown>;
    };
    expect(options.serializers?.req).toBe(serializeRequest);
  });
});

/**
 * La prueba que importa: una petición real por pino-http con las opciones de
 * producción, y la línea escrita no contiene ni el nombre ni el documento.
 */
describe('log de peticiones con las opciones reales', () => {
  let server: Server;
  const lines: string[] = [];

  beforeAll(async () => {
    const { pinoHttp: opciones } = buildPinoOptions() as {
      pinoHttp: Record<string, unknown>;
    };
    const destino = new Writable({
      write(chunk: Buffer, _encoding, done) {
        lines.push(chunk.toString('utf8'));
        done();
      },
    });
    // Sin transporte: se escribe al stream de la prueba.
    const { transport: _transport, ...sinTransporte } = opciones;
    const logger = pinoHttp({ ...sinTransporte, level: 'info' }, destino);
    server = createServer((req, res) => {
      logger(req, res);
      res.statusCode = 200;
      res.end('{}');
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  });

  afterAll(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  it('la línea de "petición completada" no guarda los valores de la query', async () => {
    const { port } = server.address() as AddressInfo;
    await fetch(
      `http://127.0.0.1:${port}/profiles/patients?q=Ana%20Quispe&nationalId=4455667`,
    );
    // pino escribe de forma síncrona al stream; el `finish` de la respuesta
    // ya ocurrió cuando `fetch` resolvió, pero se deja correr la cola.
    await new Promise((r) => setImmediate(r));

    const log = lines.join('\n');
    expect(log).toContain('petición completada');
    expect(log).toContain(
      '/profiles/patients?q=[REDACTED]&nationalId=[REDACTED]',
    );
    expect(log).not.toContain('Quispe');
    expect(log).not.toContain('4455667');
  });
});
