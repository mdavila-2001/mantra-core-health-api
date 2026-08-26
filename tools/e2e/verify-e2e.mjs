#!/usr/bin/env node
/**
 * verify-e2e.mjs — Comprueba que lo sembrado sirve, desde afuera.
 *
 * ## Por qué existe además del sembrador
 *
 * Porque «el `INSERT` no lanzó error» no es lo mismo que «esto funciona». El
 * sembrador ya declara el status que espera de cada llamada, pero eso comprueba
 * la escritura; lo que hace falta comprobar es el **efecto**: que la identidad
 * entra por el login real, que el token dice lo que tiene que decir, y que el
 * perfil resuelve por la superficie pública anónima que el carril promete.
 *
 * Son dos preguntas distintas y las dos fallan por su cuenta. Una cuenta puede
 * crearse bien y no poder iniciar sesión; una vitrina puede guardarse bien y no
 * aparecer en el directorio porque le falta la visibilidad.
 *
 * ## Las dos verificaciones
 *
 * - `--auth` (o sin argumentos, que corre las dos): cada actor **inicia sesión
 *   de verdad** y consulta su propia sesión. Un solo fallo termina con código
 *   distinto de cero.
 * - `--domain`: los invariantes del dominio que P4 necesita, comprobados
 *   **sin token**, que es como los va a ver un visitante.
 *
 * Uso:
 *   node tools/e2e/verify-e2e.mjs
 *   node tools/e2e/verify-e2e.mjs --auth
 *   node tools/e2e/verify-e2e.mjs --domain
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  claims,
  crearCliente,
  exigirAmbienteE2E,
  leerEnvE2E,
  RAIZ_REPO,
} from './entorno.mjs';

const env = exigirAmbienteE2E(leerEnvE2E());
const BASE = env.E2E_API_BASE_URL ?? 'http://localhost:3001';
const api = crearCliente(BASE);

const soloAuth = process.argv.includes('--auth');
const soloDominio = process.argv.includes('--domain');
const correAuth = soloAuth || !soloDominio;
const correDominio = soloDominio || !soloAuth;

/** Los problemas encontrados. Vacío al final es la única forma de salir con 0. */
const problemas = [];

/** Registra una comprobación y su resultado. */
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) {
    console.log(`   ok    ${nombre}`);
  } else {
    console.log(`  FALLA  ${nombre}${detalle ? ` — ${detalle}` : ''}`);
    problemas.push(nombre);
  }
}

/** El manifiesto que dejó el sembrador. Los tests no conocen uuids. */
function leerManifiesto() {
  const ruta = resolve(RAIZ_REPO, 'seed-manifest.json');
  try {
    return JSON.parse(readFileSync(ruta, 'utf8'));
  } catch {
    console.error(`\n  No hay ${ruta}. Corré primero el sembrador.\n`);
    process.exit(1);
  }
}

const manifiesto = leerManifiesto();

/** Los actores con contraseña, tal como los declara `.env.e2e`. */
const CREDENCIALES = {
  'doctor.one': { email: env.E2E_DOCTOR_1_EMAIL, password: env.E2E_DOCTOR_1_PASSWORD },
  'doctor.two': { email: env.E2E_DOCTOR_2_EMAIL, password: env.E2E_DOCTOR_2_PASSWORD },
  'doctor.hidden': {
    email: 'doctor.oculto.e2e@local.test',
    password: env.E2E_DOCTOR_2_PASSWORD,
  },
};

async function verificarAuth() {
  console.log('\n  ── Identidades: login real ──────────────────────────────\n');

  for (const [clave, cred] of Object.entries(CREDENCIALES)) {
    if (!manifiesto.actors[clave]) {
      comprobar(`${clave} está en el manifiesto`, false, 'el sembrador no lo dejó');
      continue;
    }

    const login = await api.llamar(`Login de ${clave}`, 'POST', '/iam/auth/login', {
      body: { email: cred.email, password: cred.password },
      espera: [200, 201],
    });

    const token = login.body?.accessToken;
    comprobar(`${clave} inicia sesión`, Boolean(token), `status ${login.status}`);
    if (!token) continue;

    // No alcanza con que el login devuelva 200: el token tiene que servir para
    // algo. Se usa como lo usa el cliente real.
    const yo = await api.llamar(`Sesión de ${clave}`, 'GET', '/community/profiles/me', {
      token,
      espera: [200],
    });
    comprobar(`${clave} resuelve su propia vitrina`, yo.status === 200);

    const c = claims(token);
    comprobar(`${clave} trae perfil profesional en el token`, Boolean(c.hpid));
    comprobar(`${clave} trae tenant en el token`, Boolean(c.tenants?.[0]));

    // La visibilidad que el sembrador declaró es la que el servidor guardó.
    const esperada = manifiesto.actors[clave].published ? 'PUBLIC' : 'PRIVATE';
    comprobar(
      `${clave} tiene visibilidad ${esperada}`,
      yo.body?.visibility === esperada,
      `es ${yo.body?.visibility}`,
    );
  }
}

async function verificarDominio() {
  console.log('\n  ── Directorio público: sin token ────────────────────────\n');

  const publicados = Object.entries(manifiesto.actors).filter(([, a]) => a.published);
  const ocultos = Object.entries(manifiesto.actors).filter(([, a]) => !a.published);

  // 1 · La búsqueda anónima encuentra a los publicados.
  const busqueda = await api.llamar(
    'Búsqueda unificada sin token',
    'GET',
    '/public/search?limit=50',
    { espera: [200] },
  );
  const slugsVisibles = new Set((busqueda.body?.items ?? []).map((i) => i.slug));

  for (const [clave, actor] of publicados) {
    comprobar(
      `${clave} (${actor.slug}) aparece en el buscador anónimo`,
      slugsVisibles.has(actor.slug),
    );
  }

  // 2 · Y no encuentra a los que no se publicaron. Es la mitad que importa:
  //     un directorio que muestra todo no está filtrando, está listando.
  for (const [clave, actor] of ocultos) {
    comprobar(
      `${clave} (${actor.slug}) NO aparece en el buscador anónimo`,
      !slugsVisibles.has(actor.slug),
    );
  }

  // 3 · La ficha resuelve por slug, sin sesión.
  for (const [clave, actor] of publicados) {
    const ficha = await api.llamar(`Ficha pública de ${clave}`, 'GET', `/p/${actor.slug}`, {
      espera: [200],
    });
    comprobar(`${clave} resuelve en /p/${actor.slug}`, ficha.status === 200);
    comprobar(
      `${clave} sirve su nombre en la ficha`,
      typeof ficha.body?.displayName === 'string' && ficha.body.displayName.length > 0,
    );

    // 4 · Y no filtra nada interno. La lista blanca vive en el servidor; esto
    //     comprueba la salida real, que es lo que llega al navegador.
    const prohibidas = [
      'tenantId',
      'targetId',
      'targetTypeConceptId',
      'statusConceptId',
      'visibilityConceptId',
      'verificationStatusConceptId',
      'avatarFileId',
      'coverFileId',
      'createdByUserId',
      'updatedByUserId',
      'rowVersion',
    ];
    const filtradas = prohibidas.filter((k) => k in (ficha.body ?? {}));
    comprobar(
      `${clave} no expone campos internos`,
      filtradas.length === 0,
      filtradas.join(', '),
    );
  }

  // 5 · Un slug despublicado da el **mismo** 404 que uno inexistente. Es la
  //     comprobación que necesita el perfil oculto para existir.
  const inexistente = await api.llamar(
    'Slug inexistente',
    'GET',
    '/p/no-existe-en-ninguna-parte-e2e',
    { espera: [404] },
  );
  for (const [clave, actor] of ocultos) {
    const despublicado = await api.llamar(
      `Slug despublicado de ${clave}`,
      'GET',
      `/p/${actor.slug}`,
      { espera: [404] },
    );
    comprobar(`${clave} despublicado da 404`, despublicado.status === 404);
    comprobar(
      `${clave} da el mismo mensaje que un slug inexistente`,
      despublicado.body?.message === inexistente.body?.message,
      `"${despublicado.body?.message}" vs "${inexistente.body?.message}"`,
    );
  }

  // 6 · El prefijo promete un tipo. Un profesional pedido como farmacia es 404.
  if (publicados.length > 0) {
    const [, actor] = publicados[0];
    const tipoEquivocado = await api.llamar(
      'Profesional pedido por el prefijo de farmacia',
      'GET',
      `/f/${actor.slug}`,
      { espera: [404] },
    );
    comprobar('el prefijo equivocado da 404 y no redirige', tipoEquivocado.status === 404);
  }
}

async function main() {
  console.log(`\n  Verificando el entorno E2E de ${BASE}`);
  console.log(`  Base: ${env.DB_NAME} · manifiesto ${manifiesto.version}`);

  if (correAuth) await verificarAuth();
  if (correDominio) await verificarDominio();

  console.log('');
  if (problemas.length > 0) {
    console.log(`  ${problemas.length} comprobación(es) fallaron:\n`);
    for (const p of problemas) console.log(`    · ${p}`);
    console.log('');
    process.exit(1);
  }
  console.log('  Todo verde.\n');
}

await main();
