// H1 · preparación y verificación por API (segunda máquina): pacientes A/B, médica con
// CLINICAL_APPROVER real, relación asistencial → 200 → revocación por el titular → 403 real,
// emergencia (break-the-glass) con la médica (no SUPERADMIN), enrolamiento MFA y prueba del
// enrolamiento cruzado. Deja las cuentas en cuentas.json para los recorridos de navegador.
// Uso: API=http://localhost:3000 node h1-api-preparacion.mjs
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';

const API = process.env.API ?? 'http://localhost:3000';
const OUTDIR = process.env.OUTDIR ?? 'C:/Users/DELL/Documents/Github/Alovida/verif-h1-h2';
const SEED_TENANT = '1befcfea-44c0-563a-81cd-337ec6acc840';
const PURPOSE_GENERAL_CARE = '48b87987-5363-5e45-a6cf-f35ad1ac10ed';
const ADMIN = { email: 'admin@verif.test', password: 'S3cret-passw0rd' };
const PASS = 'S3cret-passw0rd';
const marca = Math.random().toString(16).slice(2, 8);
const lineas = [];
let fallos = 0;
const log = (s) => {
  lineas.push(s);
  console.log(s);
};
const check = (n, ok, d = '') => {
  if (!ok) fallos += 1;
  log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? ' :: ' + d : ''}`);
};
const psql = (sql) => {
  try {
    return execSync(`docker exec verif-pg psql -U verif -d verif -tAc "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }).trim();
  } catch (e) {
    return `(psql error: ${String(e.stderr ?? e.message).trim().split('\n')[0]})`;
  }
};
const j = (o) => String(JSON.stringify(o)).slice(0, 320);

async function call(method, path, { token, body, tenant, headers = {} } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(tenant ? { 'x-tenant-id': tenant } : {}),
      ...headers,
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
  return { status: res.status, body: json, headers: res.headers };
}
function claims(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}
async function login(cred) {
  const r = await call('POST', '/iam/auth/login', { body: { ...cred, password: PASS } });
  if (r.status !== 200) throw new Error(`login ${j(cred)} -> ${r.status} ${j(r.body)}`);
  return r.body.accessToken;
}

// --- TOTP RFC 6238 (SHA1, 6 dígitos, 30 s) sin dependencias --------------------------------
function base32Decode(s) {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of s.replace(/=+$/, '').toUpperCase()) {
    const v = alfabeto.indexOf(ch);
    if (v < 0) continue;
    bits += v.toString(2).padStart(5, '0');
  }
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
}
export function totp(secret, t = Date.now()) {
  const contador = Math.floor(t / 1000 / 30);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(contador));
  const h = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const off = h[h.length - 1] & 0xf;
  const codigo = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(codigo % 1_000_000).padStart(6, '0');
}

// --- catálogos que exigen las altas -------------------------------------------------------
const municipio = psql("select id from terminology.catalog_concepts where code like 'geo:bo:municipality:%' order by code limit 1");
const departamento = psql(
  "select m.concept_id from terminology.value_set_members m join terminology.value_set_versions v on v.id=m.value_set_version_id join terminology.value_sets vs on vs.id=v.value_set_id where vs.internal_code='VS_BO_DEPARTMENT' and v.is_default and m.included order by m.ordinal limit 1",
);
const especialidades = psql(
  "select m.concept_id from terminology.value_set_members m join terminology.value_set_versions v on v.id=m.value_set_version_id join terminology.value_sets s on s.id=v.value_set_id where s.internal_code='VS_MEDICAL_SPECIALTY' and m.included limit 3",
).split('\n');
log(`MARCA ${marca} · municipio=${municipio} departamento=${departamento} especialidades=${especialidades.length}`);

const adminToken = await login({ email: ADMIN.email });
const adminClaims = claims(adminToken);
check('admin de arranque entra (SUPERADMIN)', adminClaims.roles?.includes('SUPERADMIN'), `roles=${j(adminClaims.roles)} tenants=${j(adminClaims.tenants ?? adminClaims.tenantIds)}`);

// --- pacientes A y B -----------------------------------------------------------------------
async function paciente(etq) {
  const nationalId = `V${marca}${etq}`;
  const email = `paciente-${etq}-${marca}@example.test`;
  const r = await call('POST', '/iam/auth/register-patient', {
    body: {
      nationalId,
      issuerAdministrativeAreaConceptId: departamento,
      residenceMunicipalityConceptId: municipio,
      password: PASS,
      name: 'Paciente',
      lastName: `${etq.toUpperCase()} ${marca}`,
      email,
      birthDate: '1990-01-01',
      phone: '+591 70000000',
      sexAtBirth: 'FEMALE',
    },
  });
  check(`alta paciente ${etq} 201`, r.status === 201, `status=${r.status} ${j(r.body)}`);
  const token = await login({ nationalId });
  return { etq, nationalId, email, password: PASS, userId: r.body.userId, pid: claims(token).pid, token };
}
const A = await paciente('a');
const B = await paciente('b');

// --- médica D (PRACTITIONER autorregistrada) + CLINICAL_APPROVER en el tenant seed ----------
const dEmail = `medica-${marca}@example.test`;
const rD = await call('POST', '/iam/auth/register-practitioner', {
  body: {
    email: dEmail,
    password: PASS,
    name: 'Médica',
    lastName: `Verif ${marca}`,
    licenseNumber: `MP-${marca}`,
    nationalId: `MED${marca}`,
    issuerAdministrativeAreaConceptId: departamento,
    specialtyConceptIds: especialidades.slice(0, 1),
  },
});
check('alta médica 201', rD.status === 201, `status=${rD.status} ${j(rD.body)}`);
const D = { email: dEmail, password: PASS, userId: rD.body.userId, hpid: rD.body.practitionerProfileId, licenseId: rD.body.licenseId };
let dToken = await login({ email: dEmail });
let dClaims = claims(dToken);
log(`     médica antes del rol: roles=${j(dClaims.roles)} scopedRoles=${j(dClaims.scopedRoles)} tenants=${j(dClaims.tenants ?? dClaims.tenantIds)}`);

const rRol = await call('POST', `/authz/users/${D.userId}/role-assignments`, {
  token: adminToken,
  tenant: SEED_TENANT,
  body: { roleCode: 'CLINICAL_APPROVER', tenantId: SEED_TENANT },
});
check('admin asigna CLINICAL_APPROVER (tenant seed) a la médica', rRol.status === 201, `status=${rRol.status} ${j(rRol.body)}`);
dToken = await login({ email: dEmail });
dClaims = claims(dToken);
check('el token nuevo de la médica trae CLINICAL_APPROVER (no SUPERADMIN)', dClaims.roles?.includes('CLINICAL_APPROVER') && !dClaims.roles?.includes('SUPERADMIN'), `roles=${j(dClaims.roles)} scopedRoles=${j(dClaims.scopedRoles)}`);
D.token = dToken;

// --- relación asistencial → 200 → revocación del titular → 403 real ------------------------
const sinRel = await call('GET', `/clinical/patients/${A.pid}/summary`, { token: dToken, tenant: SEED_TENANT });
check('médica sin vínculo: resumen clínico de A -> 403', sinRel.status === 403, `status=${sinRel.status} ${j(sinRel.body)}`);

const rRel = await call('POST', '/authz/care-relationships', {
  token: adminToken,
  tenant: SEED_TENANT,
  body: { tenantId: SEED_TENANT, patientProfileId: A.pid, practitionerProfileId: D.hpid, relationshipType: 'TREATING' },
});
check('admin crea la relación asistencial médica↔A (201)', rRel.status === 201, `status=${rRel.status} ${j(rRel.body)}`);
const conRel = await call('GET', `/clinical/patients/${A.pid}/summary`, { token: dToken, tenant: SEED_TENANT });
check('con vínculo vigente: la médica lee el resumen de A -> 200', conRel.status === 200, `status=${conRel.status} claves=${j(Object.keys(conRel.body ?? {}))}`);

const accesoA = await call('GET', '/authz/me/access', { token: A.token });
const relacion = accesoA.body.careRelationships?.find((c) => c.practitionerProfileId === D.hpid) ?? accesoA.body.relationships?.find?.((c) => c.practitionerProfileId === D.hpid);
check('A ve el vínculo en /authz/me/access con nombre y estado', !!relacion, `${j(accesoA.body)}`);
const relId = relacion?.id ?? rRel.body.id;
const revB = await call('POST', `/authz/me/care-relationships/${relId}/revoke`, { token: B.token });
check('B intenta revocar el vínculo de A -> 404', revB.status === 404, `status=${revB.status}`);
const revA = await call('POST', `/authz/me/care-relationships/${relId}/revoke`, { token: A.token });
check('A revoca el vínculo -> 200', revA.status === 200, `status=${revA.status} ${j(revA.body)}`);
const tras = await call('GET', `/clinical/patients/${A.pid}/summary`, { token: dToken, tenant: SEED_TENANT });
check('403 REAL: la médica revocada ya no lee el resumen de A', tras.status === 403 && tras.body?.code === 'FORBIDDEN', `status=${tras.status} ${j(tras.body)}`);
log(`     SELECT authz.care_relationships -> ${psql(`select status_concept_id, valid_to is not null as cerrada from authz.care_relationships where id='${relId}'`) || '(sin columnas state/valid_to legibles)'}`);

// --- emergencia con CLINICAL_APPROVER real (la médica), no SUPERADMIN -----------------------
const sinJust = await call('POST', `/authz/patients/${A.pid}/break-the-glass`, { token: dToken, tenant: SEED_TENANT, body: { tenantId: SEED_TENANT, justification: '' } });
check('emergencia sin justificación -> 400', sinJust.status === 400, `status=${sinJust.status}`);
const btg = await call('POST', `/authz/patients/${A.pid}/break-the-glass`, {
  token: dToken,
  tenant: SEED_TENANT,
  body: { tenantId: SEED_TENANT, justification: 'Paciente inconsciente en urgencias, sin acompañante (verificación H1)', windowMinutes: 15 },
});
check('emergencia con justificación por la médica CLINICAL_APPROVER -> 201', btg.status === 201, `status=${btg.status} ${j(btg.body)}`);
const conEmerg = await call('GET', `/clinical/patients/${A.pid}/summary`, { token: dToken, tenant: SEED_TENANT });
check('con el acceso de emergencia la médica vuelve a leer -> 200', conEmerg.status === 200, `status=${conEmerg.status} ${j(conEmerg.body).slice(0, 120)}`);
const accesoA2 = await call('GET', '/authz/me/access', { token: A.token });
const grantEm = accesoA2.body.grants?.find((g) => g.id === btg.body.id);
check('A ve el acceso como emergencia (isEmergency) en /authz/me/access', grantEm?.isEmergency === true && grantEm?.state === 'ACTIVE', j(grantEm));
log(`     SELECT break_glass_sessions -> ${psql(`select count(*) from authz.break_glass_sessions where justification like '%verificación H1%'`)}`);
const revEmB = await call('POST', `/authz/me/clinical-access-grants/${btg.body.id}/revoke`, { token: B.token });
const revEmA = await call('POST', `/authz/me/clinical-access-grants/${btg.body.id}/revoke`, { token: A.token });
check('B no puede revocar la emergencia de A (404); A sí (200)', revEmB.status === 404 && revEmA.status === 200, `B=${revEmB.status} A=${revEmA.status}`);
const trasEm = await call('GET', `/clinical/patients/${A.pid}/summary`, { token: dToken, tenant: SEED_TENANT });
check('revocada la emergencia, la médica vuelve al 403', trasEm.status === 403, `status=${trasEm.status}`);

// --- consentimiento vigente de A (para «Mi privacidad» en el navegador) -------------------
const cons = await call('POST', '/consent/consents', {
  token: adminToken,
  tenant: SEED_TENANT,
  body: { patientProfileId: A.pid, processingPurposeId: PURPOSE_GENERAL_CARE, tenantId: SEED_TENANT },
});
check('admin registra un consentimiento ACTIVE para A (para la pantalla)', cons.status === 201, `status=${cons.status} ${j(cons.body)}`);
// segunda relación para que «Quién ve mi historia» tenga una fila viva: médica ↔ B
const rRelB = await call('POST', '/authz/care-relationships', {
  token: adminToken,
  tenant: SEED_TENANT,
  body: { tenantId: SEED_TENANT, patientProfileId: B.pid, practitionerProfileId: D.hpid, relationshipType: 'TREATING' },
});
check('relación médica↔B (para el recorrido de navegador) 201', rRelB.status === 201, `status=${rRelB.status}`);

// --- MFA: enrolar TOTP para la médica y probar el enrolamiento cruzado --------------------
const enrol = await call('POST', `/iam/users/${D.userId}/mfa-factors`, { token: dToken, body: { factorType: 'TOTP', label: 'verif' } });
check('la médica enrola un factor TOTP (201, secret base32)', enrol.status === 201 && typeof enrol.body.secret === 'string', `status=${enrol.status} claves=${j(Object.keys(enrol.body ?? {}))}`);
const verif = await call('POST', `/iam/users/${D.userId}/mfa-factors`, { token: dToken, body: { verify: true, factorId: enrol.body.id, code: totp(enrol.body.secret) } });
check('verifica el factor con un código TOTP generado (201)', verif.status === 201, `status=${verif.status} ${j(verif.body)}`);
const sinCodigo = await call('POST', '/iam/auth/login', { body: { email: dEmail, password: PASS } });
check('login de la médica sin código -> 401 MFA_REQUIRED', sinCodigo.status === 401 && sinCodigo.body?.details?.reason === 'MFA_REQUIRED', `status=${sinCodigo.status} ${j(sinCodigo.body)}`);
const malCodigo = await call('POST', '/iam/auth/login', { body: { email: dEmail, password: PASS, mfaCode: '000000' } });
check('código que no valida -> 401 MFA_INVALID', malCodigo.status === 401 && malCodigo.body?.details?.reason === 'MFA_INVALID', `status=${malCodigo.status}`);
const bienCodigo = await call('POST', '/iam/auth/login', { body: { email: dEmail, password: PASS, mfaCode: totp(enrol.body.secret) } });
check('código vigente -> 200 con sesión', bienCodigo.status === 200 && !!bienCodigo.body.accessToken, `status=${bienCodigo.status}`);
// enrolamiento cruzado: A intenta enrolar un factor sobre la cuenta de B
const cruzado = await call('POST', `/iam/users/${B.userId}/mfa-factors`, { token: A.token, body: { factorType: 'TOTP', label: 'ajeno' } });
check('A NO puede enrolar un factor MFA sobre la cuenta de B (esperado 403/404)', cruzado.status === 403 || cruzado.status === 404, `status=${cruzado.status} ${j(cruzado.body)}`);
if (cruzado.status === 201) {
  log(`     !!! DEFECTO: factor ajeno creado id=${cruzado.body.id}; SELECT iam.mfa_factors -> ${psql(`select user_id from iam.mfa_factors where id='${cruzado.body.id}'`)}`);
}

log(`== RESUMEN == ${lineas.filter((l) => l.startsWith('PASS')).length} PASS, ${fallos} FAIL`);
writeFileSync(`${OUTDIR}/logs/h1-api-preparacion.txt`, lineas.join('\n') + '\n');
writeFileSync(
  `${OUTDIR}/logs/cuentas.json`,
  JSON.stringify(
    {
      marca,
      seedTenant: SEED_TENANT,
      admin: ADMIN,
      A: { nationalId: A.nationalId, email: A.email, password: PASS, userId: A.userId, pid: A.pid },
      B: { nationalId: B.nationalId, email: B.email, password: PASS, userId: B.userId, pid: B.pid },
      medica: { email: dEmail, password: PASS, userId: D.userId, hpid: D.hpid, licenseId: D.licenseId, mfaSecret: enrol.body.secret },
      relacionB: rRelB.body?.id,
    },
    null,
    2,
  ),
);
process.exit(fallos ? 1 : 0);
