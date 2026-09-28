// Recorrido H2 contra la API viva (node dist/src/main.js) y un Postgres efímero.
// Uso: BASE=http://localhost:3301 PSQL="docker exec legion-h2-pg psql -U legion -d legion_h2 -tAc" node h2-runtime.mjs
// Los datos son sintéticos. Cada línea imprime PASS/FAIL con el estado HTTP real.
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = new URL('../../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const { boDepartmentConceptId } = require(`${root}dist/src/common/seed/bo-geography.catalog.js`);
const { PROF } = require(`${root}dist/src/modules/profiles/profiles.concepts.js`);

const BASE = process.env.BASE ?? 'http://localhost:3301';
const psql = (sql) =>
  execSync(`docker exec legion-h2-pg psql -U legion -d legion_h2 -tAc "${sql.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
  }).trim();
const mark = Math.random().toString(16).slice(2, 8);
let fails = 0;
const check = (name, ok, detail = '') => {
  if (!ok) fails += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`);
};
const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
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
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
};

const specialties = psql(
  "select m.concept_id from terminology.value_set_members m join terminology.value_set_versions v on v.id=m.value_set_version_id join terminology.value_sets s on s.id=v.value_set_id where s.internal_code='VS_MEDICAL_SPECIALTY' and m.included limit 6",
).split('\n');
const facilities = psql(
  "select m.concept_id from terminology.value_set_members m join terminology.value_set_versions v on v.id=m.value_set_version_id join terminology.value_sets s on s.id=v.value_set_id where s.internal_code='VS_BO_HEALTH_FACILITY' and m.included limit 2",
).split('\n');

async function register(suffix, extra = {}) {
  const email = `h2-${mark}-${suffix}@example.test`;
  const r = await call('POST', '/iam/auth/register-practitioner', {
    body: {
      email,
      password: 'S3cret-passw0rd',
      name: 'Cuenta',
      lastName: `Sintetica ${suffix}`,
      licenseNumber: `LIC-${mark}-${suffix}`,
      nationalId: `H2${mark}${suffix}`,
      issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC'),
      specialtyConceptIds: specialties.slice(0, 2),
      ...extra,
    },
  });
  const login = await call('POST', '/iam/auth/login', { body: { email, password: 'S3cret-passw0rd' } });
  return { email, reg: r, token: login.body.accessToken };
}

// --- ID-12: sin correo institucional -------------------------------------------------
const a = await register('a', { personalEmail: `h2-${mark}-a@example.test` });
check('alta con personalEmail===email responde 201', a.reg.status === 201, `status=${a.reg.status}`);
const emailRows = psql(
  `select count(*) filter (where cp.use_concept_id is not null) || '|' || string_agg(cp.value, ',') from common.contact_points cp join profiles.person_account_links l on l.person_id = cp.owner_id where l.user_id = '${a.reg.body.userId}' and cp.value like '%@example.test'`,
);
check('un solo contacto de correo (HOME), sin WORK inventado', emailRows.startsWith('1|'), `filas=${emailRows}`);

// --- summary: licencias y especialidades -----------------------------------------------
const sum = await call('GET', '/profiles/practitioners/me/summary', { token: a.token });
check('summary 200', sum.status === 200, `status=${sum.status}`);
const lic = sum.body.licenses?.[0];
const [spec1, spec2] = sum.body.specialties ?? [];
check('matrícula pendiente en el summary', lic?.stateConceptId === PROF.AUTH_PENDING);

// --- ID-08: matrícula ------------------------------------------------------------------
const before = psql(`select license_number, row_version from profiles.jurisdiction_authorizations where id='${lic.id}'`);
let r = await call('PATCH', `/profiles/practitioners/me/jurisdiction-authorizations/${lic.id}`, { token: a.token, body: { licenseNumber: 'MP-9' } });
check('PATCH matrícula pendiente = 204', r.status === 204, `status=${r.status}`);
const after = psql(`select license_number, row_version from profiles.jurisdiction_authorizations where id='${lic.id}'`);
console.log(`     SELECT antes=${before} despues=${after}`);
const sum2 = await call('GET', '/profiles/practitioners/me/summary', { token: a.token });
check('la relectura muestra MP-9', sum2.body.licenses?.[0]?.licenseNumber === 'MP-9');
r = await call('PATCH', `/profiles/practitioners/me/jurisdiction-authorizations/${lic.id}`, { token: a.token, body: { stateConceptId: PROF.AUTH_ACTIVE } });
check('clave extra (stateConceptId) = 400', r.status === 400, `status=${r.status}`);
const b = await register('b');
r = await call('PATCH', `/profiles/practitioners/me/jurisdiction-authorizations/${lic.id}`, { token: b.token, body: { licenseNumber: 'AJENA' } });
check('matrícula ajena = 404', r.status === 404, `status=${r.status}`);
r = await call('DELETE', `/profiles/practitioners/me/jurisdiction-authorizations/${lic.id}`, { token: b.token });
check('DELETE de matrícula ajena = 404', r.status === 404, `status=${r.status}`);
psql(`update profiles.jurisdiction_authorizations set state_concept_id='${PROF.AUTH_ACTIVE}' where id='${lic.id}'`);
r = await call('PATCH', `/profiles/practitioners/me/jurisdiction-authorizations/${lic.id}`, { token: a.token, body: { licenseNumber: 'X' } });
check('matrícula activa = 422', r.status === 422, `status=${r.status}`);
r = await call('DELETE', `/profiles/practitioners/me/jurisdiction-authorizations/${lic.id}`, { token: a.token });
check('DELETE matrícula activa = 422', r.status === 422, `status=${r.status}`);
psql(`update profiles.jurisdiction_authorizations set state_concept_id='${PROF.AUTH_PENDING}' where id='${lic.id}'`);
psql(`insert into audit.jurisdiction_authorizations_history (history_id, jurisdiction_authorization_id, revision_no, operation_concept_id, valid_from, data_snapshot, recorded_at) select gen_random_uuid(), '${lic.id}', 1, id, now(), '{}'::jsonb, now() from terminology.catalog_concepts limit 1`);
r = await call('DELETE', `/profiles/practitioners/me/jurisdiction-authorizations/${lic.id}`, { token: a.token });
check('matrícula con historial de auditoría = 422 (sin 23503)', r.status === 422, `status=${r.status}`);
psql(`delete from audit.jurisdiction_authorizations_history where jurisdiction_authorization_id='${lic.id}'`);
r = await call('DELETE', `/profiles/practitioners/me/jurisdiction-authorizations/${lic.id}`, { token: a.token });
check('DELETE matrícula pendiente = 204', r.status === 204, `status=${r.status}`);
check('la fila ya no existe', psql(`select count(*) from profiles.jurisdiction_authorizations where id='${lic.id}'`) === '0');

// --- ID-07: especialidad ---------------------------------------------------------------
r = await call('PATCH', `/profiles/practitioners/me/specialties/${spec2.id}`, { token: a.token, body: { isPrimary: true } });
check('PATCH con isPrimary = 400', r.status === 400, `status=${r.status}`);
r = await call('PATCH', `/profiles/practitioners/me/specialties/${spec2.id}`, { token: a.token, body: { specialtyConceptId: specialties[3], boardCertified: true } });
check('PATCH especialidad pendiente = 204', r.status === 204, `status=${r.status}`);
console.log('     SELECT:', psql(`select specialty_concept_id = '${specialties[3]}', board_certified from profiles.practitioner_specialties where id='${spec2.id}'`));
r = await call('PATCH', `/profiles/practitioners/me/specialties/${spec2.id}`, { token: a.token, body: { specialtyConceptId: specialties[0] } });
check('cambiar a una ya vigente = 409', r.status === 409, `status=${r.status}`);
r = await call('PATCH', `/profiles/practitioners/me/specialties/${spec2.id}`, { token: a.token, body: { specialtyConceptId: boDepartmentConceptId('LP') } });
check('un concepto que no es especialidad = 422', r.status === 422, `status=${r.status}`);
r = await call('PATCH', `/profiles/practitioners/me/specialties/${spec2.id}`, { token: b.token, body: { boardCertified: false } });
check('especialidad ajena = 404', r.status === 404, `status=${r.status}`);
r = await call('DELETE', `/profiles/practitioners/me/specialties/${spec1.id}`, { token: a.token });
check('DELETE de la principal = 204', r.status === 204, `status=${r.status}`);
const sum3 = await call('GET', '/profiles/practitioners/me/summary', { token: a.token });
check('queda sin principal (no promueve otra)', !sum3.body.specialties.some((s) => s.isPrimary) && sum3.body.specialties.length === 1);
psql(`update profiles.practitioner_specialties set verification_status_concept_id=(select id from terminology.catalog_concepts where id <> '${PROF.SPEC_VERIF_PENDING}' limit 1) where id='${spec2.id}'`);
r = await call('DELETE', `/profiles/practitioners/me/specialties/${spec2.id}`, { token: a.token });
check('especialidad no pendiente = 422', r.status === 422, `status=${r.status}`);

// --- ID-13: sexo al nacer y departamento emisor --------------------------------------
r = await call('PATCH', '/profiles/practitioners/me', { token: a.token, body: { sexAtBirth: 'FEMALE', issuerAdministrativeAreaConceptId: boDepartmentConceptId('LP') } });
check('PATCH me sexAtBirth + departamento = 200', r.status === 200, `status=${r.status}`);
const me = await call('GET', '/profiles/practitioners/me/summary', { token: a.token });
check('la relectura devuelve sexAtBirth FEMALE y el departamento nuevo', me.body.sexAtBirth === 'FEMALE' && me.body.issuerAdministrativeAreaConceptId === boDepartmentConceptId('LP'), `sexAtBirth=${me.body.sexAtBirth}`);
r = await call('PATCH', '/profiles/practitioners/me', { token: a.token, body: { issuerAdministrativeAreaConceptId: specialties[0] } });
check('departamento fuera de VS_BO_DEPARTMENT = 422', r.status === 422, `status=${r.status}`);

// --- ID-16: historial laboral del padrón ---------------------------------------------
const aff = { organizationName: 'Hospital sintético', healthFacilityConceptId: facilities[0], roleTitle: 'Médico', startDate: '2024-01-01' };
r = await call('POST', '/profiles/practitioners/me/affiliations', { token: a.token, body: aff });
check('alta de vínculo del padrón = 201', r.status === 201, `status=${r.status}`);
console.log('     SELECT:', psql(`select health_facility_concept_id = '${facilities[0]}' from profiles.practitioner_affiliations where practitioner_profile_id='${sum.body.profileId}'`));
r = await call('POST', '/profiles/practitioners/me/affiliations', { token: a.token, body: aff });
check('mismo establecimiento, cargo e inicio = 409', r.status === 409, `status=${r.status}`);
r = await call('POST', '/profiles/practitioners/me/affiliations', { token: a.token, body: { ...aff, healthFacilityConceptId: specialties[0], startDate: '2023-01-01' } });
check('concepto fuera del padrón = 422', r.status === 422, `status=${r.status}`);

console.log(fails === 0 ? 'TODO PASS' : `FALLAS: ${fails}`);
process.exit(fails === 0 ? 0 : 1);
