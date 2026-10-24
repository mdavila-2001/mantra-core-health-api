import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { GuardedHttpClient, MAX_RESPONSE_BYTES } from './guarded-http.client';
import type { TargetAllowlist } from '../domain/target-guard';

describe('GuardedHttpClient (servidor HTTP local real)', () => {
  let server: Server;
  let port: number;
  let lastHeaders: Record<string, unknown> = {};

  beforeAll(async () => {
    server = createServer((req, res) => {
      lastHeaders = req.headers;
      if (req.url === '/api/redirect') {
        res.writeHead(302, {
          location: 'http://169.254.169.254/latest/meta-data',
        });
        return res.end();
      }
      if (req.url === '/api/slow') return; // nunca responde
      if (req.url === '/api/big') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(`"${'x'.repeat(MAX_RESPONSE_BYTES + 10)}"`);
      }
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, method: req.method }));
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    port = (server.address() as AddressInfo).port;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const target = (over: Partial<TargetAllowlist> = {}): TargetAllowlist => ({
    scheme: 'http',
    host: 'qa-target.test',
    port,
    allowedPathPrefixes: ['/api'],
    allowPrivateNetwork: true,
    ...over,
  });
  const url = (path: string) => `http://qa-target.test:${port}${path}`;
  const toLoopback = new GuardedHttpClient(async () => [
    { address: '127.0.0.1', family: 4 },
  ]);

  it('conecta a la IP validada aunque el nombre no exista en el DNS del sistema', async () => {
    const res = await toLoopback.send(
      {
        method: 'POST',
        url: url('/api/items'),
        headers: { 'x-trace': 't1' },
        body: { a: 1 },
        timeoutMs: 2000,
      },
      target(),
    );
    expect(res).toMatchObject({
      kind: 'RESPONSE',
      status: 201,
      body: { ok: true, method: 'POST' },
      connectedAddress: '127.0.0.1',
    });
    // El Host sigue siendo el nombre del destino, no la IP.
    expect(lastHeaders.host).toBe(`qa-target.test:${port}`);
  });

  it('sin autorización de red privada, loopback se bloquea antes de conectar', async () => {
    const res = await toLoopback.send(
      { method: 'GET', url: url('/api/items'), headers: {}, timeoutMs: 2000 },
      target({ allowPrivateNetwork: false }),
    );
    expect(res).toEqual({
      kind: 'BLOCKED',
      violations: [expect.objectContaining({ code: 'ADDRESS_LOOPBACK' })],
    });
  });

  it('basta una dirección prohibida entre varias para bloquear', async () => {
    const mixed = new GuardedHttpClient(async () => [
      { address: '8.8.8.8', family: 4 },
      { address: '169.254.169.254', family: 4 },
    ]);
    const res = await mixed.send(
      { method: 'GET', url: url('/api/x'), headers: {}, timeoutMs: 2000 },
      target(),
    );
    expect(res).toMatchObject({
      kind: 'BLOCKED',
      violations: [{ code: 'ADDRESS_LINK_LOCAL' }],
    });
  });

  it('una URL fuera del destino se bloquea sin resolver nada', async () => {
    let resolved = false;
    const spy = new GuardedHttpClient(async () => {
      resolved = true;
      return [{ address: '127.0.0.1', family: 4 }];
    });
    const res = await spy.send(
      { method: 'GET', url: url('/admin'), headers: {}, timeoutMs: 2000 },
      target(),
    );
    expect(res.kind).toBe('BLOCKED');
    expect(resolved).toBe(false);
  });

  it('no sigue redirecciones (ni hacia la metadata cloud)', async () => {
    const res = await toLoopback.send(
      {
        method: 'GET',
        url: url('/api/redirect'),
        headers: {},
        timeoutMs: 2000,
      },
      target(),
    );
    expect(res).toMatchObject({
      kind: 'RESPONSE',
      status: 302,
      redirectNotFollowed: true,
    });
  });

  it('corta por timeout', async () => {
    const res = await toLoopback.send(
      { method: 'GET', url: url('/api/slow'), headers: {}, timeoutMs: 300 },
      target(),
    );
    expect(res).toMatchObject({ kind: 'TRANSPORT_ERROR', code: 'TIMEOUT' });
  });

  it('trunca respuestas por encima del tope', async () => {
    const res = await toLoopback.send(
      { method: 'GET', url: url('/api/big'), headers: {}, timeoutMs: 5000 },
      target(),
    );
    expect(res).toMatchObject({ kind: 'RESPONSE', truncated: true });
    if (res.kind === 'RESPONSE')
      expect((res.body as string).length).toBe(MAX_RESPONSE_BYTES);
  });

  it('un DNS que falla es error de transporte, no un bloqueo', async () => {
    const failing = new GuardedHttpClient(async () => {
      throw new Error('ENOTFOUND qa-target.test');
    });
    const res = await failing.send(
      { method: 'GET', url: url('/api/x'), headers: {}, timeoutMs: 2000 },
      target(),
    );
    expect(res).toMatchObject({ kind: 'TRANSPORT_ERROR', code: 'DNS_FAILED' });
  });
});
