// H2 · matriz del alta de organización por API: válido / límite / error.
// Uso:  API=http://localhost:3000 node h2-matriz-api.mjs            (matriz completa)
//       API=http://localhost:3000 MODE=kill node h2-matriz-api.mjs   (sólo el alta válida: kill-test)
// Todos los datos son sintéticos y únicos por corrida. El PDF es mínimo y generado acá.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.API ?? 'http://localhost:3000';
const MODE = process.env.MODE ?? 'full';
const SALIDA = process.env.SALIDA ?? join(dirname(fileURLToPath(import.meta.url)), 'h2-matriz-api.resultado.md');
const PG = process.env.PG_CONTAINER ?? 'verif-afil-postgres-1';
const MARCA = Math.random().toString(16).slice(2, 8).toUpperCase();
const LIMITE_ARCHIVO = 10 * 1024 * 1024;
// Contraseña sintética distinta en cada corrida: no hay ningún secreto literal en el repositorio.
const CLAVE_DE_PRUEBA = `Pr-${MARCA}-${Math.random().toString(36).slice(2, 8)}`;

const filas = [];
let serverErrors = 0;

const psql = (sql) => {
  try {
    return execFileSync('docker', ['exec', PG, 'psql', '-U', 'mantra', '-d', 'mantra_verif', '-tAc', sql], {
      encoding: 'utf8',
    }).trim();
  } catch (e) {
    return `(psql error: ${String(e.stderr ?? e.message).trim().split('\n')[0]})`;
  }
};

/** PDF válido mínimo; `relleno` agrega bytes dentro de un comentario para fijar el tamaño exacto. */
function pdf(relleno = 0) {
  const base =
    '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n';
  const buf = Buffer.from(base);
  if (relleno <= 0) return buf;
  return Buffer.concat([buf, Buffer.from('%'), Buffer.alloc(relleno - 1, 0x78)]);
}

async function subir(nombre, bytes = pdf(), tipo = 'application/pdf') {
  const fd = new FormData();
  fd.append('file', new Blob([bytes], { type: tipo }), nombre);
  const r = await fetch(`${API}/iam/auth/upload-registration-document`, { method: 'POST', body: fd });
  if (r.status >= 500) serverErrors += 1;
  let cuerpo = {};
  try {
    cuerpo = await r.json();
  } catch {
    /* sin cuerpo */
  }
  return { status: r.status, fileId: cuerpo.fileId, cuerpo };
}

async function post(ruta, cuerpo) {
  const r = await fetch(`${API}${ruta}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  if (r.status >= 500) serverErrors += 1;
  const texto = await r.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    json = texto;
  }
  return { status: r.status, cuerpo: json };
}

/** Sube los 6 PDF de una alta (5 de la empresa + el poder). */
async function juegoDeArchivos(etiqueta) {
  const ids = {};
  for (const clave of ['constitution', 'taxIdentifier', 'commerceRegistry', 'operatingLicense', 'healthAuthorityCertificate', 'powerOfAttorney']) {
    const r = await subir(`${etiqueta}-${clave}.pdf`);
    if (r.status !== 201) throw new Error(`no se pudo subir ${clave}: ${r.status}`);
    ids[clave] = r.fileId;
  }
  return ids;
}

const gerente = (n) => ({ name: n, lastName: 'Prueba', phone: '70000000', email: `${n.toLowerCase()}.${MARCA.toLowerCase()}@alovida.test` });

/** Cuerpo de una aseguradora (PAYER, SA), idéntico al que arma el front. */
async function cuerpoAseguradora(etiqueta, cambios = {}) {
  const a = await juegoDeArchivos(etiqueta);
  const cuerpo = {
    organization: {
      code: `${etiqueta}${MARCA}`,
      legalName: `Aseguradora ${etiqueta} ${MARCA} S.A.`,
      legalEntityType: 'SA',
      tenantType: 'PAYER',
      timeZone: 'America/La_Paz',
      payer: {
        carrierCode: `${etiqueta}${MARCA}`,
        regulatorIdentifier: `APS-${MARCA}-${etiqueta}`,
        sigla: `${etiqueta}${MARCA}`.slice(0, 12),
        address: 'Av. San Martín 1200, Santa Cruz',
      },
      legalDocuments: {
        constitutionFileId: a.constitution,
        taxIdentifierFileId: a.taxIdentifier,
        commerceRegistryFileId: a.commerceRegistry,
        operatingLicenseFileId: a.operatingLicense,
        healthAuthorityCertificateFileId: a.healthAuthorityCertificate,
      },
      legalRepresentative: {
        fullName: `Representante ${etiqueta}`,
        idNumber: `${MARCA}${etiqueta}9`.slice(0, 20),
        email: `rep.${etiqueta.toLowerCase()}.${MARCA.toLowerCase()}@alovida.test`,
        powerOfAttorneyFileId: a.powerOfAttorney,
      },
      executives: { generalManager: gerente('Gerardo'), commercialManager: gerente('Camila'), marketingManager: gerente('Mario') },
    },
    owner: {
      email: `dueno.${etiqueta.toLowerCase()}.${MARCA.toLowerCase()}@alovida.test`,
      password: CLAVE_DE_PRUEBA,
      displayName: `Dueño ${etiqueta}`,
    },
  };
  return cambios.aplicar ? cambios.aplicar(cuerpo, a) : cuerpo;
}

function registrar(escenario, caso, esperado, real, detalle = '') {
  const ok = Array.isArray(esperado) ? esperado.includes(real) : esperado === real;
  filas.push({ escenario, caso, esperado: Array.isArray(esperado) ? esperado.join('|') : esperado, real, ok, detalle });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${escenario}] ${caso} · esperado ${esperado} · real ${real}${detalle ? ' · ' + detalle : ''}`);
}

const mensaje = (r) => String(typeof r.cuerpo === 'string' ? r.cuerpo : (r.cuerpo?.message ?? JSON.stringify(r.cuerpo))).slice(0, 140);

async function kill() {
  const r = await post('/iam/auth/register-organization', await cuerpoAseguradora('KILL'));
  console.log(`KILL-TEST alta de aseguradora -> ${r.status} ${mensaje(r)} ${r.status === 422 ? JSON.stringify(r.cuerpo?.details ?? '') : ''}`);
  process.exit(0);
}

async function matriz() {
  /* ── VÁLIDO ───────────────────────────────────────────────────────────── */
  const v1 = await post('/iam/auth/register-organization', await cuerpoAseguradora('V1'));
  registrar('válido', 'aseguradora SA completa (5 PDF + poder + 3 gerencias)', 201, v1.status, v1.status === 201 ? '' : mensaje(v1));
  if (v1.status === 201) {
    const tenant = v1.cuerpo.tenantId;
    const docs = psql(`select count(*) from directory.tenant_affiliation_documents where tenant_id='${tenant}'`);
    registrar('válido', 'quedaron 6 documentos de afiliación (5 + poder) en la base', '6', docs);
    const estados = psql(`select string_agg(distinct c.code, ',') from directory.tenant_affiliation_documents d join terminology.catalog_concepts c on c.id=d.verification_status_concept_id where d.tenant_id='${tenant}'`);
    registrar('válido', 'todos nacen con estado PENDIENTE', 'PENDIENTE', estados);
    const login = await post('/iam/auth/login', { email: `dueno.v1.${MARCA.toLowerCase()}@alovida.test`, password: CLAVE_DE_PRUEBA });
    registrar('válido', 'el dueño inicia sesión', 200, login.status, login.status === 200 ? '' : mensaje(login));
  }

  const v2 = await post(
    '/iam/auth/register-organization',
    await cuerpoAseguradora('V2', {
      aplicar: (c) => {
        c.organization.legalEntityType = 'UNIPERSONAL';
        delete c.organization.legalDocuments.constitutionFileId;
        delete c.organization.legalRepresentative.powerOfAttorneyFileId;
        return c;
      },
    }),
  );
  registrar('válido', 'UNIPERSONAL sin escritura de constitución ni poder', 201, v2.status, v2.status === 201 ? '' : mensaje(v2));
  if (v2.status === 201) {
    registrar('válido', 'UNIPERSONAL: 4 documentos en la base', '4', psql(`select count(*) from directory.tenant_affiliation_documents where tenant_id='${v2.cuerpo.tenantId}'`));
  }

  /* ── LÍMITE ───────────────────────────────────────────────────────────── */
  const largo = (n) => 'L'.repeat(n);
  for (const [largoCodigo, esperado, nota] of [[3, 201, 'mínimo'], [100, 201, 'máximo'], [2, 400, 'bajo el mínimo'], [101, 400, 'sobre el máximo']]) {
    const etiqueta = `LC${largoCodigo}`;
    const c = await cuerpoAseguradora(etiqueta, {
      aplicar: (x) => {
        // Único por corrida (la base conserva las altas anteriores) y del largo exacto del caso.
        x.organization.code = (MARCA + largo(largoCodigo)).slice(0, largoCodigo);
        x.organization.payer.carrierCode = `C${MARCA}${largoCodigo}`;
        x.organization.payer.regulatorIdentifier = `APS-${MARCA}-${largoCodigo}`;
        x.organization.payer.sigla = `S${MARCA}${largoCodigo}`.slice(0, 12);
        return x;
      },
    });
    const r = await post('/iam/auth/register-organization', c);
    registrar('límite', `código de organización de ${largoCodigo} caracteres (${nota})`, esperado, r.status, esperado === 201 ? '' : mensaje(r));
  }
  for (const [largoNombre, esperado] of [[300, 201], [301, 400]]) {
    const c = await cuerpoAseguradora(`LN${largoNombre}`, {
      aplicar: (x) => {
        x.organization.legalName = `N${MARCA}`.padEnd(largoNombre, 'n');
        return x;
      },
    });
    const r = await post('/iam/auth/register-organization', c);
    registrar('límite', `razón social de ${largoNombre} caracteres`, esperado, r.status, esperado === 201 ? '' : mensaje(r));
  }
  for (const [largoClave, esperado] of [[8, 201], [7, 400]]) {
    const c = await cuerpoAseguradora(`LK${largoClave}`, {
      aplicar: (x) => {
        x.owner.password = 'k'.repeat(largoClave);
        return x;
      },
    });
    const r = await post('/iam/auth/register-organization', c);
    registrar('límite', `contraseña de ${largoClave} caracteres`, esperado, r.status, esperado === 201 ? '' : mensaje(r));
  }
  const justo = await subir('justo.pdf', pdf(LIMITE_ARCHIVO - pdf().length));
  registrar('límite', `PDF de exactamente ${LIMITE_ARCHIVO} bytes`, 201, justo.status);
  const pasado = await subir('pasado.pdf', pdf(LIMITE_ARCHIVO - pdf().length + 1));
  registrar('límite', 'PDF de 1 byte sobre el máximo', [413, 422], pasado.status);

  /* ── ERROR ────────────────────────────────────────────────────────────── */
  const dup = await cuerpoAseguradora('ED');
  const d1 = await post('/iam/auth/register-organization', dup);
  const dup2 = await cuerpoAseguradora('ED2', {
    aplicar: (x) => {
      x.organization.code = dup.organization.code;
      x.organization.payer.carrierCode = `X${MARCA}ED2`;
      x.organization.payer.regulatorIdentifier = `APS-${MARCA}-ED2`;
      x.organization.payer.sigla = `X${MARCA}D2`.slice(0, 12);
      return x;
    },
  });
  registrar('error', 'preparación: la primera alta con ese código', 201, d1.status);
  registrar('error', 'código de organización repetido', 409, (await post('/iam/auth/register-organization', dup2)).status);
  const mail = await cuerpoAseguradora('EM', { aplicar: (x) => ((x.owner.email = dup.owner.email), x) });
  registrar('error', 'correo del dueño repetido', 409, (await post('/iam/auth/register-organization', mail)).status);
  registrar(
    'error',
    'SA sin escritura de constitución',
    422,
    (await post('/iam/auth/register-organization', await cuerpoAseguradora('E1', { aplicar: (x) => (delete x.organization.legalDocuments.constitutionFileId, x) }))).status,
  );
  registrar(
    'error',
    'SA sin poder del representante',
    422,
    (await post('/iam/auth/register-organization', await cuerpoAseguradora('E2', { aplicar: (x) => (delete x.organization.legalRepresentative.powerOfAttorneyFileId, x) }))).status,
  );
  registrar(
    'error',
    'el mismo archivo en dos documentos',
    422,
    (await post('/iam/auth/register-organization', await cuerpoAseguradora('E3', { aplicar: (x) => ((x.organization.legalDocuments.taxIdentifierFileId = x.organization.legalDocuments.constitutionFileId), x) }))).status,
  );
  registrar(
    'error',
    'archivo ya vinculado a otra organización',
    422,
    (await post('/iam/auth/register-organization', await cuerpoAseguradora('E4', { aplicar: (x) => ((x.organization.legalDocuments.constitutionFileId = dup.organization.legalDocuments.constitutionFileId), x) }))).status,
  );
  registrar(
    'error',
    'fileId que no existe (en la vía anónima el contrato es 422, attachable-file.service.ts:213)',
    422,
    (await post('/iam/auth/register-organization', await cuerpoAseguradora('E5', { aplicar: (x) => ((x.organization.legalDocuments.constitutionFileId = randomUUID()), x) }))).status,
  );
  registrar(
    'error',
    'aseguradora (PAYER) sin el bloque payer',
    422,
    (await post('/iam/auth/register-organization', await cuerpoAseguradora('E6', { aplicar: (x) => (delete x.organization.payer, x) }))).status,
  );
  registrar(
    'error',
    'tenantType inexistente',
    400,
    (await post('/iam/auth/register-organization', await cuerpoAseguradora('E7', { aplicar: (x) => ((x.organization.tenantType = 'NO_EXISTE'), x) }))).status,
  );
  registrar(
    'error',
    'correo del dueño mal formado',
    400,
    (await post('/iam/auth/register-organization', await cuerpoAseguradora('E8', { aplicar: (x) => ((x.owner.email = 'no-es-un-correo'), x) }))).status,
  );
  registrar('error', 'cuerpo vacío', 400, (await post('/iam/auth/register-organization', {})).status);
  registrar('error', 'archivo de texto que dice ser PDF', 422, (await subir('falso.pdf', Buffer.from('esto no es un pdf'))).status);
  registrar('error', 'archivo vacío', [400, 422], (await subir('vacio.pdf', Buffer.alloc(0))).status);
  registrar('error', 'imagen subida como documento', 422, (await subir('foto.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png')).status);

  registrar('transversal', 'ninguna respuesta 5xx en toda la matriz', '0', String(serverErrors));

  const fallos = filas.filter((f) => !f.ok).length;
  const md = [
    `# Matriz del alta de organización por API — corrida ${MARCA}`,
    '',
    `Resultado: **${filas.length - fallos} PASS / ${fallos} FAIL** de ${filas.length}.`,
    '',
    '| Escenario | Caso | Esperado | Real | OK | Detalle |',
    '|---|---|---|---|---|---|',
    ...filas.map((f) => `| ${f.escenario} | ${f.caso} | ${f.esperado} | ${f.real} | ${f.ok ? 'PASS' : '**FAIL**'} | ${f.detalle.replace(/\|/g, '/')} |`),
    '',
  ].join('\n');
  writeFileSync(SALIDA, md);
  console.log(`\n== ${filas.length - fallos} PASS / ${fallos} FAIL == escrito en ${SALIDA}`);
  process.exit(fallos ? 1 : 0);
}

await (MODE === 'kill' ? kill() : matriz());
