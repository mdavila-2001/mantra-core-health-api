#!/usr/bin/env node
/**
 * seed-dev-data.mjs — Puebla un entorno de desarrollo con datos de demostración
 * y, al hacerlo, ejercita **todas las acciones** que el dominio permite sobre
 * ellos.
 *
 * Existe porque una base recién truncada (la que deja `yarn smoke`) no se puede
 * enseñar ni desarrollar contra ella: sin varios profesionales, agendas
 * publicadas y citas en distintos estados, cualquier pantalla se ve vacía y no
 * se distingue "no hay datos" de "el endpoint no funciona".
 *
 * No es un mock: escribe por la API REAL, con los mismos guards, validaciones y
 * máquinas de estado que producción. Por eso vale a la vez como semilla y como
 * verificación: cada llamada declara el status que espera y, si el contrato
 * cambia, la corrida termina en rojo en vez de dejar datos a medias en silencio.
 *
 * Además de los caminos felices ejercita los **límites**: doble reserva sobre el
 * mismo cupo, cancelar dos veces, reprogramar una cita cancelada, emitir una
 * receta ya emitida, firmar dos veces. Esos casos esperan 4xx; un 2xx ahí sería
 * el fallo.
 *
 * Uso:
 *   node tools/redesa/seed-dev-data.mjs
 *   node tools/redesa/seed-dev-data.mjs --doctors 10 --patients 40 --weeks 4
 *   node tools/redesa/seed-dev-data.mjs --base-url http://localhost:3001
 *
 * Requiere una API levantada con el administrador de arranque
 * (`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`).
 *
 * Es acumulativo, no idempotente: cada corrida añade una tanda nueva con sufijo
 * único, así que repetirlo aumenta el volumen en vez de chocar por unicidad.
 * Para volver a cero, `yarn smoke` trunca la base y vuelve a sembrar el admin.
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');

/** Lee un argumento `--clave valor` de la línea de comandos. */
function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

/** Lee un argumento booleano `--clave`. */
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const BASE = arg(
  'base-url',
  process.env.API_BASE_URL ?? 'http://localhost:3000',
);
const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@redesa.test';
const PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';
const DOCTORS = Number(arg('doctors', 8));
const PATIENTS = Number(arg('patients', 24));
const WEEKS = Number(arg('weeks', 3));
const OUT = resolve(REPO, 'output.seed-dev.json');

// Datos de demostración en una base con datos reales serían contaminación, no
// una semilla. El entorno tiene que declararse de desarrollo explícitamente.
if (process.env.NODE_ENV === 'production' && !flag('force')) {
  console.error(
    'NODE_ENV=production: este script siembra datos ficticios y no debe correr aquí.\n' +
      'Si de verdad es lo que quiere, repítalo con --force.',
  );
  process.exit(1);
}

/** Sufijo único de la corrida; sostiene la unicidad de códigos entre tandas. */
const U = Date.now().toString().slice(-8);

/**
 * Generador pseudoaleatorio con semilla fija.
 *
 * Los datos varían entre elementos (no todos los pacientes iguales) pero la
 * secuencia es la misma en cada corrida: un fallo se reproduce en vez de
 * depender de la suerte del `Math.random` de turno.
 */
let seedState = 20260806;
function rand() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
/** Elige un elemento del arreglo con el generador con semilla. */
function pick(list) {
  return list[Math.floor(rand() * list.length) % list.length];
}

// --- catálogo de datos ficticios --------------------------------------------

const NOMBRES_MEDICOS = [
  ['Camila', 'Rojas Villarroel', 'Medicina General', 'MEDICINA_GENERAL'],
  ['Andrés', 'Quispe Mamani', 'Cardiología', 'CARDIOLOGIA'],
  ['Lucía', 'Fernández Ordóñez', 'Pediatría', 'PEDIATRIA'],
  ['Javier', 'Montaño Salazar', 'Traumatología', 'TRAUMATOLOGIA'],
  ['Valeria', 'Céspedes Aguirre', 'Ginecología', 'GINECOLOGIA'],
  ['Rodrigo', 'Peñaranda Lima', 'Dermatología', 'DERMATOLOGIA'],
  ['Daniela', 'Arce Chumacero', 'Endocrinología', 'ENDOCRINOLOGIA'],
  ['Sebastián', 'Ledezma Ferrufino', 'Neurología', 'NEUROLOGIA'],
  ['Paola', 'Zambrana Ríos', 'Oftalmología', 'OFTALMOLOGIA'],
  ['Marco', 'Alarcón Bejarano', 'Psiquiatría', 'PSIQUIATRIA'],
  ['Ximena', 'Guzmán Terceros', 'Nutrición', 'NUTRICION'],
  ['Fernando', 'Ustárez Camacho', 'Urología', 'UROLOGIA'],
];

const NOMBRES_PACIENTES = [
  ['María', 'Fernández Quiroga'],
  ['José', 'Choque Apaza'],
  ['Ana', 'Vargas Delgado'],
  ['Luis', 'Mendoza Aruquipa'],
  ['Carmen', 'Salinas Ovando'],
  ['Pedro', 'Antezana Rocha'],
  ['Rosa', 'Huanca Copa'],
  ['Miguel', 'Ibáñez Portugal'],
  ['Silvia', 'Cabrera Moscoso'],
  ['Jorge', 'Nogales Escóbar'],
  ['Teresa', 'Padilla Vaca'],
  ['Ramiro', 'Sejas Trigo'],
  ['Elena', 'Barrientos Suárez'],
  ['Óscar', 'Calderón Mejía'],
  ['Patricia', 'Loayza Tapia'],
  ['Wilson', 'Chávez Bustamante'],
  ['Gabriela', 'Encinas Murillo'],
  ['Hugo', 'Ramallo Céspedes'],
  ['Norma', 'Michel Antelo'],
  ['Iván', 'Torrico Balderrama'],
  ['Fabiola', 'Justiniano Roca'],
  ['Alberto', 'Siles Mostajo'],
  ['Verónica', 'Cuéllar Añez'],
  ['Néstor', 'Zeballos Mercado'],
  ['Alejandra', 'Vaca Áñez'],
  ['Raúl', 'Pinto Villca'],
  ['Isabel', 'Crespo Landívar'],
  ['Freddy', 'Coca Mariscal'],
  ['Mónica', 'Revollo Egüez'],
  ['Simón', 'Blanco Tordoya'],
  ['Marcela', 'Ayala Prudencio'],
  ['Diego', 'Ballivián Soruco'],
  ['Rocío', 'Zurita Melgar'],
  ['Ernesto', 'Cadima Vidaurre'],
  ['Julia', 'Sandoval Ergueta'],
  ['Willy', 'Ticona Callisaya'],
  ['Lorena', 'Baldivieso Rojas'],
  ['Álvaro', 'Suárez Landa'],
  ['Sonia', 'Vera Justiniano'],
  ['Grover', 'Mamani Condori'],
];

const MOTIVOS = [
  'Dolor abdominal de tres días',
  'Control de presión arterial',
  'Cefalea persistente',
  'Tos con expectoración',
  'Control prenatal',
  'Dolor lumbar tras esfuerzo',
  'Erupción cutánea pruriginosa',
  'Control de diabetes tipo 2',
  'Mareo al incorporarse',
  'Revisión de resultados de laboratorio',
  'Fiebre de dos días',
  'Dolor de garganta y odinofagia',
];

const CANALES = ['PORTAL', 'DESK', 'PHONE'];

// --- transporte --------------------------------------------------------------

/** Registro de todo lo ejercido, en orden. */
const log = [];
let token = '';
let tenantId = '';

// Los acumuladores se declaran aquí, antes de la primera llamada, porque
// `writeReport()` los lee y `need()` puede invocarlo en cualquier punto: si se
// declararan junto a su fase, un fallo temprano moriría con un
// `ReferenceError` en vez de imprimir el diagnóstico que hace falta.
/** Profesionales sembrados con su agenda publicada. */
const doctors = [];
/** Pacientes sembrados. */
const patients = [];
/** Citas confirmadas, con el estado al que se las llevó. */
const bookings = [];
/** Historias clínicas completas (atención + receta + nota). */
let historias = 0;
/** Episodio abierto por paciente: `profileId → episodeId`. */
const episodios = new Map();

/**
 * Ejecuta una petición contra la API y registra el resultado.
 *
 * @param section - Bloque al que pertenece (agrupa el resumen final).
 * @param title - Qué se está ejerciendo.
 * @param method - Verbo HTTP.
 * @param path - Ruta ya interpolada.
 * @param options - `body`, `auth`, `expect` (status o lista de status aceptados).
 * @returns `{ status, body, ok }` — `ok` es si el status cayó en lo esperado.
 */
async function call(section, title, method, path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.auth !== false && token)
    headers.Authorization = `Bearer ${token}`;

  const started = Date.now();
  let status = 0;
  let body = null;
  let transportError = null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
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
    expected === null
      ? status >= 200 && status < 300
      : expected.includes(status);

  log.push({
    section,
    title,
    method,
    path,
    status,
    expected,
    ok,
    durationMs: Date.now() - started,
    // Sólo se guarda el detalle cuando algo no cuadra: el reporte es para
    // diagnosticar, no un volcado de toda la base.
    detail: ok ? undefined : summarize(transportError ?? body),
  });

  return { status, body, ok };
}

/** Resume el cuerpo de un error sin volcar respuestas enteras. */
function summarize(body) {
  if (body === null || body === undefined) return '';
  if (typeof body !== 'object') return String(body).slice(0, 300);
  const message = body.message;
  const parts = [
    body.code ? `code=${body.code}` : '',
    Array.isArray(message) ? message.map(String).join('; ') : (message ?? ''),
    body.details ? JSON.stringify(body.details) : '',
  ].filter(Boolean);
  return parts.join(' | ').slice(0, 400);
}

/** Aborta con un mensaje claro si un paso previo no dejó lo que hace falta. */
function need(value, what) {
  if (!value) {
    console.error(`\nNo se pudo continuar: falta ${what}.`);
    console.error('Últimas llamadas:');
    for (const entry of log.slice(-5)) {
      console.error(
        `  [${entry.status}] ${entry.method} ${entry.path} — ${entry.title}` +
          (entry.detail ? `\n      ${entry.detail}` : ''),
      );
    }
    writeReport();
    process.exit(1);
  }
  return value;
}

/** Fecha ISO a las 00:00 UTC, desplazada `days` desde hoy. */
function dayUtc(days) {
  const date = new Date(Date.now() + days * 86400000);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * La zona horaria de las sedes que se siembran. Bolivia no tiene horario de
 * verano, así que su desfase es constante todo el año.
 */
const ZONA = 'America/La_Paz';

/**
 * Cuántas horas hay que sumar a una hora de pared de {@link ZONA} para expresarla
 * en UTC. Para La Paz (UTC-4) son 4.
 *
 * ## Por qué esto existe, y por qué no debería
 *
 * `generateSlots` interpreta el `startTime` de una franja **en UTC**
 * (`scheduling-catalog.service.ts`, `atTime()` usa `setUTCHours`) y **no lee**
 * `schedulable_resources.time_zone`, aunque el recurso la declare y el modelo la
 * exija. Consecuencia: una agenda que publica «mañanas de 08:00 a 12:00»
 * materializa cupos a las **04:00–08:00 hora de La Paz**, y el portal del
 * paciente ofrece turnos de madrugada.
 *
 * Mientras el generador no respete la zona del recurso, el seeder declara la
 * hora ya convertida para que los datos de desarrollo se vean como se verían si
 * el generador fuera correcto. Es una compensación deliberada, no un descuido:
 * cuando el backend lea `time_zone`, esto se borra y las franjas vuelven a
 * declararse en hora local.
 */
function horaUtcDeLocal(horaLocal) {
  const referencia = new Date();
  // El desfase sale de la propia base de datos de zonas horarias, no de una
  // constante: si alguien cambia ZONA por una con horario de verano, esto sigue
  // dando el desfase vigente en vez de un número escrito a mano que caduca.
  const enZona = new Date(referencia.toLocaleString('en-US', { timeZone: ZONA }));
  const enUtc = new Date(referencia.toLocaleString('en-US', { timeZone: 'UTC' }));
  const desfaseHoras = Math.round((enUtc.getTime() - enZona.getTime()) / 3_600_000);

  const [hh, mm, ss] = horaLocal.split(':').map(Number);
  const total = (hh + desfaseHoras + 24) % 24;
  return [total, mm, ss ?? 0]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

/** Imprime una línea de avance (se puede silenciar con --quiet). */
function step(message) {
  if (!flag('quiet')) console.log(message);
}

// --- sesión -------------------------------------------------------------------

step(
  `Sembrando contra ${BASE} — ${DOCTORS} médicos, ${PATIENTS} pacientes, ${WEEKS} semanas de agenda.`,
);

const login = await call(
  'Sesión',
  'Login del administrador',
  'POST',
  '/iam/auth/login',
  {
    auth: false,
    body: { email: EMAIL, password: PASSWORD },
    expect: [200, 201],
  },
);
token = need(login.body?.accessToken, 'el accessToken del administrador');
const claims = JSON.parse(
  Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
);
tenantId = need(claims.tenants?.[0], 'el tenant del administrador');

// Credenciales inválidas: el 401 confirma que el guard no está abierto.
await call(
  'Sesión',
  'Contraseña incorrecta se rechaza',
  'POST',
  '/iam/auth/login',
  {
    auth: false,
    body: { email: EMAIL, password: 'contrasena-incorrecta' },
    expect: [400, 401],
  },
);
await call(
  'Sesión',
  'Sin token no se listan pacientes',
  'GET',
  '/profiles/patients?limit=1',
  {
    auth: false,
    expect: 401,
  },
);

// --- terminología: ids reales para los campos *ConceptId ----------------------

const conceptPage = await call(
  'Terminología',
  'Catálogo de conceptos (rellena los *ConceptId)',
  'GET',
  '/terminology/concepts?limit=50',
);
const conceptIds = (conceptPage.body?.items ?? []).map(
  (item) => item.conceptId,
);
const conceptId = need(conceptIds[0], 'al menos un concepto del catálogo');

// --- profesionales -------------------------------------------------------------

step('· Profesionales y sus agendas…');

for (let index = 0; index < DOCTORS; index += 1) {
  const [nombre, apellido, titulo] =
    NOMBRES_MEDICOS[index % NOMBRES_MEDICOS.length];
  const suffix = `${U}-${index}`;

  const created = await call(
    'Profesionales',
    `Alta de Dr(a). ${nombre} ${apellido} — ${titulo}`,
    'POST',
    '/profiles/practitioners',
    {
      body: {
        practitionerCode: `MED-${suffix}`,
        displayName: `Dr(a). ${nombre} ${apellido}`,
        licenseNumber: `LIC-${suffix}`,
        credentialNumber: `CRED-${suffix}`,
        professionalTitle: titulo,
      },
      expect: [200, 201],
    },
  );
  if (!created.ok) continue;

  const profileId = created.body.profileId;
  const credentialId = created.body.credentialId;

  // Verificación de la credencial: sin esto el profesional queda "pendiente" y
  // la agenda se vería publicada por alguien sin matrícula comprobada.
  await call(
    'Profesionales',
    `Verificar la credencial de ${apellido}`,
    'POST',
    `/profiles/credentials/${credentialId}/verify`,
    {
      body: {
        decision: 'VERIFIED',
        // El dominio exige declarar contra qué se comprobó la matrícula: una
        // credencial "verificada" sin fuente no es verificable por nadie más.
        verificationSourceUri: `https://registro-profesional.test/matriculas/LIC-${suffix}`,
      },
      expect: [200, 201, 204],
    },
  );

  const resource = await call(
    'Agenda',
    `Consultorio de ${apellido}`,
    'POST',
    '/scheduling/resources',
    {
      body: {
        tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'practitioner_profiles',
        resourceRefId: profileId,
        name: `Consultorio ${titulo} — ${apellido}`,
        timeZone: ZONA,
        capacity: 1,
      },
      expect: [200, 201],
    },
  );
  if (!resource.ok) continue;

  // Política de reserva: es lo que hace que la agenda tenga reglas de negocio
  // (antelación mínima, ventana de cancelación) en vez de aceptar cualquier cosa.
  const policy = await call(
    'Agenda',
    `Política de reserva de ${apellido}`,
    'POST',
    '/scheduling/booking-policies',
    {
      body: {
        tenantId,
        code: `POL-${suffix}`,
        name: `Política ${titulo}`,
        minNoticeMinutes: 60,
        maxAdvanceDays: 90,
        cancellationWindowMinutes: 120,
        maxActivePerPatient: 5,
        holdTtlSeconds: 300,
      },
      expect: [200, 201],
    },
  );

  // Mañanas de lunes a viernes; media hora por cupo. Suficiente volumen para
  // que la agenda se vea llena sin generar miles de filas por médico.
  const template = await call(
    'Agenda',
    `Plantilla semanal de ${apellido}`,
    'POST',
    `/scheduling/resources/${resource.body.id}/templates`,
    {
      body: {
        name: `Mañanas L-V — ${apellido}`,
        slotMinutes: 30,
        bookingPolicyId: policy.ok ? policy.body.id : undefined,
        // Las horas se declaran locales y se convierten acá: ver `horaUtcDeLocal`.
        rules: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: horaUtcDeLocal('08:00:00'),
          endTime: horaUtcDeLocal('12:00:00'),
        })),
      },
      expect: [200, 201],
    },
  );
  if (!template.ok) continue;

  const from = dayUtc(0);
  const to = dayUtc(WEEKS * 7);
  const slots = await call(
    'Agenda',
    `Materializar ${WEEKS} semanas de cupos de ${apellido}`,
    'POST',
    `/scheduling/templates/${template.body.id}/generate-slots`,
    {
      body: { from: from.toISOString(), to: to.toISOString() },
      expect: [200, 201],
    },
  );

  doctors.push({
    index,
    nombre,
    apellido,
    titulo,
    profileId,
    resourceId: resource.body.id,
    templateId: template.body.id,
    policyId: policy.ok ? policy.body.id : null,
    slotsCreated: slots.body?.created ?? 0,
    from,
    to,
  });
}

need(doctors.length, 'al menos un profesional con agenda publicada');
step(
  `  ${doctors.length} profesionales con agenda (${doctors.reduce((sum, d) => sum + d.slotsCreated, 0)} cupos).`,
);

// Regenerar la misma ventana no debe duplicar cupos: se cuentan como `skipped`.
const regenerated = await call(
  'Agenda',
  'Regenerar la misma ventana es idempotente (skipped, no duplicados)',
  'POST',
  `/scheduling/templates/${doctors[0].templateId}/generate-slots`,
  {
    body: {
      from: doctors[0].from.toISOString(),
      to: doctors[0].to.toISOString(),
    },
    expect: [200, 201],
  },
);
if (regenerated.ok && regenerated.body?.created > 0) {
  log[log.length - 1].ok = false;
  log[log.length - 1].detail =
    `regeneró ${regenerated.body.created} cupos: la generación duplica`;
}

// Ausencia de un profesional: bloquea cupos ya publicados.
if (doctors[1]) {
  await call(
    'Agenda',
    `Ausencia programada de ${doctors[1].apellido}`,
    'POST',
    `/scheduling/resources/${doctors[1].resourceId}/exceptions`,
    {
      body: {
        exceptionType: 'ABSENCE',
        startAt: dayUtc(WEEKS * 7 - 2).toISOString(),
        endAt: dayUtc(WEEKS * 7 - 1).toISOString(),
        reason: 'Congreso de la especialidad',
        isAvailable: false,
      },
      expect: [200, 201],
    },
  );
}

// --- pacientes ------------------------------------------------------------------

step('· Pacientes…');

for (let index = 0; index < PATIENTS; index += 1) {
  const [nombre, apellido] =
    NOMBRES_PACIENTES[index % NOMBRES_PACIENTES.length];
  const year = 1945 + Math.floor(rand() * 60);
  const month = String(1 + Math.floor(rand() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(rand() * 28)).padStart(2, '0');

  const created = await call(
    'Pacientes',
    `Alta de ${nombre} ${apellido}`,
    'POST',
    '/profiles/patients',
    {
      body: {
        patientCode: `PAC-${U}-${index}`,
        displayName: `${nombre} ${apellido}`,
        birthDate: `${year}-${month}-${day}`,
      },
      expect: [200, 201],
    },
  );
  if (!created.ok) continue;

  // Un tercio con contacto de emergencia: la ficha se ve poblada de verdad, no
  // todos los pacientes iguales.
  if (index % 3 === 0) {
    await call(
      'Pacientes',
      `Contacto de emergencia de ${apellido}`,
      'POST',
      `/profiles/patients/${created.body.profileId}/related-persons`,
      {
        body: {
          displayName: `${pick(NOMBRES_PACIENTES)[0]} ${apellido}`,
          isEmergencyContact: true,
        },
        expect: [200, 201],
      },
    );
  }

  patients.push({
    index,
    nombre,
    apellido,
    profileId: created.body.profileId,
    personId: created.body.personId,
  });
}

need(patients.length, 'al menos un paciente');
step(`  ${patients.length} pacientes.`);

// Código duplicado: la unicidad del expediente tiene que sostenerse.
await call(
  'Pacientes',
  'Código de paciente duplicado se rechaza',
  'POST',
  '/profiles/patients',
  {
    body: { patientCode: `PAC-${U}-0`, displayName: 'Duplicado de prueba' },
    expect: [409, 422],
  },
);
await call(
  'Pacientes',
  'Paciente inexistente da 404',
  'GET',
  '/profiles/patients/00000000-0000-4000-8000-0000000000ff',
  {
    expect: 404,
  },
);
await call(
  'Pacientes',
  'UUID malformado da 400',
  'GET',
  '/profiles/patients/no-es-uuid',
  {
    expect: 400,
  },
);
await call(
  'Pacientes',
  'Listado paginado por cursor',
  'GET',
  '/profiles/patients?limit=10',
);

// --- citas: el movimiento de la clínica ------------------------------------------

step('· Citas y su ciclo de vida…');

/**
 * Reparto de estados de las citas.
 *
 * No se busca un reparto realista de una clínica concreta, sino que **cada
 * estado alcanzable tenga población**: una pantalla que sólo sabe pintar citas
 * confirmadas se descubre aquí, no en producción.
 */
const REPARTO = [
  'CONFIRMADA',
  'CONFIRMADA',
  'CONFIRMADA',
  'ATENDIDA',
  'ATENDIDA',
  'REPROGRAMADA',
  'CANCELADA_PACIENTE',
  'CANCELADA_CLINICA',
  'NO_SHOW',
  'CON_RECORDATORIO',
];

let patientCursor = 0;
let limitesEjercidos = false;

for (const doctor of doctors) {
  const agenda = await call(
    'Agenda',
    `Cupos disponibles de ${doctor.apellido}`,
    'GET',
    `/scheduling/resources/${doctor.resourceId}/slots` +
      `?from=${doctor.from.toISOString()}&to=${doctor.to.toISOString()}&limit=40`,
  );
  const slots = (agenda.body?.items ?? []).map((item) => item.id);
  if (slots.length === 0) continue;

  // Entre 6 y 12 citas por médico: la agenda se ve con movimiento pero deja
  // cupos libres, que es lo que se necesita para poder reservar a mano después.
  const cuantas = Math.min(slots.length - 2, 6 + Math.floor(rand() * 7));

  for (let n = 0; n < cuantas; n += 1) {
    const slotId = slots[n];
    const patient = patients[patientCursor % patients.length];
    patientCursor += 1;
    const estado = REPARTO[(doctor.index * 7 + n) % REPARTO.length];

    const hold = await call(
      'Citas',
      `Tomar cupo — ${patient.apellido} con ${doctor.apellido}`,
      'POST',
      `/scheduling/slots/${slotId}/holds`,
      { body: { patientProfileId: patient.profileId }, expect: [200, 201] },
    );
    if (!hold.ok) continue;

    // El anti-doble-reserva se prueba una sola vez: es una propiedad del
    // endpoint, no de cada cita, y repetirla en 100 citas sólo alarga la corrida.
    if (!limitesEjercidos) {
      await call(
        'Citas',
        'Un segundo hold sobre el mismo cupo se rechaza (anti doble reserva)',
        'POST',
        `/scheduling/slots/${slotId}/holds`,
        {
          body: {
            patientProfileId: patients[1]?.profileId ?? patient.profileId,
          },
          expect: [409, 422],
        },
      );
    }

    const booking = await call(
      'Citas',
      `Confirmar cita — ${patient.apellido} con ${doctor.apellido}`,
      'POST',
      `/scheduling/holds/${hold.body.holdToken}/confirm`,
      {
        body: {
          tenantId,
          patientProfileId: patient.profileId,
          channel: pick(CANALES),
          reasonText: pick(MOTIVOS),
          reminderOffsetsMinutes: [1440, 60],
        },
        expect: [200, 201],
      },
    );
    if (!booking.ok) continue;

    const bookingId = booking.body.id;
    bookings.push({ bookingId, doctor, patient, estado, slotId });

    if (!limitesEjercidos) {
      await call(
        'Citas',
        'Reusar un hold ya confirmado se rechaza',
        'POST',
        `/scheduling/holds/${hold.body.holdToken}/confirm`,
        {
          body: {
            tenantId,
            patientProfileId: patient.profileId,
            channel: 'PORTAL',
          },
          expect: [404, 409, 410, 422],
        },
      );
      await call(
        'Citas',
        'Cita inexistente da 404',
        'GET',
        '/scheduling/bookings/00000000-0000-4000-8000-0000000000ff',
        {
          expect: 404,
        },
      );
      limitesEjercidos = true;
    }

    // --- ciclo de vida según el reparto ---
    if (estado === 'ATENDIDA') {
      await call(
        'Citas',
        `Check-in de ${patient.apellido}`,
        'POST',
        `/scheduling/bookings/${bookingId}/check-in`,
        {
          body: {},
          expect: [200, 201],
        },
      );
    } else if (estado === 'REPROGRAMADA') {
      const destino = slots[cuantas + (n % 2)];
      if (destino) {
        await call(
          'Citas',
          `Reprogramar la cita de ${patient.apellido}`,
          'POST',
          `/scheduling/bookings/${bookingId}/reschedule`,
          {
            body: {
              toSlotId: destino,
              reasonText: 'El paciente pidió otro horario',
            },
            expect: [200, 201],
          },
        );
      }
    } else if (estado === 'CANCELADA_PACIENTE') {
      await call(
        'Citas',
        `${patient.apellido} cancela su cita`,
        'POST',
        `/scheduling/bookings/${bookingId}/cancel`,
        {
          body: { cancelledBy: 'PATIENT', isNoShow: false },
          expect: [200, 201],
        },
      );
    } else if (estado === 'CANCELADA_CLINICA') {
      await call(
        'Citas',
        `La clínica cancela la cita de ${patient.apellido}`,
        'POST',
        `/scheduling/bookings/${bookingId}/cancel`,
        {
          body: { cancelledBy: 'PROVIDER', isNoShow: false },
          expect: [200, 201],
        },
      );
    } else if (estado === 'NO_SHOW') {
      await call(
        'Citas',
        `${patient.apellido} no se presentó`,
        'POST',
        `/scheduling/bookings/${bookingId}/cancel`,
        {
          body: { cancelledBy: 'PROVIDER', isNoShow: true },
          expect: [200, 201],
        },
      );
    } else if (estado === 'CON_RECORDATORIO') {
      await call(
        'Citas',
        `Recordatorios extra para ${patient.apellido}`,
        'POST',
        `/scheduling/bookings/${bookingId}/reminders`,
        {
          body: { offsetsMinutes: [2880, 180], channel: 'EMAIL' },
          expect: [200, 201],
        },
      );
    }
  }
}

need(bookings.length, 'al menos una cita confirmada');
step(
  `  ${bookings.length} citas repartidas en ${new Set(bookings.map((b) => b.estado)).size} estados.`,
);

// Límites del ciclo de vida, sobre citas ya llevadas a un estado terminal.
const cancelada = bookings.find(
  (b) => b.estado.startsWith('CANCELADA') || b.estado === 'NO_SHOW',
);
if (cancelada) {
  await call(
    'Citas',
    'Cancelar dos veces se rechaza',
    'POST',
    `/scheduling/bookings/${cancelada.bookingId}/cancel`,
    {
      body: { cancelledBy: 'PATIENT' },
      expect: [409, 422],
    },
  );
  await call(
    'Citas',
    'Reprogramar una cita cancelada se rechaza',
    'POST',
    `/scheduling/bookings/${cancelada.bookingId}/reschedule`,
    {
      body: { toSlotId: cancelada.slotId, reasonText: 'no debería poder' },
      expect: [409, 422],
    },
  );
  await call(
    'Citas',
    'Check-in de una cita cancelada se rechaza',
    'POST',
    `/scheduling/bookings/${cancelada.bookingId}/check-in`,
    {
      body: {},
      expect: [409, 422],
    },
  );
}

const atendida = bookings.find((b) => b.estado === 'ATENDIDA');
if (atendida) {
  await call(
    'Citas',
    'Doble check-in se rechaza',
    'POST',
    `/scheduling/bookings/${atendida.bookingId}/check-in`,
    {
      body: {},
      expect: [409, 422],
    },
  );
}

// Lecturas de agenda: son las que alimentan las pantallas.
await call(
  'Citas',
  'Citas de un paciente',
  'GET',
  `/scheduling/bookings?patientProfileId=${patients[0].profileId}`,
);
await call(
  'Citas',
  'Citas de un paciente, incluidas las canceladas',
  'GET',
  `/scheduling/bookings?patientProfileId=${patients[0].profileId}&includeCancelled=true`,
);
await call(
  'Citas',
  'Agenda del día de un consultorio',
  'GET',
  `/scheduling/bookings?resourceId=${doctors[0].resourceId}`,
);
await call(
  'Citas',
  'Listar citas sin filtro se rechaza (exige paciente o recurso)',
  'GET',
  '/scheduling/bookings',
  {
    expect: [400, 422],
  },
);

// Lista de espera: pacientes sin cupo, que es el otro estado del mundo real.
for (const patient of patients.slice(0, 5)) {
  await call(
    'Lista de espera',
    `${patient.apellido} entra en lista de espera`,
    'POST',
    '/scheduling/waitlist',
    {
      body: {
        tenantId,
        patientProfileId: patient.profileId,
        resourceId: pick(doctors).resourceId,
        desiredFrom: dayUtc(1).toISOString(),
        desiredTo: dayUtc(WEEKS * 7).toISOString(),
        priority: 1 + Math.floor(rand() * 5),
      },
      expect: [200, 201],
    },
  );
}

// Reglas de confirmación: alta, activación, evaluación y baja — el ciclo entero.
const rule = await call(
  'Reglas de confirmación',
  'Crear regla de auto-confirmación',
  'POST',
  '/scheduling/confirmation-rules',
  {
    body: {
      tenantId,
      scope: 'TENANT',
      priority: 10,
      effectiveFrom: dayUtc(-1).toISOString(),
      condition: { all: [] },
      decision: 'AUTO_CONFIRM',
    },
    expect: [200, 201],
  },
);
if (rule.ok) {
  await call(
    'Reglas de confirmación',
    'Activar la regla',
    'POST',
    `/scheduling/confirmation-rules/${rule.body.id}/activate`,
    {
      body: {},
      expect: [200, 201, 204],
    },
  );
  await call(
    'Reglas de confirmación',
    'Listar reglas vigentes',
    'GET',
    `/scheduling/confirmation-rules?tenantId=${tenantId}`,
  );
  await call(
    'Reglas de confirmación',
    'Evaluar una solicitud contra las reglas',
    'POST',
    '/scheduling/confirmation-rules/evaluate',
    {
      body: {
        tenantId,
        resourceId: doctors[0].resourceId,
        requestData: {
          channel: 'PORTAL',
          patientProfileId: patients[0].profileId,
        },
      },
      expect: [200, 201],
    },
  );
  await call(
    'Reglas de confirmación',
    'Desactivar la regla',
    'POST',
    `/scheduling/confirmation-rules/${rule.body.id}/deactivate`,
    {
      body: {},
      expect: [200, 201, 204],
    },
  );
}

// --- historia clínica ------------------------------------------------------------

step('· Historias clínicas, recetas y notas…');

/** Cuántas citas atendidas derivan en historia clínica completa. */
const conHistoria = bookings
  .filter((b) => b.estado === 'ATENDIDA' || b.estado === 'CONFIRMADA')
  .slice(0, 20);

for (const [n, cita] of conHistoria.entries()) {
  const { doctor, patient } = cita;
  const motivo = pick(MOTIVOS);

  // Un paciente sólo puede tener un episodio abierto a la vez. Como aquí un
  // mismo paciente vuelve en más de una cita, el segundo intento devuelve 409:
  // es la regla funcionando, no un fallo. Se abre uno por paciente y las
  // atenciones siguientes se cuelgan del episodio ya abierto.
  const episode = episodios.has(patient.profileId)
    ? { ok: true, body: { id: episodios.get(patient.profileId) } }
    : await call(
        'Historia clínica',
        `Episodio de ${patient.apellido}`,
        'POST',
        '/clinical/care-episodes',
        {
          body: {
            patientProfileId: patient.profileId,
            tenantId,
            responsiblePractitionerId: doctor.profileId,
          },
          expect: [200, 201],
        },
      );
  if (episode.ok && episode.body?.id)
    episodios.set(patient.profileId, episode.body.id);

  // El mismo límite, ejercido a propósito una sola vez.
  if (n === 0) {
    await call(
      'Historia clínica',
      'Abrir un segundo episodio activo se rechaza',
      'POST',
      '/clinical/care-episodes',
      {
        body: {
          patientProfileId: patient.profileId,
          tenantId,
          responsiblePractitionerId: doctor.profileId,
        },
        expect: [409, 422],
      },
    );
  }

  const encounter = await call(
    'Historia clínica',
    `Atención de ${patient.apellido} con ${doctor.apellido}`,
    'POST',
    '/clinical/encounters/check-in',
    {
      body: {
        patientProfileId: patient.profileId,
        tenantId,
        episodeId: episode.ok ? episode.body.id : undefined,
        primaryPractitionerId: doctor.profileId,
        reasonText: motivo,
      },
      expect: [200, 201],
    },
  );
  if (!encounter.ok) continue;

  const encounterId = encounter.body.id;
  const dx = conceptIds[n % conceptIds.length];

  await call(
    'Historia clínica',
    `Diagnóstico de ${patient.apellido}`,
    'POST',
    '/clinical/conditions',
    {
      body: {
        custodianTenantId: tenantId,
        patientProfileId: patient.profileId,
        encounterId,
        codeConceptId: dx,
      },
      expect: [200, 201],
    },
  );

  if (n % 3 === 0) {
    await call(
      'Historia clínica',
      `Alergia de ${patient.apellido}`,
      'POST',
      '/clinical/allergy-intolerances',
      {
        body: {
          custodianTenantId: tenantId,
          patientProfileId: patient.profileId,
          substanceConceptId: conceptIds[(n + 5) % conceptIds.length],
          reactions: [
            { manifestationConceptId: dx, description: 'Urticaria y prurito' },
          ],
        },
        expect: [200, 201],
      },
    );
  }

  // Signos vitales: dos observaciones por atención dan gráficos con más de un punto.
  for (const [medida, valor] of [
    ['temperatura', 36.4 + rand() * 2],
    ['saturación', 92 + rand() * 7],
  ]) {
    await call(
      'Historia clínica',
      `Observación (${medida}) de ${patient.apellido}`,
      'POST',
      '/clinical/observations',
      {
        body: {
          custodianTenantId: tenantId,
          patientProfileId: patient.profileId,
          encounterId,
          codeConceptId: conceptIds[(n + 2) % conceptIds.length],
          valueDecimal: Number(valor.toFixed(1)),
        },
        expect: [200, 201],
      },
    );
  }

  const prescription = await call(
    'Historia clínica',
    `Receta de ${patient.apellido}`,
    'POST',
    '/clinical/medication-requests',
    {
      body: {
        custodianTenantId: tenantId,
        patientProfileId: patient.profileId,
        encounterId,
        medicationConceptId: conceptIds[(n + 7) % conceptIds.length],
        prescriberProfileId: doctor.profileId,
        doseText: pick(['500 mg', '1 g', '250 mg', '10 mg']),
        frequencyText: pick([
          'cada 8 horas',
          'cada 12 horas',
          'una vez al día',
        ]),
        quantityDecimal: 10 + Math.floor(rand() * 20),
      },
      expect: [200, 201],
    },
  );

  if (prescription.ok) {
    const prescriptionId = prescription.body.id;
    // Se dejan recetas en los tres estados: borrador, firmada y emitida.
    if (n % 4 !== 0) {
      await call(
        'Historia clínica',
        `Firmar receta de ${patient.apellido}`,
        'POST',
        `/clinical/medication-requests/${prescriptionId}/sign`,
        {
          body: {},
          expect: [200, 201],
        },
      );
      if (n % 4 !== 1) {
        await call(
          'Historia clínica',
          `Emitir receta de ${patient.apellido}`,
          'POST',
          `/clinical/medication-requests/${prescriptionId}/issue`,
          {
            body: {},
            expect: [200, 201],
          },
        );
        if (n === 2) {
          await call(
            'Historia clínica',
            'Emitir dos veces la misma receta se rechaza',
            'POST',
            `/clinical/medication-requests/${prescriptionId}/issue`,
            {
              body: {},
              expect: [409, 422],
            },
          );
        }
      }
    } else if (n === 0) {
      // Sin política de firma vigente la emisión de un borrador NO exige firma
      // (REDESA D-05 es fail-safe: sin política aplicable no se endurece). Se
      // ejercita para dejar el comportamiento fijado por una prueba.
      await call(
        'Historia clínica',
        'Emitir un borrador sin firmar (permitido sin política de firma)',
        'POST',
        `/clinical/medication-requests/${prescriptionId}/issue`,
        {
          body: {},
          expect: [200, 201],
        },
      );
    }
  }

  // --- expediente ---
  const note = await call(
    'Expediente',
    `Nota clínica de ${patient.apellido}`,
    'POST',
    '/charts/notes',
    {
      body: {
        patientProfileId: patient.profileId,
        authorProfileId: doctor.profileId,
        encounterId,
        chiefComplaintText: motivo,
        subjectiveText: `Refiere ${motivo.toLowerCase()}.`,
        objectiveText: 'Paciente en buen estado general, afebril al examen.',
        assessmentText: `Cuadro compatible con ${motivo.toLowerCase()}.`,
        planText: 'Tratamiento sintomático y control en 48 horas.',
      },
      expect: [200, 201],
    },
  );

  if (note.ok) {
    const { noteId, versionId } = note.body;
    // Una de cada tres queda en borrador: el portal del paciente no debe verlas.
    if (n % 3 !== 2) {
      await call(
        'Expediente',
        `Firmar la nota de ${patient.apellido}`,
        'POST',
        `/charts/notes/${noteId}/versions/${versionId}/sign`,
        {
          body: { signerProfileId: doctor.profileId },
          expect: [200, 201],
        },
      );
      await call(
        'Expediente',
        `Liberar la nota de ${patient.apellido} al portal`,
        'POST',
        `/charts/notes/versions/${versionId}/release`,
        {
          body: { policyVersion: 'v1' },
          expect: [200, 201],
        },
      );
      if (n === 1) {
        await call(
          'Expediente',
          'Firmar dos veces la misma versión se rechaza',
          'POST',
          `/charts/notes/${noteId}/versions/${versionId}/sign`,
          {
            body: { signerProfileId: doctor.profileId },
            expect: [409, 422],
          },
        );
      }
    }
  }

  if (n % 2 === 0) {
    await call(
      'Expediente',
      `Plan de cuidados de ${patient.apellido}`,
      'POST',
      '/charts/care-plans',
      {
        body: {
          patientProfileId: patient.profileId,
          authorProfileId: doctor.profileId,
          goalText: pick([
            'Controlar la presión arterial',
            'Recuperar hidratación',
            'Bajar la carga glucémica',
          ]),
          activities: [
            { detailText: 'Control en 48 horas' },
            { detailText: 'Dieta hiposódica' },
          ],
        },
        expect: [200, 201],
      },
    );
  }

  if (n % 4 === 0) {
    await call(
      'Expediente',
      `Documento externo de ${patient.apellido}`,
      'POST',
      '/charts/documents',
      {
        body: {
          patientProfileId: patient.profileId,
          tenantId,
          title: pick([
            'Informe de laboratorio',
            'Radiografía de tórax',
            'Interconsulta de cardiología',
          ]),
          authorText: 'Laboratorio Central',
          isExternal: true,
        },
        expect: [200, 201],
      },
    );
  }

  historias += 1;
}

step(`  ${historias} historias clínicas con receta y nota.`);

// --- lecturas que alimentan las pantallas ------------------------------------------

step('· Lecturas de las pantallas…');

await call(
  'Lecturas',
  'Resumen clínico del paciente',
  'GET',
  `/clinical/patients/${patients[0].profileId}/summary`,
);
await call(
  'Lecturas',
  'Expediente completo del paciente',
  'GET',
  `/charts/patients/${patients[0].profileId}/chart`,
);
await call(
  'Lecturas',
  'Ficha de filiación del paciente',
  'GET',
  `/profiles/patients/${patients[0].profileId}`,
);
await call(
  'Lecturas',
  'Buscar pacientes por texto',
  'GET',
  `/profiles/patients?q=${encodeURIComponent(patients[0].apellido)}&limit=10`,
);
await call(
  'Lecturas',
  'Resolver etiquetas de los *ConceptId',
  'GET',
  `/terminology/concepts?ids=${conceptIds.slice(0, 3).join(',')}`,
);
// El resumen es una lectura agregada que no comprueba la existencia del
// paciente: un id inexistente devuelve 200 con los cinco bloques vacíos, igual
// que un paciente sin historia. Queda fijado aquí para que el front sepa que no
// puede distinguir ambos casos por el status.
await call(
  'Lecturas',
  'Resumen clínico de un id inexistente: 200 con bloques vacíos',
  'GET',
  '/clinical/patients/00000000-0000-4000-8000-0000000000ff/summary',
  {
    expect: [200],
  },
);

// --- reporte -----------------------------------------------------------------------

/** Vuelca el reporte y resume por sección en la salida estándar. */
function writeReport() {
  const bySection = new Map();
  for (const entry of log) {
    const bucket = bySection.get(entry.section) ?? {
      total: 0,
      ok: 0,
      fallos: [],
    };
    bucket.total += 1;
    if (entry.ok) bucket.ok += 1;
    else bucket.fallos.push(entry);
    bySection.set(entry.section, bucket);
  }

  const failed = log.filter((entry) => !entry.ok);
  const report = {
    generadoContra: BASE,
    sufijoDeCorrida: U,
    totales: {
      llamadas: log.length,
      correctas: log.length - failed.length,
      fallidas: failed.length,
      medicos: doctors.length,
      pacientes: patients.length,
      citas: bookings.length,
      historias,
    },
    porSeccion: Object.fromEntries(
      [...bySection].map(([name, value]) => [
        name,
        { total: value.total, ok: value.ok },
      ]),
    ),
    fallos: failed,
    llamadas: log,
  };
  writeFileSync(OUT, JSON.stringify(report, null, 2));

  console.log('\n── Resumen ──────────────────────────────────────────');
  for (const [name, value] of bySection) {
    const mark = value.ok === value.total ? '✔' : '✘';
    console.log(
      `  ${mark} ${name.padEnd(24)} ${String(value.ok).padStart(4)}/${String(value.total).padEnd(4)}`,
    );
  }
  console.log('─────────────────────────────────────────────────────');
  console.log(
    `  Médicos ${doctors.length} · Pacientes ${patients.length} · Citas ${bookings.length} · Historias ${historias}`,
  );
  console.log(
    `  Llamadas ${log.length} — ${log.length - failed.length} conformes, ${failed.length} fuera de lo esperado.`,
  );
  console.log(`  Detalle completo: ${OUT}`);

  if (failed.length > 0) {
    console.log('\n  Fuera de lo esperado:');
    for (const entry of failed.slice(0, 40)) {
      console.log(
        `   · [${entry.section}] ${entry.method} ${entry.path}\n` +
          `     ${entry.title}\n` +
          `     esperaba ${entry.expected?.join('/') ?? '2xx'}, obtuvo ${entry.status}` +
          (entry.detail ? `\n     ${entry.detail}` : ''),
      );
    }
    if (failed.length > 40)
      console.log(`   … y ${failed.length - 40} más en el JSON.`);
  }
  return failed.length;
}

const failures = writeReport();
process.exit(failures === 0 ? 0 : 1);
