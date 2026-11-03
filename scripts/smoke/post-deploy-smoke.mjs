#!/usr/bin/env node
// Prueba de humo posterior a un despliegue de la API.
//
// Comprueba, contra una URL base, que la instancia está viva y lista:
//
//   1. GET /health     → 200 y `{"status":"ok"}`.
//   2. GET /readiness  → 200 y `{"status":"ok"}` (Postgres, Mongo, Redis,
//                        OpenSearch, esquema y catálogo núcleo).
//   3. Opcional, por cada cuenta declarada: POST /iam/auth/login y una lectura
//      autenticada (por defecto GET /tenants/me, que sólo devuelve lo del
//      propio actor).
//
// Termina con código 0 si todo pasa y con 1 en el primer control que falla,
// diciendo cuál y por qué. Con 2 si la configuración es inválida.
//
// Variables:
//   SMOKE_BASE_URL       URL base de la API (obligatoria; o primer argumento).
//   SMOKE_TIMEOUT_MS     Plazo por petición (por defecto 10000).
//   SMOKE_WAIT_SECONDS   Si > 0, reintenta /health hasta ese plazo antes de
//                        empezar: sirve para lanzarlo justo tras el arranque.
//   SMOKE_LOGIN_EMAIL / SMOKE_LOGIN_PASSWORD
//                        Una cuenta para el paso 3 (opcional).
//   SMOKE_READ_PATH      Ruta de la lectura autenticada (por defecto /tenants/me).
//   SMOKE_ACCOUNTS       JSON con varias cuentas, una por rol:
//                        [{"label":"medico","email":"…","password":"…","readPath":"/…"}]
//
// No imprime contraseñas, tokens ni cuerpos de respuesta autenticados: sólo el
// código HTTP y el rótulo de la cuenta.

const EXIT_FAIL = 1;
const EXIT_CONFIG = 2;

function fail(message) {
  console.error(`SMOKE FALLA: ${message}`);
  process.exit(EXIT_FAIL);
}

function configError(message) {
  console.error(`SMOKE CONFIGURACIÓN INVÁLIDA: ${message}`);
  process.exit(EXIT_CONFIG);
}

const rawBase = process.argv[2] ?? process.env.SMOKE_BASE_URL ?? '';
if (!rawBase.trim()) {
  configError('falta SMOKE_BASE_URL (o la URL como primer argumento).');
}
let baseUrl;
try {
  baseUrl = new URL(rawBase.trim().replace(/\/+$/u, '') + '/');
} catch {
  configError(`SMOKE_BASE_URL no es una URL válida: "${rawBase}".`);
}

const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 10_000);
const waitSeconds = Number(process.env.SMOKE_WAIT_SECONDS ?? 0);
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  configError('SMOKE_TIMEOUT_MS debe ser un número positivo.');
}
if (!Number.isFinite(waitSeconds) || waitSeconds < 0) {
  configError('SMOKE_WAIT_SECONDS debe ser un número >= 0.');
}

function urlFor(path) {
  return new URL(path.replace(/^\/+/u, ''), baseUrl).toString();
}

async function request(method, path, { body, token } = {}) {
  const headers = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(urlFor(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'manual',
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: response.status, json, text };
}

function describeError(error) {
  if (error?.name === 'TimeoutError') return `sin respuesta en ${timeoutMs} ms`;
  const cause = error?.cause?.code ?? error?.cause?.message;
  return cause ? `${error.message} (${cause})` : String(error?.message ?? error);
}

async function waitForHealth() {
  if (waitSeconds <= 0) return;
  const deadline = Date.now() + waitSeconds * 1000;
  let last = '';
  while (Date.now() < deadline) {
    try {
      const { status } = await request('GET', '/health');
      if (status === 200) return;
      last = `HTTP ${status}`;
    } catch (error) {
      last = describeError(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  fail(`/health no respondió 200 en ${waitSeconds} s (último: ${last}).`);
}

async function checkStatusOk(path) {
  let result;
  try {
    result = await request('GET', path);
  } catch (error) {
    fail(`GET ${path}: ${describeError(error)}.`);
  }
  if (result.status !== 200 || result.json?.status !== 'ok') {
    // /health y /readiness son públicos y no traen datos de personas: su
    // cuerpo (estado por dependencia) es lo que hace falta para diagnosticar.
    const detail = result.text.slice(0, 600);
    fail(`GET ${path} → HTTP ${result.status}, se esperaba 200 y status "ok". Cuerpo: ${detail}`);
  }
  console.log(`ok  GET ${path} → 200 status=ok`);
}

function loadAccounts() {
  const accounts = [];
  const raw = process.env.SMOKE_ACCOUNTS;
  if (raw && raw.trim()) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      configError('SMOKE_ACCOUNTS no es JSON válido.');
    }
    if (!Array.isArray(parsed)) configError('SMOKE_ACCOUNTS debe ser una lista.');
    parsed.forEach((item, index) => {
      if (!item?.email || !item?.password) {
        configError(`SMOKE_ACCOUNTS[${index}] necesita email y password.`);
      }
      accounts.push({
        label: String(item.label ?? `cuenta-${index + 1}`),
        email: String(item.email),
        password: String(item.password),
        readPath: String(item.readPath ?? process.env.SMOKE_READ_PATH ?? '/tenants/me'),
      });
    });
  }
  const email = process.env.SMOKE_LOGIN_EMAIL;
  const password = process.env.SMOKE_LOGIN_PASSWORD;
  if (Boolean(email) !== Boolean(password)) {
    configError('SMOKE_LOGIN_EMAIL y SMOKE_LOGIN_PASSWORD van juntas o ninguna.');
  }
  if (email && password) {
    accounts.push({
      label: 'SMOKE_LOGIN',
      email,
      password,
      readPath: process.env.SMOKE_READ_PATH ?? '/tenants/me',
    });
  }
  return accounts;
}

async function checkAccount(account) {
  let login;
  try {
    login = await request('POST', '/iam/auth/login', {
      body: { email: account.email, password: account.password },
    });
  } catch (error) {
    fail(`[${account.label}] POST /iam/auth/login: ${describeError(error)}.`);
  }
  const token = login.json?.accessToken;
  if (login.status !== 200 || typeof token !== 'string' || !token) {
    fail(`[${account.label}] POST /iam/auth/login → HTTP ${login.status}, se esperaba 200 con accessToken.`);
  }
  console.log(`ok  [${account.label}] POST /iam/auth/login → 200`);

  let read;
  try {
    read = await request('GET', account.readPath, { token });
  } catch (error) {
    fail(`[${account.label}] GET ${account.readPath}: ${describeError(error)}.`);
  }
  if (read.status !== 200) {
    fail(`[${account.label}] GET ${account.readPath} → HTTP ${read.status}, se esperaba 200.`);
  }
  console.log(`ok  [${account.label}] GET ${account.readPath} → 200`);
}

async function main() {
  const accounts = loadAccounts();
  console.log(`Prueba de humo contra ${baseUrl.toString()}`);
  await waitForHealth();
  await checkStatusOk('/health');
  await checkStatusOk('/readiness');
  if (accounts.length === 0) {
    console.log('--  login y lectura autenticada: sin cuentas declaradas (SMOKE_LOGIN_* / SMOKE_ACCOUNTS), se omite.');
  }
  for (const account of accounts) {
    await checkAccount(account);
  }
  console.log('SMOKE OK');
}

main().catch((error) => fail(describeError(error)));
