// BR-09 / CL-43 / ID-09 contra la API viva y un Postgres efímero (datos sintéticos).
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = new URL('../../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const { PROF } = require(`${root}dist/src/modules/profiles/profiles.concepts.js`);
const { DUNIT } = require(`${root}dist/src/modules/diagnostic_units/diagnostic_units.concepts.js`);
const { CONCEPTS } = require(`${root}dist/src/common/index.js`);
const { boDepartmentConceptId } = require(`${root}dist/src/common/seed/bo-geography.catalog.js`);

const BASE = process.env.BASE ?? 'http://localhost:3301';
const psql = (sql) =>
  execFileSync('docker', ['exec', 'legion-h2-pg', 'psql', '-U', 'legion', '-d', 'legion_h2', '-tAc', sql], {
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
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
};
// PDF sintético mínimo, con contenido distinto por archivo (un archivo no puede repetirse entre roles).
const pdf = async (label, path = '/iam/auth/upload-registration-document', token) => {
  const bytes = Buffer.from(`%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n% ${label} ${mark} ${Math.random()}\n%%EOF\n`);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'application/pdf' }), `${label}.pdf`);
  if (token) { form.append('category', 'DOCUMENT'); form.append('sensitivity', 'NORMAL'); }
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json = await res.json();
  if (res.status !== 201) console.log(`     upload ${label}: ${res.status} ${JSON.stringify(json)}`);
  return json.fileId ?? json.id;
};

const org = (suffix, over = {}, legalDocuments, legalRepresentative) => ({
  organization: {
    code: `H2_${suffix}_${mark}`,
    legalName: `Laboratorio sintético ${suffix} ${mark}`,
    tenantType: 'DIAGNOSTIC_CENTER',
    countryConceptId: CONCEPTS.COUNTRY_BO,
    jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
    legalEntityType: 'UNIPERSONAL',
    diagnosticUnit: {
      diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
      modalityConceptIds: [DUNIT.MODALITY_LABORATORY],
      primarySite: {
        name: 'Central',
        timeZone: 'America/La_Paz',
        address: { lines: ['Av. San Martín 123'], latitude: -17.78, longitude: -63.18 },
      },
    },
    ...(legalDocuments ? { legalDocuments } : {}),
    ...(legalRepresentative ? { legalRepresentative } : {}),
    ...over,
  },
  owner: { email: `h2-org-${suffix}-${mark}@example.test`, password: 'S3cret-passw0rd', name: 'Elena', lastName: 'Salas' },
});
const docs4 = async () => ({
  taxIdentifierFileId: await pdf('nit'),
  commerceRegistryFileId: await pdf('seprec'),
  operatingLicenseFileId: await pdf('licencia'),
  healthAuthorityCertificateFileId: await pdf('sedes'),
});
const rep = (poder) => ({
  name: 'Ana', lastName: 'Rojas', idNumber: `RL${mark}`, email: `rl-${mark}@example.test`,
  ...(poder ? { powerOfAttorneyFileId: poder } : {}),
});

// --- CL-43: unipersonal sin constitución ni poder ------------------------------------
const d1 = await docs4();
let r = await call('POST', '/iam/auth/register-organization', { body: org('uni', {}, d1, rep()) });
check('UNIPERSONAL sin constitución ni poder = 201', r.status === 201, `status=${r.status} ${r.status === 201 ? '' : JSON.stringify(r.body)}`);
check('quedan registrados los cuatro documentos', r.body.legalDocumentsRegistered === 4, `legalDocumentsRegistered=${r.body.legalDocumentsRegistered}`);
if (r.status === 201) {
  const t = r.body.tenantId;
  console.log('     SELECT tenant:', psql(`select status_concept_id is not null, verification_status_concept_id is not null from directory.tenants where id='${t}'`));
  console.log('     SELECT documentos:', psql(`select count(*) from directory.tenant_affiliation_documents where tenant_id='${t}'`));
  console.log('     SELECT unidad:', psql(`select u.diagnostic_unit_type_concept_id='${DUNIT.UNIT_TYPE_LABORATORY}', (select count(*) from diagnostic_units.diagnostic_study_offerings o where o.diagnostic_unit_id=u.id), (select count(*) from diagnostic_units.diagnostic_unit_sites s where s.diagnostic_unit_id=u.id) from diagnostic_units.diagnostic_units u where u.id='${r.body.diagnosticUnitId}'`));
  console.log('     SELECT sede con coordenadas:', psql(`select a.latitude, a.longitude from diagnostic_units.diagnostic_units u join practice.practice_sites s on s.id=u.primary_practice_site_id join common.addresses a on a.id=s.address_id where u.id='${r.body.diagnosticUnitId}'`));
  console.log('     SELECT archivos con dueño:', psql(`select count(*) filter (where created_by_user_id is not null), count(*) from common.files f where f.id in (select file_id from directory.tenant_affiliation_documents where tenant_id='${t}')`));
  const login = await call('POST', '/iam/auth/login', { body: { email: `h2-org-uni-${mark}@example.test`, password: 'S3cret-passw0rd' } });
  check('el dueño inicia sesión', login.status === 200, `status=${login.status}`);
}

// --- SRL sin constitución = 422 y nada creado -----------------------------------------
const d2 = await docs4();
const antes = psql("select count(*) from directory.tenants");
r = await call('POST', '/iam/auth/register-organization', { body: org('srl', { legalEntityType: 'SRL' }, d2) });
check('SRL sin constitución = 422', r.status === 422, `status=${r.status}`);
check('el 422 nombra el documento faltante', JSON.stringify(r.body).includes('constitución'), '');
check('no se creó ningún tenant ni cuenta', psql('select count(*) from directory.tenants') === antes && psql(`select count(*) from directory.tenants where code='H2_srl_${mark}'`) === '0');

// --- SRL completa, con representante sin poder = 422 ----------------------------------
const d3 = { ...(await docs4()), constitutionFileId: await pdf('constitucion') };
r = await call('POST', '/iam/auth/register-organization', { body: org('srl2', { legalEntityType: 'SRL' }, d3, rep()) });
check('SRL con representante sin poder = 422', r.status === 422, `status=${r.status}`);
const d4 = { ...(await docs4()), constitutionFileId: await pdf('constitucion') };
r = await call('POST', '/iam/auth/register-organization', { body: org('srl3', { legalEntityType: 'SRL' }, d4, rep(await pdf('poder'))) });
check('SRL con los seis documentos = 201 (sin cambios)', r.status === 201, `status=${r.status} ${r.status === 201 ? '' : JSON.stringify(r.body)}`);
check('SRL registra cinco documentos + poder', r.body.legalDocumentsRegistered === 5, `legalDocumentsRegistered=${r.body.legalDocumentsRegistered}`);

// --- modalidad desconocida y territorio ----------------------------------------------
r = await call('POST', '/iam/auth/register-organization', {
  body: org('mod', { diagnosticUnit: { modalityConceptIds: [boDepartmentConceptId('LP')] } }),
});
check('modalidad desconocida = 422', r.status === 422, `status=${r.status}`);
const sinTerritorio = org('ter');
delete sinTerritorio.organization.countryConceptId;
delete sinTerritorio.organization.jurisdictionConceptId;
r = await call('POST', '/iam/auth/register-organization', { body: sinTerritorio });
check('DIAGNOSTIC_CENTER sin país ni jurisdicción = 422', r.status === 422, `status=${r.status}`);

// --- ID-09: la matrícula devuelve su archivo ------------------------------------------
const em = `h2-lic-${mark}@example.test`;
const reg = await call('POST', '/iam/auth/register-practitioner', {
  body: { email: em, password: 'S3cret-passw0rd', name: 'Cuenta', lastName: 'Lic', licenseNumber: `LIC-${mark}`, nationalId: `LC${mark}`, issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC') },
});
const login = await call('POST', '/iam/auth/login', { body: { email: em, password: 'S3cret-passw0rd' } });
const token = login.body.accessToken;
const fileId = await pdf('carnet', '/common/files/upload', token);
const me = await call('GET', '/profiles/practitioners/me/summary', { token });
const add = await call('POST', `/profiles/practitioners/${me.body.profileId}/jurisdiction-authorizations`, { token, body: { licenseNumber: `CARNET-${mark}`, fileId } });
check('matrícula con fileId = 201', add.status === 201, `status=${add.status} ${JSON.stringify(add.body).slice(0, 120)}`);
const me2 = await call('GET', '/profiles/practitioners/me/summary', { token });
const conArchivo = me2.body.licenses?.find((l) => l.licenseNumber === `CARNET-${mark}`);
check('licenses[i].fileId es ese id', conArchivo?.fileId === fileId, `fileId=${conArchivo?.fileId}`);
const otra = await call('GET', `/profiles/practitioners/${me.body.profileId}/summary`, { token: undefined });
console.log('     (ficha pública sin sesión:', otra.status, ')');

console.log(fails === 0 ? 'TODO PASS' : `FALLAS: ${fails}`);
process.exit(fails === 0 ? 0 : 1);
