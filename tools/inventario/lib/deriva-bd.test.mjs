import assert from 'node:assert/strict';
import test from 'node:test';
import { compararConBase } from './deriva-bd.mjs';
import { familiaDeTipo } from './orm.mjs';

const TABLA = {
  id: 's.t',
  schema: 's',
  tabla: 't',
  columnas: [
    { nombre: 'id', tipo: 'uuid', nulable: false },
    { nombre: 'nombre', tipo: 'varchar', nulable: false },
    { nombre: 'codigo', tipo: 'char(3)', nulable: true },
    {
      nombre: 'estado',
      tipo: '"terminology"."technical_data_type"',
      nulable: true,
    },
  ],
  indices: [{ nombre: 'ix_t_nombre' }],
  restricciones: [{ tipo: 'UNIQUE INDEX', nombre: 'ux_t_codigo' }],
  relaciones: { salientes: [{ constraint: 'fk_t_x' }] },
};

const BD = () => ({
  tablas: [{ schema: 's', tabla: 't' }],
  columnas: [
    { schema: 's', tabla: 't', columna: 'id', nulable: false, tipo: 'uuid' },
    {
      schema: 's',
      tabla: 't',
      columna: 'nombre',
      nulable: false,
      tipo: 'varchar',
    },
    {
      schema: 's',
      tabla: 't',
      columna: 'codigo',
      nulable: true,
      tipo: 'bpchar',
    },
    {
      schema: 's',
      tabla: 't',
      columna: 'estado',
      nulable: true,
      tipo: 'technical_data_type',
    },
  ],
  indices: [
    { schema: 's', tabla: 't', nombre: 't_pkey' },
    { schema: 's', tabla: 't', nombre: 'ix_t_nombre' },
    { schema: 's', tabla: 't', nombre: 'ux_t_codigo' },
  ],
  respaldoDeIndices: [{ schema: 's', nombre: 't_pkey' }],
  fks: [{ schema: 's', tabla: 't', nombre: 'fk_t_x' }],
});

test('una base idéntica al catálogo coincide, con alias de tipo y los índices de PK y UNIQUE INDEX contados', () => {
  const r = compararConBase([TABLA], BD());
  assert.equal(r.porTabla.get('s.t').estado, 'COINCIDE');
  assert.equal(r.totales.indicesDeMas, 0);
  assert.equal(
    r.totales.tipos,
    0,
    'char(3)=bpchar y el enum calificado = su nombre',
  );
});

test('tabla ausente, columna ausente y de más, nulabilidad, tipo, índice y FK ausentes se detectan', () => {
  const bd = BD();
  bd.columnas = bd.columnas.filter((c) => c.columna !== 'estado');
  bd.columnas.find((c) => c.columna === 'nombre').nulable = true;
  bd.columnas.find((c) => c.columna === 'id').tipo = 'int4';
  bd.columnas.push({
    schema: 's',
    tabla: 't',
    columna: 'extra',
    nulable: true,
    tipo: 'text',
  });
  bd.indices = bd.indices.filter((i) => i.nombre !== 'ix_t_nombre');
  bd.fks = [];
  const r = compararConBase(
    [
      TABLA,
      {
        ...TABLA,
        id: 's.u',
        tabla: 'u',
        indices: [],
        relaciones: { salientes: [] },
        restricciones: [],
      },
    ],
    bd,
  );
  const t = r.porTabla.get('s.t');
  assert.equal(t.estado, 'DIVERGE');
  assert.deepEqual(t.columnasAusentes, ['estado']);
  assert.deepEqual(t.columnasDeMas, ['extra']);
  assert.match(
    t.nulabilidad[0],
    /nombre: el modelo dice obligatoria y la base opcional/,
  );
  assert.match(t.tipos[0], /id: el modelo dice uuid y la base int4/);
  assert.deepEqual(t.indicesAusentes, ['ix_t_nombre']);
  assert.deepEqual(t.fkAusentes, ['fk_t_x']);
  assert.equal(r.porTabla.get('s.u').estado, 'AUSENTE');
  assert.equal(r.totales.tablasAusentes, 1);
});

test('un índice de la base que ni el catálogo ni una restricción explican se informa; una tabla de más también', () => {
  const bd = BD();
  bd.indices.push({ schema: 's', tabla: 't', nombre: 'brin_misterioso' });
  bd.tablas.push({ schema: 's', tabla: 'huerfana' });
  const r = compararConBase([TABLA], bd);
  assert.deepEqual(r.indicesDeMas, ['s.brin_misterioso']);
  assert.deepEqual(r.tablasDeMas, ['s.huerfana']);
});

test('familias de tipo: char(n), smallint, enums calificados y arreglos', () => {
  assert.equal(familiaDeTipo('char(64)'), familiaDeTipo('bpchar'));
  assert.equal(familiaDeTipo('smallint'), familiaDeTipo('int2'));
  assert.equal(familiaDeTipo('"a"."b"'), 'b');
  assert.equal(familiaDeTipo('varchar[]'), 'varchar[]');
  assert.notEqual(familiaDeTipo('uuid'), familiaDeTipo('varchar'));
});
