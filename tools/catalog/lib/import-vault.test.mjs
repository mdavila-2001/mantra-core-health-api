import assert from 'node:assert/strict';
import { test } from 'node:test';

import { crearApi, importar, resumir } from './import-vault.mjs';
import { indicePlantillas, parseNotaDeEntidad, parseNotaDeFk } from './vault-notes.mjs';

const entidad = (tabla, extra = {}) =>
  parseNotaDeEntidad(
    [
      '---',
      'tags:',
      '  - entidad',
      '  - schema/iam',
      '  - modulo/01',
      '---',
      `**Negocio:** **${tabla}** es un **registro central de negocio** del módulo [[M01 iam|01 · iam]].`,
      '',
      `**Por qué no debe eliminarse del modelo:** ${extra.porQue ?? 'Si esta tabla se eliminara, el negocio perdería el registro mismo de identidad.'}`,
      '',
      '**Sistema:** La tabla declara 5 campos.',
    ].join('\n'),
    `E iam.${tabla}.md`,
  );

const fk = (tabla, columna) =>
  parseNotaDeFk(`---\ntags:\n  - fk\n---\n## Apunta a →\n- [[E iam.users|users]]  _(convención · usuario)_\n`, `FK iam.${tabla}.${columna}.md`);

/** Una API simulada con las reglas del servidor que el importador usa. */
function servidor({ fichas = {}, objetos = { sessions: 'o1', devices: 'o2' }, conflictoUnaVez = false, fallarEn = null } = {}) {
  const estado = { fichas: { ...fichas }, evidencias: [], puts: [], conflictos: 0 };
  let versionLeida = new Map();
  const fetchFn = async (url, init = {}) => {
    const ruta = url.replace('http://api', '');
    const cuerpo = init.body ? JSON.parse(init.body) : null;
    const responder = (status, datos) => ({ status, ok: status < 400, text: async () => JSON.stringify(datos) });
    if (init.method === 'GET' && ruta.startsWith('/admin/catalog/objects?')) {
      // La API admite como máximo 100 por página: pedir más es un 400.
      if (Number(new URL(url).searchParams.get('limit')) > 100) return responder(400, { message: 'limit' });
      return responder(200, {
        items: Object.entries(objetos).map(([objectName, id]) => ({ objectName, id })),
        nextCursor: null,
      });
    }
    const obj = /\/admin\/catalog\/objects\/(o\d)(\/.*)?$/.exec(ruta);
    if (obj && init.method === 'GET' && !obj[2]) return responder(200, { annotation: estado.fichas[obj[1]] ?? null });
    if (obj && obj[2] === '/columns') return responder(200, { items: [{ id: `c-${obj[1]}-user_id`, columnName: 'user_id' }] });
    if (obj && obj[2] === '/annotation' && init.method === 'PUT') {
      estado.puts.push(cuerpo);
      if (fallarEn === obj[1]) return responder(500, { message: 'boom' });
      const previa = estado.fichas[obj[1]];
      if (conflictoUnaVez && estado.conflictos === 0) {
        estado.conflictos += 1;
        estado.fichas[obj[1]] = { version: 5, currentRevisionNo: 5, origin: 'IMPORTED_VAULT' };
        return responder(409, { code: 'CONFLICT' });
      }
      if ((previa?.version ?? 0) !== cuerpo.expectedVersion) return responder(409, { code: 'CONFLICT' });
      if (previa?.origin === 'MANUAL') {
        return responder(422, { code: 'PRECONDITION_FAILED', details: { violations: [{ reason: 'MANUAL_REVISION_EXISTS' }] } });
      }
      const mismo = previa && previa.contenido === JSON.stringify({ ...cuerpo, expectedVersion: 0 });
      if (mismo) return responder(200, previa);
      const nueva = {
        version: (previa?.version ?? 0) + 1,
        currentRevisionNo: (previa?.currentRevisionNo ?? 0) + 1,
        origin: 'IMPORTED_VAULT',
        contenido: JSON.stringify({ ...cuerpo, expectedVersion: 0 }),
      };
      estado.fichas[obj[1]] = nueva;
      return responder(200, nueva);
    }
    if (obj && obj[2] === '/evidence' && init.method === 'POST') {
      const clave = JSON.stringify([obj[1], cuerpo.reference, cuerpo.sourceRevision]);
      if (!estado.evidencias.includes(clave)) estado.evidencias.push(clave);
      return responder(201, {});
    }
    const col = /\/admin\/catalog\/columns\/(c-[^/]+)\/evidence$/.exec(ruta);
    if (col && init.method === 'POST') {
      const clave = JSON.stringify([col[1], cuerpo.reference, cuerpo.sourceRevision]);
      if (!estado.evidencias.includes(clave)) estado.evidencias.push(clave);
      return responder(201, {});
    }
    return responder(404, {});
  };
  return { estado, api: crearApi({ base: 'http://api', token: 't', fetchFn }) };
}

const bove = (entidades, fks = []) => ({
  entidades,
  fks: fks.map((f) => ({ ...f, revision: 'sha256:fk' })),
  plantillas: indicePlantillas(entidades),
});
const con = (n) => ({ ...n, revision: 'sha256:abc' });

test('crea la ficha en borrador importado, nunca la envía a revisión y suma la evidencia', async () => {
  const { api, estado } = servidor();
  const r = await importar(api, bove([con(entidad('sessions'))]), { schemas: ['iam'] });
  assert.equal(r.fichasCreadas, 1);
  assert.equal(r.errores.length, 0);
  assert.equal(estado.puts[0].origin, 'IMPORTED_VAULT');
  assert.equal(estado.puts[0].expectedVersion, 0);
  assert.equal('submit' in estado.puts[0], false);
  assert.equal(estado.evidencias.length, 1);
});

test('repetir la importación no duplica nada', async () => {
  const s = servidor();
  const b = bove([con(entidad('sessions'))], [fk('sessions', 'user_id')]);
  await importar(s.api, b, { schemas: ['iam'] });
  const segunda = await importar(s.api, b, { schemas: ['iam'] });
  assert.equal(segunda.fichasCreadas, 0);
  assert.equal(segunda.fichasSinCambios, 1);
  assert.equal(s.estado.evidencias.length, 2); // la de la nota y la de la FK, una sola vez
});

test('lo que una persona ya escribió se respeta y no es un error', async () => {
  const s = servidor({ fichas: { o1: { version: 3, currentRevisionNo: 3, origin: 'MANUAL' } } });
  const r = await importar(s.api, bove([con(entidad('sessions'))]), { schemas: ['iam'] });
  assert.equal(r.fichasRespetaLoHumano, 1);
  assert.equal(r.errores.length, 0);
  assert.equal(s.estado.fichas.o1.origin, 'MANUAL');
});

test('un conflicto de versión se relee y se reintenta una vez', async () => {
  const s = servidor({ conflictoUnaVez: true });
  const r = await importar(s.api, bove([con(entidad('sessions'))]), { schemas: ['iam'] });
  assert.equal(r.errores.length, 0);
  assert.equal(s.estado.puts.length, 2);
  assert.equal(s.estado.puts[1].expectedVersion, 5);
});

test('un error en una tabla se registra y el resto sigue', async () => {
  const s = servidor({ fallarEn: 'o1' });
  const r = await importar(s.api, bove([con(entidad('sessions')), con(entidad('devices'))]), { schemas: ['iam'] });
  assert.equal(r.errores.length, 1);
  assert.match(r.errores[0], /iam\.sessions: PUT annotation: HTTP 500/);
  assert.equal(r.fichasCreadas, 1);
});

test('una nota sin objeto en el catálogo se informa y no se inventa el objeto', async () => {
  const s = servidor({ objetos: { sessions: 'o1' } });
  const r = await importar(s.api, bove([con(entidad('sessions')), con(entidad('devices'))]), { schemas: ['iam'] });
  assert.deepEqual(r.notasSinObjeto, ['iam.devices']);
  assert.equal(r.fichasCreadas, 1);
});

test('los conjuntos de índices no se importan', async () => {
  const idx = parseNotaDeEntidad('---\ntags:\n  - entidad\n  - schema/iam\n  - tipo/index_set\n---\n', 'E iam.idxset_sessions.md');
  const s = servidor({ objetos: { idxset_sessions: 'o9' } });
  const r = await importar(s.api, bove([con(idx)]), { schemas: ['iam'] });
  assert.equal(r.fichasCreadas, 0);
  assert.equal(s.estado.puts.length, 0);
});

test('una FK cuya columna no existe se cuenta aparte', async () => {
  const s = servidor();
  const r = await importar(s.api, bove([con(entidad('sessions'))], [fk('sessions', 'columna_fantasma')]), { schemas: ['iam'] });
  assert.equal(r.fkSinColumna, 1);
  assert.equal(r.evidenciasDeFk, 0);
});

test('--limit corta la importación', async () => {
  const s = servidor();
  const r = await importar(s.api, bove([con(entidad('sessions')), con(entidad('devices'))]), { schemas: ['iam'], limite: 1 });
  assert.equal(r.fichasCreadas, 1);
});

test('el resumen cuenta tablas, plantillas y FK sin destino', () => {
  const b = bove([con(entidad('sessions')), con(entidad('devices'))], [fk('sessions', 'user_id'), { ...fk('sessions', 'x'), destinos: [], sinDestino: true }]);
  const r = resumir(b, { schemas: ['iam'] });
  assert.equal(r.tablasYVistas, 2);
  assert.equal(r.fkSinDestino, 1);
  assert.deepEqual(r.fkPorCriterio, { 'convención · usuario': 1 });
});
