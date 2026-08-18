#!/usr/bin/env node
/**
 * Ejercita contra una API REAL los flujos que el frontend consume de
 * `profiles`, `scheduling`, `chart`, `clinical` y `terminology`, y vuelca cada
 * petición con su respuesta literal en
 * `docs/frontend/CATALOGO-FLUJOS-VERIFICADOS.md`.
 *
 * No sustituye a las pruebas de integración —esas son las que fallan en CI—;
 * su valor es distinto: produce el catálogo con **cuerpos reales** que el
 * frontend puede copiar, y lo regenera cuando el contrato cambie, de modo que
 * la documentación no se desincronice del código sin que nadie lo note.
 *
 * Uso:
 *   node tools/redesa/exercise-front-flows.mjs [--base-url http://localhost:3000]
 *
 * Requiere una API levantada con un administrador de arranque
 * (`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`). Escribe datos de
 * prueba con sufijo único, así que es seguro repetirlo contra el mismo stack;
 * no debe apuntarse a una base con datos reales.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// Correos reales: ver `correos-reales.mjs`.
import { CORREOS } from './correos-reales.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const OUT = resolve(REPO, 'docs/frontend/CATALOGO-FLUJOS-VERIFICADOS.md');

/** Lee un argumento `--clave valor` de la línea de comandos. */
function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const BASE = arg('base-url', process.env.API_BASE_URL ?? 'http://localhost:3000');
const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? CORREOS.admin;
const PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';
const U = Date.now().toString().slice(-7);

/** Registro de todo lo ejercido, en orden. */
const log = [];
let token = '';

/**
 * Campos cuyo valor no se vuelca al catálogo.
 *
 * El catálogo se commitea, así que un token real dentro de él es una credencial
 * en el repositorio. Se sustituye por un marcador en vez de omitir el campo:
 * el frontend necesita saber que el campo VIENE y con qué forma, que es
 * justamente lo que se perdería al borrarlo.
 */
const SECRET_FIELDS = new Set([
  'accessToken',
  'refreshToken',
  'password',
  'newPassword',
  'activationToken',
  'token',
  'holdToken',
  'signatureValueEncrypted',
]);

/**
 * Copia el valor sustituyendo los campos sensibles por un marcador.
 *
 * @param value - Valor a redactar; se recorre en profundidad.
 * @returns Una copia sin secretos.
 */
function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [
      key,
      SECRET_FIELDS.has(key) && typeof inner === 'string' && inner.length > 0
        ? `<${key} — omitido en el catálogo>`
        : redact(inner),
    ]),
  );
}

/**
 * Ejecuta una petición y la registra.
 *
 * @param section - Bloque del catálogo al que pertenece.
 * @param title - Qué demuestra este paso.
 * @param method - Verbo HTTP.
 * @param path - Ruta, ya interpolada.
 * @param options - `body`, `auth` (por defecto sí) y `note`.
 * @returns El cuerpo de la respuesta ya parseado.
 */
async function call(section, title, method, path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  log.push({
    section,
    title,
    method,
    path,
    // Se redacta al registrar, no al escribir: así ningún camino de salida
    // puede olvidarse de hacerlo.
    request: options.body === undefined ? undefined : redact(options.body),
    status: res.status,
    response: redact(body),
    note: options.note,
  });
  // Se devuelve el cuerpo SIN redactar: los pasos siguientes necesitan los
  // valores reales para encadenarse.
  return body;
}

/** Aborta con un mensaje claro si un paso previo no dejó lo que hace falta. */
function need(value, what) {
  if (!value) {
    console.error(`No se pudo continuar: falta ${what}. Revise el log previo.`);
    process.exit(1);
  }
  return value;
}

const login = await call(
  'Sesión',
  'Iniciar sesión (el token de todo lo demás)',
  'POST',
  '/iam/auth/login',
  {
    auth: false,
    body: { email: EMAIL, password: PASSWORD },
    note: '`refreshToken` viaja en el cuerpo mientras `AUTH_REFRESH_COOKIE_ENABLED` esté apagado.',
  },
);
token = need(login?.accessToken, 'el accessToken del administrador');

// --- profiles ---------------------------------------------------------------

const patient = await call(
  'Perfiles (filiación)',
  'Alta de paciente (F-01)',
  'POST',
  '/profiles/patients',
  {
    body: {
      patientCode: `PAC-${U}`,
      displayName: 'María Fernández Quiroga',
      birthDate: '1990-05-14',
    },
  },
);
const patientProfileId = need(patient?.profileId, 'el perfil del paciente');

const practitioner = await call(
  'Perfiles (filiación)',
  'Alta de profesional',
  'POST',
  '/profiles/practitioners',
  {
    body: {
      practitionerCode: `MED-${U}`,
      displayName: 'Dr. Carlos Rojas',
      licenseNumber: `LIC-${U}`,
      credentialNumber: `CRED-${U}`,
      professionalTitle: 'Medicina General',
    },
    note: '`licenseNumber` y `credentialNumber` son obligatorios; la verificación de la matrícula la hace el propio profesional después, por self-service.',
  },
);
const practitionerProfileId = need(
  practitioner?.profileId,
  'el perfil del profesional',
);

await call(
  'Perfiles (filiación)',
  'Registrar contacto de emergencia',
  'POST',
  `/profiles/patients/${patientProfileId}/related-persons`,
  { body: { displayName: 'Ana Fernández', isEmergencyContact: true } },
);

await call(
  'Perfiles (filiación)',
  'Listado paginado de pacientes',
  'GET',
  `/profiles/patients?q=PAC-${U}&limit=10`,
  {
    note: 'Paginación por cursor keyset (`nextCursor`), no por offset: el listado se recorre mientras se dan de alta pacientes.',
  },
);

await call(
  'Perfiles (filiación)',
  'Ficha completa del paciente',
  'GET',
  `/profiles/patients/${patientProfileId}`,
  {
    note: 'Es la lectura que rellena F-01. No trae datos clínicos: esos viven en `clinical` y `chart`, que responden a otro rol.',
  },
);

// --- scheduling -------------------------------------------------------------

const resource = await call(
  'Agenda',
  'Crear el recurso agendable del profesional',
  'POST',
  '/scheduling/resources',
  {
    body: {
      tenantId: need(
        JSON.parse(
          Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
        ).tenants?.[0],
        'el tenant del actor',
      ),
      resourceType: 'PRACTITIONER',
      resourceRefType: 'practitioner_profiles',
      resourceRefId: practitionerProfileId,
      name: `Consultorio ${U}`,
      timeZone: 'America/La_Paz',
      capacity: 1,
    },
  },
);
const resourceId = need(resource?.id, 'el recurso de agenda');
const tenantId = JSON.parse(
  Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
).tenants[0];

const template = await call(
  'Agenda',
  'Publicar la plantilla semanal',
  'POST',
  `/scheduling/resources/${resourceId}/templates`,
  {
    body: {
      name: 'Mañanas L-D',
      slotMinutes: 30,
      rules: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: '08:00:00',
        endTime: '10:00:00',
      })),
    },
  },
);
const templateId = need(template?.id, 'la plantilla de agenda');

const from = new Date(Date.now() + 24 * 60 * 60 * 1000);
from.setUTCHours(0, 0, 0, 0);
const to = new Date(from.getTime() + 8 * 24 * 60 * 60 * 1000);

await call(
  'Agenda',
  'Materializar los slots de la ventana',
  'POST',
  `/scheduling/templates/${templateId}/generate-slots`,
  {
    body: { from: from.toISOString(), to: to.toISOString() },
    note: 'Idempotente: los slots que ya existen se cuentan como `skipped` en vez de duplicarse.',
  },
);

const agenda = await call(
  'Agenda',
  'Leer la agenda publicada',
  'GET',
  `/scheduling/resources/${resourceId}/slots?from=${from.toISOString()}&to=${to.toISOString()}&limit=3`,
  {
    note: '`onlyAvailable` es `true` por defecto y filtra por cupo restante, no por estado: un slot abierto con el cupo tomado por un hold vivo no se ofrece.',
  },
);
const slotId = need(agenda?.items?.[0]?.id, 'un slot disponible');

const hold = await call(
  'Agenda',
  'Tomar el cupo (anti doble reserva)',
  'POST',
  `/scheduling/slots/${slotId}/holds`,
  { body: { patientProfileId } },
);
const holdToken = need(hold?.holdToken, 'el hold del slot');

await call(
  'Agenda',
  'Un segundo hold sobre el mismo slot se rechaza',
  'POST',
  `/scheduling/slots/${slotId}/holds`,
  {
    body: { patientProfileId },
    note: 'Éste es el punto donde se evita el doble booking. El front debe tratar el 409 como "otro paciente se adelantó" y refrescar la agenda.',
  },
);

const booking = await call(
  'Agenda',
  'Confirmar la reserva',
  'POST',
  `/scheduling/holds/${holdToken}/confirm`,
  {
    body: {
      tenantId,
      patientProfileId,
      channel: 'PORTAL',
      reminderOffsetsMinutes: [1440, 60],
    },
  },
);
const bookingId = need(booking?.id, 'la cita confirmada');

await call(
  'Agenda',
  'Listar las citas del paciente',
  'GET',
  `/scheduling/bookings?patientProfileId=${patientProfileId}`,
  {
    note: 'Exige al menos `patientProfileId` o `resourceId`. `startAt`/`endAt` vienen resueltos desde el slot. Las canceladas se excluyen salvo `includeCancelled=true`.',
  },
);

await call('Agenda', 'Check-in del paciente', 'POST', `/scheduling/bookings/${bookingId}/check-in`, {
  body: {},
});

const otherSlot = agenda?.items?.[1]?.id;
if (otherSlot) {
  await call(
    'Agenda',
    'Reprogramar a otro hueco',
    'POST',
    `/scheduling/bookings/${bookingId}/reschedule`,
    { body: { toSlotId: otherSlot, reasonText: 'El paciente pidió más tarde' } },
  );
}

await call('Agenda', 'Cancelar la cita', 'POST', `/scheduling/bookings/${bookingId}/cancel`, {
  body: { cancelledBy: 'PATIENT', isNoShow: false },
});

await call(
  'Agenda',
  'Cancelar dos veces se rechaza',
  'POST',
  `/scheduling/bookings/${bookingId}/cancel`,
  {
    body: { cancelledBy: 'PATIENT' },
    note: 'La cancelación no es idempotente: repetirla da 409. El front debe tratarlo como "ya estaba cancelada" y refrescar, no como un fallo a reintentar.',
  },
);

// --- clinical ---------------------------------------------------------------

const concepts = await call(
  'Terminología',
  'Buscar conceptos por texto (rellenar un `*ConceptId`)',
  'GET',
  '/terminology/concepts?limit=2',
  {
    note: 'Los ~280 campos `*ConceptId` del contrato se rellenan con `conceptId`. `$lookup` sólo sirve si ya se conocen sistema y código exactos.',
  },
);
const codeConceptId = need(
  concepts?.items?.[0]?.conceptId,
  'un concepto del catálogo',
);

const episode = await call(
  'Registro clínico',
  'Abrir episodio de atención',
  'POST',
  '/clinical/care-episodes',
  {
    body: {
      patientProfileId,
      tenantId,
      responsiblePractitionerId: practitionerProfileId,
    },
  },
);

const encounter = await call(
  'Registro clínico',
  'Check-in del encuentro',
  'POST',
  '/clinical/encounters/check-in',
  {
    body: {
      patientProfileId,
      tenantId,
      episodeId: episode?.id,
      primaryPractitionerId: practitionerProfileId,
      reasonText: 'Dolor abdominal',
    },
  },
);

await call('Registro clínico', 'Registrar condición', 'POST', '/clinical/conditions', {
  body: {
    custodianTenantId: tenantId,
    patientProfileId,
    encounterId: encounter?.id,
    codeConceptId,
  },
});

await call(
  'Registro clínico',
  'Registrar alergia con su reacción',
  'POST',
  '/clinical/allergy-intolerances',
  {
    body: {
      custodianTenantId: tenantId,
      patientProfileId,
      substanceConceptId: codeConceptId,
      reactions: [{ manifestationConceptId: codeConceptId, description: 'Urticaria' }],
    },
  },
);

await call('Registro clínico', 'Registrar observación', 'POST', '/clinical/observations', {
  body: {
    custodianTenantId: tenantId,
    patientProfileId,
    encounterId: encounter?.id,
    codeConceptId,
    valueDecimal: 37.8,
  },
});

const prescription = await call(
  'Registro clínico',
  'Prescribir (queda en borrador)',
  'POST',
  '/clinical/medication-requests',
  {
    body: {
      custodianTenantId: tenantId,
      patientProfileId,
      encounterId: encounter?.id,
      medicationConceptId: codeConceptId,
      prescriberProfileId: practitionerProfileId,
      doseText: '500 mg',
      frequencyText: 'cada 8 horas',
      quantityDecimal: 21,
    },
  },
);
const prescriptionId = need(prescription?.id, 'la receta');

await call('Registro clínico', 'Firmar la receta', 'POST', `/clinical/medication-requests/${prescriptionId}/sign`, {
  body: {},
});

await call('Registro clínico', 'Emitir la receta', 'POST', `/clinical/medication-requests/${prescriptionId}/issue`, {
  body: {},
});

await call(
  'Registro clínico',
  'Emitirla de nuevo se rechaza',
  'POST',
  `/clinical/medication-requests/${prescriptionId}/issue`,
  {
    body: {},
    note: 'Sólo un borrador puede emitirse. El front debe tratar el 422 como "ya emitida", no como un fallo a reintentar.',
  },
);

await call(
  'Registro clínico',
  'Leer el historial clínico del paciente',
  'GET',
  `/clinical/patients/${patientProfileId}/summary`,
  {
    note: 'Los cinco bloques en una llamada. `truncated` declara cuáles quedaron recortados por `limit`: un historial incompleto no debe leerse como completo.',
  },
);

// --- chart ------------------------------------------------------------------

const note = await call('Expediente', 'Escribir una nota clínica', 'POST', '/charts/notes', {
  body: {
    patientProfileId,
    authorProfileId: practitionerProfileId,
    encounterId: encounter?.id,
    chiefComplaintText: 'Dolor abdominal',
    subjectiveText: 'Refiere dolor de tres días',
    objectiveText: 'Abdomen blando, sin defensa',
    assessmentText: 'Gastroenteritis probable',
    planText: 'Hidratación y control en 48 h',
  },
});
const noteId = need(note?.noteId, 'la nota clínica');
const versionId = need(note?.versionId, 'la versión de la nota');

await call('Expediente', 'Firmar la versión', 'POST', `/charts/notes/${noteId}/versions/${versionId}/sign`, {
  body: { signerProfileId: practitionerProfileId },
});

await call('Expediente', 'Liberar la versión al portal del paciente', 'POST', `/charts/notes/versions/${versionId}/release`, {
  body: { policyVersion: 'v1' },
});

await call('Expediente', 'Abrir un plan de cuidados', 'POST', '/charts/care-plans', {
  body: {
    patientProfileId,
    authorProfileId: practitionerProfileId,
    goalText: 'Recuperar hidratación',
    activities: [{ detailText: 'Control en 48 h' }],
  },
});

await call('Expediente', 'Registrar un documento', 'POST', '/charts/documents', {
  body: {
    patientProfileId,
    tenantId,
    title: 'Informe de laboratorio',
    authorText: 'Laboratorio Central',
    isExternal: true,
  },
});

const chart = await call(
  'Expediente',
  'Leer el expediente completo',
  'GET',
  `/charts/patients/${patientProfileId}/chart`,
  {
    note: 'Notas (con el texto de su versión vigente), planes con sus actividades y documentos, en una llamada. `releasedToPatient` viene derivado.',
  },
);

// --- terminología: resolver ids a etiqueta ----------------------------------

const idsToResolve = [
  chart?.notes?.[0]?.lifecycleStatusConceptId,
  chart?.carePlans?.[0]?.statusConceptId,
  chart?.documents?.[0]?.statusConceptId,
].filter(Boolean);

if (idsToResolve.length > 0) {
  await call(
    'Terminología',
    'Resolver a etiqueta los `*ConceptId` que devuelve el contrato',
    'GET',
    `/terminology/concepts?ids=${idsToResolve.join(',')}`,
    {
      note: 'Es la vía para pintar estados. Ninguna otra operación del catálogo resuelve un id, y toda respuesta del contrato los devuelve en UUID. Hasta 200 por petición.',
    },
  );
}

// --- salida -----------------------------------------------------------------

/** Serializa un valor como bloque de código JSON. */
function block(value) {
  return ['```json', JSON.stringify(value, null, 2), '```'].join('\n');
}

const bySection = new Map();
for (const entry of log) {
  const bucket = bySection.get(entry.section) ?? [];
  bucket.push(entry);
  bySection.set(entry.section, bucket);
}

const failures = log.filter(
  (entry) => entry.status >= 500 || (entry.status >= 400 && !entry.note),
);

const lines = [
  '# Catálogo de flujos verificados para el frontend',
  '',
  '> Generado por `node tools/redesa/exercise-front-flows.mjs`. **No se edita a mano**:',
  '> se regenera contra una API real y cada cuerpo de abajo es la respuesta literal',
  '> que devolvió. Si el contrato cambia, vuelva a ejecutarlo.',
  '',
  `- Generado contra \`${BASE}\``,
  `- Peticiones ejercidas: **${log.length}**`,
  `- Códigos de error deliberados (límites documentados): ${log.filter((e) => e.status >= 400).length}`,
  '',
  'Lo que aparece aquí está **garantizado**: se ejerció de punta a punta con datos',
  'reales, no con mocks. Lo que no aparece, no lo está.',
  '',
  '## Cómo leerlo',
  '',
  '- Cada paso trae la petición tal cual se envió y la respuesta tal cual volvió.',
  '- Los pasos con un estado 4xx son **límites deliberados**: el front tiene que',
  '  saber distinguirlos de un fallo, y por eso están aquí.',
  '- Todo campo `*ConceptId` es un UUID del catálogo de terminología. Para pintarlo',
  '  se resuelve con `GET /terminology/concepts?ids=…` (último bloque).',
  '',
  '---',
  '',
];

for (const [section, entries] of bySection) {
  lines.push(`## ${section}`, '');
  for (const entry of entries) {
    lines.push(
      `### ${entry.title}`,
      '',
      `\`${entry.method} ${entry.path}\` → **${entry.status}**`,
      '',
    );
    if (entry.note) lines.push(`> ${entry.note}`, '');
    if (entry.request !== undefined) {
      lines.push('**Petición**', '', block(entry.request), '');
    }
    lines.push('**Respuesta**', '', block(entry.response), '');
  }
  lines.push('---', '');
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join('\n'), 'utf8');

console.log(`Catálogo escrito en ${OUT} (${log.length} peticiones).`);
if (failures.length > 0) {
  console.error(
    `\nHay ${failures.length} respuesta(s) inesperada(s) —5xx, o 4xx sin explicación—:`,
  );
  for (const failure of failures) {
    console.error(`  ${failure.status} ${failure.method} ${failure.path}`);
  }
  // Sale distinto de cero para que un contrato roto no produzca un catálogo con
  // aspecto de sano.
  process.exit(1);
}
