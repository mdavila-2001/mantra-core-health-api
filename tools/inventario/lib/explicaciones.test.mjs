import assert from 'node:assert/strict';
import test from 'node:test';
import {
  explicacionDeNegocio,
  explicacionDeSistema,
  riesgoDe,
} from './explicaciones.mjs';

const tabla = (detalle, schema = 's', nombre = 't') => ({
  schema,
  tabla: nombre,
  detalle,
  operacion:
    detalle === 'LEE' ? 'LEE' : detalle === 'BORRA' ? 'BORRA' : 'ESCRIBE',
});
const privada = { publica: false, roles: ['ADMIN'] };

test('el negocio cita sólo lo que tiene fuente y nombra cada una', () => {
  const n = explicacionDeNegocio({
    resumen: 'Reservar un cupo',
    casosDeUso: [
      { uc: 'UC-1', descripcion: 'Reserva temporal', fuente: 'README.md:14' },
    ],
    proposito: {
      texto: 'The booking layer. Second sentence.',
      fuente: 'm.puml:49',
    },
    dominio: { dominio: 'Práctica y Agenda', fuente: 'doc.md:35' },
  });
  assert.equal(n.estado, 'AUTO_DETECTADA');
  assert.match(n.texto, /Reservar un cupo\./);
  assert.match(n.texto, /Caso de uso UC-1: Reserva temporal\./);
  assert.match(n.texto, /«The booking layer\.»/);
  assert.doesNotMatch(n.texto, /Second sentence/);
  assert.match(n.texto, /Dominio: Práctica y Agenda\./);
  assert.deepEqual(
    n.fuentes.map((f) => f.tipo),
    ['CONTRATO', 'README', 'MODELO', 'MODELO'],
  );
});

test('sin ninguna fuente no se inventa una explicación', () => {
  const n = explicacionDeNegocio({
    resumen: null,
    casosDeUso: [],
    proposito: null,
    dominio: null,
  });
  assert.deepEqual(n, { estado: 'SIN_FUENTE', texto: null, fuentes: [] });
});

test('un propósito sin punto final y larguísimo se corta en una palabra, no a mitad', () => {
  const texto = Array.from({ length: 80 }, (_, i) => `palabra${i}`).join(' ');
  const n = explicacionDeNegocio({
    resumen: null,
    casosDeUso: [],
    proposito: { texto, fuente: 'x' },
    dominio: null,
  });
  assert.match(n.texto, /palabra\d+…»/);
});

test('el sistema describe lo que hace con concordancia y sin inventar', () => {
  const base = {
    metodo: 'POST',
    ruta: '/x',
    codigo: { controlador: 'C', handler: 'h', fuente: 'c.ts:1' },
    autenticacion: privada,
    cuerpo: { dto: 'D', campos: [{ obligatorio: true }] },
    servicios: ['S.m'],
    tablas: [
      tabla('CREA', 's', 'a'),
      tabla('LEE', 's', 'b'),
      tabla('BORRA', 's', 'c'),
    ],
    eventos: [
      { tipo: 'Evt', expresion: null },
      { tipo: null, expresion: 'x.y' },
    ],
    trabajos: [{ codigo: 'cola', expresion: null }],
    sinTablas: null,
    noResuelto: [{}],
  };
  const t = explicacionDeSistema(base).texto;
  assert.match(t, /1 campo, 1 obligatorio/);
  assert.match(t, /Crea filas en s\.a\. Borra de s\.c\. Lee s\.b\./);
  assert.match(t, /Publica Evt, un evento calculado \(x\.y\)\./);
  assert.match(t, /Encola cola\./);
  assert.match(t, /Hay 1 llamada cuyo destino[^.]* no se siguió\./);
});

test('sin tablas dice el motivo si lo hay y «no se determinaron» si no', () => {
  const sin = {
    metodo: 'GET',
    ruta: '/h',
    codigo: null,
    autenticacion: { publica: true, roles: [] },
    cuerpo: null,
    servicios: [],
    tablas: [],
    eventos: [],
    trabajos: [],
    noResuelto: [],
  };
  assert.match(
    explicacionDeSistema({ ...sin, sinTablas: { motivo: 'es una sonda' } })
      .texto,
    /No toca tablas relacionales: es una sonda\./,
  );
  assert.match(
    explicacionDeSistema({ ...sin, sinTablas: null }).texto,
    /No se determinaron tablas/,
  );
  assert.match(explicacionDeSistema(sin).texto, /handler no localizado/);
  assert.match(explicacionDeSistema(sin).texto, /ruta pública/);
});

test('riesgo: pública que escribe, borrar, o escribir sin roles → ALTO', () => {
  assert.equal(
    riesgoDe({
      autenticacion: { publica: true, roles: [] },
      tablas: [tabla('CREA')],
    }).nivel,
    'ALTO',
  );
  assert.equal(
    riesgoDe({ autenticacion: privada, tablas: [tabla('BORRA')] }).nivel,
    'ALTO',
  );
  const sinRoles = riesgoDe({
    autenticacion: { publica: false, roles: [] },
    tablas: [tabla('ACTUALIZA')],
  });
  assert.equal(sinRoles.nivel, 'ALTO');
  assert.deepEqual(sinRoles.razones, [
    'Escribe y el controlador no declara roles',
  ]);
});

test('riesgo: escribir con roles → MEDIO; sólo leer o no tocar tablas → BAJO', () => {
  assert.equal(
    riesgoDe({ autenticacion: privada, tablas: [tabla('CREA')] }).nivel,
    'MEDIO',
  );
  assert.equal(
    riesgoDe({ autenticacion: privada, tablas: [tabla('LEE')] }).nivel,
    'BAJO',
  );
  assert.deepEqual(riesgoDe({ autenticacion: privada, tablas: [] }).razones, [
    'No toca tablas relacionales',
  ]);
  // una ruta pública que sólo lee no es de riesgo alto
  assert.equal(
    riesgoDe({
      autenticacion: { publica: true, roles: [] },
      tablas: [tabla('LEE')],
    }).nivel,
    'BAJO',
  );
});
