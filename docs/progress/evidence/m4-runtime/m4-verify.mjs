// Verificación de runtime de M4 (B10, B12, B13) contra la API de `origin/test` levantada en local,
// sobre una base AISLADA (proyecto docker `m4verify`, Postgres :5439, Redis :6390). Nada toca Neon
// ni el VPS. Cada escritura se confirma con un SELECT en la base.
import { execFileSync } from 'node:child_process';

const API = 'http://localhost:3099';
const TENANT_ID = '1befcfea-44c0-563a-81cd-337ec6acc840'; // tenant de la práctica sembrada
const out = [];
const log = (...a) => { const l = a.join(' '); out.push(l); console.log(l); };
let fallas = 0;
const check = (ok, nombre, detalle = '') => { if (!ok) fallas++; log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}${detalle ? '  — ' + detalle : ''}`); };

function sql(q) {
  return execFileSync('docker', ['exec', 'm4verify-postgres-1', 'psql', '-U', 'm4verify', '-d', 'alovida_m4', '-tAF|', '-c', q],
    { encoding: 'utf8', env: { ...process.env, MSYS_NO_PATHCONV: '1' } }).trim();
}
async function http(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}`, 'x-tenant-id': TENANT_ID } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null; const text = await res.text();
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}
async function login(email, password) {
  const r = await http('POST', '/iam/auth/login', { body: { email, password } });
  if (r.status >= 300) throw new Error(`login ${email}: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  return r.body.accessToken;
}

const admin = await login('admin@alovida.test', '12345678');
// Médico de verificación, creado por la API (el seeder de dev no llega: no manda nationalId, que hoy es obligatorio).
const DOC_EMAIL = 'medica.m4@alovida.test';
let doctor;
try { doctor = await login(DOC_EMAIL, '12345678'); } catch {
  const alta = await http('POST', '/iam/users/assisted-practitioner-registration', { token: admin, body: {
    email: DOC_EMAIL, displayName: 'Lucía Verificación M4', nationalId: '9876543', issuerAdministrativeAreaConceptId: 'e783b585-feb6-5b66-9123-c2e92b5489c7', licenseNumber: 'LIC-M4-001', credentialNumber: 'CRED-M4-001',
    professionalTitle: 'Médica cirujana', reason: 'Cuenta sintética para la verificación de runtime de M4', clinicalRoles: ['CLINICIAN', 'PRACTITIONER'] } });
  if (alta.status !== 201) throw new Error('alta médico: ' + alta.status + ' ' + JSON.stringify(alta.body).slice(0, 400));
  const act = await http('POST', '/iam/auth/activate', { body: { activationToken: alta.body.activationToken, newPassword: '12345678' } });
  if (act.status >= 300) throw new Error('activar: ' + act.status + ' ' + JSON.stringify(act.body).slice(0, 300));
  const asig = await http('POST', '/practices/245cb573-7b14-4637-8da7-b7b54872d15e/role-assignments', { token: admin, body: { practitionerProfileId: alta.body.practitionerProfileId } });
  log('   alta médica sintética', alta.status, '· activación', act.status, '· vínculo a la práctica', asig.status, JSON.stringify(asig.body).slice(0, 160));
  doctor = await login(DOC_EMAIL, '12345678');
}
log('# sesiones: admin y médica sintética logueadas');

// ─────────────────────────────── B12 · fichas públicas ───────────────────────────────
log('\n## B12 · fichas públicas (sin token)');
const slugFarm = 'farmacia-farmacia-sopocachi';
let items = [], cursor = null, paginas = 0;
do {
  const q = `/public/profiles/f/${slugFarm}/products?limit=3${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
  const r = await http('GET', q);
  if (r.status !== 200) { check(false, `GET ${q}`, `status ${r.status}`); break; }
  items.push(...r.body.items); cursor = r.body.nextCursor; paginas++;
  if (paginas === 1) log('   primera página:', JSON.stringify(r.body).slice(0, 420));
} while (cursor && paginas < 50);
const enBase = Number(sql(`select count(*) from pharmacy.pharmacy_products prod join pharmacy.pharmacies ph on ph.id=prod.pharmacy_id join community.public_profiles pp on pp.tenant_id=ph.tenant_id join terminology.catalog_concepts c on c.id=prod.status_concept_id where pp.slug='${slugFarm}' and c.code like '%PRODUCT_ACTIVE'`));
check(items.length === enBase && items.length > 0, 'products: recorrer todas las páginas trae exactamente los productos activos de la farmacia', `${items.length} por API en ${paginas} páginas · ${enBase} en la base`);
check(new Set(items.map((i) => i.id)).size === items.length, 'products: el cursor no repite filas');
check(items.every((i) => i.price === null || /^\d+(\.\d+)?$/.test(i.price)), 'products: precio como texto numérico o null');
check(items.every((i) => typeof i.inStock === 'boolean' && 'therapeuticGroup' in i), 'products: inStock booleano y therapeuticGroup presente');
check(!JSON.stringify(items).match(/tenantId|practiceId|incomeAccount|taxCode/), 'products: sin campos internos');

const a = await http('GET', `/public/profiles/o/${slugFarm}/services`);
const b = await http('GET', `/public/profiles/o/no-existe-m4/services`);
check(a.status === 404 && b.status === 404 && a.body.code === b.body.code && a.body.message === b.body.message,
  'services: slug de farmacia pedido como organización = mismo 404 que un slug inexistente', `${a.status}/${b.status} ${a.body.code}`);
for (const q of [`/public/profiles/f/${slugFarm}/products?limit=0`, `/public/profiles/f/${slugFarm}/products?city=La%20Paz`, `/public/profiles/f/${slugFarm}/products?cursor=basura`]) {
  const r = await http('GET', q); check(r.status === 400, `400 en ${q.split('?')[1]}`, `status ${r.status}`);
}

// Ficha de organización: fixture declarado (perfil público del tenant por defecto, que tiene la práctica)
const practiceId = '245cb573-7b14-4637-8da7-b7b54872d15e';
const tenant = sql(`select tenant_id from practice.practices where id='${practiceId}'`);
const slugOrg = 'clinica-m4-verificacion';
const estadoActivo = sql(`select status_concept_id from community.public_profiles limit 1`);
sql(`insert into community.public_profiles (id, tenant_id, target_type_concept_id, target_id, slug, display_name, visibility_concept_id, status_concept_id, created_at, updated_at)
     values (gen_random_uuid(), '${tenant}', 'edab30f0-f274-50e6-bc62-b77247930126', '${tenant}', '${slugOrg}', 'Clínica M4 (fixture de verificación)', '0006f171-fd25-503d-906e-b77423a5f1d0', '${estadoActivo}', now(), now())
     on conflict do nothing`);
log(`   fixture: perfil público de organización '${slugOrg}' para el tenant ${tenant.slice(0, 8)}… (SQL, declarado)`);
const alta = await http('POST', '/billing/service-catalog', { token: admin, body: { practiceId, code: 'M4-ECO', name: 'Ecografía abdominal (M4)', descriptionText: 'Incluye informe', defaultPrice: '150.50', currencyConceptId: 'd2fe4f04-ea13-510a-9a10-dfee2302a98f' } });
check([201, 409].includes(alta.status), 'alta por API de un servicio con precio (admin)', `status ${alta.status}`);
const sv = await http('GET', `/public/profiles/o/${slugOrg}/services?limit=50`);
log('   respuesta:', JSON.stringify(sv.body).slice(0, 500));
const eco = sv.body.items?.find((i) => i.code === 'M4-ECO');
const cita = sv.body.items?.find((i) => i.code === 'CITA_MEDICA');
check(sv.status === 200 && eco?.price === '150.50' && eco?.currency === 'BOB', 'services: el servicio con precio viaja con price "150.50" y BOB');
check(cita && cita.price === null && cita.currency === null, 'services: el servicio sembrado en 0.00 viaja con price null (Q-05)');

// ─────────────────────────────── B13 · cotizaciones ───────────────────────────────
log('\n## B13 · cotizaciones (médico)');
const serviceCatalogId = sql(`select id from billing.service_catalog where practice_id='${practiceId}' and code='M4-ECO'`);
const paciente = sql(`select profile_id from profiles.patient_profiles limit 1`);
const hoy = new Date(); const iso = (d) => d.toISOString().slice(0, 10); const mas = (n) => { const d = new Date(hoy); d.setDate(d.getDate() + n); return iso(d); };
const bodyFront = {
  practiceId, patientProfileId: paciente, attentionDate: mas(1), serviceCatalogId,
  offeredPrice: 1500, paymentPlanInstallmentCount: 3, downPaymentAmount: 300, paymentFrequency: 'MONTHLY',
  installments: [1, 2, 3].map((n) => ({ installmentNumber: n, dueDate: mas(30 * n), amount: 400 })),
  validUntil: mas(20),
};
const q1 = await http('POST', '/quotations', { token: doctor, body: bodyFront });
log('   POST /quotations (importes number, como el front) →', q1.status, JSON.stringify(q1.body).slice(0, 300));
check(q1.status === 201, 'POST /quotations con el body del front (importes number) → 201', `status ${q1.status}`);
if (q1.status === 201) {
  const fila = sql(`select offered_price, down_payment_amount, payment_plan_installment_count from billing.quotations where id='${q1.body.id}'`);
  const cuotas = sql(`select string_agg(amount::text, ',' order by installment_number) from billing.quotation_installments where quotation_id='${q1.body.id}'`);
  log(`   SELECT billing.quotations → ${fila} · cuotas → ${cuotas}`);
  check(fila === '1500|300|3' && cuotas === '400,400,400', 'persistido: 1500 / 300 / 3 cuotas de 400');
}
const q2 = await http('POST', '/quotations', { token: doctor, body: { ...bodyFront, offeredPrice: 1.005, downPaymentAmount: 0, paymentPlanInstallmentCount: 1, installments: [{ installmentNumber: 1, dueDate: mas(30), amount: 1.005 }] } });
check(q2.status === 400, 'offeredPrice 1.005 → 400 (no se redondea en silencio)', `status ${q2.status}`);
const q3 = await http('POST', '/quotations', { token: doctor, body: { ...bodyFront, attentionDate: mas(2) } });
const lista = await http('GET', `/quotations?patientProfileId=${paciente}`, { token: doctor });
check(lista.status === 200 && lista.body.length >= 2 && lista.body.every((q) => Array.isArray(q.installments) && q.installments.length === q.paymentPlanInstallmentCount),
  'GET /quotations?patientProfileId → cada cotización con SUS cuotas (lectura en lote)', `status ${lista.status}, ${Array.isArray(lista.body) ? lista.body.length : '?'} cotizaciones`);

// ─────────────────────────────── B10 · agenda ───────────────────────────────
log('\n## B10 · agenda');
// Choque del paciente: 9330739b tiene una cita CONFIRMADA con Quispe el 28/09 17:00-17:30 (recurso 229b…);
// se intenta mover su cita del 29/09 (9f9ccb2c, recurso 229b…) a un cupo LIBRE de Fernández el 28/09 17:00.
const bookingB = '9f9ccb2c-b273-4879-8d74-584d66aeaa9a';
const antes = sql(`select bookable_slot_id, resource_id from scheduling.appointment_bookings where id='${bookingB}'`);
const r1 = await http('POST', `/scheduling/bookings/${bookingB}/reschedule`, { token: admin, body: { toSlotId: '58b61f40-2bf2-4cb2-b1d6-d69098e2389b', reasonText: 'Verificación M4: choque con otro turno del paciente' } });
log('   reschedule a un cupo que se pisa con otro turno confirmado del paciente →', r1.status, JSON.stringify(r1.body).slice(0, 260));
const despues1 = sql(`select bookable_slot_id, resource_id from scheduling.appointment_bookings where id='${bookingB}'`);
check(r1.status === 422 && antes === despues1, 'reprogramar encima de otro turno del paciente (en otro recurso) → 422 y la cita no se mueve', `status ${r1.status}`);

const r2 = await http('POST', `/scheduling/bookings/${bookingB}/reschedule`, { token: admin, body: { toSlotId: 'bf8e4bfa-2ad6-433a-aebb-09c76ba1834d', reasonText: 'Verificación M4: horario libre en otro consultorio' } });
const despues2 = sql(`select b.bookable_slot_id, b.resource_id, s.resource_id from scheduling.appointment_bookings b join scheduling.bookable_slots s on s.id=b.bookable_slot_id where b.id='${bookingB}'`);
const rs = sql(`select count(*) from scheduling.booking_reschedules where booking_id='${bookingB}'`);
log(`   reschedule a un cupo libre → ${r2.status} · SELECT (slot|resource_id de la cita|resource_id del cupo) → ${despues2} · booking_reschedules=${rs}`);
const [, resCita, resCupo] = despues2.split('|');
check(r2.status === 200 && resCita === resCupo && resCupo === '8b364a77-456b-4ccc-af97-b37498f647cd', 'reprogramar a un cupo libre → 200 y la cita queda en el recurso del cupo nuevo');

// Regla madre con resource_id nulo (JOIN por el cupo): se vacía resource_id de esa cita (fixture de dato
// legado) y se pide una cita directa para Fernández que se pisa con ella.
sql(`update scheduling.appointment_bookings set resource_id = null where id='${bookingB}'`);
const inicio = sql(`select to_char(start_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') from scheduling.bookable_slots where id='bf8e4bfa-2ad6-433a-aebb-09c76ba1834d'`);
const otroPaciente = sql(`select profile_id from profiles.patient_profiles where profile_id <> '9330739b-3832-4fae-9382-123bca1e2f1d' limit 1`);
const d1 = await http('POST', '/scheduling/appointments/direct', { token: admin, body: { patientProfileId: otroPaciente, resourceId: '8b364a77-456b-4ccc-af97-b37498f647cd', startAt: inicio, durationMinutes: 30, reasonText: 'Verificación M4' } });
log('   cita directa encima de una cita con resource_id NULL →', d1.status, JSON.stringify(d1.body).slice(0, 260));
check(d1.status === 422, 'la regla madre ve la cita aunque su resource_id sea NULL (une por el cupo) → 422', `status ${d1.status}`);
sql(`update scheduling.appointment_bookings set resource_id = '8b364a77-456b-4ccc-af97-b37498f647cd' where id='${bookingB}'`);

// close-slots con un id uuid5: antes 400 por validación; ahora pasa la validación (404/422 del servicio si no existe).
const c1 = await http('POST', '/scheduling/resources/8b364a77-456b-4ccc-af97-b37498f647cd/close-slots', { token: admin, body: { exceptionType: 'ABSENCE', slotIds: ['2b1f8a3c-4d5e-5f60-8a7b-9c0d1e2f3a4b'] } });
const esValidacion = c1.status === 400 && JSON.stringify(c1.body).includes('must be a UUID');
check(!esValidacion, 'close-slots con un id uuid5 ya no se rechaza por validación', `status ${c1.status} ${JSON.stringify(c1.body).slice(0, 160)}`);

// Retiro con citas vivas: la plantilla de Quispe (229b…) tiene citas confirmadas.
const tpl = sql(`select id from scheduling.schedule_templates where resource_id='229bf19a-8401-4158-a688-e3ed0b5245f5' limit 1`);
const vivasAntes = sql(`select count(*) from scheduling.appointment_bookings b join scheduling.bookable_slots s on s.id=b.bookable_slot_id join terminology.catalog_concepts c on c.id=b.status_concept_id where s.schedule_template_id='${tpl}' and c.code in ('BOOKING_CONFIRMED','BOOKING_CHECKED_IN')`);
const del = await http('DELETE', `/scheduling/templates/${tpl}`, { token: admin });
log('   DELETE /scheduling/templates/:id →', del.status, JSON.stringify(del.body).slice(0, 360));
const vivasDespues = sql(`select count(*) from scheduling.appointment_bookings b join scheduling.bookable_slots s on s.id=b.bookable_slot_id join terminology.catalog_concepts c on c.id=b.status_concept_id where s.schedule_template_id='${tpl}' and c.code in ('BOOKING_CONFIRMED','BOOKING_CHECKED_IN')`);
const estadoTpl = sql(`select c.code from scheduling.schedule_templates t join terminology.catalog_concepts c on c.id=t.status_concept_id where t.id='${tpl}'`);
check(del.status === 200 && del.body.liveBookings === Number(vivasAntes) && del.body.keptSlots >= 1 && vivasAntes === vivasDespues && /RETIRED/.test(estadoTpl),
  'retirar un horario con citas vivas → 200, las informa, conserva sus cupos y no toca ninguna cita', `vivas antes=${vivasAntes} después=${vivasDespues} · plantilla=${estadoTpl}`);

log(`\nRESULTADO: ${fallas === 0 ? 'TODO PASS' : fallas + ' FALLA(S)'}`);
process.exitCode = fallas === 0 ? 0 : 1;
