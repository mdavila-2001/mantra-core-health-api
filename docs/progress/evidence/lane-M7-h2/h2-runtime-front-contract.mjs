// Contrato front <-> API: reproduce, contra la API viva, la secuencia exacta que hace el
// front (AltaDeCentroDiagnostico + RegisterLaboratory / RegisterImagingCenter):
//   1) lee los cuatro catálogos por `dynamic-enums?target=` (públicos), 2) sube los PDF en
//   serie, 3) manda register-organization con el cuerpo que arma `cuerpoDeCentroDiagnostico`
//   (owner.displayName, legalRepresentative.fullName, executives.fullName…).
// Datos sintéticos. Uso: BASE=http://localhost:3301 node h2-runtime-front-contract.mjs
import { execFileSync } from 'node:child_process';

const BASE = process.env.BASE ?? 'http://localhost:3301';
const mark = Math.random().toString(16).slice(2, 7);
let fails = 0;
const check = (name, ok, detail = '') => {
  if (!ok) fails += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`);
};
const psql = (sql) =>
  execFileSync('docker', ['exec', 'legion-h2-pg', 'psql', '-U', 'legion', '-d', 'legion_h2', '-tAc', sql], { encoding: 'utf8' }).trim();

const DESTINOS = {
  tipoDeUnidad: 'diagnostic_units.diagnostic_units.diagnostic_unit_type_concept_id',
  modalidad: 'diagnostic_units.diagnostic_study_offerings.modality_concept_id',
  pais: 'directory.tenants.country_concept_id',
  jurisdiccion: 'profiles.jurisdiction_authorizations.jurisdiction_concept_id',
};
const catalogo = {};
for (const [clave, target] of Object.entries(DESTINOS)) {
  const res = await fetch(`${BASE}/system-context/dynamic-enums?target=${encodeURIComponent(target)}`);
  const json = await res.json();
  catalogo[clave] = new Map(json.options.map((o) => [o.code, o.conceptId]));
  check(`catálogo público ${clave}`, res.status === 200 && catalogo[clave].size > 0, `${catalogo[clave].size} opciones`);
}

async function subir(nombre) {
  const form = new FormData();
  form.append('file', new Blob([Buffer.from(`%PDF-1.4\n% ${nombre} ${mark} ${Math.random()}\n%%EOF\n`)], { type: 'application/pdf' }), `${nombre}.pdf`);
  const res = await fetch(`${BASE}/iam/auth/upload-registration-document`, { method: 'POST', body: form });
  return (await res.json()).fileId;
}
const post = async (cuerpo) => {
  const res = await fetch(`${BASE}/iam/auth/register-organization`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  return { status: res.status, body: await res.json() };
};

async function alta({ etiqueta, tipo, modalidades, entidad, conConstitucion, gerencias }) {
  const docs = {
    taxIdentifierFileId: await subir('nit'),
    commerceRegistryFileId: await subir('seprec'),
    operatingLicenseFileId: await subir('licencia'),
    healthAuthorityCertificateFileId: await subir('sedes'),
    ...(conConstitucion ? { constitutionFileId: await subir('constitucion') } : {}),
  };
  const poder = conConstitucion ? await subir('poder') : undefined;
  const c = (map, code) => map.get(code);
  const cuerpo = {
    organization: {
      code: `${etiqueta}_${mark}`,
      legalName: `${etiqueta} sintético ${mark}`,
      legalEntityType: entidad,
      tenantType: 'DIAGNOSTIC_CENTER',
      timeZone: 'America/La_Paz',
      countryConceptId: c(catalogo.pais, 'BO'),
      jurisdictionConceptId: c(catalogo.jurisdiccion, 'JURISDICTION_NATIONAL'),
      diagnosticUnit: {
        diagnosticUnitTypeConceptId: c(catalogo.tipoDeUnidad, tipo),
        modalityConceptIds: modalidades.map((m) => c(catalogo.modalidad, m)),
        primarySite: {
          name: 'Central',
          timeZone: 'America/La_Paz',
          address: { lines: ['Av. Cañoto 234'], latitude: -17.78, longitude: -63.18 },
        },
      },
      legalDocuments: docs,
      legalRepresentative: {
        fullName: 'Ana Paz Rojas',
        idNumber: '4872190',
        email: `rep-${etiqueta}-${mark}@example.test`,
        ...(poder ? { powerOfAttorneyFileId: poder } : {}),
      },
      ...(gerencias
        ? {
            executives: {
              generalManager: { fullName: 'Luis Vaca', phone: '+591 70011111', email: `gg-${mark}@example.test` },
              commercialManager: { fullName: 'Rosa Cruz', phone: '+591 70022222', email: `gc-${mark}@example.test` },
              marketingManager: { fullName: 'Pedro Roca', phone: '+591 70033333', email: `gm-${mark}@example.test` },
            },
          }
        : {}),
    },
    owner: { email: `rep-${etiqueta}-${mark}@example.test`, password: 'S3cret-passw0rd', displayName: 'Ana Paz Rojas' },
  };
  return { cuerpo, ...(await post(cuerpo)) };
}

// Laboratorio unipersonal, sin constitución ni poder, sin gerencias.
let r = await alta({ etiqueta: 'LAB', tipo: 'DU_TYPE_LAB', modalidades: ['DU_MODALITY_LAB'], entidad: 'UNIPERSONAL', conConstitucion: false, gerencias: false });
check('laboratorio unipersonal (cuerpo del front) = 201', r.status === 201, `status=${r.status} ${r.status === 201 ? '' : JSON.stringify(r.body)}`);
if (r.status === 201) {
  console.log('     SELECT unidad:', psql(`select u.diagnostic_unit_type_concept_id = '${catalogo.tipoDeUnidad.get('DU_TYPE_LAB')}', (select count(*) from diagnostic_units.diagnostic_study_offerings o where o.diagnostic_unit_id=u.id) from diagnostic_units.diagnostic_units u where u.id='${r.body.diagnosticUnitId}'`));
  console.log('     SELECT representante (persona vinculada al tenant):', psql(`select count(*) from directory.tenant_legal_representatives where tenant_id='${r.body.tenantId}'`));
  const login = await fetch(`${BASE}/iam/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: r.cuerpo.owner.email, password: 'S3cret-passw0rd' }) });
  check('el dueño inicia sesión', login.status === 200, `status=${login.status}`);
}

// Centro de imágenes SRL con los seis papeles, dos modalidades y las tres gerencias.
r = await alta({ etiqueta: 'IMG', tipo: 'DU_TYPE_IMAGING', modalidades: ['DU_MODALITY_CT', 'DU_MODALITY_MRI'], entidad: 'SRL', conConstitucion: true, gerencias: true });
check('imagenología SRL con seis papeles y gerencias = 201', r.status === 201, `status=${r.status} ${r.status === 201 ? '' : JSON.stringify(r.body)}`);
if (r.status === 201) {
  console.log('     SELECT ofertas:', psql(`select count(*) from diagnostic_units.diagnostic_study_offerings where diagnostic_unit_id='${r.body.diagnosticUnitId}'`));
  console.log('     representantes registrados:', r.body.representativesRegistered);
}

// SRL sin constitución: el front lo frena antes; si llegara, la API responde 422.
const sinConst = await alta({ etiqueta: 'SRL', tipo: 'DU_TYPE_LAB', modalidades: ['DU_MODALITY_LAB'], entidad: 'SRL', conConstitucion: false, gerencias: false });
check('SRL sin constitución (rechazo de la API) = 422', sinConst.status === 422, `status=${sinConst.status}`);

console.log(fails === 0 ? 'TODO PASS' : `FALLAS: ${fails}`);
process.exit(fails === 0 ? 0 : 1);
