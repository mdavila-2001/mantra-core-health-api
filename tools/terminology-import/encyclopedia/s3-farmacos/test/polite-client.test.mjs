import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PoliteClient, USER_AGENT } from '../lib/polite-client.mjs';

function fakeEnv(responses) {
  let t = 1_000_000;
  const starts = [];
  const seenUserAgents = [];
  const queue = [...responses];
  return {
    starts,
    seenUserAgents,
    sleepImpl: async (ms) => { t += ms; },
    nowImpl: () => t,
    fetchImpl: async (_url, init) => {
      starts.push(t);
      seenUserAgents.push(init.headers['User-Agent']);
      const r = queue.shift();
      return new Response(r.body ?? '', { status: r.status, headers: r.headers ?? {} });
    },
  };
}

test('1 petición por segundo como máximo y User-Agent identificable', async () => {
  const env = fakeEnv([{ status: 200, body: '[]' }, { status: 200, body: '[]' }, { status: 200, body: '[]' }]);
  const c = new PoliteClient({ ...env });
  await Promise.all([c.request('https://x.test/1'), c.request('https://x.test/2'), c.request('https://x.test/3')]);
  for (let i = 1; i < env.starts.length; i++) assert.ok(env.starts[i] - env.starts[i - 1] >= 1000, `separación ${env.starts[i] - env.starts[i - 1]} ms`);
  assert.ok(env.seenUserAgents.every((ua) => ua === USER_AGENT && /AloVida/.test(ua)));
});

test('reintenta con retroceso ante 429 (respeta Retry-After) y ante 5xx', async () => {
  const env = fakeEnv([{ status: 429, headers: { 'retry-after': '3' } }, { status: 503 }, { status: 200, body: '[1]' }]);
  const c = new PoliteClient({ ...env });
  const res = await c.request('https://x.test/a');
  assert.equal(res.status, 200);
  assert.equal(c.stats.retries, 2);
  assert.ok(env.starts[1] - env.starts[0] >= 3000, 'debe esperar el Retry-After');
});

test('se rinde tras maxRetries con un error explícito', async () => {
  const env = fakeEnv(Array.from({ length: 4 }, () => ({ status: 500 })));
  const c = new PoliteClient({ ...env, maxRetries: 3 });
  await assert.rejects(() => c.request('https://x.test/a'), /HTTP 500 tras 3 reintentos/);
});

test('caché en disco: la segunda lectura no hace petición; un 404 se guarda como null', async () => {
  const dir = mkdtempSync(join(tmpdir(), 's3-polite-'));
  try {
    const env = fakeEnv([{ status: 200, body: '[{"seccion":"4.3"}]' }, { status: 404 }]);
    const c = new PoliteClient({ ...env });
    assert.deepEqual(await c.getJsonCached('https://x.test/a', join(dir, 'a.json')), [{ seccion: '4.3' }]);
    assert.deepEqual(await c.getJsonCached('https://x.test/a', join(dir, 'a.json')), [{ seccion: '4.3' }]);
    assert.equal(await c.getJsonCached('https://x.test/b', join(dir, 'b.json')), null);
    assert.equal(await c.getJsonCached('https://x.test/b', join(dir, 'b.json')), null);
    assert.equal(env.starts.length, 2);
    assert.equal(c.stats.cacheHits, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
