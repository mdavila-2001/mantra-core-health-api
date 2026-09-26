// H2 · altas en runtime por API (sin pantalla en el front): hospital (`tenantType: HOSPITAL`,
// D-BR09-3 «camino decidido, pantalla diferida») y aseguradora (`tenantType: PAYER`, el mismo
// cuerpo que arma el front en register-organization.ts). Sube los PDF por
// /iam/auth/upload-registration-document como hace el front, y comprueba la fila en la base.
// Uso: API=http://localhost:3000 node h2-api-hospital-aseguradora.mjs
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const API = process.env.API ?? 'http://localhost:3000';
const DIR = process.env.DIR ?? 'C:/Users/DELL/Documents/Github/Alovida/verif-h1-h2';
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
const j = (o) => String(JSON.stringify(o)).slice(0, 300);
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
);

async function subir(nombre) {
  const fd = new FormData();
  fd.append('file', new Blob([PDF], { type: 'application/pdf' }), nombre);
  const r = await fetch(`${API}/iam/auth/upload-registration-document`, { method: 'POST', body: fd });
  const b = await r.json();
  if (r.status !== 201) throw new Error(`upload ${nombre} -> ${r.status} ${j(b)}`);
  return b.fileId;
}
async function post(path, body, token) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: r.status, body: json };
}
// Cada organización sube sus propios PDF: la API rechaza (422 «ya está vinculado a una
// organización») reutilizar un fileId entre altas, comprobado en una corrida anterior.
async function juego(prefijo) {
  const d = {};
  for (const k of ['constitution', 'taxIdentifier', 'commerceRegistry', 'operatingLicense', 'healthAuthorityCertificate', 'powerOfAttorney']) {
    d[k] = await subir(`${prefijo}-${k}.pdf`);
  }
  log(`PDF subidos para ${prefijo}: 6 (upload-registration-document 201)`);
  return {
    legalDocuments: {
      constitutionFileId: d.constitution,
      taxIdentifierFileId: d.taxIdentifier,
      commerceRegistryFileId: d.commerceRegistry,
      operatingLicenseFileId: d.operatingLicense,
      healthAuthorityCertificateFileId: d.healthAuthorityCertificate,
    },
    representante: (etq) => ({
      fullName: `Representante ${etq} ${marca}`,
      idNumber: `${marca}${etq}9`,
      email: `rep-${etq}-${marca}@example.test`,
      powerOfAttorneyFileId: d.powerOfAttorney,
    }),
  };
}
// Los tipos territoriales (HOSPITAL) exigen país y jurisdicción: se resuelven por las mismas
// enumeraciones públicas que consulta el front (alta-de-centro-diagnostico.ts).
async function opcion(target, patron) {
  const r = await fetch(`${API}/system-context/dynamic-enums?target=${target}`);
  const e = await r.json();
  const opciones = e.options ?? [];
  const elegida = opciones.find((o) => patron.test(JSON.stringify(o))) ?? opciones[0];
  return elegida?.conceptId;
}
const countryConceptId = await opcion('directory.tenants.country_concept_id', /"BO"|Bolivia/i);
const jurisdictionConceptId = await opcion('profiles.jurisdiction_authorizations.jurisdiction_concept_id', /NATIONAL|Nacional/i);
log(`país=${countryConceptId} jurisdicción=${jurisdictionConceptId}`);

// --- Hospital (SRL, con los seis papeles) -------------------------------------------------
const h = await juego('hospital');
const hospEmail = `hospital-${marca}@example.test`;
const hosp = await post('/iam/auth/register-organization', {
  organization: {
    code: `HOSP_${marca.toUpperCase()}`,
    legalName: `Hospital Verif ${marca} S.R.L.`,
    legalEntityType: 'SRL',
    tenantType: 'HOSPITAL',
    timeZone: 'America/La_Paz',
    countryConceptId,
    jurisdictionConceptId,
    legalDocuments: h.legalDocuments,
    legalRepresentative: h.representante('h'),
  },
  owner: { email: hospEmail, password: 'S3cret-passw0rd', displayName: `Dueño Hospital ${marca}` },
});
check('alta de hospital (tenantType HOSPITAL, SRL) -> 201', hosp.status === 201, `status=${hosp.status} ${j(hosp.body)}`);
if (hosp.status === 201) {
  log(`     SELECT tenant hospital -> ${psql(`select code || '|' || legal_name from directory.tenants where id='${hosp.body.tenantId}'`)}`);
  log(`     SELECT documentos -> ${psql(`select count(*) from directory.tenant_affiliation_documents where tenant_id='${hosp.body.tenantId}'`)} · representantes -> ${psql(`select count(*) from directory.tenant_legal_representatives where tenant_id='${hosp.body.tenantId}'`)}`);
  const login = await post('/iam/auth/login', { email: hospEmail, password: 'S3cret-passw0rd' });
  check('el dueño del hospital inicia sesión', login.status === 200, `status=${login.status}`);
}
// hospital SRL sin constitución -> 422 (CL-43)
const x = await juego('hospital-sin-constitucion');
const { constitutionFileId: _omit, ...sinConstitucion } = x.legalDocuments;
const hospSin = await post('/iam/auth/register-organization', {
  organization: {
    code: `HOSPX_${marca.toUpperCase()}`,
    legalName: `Hospital Sin Constitución ${marca}`,
    legalEntityType: 'SRL',
    tenantType: 'HOSPITAL',
    timeZone: 'America/La_Paz',
    countryConceptId,
    jurisdictionConceptId,
    legalDocuments: sinConstitucion,
    legalRepresentative: x.representante('x'),
  },
  owner: { email: `hospx-${marca}@example.test`, password: 'S3cret-passw0rd', displayName: 'Dueño X' },
});
check('hospital SRL sin constitución -> 422 y nombra el documento', hospSin.status === 422 && /constituci/i.test(JSON.stringify(hospSin.body)), `status=${hospSin.status} ${j(hospSin.body)}`);
check('el 422 no dejó tenant ni cuenta', psql(`select count(*) from directory.tenants where code='HOSPX_${marca.toUpperCase()}'`) === '0');

// --- Aseguradora (PAYER), cuerpo idéntico al del front ------------------------------------
const a = await juego('aseguradora');
const asegEmail = `aseguradora-${marca}@example.test`;
const aseg = await post('/iam/auth/register-organization', {
  organization: {
    code: `ASEG_${marca.toUpperCase()}`,
    legalName: `Aseguradora Verif ${marca} S.A.`,
    legalEntityType: 'SA',
    tenantType: 'PAYER',
    timeZone: 'America/La_Paz',
    payer: {
      carrierCode: `ASEG_${marca.toUpperCase()}`,
      regulatorIdentifier: `APS-${marca}`,
      sigla: `AV${marca.slice(0, 3).toUpperCase()}`,
      address: 'Av. San Martín 1200, Santa Cruz',
    },
    legalDocuments: a.legalDocuments,
    legalRepresentative: a.representante('a'),
  },
  owner: { email: asegEmail, password: 'S3cret-passw0rd', name: 'Dueña', lastName: `Aseguradora ${marca}` },
});
check('alta de aseguradora (tenantType PAYER) en runtime -> 201', aseg.status === 201, `status=${aseg.status} ${j(aseg.body)}`);
if (aseg.status === 201) {
  log(`     SELECT tenant aseguradora -> ${psql(`select code || '|' || legal_name from directory.tenants where id='${aseg.body.tenantId}'`)}`);
  log(`     SELECT insurance_carriers -> ${psql(`select carrier_code || '|' || coalesce(sigla,'') from insurance.insurance_carriers where tenant_id='${aseg.body.tenantId}'`)}`);
  log(`     SELECT documentos -> ${psql(`select count(*) from directory.tenant_affiliation_documents where tenant_id='${aseg.body.tenantId}'`)}`);
  const login = await post('/iam/auth/login', { email: asegEmail, password: 'S3cret-passw0rd' });
  check('la dueña de la aseguradora inicia sesión', login.status === 200, `status=${login.status}`);
}

log(`== RESUMEN == ${lineas.filter((l) => l.startsWith('PASS')).length} PASS, ${fallos} FAIL`);
writeFileSync(`${DIR}/logs/h2-api-hospital-aseguradora.txt`, lineas.join('\n') + '\n');
process.exit(fallos ? 1 : 0);
