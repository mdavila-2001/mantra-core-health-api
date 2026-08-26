#!/usr/bin/env node
/**
 * Reindexado completo del directorio público (P10).
 *
 * Reconstruye `community_public_profiles` en OpenSearch desde cero y **cuenta**:
 * imprime «indexados N de N» y compara contra lo que el índice dice tener. Es
 * lo que se corre tras un cambio de mapping o de analizador —que OpenSearch no
 * aplica sobre un índice vivo— y tras cargar datos nuevos.
 *
 * Idempotente: correrlo dos veces deja el índice igual, porque el id del
 * documento es el id del perfil público.
 *
 *   yarn search:reindex
 *   yarn search:reindex --no-recreate     # sólo rellena, sin tirar el índice
 *   API_BASE_URL=http://localhost:3010 yarn search:reindex
 *
 * Sale con código 1 si el índice no confirma lo indexado: un reindexado que
 * dice «listo» sin que el índice lo respalde es peor que uno que falla.
 */

const BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
// El mismo par que arranca la API: `BOOTSTRAP_ADMIN_*` del `.env`.
const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@redesa.test';
const PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';
const RECREATE = !process.argv.includes('--no-recreate');

/**
 * Llama a la API y devuelve estado y cuerpo, sin lanzar por un status feo:
 * el diagnóstico útil está en el cuerpo del error, no en la excepción.
 */
async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const texto = await res.text();
  let parsed = null;
  try {
    parsed = texto ? JSON.parse(texto) : null;
  } catch {
    parsed = texto;
  }
  return { status: res.status, body: parsed };
}

function fallar(mensaje, detalle) {
  console.error(`\n  ✗ ${mensaje}`);
  if (detalle !== undefined) console.error(`    ${JSON.stringify(detalle)}`);
  process.exit(1);
}

console.log(`\n  Reindexando el directorio público contra ${BASE}`);
console.log(`  Modo: ${RECREATE ? 'recrear el índice' : 'sólo rellenar'}\n`);

const login = await call('POST', '/iam/auth/login', {
  body: { email: EMAIL, password: PASSWORD },
});
if (login.status !== 200 && login.status !== 201) {
  fallar('No se pudo iniciar sesión', login.body);
}
const token = login.body?.accessToken;
if (!token) fallar('El login no devolvió accessToken', login.body);

const antes = await call('GET', '/internal/community/search/health', { token });
if (antes.status !== 200)
  fallar('No se pudo leer el estado del índice', antes.body);
console.log(
  `  Antes:  ${antes.body.profiles} perfiles públicos · ${
    antes.body.documents ?? '—'
  } documentos · índice ${antes.body.available ? 'disponible' : 'CAÍDO'}`,
);
if (!antes.body.available) {
  fallar('El índice no responde: no hay nada que reindexar', antes.body);
}

const inicio = Date.now();
const res = await call('POST', '/internal/community/search/reindex', {
  token,
  body: { recreate: RECREATE },
});
if (res.status !== 200) fallar('El reindexado falló', res.body);

const { indexed, total, confirmed, errors } = res.body;
console.log(
  `\n  ${res.body.summary} — el índice confirma ${confirmed} · ${
    Date.now() - inicio
  } ms`,
);

if (errors) fallar('Algún lote reportó errores parciales', res.body);
if (indexed !== total) {
  fallar(`Se indexaron ${indexed} de ${total} perfiles`, res.body);
}
if (confirmed !== total) {
  fallar(
    `El índice confirma ${confirmed} documentos pero hay ${total} perfiles`,
    res.body,
  );
}

console.log(`\n  ✓ Directorio público reindexado: ${total} de ${total}\n`);
