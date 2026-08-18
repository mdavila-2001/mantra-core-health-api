/**
 * Alta de la cuenta de prueba del médico y verificación del ciclo de la receta
 * **con esa cuenta**, no con el administrador.
 *
 * Importa que sea con la cuenta del doctor: los endpoints clínicos exigen
 * `CLINICIAN`/`PRACTITIONER`, `custodianTenantId` sale de la sesión, y el
 * `hpid` del token es el perfil profesional que firma. Verificarlo con un
 * SUPERADMIN comprueba el contrato pero no el recorrido.
 *
 * No usa el registro público (en 500) sino el alta asistida, que además es el
 * camino real: un administrador incorpora al profesional y le entrega un token
 * de activación de un solo uso.
 */

// Correos reales: sembrar contra `@redesa.test` permitía comprobar que el
// worker marca la entrega, y no que el correo llega. Ver `correos-reales.mjs`.
import { CORREOS } from './correos-reales.mjs';

const BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
const ADMIN = process.env.BOOTSTRAP_ADMIN_EMAIL ?? CORREOS.admin;
const ADMIN_PASS = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';

/** Credenciales fijas de la cuenta de prueba, para que el equipo las use. */
const DOCTOR_EMAIL = process.env.DOCTOR_EMAIL ?? CORREOS.doctor;
const DOCTOR_PASS = process.env.DOCTOR_PASSWORD ?? 'D3mo-passw0rd!';

let ok = 0;
let fail = 0;

async function call(nombre, method, path, { body, token, expect = [200, 201] } = {}) {
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
  const bien = expect.includes(res.status);
  bien ? ok++ : fail++;
  console.log(`${bien ? '  ok  ' : ' FALLA'} ${res.status} ${method} ${path} — ${nombre}`);
  if (!bien) console.log('        ', JSON.stringify(parsed)?.slice(0, 300));
  return { status: res.status, body: parsed, ok: bien };
}

const claims = (t) => JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString('utf8'));
const sinAusentes = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

console.log('=== 1 · sesión del administrador =================================');
const admin = await call('login admin', 'POST', '/iam/auth/login', {
  body: { email: ADMIN, password: ADMIN_PASS },
});
const adminToken = admin.body.accessToken;
const tenantId = claims(adminToken).tenants[0];
console.log(`        tenant: ${tenantId}`);

console.log('\n=== 2 · alta asistida de la doctora ==============================');
const sufijo = Date.now().toString(36);
let alta = await call(
  'alta asistida (SECURITY_ADMIN)',
  'POST',
  '/iam/users/assisted-practitioner-registration',
  {
    token: adminToken,
    body: {
      email: DOCTOR_EMAIL,
      displayName: 'Dra. Valeria Fuentes Aramayo',
      licenseNumber: `LIC-DEMO-${sufijo}`,
      credentialNumber: `CRED-DEMO-${sufijo}`,
      professionalTitle: 'Medicina general',
      reason: 'Cuenta de prueba del recorrido del médico (demo del viernes)',
      clinicalRoles: ['CLINICIAN', 'PRACTITIONER'],
    },
    expect: [201, 409],
  },
);

let doctorToken = null;
let practitionerProfileId = null;

if (alta.status === 409) {
  console.log('        la cuenta ya existía: se reutiliza');
  const login = await call('login doctora', 'POST', '/iam/auth/login', {
    body: { email: DOCTOR_EMAIL, password: DOCTOR_PASS },
  });
  doctorToken = login.body?.accessToken ?? null;
} else {
  practitionerProfileId = alta.body.practitionerProfileId;
  console.log(`        userId: ${alta.body.userId}`);
  console.log(`        practitionerProfileId: ${practitionerProfileId}`);

  console.log('\n=== 3 · activación: la contraseña la elige la titular ============');
  await call('activar cuenta', 'POST', '/iam/auth/activate', {
    body: { activationToken: alta.body.activationToken, newPassword: DOCTOR_PASS },
  });

  // La membresía NO hace falta pedirla aparte: el alta asistida la concede en
  // la misma transacción, y el token de la doctora ya sale con su tenant. Se
  // comprueba abajo leyendo los claims, que es donde importa —sin tenant activo
  // la pantalla dice «sin organización» y no se puede escribir nada, porque
  // `custodianTenantId` sale de `auth.activeTenantId()`.

  console.log('\n=== 4 · sesión de la doctora =====================================');
  const login = await call('login doctora', 'POST', '/iam/auth/login', {
    body: { email: DOCTOR_EMAIL, password: DOCTOR_PASS },
  });
  doctorToken = login.body?.accessToken ?? null;
}

if (!doctorToken) {
  console.log('\nNo se pudo abrir sesión como la doctora. Se corta acá.');
  process.exit(1);
}

const c = claims(doctorToken);
console.log(`        roles:   ${JSON.stringify(c.roles)}`);
console.log(`        tenants: ${JSON.stringify(c.tenants)}`);
console.log(`        hpid:    ${c.hpid ?? '(ausente)'}`);
if (!c.tenants?.length) {
  console.log('        ⚠️  sin tenant activo: la pantalla diría «sin organización»');
  fail++;
}
practitionerProfileId = c.hpid ?? practitionerProfileId;
const tenantDeLaDoctora = c.tenants?.[0] ?? tenantId;

console.log('\n=== 6 · el recorrido, con la cuenta de la doctora ================');
const pacientes = await call('leer pacientes', 'GET', '/profiles/patients?limit=1', {
  token: doctorToken,
  expect: [200, 403],
});
// El padrón pide SECURITY_ADMIN: si responde 403 se toma un paciente por el
// administrador. La ficha clínica no depende de esa lectura (es cosmética).
const patientProfileId =
  pacientes.status === 200
    ? pacientes.body.items[0].profileId
    : (
        await call('leer pacientes (admin)', 'GET', '/profiles/patients?limit=1', {
          token: adminToken,
        })
      ).body.items[0].profileId;
console.log(`        paciente: ${patientProfileId}`);

const encuentro = await call('check-in del encuentro', 'POST', '/clinical/encounters/check-in', {
  token: doctorToken,
  body: sinAusentes({
    patientProfileId,
    tenantId: tenantDeLaDoctora,
    reasonText: 'Control por tos y fiebre',
    primaryPractitionerId: practitionerProfileId ?? undefined,
  }),
});
const encounterId = encuentro.body?.id;

// El selector: las opciones salen del binding, no de una lista escrita a mano.
const catalogo = await call(
  'catálogo del medicamento (binding)',
  'GET',
  '/system-context/dynamic-enums?target=clinical.medication_requests.medication_concept_id',
  { token: doctorToken },
);
const via = await call(
  'catálogo de la vía',
  'GET',
  '/system-context/dynamic-enums?target=clinical.medication_requests.route_concept_id',
  { token: doctorToken },
);
const unidad = await call(
  'catálogo de la unidad',
  'GET',
  '/system-context/dynamic-enums?target=clinical.medication_requests.unit_concept_id',
  { token: doctorToken },
);
const amoxi =
  catalogo.body?.options?.find((o) => o.display === 'Amoxicilina') ??
  catalogo.body?.options?.[0];
const oral = via.body?.options?.find((o) => o.code === 'ROUTE_ORAL') ?? via.body?.options?.[0];
const mg = unidad.body?.options?.find((o) => o.code === 'UNIT_mg') ?? unidad.body?.options?.[0];
console.log(`        elige del catálogo: ${amoxi?.display} · ${oral?.display} · ${mg?.display}`);

console.log('\n--- receta 1: el camino feliz (crear → firmar → emitir) -----------');
const receta = await call('prescribir', 'POST', '/clinical/medication-requests', {
  token: doctorToken,
  body: sinAusentes({
    custodianTenantId: tenantDeLaDoctora,
    patientProfileId,
    medicationConceptId: amoxi.conceptId,
    encounterId,
    doseText: '500 mg',
    frequencyText: 'cada 8 horas',
    quantityDecimal: 21,
    routeConceptId: oral?.conceptId,
    unitConceptId: mg?.conceptId,
  }),
});
await call('firmar', 'POST', `/clinical/medication-requests/${receta.body.id}/sign`, {
  token: doctorToken,
  body: {},
  expect: [200],
});
await call('emitir', 'POST', `/clinical/medication-requests/${receta.body.id}/issue`, {
  token: doctorToken,
  body: {},
  expect: [200],
});

console.log('\n--- receta 2: emitir SIN firmar (el 422 que la pantalla explica) --');
const borrador = await call('prescribir un borrador', 'POST', '/clinical/medication-requests', {
  token: doctorToken,
  body: sinAusentes({
    custodianTenantId: tenantDeLaDoctora,
    patientProfileId,
    medicationConceptId: amoxi.conceptId,
    encounterId,
  }),
});
const rechazo = await call(
  'emitir sin firmar',
  'POST',
  `/clinical/medication-requests/${borrador.body.id}/issue`,
  { token: doctorToken, body: {}, expect: [422] },
);
console.log(`        code: ${rechazo.body?.code} · ${rechazo.body?.message}`);
if (rechazo.body?.code !== 'PRECONDITION_FAILED') {
  console.log('        ⚠️  el código no es PRECONDITION_FAILED');
  fail++;
}
// Y la salida que ofrece la pantalla: firmar y reintentar.
await call('firmar y reintentar', 'POST', `/clinical/medication-requests/${borrador.body.id}/sign`, {
  token: doctorToken,
  body: {},
  expect: [200],
});
await call('emitir ahora sí', 'POST', `/clinical/medication-requests/${borrador.body.id}/issue`, {
  token: doctorToken,
  body: {},
  expect: [200],
});

console.log('\n--- la ficha vuelve a leer y las muestra ---------------------------');
const resumen = await call(
  'releer el expediente',
  'GET',
  `/clinical/patients/${patientProfileId}/summary?limit=50`,
  { token: doctorToken },
);
const recetas = resumen.body?.medicationRequests ?? [];
const emitidas = recetas.filter((r) => r.issuedAt).length;
const firmadas = recetas.filter((r) => r.signedAt).length;
console.log(`        ${recetas.length} recetas · ${firmadas} firmadas · ${emitidas} emitidas`);
if (emitidas < 2) {
  console.log('        ⚠️  las recetas emitidas no aparecen en la relectura');
  fail++;
}

if (encounterId) {
  await call('cerrar el encuentro', 'POST', `/clinical/encounters/${encounterId}/close`, {
    token: doctorToken,
    body: {},
  });
}

console.log(`\n== ${ok} conformes · ${fail} fallidas ==`);
console.log(`\nCuenta de prueba lista:  ${DOCTOR_EMAIL} / ${DOCTOR_PASS}`);
process.exit(fail === 0 ? 0 : 1);
