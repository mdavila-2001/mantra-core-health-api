// Pruebas del catálogo universal de medicamentos. Fixtures: filas REALES de las
// fuentes descargadas el 2026-10-01 (CIMA 42991 y 00-2881, ANVISA REIDRIN,
// INVIMA CARDIK 3 160/5/12.5). Correr: node --test tools/terminology-import/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { anvisaToRecord } from '../lib/medicine-catalog/anvisa.mjs';
import { cimaToRecord } from '../lib/medicine-catalog/cima.mjs';
import { isAtcLevel5, normalizeAtc, parseCsv, recordId } from '../lib/medicine-catalog/common.mjs';
import { invimaGroupToRecord } from '../lib/medicine-catalog/invima.mjs';

const WHEN = '2026-10-01T00:00:00.000Z';

const CIMA_ASPIRINA = {
  nregistro: '42991',
  nombre: 'A.A.S. 100 mg COMPRIMIDOS',
  labtitular: 'Laboratorio Stada S.L.',
  estado: { aut: -118458000000 },
  receta: true,
  generico: false,
  fotos: [{ tipo: 'materialas', url: 'https://cima.aemps.es/cima/fotos/thumbnails/materialas/42991/42991_materialas.jpg', fecha: 1748521750000 }],
  viasAdministracion: [{ id: 48, nombre: 'VÍA ORAL' }],
  formaFarmaceutica: { id: 40, nombre: 'COMPRIMIDO' },
  dosis: '100 mg',
  atcs: [
    { codigo: 'B01A', nombre: 'ANTITROMBOTICOS', nivel: 3 },
    { codigo: 'B01AC06', nombre: 'Acido acetilsalicilico', nivel: 5 },
  ],
  principiosActivos: [{ id: 1, codigo: '1A', nombre: 'ACIDO ACETILSALICILICO', cantidad: '100', unidad: 'mg', orden: 1 }],
  presentaciones: [{ cn: '650047', nombre: 'A.A.S. 100 mg COMPRIMIDOS, 30 comprimidos', comerc: true }],
};

test('CIMA: un medicamento autorizado queda vigente, seleccionable y con sólo ATC nivel 5', () => {
  const r = cimaToRecord(CIMA_ASPIRINA, WHEN);
  assert.equal(r.codeSystem, 'cima-medicamentos');
  assert.equal(r.code, '42991');
  assert.equal(r.regulatoryStatus, 'ACTIVE');
  assert.equal(r.selectable, true);
  assert.deepEqual(r.atc, ['B01AC06']);
  assert.equal(r.strengthText, '100 mg');
  assert.equal(r.requiresPrescription, true);
  assert.equal(r.presentations[0].code, '650047');
  assert.equal(r.presentations[0].gtin, null, 'CIMA publica CN, no GTIN: no se inventa');
  assert.match(r.photos[0].url, /\/full\//);
  assert.match(r.photos[0].attribution, /AEMPS · CIMA/);
});

test('CIMA: revocado o suspendido no es seleccionable', () => {
  const revocado = cimaToRecord({ ...CIMA_ASPIRINA, estado: { aut: 1, rev: 2 } }, WHEN);
  const suspendido = cimaToRecord({ ...CIMA_ASPIRINA, estado: { aut: 1, susp: 2 } }, WHEN);
  assert.equal(revocado.regulatoryStatus, 'REVOKED');
  assert.equal(suspendido.regulatoryStatus, 'SUSPENDED');
  assert.equal(revocado.selectable, false);
  assert.equal(suspendido.selectable, false);
});

test('CIMA: lo que la fuente no declara queda en null', () => {
  const r = cimaToRecord({ nregistro: '1', nombre: 'X', estado: { aut: 1 } }, WHEN);
  assert.equal(r.requiresPrescription, null);
  assert.equal(r.generic, null);
  assert.equal(r.holder, null);
  assert.deepEqual(r.atc, []);
});

const ANVISA_ROW = {
  TIPO_PRODUTO: 'MEDICAMENTO',
  NOME_PRODUTO: 'REIDRIN',
  CATEGORIA_REGULATORIA: 'Similar',
  NUMERO_REGISTRO_PRODUTO: '110330045',
  EMPRESA_DETENTORA_REGISTRO: '42493502000141 - SOCIEDADE FARMACÊUTICA HENFER LTDA',
  SITUACAO_REGISTRO: 'Inativo',
  PRINCIPIO_ATIVO: 'glicose, cloreto de sódio + associações, cloreto de potássio, bicarbonato de sódio',
};

test('ANVISA: inactivo no es seleccionable, el titular pierde el CNPJ y no se inventa concentración', () => {
  const r = anvisaToRecord(ANVISA_ROW, WHEN);
  assert.equal(r.regulatoryStatus, 'INACTIVE');
  assert.equal(r.selectable, false);
  assert.equal(r.holder, 'SOCIEDADE FARMACÊUTICA HENFER LTDA');
  assert.equal(r.strengthText, null);
  assert.equal(r.dosageForm, null);
  assert.deepEqual(r.atc, []);
  assert.equal(r.generic, false);
  assert.ok(r.activeIngredients.length >= 4);
});

test('ANVISA: una fila sin nº de registro no tiene identidad y se descarta', () => {
  assert.equal(anvisaToRecord({ ...ANVISA_ROW, NUMERO_REGISTRO_PRODUTO: '' }, WHEN), null);
});

const INVIMA_ROWS = [
  { producto: 'CARDIK ® 3 160/5/12.5', titular: 'LABORATORIOS LEGRAND S.A.', registrosanitario: 'INVIMA 2023M-0013598-R2', estadoregistro: 'Vigente', expedientecum: '20048021', consecutivocum: '14', descripcioncomercial: 'CAJA POR 14 TABLETAS', estadocum: 'Activo', muestramedica: 'No', atc: 'C09DX01', viaadministracion: 'ORAL', principioactivo: 'VALSARTAN', unidadmedida: 'mg', cantidad: '160', formafarmaceutica: 'TABLETA RECUBIERTA' },
  { producto: 'CARDIK ® 3 160/5/12.5', titular: 'LABORATORIOS LEGRAND S.A.', registrosanitario: 'INVIMA 2023M-0013598-R2', estadoregistro: 'Vigente', expedientecum: '20048021', consecutivocum: '14', descripcioncomercial: 'CAJA POR 14 TABLETAS', estadocum: 'Activo', muestramedica: 'No', atc: 'C09DX01', viaadministracion: 'ORAL', principioactivo: 'HIDROCLOROTIAZIDA', unidadmedida: 'mg', cantidad: '12.5', formafarmaceutica: 'TABLETA RECUBIERTA' },
  { producto: 'CARDIK ® 3 160/5/12.5', titular: 'LABORATORIOS LEGRAND S.A.', registrosanitario: 'INVIMA 2023M-0013598-R2', estadoregistro: 'Vigente', expedientecum: '20048021', consecutivocum: '84', descripcioncomercial: 'MUESTRA MEDICA: CAJA POR 4', estadocum: 'Activo', muestramedica: 'Si', atc: 'C09DX01', viaadministracion: 'ORAL', principioactivo: 'VALSARTAN', unidadmedida: 'mg', cantidad: '160', formafarmaceutica: 'TABLETA RECUBIERTA' },
];

test('INVIMA: filas por presentación×ingrediente se agrupan en un producto por registro', () => {
  const r = invimaGroupToRecord(INVIMA_ROWS, WHEN);
  assert.equal(r.code, 'INVIMA 2023M-0013598-R2');
  assert.equal(r.activeIngredients.length, 2);
  assert.deepEqual(r.atc, ['C09DX01']);
  assert.equal(r.strengthText, '160 mg + 12.5 mg');
  assert.equal(r.selectable, true);
});

test('INVIMA: la muestra médica no entra como presentación vendible', () => {
  const r = invimaGroupToRecord(INVIMA_ROWS, WHEN);
  assert.equal(r.presentations.length, 1);
  assert.equal(r.presentations[0].name, 'CAJA POR 14 TABLETAS');
});

test('ids: mismo (codeSystem, code) → mismo uuid; distinta fuente → distinto', () => {
  assert.equal(recordId('cima-medicamentos', '42991'), recordId('cima-medicamentos', '42991'));
  assert.notEqual(recordId('cima-medicamentos', '42991'), recordId('anvisa-medicamentos', '42991'));
});

test('ATC: sólo nivel 5 exacto', () => {
  assert.equal(isAtcLevel5('N02BE01'), true);
  assert.equal(isAtcLevel5('N02BE'), false);
  assert.equal(normalizeAtc(' n02be01 '), 'N02BE01');
  assert.equal(normalizeAtc('N02'), null);
});

test('CSV: comillas, comillas escapadas, saltos de línea y BOM', () => {
  const rows = parseCsv('﻿a;b\n"x;1";"di ""hola"""\n"l1\nl2";z\n', ';');
  assert.deepEqual(rows, [
    { a: 'x;1', b: 'di "hola"' },
    { a: 'l1\nl2', b: 'z' },
  ]);
});

// --- plan de carga -------------------------------------------------------------

import { PROPERTY, planFor, propertiesFor } from '../lib/medicine-catalog/load-plan.mjs';

test('plan de carga: el id del concepto es el id del registro y no se repite entre fuentes', () => {
  const cima = cimaToRecord(CIMA_ASPIRINA, WHEN);
  const plan = planFor('cima-medicamentos', [cima]);
  assert.equal(plan.concepts.length, 1);
  assert.equal(plan.concepts[0][0], cima.id);
  assert.equal(plan.concepts[0][2], '42991');
  assert.equal(plan.codeSystem.canonicalUrl, 'https://mantracore.health/fhir/CodeSystem/cima-medicamentos');
  assert.equal(plan.version.version, '2026-10-01');
});

test('plan de carga: re-generar el plan da exactamente los mismos ids (idempotencia)', () => {
  const a = planFor('cima-medicamentos', [cimaToRecord(CIMA_ASPIRINA, WHEN)]);
  const b = planFor('cima-medicamentos', [cimaToRecord(CIMA_ASPIRINA, WHEN)]);
  assert.deepEqual(a.concepts, b.concepts);
  assert.deepEqual(a.properties, b.properties);
  assert.equal(new Set(a.properties.map((p) => p[0])).size, a.properties.length, 'ids de propiedad únicos');
});

test('propiedades: lo que la fuente no declara no genera fila, y los booleanos van como boolean', () => {
  const anvisa = anvisaToRecord(ANVISA_ROW, WHEN);
  const codes = propertiesFor(anvisa).map((p) => p.code);
  assert.ok(!codes.includes(PROPERTY.STRENGTH), 'ANVISA no trae concentración');
  assert.ok(!codes.includes(PROPERTY.ATC), 'ANVISA no trae ATC');
  assert.ok(!codes.includes(PROPERTY.REQUIRES_PRESCRIPTION), 'ANVISA no declara receta');
  const cima = propertiesFor(cimaToRecord(CIMA_ASPIRINA, WHEN));
  const receta = cima.find((p) => p.code === PROPERTY.REQUIRES_PRESCRIPTION);
  assert.equal(receta.dataType, 'boolean');
  assert.equal(receta.value, true);
  assert.deepEqual(cima.find((p) => p.code === PROPERTY.ATC).value, ['B01AC06']);
});

test('plan de carga: un code system sin definición falla en voz alta', () => {
  assert.throws(() => planFor('fuente-inventada', []), /sin definición de carga/);
});
