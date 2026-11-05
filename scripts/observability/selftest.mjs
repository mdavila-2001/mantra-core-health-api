#!/usr/bin/env node
/**
 * Carga conocida contra una API local con OBSERVABILITY_ENABLED=true (02 §7, P1–P3).
 *
 * Dispara N peticiones con códigos exactos y guarda en un JSON cada `requestId`
 * que la API devolvió (cabecera `x-request-id` y `correlationId` del cuerpo),
 * para compararlo después con `/admin/observability/*` y con `psql`.
 *
 *   API=http://127.0.0.1:3010 node scripts/observability/selftest.mjs [salida.json]
 *
 * Cuentas de prueba locales (clave 12345678): admin@alovidasalud.com (SUPERADMIN)
 * y medico2org@alovida.test (sin rol de plataforma). No es una prueba de jest: no
 * se ejecuta en CI y no toca nada fuera de peticiones HTTP.
 */
import { writeFileSync } from 'node:fs';

const API = process.env.API ?? 'http://127.0.0.1:3010';
const PASSWORD = process.env.SELFTEST_PASSWORD ?? '12345678';
const out = process.argv[2] ?? 'selftest-result.json';

const PLAN = [
  { name: 'ok-slos', count: 37, status: 200, who: 'admin', method: 'GET', path: '/admin/ops/slos' },
  { name: 'bad-window', count: 11, status: 400, who: 'admin', method: 'GET', path: '/admin/ops/traffic?from=basura' },
  { name: 'unmatched', count: 7, status: 404, who: 'admin', method: 'GET', path: '/no-existe-xyz' },
  { name: 'forbidden', count: 5, status: 403, who: 'medico', method: 'GET', path: '/admin/ops/slos' },
  { name: 'boom-throw', count: 4, status: 500, who: 'admin', method: 'GET', path: '/internal/observability/selftest/fail?kind=throw' },
  { name: 'boom-type', count: 3, status: 500, who: 'admin', method: 'GET', path: '/internal/observability/selftest/fail?kind=type' },
];

async function login(email) {
  const res = await fetch(`${API}/iam/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await res.json();
  if (!body.accessToken) throw new Error(`login ${email}: ${JSON.stringify(body)}`);
  return body.accessToken;
}

const tokens = {
  admin: await login('admin@alovidasalud.com'),
  medico: await login('medico2org@alovida.test'),
};

const startedAt = new Date().toISOString();
const results = [];
for (const step of PLAN) {
  const requestIds = [];
  const statuses = {};
  for (let i = 0; i < step.count; i += 1) {
    const res = await fetch(`${API}${step.path}`, {
      method: step.method,
      headers: { authorization: `Bearer ${tokens[step.who]}` },
    });
    statuses[res.status] = (statuses[res.status] ?? 0) + 1;
    const body = await res.json().catch(() => ({}));
    requestIds.push({
      header: res.headers.get('x-request-id'),
      correlationId: body.correlationId ?? null,
    });
  }
  results.push({ ...step, statuses, requestIds });
}
const finishedAt = new Date().toISOString();
writeFileSync(out, JSON.stringify({ api: API, startedAt, finishedAt, results }, null, 2));
for (const r of results) {
  console.log(`${r.name.padEnd(12)} ${r.method} ${r.path.padEnd(52)} esperado=${r.status}x${r.count} obtenido=${JSON.stringify(r.statuses)}`);
}
console.log(`guardado en ${out}`);
