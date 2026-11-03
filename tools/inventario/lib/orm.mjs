// Columnas que declara cada entidad MikroORM y su comentario, leídas del AST.
//
// La entidad es una de las tres vistas del esquema (modelo → ORM → base desplegada). Acá se lee
// lo que el ORM *cree* que existe: nombre de columna, tipo, obligatoriedad y clave primaria.
import ts from 'typescript';
import { decoratorInfo, getDecorators, jsDoc } from './ast.mjs';

/**
 * Comentarios que genera `gen_entities.py`. Los dos primeros no dicen nada de negocio (repiten el
 * nombre de la columna); los demás son convenciones de columnas estándar y sí describen algo.
 */
const VACIAS = [
  /^Valor de .+ mantenido por la instancia\.?$/i,
  /^Identificador asociado a .+\.?$/i,
  /^Mapea la entidad persistente asociada a .+\.?$/i,
];
const ESTANDAR = [
  /^Identificador único de la instancia\.?$/i,
  /^Fecha y hora en que se creó el registro\.?$/i,
  /^Fecha y hora de la última actualización\.?$/i,
];

/** @returns {'VACIA' | 'ESTANDAR' | null} */
export function clasePlantilla(texto) {
  const t = texto.trim();
  if (VACIAS.some((p) => p.test(t))) return 'VACIA';
  if (ESTANDAR.some((p) => p.test(t))) return 'ESTANDAR';
  return null;
}

/** `createdByUserId` → `created_by_user_id` (la estrategia de nombres por defecto de MikroORM). */
export const aSnake = (nombre) =>
  nombre
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();

const opcion = (texto, nombre) =>
  texto?.match(
    new RegExp(`\\b${nombre}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`),
  )?.[1] ?? null;
const bandera = (texto, nombre) =>
  new RegExp(`\\b${nombre}\\s*:\\s*true\\b`).test(texto ?? '');

/**
 * @param {ReturnType<import('./ast.mjs').buildSourceIndex>} index
 * @param {Map<string, {clave: string, clase: string, schema: string, tabla: string, relative: string, modulo: string|null}>} entidades
 * @returns {Map<string, {clase: string, archivo: string, linea: number, modulo: string|null, columnas: Map<string, object>}>} por `schema.tabla`
 */
export function leerColumnasDeEntidades(index, entidades) {
  const resultado = new Map();
  for (const entidad of entidades.values()) {
    const info = index.classesPorClave.get(entidad.clave);
    if (!info) continue;
    const sf = info.sourceFile;
    const columnas = new Map();
    for (const miembro of info.node.members) {
      if (!ts.isPropertyDeclaration(miembro) || !ts.isIdentifier(miembro.name))
        continue;
      const decorador = getDecorators(miembro)
        .map((d) => decoratorInfo(d, sf))
        .find((d) => d.name === 'Property' || d.name === 'PrimaryKey');
      if (!decorador) continue;
      const args = decorador.args[0] ?? '';
      const propiedad = miembro.name.text;
      const columna = opcion(args, 'fieldName') ?? aSnake(propiedad);
      const tipo = opcion(args, 'columnType') ?? opcion(args, 'type');
      const linea =
        sf.getLineAndCharacterOfPosition(miembro.getStart()).line + 1;
      const comentario = jsDoc(miembro);
      const clase = comentario ? clasePlantilla(comentario) : null;
      columnas.set(columna, {
        propiedad,
        columna,
        tipo,
        nulable: bandera(args, 'nullable') || Boolean(miembro.questionToken),
        pk: decorador.name === 'PrimaryKey' || bandera(args, 'primary'),
        comentario: comentario && !clase ? comentario : null,
        comentarioEstandar: clase === 'ESTANDAR' ? comentario : null,
        fuente: `${entidad.relative}:${linea}`,
      });
    }
    resultado.set(`${entidad.schema}.${entidad.tabla}`, {
      clase: entidad.clase,
      archivo: entidad.relative,
      modulo: entidad.modulo,
      columnas,
    });
  }
  return resultado;
}

const FAMILIAS = {
  smallint: 'smallint',
  int2: 'smallint',
  char: 'char',
  bpchar: 'char',
  character: 'char',
  int: 'integer',
  int4: 'integer',
  integer: 'integer',
  serial: 'integer',
  int8: 'bigint',
  bigint: 'bigint',
  bigserial: 'bigint',
  varchar: 'varchar',
  'character varying': 'varchar',
  text: 'text',
  bool: 'boolean',
  boolean: 'boolean',
  timestamptz: 'timestamptz',
  'timestamp with time zone': 'timestamptz',
  timestamp: 'timestamp',
  'timestamp without time zone': 'timestamp',
  numeric: 'numeric',
  decimal: 'numeric',
  float8: 'double',
  double: 'double',
  'double precision': 'double',
  float4: 'real',
  real: 'real',
  uuid: 'uuid',
  jsonb: 'jsonb',
  json: 'json',
  date: 'date',
  time: 'time',
  bytea: 'bytea',
};
export const familiaDeTipo = (tipo) => {
  if (!tipo) return null;
  // `"schema"."tipo"` → `tipo`; `char(64)` → `char`; el sufijo `[]` se conserva
  const base = tipo
    .toLowerCase()
    .replace(/"/g, '')
    .split('.')
    .at(-1)
    .replace(/\(.*?\)/, '')
    .replace(/\s+\[\]$/, '[]')
    .trim();
  return FAMILIAS[base] ?? base;
};
