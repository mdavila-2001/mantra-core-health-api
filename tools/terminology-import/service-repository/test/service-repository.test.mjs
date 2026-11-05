import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parse as parsePami } from '../lib/adapters/ar-pami-nomenclador.mjs';
import { parse as parseCurado } from '../lib/adapters/mantra-curado.mjs';
import { mergeRecords } from '../build-service-repository.mjs';
import { buildPlan, conceptIdOf } from '../lib/load-plan.mjs';
import { serviceConceptId } from '../../specialty-services/lib/corpus.mjs';

test('PAMI: lee prácticas, excluye internación y convierte el importe', () => {
  const csv = [
    'Módulo;Código de práctica;Descripción de práctica;Valor resultante unidades;;',
    '1;427101;CONSULTA MEDICO DE CABECERA;$ 115,32;;',
    '142;142001;MODULO MENSUAL DE INTERNACION EN CUIDADOS CRONICOS;$ 81.250,00;;',
  ].join('\n');
  const { records, report } = parsePami(csv);
  assert.equal(records.length, 1);
  assert.deepEqual(records[0].price, { value: 115.32, unit: 'ARS' });
  assert.equal(report.excluded['internación o estadía'], 1);
});

test('curados: con código exacto se adjunta; sin código nace curado; aproximado no cuenta', () => {
  const lista = {
    especialidades: [
      {
        codigo: 'ENDODONCIA',
        servicios: [
          { nombre: 'Pulpotomía', evidencia: [{ fuente: 'X', url: 'https://x' }], equivalentes: [{ sistema: 'CUPS', codigo: '23410' }] },
          { nombre: 'Retratamiento', evidencia: [{ fuente: 'X', url: 'https://x' }], equivalentes: [{ sistema: 'CUPS', codigo: '237301', aproximado: true }] },
          { nombre: 'Sin cita', evidencia: [] },
        ],
      },
      { codigo: 'GERODONTOLOGIA', faltanteEnModelo: true, servicios: [{ nombre: 'Control geriátrico', evidencia: [{ fuente: 'Y', url: 'https://y' }] }] },
    ],
  };
  const { records, report } = parseCurado([lista]);
  const adjunto = records.find((r) => r.attachOnly);
  assert.equal(adjunto.codeSystem, 'cups-co');
  assert.equal(adjunto.code, '023410');
  assert.equal(records.find((r) => r.display === 'Retratamiento').codeSystem, 'mantra-curado');
  const gero = records.find((r) => r.display === 'Control geriátrico');
  assert.deepEqual(gero.specialties, []);
  assert.equal(gero.sourceRef.proposedSpecialty, 'GERODONTOLOGIA');
  assert.equal(report.excluded['sin nombre o sin cita'], 1);
});

test('unión: el oficial pone el nombre; el adjunto sólo suma; sin oficial no nace', () => {
  const merged = mergeRecords([
    { records: [{ codeSystem: 'cups-co', code: '023410', display: 'PULPOTOMIA', specialties: [] }] },
    {
      records: [
        { codeSystem: 'cups-co', code: '023410', attachOnly: true, display: 'Pulpotomía', specialties: [{ code: 'ENDODONCIA' }] },
        { codeSystem: 'cups-co', code: '999999', attachOnly: true, display: 'Huérfano', specialties: [] },
      ],
    },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].display, 'PULPOTOMIA');
  assert.deepEqual(merged[0].synonyms, [{ value: 'Pulpotomía', lang: 'es' }]);
  assert.equal(merged[0].attachOnly, undefined);
  assert.deepEqual(merged[0].specialties.map((s) => s.code), ['ENDODONCIA']);
});

test('curado con el mismo nombre que un oficial se pliega en el oficial', () => {
  const merged = mergeRecords([
    { records: [{ codeSystem: 'cups-co', code: '1', display: 'ECOCARDIOGRAMA TRANSTORÁCICO', specialties: [] }] },
    { records: [{ codeSystem: 'mantra-curado', code: 'eco', display: 'Ecocardiograma transtorácico', specialties: [{ code: 'CARDIOLOGIA' }] }] },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].specialties[0].code, 'CARDIOLOGIA');
});

test('plan: reusa el id de specialty-services y no duplica relaciones existentes', () => {
  const r = { codeSystem: 'cups-co', code: '890228', display: 'X', specialties: [{ code: 'CARDIOLOGIA' }] };
  const cid = conceptIdOf(r);
  assert.equal(cid, serviceConceptId('cups-co', '890228'));
  const sp = new Map([['CARDIOLOGIA', 'sp-1']]);
  assert.equal(buildPlan([r], sp).relationships.length, 1);
  assert.equal(buildPlan([r], sp, new Set([`${cid}|sp-1`])).relationships.length, 0);
  assert.equal(buildPlan([r, r], sp).members.length, 1);
});
