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
log('## B10 · retiro con citas vivas (build con el arreglo de booking_reschedules)');
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
