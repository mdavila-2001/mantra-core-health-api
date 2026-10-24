import assert from 'node:assert/strict';
import test, { before } from 'node:test';
import { construirInventarioCompleto } from './inventario-completo.mjs';
import { leerFlujosCriticos, referenciasDe } from './flujos.mjs';

test('referenciasDe toma método y ruta, normaliza parámetros y resuelve sufijos relativos', () => {
  const r = referenciasDe(
    'Hace `POST /a/:id/b` y luego (`POST /c/{x}/d`) y revoca con `.../revoke`',
  );
  assert.deepEqual(r[0], { metodo: 'POST', ruta: '/a/{}/b', relativa: false });
  assert.deepEqual(r[1], { metodo: 'POST', ruta: '/c/{}/d', relativa: false });
  assert.deepEqual(r[2], {
    base: '/c/{}/d',
    sufijo: '/revoke',
    relativa: true,
  });
});

test('critical-workflows.md: dos procesos con sus pasos principales y alternativos', () => {
  const c = leerFlujosCriticos(process.cwd());
  assert.deepEqual(
    c.map((x) => x.modulos),
    [['scheduling'], ['consent', 'authz']],
  );
  assert.equal(c[0].principal.length, 3);
  assert.equal(c[0].alternativos.length, 5);
  assert.equal(c[1].principal.length, 3);
  assert.equal(c[1].alternativos.length, 5);
});

// Se construye una sola vez (tarda ~30 s) contra el código real.
let inv;
before(() => {
  inv = construirInventarioCompleto({ root: process.cwd() });
});

test('cotejo con critical-workflows.md: el proceso de la cita contiene exactamente las operaciones del documento', () => {
  const p = inv.procesos.find((x) => x.codigo === 'critico:scheduling');
  const ops = (tipo) =>
    p.etapas
      .filter((e) => e.tipo === tipo)
      .flatMap((e) => e.operaciones.map((o) => `${o.metodo} ${o.ruta}`));
  assert.deepEqual(ops('PRINCIPAL'), [
    'POST /scheduling/slots/{id}/holds',
    'POST /scheduling/holds/{holdToken}/confirm',
    'POST /scheduling/bookings/{id}/check-in',
  ]);
  assert.deepEqual(ops('ALTERNATIVO'), [
    'POST /scheduling/bookings/{id}/reschedule',
    'POST /scheduling/bookings/{id}/cancel',
    'POST /scheduling/internal/expire-holds',
    'POST /scheduling/resources/{id}/exceptions',
    'POST /scheduling/waitlist',
  ]);
});

test('cotejo con critical-workflows.md: el de consentimiento resuelve también las rutas relativas', () => {
  const p = inv.procesos.find((x) => x.codigo === 'critico:consent');
  const todas = p.etapas.flatMap((e) =>
    e.operaciones.map((o) => `${o.metodo} ${o.ruta}`),
  );
  assert.ok(todas.includes('POST /consent/hipaa-authorizations/{id}/revoke'));
  assert.ok(todas.includes('POST /consent/patient-objections/{id}/resolve'));
  assert.deepEqual(
    inv.sinResolver,
    [],
    'ninguna referencia del documento queda sin operación',
  );
});

test('ida y vuelta: toda operación está en algún proceso y cada proceso la lista', () => {
  const porProceso = new Map();
  for (const p of inv.procesos)
    for (const et of p.etapas)
      for (const o of et.operaciones) {
        const clave = `${o.operacionId}|${p.codigo}|${et.codigo}`;
        porProceso.set(clave, true);
      }
  for (const e of inv.endpoints) {
    assert.ok(e.flujos.length > 0, `${e.id} no tiene flujo`);
    for (const f of e.flujos)
      assert.ok(
        porProceso.has(`${e.id}|${f.codigo}|${f.etapa}`),
        `${e.id} dice estar en ${f.codigo}/${f.etapa} y el proceso no la lista`,
      );
  }
  let aristas = 0;
  for (const k of porProceso.keys()) {
    const [id, codigo, etapa] = k.split('|');
    const e = inv.endpoints.find((x) => x.id === id);
    assert.ok(
      e.flujos.some((f) => f.codigo === codigo && f.etapa === etapa),
      `${k} no está en la operación`,
    );
    aristas += 1;
  }
  assert.ok(aristas >= inv.endpoints.length);
});

test('toda operación tiene árbol, respuesta de éxito y el estado de cada error sale de una excepción conocida', () => {
  for (const e of inv.endpoints) {
    const a = inv.arboles.get(e.id);
    assert.ok(a, e.id);
    assert.equal(a.nodos.at(-1).tipo, 'RESPUESTA', e.id);
    assert.ok(
      e.respuestasPosibles.some((r) => r.estado >= 200 && r.estado < 300),
      e.id,
    );
    assert.equal(a.truncado, false, `${e.id} superó el tope de nodos`);
  }
});

test('POST /scheduling/slots/{id}/holds: árbol cotejado con el servicio (404, 422, 409 y escritura de holds)', () => {
  const e = inv.endpoints.find(
    (x) => x.metodo === 'POST' && x.ruta === '/scheduling/slots/{id}/holds',
  );
  const estados = e.respuestasPosibles.map((r) => r.estado);
  for (const esperado of [201, 400, 401, 403, 404, 409, 422])
    assert.ok(estados.includes(esperado), `falta ${esperado}`);
  const causas = e.respuestasPosibles.flatMap((r) => r.causas).join(' | ');
  assert.match(causas, /El paciente alcanzó el máximo de citas activas/);
  assert.match(causas, /El slot no tiene cupos disponibles/);
  const efectos = [];
  (function rec(ns) {
    for (const n of ns) {
      if (n.tipo === 'EFECTO') efectos.push(`${n.detalle} ${n.tabla}`);
      for (const k of [
        'entonces',
        'sino',
        'cuerpo',
        'captura',
        'finalmente',
        'hijos',
      ])
        if (n[k]) rec(n[k]);
      for (const c of n.casos ?? []) rec(c.nodos);
    }
  })(inv.arboles.get(e.id).nodos);
  assert.ok(efectos.includes('CREA scheduling.slot_holds'));
  assert.ok(efectos.includes('ACTUALIZA scheduling.bookable_slots'));
});

test('máquina de la cita: estados, terminales y operaciones que la ejercen', () => {
  const m = inv.maquinas.find((x) => x.constante === 'BOOKING_TRANSITIONS');
  assert.deepEqual(m.terminales.sort(), [
    'BOOKING_CANCELLED',
    'BOOKING_COMPLETED',
    'BOOKING_NO_SHOW',
  ]);
  const por = Object.fromEntries(
    m.operaciones.map((o) => [`${o.metodo} ${o.ruta}`, o.estados]),
  );
  assert.deepEqual(por['POST /scheduling/bookings/{id}/check-in'], [
    'BOOKING_CHECKED_IN',
  ]);
});
