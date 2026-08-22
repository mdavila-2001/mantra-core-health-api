#!/usr/bin/env node
/**
 * Journey funcional del carril P7 · Grupos y foros.
 *
 * ## Qué prueba, y por qué contra la API viva
 *
 * El recorrido completo del carril con **dos personas distintas**:
 *
 * ```text
 * A crea un grupo → B lo encuentra en el directorio → B se une →
 * A publica en el muro → B lo ve y comenta → B recibe la notificación
 * ```
 *
 * Contra la API real y no contra mocks, porque lo que este carril arriesga no
 * es la forma de los objetos —eso ya lo fijan las pruebas unitarias— sino las
 * costuras: que el grupo nazca con su organización y sea visible en el
 * directorio, que la membresía habilite publicar, que el hilo cuelgue del
 * grupo y que el aviso llegue a la bandeja de la otra persona. Ninguna de esas
 * cuatro cosas se puede comprobar con un doble.
 *
 * Reutiliza los actores que `seed-e2e.mjs` ya dejó sembrados: dos doctores con
 * cuenta, rol y perfil. No crea actores nuevos.
 *
 * Uso:
 *   node tools/e2e/journey-p7-grupos.mjs
 *
 * Lee `E2E_BASE_URL` del `.env.e2e`; se puede apuntar a otra instancia local
 * con `P7_BASE_URL=http://localhost:3010`.
 */
import { call, claims, exigir, SeedError } from './api-client.mjs';
import { cargarEntorno, exigirCredenciales, exigirEntornoE2E } from './e2e-env.mjs';

const env = cargarEntorno();
const BASE = process.env.P7_BASE_URL ?? exigirEntornoE2E(env);
const ACTORES = exigirCredenciales(env);

/** Sufijo único del recorrido, para no chocar con corridas anteriores. */
const MARCA = `p7-${Date.now().toString(36)}`;

/** Espera pasiva: el limitador de login es por IP y esto usa dos cuentas. */
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Inicia sesión y devuelve el token y el tenant del actor. */
async function entrar(credenciales) {
  const respuesta = await call(BASE, 'POST', '/iam/auth/login', {
    body: { email: credenciales.email, password: credenciales.password },
  });
  if (respuesta.status === 429) {
    // El limitador haciendo su trabajo, no un actor roto.
    await dormir(20_000);
    return entrar(credenciales);
  }
  if (respuesta.status !== 200 || !respuesta.body?.accessToken) {
    throw new SeedError(`login de ${credenciales.email} devolvió ${respuesta.status}`, respuesta.body);
  }
  const token = respuesta.body.accessToken;
  const payload = claims(token);
  return { token, tenantId: payload.tenants?.[0], userId: payload.sub };
}

/**
 * Perfil público del actor, creándolo si todavía no lo tiene.
 *
 * Un grupo lo crea un **perfil público**, no una cuenta: es la identidad con la
 * que se participa en la comunidad, y es una entidad aparte del perfil clínico.
 */
async function perfilPublico(token, tenantId, nombre, slug) {
  const propio = await call(BASE, 'GET', '/community/profiles/me', { token });
  if (propio.status === 200 && propio.body?.id) return propio.body.id;

  const creado = await exigir(
    BASE,
    'PUT',
    '/community/profiles/me',
    { token, body: { tenantId, slug, displayName: nombre } },
    [200, 201],
  );
  return creado.id;
}

/** Comprueba una condición y la deja anotada en la salida. */
function comprobar(condicion, descripcion, detalle) {
  if (!condicion) throw new SeedError(`FALLÓ: ${descripcion}`, detalle);
  console.log(`  ✓ ${descripcion}`);
}

async function main() {
  console.log(`Journey P7 · grupos y foros · contra ${BASE}`);

  const a = await entrar(ACTORES['doctor.one']);
  const b = await entrar(ACTORES['doctor.two']);
  comprobar(!!a.token && !!b.token, 'las dos personas inician sesión');
  comprobar(!!a.tenantId, 'el actor A trae organización en su token', a);

  const cabeceraA = { token: a.token };
  const perfilA = await perfilPublico(a.token, a.tenantId, 'Doctora A (E2E)', `e2e-doctor-a`);
  const perfilB = await perfilPublico(b.token, b.tenantId, 'Doctor B (E2E)', `e2e-doctor-b`);
  comprobar(perfilA !== perfilB, 'cada persona tiene su propio perfil público');

  // --- A crea el grupo -------------------------------------------------------
  const creado = await exigir(BASE, 'POST', '/community/groups', {
    ...cabeceraA,
    body: {
      slug: `grupo-${MARCA}`,
      name: `Ateneo de cardiología ${MARCA}`,
      description: 'Grupo del journey P7',
      visibility: 'PUBLIC',
    },
  });
  const groupId = creado.id;
  comprobar(!!groupId, 'A crea el grupo', creado);

  const fichaA = await exigir(BASE, 'GET', `/community/groups/${groupId}`, cabeceraA);
  comprobar(fichaA.viewer.isMember, 'A queda dentro de su propio grupo', fichaA.viewer);
  comprobar(fichaA.viewer.canPost, 'A puede publicar en él', fichaA.viewer);
  comprobar(fichaA.tenantId === a.tenantId, 'el grupo nace con su organización', fichaA);

  // --- B lo encuentra en el directorio --------------------------------------
  const directorio = await exigir(
    BASE,
    'GET',
    `/community/groups?tenantId=${a.tenantId}&q=${encodeURIComponent(MARCA)}`,
    { token: b.token },
  );
  comprobar(
    directorio.items.some((g) => g.id === groupId),
    'B lo encuentra buscando en el directorio',
    directorio,
  );

  // --- B se une --------------------------------------------------------------
  const alta = await exigir(BASE, 'POST', `/community/groups/${groupId}/members`, {
    token: b.token,
    body: { memberProfileId: perfilB },
  });
  comprobar(!!alta.id, 'B se une al grupo', alta);

  const fichaB = await exigir(BASE, 'GET', `/community/groups/${groupId}`, { token: b.token });
  comprobar(fichaB.viewer.isMember, 'en un grupo público la membresía queda activa', fichaB.viewer);
  comprobar(fichaB.memberCount === 2, 'el grupo cuenta dos integrantes', fichaB);

  // --- A publica -------------------------------------------------------------
  const publicacion = await exigir(BASE, 'POST', `/community/groups/${groupId}/posts`, {
    ...cabeceraA,
    body: { authorProfileId: perfilA, bodyText: `Caso para discutir (${MARCA})` },
  });
  comprobar(!!publicacion.id, 'A publica en el muro', publicacion);

  // --- B lo ve y comenta -----------------------------------------------------
  const muroB = await exigir(BASE, 'GET', `/community/groups/${groupId}/posts`, {
    token: b.token,
  });
  comprobar(
    muroB.items.some((p) => p.id === publicacion.id),
    'B ve la publicación en el muro',
    muroB,
  );

  const respuesta = await exigir(BASE, 'POST', `/community/groups/${groupId}/posts`, {
    token: b.token,
    body: {
      authorProfileId: perfilB,
      bodyText: 'Coincido, lo vimos parecido la semana pasada.',
      parentCommentId: publicacion.id,
    },
  });
  comprobar(respuesta.parentCommentId === publicacion.id, 'B comenta colgado del hilo', respuesta);

  const muroConHilo = await exigir(BASE, 'GET', `/community/groups/${groupId}/posts`, cabeceraA);
  const hilo = muroConHilo.items.find((p) => p.id === publicacion.id);
  comprobar(
    hilo?.replies?.some((r) => r.id === respuesta.id),
    'la respuesta viaja anidada bajo su publicación',
    hilo,
  );
  comprobar(
    muroConHilo.items.every((p) => p.id !== respuesta.id),
    'la respuesta no aparece además como publicación suelta',
    muroConHilo,
  );

  // --- B recibe la notificación ---------------------------------------------
  // El aviso se crea fuera de la transacción del muro; se le da un margen.
  let bandeja = { items: [] };
  for (let intento = 0; intento < 10; intento += 1) {
    bandeja = await exigir(BASE, 'GET', '/notifications/in-app?limit=25', { token: b.token });
    if (bandeja.items.some((n) => n.relatedResourceId === groupId)) break;
    await dormir(1000);
  }
  const aviso = bandeja.items.find((n) => n.relatedResourceId === groupId);
  comprobar(!!aviso, 'B recibe la notificación de la publicación nueva', bandeja);
  comprobar(
    aviso.relatedResourceType === 'community.groups',
    'la notificación es navegable: dice a qué recurso lleva',
    aviso,
  );

  // --- A no se avisa a sí mismo ---------------------------------------------
  const bandejaA = await exigir(BASE, 'GET', '/notifications/in-app?limit=25', cabeceraA);
  const propias = bandejaA.items.filter(
    (n) => n.relatedResourceId === groupId && n.categoryConceptId === aviso.categoryConceptId,
  );
  comprobar(propias.length === 0, 'A no recibe aviso de lo que él mismo publicó', bandejaA);

  // --- Salir del grupo -------------------------------------------------------
  const baja = await exigir(BASE, 'DELETE', `/community/groups/${groupId}/members/${perfilB}`, {
    token: b.token,
  });
  comprobar(!!baja.id, 'B puede dejar el grupo', baja);

  const fichaFinal = await exigir(BASE, 'GET', `/community/groups/${groupId}`, cabeceraA);
  comprobar(fichaFinal.memberCount === 1, 'la baja descuenta al integrante', fichaFinal);

  console.log(`\nJourney P7 completo. Grupo: ${groupId}`);
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  if (error.detalle) console.error(JSON.stringify(error.detalle, null, 2));
  process.exit(1);
});
