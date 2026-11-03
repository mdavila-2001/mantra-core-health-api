import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  UMBRAL_PLANTILLA,
  camposDePlantilla,
  evidenciaDeFk,
  evidenciaDeNota,
  huella,
  indicePlantillas,
  limpiar,
  nombreDeEntidad,
  nombreDeFk,
  parcheDeFicha,
  parseNotaDeEntidad,
  parseNotaDeFk,
} from './vault-notes.mjs';

const nota = (tabla, { negocio, ejemplo, porQue, sistema, tags = ['entidad', 'schema/iam', 'modulo/01', 'dominio/Identidad_y_Seguridad'] } = {}) =>
  [
    '---',
    'tags:',
    ...tags.map((t) => `  - ${t}`),
    '---',
    `# ${tabla}`,
    '',
    '## 🎯 Propósito',
    `**Negocio:** ${negocio ?? `**${tabla}** es un **registro central de negocio** del módulo [[M01 iam|01 · iam]].`}`,
    ...(ejemplo === null ? [] : ['', `**Ejemplo concreto:** ${ejemplo ?? `Cuando un usuario inicia sesión, ese chequeo usa **${tabla}**.`}`]),
    '',
    `**Por qué no debe eliminarse del modelo:** ${porQue ?? 'Si esta tabla se eliminara, el negocio perdería el registro mismo de identidad.'}`,
    '',
    `**Sistema:** ${sistema ?? 'La tabla declara 13 campos y 5 claves foráneas.'}`,
    '',
    '## Relaciona con →',
    '- [[E iam.refresh_tokens|refresh_tokens]]',
    '',
    '## ← Referenciada por',
    '- [[E iam.users|users]]',
    '- [[E iam.devices|devices]]',
    '',
    '## Campos',
    '```puml',
    '  * id : uuid <<PK>>',
    '```',
  ].join('\n');

test('los nombres de archivo se descomponen sin confundir tabla con columna', () => {
  assert.deepEqual(nombreDeEntidad('E iam.sessions.md'), { schema: 'iam', table: 'sessions' });
  assert.deepEqual(nombreDeFk('FK iam.sessions.user_id.md'), { schema: 'iam', table: 'sessions', column: 'user_id' });
  assert.equal(nombreDeEntidad('README.md'), null);
  assert.equal(nombreDeFk('E iam.sessions.md'), null);
});

test('limpiar quita enlaces, negritas y espacios sobrantes', () => {
  assert.equal(limpiar('**x** del módulo [[M01 iam|01 · iam]] y [[Identidad y Seguridad]]\n  fin'), 'x del módulo 01 · iam y Identidad y Seguridad fin');
});

test('la nota de entidad se lee con sus cuatro secciones, etiquetas y relaciones', () => {
  const n = parseNotaDeEntidad(nota('sessions'), 'E iam.sessions.md');
  assert.equal(n.schema, 'iam');
  assert.equal(n.table, 'sessions');
  assert.equal(n.modulo, '01');
  assert.equal(n.dominio, 'Identidad y Seguridad');
  assert.equal(n.esConjuntoDeIndices, false);
  assert.deepEqual(Object.keys(n.raw).sort(), ['business', 'example', 'existence', 'system']);
  assert.deepEqual(n.refiereA, [{ schema: 'iam', table: 'refresh_tokens' }]);
  assert.deepEqual(n.referenciadaPor.map((r) => r.table), ['users', 'devices']);
});

test('lee igual una nota guardada con finales de línea de Windows', () => {
  const n = parseNotaDeEntidad(nota('sessions').replaceAll('\n', '\r\n'), 'E iam.sessions.md');
  assert.deepEqual(Object.keys(n.raw).sort(), ['business', 'example', 'existence', 'system']);
  assert.equal(n.modulo, '01');
});

test('una nota sin «Ejemplo concreto» no inventa uno', () => {
  const n = parseNotaDeEntidad(nota('sessions', { ejemplo: null }), 'E iam.sessions.md');
  assert.equal('example' in n.raw, false);
});

test('un conjunto de índices se reconoce y no es una tabla del catálogo', () => {
  const n = parseNotaDeEntidad(nota('idxset_sessions', { tags: ['entidad', 'schema/iam', 'tipo/index_set'] }), 'E iam.idxset_sessions.md');
  assert.equal(n.esConjuntoDeIndices, true);
});

test('una vista y una vista materializada se marcan como vistas', () => {
  assert.equal(parseNotaDeEntidad(nota('v', { tags: ['entidad', 'tipo/view'] }), 'E iam.v.md').esVista, true);
  assert.equal(parseNotaDeEntidad(nota('m', { tags: ['entidad', 'materialized'] }), 'E iam.m.md').esVista, true);
});

test('la huella ignora lo que varía entre tablas', () => {
  const a = huella('**sessions** es un **registro** de [[M01 iam|01 · iam]] con 13 campos y `x`', 'sessions');
  const b = huella('**devices** es un **registro** de [[M01 iam|01 · iam]] con 7 campos y `y`', 'devices');
  assert.equal(a, b);
});

test(`un texto repetido en ${UMBRAL_PLANTILLA} notas es plantilla; uno único no lo es`, () => {
  const notas = ['a', 'b', 'c'].map((t) => parseNotaDeEntidad(nota(t), `E iam.${t}.md`));
  const unica = parseNotaDeEntidad(
    nota('d', { porQue: 'Sin esta tabla no se puede probar quién autorizó cada acceso a una historia clínica ante una auditoría.' }),
    'E iam.d.md',
  );
  const plantillas = indicePlantillas([...notas, unica]);
  assert.equal(plantillas.esPlantilla(notas[0], 'business'), true);
  assert.equal(plantillas.esPlantilla(unica, 'existence'), false);
  assert.deepEqual(camposDePlantilla(unica, plantillas), ['business', 'example']);
});

test('dos notas con el mismo texto propio no alcanzan para ser plantilla; tres, sí', () => {
  const propio = (t) =>
    parseNotaDeEntidad(nota(t, { negocio: `${t} registra los turnos de guardia que la clínica publica cada mes.` }), `E iam.${t}.md`);
  const dos = ['a', 'b'].map(propio);
  assert.equal(indicePlantillas(dos).esPlantilla(dos[0], 'business'), false);
  const tres = ['a', 'b', 'c'].map(propio);
  assert.equal(indicePlantillas(tres).esPlantilla(tres[0], 'business'), true);
});

test('el esqueleto generado se reconoce aunque ningún texto se repita (módulo chico)', () => {
  const unica = parseNotaDeEntidad(nota('unica'), 'E iam.unica.md');
  assert.equal(indicePlantillas([unica]).esPlantilla(unica, 'business'), true);
  assert.equal(indicePlantillas([unica]).esPlantilla(unica, 'existence'), true);
});

test('el parche es IMPORTED_VAULT, nunca envía a revisión y declara cada plantilla como pregunta abierta', () => {
  const notas = ['a', 'b', 'c'].map((t) => parseNotaDeEntidad(nota(t), `E iam.${t}.md`));
  const plantillas = indicePlantillas(notas);
  const parche = parcheDeFicha(notas[0], plantillas, { changeReason: 'Importado de E iam.a.md' });
  assert.equal(parche.origin, 'IMPORTED_VAULT');
  assert.equal('submit' in parche, false);
  assert.match(parche.definition, /^a es un registro central de negocio del módulo 01 · iam\.$/);
  assert.equal(parche.openQuestions.length, 3);
  assert.deepEqual(parche.openQuestions.map((q) => q.field), ['definition', 'purpose', 'existenceRationale']);
});

test('lo que no es plantilla se importa sin pregunta abierta', () => {
  const unica = parseNotaDeEntidad(
    nota('solo', {
      negocio: 'solo registra los turnos de guardia que la clínica publica cada mes.',
      ejemplo: 'Cuando la jefa de enfermería publica el rol de diciembre, cada turno queda aquí.',
      porQue: 'Sin esta tabla no se podría comprobar quién estaba de guardia cuando ocurrió un incidente.',
    }),
    'E iam.solo.md',
  );
  const parche = parcheDeFicha(unica, indicePlantillas([unica]), { changeReason: 'x' });
  assert.equal('openQuestions' in parche, false);
});

test('el texto largo se recorta al límite de la API en vez de rechazarse', () => {
  const largo = parseNotaDeEntidad(nota('x', { negocio: 'a'.repeat(5000) }), 'E iam.x.md');
  const parche = parcheDeFicha(largo, indicePlantillas([largo]), { changeReason: 'x' });
  assert.equal(parche.definition.length, 4000);
  assert.equal(parche.definition.endsWith('…'), true);
});

test('la evidencia de una nota lleva la ruta, la parte «Sistema» y la revisión de la fuente', () => {
  const n = parseNotaDeEntidad(nota('sessions'), 'E iam.sessions.md');
  assert.deepEqual(evidenciaDeNota(n, { sourceRevision: 'abc' }), {
    kind: 'VAULT_NOTE',
    reference: 'SALUD/Entidades/E iam.sessions.md',
    excerpt: 'La tabla declara 13 campos y 5 claves foráneas.',
    sourceRevision: 'abc',
  });
});

const fk = (cuerpo) => `---\ntags:\n  - fk\n---\n\n# sessions.user_id  \`<<FK>>\`\n\n${cuerpo}\n`;

test('una nota de FK dice a dónde apunta y con qué criterio', () => {
  const f = parseNotaDeFk(fk('## Apunta a →\n- [[E iam.users|users]]  _(convención · usuario)_'), 'FK iam.sessions.user_id.md');
  assert.deepEqual(f.destinos, [{ schema: 'iam', table: 'users', basis: 'convención · usuario' }]);
  assert.equal(f.sinDestino, false);
  assert.equal(evidenciaDeFk(f, { sourceRevision: 'r' }).excerpt, 'Apunta a → iam.users (convención · usuario)');
});

test('una FK sin destino se declara sin destino y no se le inventa uno', () => {
  const f = parseNotaDeFk(fk('## Apunta a →\n'), 'FK iam.sessions.user_id.md');
  assert.equal(f.sinDestino, true);
  assert.match(evidenciaDeFk(f, { sourceRevision: 'r' }).excerpt, /no declara el destino/);
});
