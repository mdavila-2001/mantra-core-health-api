import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { before } from 'node:test';
import Ajv from 'ajv/dist/2020.js';
import { buildSourceIndex } from './ast.mjs';
import {
  construirCatalogo,
  partirColumnas,
  resumirCatalogo,
} from './catalogo.mjs';
import { leerAppendOnly } from './catalogo-fuentes.mjs';
import { rutaDelModelo } from './salida.mjs';
import { leerConsultas } from './consultas.mjs';
import { crearAnalizadorDeDatos } from './datos.mjs';
import { dominiosPorEsquema } from './documentos.mjs';
import { construirLinaje } from './linaje.mjs';
import { leerComentariosDeColumna, leerModelo } from './modelo.mjs';
import { leerColumnasDeEntidades } from './orm.mjs';

test('partirColumnas separa por comas de primer nivel y reconoce expresiones', () => {
  assert.deepEqual(partirColumnas('"a", "b"'), [
    { columna: 'a' },
    { columna: 'b' },
  ]);
  assert.deepEqual(partirColumnas('lower(x, y), z'), [
    { expresion: 'lower(x, y)' },
    { columna: 'z' },
  ]);
});

// ---------------------------------------------------------------------------------------------
// Con datos sintéticos: lo que el catálogo afirma de una tabla pequeña y conocida.

function fixture() {
  const columnas = [
    {
      schema: 's',
      table: 't',
      ordinal: '1',
      column: 'id',
      data_type: 'uuid',
      nullable: 'NO',
      default: '',
      restrictions: 'PRIMARY KEY',
      source_ddl: 'SQL/x.sql',
    },
    {
      schema: 's',
      table: 't',
      ordinal: '2',
      column: 'padre_id',
      data_type: 'uuid',
      nullable: 'YES',
      default: '',
      restrictions: '',
      source_ddl: 'SQL/x.sql',
    },
    {
      schema: 's',
      table: 't',
      ordinal: '3',
      column: 'nombre',
      data_type: 'varchar',
      nullable: 'NO',
      default: '',
      restrictions: '',
      source_ddl: 'SQL/x.sql',
    },
    {
      schema: 's',
      table: 't',
      ordinal: '4',
      column: 'etiquetas',
      data_type: 'varchar[]',
      nullable: 'NO',
      default: '',
      restrictions: '',
      source_ddl: 'SQL/x.sql',
    },
    {
      schema: 's',
      table: 't',
      ordinal: '5',
      column: 'solo_ddl',
      data_type: 'text',
      nullable: 'YES',
      default: '',
      restrictions: '',
      source_ddl: 'SQL/x.sql',
    },
  ];
  const modelo = {
    tablas: new Map([
      [
        's.t',
        {
          schema: 's',
          table: 't',
          business_rationale: 'Guarda cosas.',
          rationale_status: 'DOMAIN_CURATED_DRAFT',
          rationale_evidence: 'x.puml: t',
          source_diagram: 'x.puml',
          source_ddl: 'SQL/x.sql',
        },
      ],
    ]),
    columnas: new Map([['s.t', columnas]]),
    relaciones: [
      {
        source_schema: 's',
        source_table: 't',
        source_columns: 'padre_id',
        target_schema: 's',
        target_table: 't',
        target_columns: 'id',
        constraint_name: 'fk_t_padre',
        resolution: 'DECLARED_FK',
        source_ddl: 'SQL/x.sql',
      },
    ],
    indices: new Map([
      [
        's.t',
        [
          {
            schema: 's',
            table: 't',
            index_name: 'ux_t_nombre',
            unique: 'YES',
            columns_or_expression: '"nombre"',
            predicate: '',
            source_ddl: 'SQL/x.sql',
          },
          {
            schema: 's',
            table: 't',
            index_name: 'ix_t_padre',
            unique: 'NO',
            columns_or_expression: '"padre_id"',
            predicate: '',
            source_ddl: 'SQL/x.sql',
          },
          {
            schema: 's',
            table: 't',
            index_name: 'ix_t_parcial',
            unique: 'NO',
            columns_or_expression: '"etiquetas"',
            predicate: 'nombre IS NOT NULL',
            source_ddl: 'SQL/x.sql',
          },
          {
            schema: 's',
            table: 't',
            index_name: 'ix_t_sin_uso',
            unique: 'NO',
            columns_or_expression: '"solo_ddl"',
            predicate: '',
            source_ddl: 'SQL/x.sql',
          },
        ],
      ],
    ]),
    restricciones: new Map([
      [
        's.t',
        [
          {
            constraint_name: 'pk_t',
            constraint_type: 'PRIMARY KEY',
            columns: 'id',
            definition: 'PRIMARY KEY (id)',
          },
        ],
      ],
    ]),
  };
  const mk = (columna, propiedad, tipo, nulable, extra = {}) => ({
    propiedad,
    columna,
    tipo,
    nulable,
    pk: false,
    comentario: null,
    comentarioEstandar: null,
    fuente: `e.ts:${propiedad}`,
    ...extra,
  });
  const ormTabla = {
    clase: 'T',
    archivo: 'e.ts',
    modulo: 'm',
    columnas: new Map([
      [
        'id',
        mk('id', 'id', 'uuid', false, {
          pk: true,
          comentarioEstandar: 'Identificador único de la instancia.',
        }),
      ],
      ['padre_id', mk('padre_id', 'padreId', 'uuid', true)],
      // el modelo dice obligatoria y la entidad opcional
      [
        'nombre',
        mk('nombre', 'nombre', 'varchar', true, {
          comentario: 'Nombre visible.',
        }),
      ],
      // type 'array' de MikroORM = cualquier arreglo
      ['etiquetas', mk('etiquetas', 'etiquetas', 'array', false)],
    ]),
  };
  const entidades = new Map([
    [
      'e.ts#T',
      {
        clave: 'e.ts#T',
        clase: 'T',
        schema: 's',
        tabla: 't',
        relative: 'e.ts',
        modulo: 'm',
      },
    ],
  ]);
  return { modelo, orm: new Map([['s.t', ormTabla]]), entidades };
}

function construirSintetico(extra = {}) {
  const { modelo, orm, entidades } = fixture();
  return construirCatalogo({
    modelRoot: '/no-existe',
    modelo,
    comentarios: new Map([
      ['s.t.padre_id', { texto: '+ v4.0.8', fuente: 'x.puml:3' }],
      ['s.t.nombre', { texto: 'Nombre según el modelo.', fuente: 'x.puml:9' }],
    ]),
    orm,
    consultas: new Map([
      [
        'e.ts#T',
        [
          {
            propiedades: ['padreId'],
            orden: [],
            metodo: 'TRepo.hijos',
            fuente: 'r.ts:4',
          },
        ],
      ],
    ]),
    entidades,
    endpoints: [
      {
        id: 'op1',
        metodo: 'GET',
        ruta: '/t',
        tablas: [
          {
            schema: 's',
            tabla: 't',
            operacion: 'LEE',
            detalle: 'LEE',
            confianza: 'DIRECTA',
          },
        ],
      },
    ],
    appendOnly: new Map([
      ['m.t', [{ fuente: 'README.md:5', forma: 'PARENTESIS' }]],
    ]),
    dominioPorEsquema: new Map(),
    ...extra,
  }).tablas[0];
}

test('rol estructural: PK, FK, obligatoria u opcional salen del DDL', () => {
  const t = construirSintetico();
  const por = Object.fromEntries(t.columnas.map((c) => [c.nombre, c]));
  assert.deepEqual(por.id.rol, ['Clave primaria', 'Obligatoria']);
  assert.deepEqual(por.padre_id.rol, ['Clave foránea → s.t.id', 'Opcional']);
});

test('la descripción sale del modelo, luego del JSDoc; una marca de versión no es descripción', () => {
  const t = construirSintetico();
  const por = Object.fromEntries(t.columnas.map((c) => [c.nombre, c]));
  assert.equal(por.nombre.descripcion.tipo, 'MODELO_PUML');
  assert.equal(por.nombre.descripcion.fuente, 'x.puml:9');
  assert.equal(por.id.descripcion.tipo, 'JSDOC_ESTANDAR');
  assert.deepEqual(por.padre_id.descripcion, { estado: 'SIN_DATO' });
  assert.equal(por.padre_id.anotacion.version, 'v4.0.8');
});

test('deriva: nulabilidad divergente y columna del DDL ausente en la entidad; array equivale a varchar[]', () => {
  const t = construirSintetico();
  const por = Object.fromEntries(
    t.columnas.map((c) => [c.nombre, c.orm.estado]),
  );
  assert.equal(por.nombre, 'NULABILIDAD_DIVERGE');
  assert.equal(por.solo_ddl, 'AUSENTE_EN_ORM');
  assert.equal(por.etiquetas, 'COINCIDE');
  assert.equal(por.id, 'COINCIDE');
  assert.equal(t.deriva.orm.estado, 'DIVERGE');
});

test('índices: «para qué» sólo con fuente; sin ella se dice que no hay uso detectado', () => {
  const t = construirSintetico();
  const por = Object.fromEntries(t.indices.map((i) => [i.nombre, i]));
  assert.match(por.ux_t_nombre.paraQue[0].texto, /no se repita/);
  assert.match(por.ux_t_nombre.paraQue[0].fuente, /regla 2$/);
  const fk = por.ix_t_padre.paraQue.find((p) => p.fuente.endsWith('regla 3'));
  assert.match(fk.texto, /fk_t_padre/);
  assert.ok(
    por.ix_t_padre.paraQue.some(
      (p) => p.tipo === 'CONSULTA' && p.confianza === 'POR_PREFIJO_DE_FILTRO',
    ),
  );
  assert.ok(
    por.ix_t_parcial.paraQue.some(
      (p) => p.tipo === 'ESTRUCTURAL' && /nombre IS NOT NULL/.test(p.texto),
    ),
  );
  assert.deepEqual(por.ix_t_sin_uso.paraQue, [{ estado: 'SIN_USO_DETECTADO' }]);
});

test('gobierno: append-only sólo si un README lo declara; PII y demás no se inventan', () => {
  const t = construirSintetico();
  assert.equal(t.gobierno.appendOnly.valor, true);
  assert.deepEqual(t.gobierno.appendOnly.fuentes, ['README.md:5']);
  const sin = construirSintetico({ appendOnly: new Map() });
  assert.equal(sin.gobierno.appendOnly.estado, 'NO_DECLARADO');
  assert.equal(t.gobierno.pii.estado, 'SIN_FUENTE');
  assert.equal(
    t.columnas.every((c) => c.clasificacion.estado === 'SIN_FUENTE'),
    true,
  );
});

test('operaciones por tabla: la inversa del inventario de endpoints', () => {
  const t = construirSintetico();
  assert.deepEqual(
    t.operaciones.map((o) => o.operacionId),
    ['op1'],
  );
});

// ---------------------------------------------------------------------------------------------
// Contra el modelo y el código reales (se construye una vez, ~25 s).

const MODEL_ROOT = rutaDelModelo(process.cwd());
let modelo;
let catalogo;
let endpointsReales;
before(async () => {
  const { construirInventarioDeEndpoints } =
    await import('./inventario-endpoints.mjs');
  const base = construirInventarioDeEndpoints({
    root: process.cwd(),
    modelRoot: MODEL_ROOT,
  });
  endpointsReales = base.endpoints;
  modelo = leerModelo(MODEL_ROOT);
  const comentarios = leerComentariosDeColumna(MODEL_ROOT, modelo.tablas);
  const orm = leerColumnasDeEntidades(base.index, base.datos.entidades);
  const por = new Map();
  for (const e of base.datos.entidades.values())
    if (e.modulo)
      por.set(e.modulo, (por.get(e.modulo) ?? new Set()).add(e.tabla));
  catalogo = construirCatalogo({
    modelRoot: MODEL_ROOT,
    modelo,
    comentarios: comentarios.porColumna,
    orm,
    consultas: leerConsultas(base.index, base.datos),
    entidades: base.datos.entidades,
    endpoints: base.endpoints,
    appendOnly: leerAppendOnly(process.cwd(), por),
    dominioPorEsquema: dominiosPorEsquema(process.cwd(), MODEL_ROOT),
  });
});

test('conteos del modelo: 1 230 tablas, 16 852 columnas, 7 069 FK y 7 836 índices', () => {
  assert.deepEqual(
    {
      tablas: modelo.conteos.tablas,
      columnas: modelo.conteos.columnas,
      relaciones: modelo.conteos.relaciones,
      indices: modelo.conteos.indices,
    },
    { tablas: 1230, columnas: 16852, relaciones: 7069, indices: 7836 },
  );
  assert.equal(catalogo.tablas.length, 1230);
  assert.equal(
    new Set(catalogo.tablas.map((t) => t.id)).size,
    1230,
    'ids únicos',
  );
  const r = resumirCatalogo(catalogo.tablas);
  assert.deepEqual(
    { columnas: r.columnas, indices: r.indices, relaciones: r.relaciones },
    { columnas: 16852, indices: 7836 + 431, relaciones: 7069 },
  );
});

test('toda FK apunta a una tabla del catálogo', () => {
  const ids = new Set(catalogo.tablas.map((t) => t.id));
  const rotas = catalogo.tablas.flatMap((t) =>
    t.relaciones.salientes
      .filter((r) => !ids.has(`${r.hacia.schema}.${r.hacia.tabla}`))
      .map((r) => `${t.id} → ${r.hacia.schema}.${r.hacia.tabla}`),
  );
  assert.deepEqual(rotas, []);
});

test('iam.users.must_change_password trae su comentario del modelo con archivo y línea', () => {
  const t = catalogo.tablas.find((x) => x.id === 'iam.users');
  const c = t.columnas.find((x) => x.nombre === 'must_change_password');
  assert.equal(c.descripcion.tipo, 'MODELO_PUML');
  assert.match(c.descripcion.texto, /fijar su propia contraseña/);
  assert.match(c.descripcion.fuente, /diagram_01_iam\.puml:\d+$/);
});

test('ninguna descripción repite el nombre de la columna: las plantillas vacías no cuentan como dato', () => {
  const vacias = catalogo.tablas.flatMap((t) =>
    t.columnas
      .filter((c) =>
        /mantenido por la instancia|^Identificador asociado a /i.test(
          c.descripcion.texto ?? '',
        ),
      )
      .map((c) => `${t.id}.${c.nombre}`),
  );
  assert.deepEqual(vacias, []);
});

test('los conteos de deriva reconcilian: entidades = tablas con entidad + entidades sin tabla', () => {
  const r = resumirCatalogo(catalogo.tablas);
  const conEntidad = catalogo.tablas.filter((t) => t.entidadOrm).length;
  assert.equal(conEntidad, r.tablasConEntidad);
  assert.equal(
    catalogo.tablas.length - conEntidad,
    catalogo.deriva.tablasSinEntidad.length,
  );
  const columnasSinEntidad = catalogo.tablas
    .filter((t) => !t.entidadOrm)
    .reduce((n, t) => n + t.columnas.length, 0);
  assert.equal(r.columnasOrm.SIN_ENTIDAD ?? 0, columnasSinEntidad);
});

test('cada índice único y cada índice que cubre una FK dicen su fuente en indexing-strategy.md', () => {
  let unicos = 0;
  for (const t of catalogo.tablas)
    for (const i of t.indices) {
      if (i.unico) {
        unicos += 1;
        assert.ok(
          i.paraQue.some((p) => p.fuente?.endsWith('regla 2')),
          `${t.id}.${i.nombre}`,
        );
      }
    }
  assert.ok(unicos > 100);
});

test('toda operación del inventario que toca una tabla del catálogo aparece en la ficha de esa tabla', () => {
  const porId = new Map(catalogo.tablas.map((t) => [t.id, t]));
  let revisadas = 0;
  for (const e of endpointsReales)
    for (const tabla of e.tablas) {
      const ficha = porId.get(`${tabla.schema}.${tabla.tabla}`);
      if (!ficha) continue;
      assert.ok(
        ficha.operaciones.some((o) => o.operacionId === e.id),
        `${e.id} falta en ${ficha.id}`,
      );
      revisadas += 1;
    }
  assert.ok(revisadas > 3000);
});

// ---------------------------------------------------------------------------------------------
// Linaje: contra su esquema.

const esquemaLinaje = JSON.parse(
  fs.readFileSync(
    path.join(import.meta.dirname, '../schema/linaje.schema.json'),
    'utf8',
  ),
);
const validarLinaje = new Ajv({ allErrors: true }).compile(esquemaLinaje);

test('el linaje cumple su esquema, sus métricas cuadran y no hay aristas huérfanas', () => {
  const l = construirLinaje({
    tablas: catalogo.tablas,
    endpoints: endpointsReales,
  });
  assert.equal(
    validarLinaje(l),
    true,
    JSON.stringify(validarLinaje.errors?.slice(0, 2)),
  );
  assert.equal(l.metricas.aristas, l.aristas.length);
  assert.equal(l.metricas.tablas, 1230);
  assert.equal(l.metricas.tablasConPii, 'SIN_FUENTE');
  assert.equal(
    l.metricas.operacionATabla,
    l.aristas.filter((a) => ['LEE', 'ESCRIBE', 'BORRA'].includes(a.tipo))
      .length,
  );
  assert.equal(
    l.metricas.tablaATabla,
    l.aristas.filter((a) => a.tipo === 'REFERENCIA').length,
  );
  const ids = new Set(l.nodos.map((n) => n.id));
  for (const a of l.aristas)
    assert.ok(ids.has(a.de) && ids.has(a.a), JSON.stringify(a));
});
