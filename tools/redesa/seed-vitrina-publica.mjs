#!/usr/bin/env node
/**
 * seed-vitrina-publica.mjs — Puebla la **cara pública** de AloVida: médicos con
 * vitrina, trayectoria completa y publicaciones; clínicas, laboratorios y
 * farmacias verificados; y la gente que los lee, los comenta y reacciona.
 *
 * ## Por qué hace falta otro seeder
 *
 * `seed-dev-data.mjs` siembra la trastienda —médicos, agendas, pacientes,
 * citas, recetas— y **no toca `community` ni una vez**. Eso deja la superficie
 * pública vacía por construcción: `GET /public/search/organizations` y
 * `/pharmacies` devuelven cero, y los profesionales que sí aparecen son los dos
 * de la semilla mínima. Con esa base, cualquiera que abra el buscador sin
 * sesión ve pantallas en blanco y no puede distinguir «no hay datos» de «el
 * endpoint no funciona» — que es exactamente lo que un seeder existe para
 * evitar.
 *
 * ## Qué siembra, y por qué eso y no otra cosa
 *
 * 1. **Médicos con login real.** Contraseña conocida y fija, impresa al final:
 *    la gracia es poder entrar y ver la aplicación desde adentro, no sólo
 *    mirarla desde afuera.
 * 2. **Su vitrina pública** (`PUT /community/profiles/me`): sin ella un médico
 *    existe para el sistema pero **no** para el buscador público, porque la
 *    búsqueda lee `community.public_profiles` y filtra por visibilidad.
 * 3. **Trayectoria completa, con universidades bolivianas.** Siete etapas por
 *    profesional —pregrado, internado rotatorio, servicio social rural
 *    obligatorio, residencia, posgrado, ejercicio actual y docencia— con
 *    instituciones reales del sistema boliviano. La formación académica se
 *    guarda como afiliación porque **el modelo no tiene otra cosa**: no existe
 *    tabla de títulos ni endpoint para declarar universidad y año de egreso, y
 *    `practitioner_affiliations` es exactamente lo que la ficha pública muestra
 *    como «Trayectoria». Ver la cabecera de `datos/elenco-medico.mjs`.
 * 4. **Publicaciones, cuatro por profesional.** Con quince profesionales son
 *    **sesenta**, todas distintas, de dos a cuatro párrafos, con etiquetas e
 *    imagen. Es lo que convierte una ficha en un perfil vivo: sin posts, la
 *    sección «Publicaciones» dice siempre lo mismo y no se puede juzgar cómo se
 *    ve llena.
 * 5. **Comentarios y reacciones de gente que existe.** Dos comentarios por
 *    publicación y entre cinco y once reacciones, escritos por dieciséis
 *    cuentas de vecino con documento y contraseña propios. No se pueden
 *    falsear: `reaction_count` y `comment_count` salen de contar filas reales,
 *    y cada fila exige un perfil titular que la firme
 *    (`assertActsAsProfile`). Además la tarjeta de la ficha **esconde el bloque
 *    de interacción cuando los dos contadores son cero**, así que sin esto se
 *    sembraba justamente el estado que hace invisible media tarjeta.
 * 6. **Clínicas, laboratorios y farmacias.** Se aprovisionan como tenants y se
 *    **verifican**: la vitrina pública de una organización no se crea a mano,
 *    la proyecta `PublicProfileProjectionService` cuando el tenant se verifica.
 *    Sembrar sin verificar deja la organización invisible y sin explicación.
 * 7. **Especialidad real, no sólo en el titular.** La guía de profesionales
 *    agrupa y filtra por `practitioner_specialties`; sin este paso todos caen
 *    bajo «Sin especialidad registrada». Se resuelve el concepto real del
 *    catálogo (`clinical-forms:specialty:*`) y se asigna con
 *    `POST /profiles/practitioners/{id}/specialties`.
 * 8. **Dirección con coordenadas, para cada organización.** La ficha pública
 *    (`/o/`, `/l/`, `/f/`) tiene un mapa aparte de la descripción escrita; sin
 *    una fila en `common.addresses` con `latitude`/`longitude` no hay qué
 *    dibujar ahí.
 * 9. **Teléfono y matrícula completa.** El teléfono viaja en el alta y se
 *    escribe en `common.contact_points` junto al correo. La matrícula va con
 *    autoridad emisora y fecha, que sin ellas era un número pelado.
 *
 * **Lo que sigue faltando, y por qué esta corrida no lo resuelve:** los
 * médicos no tienen consultorio propio en `common.addresses` — el tipo de
 * dueño (`OwnerType`) sólo contempla `USER`, `PATIENT` y `TENANT`, no un
 * perfil de profesional, así que hoy no hay ningún `ownerId` correcto para
 * escribir esa fila. Es un hueco del contrato, no del seeder: agregarlo a mano
 * con el `ownerId` equivocado dejaría datos que no se pueden leer de vuelta.
 *
 * No es un mock: escribe por la API real, con sus guards y validaciones. Si el
 * contrato cambia, la corrida termina en rojo en vez de dejar datos a medias.
 *
 * ## Uso
 *
 *   yarn seed:vitrina
 *   yarn seed:vitrina --doctors 15 --posts 4 --comentarios 2
 *   yarn seed:vitrina --base-url http://localhost:3031
 *   yarn seed:vitrina --sin-imagenes        (sin red hacia bancos de fotos)
 *   yarn seed:vitrina --solo-interaccion    (no crea nada nuevo: comenta y
 *                                            reacciona sobre lo ya publicado)
 *
 * Requiere una API levantada con el administrador de arranque
 * (`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`).
 *
 * **Sobre el límite de peticiones:** el alta de cuentas está limitada a diez
 * por minuto por IP y el resto de la API a trescientas. Esta corrida hace
 * bastante más que eso, así que reintenta sola ante un `429` esperando lo que
 * diga `Retry-After`. Corre mucho más rápido contra una API levantada con
 * `RATE_LIMIT_DISABLED=true`, y esa es la forma recomendada.
 *
 * Es **acumulativo**: cada corrida agrega una tanda con sufijo propio, así que
 * repetirlo aumenta el volumen en vez de chocar por unicidad del slug.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MEDICOS } from './datos/elenco-medico.mjs';
import { publicacionesPara } from './datos/publicaciones.mjs';
import {
  CIUDADANOS,
  COMENTARIOS_GENERALES,
  COMENTARIOS_POR_ESPECIALIDAD,
  REACCIONES,
  RESPUESTAS_DEL_AUTOR,
} from './datos/comunidad.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const BASE = arg('base-url', process.env.API_BASE_URL ?? 'http://localhost:3000');
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@redesa.test';
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';

/**
 * La contraseña de todas las cuentas sembradas.
 *
 * Fija y conocida a propósito: una cuenta de demostración con contraseña al
 * azar no sirve para entrar, que es justamente para lo que existe. Nunca sale
 * de un entorno de desarrollo — el guardia de `NODE_ENV` de más abajo es lo que
 * lo garantiza.
 */
const CLAVE = process.env.SEED_PASSWORD ?? 'D3mo-passw0rd!';

const DOCTORES = Number(arg('doctors', MEDICOS.length));
const POSTS_POR_DOCTOR = Number(arg('posts', 4));
const COMENTARIOS_POR_POST = Number(arg('comentarios', 2));
const CIUDADANOS_PEDIDOS = Number(arg('vecinos', CIUDADANOS.length));
/** Piso de reacciones por publicación; el techo se calcula sobre este número. */
const REACCIONES_MINIMAS = Number(arg('reacciones', 5));
const OUT = resolve(REPO, 'output.seed-vitrina.json');

if (process.env.NODE_ENV === 'production' && !flag('force')) {
  console.error(
    'NODE_ENV=production: este script siembra datos ficticios y no debe correr aquí.\n' +
      'Si de verdad es lo que querés, repetilo con --force.',
  );
  process.exit(1);
}

/* ── El registro de la corrida ──────────────────────────────────────────── */

const log = [];
let token = null;

/** Espera `ms` milisegundos. Sólo se usa para respetar un `429`. */
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Una llamada a la API, anotada en el registro de la corrida.
 *
 * ## El reintento ante `429`
 *
 * El alta de cuentas admite diez por minuto por IP y el resto de la API
 * trescientas. Esta corrida hace del orden de mil peticiones, así que chocar
 * con el limitador no es un caso raro: es lo normal cuando se corre contra una
 * API que no lo tiene desactivado. Frenar la corrida entera por eso dejaría
 * datos a medias —médicos sin publicaciones, publicaciones sin comentarios—,
 * que es peor que tardar. Así que espera y vuelve a intentar, hasta tres veces,
 * respetando `Retry-After` cuando el servidor lo manda.
 */
async function call(section, title, method, path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const bearer = options.token === undefined ? token : options.token;
  if (options.auth !== false && bearer) headers.Authorization = `Bearer ${bearer}`;

  const expected =
    options.expect === undefined
      ? null
      : Array.isArray(options.expect)
        ? options.expect
        : [options.expect];

  let status = 0;
  let body = null;
  let transportError = null;
  let esperas = 0;
  const started = Date.now();

  for (let intento = 0; intento < 4; intento += 1) {
    transportError = null;
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      status = res.status;
      const text = await res.text();
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      if (status !== 429 || (expected && expected.includes(429))) break;
      const retry = Number(res.headers.get('retry-after'));
      const espera = Number.isFinite(retry) && retry > 0 ? retry * 1000 : 61_000;
      esperas += 1;
      process.stdout.write(
        `    · límite de peticiones alcanzado; esperando ${Math.round(espera / 1000)} s…\n`,
      );
      await dormir(espera);
    } catch (error) {
      transportError = error instanceof Error ? error.message : String(error);
      break;
    }
  }

  const ok =
    expected === null ? status >= 200 && status < 300 : expected.includes(status);

  log.push({
    section,
    title,
    method,
    path,
    status,
    expected,
    ok,
    esperas: esperas || undefined,
    durationMs: Date.now() - started,
    detail: ok ? undefined : resumir(transportError ?? body),
  });
  return { status, body, ok };
}

function resumir(body) {
  if (body === null || body === undefined) return '';
  const texto = typeof body === 'string' ? body : JSON.stringify(body);
  return texto.length > 400 ? `${texto.slice(0, 400)}…` : texto;
}

function paso(mensaje) {
  process.stdout.write(`${mensaje}\n`);
}

function exigir(valor, que) {
  if (valor === undefined || valor === null || valor === '') {
    throw new Error(`Falta ${que}: la corrida no puede seguir.`);
  }
  return valor;
}

/** Sufijo de la tanda: hace que repetir la corrida sume en vez de chocar. */
const TANDA = Date.now().toString(36).slice(-5);

function slugificar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ── Las imágenes ──────────────────────────────────────────────────────────
 *
 * Un perfil sin foto se lee como una cuenta a medio hacer, y una sección de
 * publicaciones sin una sola imagen no deja juzgar cómo se ve la tarjeta cuando
 * la lleva. Las fotos salen de bancos de imágenes libres —retratos de
 * `pravatar.cc`, fotos de `picsum.photos`—, se bajan una vez y se suben a
 * `common.files` con `POST /common/files/upload`. Son marcadores visuales, no
 * personas reales: `--sin-imagenes` las apaga si no hay red.                   */

const SIN_IMAGENES = flag('sin-imagenes');
const cacheImagenes = new Map();

async function bajarImagen(url) {
  if (cacheImagenes.has(url)) return cacheImagenes.get(url);
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) throw new Error('respuesta demasiado corta');
    cacheImagenes.set(url, buf);
    return buf;
  } catch (error) {
    cacheImagenes.set(url, null);
    log.push({
      section: 'imagenes',
      title: `bajar ${url}`,
      method: 'GET',
      path: url,
      status: 0,
      expected: null,
      ok: false,
      durationMs: 0,
      detail: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Sube unos bytes de imagen y devuelve el id del archivo, o `null`.
 *
 * `category: IMAGE` y `sensitivity: NORMAL` son lo que exige el cuerpo del
 * endpoint; `NORMAL` además es la condición para que `GET /public/media/:id`
 * pueda servirla a un anónimo.
 */
async function subirImagen(bearer, buffer, nombre) {
  if (!buffer) return null;
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/jpeg' }), nombre);
  form.append('category', 'IMAGE');
  form.append('sensitivity', 'NORMAL');
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}/common/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
      body: form,
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    const ok = res.status >= 200 && res.status < 300;
    log.push({
      section: 'imagenes',
      title: `subir ${nombre}`,
      method: 'POST',
      path: '/common/files/upload',
      status: res.status,
      expected: [201],
      ok,
      durationMs: Date.now() - started,
      detail: ok ? undefined : resumir(body),
    });
    return ok ? (body?.id ?? null) : null;
  } catch (error) {
    log.push({
      section: 'imagenes',
      title: `subir ${nombre}`,
      method: 'POST',
      path: '/common/files/upload',
      status: 0,
      expected: [201],
      ok: false,
      durationMs: Date.now() - started,
      detail: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Baja una foto y la sube; devuelve el id del archivo o `null`.
 *
 * `picsum.photos` y no un banco por etiqueta (`loremflickr`): éste devuelve un
 * marcador rojo de «no encontré fotos» cuando la etiqueta —o la combinación de
 * etiquetas— no tiene suficientes, y ese marcador terminaba publicado como si
 * fuera la imagen del artículo. `picsum` siempre devuelve una foto real, y con
 * `seed` la misma consulta cae siempre en la misma imagen: la corrida es
 * reproducible. No son fotos médicas —son marcadores— y con eso alcanza para
 * ver cómo se comporta la tarjeta cuando lleva imagen.
 */
async function imagenTematica(bearer, consulta, nombre, ancho = 1200, alto = 675) {
  if (SIN_IMAGENES || !consulta) return null;
  const semilla = slugificar(consulta) || 'alovida';
  const url = `https://picsum.photos/seed/${encodeURIComponent(semilla)}/${ancho}/${alto}`;
  return subirImagen(bearer, await bajarImagen(url), nombre);
}

/** Un retrato de `pravatar.cc`. Determinístico por índice. */
async function retrato(bearer, indice, nombre) {
  if (SIN_IMAGENES) return null;
  const url = `https://i.pravatar.cc/512?img=${(indice % 70) + 1}`;
  return subirImagen(bearer, await bajarImagen(url), nombre);
}

/* ── Geografía de las organizaciones ────────────────────────────────────── */

/**
 * País y jurisdicción de Bolivia, con sus uuid derivados del catálogo
 * (`CONCEPTS.COUNTRY_BO` / `JURISDICTION_BO`).
 *
 * Van fijos porque los tipos territoriales —hospital, consultorio, farmacia,
 * laboratorio— los **exigen**: sin ellos el alta responde 422 diciendo
 * literalmente bajo qué regulador no sabe que opera. Es una precondición del
 * dominio, no un detalle del script.
 */
const BOLIVIA = {
  countryConceptId: '9294e8fb-a776-5c37-b868-229e5794f401',
  jurisdictionConceptId: '790554f9-c1e3-564f-81b3-dc59d2ca0272',
};

/**
 * Centro aproximado de cada ciudad sembrada, para el mapa de la ficha.
 *
 * No son las coordenadas reales de cada sede —eso lo carga quien administra
 * la organización—, son el punto de partida de una dispersión chica
 * (`dispersar`, más abajo) para que las organizaciones de una misma ciudad no
 * queden todas apiladas en el mismo pixel del mapa.
 */
const CENTRO_POR_CIUDAD = {
  'La Paz': { lat: -16.5, lng: -68.15 },
  'El Alto': { lat: -16.5047, lng: -68.1633 },
  Cochabamba: { lat: -17.3895, lng: -66.1568 },
  'Santa Cruz de la Sierra': { lat: -17.7833, lng: -63.1821 },
  Sucre: { lat: -19.0333, lng: -65.2627 },
  Tarija: { lat: -21.5355, lng: -64.7296 },
  Oruro: { lat: -17.9833, lng: -67.15 },
  Potosí: { lat: -19.5836, lng: -65.7531 },
};

/**
 * Un punto cerca del centro de `ciudad`, corrido por `indice`.
 *
 * El corrimiento es determinístico —no al azar— para que la corrida sea
 * reproducible: la misma organización cae siempre cerca del mismo punto, en
 * vez de saltar de lugar cada vez que se repite el seed.
 */
function dispersar(ciudad, indice) {
  const centro = CENTRO_POR_CIUDAD[ciudad] ?? CENTRO_POR_CIUDAD['La Paz'];
  const angulo = (indice * 47) % 360;
  const radio = 0.01 + (indice % 3) * 0.006;
  const rad = (angulo * Math.PI) / 180;
  return {
    lat: Number((centro.lat + radio * Math.cos(rad)).toFixed(6)),
    lng: Number((centro.lng + radio * Math.sin(rad)).toFixed(6)),
  };
}

/** Organizaciones con cara pública: clínicas, laboratorios y farmacias. */
const ORGANIZACIONES = [
  {
    tipo: 'HOSPITAL',
    nombre: 'Clínica del Sur',
    ciudad: 'La Paz',
    calle: 'Av. Hernando Siles 3120, Obrajes',
  },
  {
    tipo: 'HOSPITAL',
    nombre: 'Hospital Santa María',
    ciudad: 'Santa Cruz de la Sierra',
    calle: 'Av. San Martín, 4.º Anillo',
  },
  {
    tipo: 'MEDICAL_OFFICE',
    nombre: 'Centro Médico Sopocachi',
    ciudad: 'La Paz',
    calle: 'Calle Rosendo Gutiérrez 574, Sopocachi',
  },
  {
    tipo: 'HEALTH_OTHER',
    nombre: 'Laboratorio Bioclínico Andino',
    ciudad: 'La Paz',
    calle: 'Av. Arce 2081',
  },
  {
    tipo: 'HEALTH_OTHER',
    nombre: 'Laboratorio Central Cochabamba',
    ciudad: 'Cochabamba',
    calle: 'Av. Ayacucho 234',
  },
  {
    tipo: 'PHARMACY',
    nombre: 'Farmacia Chuquiago',
    ciudad: 'La Paz',
    calle: 'Av. 6 de Agosto 2170',
  },
  {
    tipo: 'PHARMACY',
    nombre: 'Farmacia Vida Plena',
    ciudad: 'Santa Cruz de la Sierra',
    calle: 'Av. Cristo Redentor, 3.er Anillo',
  },
];

/* ── La corrida ─────────────────────────────────────────────────────────── */

const sembrado = {
  medicos: [],
  ciudadanos: [],
  organizaciones: [],
  publicaciones: 0,
  comentarios: 0,
  respuestas: 0,
  reacciones: 0,
};

/** Todo lo publicado en esta corrida, para la pasada de interacción. */
const publicaciones = [];

async function entrarComoAdmin() {
  paso('· Entrando como administrador de arranque…');
  const { body, ok } = await call('admin', 'login del admin', 'POST', '/iam/auth/login', {
    auth: false,
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!ok) {
    throw new Error(
      `No se pudo entrar como ${ADMIN_EMAIL}. ¿Está levantada la API en ${BASE} con BOOTSTRAP_ADMIN_*?`,
    );
  }
  token = exigir(body?.accessToken, 'el token del administrador');
  const claims = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
  );
  return {
    tenantId: exigir(claims.tenants?.[0], 'el tenant del administrador'),
    // `sub` y no `GET /iam/users/me`: ese endpoint espera un uuid en la ruta y
    // responde 400 a secas, que es un rato perdido buscando permisos.
    userId: exigir(claims.sub, 'el id del administrador'),
  };
}

/**
 * Da de alta un profesional entero: cuenta, vitrina, fotos, especialidad,
 * trayectoria y publicaciones.
 *
 * Devuelve la ficha del médico con su token y su perfil, porque las dos cosas
 * hacen falta después: el token para que responda a los comentarios de su
 * propia publicación, y el perfil para que reaccione a las de sus colegas.
 */
async function sembrarMedico(medico, indice, tenantId, especialidades) {
  const sufijo = `${TANDA}${indice}`;
  const email = `${slugificar(medico.nombre)}.${slugificar(medico.apellido)}.${sufijo}@alovida.test`;
  const quien = `${medico.nombre} ${medico.apellido}`;

  const alta = await call('medicos', `alta de ${quien}`, 'POST', '/iam/auth/register-practitioner', {
    auth: false,
    body: {
      email,
      password: CLAVE,
      name: medico.nombre,
      lastName: medico.apellido,
      licenseNumber: `${medico.matricula}-${sufijo}`,
      credentialNumber: `TIT-${sufijo}`,
      professionalTitle: medico.titulo,
      // El teléfono: se escribe en `common.contact_points` junto al correo, y
      // es lo primero que un médico busca en su propio perfil. Ningún seeder
      // lo sembraba, así que el bloque de contacto se veía siempre vacío.
      // Determinístico a partir del índice para que la corrida sea repetible.
      phone: `+591 7${String(10_000_000 + indice * 137).slice(0, 7)}`,
      // La matrícula, completa: sin autoridad ni fecha, la pestaña de
      // credenciales mostraba un número pelado que no dice quién lo emitió.
      regulatoryAuthority: 'Colegio Médico de Bolivia',
      licenseIssueDate: `${primerEjercicio(medico)}-03-15`,
    },
    expect: 201,
  });
  if (!alta.ok) return null;

  const acceso = await call('medicos', `login de ${email}`, 'POST', '/iam/auth/login', {
    auth: false,
    body: { email, password: CLAVE },
  });
  if (!acceso.ok) return null;
  const suToken = acceso.body.accessToken;

  // La vitrina: sin esto el médico no existe para el buscador público.
  const slug = `${slugificar(quien)}-${sufijo}`;
  const vitrinaBase = {
    tenantId,
    slug,
    // El nombre, y nada más. Un prefijo armado a mano daba «DrPatricia
    // Vargas» —sin espacio y en el género equivocado—, y el tratamiento ya
    // viaja en el `headline` («Dermatóloga · Dermatología»), que es donde
    // corresponde y donde no hay que adivinarle el género a nadie.
    displayName: quien,
    headline: `${medico.titulo} · ${medico.especialidad}`,
    biography: medico.bio,
    visibility: 'PUBLIC',
  };
  const vitrina = await call('medicos', `vitrina de ${quien}`, 'PUT', '/community/profiles/me', {
    token: suToken,
    body: vitrinaBase,
  });
  if (!vitrina.ok) return null;
  const profileId = vitrina.body.id;

  // El retrato y la portada. Se suben con el token del propio médico —
  // `AttachableFileService` exige que el archivo sea suyo— y se fijan con un
  // segundo PUT: `avatarFileId`/`coverFileId` sólo aceptan un id ya subido.
  // Sin foto la ficha cae a iniciales, que es digno pero se lee como perfil
  // sin terminar; sin portada cae al degradado de marca, que también lo es,
  // pero no deja ver cómo queda la ficha con las dos cosas puestas.
  let avatarPuesto = false;
  let portadaPuesta = false;
  const avatarFileId = await retrato(suToken, indice, `retrato-${slug}.jpg`);
  const coverFileId = await imagenTematica(
    suToken,
    `${medico.codigoEspecialidad}-consultorio`,
    `portada-${slug}.jpg`,
    1600,
    500,
  );
  if (avatarFileId || coverFileId) {
    const conFotos = await call('medicos', `fotos de ${quien}`, 'PUT', '/community/profiles/me', {
      token: suToken,
      body: {
        ...vitrinaBase,
        ...(avatarFileId ? { avatarFileId } : {}),
        ...(coverFileId ? { coverFileId } : {}),
      },
    });
    avatarPuesto = conFotos.ok && Boolean(avatarFileId);
    portadaPuesta = conFotos.ok && Boolean(coverFileId);
  }

  // La especialidad: sin ella el médico cae bajo «Sin especialidad
  // registrada» en la guía, y el chip de su especialidad nunca tiene a nadie
  // debajo. `practitionerProfileId` viene del alta, no de la vitrina —son dos
  // ids distintos (el perfil clínico y el perfil social).
  const concepto = especialidades.get(medico.codigoEspecialidad);
  let especialidadAsignada = false;
  if (concepto) {
    const especialidad = await call(
      'medicos',
      `especialidad de ${quien}`,
      'POST',
      `/profiles/practitioners/${alta.body.practitionerProfileId}/specialties`,
      {
        token: suToken,
        body: { specialtyConceptId: concepto.conceptId, isPrimary: true },
        expect: 201,
      },
    );
    especialidadAsignada = especialidad.ok;
  }

  // La trayectoria entera. Va con el token del propio médico porque
  // `me/affiliations` es self-service puro — no hay atajo de plataforma, y es
  // la razón por la que hasta hace poco casi ningún médico sembrado tenía
  // historial. Se siembra de la etapa más antigua a la más reciente para que
  // el orden de creación acompañe al de la línea de tiempo.
  const trayectoria = { pedidas: medico.trayectoria.length, puestas: 0, porTipo: {} };
  for (const etapa of medico.trayectoria) {
    const puesta = await call(
      'trayectoria',
      `${etapa.tipo} · ${etapa.organizacion} de ${quien}`,
      'POST',
      '/profiles/practitioners/me/affiliations',
      {
        token: suToken,
        body: {
          organizationName: etapa.organizacion,
          roleTitle: etapa.cargo,
          ...(etapa.departamento ? { departmentText: etapa.departamento } : {}),
          startDate: etapa.desde,
          // Sin `endDate`: es lo que la pantalla lee como «actividad actual».
          ...(etapa.hasta ? { endDate: etapa.hasta } : {}),
        },
        expect: 201,
      },
    );
    if (puesta.ok) {
      trayectoria.puestas += 1;
      trayectoria.porTipo[etapa.tipo] = (trayectoria.porTipo[etapa.tipo] ?? 0) + 1;
    }
  }

  // Publicaciones: es lo que convierte una ficha en un perfil vivo. Cada médico
  // abre con lo específico de su especialidad y sigue con lo general. La mayoría
  // lleva una imagen; una de cada cuatro lleva **varias**, para poder ver el
  // carrusel deslizable de la tarjeta; alguna va sólo de texto.
  const cola = publicacionesPara(medico.codigoEspecialidad);
  let publicacionesConImagen = 0;
  for (let i = 0; i < POSTS_POR_DOCTOR; i += 1) {
    const entrada = cola[i % cola.length];
    const cuantasImagenes = i % 4 === 3 ? 3 : 1;
    const media = [];
    for (let n = 0; n < cuantasImagenes; n += 1) {
      const fileId = await imagenTematica(
        suToken,
        `${entrada.imagen}-${medico.codigoEspecialidad}-${i}-${n}`,
        `post-${slug}-${i + 1}-${n + 1}.jpg`,
      );
      if (fileId) {
        media.push({
          fileId,
          mediaRole: 'IMAGE',
          altText: entrada.hashtags?.[0] ?? 'Imagen de la publicación',
          ordinal: n,
        });
      }
    }
    const post = await call('publicaciones', `post ${i + 1} de ${quien}`, 'POST', `/community/profiles/${profileId}/posts`, {
      token: suToken,
      body: {
        bodyText: entrada.texto,
        postType: 'TEXT',
        visibility: 'PUBLIC',
        ...(entrada.hashtags ? { hashtags: entrada.hashtags } : {}),
        ...(media.length > 0 ? { media } : {}),
      },
      expect: [200, 201],
    });
    if (post.ok) {
      sembrado.publicaciones += 1;
      if (media.length > 0) publicacionesConImagen += 1;
      publicaciones.push({
        id: post.body.id,
        autor: quien,
        autorToken: suToken,
        autorProfileId: profileId,
        codigoEspecialidad: medico.codigoEspecialidad,
        indiceEnLaEspecialidad: i,
      });
    }
  }

  const ficha = {
    nombre: quien,
    especialidad: medico.especialidad,
    especialidadAsignada,
    avatarPuesto,
    portadaPuesta,
    trayectoria,
    publicacionesConImagen,
    ciudad: medico.ciudad,
    email,
    clave: CLAVE,
    slug,
    profileId,
    fichaPublica: `/p/${slug}`,
  };
  sembrado.medicos.push(ficha);
  return { ...ficha, token: suToken };
}

/** El año en que el profesional empezó a ejercer, para fechar su matrícula. */
function primerEjercicio(medico) {
  const rural = medico.trayectoria.find((e) => e.tipo === 'SSSRO');
  const referencia = rural ?? medico.trayectoria[medico.trayectoria.length - 1];
  return Number(referencia.desde.slice(0, 4));
}

/**
 * Da de alta un vecino: cuenta de paciente, sesión y vitrina **privada**.
 *
 * Privada a propósito: `kindOf` mapea al valor por defecto `PRACTITIONER`
 * cualquier perfil cuyo sujeto sea una cuenta de usuario, así que una vitrina
 * pública de vecino aparecería en el buscador como si fuera médico. Ver la
 * cabecera de `datos/comunidad.mjs`.
 */
async function sembrarCiudadano(persona, indice, tenantId) {
  const ci = `${persona.ci}${TANDA.slice(-2)}`;
  const quien = `${persona.nombre} ${persona.apellido}`;
  const correo = `${slugificar(persona.nombre)}.${slugificar(persona.apellido)}.${TANDA}${indice}@alovida.test`;

  const alta = await call('vecinos', `alta de ${quien}`, 'POST', '/iam/auth/register-patient', {
    auth: false,
    body: {
      nationalId: ci,
      password: CLAVE,
      name: persona.nombre,
      lastName: persona.apellido,
      motherLastName: persona.segundoApellido,
      email: correo,
      birthDate: persona.nacimiento,
    },
    expect: 201,
  });
  if (!alta.ok) return null;

  const acceso = await call('vecinos', `login de ${quien}`, 'POST', '/iam/auth/login', {
    auth: false,
    body: { nationalId: ci, password: CLAVE },
  });
  if (!acceso.ok) return null;
  const suToken = acceso.body.accessToken;

  const slug = `${slugificar(quien)}-${TANDA}${indice}`;
  const base = {
    tenantId,
    slug,
    displayName: quien,
    headline: persona.titular,
    visibility: 'PRIVATE',
  };
  const vitrina = await call('vecinos', `vitrina de ${quien}`, 'PUT', '/community/profiles/me', {
    token: suToken,
    body: base,
  });
  if (!vitrina.ok) return null;

  // El retrato: un comentario firmado por unas iniciales grises se lee como
  // relleno. Se corren los índices para no repetir los retratos de los médicos.
  const avatarFileId = await retrato(suToken, indice + 30, `retrato-${slug}.jpg`);
  if (avatarFileId) {
    await call('vecinos', `foto de ${quien}`, 'PUT', '/community/profiles/me', {
      token: suToken,
      body: { ...base, avatarFileId },
    });
  }

  const ficha = {
    nombre: quien,
    ciudad: persona.ciudad,
    ci,
    email: correo,
    clave: CLAVE,
    profileId: vitrina.body.id,
    conFoto: Boolean(avatarFileId),
  };
  sembrado.ciudadanos.push(ficha);
  return { ...ficha, token: suToken };
}

/**
 * La pasada de interacción: comentarios, respuestas del autor y reacciones.
 *
 * ## Por qué va después y no dentro del alta de cada médico
 *
 * Porque las reacciones más creíbles vienen de perfiles que **no** son los dos
 * o tres que ya existían cuando se publicó. Sembrando al final, cualquier
 * publicación puede recibir reacciones de los dieciséis vecinos y de los otros
 * catorce profesionales, y el reparto se ve como un muro y no como una fila.
 *
 * ## Cómo se reparte
 *
 * - **Comentarios**: dos por publicación, tomados del pool de la especialidad
 *   en el mismo orden en que están escritas las publicaciones, de modo que cada
 *   uno cae bajo el texto al que responde. Los firman vecinos distintos.
 * - **Respuestas**: en una de cada tres publicaciones el autor contesta el
 *   primer comentario. Sin al menos algunos hilos de dos niveles no se puede
 *   ver cómo se dibuja una respuesta anidada.
 * - **Reacciones**: entre `REACCIONES_MINIMAS` y ese número más seis por
 *   publicación, de vecinos y de colegas, con el tipo tomado de una bolsa donde
 *   `LIKE` pesa más — como en cualquier muro real. También se reacciona a los
 *   comentarios, que es lo que hace que el hilo no se vea muerto.
 */
async function sembrarInteraccion(vecinos, medicos) {
  const firmantes = [...vecinos, ...medicos];
  if (firmantes.length === 0) {
    paso('· Sin cuentas para comentar ni reaccionar: se salta la interacción.');
    return;
  }

  let usados = 0;
  /** Cursor del pool general, para que dos publicaciones seguidas no repitan. */
  let generales = 0;
  for (const [n, post] of publicaciones.entries()) {
    // Con especialidad conocida, los comentarios escritos para esa publicación;
    // sin ella —una publicación de una corrida vieja, recuperada del feed—, el
    // pool general, que funciona bajo cualquier texto de divulgación.
    const pool = COMENTARIOS_POR_ESPECIALIDAD[post.codigoEspecialidad] ?? [];
    const comentarios = [];
    const faltan = Math.max(0, COMENTARIOS_POR_POST - (post.comentariosYa ?? 0));

    for (let c = 0; c < faltan; c += 1) {
      // Dos por publicación y en el orden del pool: la publicación `i` de una
      // especialidad se lleva los comentarios `2i` y `2i+1`, que son los que
      // están escritos para ella.
      const texto =
        pool.length > 0
          ? pool[(post.indiceEnLaEspecialidad * COMENTARIOS_POR_POST + c) % pool.length]
          : COMENTARIOS_GENERALES[
              (generales++) % COMENTARIOS_GENERALES.length
            ];
      if (!texto) break;
      // Vecinos y no colegas: quien comenta una publicación de divulgación es
      // el público. Se recorren en orden y con corrimiento para que no siempre
      // comente el mismo primero.
      const firma = vecinos[(usados + c) % Math.max(vecinos.length, 1)] ?? firmantes[0];
      const comentario = await call(
        'comentarios',
        `comentario ${c + 1} de ${firma.nombre} en el post ${n + 1}`,
        'POST',
        '/community/comments',
        {
          token: firma.token,
          body: {
            authorProfileId: firma.profileId,
            commentableType: 'POST',
            commentableRefId: post.id,
            bodyText: texto,
          },
          expect: 201,
        },
      );
      if (comentario.ok) {
        sembrado.comentarios += 1;
        comentarios.push({ id: comentario.body.id, firma });
      }
    }
    usados += COMENTARIOS_POR_POST;

    // La respuesta del autor, en una de cada tres publicaciones.
    if (n % 3 === 0 && comentarios.length > 0 && post.autorToken) {
      const respuesta = await call(
        'comentarios',
        `respuesta de ${post.autor} en el post ${n + 1}`,
        'POST',
        '/community/comments',
        {
          token: post.autorToken,
          body: {
            authorProfileId: post.autorProfileId,
            commentableType: 'POST',
            commentableRefId: post.id,
            parentCommentId: comentarios[0].id,
            bodyText: RESPUESTAS_DEL_AUTOR[n % RESPUESTAS_DEL_AUTOR.length],
          },
          expect: 201,
        },
      );
      if (respuesta.ok) sembrado.respuestas += 1;
    }

    // Las reacciones a la publicación. Nadie reacciona a lo suyo.
    //
    // El corrimiento va con un multiplicador **coprimo con 7** (5, no 7): con
    // `(n * 7) % 7` el resto era siempre cero y todas las publicaciones salían
    // con exactamente el mínimo, que es justo el reparto plano que este seeder
    // existe para no producir.
    const cuantas = REACCIONES_MINIMAS + ((n * 5) % 7);
    for (let r = 0; r < cuantas; r += 1) {
      const firma = firmantes[(n * 5 + r * 3) % firmantes.length];
      if (firma.profileId === post.autorProfileId) continue;
      const reaccion = await call(
        'reacciones',
        `reacción de ${firma.nombre} en el post ${n + 1}`,
        'PUT',
        '/community/reactions',
        {
          token: firma.token,
          body: {
            actorProfileId: firma.profileId,
            reactableType: 'POST',
            reactableRefId: post.id,
            reactionType: REACCIONES[(n + r) % REACCIONES.length],
          },
          expect: 200,
        },
      );
      if (reaccion.ok && reaccion.body?.created) sembrado.reacciones += 1;
    }

    // Y a los comentarios: un hilo donde nadie reacciona se ve muerto.
    for (const [c, comentario] of comentarios.entries()) {
      const firma = firmantes[(n * 3 + c * 11 + 1) % firmantes.length];
      if (firma.profileId === comentario.firma.profileId) continue;
      const reaccion = await call(
        'reacciones',
        `reacción al comentario ${c + 1} del post ${n + 1}`,
        'PUT',
        '/community/reactions',
        {
          token: firma.token,
          body: {
            actorProfileId: firma.profileId,
            reactableType: 'COMMENT',
            reactableRefId: comentario.id,
            reactionType: REACCIONES[(n + c) % REACCIONES.length],
          },
          expect: 200,
        },
      );
      if (reaccion.ok && reaccion.body?.created) sembrado.reacciones += 1;
    }
  }
}

async function sembrarOrganizacion(org, indice, adminUserId) {
  const codigo = `${slugificar(org.nombre).toUpperCase().replace(/-/g, '_')}_${TANDA}${indice}`;
  const alta = await call('organizaciones', `alta de ${org.nombre}`, 'POST', '/admin/tenants', {
    body: {
      code: codigo,
      legalName: org.nombre,
      tradeName: org.nombre,
      ownerUserId: adminUserId,
      tenantType: org.tipo,
      ...BOLIVIA,
    },
    expect: [200, 201],
  });
  if (!alta.ok) return;

  const tenantId = alta.body?.id;
  if (!tenantId) return;

  // La vitrina pública de una organización NO se crea a mano: la proyecta la
  // verificación. Sembrar sin verificar deja la organización invisible.
  const verificada = await call('organizaciones', `verificación de ${org.nombre}`, 'POST', `/admin/tenants/${tenantId}/verification`, {
    body: BOLIVIA,
    expect: [200, 201],
  });

  // La dirección con coordenadas: sin esto la ficha pública tiene «dónde
  // atiende» en texto pero el mapa no tiene qué dibujar. `ownerType: TENANT`
  // porque el punto que lee la ficha pública es el de la organización, no el
  // de una sede suya en particular (`directory.branches` es otro dato, con
  // otro dueño, que la ficha pública todavía no lee).
  const punto = dispersar(org.ciudad, indice);
  await call('organizaciones', `dirección de ${org.nombre}`, 'POST', '/common/addresses', {
    body: {
      ownerType: 'TENANT',
      ownerId: tenantId,
      lines: [org.calle],
      city: org.ciudad,
      latitude: punto.lat,
      longitude: punto.lng,
    },
    expect: 201,
  });

  sembrado.organizaciones.push({
    nombre: org.nombre,
    tipo: org.tipo,
    ciudad: org.ciudad,
    tenantId,
    verificada: verificada.ok,
  });
}

/**
 * Los conceptos de especialidad del catálogo, por su código corto.
 *
 * Se leen de **`VS_MEDICAL_SPECIALTY`**, que es el conjunto que gobierna
 * `practitioner_specialties.specialty_concept_id`. Antes se leían de
 * `clinical-forms:specialty:*` —los de las fichas clínicas— y el alta los
 * rechazaba con `422 La especialidad no pertenece al catálogo`: son dos
 * catálogos distintos con los mismos nombres, y `MedicalSpecialtyCatalogService`
 * exige el del modelo. Se veía como «0 con especialidad» en el resumen de la
 * corrida, con quince médicos sin nada bajo su nombre en la guía.
 *
 * Los códigos coinciden entre los dos (`CARDIOLOGIA`, `MEDICINA_INTERNA`), así
 * que la normalización de abajo no cambia; lo único que cambia es de dónde se
 * leen.
 *
 * No se inventa ningún concepto acá: si el conjunto no está sembrado, la
 * especialidad no se asigna y queda anotado en el resumen.
 */
async function especialidadesDelCatalogo() {
  // Dos pasos, como hace el front: el conjunto se nombra por su código estable
  // (`VS_MEDICAL_SPECIALTY`) y se expande por su uuid, que es derivado y cambia
  // si el paquete de seeds se regenera.
  const conjuntos = await call(
    'especialidades-conjunto',
    'El conjunto de especialidades médicas',
    'GET',
    '/terminology/value-sets?code=VS_MEDICAL_SPECIALTY&limit=5',
  );
  const conjunto = (conjuntos.body?.items ?? []).find(
    (c) => c.internalCode === 'VS_MEDICAL_SPECIALTY',
  );
  if (!conjunto) return new Map();

  // El `$` va literal: Express enruta sobre el path sin decodificar, así que
  // `%24expand` no casa con la ruta y vuelve 404.
  const pagina = await call(
    'especialidades',
    'Conceptos de especialidad del catálogo',
    'GET',
    `/terminology/value-sets/${conjunto.id}/$expand?limit=100`,
  );
  const mapa = new Map();
  for (const item of pagina.body?.items ?? []) {
    // El código real es `CARDIOLOGIA`, `MEDICINA_INTERNA` — mayúsculas y
    // guión bajo. `codigoEspecialidad` en `MEDICOS` está en minúsculas y con
    // guión medio (calcado del nombre de carpeta en
    // `src/common/seed/data/clinical-forms/`), así que se normalizan los dos
    // al mismo formato en vez de tener que escribirlo dos veces distinto.
    const sufijo = String(item.code ?? '')
      .split(':')
      .pop()
      .toLowerCase()
      .replace(/_/g, '-');
    if (sufijo && sufijo !== 'transversal') mapa.set(sufijo, item);
  }
  return mapa;
}

/**
 * Recupera las publicaciones ya sembradas, para `--solo-interaccion`.
 *
 * Existe porque volver a sembrar sesenta publicaciones sólo para poder
 * comentarlas sería una hora perdida y el doble de datos. Con esta pasada, una
 * corrida anterior que quedó sin interacción se completa sin duplicar nada.
 */
async function publicacionesYaSembradas() {
  // **Paginando**, no con un `limit` grande: el feed público recorta el tope
  // pedido (`clampLimit`) a cincuenta, así que `?limit=200` devuelve cincuenta
  // y calla. Una corrida anterior dejó justamente eso: las cincuenta
  // publicaciones más nuevas con reacciones y las diez más viejas sin ninguna,
  // que es el reparto que más se parece a un error de datos.
  let cursor = null;
  for (let vuelta = 0; vuelta < 40; vuelta += 1) {
    const pagina = await call(
      'publicaciones',
      `publicaciones existentes (página ${vuelta + 1})`,
      'GET',
      `/public/posts?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    );
    const items = pagina.body?.items ?? [];
    for (const item of items) {
      publicaciones.push({
        id: item.id,
        autor: item.authorDisplayName ?? 'desconocido',
        autorToken: null,
        autorProfileId: null,
        codigoEspecialidad: null,
        indiceEnLaEspecialidad: 0,
        // Lo que ya tiene: la pasada de saneamiento **completa** hasta el
        // objetivo en vez de sumar dos más a cada publicación cada vez que se
        // corre. Sin esto, repetir la pasada dejaría publicaciones con ocho
        // comentarios y ninguna forma de volver atrás.
        comentariosYa: item.commentCount ?? 0,
      });
    }
    cursor = pagina.body?.nextCursor ?? null;
    if (!cursor || items.length === 0) break;
  }
}

async function main() {
  paso(`\nSembrando la vitrina pública contra ${BASE}\n`);
  const { tenantId, userId: adminUserId } = await entrarComoAdmin();
  const soloInteraccion = flag('solo-interaccion');

  const medicos = [];
  if (!soloInteraccion) {
    const especialidades = await especialidadesDelCatalogo();
    if (especialidades.size === 0) {
      paso(
        '· El catálogo no tiene especialidades todavía (¿corriste `yarn seed:dev` primero?); ' +
          'los médicos quedan sin especialidad asignada.',
      );
    }

    const cuantos = Math.min(DOCTORES, MEDICOS.length);
    paso(
      `· Sembrando ${cuantos} profesionales con vitrina, trayectoria completa y ` +
        `${POSTS_POR_DOCTOR} publicaciones cada uno…`,
    );
    for (let i = 0; i < cuantos; i += 1) {
      const ficha = await sembrarMedico(MEDICOS[i], i, tenantId, especialidades);
      if (ficha) medicos.push(ficha);
      paso(
        `    ${i + 1}/${cuantos}  ${MEDICOS[i].nombre} ${MEDICOS[i].apellido} — ` +
          `${ficha ? `${ficha.trayectoria.puestas}/${ficha.trayectoria.pedidas} etapas de trayectoria` : 'no se pudo sembrar'}`,
      );
    }
  } else {
    paso('· `--solo-interaccion`: no se crea nada nuevo, se toma lo ya publicado.');
    await publicacionesYaSembradas();
  }

  const vecinos = [];
  const cuantosVecinos = Math.min(CIUDADANOS_PEDIDOS, CIUDADANOS.length);
  paso(`· Sembrando ${cuantosVecinos} cuentas de vecino que van a comentar y reaccionar…`);
  for (let i = 0; i < cuantosVecinos; i += 1) {
    const ficha = await sembrarCiudadano(CIUDADANOS[i], i, tenantId);
    if (ficha) vecinos.push(ficha);
  }

  paso(
    `· Sembrando la interacción sobre ${publicaciones.length} publicaciones ` +
      `(${COMENTARIOS_POR_POST} comentarios y ${REACCIONES_MINIMAS}+ reacciones cada una)…`,
  );
  await sembrarInteraccion(vecinos, medicos);

  if (!soloInteraccion && adminUserId) {
    paso(`· Sembrando ${ORGANIZACIONES.length} organizaciones (clínicas, laboratorios y farmacias)…`);
    for (let i = 0; i < ORGANIZACIONES.length; i += 1) {
      await sembrarOrganizacion(ORGANIZACIONES[i], i, adminUserId);
    }
  }

  const fallos = log.filter((l) => !l.ok);
  writeFileSync(
    OUT,
    JSON.stringify({ base: BASE, tanda: TANDA, sembrado, llamadas: log }, null, 2),
  );

  if (sembrado.medicos.length > 0) {
    paso('\n─── Cuentas de profesional (entran con el correo) ───');
    for (const m of sembrado.medicos) {
      paso(`  ${m.email}   ${m.especialidad} · ${m.ciudad}   ficha: ${m.fichaPublica}`);
    }
  }
  if (sembrado.ciudadanos.length > 0) {
    paso('\n─── Cuentas de vecino (entran con el documento) ───');
    for (const c of sembrado.ciudadanos) {
      paso(`  CI ${c.ci}   ${c.nombre} · ${c.ciudad}   (${c.email})`);
    }
  }
  paso(`\n  Contraseña de todas: ${CLAVE}`);

  const etapas = sembrado.medicos.reduce((n, m) => n + m.trayectoria.puestas, 0);
  paso(
    `\n  ${sembrado.medicos.length} profesionales ` +
      `(${sembrado.medicos.filter((m) => m.especialidadAsignada).length} con especialidad, ` +
      `${sembrado.medicos.filter((m) => m.avatarPuesto).length} con foto, ` +
      `${sembrado.medicos.filter((m) => m.portadaPuesta).length} con portada, ` +
      `${etapas} etapas de trayectoria en total)\n` +
      `  ${sembrado.publicaciones} publicaciones ` +
      `(${sembrado.medicos.reduce((n, m) => n + (m.publicacionesConImagen ?? 0), 0)} con imagen) · ` +
      `${sembrado.comentarios} comentarios + ${sembrado.respuestas} respuestas del autor · ` +
      `${sembrado.reacciones} reacciones\n` +
      `  ${sembrado.ciudadanos.length} vecinos con cuenta propia · ` +
      `${sembrado.organizaciones.filter((o) => o.verificada).length}/${sembrado.organizaciones.length} organizaciones verificadas y ubicadas en el mapa`,
  );
  paso(`  Detalle de la corrida: ${OUT}`);

  if (fallos.length > 0) {
    paso(`\n  ⚠ ${fallos.length} llamada(s) no salieron como se esperaba:`);
    for (const f of fallos.slice(0, 8)) {
      paso(`    ${f.method} ${f.path} → ${f.status} (esperado ${f.expected ?? '2xx'}) ${f.detail ?? ''}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exitCode = 1;
});
