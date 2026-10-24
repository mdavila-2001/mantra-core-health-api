#!/usr/bin/env node
/**
 * register-insurance-carriers.mjs — da de alta aseguradoras bolivianas por el
 * alta pública REAL (`POST /iam/auth/register-organization`, tipo `PAYER`) y
 * deja **credenciales que sirven para iniciar sesión**.
 *
 * Qué es real y qué inventa faker
 * -------------------------------
 * La identidad de la compañía sale del listado del stakeholder, no de faker:
 * razón social, sigla, NIT y domicilio se leen de
 * `src/common/seed/data/bolivia/insurance-carriers.dataset.json`, que es el
 * mismo archivo del que come el sembrador de arranque. Regla 00.8: no se
 * inventan aseguradoras.
 *
 * Faker aporta SÓLO lo que el listado no trae y el formulario exige, que son
 * personas y contactos: el owner de la cuenta, el representante legal y las
 * tres gerencias (general, comercial y marketing), con sus correos y teléfonos.
 * Esos datos son de prueba y se ven como tales — el dominio de los correos es
 * `@ejemplo-alovida.test`, que no existe ni puede recibir nada.
 *
 * El duplicado que este script NO puede evitar, y hay que saberlo
 * ---------------------------------------------------------------
 * `bolivia-insurance-seed.service.ts` ya siembra las 17 compañías como
 * organizaciones PAYER **sin cuenta**, y su propio comentario dice que existen
 * para que el alta real las *reclame* en vez de duplicarlas. Ese reclamo NO
 * está implementado: el alta responde **409** si el código ya existe, y
 * `insurance.insurance_carriers.carrier_code` es único. Así que registrar una
 * compañía ya sembrada crea forzosamente una SEGUNDA organización para el
 * mismo NIT.
 *
 * Para que eso sea visible y no un accidente, la organización dada de alta acá
 * lleva el código canónico con sufijo `_SIGNUP`. Por eso el default es UNA sola
 * compañía (`--limit`): con una alcanza para tener login de aseguradora, y
 * clonar las diecisiete ensuciaría el catálogo que se acaba de desduplicar.
 *
 * Disciplina cache-first (igual que `faker-worker.mjs`)
 * ----------------------------------------------------
 * Antes de registrar nada intenta iniciar sesión con la primera cuenta de la
 * corrida anterior contra el MISMO target. Si entra, no registra una fila más
 * e informa lo cacheado. La caché vive en `.faker-cache/carriers-<hash>.json`,
 * fuera del repo, y guarda correos y códigos — la contraseña no.
 *
 * Uso
 * ---
 *   node tools/alovida/register-insurance-carriers.mjs
 *   node tools/alovida/register-insurance-carriers.mjs --limit 3
 *   node tools/alovida/register-insurance-carriers.mjs --all
 *   node tools/alovida/register-insurance-carriers.mjs --only BO_ASEG_UNIVIDA_S_A
 *   CARRIER_API_BASE_URL=http://localhost:3000 FAKER_FORCE=1 node tools/alovida/register-insurance-carriers.mjs
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fakerES_MX as faker } from '@faker-js/faker';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(HERE, '.faker-cache');
const DATASET = resolve(
  HERE,
  '../../src/common/seed/data/bolivia/insurance-carriers.dataset.json',
);

const API_BASE_URL =
  process.env.CARRIER_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3000';
const FORCE = process.env.FAKER_FORCE === '1';
/**
 * Contraseña compartida de los entornos de prueba del proyecto: `12345678`.
 * Son exactamente los 8 caracteres que exige el DTO (`@MinLength(8)`), así que
 * si algún día sube el mínimo, esto es lo primero que hay que cambiar.
 */
const PASSWORD = process.env.CARRIER_PASSWORD ?? '12345678';
/** Dominio inexistente a propósito: ningún correo de prueba puede salir a la red. */
const MAIL_DOMAIN = 'ejemplo-alovida.test';
/** Sufijo del código: hace obvio, al leer la tabla, cuál nació de un alta y cuál del padrón. */
const SIGNUP_SUFFIX = '_SIGNUP';

/**
 * Pausa entre altas, en milisegundos.
 *
 * `POST /iam/auth/register-organization` está limitado a **10 por minuto**
 * (`@Throttle` del controlador): las diecisiete seguidas se caen con 429 a la
 * mitad. Una cada 7 s entra cómoda por debajo del límite y la tanda completa
 * tarda unos dos minutos.
 */
const PAUSA_MS = Number(process.env.CARRIER_DELAY_MS ?? 7000);

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

function parseArgs(argv) {
  const args = { limit: 1, all: false, only: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--all') args.all = true;
    else if (argv[i] === '--limit') args.limit = Number(argv[i + 1]);
    else if (argv[i] === '--only') args.only = argv[i + 1];
  }
  if (!Number.isFinite(args.limit) || args.limit < 1) args.limit = 1;
  return args;
}

/** Semilla estable por target: dos corridas contra la misma base generan lo mismo. */
function seedFaker(target) {
  const hash = createHash('sha256').update(target).digest();
  faker.seed(hash.readUInt32BE(0));
}

function cacheFile(target) {
  const hash = createHash('sha256').update(target).digest('hex').slice(0, 12);
  return resolve(CACHE_DIR, `carriers-${hash}.json`);
}

function readCache(target) {
  const file = cacheFile(target);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(target, payload) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile(target), JSON.stringify(payload, null, 2), 'utf8');
}

async function api(path, { method = 'POST', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: response.status, body: parsed };
}

/**
 * Un PDF mínimo pero válido para el poder notariado.
 *
 * El alta exige `powerOfAttorneyFileId`: un archivo YA subido. No se copia un
 * documento real de nadie — se arma un PDF de una página que dice, en letras,
 * que es un documento de prueba.
 */
function testPdf(legalName) {
  const texto = `DOCUMENTO DE PRUEBA - ${legalName}`.replace(/[()\\]/g, ' ');
  const contenido = `BT /F1 11 Tf 56 760 Td (${texto}) Tj ET`;
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R '
      + '/Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objetos.forEach((cuerpo, indice) => {
    offsets.push(pdf.length);
    pdf += `${indice + 1} 0 obj\n${cuerpo}\nendobj\n`;
  });
  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

async function uploadPowerOfAttorney(legalName, code) {
  const form = new FormData();
  form.append(
    'file',
    new Blob([testPdf(legalName)], { type: 'application/pdf' }),
    `poder-${code.toLowerCase()}.pdf`,
  );
  const response = await fetch(`${API_BASE_URL}/iam/auth/upload-registration-document`, {
    method: 'POST',
    body: form,
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, fileId: body?.fileId ?? body?.id ?? null, body };
}

/** Correo de prueba derivado del nombre: legible y sin acentos. */
function mailbox(nombre, code) {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');
  const slug = code.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
  return `${base}.${slug}@${MAIL_DOMAIN}`;
}

function persona() {
  const nombre = faker.person.firstName();
  const apellido = faker.person.lastName();
  return { nombre, apellido, fullName: `${nombre} ${apellido}` };
}

/** Celular boliviano de prueba: prefijo real del país, número generado. */
function telefono() {
  return `+591 ${faker.number.int({ min: 6_000_0000, max: 7_999_9999 })}`;
}

/** Cédula de prueba con extensión departamental, como la pide el formulario. */
function cedula() {
  const extension = faker.helpers.arrayElement(['SC', 'LP', 'CB', 'OR', 'PT', 'TJ', 'BE', 'PA', 'CH']);
  return `${faker.number.int({ min: 1_000_000, max: 9_999_999 })} ${extension}`;
}

function contacto(code) {
  const quien = persona();
  return { fullName: quien.fullName, phone: telefono(), email: mailbox(quien.fullName, code) };
}

/**
 * La sigla del contrato admite 20 caracteres y las del listado llegan a 45
 * («BISA Seguros y Reaseguros S.A.»). Se recorta por palabras, sin inventar
 * una sigla que la compañía no use.
 */
const CONECTORES = new Set(['y', 'de', 'del', 'la', 'las', 'los', 'e']);

function siglaCorta(sigla) {
  if (sigla.length <= 20) return sigla;
  const palabras = [];
  for (const palabra of sigla.split(' ')) {
    if ([...palabras, palabra].join(' ').length > 20) break;
    palabras.push(palabra);
  }
  // Sin esto quedaban recortes colgados de una conjunción («BISA Seguros y»).
  while (palabras.length > 1 && CONECTORES.has(palabras[palabras.length - 1].toLowerCase())) {
    palabras.pop();
  }
  return palabras.join(' ') || sigla.slice(0, 20);
}

function payloadDe(carrier, powerOfAttorneyFileId) {
  const code = `${carrier.code}${SIGNUP_SUFFIX}`;
  const owner = persona();
  const representante = persona();
  return {
    organization: {
      code,
      legalName: carrier.razonSocial,
      tradeName: carrier.sigla,
      tenantType: 'PAYER',
      legalEntityType: /\bS\.?A\.?$/i.test(carrier.razonSocial) ? 'SA' : undefined,
      timeZone: 'America/La_Paz',
      payer: {
        carrierCode: code,
        sigla: siglaCorta(carrier.sigla),
        address: carrier.direccion.slice(0, 300),
        regulatorIdentifier: carrier.nit,
      },
      executives: {
        generalManager: contacto(carrier.code),
        commercialManager: contacto(carrier.code),
        marketingManager: contacto(carrier.code),
      },
      ...(powerOfAttorneyFileId
        ? {
            legalRepresentative: {
              fullName: representante.fullName,
              idNumber: cedula(),
              email: mailbox(representante.fullName, carrier.code),
              phone: telefono(),
              powerOfAttorneyFileId,
            },
          }
        : {}),
    },
    owner: {
      email: mailbox(owner.fullName, code),
      password: PASSWORD,
      name: owner.nombre,
      lastName: owner.apellido,
      displayName: `${owner.fullName} — ${siglaCorta(carrier.sigla)}`,
      timeZone: 'America/La_Paz',
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = API_BASE_URL;
  seedFaker(target);

  const dataset = JSON.parse(readFileSync(DATASET, 'utf8')).datos;
  let elegidas = dataset;
  if (args.only) elegidas = dataset.filter((c) => c.code === args.only);
  else if (!args.all) elegidas = dataset.filter((c) => c.ofreceSalud).slice(0, args.limit);
  if (elegidas.length === 0) {
    console.error(`No hay aseguradoras que coincidan (¿código correcto en --only?).`);
    process.exitCode = 1;
    return;
  }

  console.log(`Target        : ${target}`);
  console.log(`Aseguradoras  : ${elegidas.length} de ${dataset.length} del listado`);

  const cache = FORCE ? null : readCache(target);
  if (cache?.cuentas?.length) {
    const prueba = cache.cuentas[0];
    const login = await api('/iam/auth/login', {
      body: { email: prueba.email, password: PASSWORD },
    });
    if (login.status === 200 || login.status === 201) {
      console.log('\nCACHÉ: la tanda anterior sigue viva contra este target, no se registra nada.');
      for (const cuenta of cache.cuentas) {
        console.log(`  ${cuenta.code.padEnd(58)} ${cuenta.email}`);
      }
      console.log(`\nContraseña de todas: ${PASSWORD}`);
      console.log('Para forzar una tanda nueva: FAKER_FORCE=1');
      return;
    }
    console.log(`\nCACHÉ inválida (login dio ${login.status}); se registra de cero.`);
  }

  const cuentas = [];
  const fallos = [];
  const yaExistian = [];
  let primera = true;
  for (const carrier of elegidas) {
    if (!primera) await esperar(PAUSA_MS);
    primera = false;
    const subida = await uploadPowerOfAttorney(carrier.razonSocial, carrier.code);
    if (!subida.fileId) {
      console.log(`  aviso: ${carrier.sigla} — el poder no se pudo subir (${subida.status}); `
        + 'se registra sin representante legal');
    }
    const payload = payloadDe(carrier, subida.fileId);
    let alta = await api('/iam/auth/register-organization', { body: payload });
    // 429: se pasó el límite igual (otra cosa golpeando la API). Se espera el
    // resto del minuto y se reintenta UNA vez; si vuelve a fallar, se informa.
    if (alta.status === 429) {
      console.log(`  429      ${payload.organization.code} — esperando 60 s y reintentando`);
      await esperar(60_000);
      alta = await api('/iam/auth/register-organization', { body: payload });
    }
    // 409: ya estaba dada de alta por una corrida anterior. No es un fallo: la
    // credencial sirve igual, así que entra en la tabla como las demás.
    if (alta.status === 409) {
      yaExistian.push(payload.organization.code);
      console.log(`  ya está  ${payload.organization.code.padEnd(58)} ${payload.owner.email}`);
      cuentas.push({
        code: payload.organization.code,
        nit: carrier.nit,
        email: payload.owner.email,
        legalName: carrier.razonSocial,
        conRepresentante: Boolean(subida.fileId),
      });
      continue;
    }
    if (alta.status === 201 || alta.status === 200) {
      cuentas.push({
        code: payload.organization.code,
        nit: carrier.nit,
        email: payload.owner.email,
        legalName: carrier.razonSocial,
        conRepresentante: Boolean(subida.fileId),
      });
      console.log(`  alta OK  ${payload.organization.code.padEnd(58)} ${payload.owner.email}`);
    } else {
      fallos.push({ code: payload.organization.code, status: alta.status, body: alta.body });
      console.log(`  FALLÓ    ${payload.organization.code.padEnd(58)} HTTP ${alta.status}`);
    }
  }

  if (cuentas.length) writeCache(target, { target, generado: new Date().toISOString(), cuentas });

  console.log(`\nAltas: ${cuentas.length - yaExistian.length} nuevas · ${yaExistian.length} ya existían · fallos: ${fallos.length}`);
  if (cuentas.length) {
    console.log(`Contraseña de todas: ${PASSWORD}`);
    console.log('Entrar con el CORREO del owner en el login de la app.');
  }
  for (const fallo of fallos) {
    console.log(`  ${fallo.code}: HTTP ${fallo.status} — ${JSON.stringify(fallo.body).slice(0, 220)}`);
  }
  if (fallos.length) process.exitCode = 1;
}

await main();
