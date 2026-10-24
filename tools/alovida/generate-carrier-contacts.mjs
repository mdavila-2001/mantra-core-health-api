#!/usr/bin/env node
/**
 * generate-carrier-contacts.mjs — genera con faker las personas de contacto que
 * el listado de aseguradoras NO trae y el modelo sí exige: por cada una de las
 * 17 compañías, su representante legal y sus tres gerencias (general, comercial
 * y marketing). Son 17 × 4 = 68 personas.
 *
 * Por qué un archivo y no faker dentro del generador
 * --------------------------------------------------
 * `gen_seeds.py` tiene que ser **determinista**: dos corridas producen bytes
 * idénticos, y el paquete se revisa en un PR. Si llamara a faker en cada
 * corrida, los nombres cambiarían solos y el diff sería ruido puro. Acá faker
 * corre UNA vez con semilla fija, el resultado queda en un JSON versionado —
 * revisable, diffeable— y el generador lo lee como lee el listado real.
 *
 * Qué es inventado y se nota
 * --------------------------
 * Todo lo de este archivo es dato de prueba y está rotulado como tal: los
 * correos van al dominio `ejemplo-alovida.test`, que no existe y no puede
 * recibir nada (regla 00.8: no se hacen pasar por datos reales). La identidad
 * de la COMPAÑÍA —razón social, NIT, domicilio— nunca sale de acá: sale del
 * listado del stakeholder.
 *
 * Uso
 * ---
 *   node tools/alovida/generate-carrier-contacts.mjs
 *   (escribe mantra-core-health-model/salud-db/data/carrier-contacts.dataset.json)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fakerES_MX as faker } from '@faker-js/faker';

const HERE = dirname(fileURLToPath(import.meta.url));
const CARRIERS = resolve(HERE, '../../src/common/seed/data/bolivia/insurance-carriers.dataset.json');
const SALIDA = resolve(
  HERE,
  '../../../mantra-core-health-model/salud-db/data/carrier-contacts.dataset.json',
);

/** Dominio inexistente a propósito: ningún correo de prueba puede salir a la red. */
const DOMINIO = 'ejemplo-alovida.test';

/**
 * Los cuatro roles, con el código del value set `VS_LEGAL_REPRESENTATIVE_ROLE`.
 * El orden importa: fija qué persona le toca a cada rol y hace estable el archivo.
 */
const ROLES = [
  { rol: 'REPRESENTANTE_LEGAL', etiqueta: 'Representante legal' },
  { rol: 'GERENTE_GENERAL', etiqueta: 'Gerencia general' },
  { rol: 'GERENTE_COMERCIAL', etiqueta: 'Gerencia comercial' },
  { rol: 'GERENTE_MARKETING', etiqueta: 'Gerencia de marketing' },
];

/** Extensiones departamentales del carnet boliviano, para la cédula del representante. */
const EXTENSIONES = ['SC', 'LP', 'CB', 'OR', 'PT', 'TJ', 'BE', 'PA', 'CH'];

/** Semilla fija: el archivo se regenera igual, hoy y dentro de un año. */
faker.seed(4221);

function sinAcentos(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

/** Buzón legible y único: nombre + código corto de la compañía. */
function correo(nombre, apellido, code) {
  const empresa = code
    .replace(/^BO_ASEG_/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')
    .slice(0, 28);
  return `${sinAcentos(nombre)}.${sinAcentos(apellido)}.${empresa}@${DOMINIO}`;
}

/** Celular boliviano: prefijo real del país, número de prueba (8 dígitos, 6 o 7 inicial). */
function celular() {
  return `+591 ${faker.helpers.arrayElement([6, 7])}${faker.string.numeric(7)}`;
}

/** Cédula de identidad de prueba con su extensión departamental. */
function cedula() {
  return `${faker.number.int({ min: 1_000_000, max: 9_999_999 })} ${faker.helpers.arrayElement(EXTENSIONES)}`;
}

/**
 * Un solo tramo, con la inicial en mayúscula.
 *
 * `fakerES_MX` devuelve apellidos compuestos («Limón de Ojeda») y alguno en
 * minúscula, y encadenar dos daba nombres de cuatro tramos que no se parecen a
 * lo que carga un formulario. Se toma el primer tramo y se normaliza.
 */
function tramo(valor) {
  const palabra = valor.trim().split(/\s+/)[0];
  return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
}

const carriers = JSON.parse(readFileSync(CARRIERS, 'utf8')).datos;
const contactos = [];
for (const carrier of carriers) {
  for (const { rol, etiqueta } of ROLES) {
    const nombre = tramo(faker.person.firstName());
    const segundoNombre = tramo(faker.person.firstName());
    const apellido = tramo(faker.person.lastName());
    const apellidoMaterno = tramo(faker.person.lastName());
    contactos.push({
      carrierCode: carrier.code,
      rol,
      etiqueta,
      nombre,
      segundoNombre,
      apellido,
      apellidoMaterno,
      nombreCompleto: `${nombre} ${apellido} ${apellidoMaterno}`,
      email: correo(nombre, apellido, carrier.code),
      celular: celular(),
      // Sólo el representante legal declara cédula: es el único al que el
      // modelo le reserva `ci_identifier_id`.
      cedula: rol === 'REPRESENTANTE_LEGAL' ? cedula() : null,
    });
  }
}

const salida = {
  _nota:
    'Personas de contacto de las aseguradoras (representante legal + 3 gerencias). '
    + 'DATOS DE PRUEBA generados con @faker-js/faker, semilla 4221, dominio de correo '
    + 'inexistente. La identidad de la compañía NO sale de acá. '
    + 'Regenerar con: node tools/alovida/generate-carrier-contacts.mjs (mantra-core-health-api).',
  generado: '2026-09-19',
  roles: ROLES.map((r) => r.rol),
  datos: contactos,
};

mkdirSync(dirname(SALIDA), { recursive: true });
writeFileSync(SALIDA, `${JSON.stringify(salida, null, 2)}\n`, 'utf8');
console.log(`${contactos.length} contactos (${carriers.length} aseguradoras × ${ROLES.length} roles)`);
console.log(`escrito: ${SALIDA}`);
