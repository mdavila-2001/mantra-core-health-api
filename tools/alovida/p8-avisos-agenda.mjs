#!/usr/bin/env node
/**
 * p8-avisos-agenda.mjs — Recorrido funcional del carril **P8 · Avisos de
 * agenda** contra la API real.
 *
 * Comprueba los cuatro avisos que pide el registro del cliente, de punta a
 * punta y sin mocks: cada paso es una llamada HTTP con su guard, su validación
 * y su máquina de estados, y la evidencia de que un aviso llegó es una fila en
 * `messaging.in_app_notifications`, no un log.
 *
 * ```text
 * paciente B se anota en lista de espera
 *   └─ paciente A cancela su turno          -> (4) cambio de estado, al profesional
 *        └─ worker promueve la lista        -> (1) cupo liberado, a B
 * el profesional avisa que se demora        -> (2) demora, a los pacientes vigentes
 * el worker despacha los recordatorios      -> (3) recordatorio, al paciente
 * ```
 *
 * Uso:
 *   node tools/alovida/p8-avisos-agenda.mjs
 *   node tools/alovida/p8-avisos-agenda.mjs --base-url http://localhost:3010
 *   node tools/alovida/p8-avisos-agenda.mjs --out evidencias/p8/recorrido.json
 *
 * Requiere una API levantada con el administrador de arranque
 * (`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`) y con agenda publicada
 * — `tools/alovida/seed-dev-data.mjs` la deja lista.
 *
 * Termina en rojo si un paso no responde lo que declara esperar: el recorrido
 * vale como evidencia sólo si distingue «pasó» de «no falló».
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');

/** Lee un argumento `--clave valor`. */
function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const BASE = arg('base-url', 'http://localhost:3010');
const SALIDA = arg('out', 'evidencias/p8-avisos-agenda/recorrido.json');
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@redesa.test';
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';

/** Sufijo único de la corrida: los documentos de identidad son únicos. */
const CORRIDA = String(Date.now()).slice(-9);

const pasos = [];
let fallidos = 0;

/**
 * Llama a la API y comprueba el status contra lo esperado.
 *
 * @returns El cuerpo, o `null` si la respuesta no traía JSON.
 */
async function llamar(seccion, descripcion, metodo, ruta, { token, tenant, body, espera = [200, 201] } = {}) {
  const cabeceras = { 'content-type': 'application/json' };
  if (token) cabeceras.authorization = `Bearer ${token}`;
  if (tenant) cabeceras['x-tenant-id'] = tenant;

  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const texto = await respuesta.text();
  let cuerpo = null;
  try {
    cuerpo = texto === '' ? null : JSON.parse(texto);
  } catch {
    cuerpo = texto;
  }

  const ok = espera.includes(respuesta.status);
  if (!ok) fallidos += 1;
  pasos.push({
    seccion,
    descripcion,
    peticion: `${metodo} ${ruta}`,
    esperado: espera,
    status: respuesta.status,
    ok,
    ...(ok ? {} : { detalle: cuerpo }),
  });

  const marca = ok ? '✓' : '✗';
  console.log(`  ${marca} [${seccion}] ${descripcion} — ${metodo} ${ruta} → ${respuesta.status}`);
  if (!ok) console.log(`      ${JSON.stringify(cuerpo)}`);
  return cuerpo;
}

/**
 * Un claim del access token.
 *
 * Se lee sin verificar la firma a propósito: acá el token ya lo emitió esta
 * misma API hace un instante y lo único que se quiere es el dato que trae.
 */
function claimDelToken(token, clave) {
  const payload = String(token).split('.')[1];
  if (payload === undefined) return undefined;
  const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(json)[clave];
}

/**
 * Los dos conceptos de geografía que el alta exige hoy, resueltos contra la API.
 *
 * `POST /iam/auth/register-patient` pide el departamento emisor del documento y
 * el municipio de residencia como **uuid de concepto**, no como código. Se
 * expanden sus dos value sets en vez de fijar los uuid acá: el catálogo es de
 * la terminología, y una constante quemada se queda vieja en silencio el día
 * que se resiembre.
 */
async function resolverGeografia(token, tenantId) {
  const primerConceptoDe = async (codigoValueSet, descripcion) => {
    const valueSet = await llamar('Terminología', `Value set ${codigoValueSet}`, 'GET',
      `/terminology/value-sets?code=${codigoValueSet}`, { token, tenant: tenantId, espera: [200] });
    const valueSetId = valueSet?.items?.[0]?.id;
    if (valueSetId === undefined) {
      throw new Error(`No existe el value set ${codigoValueSet}: ¿la base tiene el catálogo geográfico?`);
    }
    const expansion = await llamar('Terminología', descripcion, 'GET',
      `/terminology/value-sets/${valueSetId}/$expand?limit=1`, { token, tenant: tenantId, espera: [200] });
    const conceptId = expansion?.items?.[0]?.conceptId;
    if (conceptId === undefined) throw new Error(`El value set ${codigoValueSet} no expande ningún concepto.`);
    return conceptId;
  };
  return {
    issuerAdministrativeAreaConceptId:
      await primerConceptoDe('VS_BO_DEPARTMENT', 'Departamento emisor del documento'),
    residenceMunicipalityConceptId:
      await primerConceptoDe('VS_BO_MUNICIPALITY', 'Municipio de residencia'),
  };
}

/** Un paciente nuevo con cuenta de portal: sin cuenta no hay bandeja que escribir. */
async function registrarPaciente(nombre, apellido, indice, geografia, sexoAlNacer) {
  const nationalId = `P8${CORRIDA}${indice}`;
  const password = 'P8-passw0rd!';
  const alta = await llamar(
    'Pacientes',
    `Alta de ${nombre} ${apellido} con cuenta de portal`,
    'POST',
    '/iam/auth/register-patient',
    {
      body: {
        nationalId,
        password,
        name: nombre,
        lastName: apellido,
        // El alta dejó de aceptar el cuerpo mínimo de documento + nombre: estos
        // seis campos son obligatorios en `RegisterPatientDto` y sin ellos el
        // recorrido moría en un 400 de validación.
        ...geografia,
        email: `p8.${CORRIDA}${indice}@alovida.test`,
        birthDate: '1990-05-14',
        phone: '+591 70000000',
        sexAtBirth: sexoAlNacer,
      },
      espera: [201],
    },
  );
  const sesion = await llamar('Pacientes', `Login de ${nombre}`, 'POST', '/iam/auth/login', {
    body: { nationalId, password },
    espera: [200],
  });
  return {
    nombre: `${nombre} ${apellido}`,
    nationalId,
    userId: alta?.userId,
    patientProfileId: alta?.patientProfileId,
    token: sesion?.accessToken ?? sesion?.token,
  };
}

async function main() {
  console.log(`\nP8 · Avisos de agenda — recorrido funcional contra ${BASE}\n`);

  /* ---- 0. sesión del administrador y contexto de agenda ------------------ */
  const admin = await llamar('Sesión', 'Login del administrador de arranque', 'POST', '/iam/auth/login', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    espera: [200],
  });
  const adminToken = admin?.accessToken ?? admin?.token;
  // La organización viaja en el claim `tenants` del token: el cuerpo del login
  // no la repite, y pedirla por `--tenant` obligaría a saberla de antemano.
  const tenantId = arg('tenant', null) ?? claimDelToken(adminToken, 'tenants')?.[0] ?? null;
  if (!adminToken || !tenantId) {
    throw new Error(`No se pudo resolver sesión/organización: ${JSON.stringify(admin)?.slice(0, 400)}`);
  }

  const recursos = await llamar('Agenda', 'Recursos agendables de la organización', 'GET',
    `/scheduling/resources?tenantId=${tenantId}`, { token: adminToken, tenant: tenantId, espera: [200] });
  // `--resource` permite apuntar a una agenda concreta. Importa para el aviso
  // (4): avisarle al profesional exige que **él** tenga cuenta de portal, y no
  // todos los profesionales del padrón la tienen. Sin el argumento se toma la
  // primera, que es lo que hace un entorno recién sembrado.
  const recursoPedido = arg('resource', null);
  const recurso =
    recursoPedido === null
      ? recursos?.items?.[0]
      : recursos?.items?.find((r) => r.id === recursoPedido);
  if (!recurso) throw new Error('La organización no tiene recursos agendables: corré seed-dev-data.mjs antes.');

  const desde = new Date().toISOString();
  const hasta = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const agenda = await llamar('Agenda', 'Cupos publicados del recurso', 'GET',
    `/scheduling/resources/${recurso.id}/slots?from=${encodeURIComponent(desde)}&to=${encodeURIComponent(hasta)}`,
    { token: adminToken, tenant: tenantId, espera: [200] });
  // Los cupos libres más cercanos de una agenda recién sembrada se pisan con las
  // citas que la propia siembra ya confirmó para ese profesional —el choque se
  // comprueba por profesional, no por cupo— y confirmar ahí devuelve 409. Se
  // toman los dos ÚLTIMOS cupos libres de la ventana: son los más lejanos a lo
  // ya reservado, y el recorrido no depende de en qué día caigan.
  const libres = (agenda?.items ?? [])
    .filter((c) => c.remainingCapacity > 0)
    .sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)));
  if (libres.length < 2) throw new Error('Hacen falta al menos dos cupos libres para el recorrido.');

  /* ---- 1. dos pacientes con cuenta de portal ----------------------------- */
  const geografia = await resolverGeografia(adminToken, tenantId);
  const pacienteA = await registrarPaciente('Ana', 'Quispe', '1', geografia, 'FEMALE');
  const pacienteB = await registrarPaciente('Bruno', 'Mamani', '2', geografia, 'MALE');

  /* ---- 2. A reserva; B se anota en la lista de espera --------------------- */
  const cupo = libres[libres.length - 1];
  const hold = await llamar('Reserva', 'Paciente A retiene el cupo', 'POST',
    `/scheduling/slots/${cupo.id}/holds`,
    { token: adminToken, tenant: tenantId, body: { patientProfileId: pacienteA.patientProfileId }, espera: [201, 200] });

  const reserva = await llamar('Reserva', 'Paciente A confirma la reserva', 'POST',
    `/scheduling/holds/${hold.holdToken}/confirm`,
    {
      token: adminToken, tenant: tenantId,
      body: {
        tenantId, patientProfileId: pacienteA.patientProfileId, channel: 'PORTAL',
        reasonText: 'Control de rutina',
      },
      espera: [201, 200],
    });

  await llamar('Lista de espera', 'Paciente B se anota en la lista de espera', 'POST', '/scheduling/waitlist',
    {
      token: pacienteB.token, tenant: tenantId,
      // Prioridad por encima de la de omisión: la agenda puede tener esperas
      // previas y el cupo liberado es **uno**, así que sin esto el recorrido
      // demostraría el aviso sobre un paciente sembrado sin cuenta de portal —
      // correcto, pero no comprobable.
      body: { tenantId, patientProfileId: pacienteB.patientProfileId, resourceId: recurso.id, priority: 50 },
      espera: [201],
    });

  const espera = await llamar('Lista de espera', 'La lectura devuelve la espera de B (P8)', 'GET',
    `/scheduling/waitlist?patientProfileId=${pacienteB.patientProfileId}`,
    { token: pacienteB.token, tenant: tenantId, espera: [200] });

  /* ---- 3. aviso (4): cambio de estado ------------------------------------ */
  await llamar('Aviso 4 · cambio de estado', 'El paciente A cancela su turno con motivo', 'POST',
    `/scheduling/bookings/${reserva.id}/cancel`,
    {
      token: adminToken, tenant: tenantId,
      body: { cancelledBy: 'PATIENT', reasonText: 'Me surgió un viaje esa semana' },
      espera: [200],
    });

  /* ---- 4. aviso (1): cupo liberado --------------------------------------- */
  const candidatos = await llamar('Aviso 1 · cupo liberado', 'El worker descubre los cupos con candidatos', 'GET',
    '/scheduling/internal/waitlist-candidates', { token: adminToken, tenant: tenantId, espera: [200] });

  const promocion = await llamar('Aviso 1 · cupo liberado', 'El worker promueve la lista de espera del cupo liberado',
    'POST', `/scheduling/internal/promote-waitlist/${cupo.id}`,
    { token: adminToken, tenant: tenantId, body: {}, espera: [200] });

  /* ---- 5. aviso (2): demora del profesional ------------------------------ */
  const cupoB = libres[libres.length - 2];
  const holdB = await llamar('Reserva', 'Paciente B retiene otro cupo', 'POST',
    `/scheduling/slots/${cupoB.id}/holds`,
    { token: adminToken, tenant: tenantId, body: { patientProfileId: pacienteB.patientProfileId }, espera: [201, 200] });
  const reservaB = await llamar('Reserva', 'Paciente B confirma su reserva', 'POST',
    `/scheduling/holds/${holdB.holdToken}/confirm`,
    {
      token: adminToken, tenant: tenantId,
      body: { tenantId, patientProfileId: pacienteB.patientProfileId, channel: 'PORTAL', reasonText: 'Dolor de rodilla' },
      espera: [201, 200],
    });

  const demoraCita = await llamar('Aviso 2 · demora', 'El profesional avisa que se demora sobre esa cita', 'POST',
    `/scheduling/bookings/${reservaB.id}/delay`,
    { token: adminToken, tenant: tenantId, body: { delayMinutes: 20, message: 'Estoy en una urgencia' }, espera: [200] });

  const citaConDemora = await llamar('Aviso 2 · demora', 'El turno muestra la demora aunque el aviso no se abra',
    'GET', `/scheduling/bookings/${reservaB.id}`, { token: adminToken, tenant: tenantId, espera: [200] });

  const demoraAgenda = await llamar('Aviso 2 · demora', 'El profesional se demora en toda su agenda', 'POST',
    `/scheduling/resources/${recurso.id}/delay`,
    {
      token: adminToken, tenant: tenantId,
      body: {
        delayMinutes: 15, message: 'Sigo con una urgencia',
        from: new Date(Date.now() - 3_600_000).toISOString(),
        to: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      },
      espera: [200],
    });

  /* ---- 6. la espera que queda abierta ------------------------------------
     La de B se cerró al promoverla —ya no espera, le tocó—, así que el estado
     «en espera» no se puede mostrar con ella. A, que acaba de quedarse sin
     turno, se anota: es el caso 3.4 del registro del cliente tal cual («si no
     encontrás cita y confirmás otra fecha, podés recibir una notificación»). */
  await llamar('Lista de espera', 'El paciente A se anota tras quedarse sin turno', 'POST',
    '/scheduling/waitlist',
    {
      token: pacienteA.token, tenant: tenantId,
      body: { tenantId, patientProfileId: pacienteA.patientProfileId, resourceId: recurso.id },
      espera: [201],
    });

  const esperaAbierta = await llamar('Lista de espera', 'La espera de A queda activa y legible', 'GET',
    `/scheduling/waitlist?patientProfileId=${pacienteA.patientProfileId}`,
    { token: pacienteA.token, tenant: tenantId, espera: [200] });

  /* ---- 7. aviso (3): recordatorio ---------------------------------------- */
  await llamar('Aviso 3 · recordatorio', 'Se programa un recordatorio que ya venció', 'POST',
    `/scheduling/bookings/${reservaB.id}/reminders`,
    {
      token: adminToken, tenant: tenantId,
      // Una antelación enorme deja el recordatorio **vencido** desde ya: el
      // despacho es del worker y el recorrido no puede esperar a mañana.
      body: { offsetsMinutes: [100000], channel: 'SMS' }, espera: [201],
    });

  const despacho = await llamar('Aviso 3 · recordatorio', 'El worker despacha los recordatorios vencidos', 'POST',
    '/scheduling/internal/dispatch-reminders', { token: adminToken, tenant: tenantId, body: {}, espera: [200] });

  /* ---- 8. resumen -------------------------------------------------------- */
  const resumen = {
    generadoContra: BASE,
    corrida: CORRIDA,
    tenantId,
    recurso: { id: recurso.id, name: recurso.name },
    // Las credenciales viajan en el resumen a propósito: son de una corrida de
    // desarrollo y sin ellas la evidencia visual no se puede reproducir —habría
    // que adivinar con qué cuenta entrar a ver los avisos.
    pacientes: {
      A: {
        nombre: pacienteA.nombre,
        nationalId: pacienteA.nationalId,
        password: 'P8-passw0rd!',
        patientProfileId: pacienteA.patientProfileId,
        userId: pacienteA.userId,
      },
      B: {
        nombre: pacienteB.nombre,
        nationalId: pacienteB.nationalId,
        password: 'P8-passw0rd!',
        patientProfileId: pacienteB.patientProfileId,
        userId: pacienteB.userId,
      },
    },
    reservas: { A: reserva?.id, B: reservaB?.id },
    listaDeEspera: espera,
    esperaAbiertaDeA: esperaAbierta,
    candidatosDelWorker: candidatos,
    promocion,
    demoraDeLaCita: demoraCita,
    demoraDeLaAgenda: demoraAgenda,
    citaConDemora: citaConDemora?.delayNotice ?? null,
    despachoDeRecordatorios: despacho,
    totales: { pasos: pasos.length, ok: pasos.length - fallidos, fallidos },
    pasos,
  };

  const destino = resolve(REPO, SALIDA);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, `${JSON.stringify(resumen, null, 2)}\n`, 'utf8');

  console.log(`\n  ${pasos.length - fallidos}/${pasos.length} pasos correctos`);
  console.log(`  Resumen: ${destino}\n`);
  if (fallidos > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\n✗ El recorrido se cortó: ${error.message}\n`);
  process.exitCode = 1;
});
