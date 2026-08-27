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
 * 7. **Trayectoria profesional, para todos.** Dos etapas por médico —una
 *    cerrada y una en curso— por `POST /profiles/practitioners/me/affiliations`.
 *    Antes de esto, de los ~78 médicos que dejaban los tres seeders **uno solo**
 *    tenía historial: ese endpoint es self-service puro, sin atajo de
 *    plataforma, y ningún seeder con sesión propia lo llamaba. La pestaña
 *    «Trayectoria» del perfil sólo se podía ver vacía.
 * 8. **Teléfono, y la matrícula completa.** El teléfono viaja en el alta y se
 *    escribe en `common.contact_points` junto al correo: es lo primero que un
 *    médico busca en su propio perfil y ningún seeder lo sembraba. La matrícula
 *    va con autoridad emisora y fecha, que sin ellas era un número pelado.
 *
 * **Lo que sigue faltando, y por qué esta corrida no lo resuelve:** los
 * médicos no tienen consultorio propio en `common.addresses` — el tipo de
 * dueño (`OwnerType`) sólo contempla `USER`, `PATIENT` y `TENANT`, no un
 * perfil de profesional, así que hoy no hay ningún `ownerId` correcto para
 * escribir esa fila. Es un hueco del contrato, no del seeder: agregarlo a mano
 * con el `ownerId` equivocado dejaría datos que no se pueden leer de vuelta.
 *
 * Y tampoco hay **formación académica** (universidad, carrera, año de egreso):
 * el modelo no la tiene. Lo más parecido es `professional_credentials`, que es
 * un documento con número —no una formación—, y el auto-registro no acepta ni
 * la institución ni la fecha del título; sólo el alta administrativa lo hace.
 * Un profesional ya dado de alta **no puede agregar un título**: no existe el
 * endpoint. Sembrarlo pediría modelo nuevo, no un seeder más largo.
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

/* ── Las imágenes ──────────────────────────────────────────────────────────
 *
 * Un perfil sin foto se lee como una cuenta a medio hacer, y una sección de
 * publicaciones sin una sola imagen no deja juzgar cómo se ve la tarjeta cuando
 * la lleva. Las fotos salen de bancos de imágenes libres —retratos de
 * `pravatar.cc`, fotos temáticas de `loremflickr.com`—, se bajan una vez y se
 * suben a `common.files` con `POST /common/files/upload`. Son marcadores
 * visuales, no personas reales: `--sin-imagenes` las apaga si no hay red.        */

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

/** El retrato del médico, de `pravatar.cc`. Determinístico por índice. */
async function retrato(bearer, indice, nombre) {
  if (SIN_IMAGENES) return null;
  const url = `https://i.pravatar.cc/512?img=${(indice % 70) + 1}`;
  return subirImagen(bearer, await bajarImagen(url), nombre);
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
/**
 * Lo que publica un médico: un repositorio de divulgación, no un muro de frases
 * sueltas. Cada entrada tiene un cuerpo largo —de varios párrafos, como un
 * artículo corto—, sus etiquetas, y una pista de qué foto la acompaña. La
 * sección «Publicaciones» sólo se puede juzgar —tipografía, ancho de lectura,
 * recorte de la tarjeta, imagen a lo ancho— cuando el contenido tiene el peso
 * que va a tener en producción.
 *
 * `imagen` es una consulta para un banco de fotos libres (`loremflickr`): el
 * seeder la baja, la sube a `common.files` y la adjunta al post. `null` deja el
 * post sólo de texto, que también hay que poder ver.
 */
const GENERALES = [
  {
    texto:
      'Traer los estudios previos a la consulta cambia el resultado.\n\nNo es burocracia. Sin el laboratorio anterior no se puede saber si un valor subió, bajó o siempre fue así, y esa diferencia decide si hoy pedimos algo nuevo o esperamos. Un mismo colesterol de 210 es una buena noticia en quien venía de 260 y una señal de alarma en quien venía de 170.\n\nSi los tenés en papel, una foto legible alcanza. Si están en otra institución, casi siempre te los dan pidiéndolos en admisión con tu documento.',
    hashtags: ['prevención', 'consultaMédica', 'saludBolivia'],
    imagen: 'medical,records,paperwork',
  },
  {
    texto:
      'El control anual no es un trámite.\n\nLa mitad de lo que encontramos a tiempo no daba ningún síntoma cuando lo encontramos: presión alta, azúcar en el límite, una tiroides que empieza a fallar. Ninguna de esas cosas duele hasta que ya hizo daño.\n\nUn control razonable para un adulto sano es una consulta clínica al año, con presión, peso, y análisis de sangre y orina. Si hay antecedentes en la familia, el médico ajusta desde ahí.',
    hashtags: ['chequeoAnual', 'prevención', 'medicinaPreventiva'],
    imagen: 'doctor,checkup,stethoscope',
  },
  {
    texto:
      'Si te indicaron un antibiótico, terminá el esquema completo.\n\nAunque te sientas bien al segundo día. Cortarlo antes deja vivas a las bacterias más resistentes justamente las que costó más matar y esas son las que vuelven, ahora sin miedo a ese antibiótico.\n\nY al revés: el antibiótico no sirve para la gripe, ni para la mayoría de los dolores de garganta, ni para el resfrío. Tomarlo «por las dudas» no acorta nada y sí gasta una herramienta que es de todos.',
    hashtags: ['usoResponsableDeAntibióticos', 'resistenciaAntimicrobiana'],
    imagen: 'pills,medicine,pharmacy',
  },
  {
    texto:
      'Cómo saber si una fiebre es de las que pueden esperar al día siguiente.\n\nEn un adulto, una fiebre sola, que baja con paracetamol y deja hacer vida más o menos normal, casi siempre puede verse en un turno normal. Lo que cambia el plan es la compañía: falta de aire, dolor de pecho, confusión, una mancha en la piel que no desaparece al apretarla, o fiebre que ya lleva más de tres días sin ceder.\n\nEn bebés menores de tres meses, cualquier fiebre es consulta el mismo día. Ahí no se espera.',
    hashtags: ['fiebre', 'cuándoConsultar', 'urgencias'],
    imagen: 'thermometer,fever,sick',
  },
];

const POR_ESPECIALIDAD = {
  cardiologia: [
    {
      texto:
        'La presión se mide sentado, con la espalda apoyada, los pies en el piso y el brazo a la altura del corazón, después de cinco minutos quieto y sin haber tomado café ni fumado en la media hora previa.\n\nMedida de cualquier otra forma parado, apurado, con la vejiga llena el número sale alto y no sirve para decidir nada. Un tratamiento que se ajusta con mediciones mal tomadas es un tratamiento mal ajustado.\n\nLo mejor para el control es un registro en casa: dos tomas a la mañana y dos a la noche, durante una semana, anotadas. Eso vale más que una sola medición en el consultorio.',
      hashtags: ['hipertensión', 'presiónArterial', 'cardiología'],
      imagen: 'blood,pressure,measurement',
    },
    {
      texto:
        'Tres señales que sí ameritan ir a una emergencia, no esperar un turno:\n\n1. Dolor o presión en el pecho que aparece con el esfuerzo y cede con el reposo.\n2. Falta de aire que aparece al acostarse y obliga a dormir con más almohadas.\n3. Desmayo sin aviso, sobre todo si fue haciendo un esfuerzo.\n\nEl resto de las molestias del pecho pinchazos que duran un segundo, dolor que cambia al respirar o al apretar casi siempre no son del corazón, pero si hay dudas, se consulta.',
      hashtags: ['infarto', 'señalesDeAlarma', 'cardiología'],
      imagen: 'heart,cardiology,ecg',
    },
  ],
  pediatria: [
    {
      texto:
        'La libreta de vacunas es el documento de salud más importante que tiene tu hijo. Traela a cada consulta, aunque la visita sea por otra cosa.\n\nEn cada control revisamos qué toca y qué quedó pendiente. Una vacuna atrasada no se pierde: se retoma desde donde quedó, no se empieza de cero. Lo que no se recupera es el tiempo en que el chico estuvo sin protección.\n\nSi la perdiste, en el centro de salud donde lo vacunaron tienen el registro y te la reconstruyen.',
      hashtags: ['vacunas', 'pediatría', 'controlDelNiñoSano'],
      imagen: 'child,vaccination,pediatric',
    },
    {
      texto:
        'Bronquiolitis: qué es y cuándo preocuparse.\n\nEs una infección viral de las vías respiratorias chicas, común en menores de dos años, sobre todo en invierno. Empieza como un resfrío y al segundo o tercer día aparece la tos y la respiración silbante.\n\nLo que se vigila en casa: que respire rápido o con el pecho hundido, que le cueste comer o dormir por la falta de aire, que se ponga pálido o azulado alrededor de la boca. Cualquiera de esas cosas es consulta inmediata. El resto se maneja con paciencia, líquidos y lavados nasales.',
      hashtags: ['bronquiolitis', 'pediatría', 'saludRespiratoria'],
      imagen: 'baby,nebulizer,respiratory',
    },
  ],
  'medicina-interna': [
    {
      texto:
        'Tener varias enfermedades crónicas a la vez diabetes, presión, tiroides, colesterol no es tener varios problemas separados. Es un solo sistema que hay que mantener en equilibrio.\n\nEl error frecuente es que cada especialista ajusta lo suyo sin mirar el resto, y el paciente termina con doce pastillas que compiten entre sí. La medicina interna existe para ordenar eso: una sola mirada, una lista de medicación revisada entera, y controles que se agrupan en vez de multiplicarse.\n\nSi tomás más de cinco medicamentos, pedí una revisión completa de la lista al menos una vez al año.',
      hashtags: ['enfermedadesCrónicas', 'polifarmacia', 'medicinaInterna'],
      imagen: 'medication,organizer,pills',
    },
  ],
  'medicina-general': [
    {
      texto:
        'Qué esperar de una consulta con el médico general.\n\nNo soy el final del camino: muchas veces soy la primera puerta. Escucho el motivo entero, examino, y pido lo que hace falta para entender qué está pasando. Si el problema se resuelve ahí, lo resolvemos. Si necesitás un especialista, te lo digo el mismo día y con una indicación clara de a quién y por qué, en vez de mandarte a dar vueltas.\n\nUna buena derivación ahorra meses. Una consulta general bien hecha evita la mitad de las derivaciones.',
      hashtags: ['atenciónPrimaria', 'medicinaGeneral', 'saludBolivia'],
      imagen: 'general,practitioner,clinic',
    },
  ],
  'ginecologia-obstetricia': [
    {
      texto:
        'El Papanicolaou detecta cambios en el cuello del útero años antes de que se conviertan en un problema serio. Ese margen de años es lo que lo hace tan efectivo: da tiempo de sobra para actuar.\n\nLa recomendación general es empezar a los 25 y repetir cada tres años si los resultados son normales, o según lo que indique tu ginecóloga si hubo algún hallazgo. Sumado a la vacuna contra el VPH, es la prevención de cáncer más eficaz que tenemos hoy.\n\nNo duele, dura dos minutos, y no necesitás derivación para pedirlo.',
      hashtags: ['papanicolaou', 'prevención', 'saludDeLaMujer', 'VPH'],
      imagen: 'gynecology,women,health',
    },
  ],
  traumatologia: [
    {
      texto:
        'Torcedura de tobillo: los primeros dos días deciden cómo sigue.\n\nLo básico sigue siendo lo de siempre: frío 20 minutos cada 2 o 3 horas, el pie en alto por encima del corazón, y una venda elástica que comprima sin cortar la circulación.\n\nCuándo hace falta radiografía: si no podés apoyar el pie ni dar cuatro pasos, si el dolor está justo sobre el hueso y no sobre el ligamento, o si a las 48 horas la hinchazón no bajó nada. Si podés caminar aunque duela, casi siempre es ligamento y se maneja sin placa.',
      hashtags: ['esguince', 'traumatología', 'lesionesDeportivas', 'RICE'],
      imagen: 'ankle,injury,bandage',
    },
  ],
  dermatologia: [
    {
      texto:
        'La regla del ABCDE para mirar un lunar:\n\nA de Asimetría una mitad distinta de la otra.\nB de Bordes irregulares o mal definidos.\nC de Color más de un tono, o muy oscuro.\nD de Diámetro mayor a 6 milímetros.\nE de Evolución cualquier cambio de tamaño, forma, color o síntomas en los últimos meses.\n\nLa E es la más importante. Un lunar que cambia se revisa, tenga el aspecto que tenga. Una vez al año, alguien que te mire la piel entera con dermatoscopio: es rápido y cambia pronósticos.',
      hashtags: ['lunares', 'cáncerDePiel', 'dermatología', 'ABCDE'],
      imagen: 'skin,dermatology,examination',
    },
  ],
  psiquiatria: [
    {
      texto:
        'Sobre empezar una medicación para la ansiedad o la depresión.\n\nLo que suele no contarse bien: los antidepresivos no hacen efecto el primer día. Tardan entre dos y cuatro semanas en mostrar el beneficio real, y las primeras dos semanas pueden traer molestias que después se van. Saber eso de entrada evita abandonarlos justo antes de que empiecen a funcionar.\n\nNo generan dependencia como se cree, pero no se cortan de golpe: se bajan de a poco y con acompañamiento. Y no reemplazan a la psicoterapia trabajan mejor juntas.',
      hashtags: ['saludMental', 'depresión', 'ansiedad', 'psiquiatría'],
      imagen: 'mental,health,therapy',
    },
  ],
  endocrinologia: [
    {
      texto:
        'La hemoglobina glicosilada (HbA1c) es un promedio de tu azúcar en sangre de los últimos tres meses. Por eso vale más que un pinchazo aislado: no la podés «preparar» con dos días de dieta antes del análisis.\n\nEn una persona con diabetes, la meta habitual es mantenerla por debajo de 7%, pero eso se individualiza edad, años de enfermedad, riesgo de hipoglucemia. Bajarla de 9 a 8 ya reduce complicaciones de forma medible. No hace falta llegar a un número perfecto para que el esfuerzo valga la pena.',
      hashtags: ['diabetes', 'HbA1c', 'endocrinología'],
      imagen: 'diabetes,glucose,test',
    },
  ],
  oftalmologia: [
    {
      texto:
        'Si tenés diabetes, necesitás un control de fondo de ojo una vez al año aunque veas perfecto.\n\nLa retinopatía diabética el daño que el azúcar alto le hace a los vasos de la retina no da ningún síntoma en sus etapas tempranas, que son justo las que se pueden tratar. Cuando aparece la visión borrosa o las manchas, el daño ya avanzó.\n\nEl estudio es simple: unas gotas para dilatar la pupila y una foto de la retina. Media hora, una vez al año, y se detecta a tiempo lo que de otro modo se ve cuando ya es tarde.',
      hashtags: ['retinopatíaDiabética', 'diabetes', 'oftalmología', 'fondoDeOjo'],
      imagen: 'eye,exam,ophthalmology',
    },
  ],
};

/**
 * La cola de publicaciones de un médico: primero lo específico de su
 * especialidad, después lo general, sin repetir hasta agotar. Así un
 * cardiólogo abre con algo de cardiología y no con un consejo genérico.
 */
function publicacionesPara(codigoEspecialidad) {
  const propias = POR_ESPECIALIDAD[codigoEspecialidad] ?? [];
  return [...propias, ...GENERALES];
}

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

/**
 * La trayectoria de cada médico, por ciudad.
 *
 * ## Por qué hacía falta
 *
 * Sin esto la pestaña «Trayectoria» del perfil decía «No hay actividad actual
 * registrada» y «No hay experiencia histórica registrada» para **todos** los
 * médicos sembrados: de los ~78 que dejaban los tres seeders, uno solo tenía
 * afiliaciones. Una pantalla que sólo se puede ver vacía no se puede juzgar —
 * ni el orden de la línea de tiempo, ni cómo se lee un cargo largo, ni qué
 * pasa cuando hay tres etapas encimadas.
 *
 * Son dos etapas por médico: una **en curso** (sin `hasta`, que es lo que la
 * pantalla marca como actividad actual) y una **cerrada** (la residencia o el
 * puesto anterior). Los hospitales son reales de cada ciudad, porque un
 * seeder con «Hospital 1» y «Hospital 2» tampoco deja juzgar el recorte.
 */
const TRAYECTORIA_POR_CIUDAD = {
  'La Paz': [
    { organizacion: 'Hospital Obrero N.º 1', cargo: 'Médico residente' },
    { organizacion: 'Clínica del Sur', cargo: 'Médico de planta' },
  ],
  'El Alto': [
    { organizacion: 'Hospital Municipal Boliviano Holandés', cargo: 'Médico residente' },
    { organizacion: 'Centro de Salud Villa Adela', cargo: 'Médico de planta' },
  ],
  Cochabamba: [
    { organizacion: 'Hospital Viedma', cargo: 'Médico residente' },
    { organizacion: 'Clínica Los Olivos', cargo: 'Jefe de servicio' },
  ],
  'Santa Cruz de la Sierra': [
    { organizacion: 'Hospital San Juan de Dios', cargo: 'Médico residente' },
    { organizacion: 'Clínica Foianini', cargo: 'Médico de planta' },
  ],
  Sucre: [
    { organizacion: 'Hospital Santa Bárbara', cargo: 'Médico residente' },
    { organizacion: 'Clínica Cristo de las Américas', cargo: 'Médico de planta' },
  ],
  Tarija: [
    { organizacion: 'Hospital San Juan de Dios de Tarija', cargo: 'Médico residente' },
    { organizacion: 'Clínica Los Chacos', cargo: 'Médico de planta' },
  ],
};

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
      // El teléfono: se escribe en `common.contact_points` junto al correo, y
      // es lo primero que un médico busca en su propio perfil. Ningún seeder
      // lo sembraba, así que el bloque de contacto se veía siempre vacío.
      // Determinístico a partir del índice para que la corrida sea repetible.
      phone: `+591 7${String(10_000_000 + indice * 137).slice(0, 7)}`,
      // La matrícula, completa: sin autoridad ni fecha, la pestaña de
      // credenciales mostraba un número pelado que no dice quién lo emitió.
      regulatoryAuthority: 'Colegio Médico de Bolivia',
      licenseIssueDate: `${2006 + (indice % 12)}-03-15`,
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
    const conFotos = await call('medicos', `fotos de ${medico.nombre}`, 'PUT', '/community/profiles/me', {
      token: suToken,
      body: {
        tenantId,
        slug,
        displayName: `${medico.nombre} ${medico.apellido}`,
        headline: `${medico.titulo} · ${medico.especialidad}`,
        biography: medico.bio,
        visibility: 'PUBLIC',
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

  // La trayectoria: dos etapas, una cerrada y una en curso. Va con el token
  // del propio médico porque `me/affiliations` es self-service puro — no hay
  // atajo de plataforma, y es la razón por la que hasta ahora sólo un médico
  // de todos los sembrados tenía historial.
  const etapas = TRAYECTORIA_POR_CIUDAD[medico.ciudad] ?? TRAYECTORIA_POR_CIUDAD['La Paz'];
  const egreso = 2006 + (indice % 12);
  let trayectoriaSembrada = 0;
  const afiliaciones = [
    {
      organizationName: etapas[0].organizacion,
      roleTitle: etapas[0].cargo,
      departmentText: medico.especialidad,
      startDate: `${egreso}-06-01`,
      endDate: `${egreso + 4}-05-31`,
    },
    {
      organizationName: etapas[1].organizacion,
      roleTitle: etapas[1].cargo,
      departmentText: medico.especialidad,
      // Sin `endDate`: es lo que la pantalla lee como «actividad actual».
      startDate: `${egreso + 4}-07-01`,
    },
  ];
  for (const afiliacion of afiliaciones) {
    const puesta = await call(
      'trayectoria',
      `${afiliacion.organizationName} de ${medico.nombre}`,
      'POST',
      '/profiles/practitioners/me/affiliations',
      { token: suToken, body: afiliacion, expect: 201 },
    );
    if (puesta.ok) trayectoriaSembrada += 1;
  }

  // Publicaciones: es lo que convierte una ficha en un perfil vivo. Cada médico
  // abre con lo específico de su especialidad y sigue con lo general. La mayoría
  // lleva una imagen; una de cada tres lleva **varias**, para poder ver el
  // carrusel deslizable de la tarjeta; alguna va sólo de texto.
  const cola = publicacionesPara(medico.codigoEspecialidad);
  let publicacionesConImagen = 0;
  for (let i = 0; i < POSTS_POR_DOCTOR; i += 1) {
    const entrada = cola[i % cola.length];
    const cuantasImagenes = i % 3 === 2 ? 3 : 1;
    const media = [];
    for (let n = 0; n < cuantasImagenes; n += 1) {
      const fileId = await imagenTematica(
        suToken,
        `${entrada.imagen}-${i}-${n}`,
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
    const post = await call('publicaciones', `post ${i + 1} de ${medico.nombre}`, 'POST', `/community/profiles/${profileId}/posts`, {
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
    }
  }

  sembrado.medicos.push({
    nombre: `${medico.nombre} ${medico.apellido}`,
    especialidad: medico.especialidad,
    especialidadAsignada,
    avatarPuesto,
    portadaPuesta,
    trayectoriaSembrada,
    publicacionesConImagen,
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
      `(${sembrado.medicos.filter((m) => m.especialidadAsignada).length} con especialidad, ` +
      `${sembrado.medicos.filter((m) => m.avatarPuesto).length} con foto, ` +
      `${sembrado.medicos.filter((m) => m.portadaPuesta).length} con portada, ` +
      `${sembrado.medicos.filter((m) => m.trayectoriaSembrada === 2).length} con trayectoria completa) · ` +
      `${sembrado.publicaciones} publicaciones (${sembrado.medicos.reduce((n, m) => n + (m.publicacionesConImagen ?? 0), 0)} con imagen) · ` +
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
