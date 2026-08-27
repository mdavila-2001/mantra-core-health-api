#!/usr/bin/env node
/**
 * faker-worker.mjs — genera tráfico de aplicación realista y a escala contra
 * la API REAL (mismos guards y validaciones que producción), con disciplina
 * **cache-first**: antes de escribir nada comprueba si el target ya tiene la
 * tanda pedida y, si la tiene, no vuelve a generar.
 *
 * Por qué existe, y en qué se diferencia de `seed-dev-data.mjs`
 * ------------------------------------------------------------
 * `seed-dev-data.mjs` es **acumulativo**: cada corrida sirve para ejercitar el
 * dominio (citas dobles, cancelaciones, etc.) y agrega una tanda nueva a
 * propósito. Es la herramienta correcta para probar reglas de negocio, pero
 * correrla varias veces para "tener tráfico" infla la base sin que nadie lo
 * pida. Este script resuelve el otro problema: poblar una base — local o
 * remota — con una cantidad de tráfico realista **una vez**, de forma
 * repetible, sin duplicar si ya está.
 *
 * Sólo cubre médicos con vitrina pública y sus publicaciones (lo que hoy deja
 * vacía la sección «Publicaciones» de la ficha pública, que el front ya sabe
 * pintar — ver `public-profile-card.html`) y pacientes con login real. No
 * reemplaza a `seed-dev-data.mjs` para agenda/clínica/facturación.
 *
 * Doctores y pacientes quedan **logeables de verdad**: se registran por
 * `POST /iam/auth/register-practitioner` y `/register-patient` (auto-registro
 * público, sesión inmediata), no por el alta administrativa de
 * `seed-dev-data.mjs` que sólo deja con login al primero de la tanda.
 *
 * Disciplina cache-first
 * -----------------------
 * Antes de generar nada, este script intenta iniciar sesión con el primer
 * médico de la última corrida contra el MISMO target (mismo `FAKER_API_BASE_URL`).
 * Si el login funciona, asume que el resto de la tanda también sigue viva y
 * no genera una fila más — se informa el resumen cacheado y se sale en verde.
 * Sólo si el login falla (`404`, base nueva, o `FAKER_FORCE=1`) genera de
 * cero. La caché vive en `.faker-cache/<hash del target>.json`, fuera del
 * repo (ver `.gitignore`): registra los correos, no las contraseñas.
 *
 * Uso
 * ---
 *   node tools/redesa/faker-worker.mjs
 *   FAKER_SCALE=small node tools/redesa/faker-worker.mjs
 *   FAKER_DOCTORS=5 FAKER_PATIENTS=20 FAKER_POSTS_PER_DOCTOR=2 node tools/redesa/faker-worker.mjs
 *   FAKER_API_BASE_URL=http://localhost:3040 FAKER_FORCE=1 node tools/redesa/faker-worker.mjs
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fakerES_MX as faker } from '@faker-js/faker';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(HERE, '.faker-cache');

const API_BASE_URL =
  process.env.FAKER_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3000';
const FORCE = process.env.FAKER_FORCE === '1';

/**
 * Presets de escala. `large` es el default a propósito: el pedido fue
 * "por defecto ... tráfico de aplicación muy escalada", no una muestra
 * mínima que hay que agrandar a mano cada vez.
 */
const SCALE_PRESETS = {
  small: { doctors: 5, patients: 15, postsPerDoctor: 2 },
  medium: { doctors: 20, patients: 80, postsPerDoctor: 3 },
  large: { doctors: 60, patients: 300, postsPerDoctor: 5 },
};
const preset = SCALE_PRESETS[process.env.FAKER_SCALE ?? 'large'] ?? SCALE_PRESETS.large;
const DOCTORS = numberFromEnv('FAKER_DOCTORS', preset.doctors);
const PATIENTS = numberFromEnv('FAKER_PATIENTS', preset.patients);
const POSTS_PER_DOCTOR = numberFromEnv('FAKER_POSTS_PER_DOCTOR', preset.postsPerDoctor);
const PASSWORD = process.env.FAKER_PASSWORD ?? 'F4ker-Passw0rd!';

function numberFromEnv(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function cacheKeyFor(target) {
  return createHash('sha256').update(target).digest('hex').slice(0, 16);
}

function cachePathFor(target) {
  return resolve(CACHE_DIR, `${cacheKeyFor(target)}.json`);
}

function readCache(target) {
  const path = cachePathFor(target);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(target, data) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePathFor(target), JSON.stringify(data, null, 2));
}

async function http(method, path, { body, token } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text.length > 0 ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: res.status, ok: res.ok, body: json };
}

/** Especialidades frecuentes en el padrón — no exhaustivo, sólo variado. */
const ESPECIALIDADES = [
  'Medicina General',
  'Pediatría',
  'Ginecología',
  'Traumatología',
  'Dermatología',
  'Cardiología',
  'Endocrinología',
  'Neurología',
  'Psiquiatría',
  'Medicina Interna',
];

/**
 * `faker.lorem` genera pseudo-latín, no español — legible como texto de
 * relleno, no como una biografía real. Plantillas propias en vez de eso.
 */
function biografia(especialidad, anios) {
  const plantillas = [
    () =>
      `${anios} años de trayectoria en ${especialidad.toLowerCase()}, con foco en la escucha antes que en la receta.`,
    () =>
      `Especialista en ${especialidad.toLowerCase()}. Creo en explicar cada diagnóstico en palabras claras, no en jerga.`,
    () =>
      `Formación en ${especialidad.toLowerCase()} y ${anios} años de consultorio. Atiendo en español y priorizo la prevención.`,
    () =>
      `Consultorio de ${especialidad.toLowerCase()} orientado a un seguimiento cercano, no a la consulta de una sola vez.`,
  ];
  return faker.helpers.arrayElement(plantillas)();
}

/**
 * Plantillas de publicación al estilo «LinkedIn de salud»: un consejo, un
 * logro profesional, una campaña, una nota educativa — nunca un caso clínico
 * identificable, en línea con el límite de `CreatePostDto.bodyText` ("sin PHI
 * identificable").
 */
function publicacion(especialidad) {
  const plantillas = [
    () =>
      `${faker.number.int({ min: 3, max: 7 })} señales de que conviene una consulta de ${especialidad.toLowerCase()} antes de que se vuelvan urgencia. Si algo de esto te suena, no esperes al próximo control.`,
    () =>
      `Esta semana en el consultorio: recordatorio de que la prevención en ${especialidad.toLowerCase()} empieza por el chequeo anual, no por el síntoma. Reservá tu turno con tiempo.`,
    () =>
      `Feliz de compartir que este mes sumamos ${faker.number.int({ min: 10, max: 80 })} pacientes nuevos al programa de seguimiento. Gracias por la confianza.`,
    () =>
      `Mito vs. realidad en ${especialidad.toLowerCase()}: no, no todo se resuelve con automedicación. Un diagnóstico a tiempo cambia el pronóstico.`,
    () =>
      `Campaña de este mes: consulta de orientación sin costo los primeros ${faker.helpers.arrayElement(['martes', 'jueves', 'sábados'])} del mes. Cupos limitados.`,
    () =>
      `Lo que más me preguntan en ${especialidad.toLowerCase()}: cada cuánto conviene el control. La respuesta corta: depende de tu historia, no de una regla única — por eso existe la consulta.`,
  ];
  return faker.helpers.arrayElement(plantillas)();
}

function step(message) {
  console.log(message);
}

/** Registra un médico self-service, activo de inmediato, y arma su vitrina pública. */
async function crearMedico(index) {
  const nombre = faker.person.firstName();
  const apellido = faker.person.lastName();
  const especialidad = ESPECIALIDADES[index % ESPECIALIDADES.length];
  const email = faker.internet
    .email({ firstName: nombre, lastName: apellido, provider: 'faker.alovida.test' })
    .toLowerCase();

  const alta = await http('POST', '/iam/auth/register-practitioner', {
    body: {
      email,
      password: PASSWORD,
      name: nombre,
      lastName: apellido,
      licenseNumber: `FK-LIC-${index}-${faker.string.alphanumeric(6).toUpperCase()}`,
      credentialNumber: `FK-CRED-${index}-${faker.string.alphanumeric(6).toUpperCase()}`,
      professionalTitle: especialidad,
    },
  });
  if (!alta.ok) {
    step(`  ✘ registro médico ${email}: ${alta.status} ${JSON.stringify(alta.body)}`);
    return null;
  }

  const login = await http('POST', '/iam/auth/login', { body: { email, password: PASSWORD } });
  const token = login.body?.accessToken;
  if (!token) {
    step(`  ✘ login médico ${email} tras alta: ${login.status}`);
    return null;
  }

  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  const tenantId = claims.tenants?.[0];

  const slug = `${faker.helpers.slugify(`${nombre}-${apellido}`).toLowerCase()}-${index}`;
  const vitrina = await http('PUT', '/community/profiles/me', {
    token,
    body: {
      tenantId,
      slug,
      displayName: `${nombre} ${apellido}`,
      headline: `${especialidad} · AloVida`,
      biography: biografia(especialidad, faker.number.int({ min: 3, max: 22 })),
      visibility: 'PUBLIC',
    },
  });
  // El id de la vitrina (`community_profiles.id`) NO es `claims.hpid`: ese es
  // el id del perfil profesional clínico, un sujeto distinto. Postear contra
  // `hpid` da 404 — hay que usar el id que este mismo PUT acaba de devolver.
  const profileId = vitrina.body?.id;
  if (!profileId) {
    step(`  ✘ vitrina de ${email}: ${vitrina.status} ${JSON.stringify(vitrina.body)}`);
    return { email, profileId: null, slug, especialidad, posts: 0 };
  }

  const posts = [];
  for (let i = 0; i < POSTS_PER_DOCTOR; i += 1) {
    const post = await http('POST', `/community/profiles/${profileId}/posts`, {
      token,
      body: { bodyText: publicacion(especialidad), postType: 'TEXT', visibility: 'PUBLIC' },
    });
    if (post.ok) posts.push(post.body?.id);
  }

  return { email, profileId, slug, especialidad, posts: posts.length };
}

/** Registra un paciente self-service, logeable de inmediato. */
async function crearPaciente(index) {
  const nombre = faker.person.firstName();
  const apellido = faker.person.lastName();
  const email = faker.internet
    .email({ firstName: nombre, lastName: apellido, provider: 'faker.alovida.test' })
    .toLowerCase();

  const alta = await http('POST', '/iam/auth/register-patient', {
    body: {
      nationalId: `FK${faker.string.numeric(8)}`,
      password: PASSWORD,
      name: nombre,
      lastName: apellido,
      email,
    },
  });
  if (!alta.ok) {
    step(`  ✘ registro paciente ${email}: ${alta.status} ${JSON.stringify(alta.body)}`);
    return null;
  }
  return { email, nationalId: alta.body?.nationalId };
}

/** Cache-first: ¿el primer médico de la última corrida contra este target sigue vivo? */
async function cacheSigueViva(cache) {
  const primero = cache?.doctors?.[0];
  if (!primero) return false;
  const login = await http('POST', '/iam/auth/login', {
    body: { email: primero.email, password: PASSWORD },
  });
  return login.ok;
}

async function main() {
  step(`Sembrando contra ${API_BASE_URL} — ${DOCTORS} médicos, ${PATIENTS} pacientes, ${POSTS_PER_DOCTOR} posts/médico.`);

  const cache = readCache(API_BASE_URL);
  if (!FORCE && cache && cache.doctors?.length === DOCTORS && cache.patients?.length === PATIENTS) {
    step('· Cache-first: hay una tanda de esta misma escala contra este target. Verificando que siga viva…');
    if (await cacheSigueViva(cache)) {
      step(`✔ Cache hit — no se genera nada. Última corrida: ${cache.generatedAt}.`);
      step(`  Médicos: ${cache.doctors.length} (p. ej. ${cache.doctors[0].email} / ${PASSWORD})`);
      step(`  Pacientes: ${cache.patients.length}`);
      return;
    }
    step('· El target no tiene ya la tanda cacheada (¿base nueva?) — genero de cero.');
  } else if (FORCE) {
    step('· FAKER_FORCE=1 — se ignora la caché y se genera de cero.');
  }

  const doctors = [];
  step('· Médicos, vitrina pública y publicaciones…');
  for (let i = 0; i < DOCTORS; i += 1) {
    const doc = await crearMedico(i);
    if (doc) doctors.push(doc);
  }
  step(`  ${doctors.length}/${DOCTORS} médicos con vitrina pública y ${doctors.reduce((a, d) => a + d.posts, 0)} publicaciones.`);

  const patients = [];
  step('· Pacientes…');
  for (let i = 0; i < PATIENTS; i += 1) {
    const pat = await crearPaciente(i);
    if (pat) patients.push(pat);
  }
  step(`  ${patients.length}/${PATIENTS} pacientes.`);

  writeCache(API_BASE_URL, {
    generatedAt: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    scale: { doctors: DOCTORS, patients: PATIENTS, postsPerDoctor: POSTS_PER_DOCTOR },
    doctors: doctors.map(({ email, profileId, slug }) => ({ email, profileId, slug })),
    patients: patients.map(({ email, nationalId }) => ({ email, nationalId })),
  });

  // El directorio público (`/public/search/*`) lee de OpenSearch, no de
  // Postgres directo, y crear una vitrina no lo actualiza sola — la vitrina
  // recién creada es invisible al buscador hasta reindexar. Sin este paso el
  // resultado observable de correr `faker-worker.mjs` es "generé médicos que
  // nadie puede encontrar", que es peor que no generarlos.
  step('· Reindexando el directorio público…');
  const reindex = spawnSync(
    process.execPath,
    [resolve(HERE, '../search/reindex.mjs'), '--no-recreate'],
    { cwd: resolve(HERE, '../..'), env: { ...process.env, API_BASE_URL }, stdio: 'inherit' },
  );
  if (reindex.status !== 0) {
    step('  ✘ el reindexado terminó en rojo — el directorio puede no reflejar la tanda nueva.');
  }

  step('');
  step('── Resumen ──────────────────────────────────────────');
  step(`  Médicos loggeables: ${doctors.length} (contraseña: ${PASSWORD})`);
  if (doctors[0]) step(`  Ejemplo: ${doctors[0].email}`);
  step(`  Pacientes loggeables: ${patients.length}`);
  step(`  Caché: ${cachePathFor(API_BASE_URL)}`);
  step('─────────────────────────────────────────────────────');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
