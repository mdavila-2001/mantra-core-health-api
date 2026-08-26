#!/usr/bin/env node
/**
 * seed-vitrina-publica.mjs — Puebla la **cara pública** de AloVida: médicos con
 * vitrina y publicaciones, clínicas, laboratorios y farmacias verificados.
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
 * 3. **Publicaciones.** Es lo que convierte una ficha en un perfil vivo: sin
 *    posts, la sección «Publicaciones» dice siempre lo mismo y no se puede
 *    juzgar cómo se ve llena.
 * 4. **Clínicas, laboratorios y farmacias.** Se aprovisionan como tenants y se
 *    **verifican**: la vitrina pública de una organización no se crea a mano,
 *    la proyecta `PublicProfileProjectionService` cuando el tenant se verifica.
 *    Sembrar sin verificar deja la organización invisible y sin explicación.
 * 5. **Especialidad real, no sólo en el titular.** Antes esta corrida sólo
 *    escribía la especialidad dentro de `headline` («Cardióloga ·
 *    Cardiología»): la guía de profesionales agrupa y filtra por
 *    `practitioner_specialties`, así que sin este paso los diez médicos caían
 *    todos bajo «Sin especialidad registrada» y el chip de cada especialidad
 *    no tenía a nadie debajo. Ahora se resuelve el concepto real del catálogo
 *    (`clinical-forms:specialty:*`, los mismos que siembra `seed-dev-data.mjs`)
 *    y se asigna con `POST /profiles/practitioners/{id}/specialties`.
 * 6. **Dirección con coordenadas, para cada organización.** La ficha pública
 *    (`/o/`, `/l/`, `/f/`) tiene un mapa aparte de la descripción escrita; sin
 *    una fila en `common.addresses` con `latitude`/`longitude` no hay qué
 *    dibujar ahí. Cada organización cae cerca del centro de su ciudad, con un
 *    corrimiento chico y determinístico (`dispersar()`) para que no queden
 *    todas apiladas en el mismo punto.
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
 *   yarn seed:vitrina --doctors 12 --posts 3
 *   yarn seed:vitrina --base-url http://localhost:3011
 *
 * Requiere una API levantada con el administrador de arranque
 * (`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`).
 *
 * Es **acumulativo**: cada corrida agrega una tanda con sufijo propio, así que
 * repetirlo aumenta el volumen en vez de chocar por unicidad del slug.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const DOCTORES = Number(arg('doctors', 10));
const POSTS_POR_DOCTOR = Number(arg('posts', 2));
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

async function call(section, title, method, path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const bearer = options.token === undefined ? token : options.token;
  if (options.auth !== false && bearer) headers.Authorization = `Bearer ${bearer}`;

  let status = 0;
  let body = null;
  let transportError = null;
  const started = Date.now();
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
  } catch (error) {
    transportError = error instanceof Error ? error.message : String(error);
  }

  const expected =
    options.expect === undefined
      ? null
      : Array.isArray(options.expect)
        ? options.expect
        : [options.expect];
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

/* ── El elenco ──────────────────────────────────────────────────────────── */

/**
 * Diez médicos con especialidad, ciudad y una presentación escrita como la
 * escribiría una persona.
 *
 * Los textos importan más de lo que parece: una ficha con «Lorem ipsum» no
 * permite juzgar si la tipografía, el ancho de lectura o el recorte funcionan,
 * que es para lo que se mira una pantalla sembrada.
 */
const MEDICOS = [
  {
    nombre: 'Marisol',
    apellido: 'Quispe',
    titulo: 'Cardióloga',
    especialidad: 'Cardiología',
    codigoEspecialidad: 'cardiologia',
    ciudad: 'La Paz',
    bio: 'Cardióloga con 14 años de práctica. Atiendo hipertensión, arritmias y control de riesgo cardiovascular. Trabajo con ergometría y Holter propios, y derivo a electrofisiología cuando el caso lo pide.',
  },
  {
    nombre: 'Ramiro',
    apellido: 'Mamani',
    titulo: 'Pediatra',
    especialidad: 'Pediatría',
    codigoEspecialidad: 'pediatria',
    ciudad: 'El Alto',
    bio: 'Pediatra de atención primaria. Control del niño sano, vacunas y las consultas que no pueden esperar: fiebre, bronquiolitis, diarreas. Atiendo con la libreta de vacunas a la vista y explico cada indicación.',
  },
  {
    nombre: 'Lucía',
    apellido: 'Salas',
    titulo: 'Médica internista',
    especialidad: 'Medicina interna',
    codigoEspecialidad: 'medicina-interna',
    ciudad: 'Cochabamba',
    bio: 'Medicina interna: el paciente adulto con varias cosas a la vez. Diabetes, tiroides, hipertensión y el seguimiento que las mantiene ordenadas en vez de tratarlas por separado.',
  },
  {
    nombre: 'Diego',
    apellido: 'Rivas',
    titulo: 'Médico general',
    especialidad: 'Medicina general',
    codigoEspecialidad: 'medicina-general',
    ciudad: 'Santa Cruz de la Sierra',
    bio: 'Consulta general para adultos. Suelo ser la primera puerta: escucho el motivo, pido lo que hace falta y, si corresponde otro especialista, lo digo el mismo día en vez de mandar a dar vueltas.',
  },
  {
    nombre: 'Verónica',
    apellido: 'Aliaga',
    titulo: 'Ginecóloga',
    especialidad: 'Ginecología y obstetricia',
    codigoEspecialidad: 'ginecologia-obstetricia',
    ciudad: 'La Paz',
    bio: 'Control ginecológico, planificación y embarazo de bajo riesgo. Consulta larga a propósito: la mayoría de lo que trae una mujer al consultorio no entra en quince minutos.',
  },
  {
    nombre: 'Jorge',
    apellido: 'Terceros',
    titulo: 'Traumatólogo',
    especialidad: 'Traumatología',
    codigoEspecialidad: 'traumatologia',
    ciudad: 'Santa Cruz de la Sierra',
    bio: 'Lesiones de rodilla y hombro, y la traumatología del que hace deporte sin ser profesional. Opero lo que hay que operar y digo con la misma claridad lo que no.',
  },
  {
    nombre: 'Patricia',
    apellido: 'Vargas',
    titulo: 'Dermatóloga',
    especialidad: 'Dermatología',
    codigoEspecialidad: 'dermatologia',
    ciudad: 'Cochabamba',
    bio: 'Dermatología clínica: acné, dermatitis, caída de cabello y control de lunares con dermatoscopía. Reviso la piel entera aunque la consulta venga por una sola mancha.',
  },
  {
    nombre: 'Andrés',
    apellido: 'Colque',
    titulo: 'Psiquiatra',
    especialidad: 'Psiquiatría',
    codigoEspecialidad: 'psiquiatria',
    ciudad: 'La Paz',
    bio: 'Ansiedad, depresión y trastornos del sueño en adultos. Trabajo con psicoterapia y, cuando hace falta, medicación explicada: qué hace, cuánto tarda y qué esperar los primeros días.',
  },
  {
    nombre: 'Silvia',
    apellido: 'Rojas',
    titulo: 'Endocrinóloga',
    especialidad: 'Endocrinología',
    codigoEspecialidad: 'endocrinologia',
    ciudad: 'Sucre',
    bio: 'Diabetes, tiroides y obesidad con enfoque metabólico. Ajusto tratamiento con los datos del paciente, no con un esquema fijo, y eso pide controles más seguidos al principio.',
  },
  {
    nombre: 'Fernando',
    apellido: 'Peña',
    titulo: 'Oftalmólogo',
    especialidad: 'Oftalmología',
    codigoEspecialidad: 'oftalmologia',
    ciudad: 'Tarija',
    bio: 'Consulta oftalmológica general, control de glaucoma y cirugía de catarata. Reviso fondo de ojo en todo paciente con diabetes, aunque venga sólo por lentes.',
  },
];

/** Lo que publica un médico. Corto, concreto y en su voz. */
const PUBLICACIONES = [
  'Tres señales que sí ameritan consulta el mismo día: dolor de pecho con esfuerzo, falta de aire que aparece acostado, y desmayo sin aviso. El resto casi siempre puede esperar a un turno normal.',
  'La presión se mide sentado, con el brazo apoyado a la altura del corazón y después de cinco minutos quieto. Medida de otra forma, el número no sirve para decidir nada.',
  'Si te indicaron un antibiótico, terminá el esquema aunque te sientas bien al segundo día. Cortarlo antes es lo que fabrica bacterias resistentes.',
  'Traer los estudios previos a la consulta cambia el resultado. No es burocracia: sin el laboratorio anterior no se puede saber si un valor subió, bajó o siempre fue así.',
  'El control anual no es un trámite. La mitad de lo que encontramos temprano no daba ningún síntoma cuando lo encontramos.',
];

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
    calle: 'Av. San Martín 4to Anillo',
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
    calle: 'Av. Cristo Redentor 3er Anillo',
  },
];

/* ── La corrida ─────────────────────────────────────────────────────────── */

const sembrado = { medicos: [], organizaciones: [], publicaciones: 0 };

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

async function sembrarMedico(medico, indice, tenantId, especialidades) {
  const sufijo = `${TANDA}${indice}`;
  const email = `${slugificar(medico.nombre)}.${slugificar(medico.apellido)}.${sufijo}@alovida.test`;

  const alta = await call('medicos', `alta de ${medico.nombre} ${medico.apellido}`, 'POST', '/iam/auth/register-practitioner', {
    auth: false,
    body: {
      email,
      password: CLAVE,
      name: medico.nombre,
      lastName: medico.apellido,
      licenseNumber: `MP-${sufijo}`,
      credentialNumber: `TIT-${sufijo}`,
      professionalTitle: medico.titulo,
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
  const slug = `${slugificar(`${medico.nombre} ${medico.apellido}`)}-${sufijo}`;
  const vitrina = await call('medicos', `vitrina de ${medico.nombre}`, 'PUT', '/community/profiles/me', {
    token: suToken,
    body: {
      tenantId,
      slug,
      // El nombre, y nada más. Un prefijo armado a mano daba «DrPatricia
      // Vargas» —sin espacio y en el género equivocado—, y el tratamiento ya
      // viaja en el `headline` («Dermatóloga · Dermatología»), que es donde
      // corresponde y donde no hay que adivinarle el género a nadie.
      displayName: `${medico.nombre} ${medico.apellido}`,
      headline: `${medico.titulo} · ${medico.especialidad}`,
      biography: medico.bio,
      visibility: 'PUBLIC',
    },
  });
  if (!vitrina.ok) return null;
  const profileId = vitrina.body.id;

  // La especialidad: sin ella el médico cae bajo «Sin especialidad
  // registrada» en la guía, y el chip de su especialidad nunca tiene a nadie
  // debajo. `practitionerProfileId` viene del alta, no de la vitrina —son dos
  // ids distintos (el perfil clínico y el perfil social).
  const concepto = especialidades.get(medico.codigoEspecialidad);
  let especialidadAsignada = false;
  if (concepto) {
    const especialidad = await call(
      'medicos',
      `especialidad de ${medico.nombre}`,
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

  // Publicaciones: es lo que convierte una ficha en un perfil vivo.
  for (let i = 0; i < POSTS_POR_DOCTOR; i += 1) {
    const texto = PUBLICACIONES[(indice + i) % PUBLICACIONES.length];
    const post = await call('publicaciones', `post ${i + 1} de ${medico.nombre}`, 'POST', `/community/profiles/${profileId}/posts`, {
      token: suToken,
      body: { bodyText: texto, postType: 'TEXT', visibility: 'PUBLIC' },
      expect: [200, 201],
    });
    if (post.ok) sembrado.publicaciones += 1;
  }

  sembrado.medicos.push({
    nombre: `${medico.nombre} ${medico.apellido}`,
    especialidad: medico.especialidad,
    especialidadAsignada,
    ciudad: medico.ciudad,
    email,
    clave: CLAVE,
    slug,
    fichaPublica: `/p/${slug}`,
  });
  return profileId;
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
 * Los mismos que siembra `seed-dev-data.mjs`: `clinical-forms:specialty:*`, en
 * castellano. No se inventa ningún concepto acá — si el catálogo no los tiene
 * todavía (una base recién creada, antes de que corra el otro seeder), la
 * especialidad de cada médico simplemente no se asigna y queda anotado en el
 * resumen de la corrida.
 */
async function especialidadesDelCatalogo() {
  const pagina = await call(
    'especialidades',
    'Conceptos de especialidad del catálogo',
    'GET',
    '/terminology/concepts?q=clinical-forms:specialty:&limit=50',
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

async function main() {
  paso(`\nSembrando la vitrina pública contra ${BASE}\n`);
  const { tenantId, userId: adminUserId } = await entrarComoAdmin();
  const especialidades = await especialidadesDelCatalogo();
  if (especialidades.size === 0) {
    paso(
      '· El catálogo no tiene especialidades todavía (¿corriste `yarn seed:dev` primero?); ' +
        'los médicos quedan sin especialidad asignada.',
    );
  }

  paso(`· Sembrando ${Math.min(DOCTORES, MEDICOS.length)} médicos con vitrina y publicaciones…`);
  for (let i = 0; i < Math.min(DOCTORES, MEDICOS.length); i += 1) {
    await sembrarMedico(MEDICOS[i], i, tenantId, especialidades);
  }

  if (adminUserId) {
    paso(`· Sembrando ${ORGANIZACIONES.length} organizaciones (clínicas, laboratorios y farmacias)…`);
    for (let i = 0; i < ORGANIZACIONES.length; i += 1) {
      await sembrarOrganizacion(ORGANIZACIONES[i], i, adminUserId);
    }
  } else {
    paso('· Sin id de usuario del admin: se saltan las organizaciones.');
  }

  const fallos = log.filter((l) => !l.ok);
  writeFileSync(
    OUT,
    JSON.stringify({ base: BASE, tanda: TANDA, sembrado, llamadas: log }, null, 2),
  );

  paso('\n─── Cuentas de médico, todas con la misma clave ───');
  for (const m of sembrado.medicos) {
    paso(`  ${m.email}   ${m.especialidad} · ${m.ciudad}   ficha: ${m.fichaPublica}`);
  }
  paso(`\n  Contraseña de todas: ${CLAVE}`);
  paso(
    `\n  ${sembrado.medicos.length} médicos ` +
      `(${sembrado.medicos.filter((m) => m.especialidadAsignada).length} con especialidad asignada) · ` +
      `${sembrado.publicaciones} publicaciones · ` +
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
