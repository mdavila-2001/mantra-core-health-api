// Lectura del modelo de datos: los CSV del catálogo técnico del repo del modelo y los
// comentarios por columna de los diagramas `.puml`, que son la fuente de significado.
import fs from 'node:fs';
import path from 'node:path';
import { parseCsvConEncabezado } from './csv.mjs';

const DIRECTORIO = 'docs/data-catalog';

function leerCsv(modelRoot, nombre) {
  const archivo = path.join(modelRoot, DIRECTORIO, nombre);
  if (!fs.existsSync(archivo))
    throw new Error(
      `Falta ${DIRECTORIO}/${nombre} en ${modelRoot}. Regenerar con: python3 docs/data-catalog/generate_catalog.py`,
    );
  return parseCsvConEncabezado(fs.readFileSync(archivo, 'utf8'), nombre);
}

export const clave = (esquema, tabla) => `${esquema}.${tabla}`;

/**
 * Índices que el DDL crea y `indexes.csv` no lista: el generador del catálogo no reconoce los
 * `CREATE INDEX … USING brin|gin|gist|hash|spgist`. Se leen del SQL, una sentencia por línea; las
 * líneas comentadas (`-- TODO … CREATE INDEX`) no existen en la base y no cuentan.
 * @returns {object[]} filas con la forma de `indexes.csv`, más `metodo` y `omitido: true`
 */
export function leerIndicesOmitidos(modelRoot, nombresDelCsv) {
  const base = path.join(modelRoot, 'SQL');
  const filas = [];
  for (const modulo of fs.readdirSync(base).sort()) {
    const archivo = path.join(base, modulo, '04_indexes.sql');
    if (!fs.existsSync(archivo)) continue;
    for (const linea of fs.readFileSync(archivo, 'utf8').split('\n')) {
      const m = linea.match(
        /^CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-z0-9_]+)"?\s+ON\s+"([^"]+)"\."([^"]+)"\s+USING\s+(brin|gin|gist|hash|spgist)\s*\(/i,
      );
      if (!m) continue;
      const desde = linea.indexOf('(', m[0].length - 1);
      let profundidad = 0;
      let fin = -1;
      let comilla = null;
      for (let i = desde; i < linea.length; i += 1) {
        const c = linea[i];
        // lo que está entre comillas (`'[)'`, `"col"`) no cuenta para el balance
        if (comilla) {
          if (c === comilla) comilla = null;
          continue;
        }
        if (c === "'" || c === '"') {
          comilla = c;
          continue;
        }
        if (c === '(') profundidad += 1;
        if (c === ')') profundidad -= 1;
        if (profundidad === 0) {
          fin = i;
          break;
        }
      }
      if (fin < 0 || nombresDelCsv.has(`${m[3]}.${m[2]}`)) continue;
      const resto = linea.slice(fin + 1);
      filas.push({
        schema: m[3],
        table: m[4],
        index_name: m[2],
        unique: m[1] ? 'YES' : 'NO',
        columns_or_expression: linea.slice(desde + 1, fin),
        predicate: resto.match(/\bWHERE\s+(.*?);?\s*$/i)?.[1] ?? '',
        source_ddl: `SQL/${modulo}/04_indexes.sql`,
        metodo: m[5].toLowerCase(),
        omitido: true,
      });
    }
  }
  return filas;
}

/**
 * @param {string} modelRoot
 * @returns {{
 *   tablas: Map<string, object>, columnas: Map<string, object[]>, relaciones: object[],
 *   indices: Map<string, object[]>, restricciones: Map<string, object[]>, dominios: object[],
 *   conteos: Record<string, number>
 * }}
 */
export function leerModelo(modelRoot) {
  const filasTablas = leerCsv(modelRoot, 'tables.csv');
  const filasColumnas = leerCsv(modelRoot, 'columns.csv');
  const filasRelaciones = leerCsv(modelRoot, 'relations.csv');
  const filasIndicesCsv = leerCsv(modelRoot, 'indexes.csv');
  const omitidos = leerIndicesOmitidos(
    modelRoot,
    new Set(filasIndicesCsv.map((f) => `${f.schema}.${f.index_name}`)),
  );
  const filasIndices = [...filasIndicesCsv, ...omitidos];
  const filasRestricciones = leerCsv(modelRoot, 'constraints.csv');
  const dominios = leerCsv(modelRoot, 'domains.csv');

  const tablas = new Map(filasTablas.map((t) => [clave(t.schema, t.table), t]));
  const agrupar = (filas, porClave) => {
    const mapa = new Map();
    for (const f of filas) {
      const k = porClave(f);
      mapa.set(k, [...(mapa.get(k) ?? []), f]);
    }
    return mapa;
  };
  const columnas = agrupar(filasColumnas, (f) => clave(f.schema, f.table));
  for (const lista of columnas.values())
    lista.sort((a, b) => Number(a.ordinal) - Number(b.ordinal));
  const huerfanas = [...columnas.keys()].filter((k) => !tablas.has(k));
  if (huerfanas.length)
    throw new Error(
      `columns.csv menciona tablas que no están en tables.csv: ${huerfanas.slice(0, 5).join(', ')}`,
    );

  return {
    tablas,
    columnas,
    relaciones: filasRelaciones,
    indices: agrupar(filasIndices, (f) => clave(f.schema, f.table)),
    restricciones: agrupar(filasRestricciones, (f) => clave(f.schema, f.table)),
    dominios,
    conteos: {
      esquemas: new Set(filasTablas.map((t) => t.schema)).size,
      tablas: filasTablas.length,
      columnas: filasColumnas.length,
      relaciones: filasRelaciones.length,
      indices: filasIndicesCsv.length,
      indicesOmitidosPorElCsv: omitidos.length,
      restricciones: filasRestricciones.length,
    },
  };
}

/**
 * Comentarios por columna de los `.puml`: una línea `'  …` dentro de un bloque `entity` y justo
 * antes de la columna que describe. Los comentarios al margen izquierdo hablan de grupos de tablas
 * y no se atribuyen a ninguna columna.
 * @returns {{ porColumna: Map<string, {texto: string, fuente: string}>, ambiguas: string[], sinEntidad: string[] }}
 */
export function leerComentariosDeColumna(modelRoot, tablas) {
  const porColumna = new Map();
  const ambiguas = [];
  const sinEntidad = [];
  const archivosPorDiagrama = new Map();
  for (const [k, t] of tablas) {
    const diagrama = t.source_diagram;
    if (!diagrama) continue;
    archivosPorDiagrama.set(diagrama, [
      ...(archivosPorDiagrama.get(diagrama) ?? []),
      { k, tabla: t.table },
    ]);
  }
  for (const [diagrama, lista] of archivosPorDiagrama) {
    const archivo = path.join(modelRoot, diagrama);
    if (!fs.existsSync(archivo)) continue;
    const lineas = fs.readFileSync(archivo, 'utf8').split('\n');
    // entidades del diagrama: nombre → [{ inicio, fin }]
    const entidades = new Map();
    let abierta = null;
    lineas.forEach((linea, i) => {
      const abre = linea.match(
        /^\s*entity\s+("?)([A-Za-z0-9_.]+)\1(?:\s+as\s+\w+)?(?:\s+<<[^>]*>>)?\s*\{\s*$/,
      );
      if (abre && !abierta)
        abierta = { nombre: abre[2].split('.').at(-1), inicio: i };
      else if (abierta && /^\s*\}\s*$/.test(linea)) {
        entidades.set(abierta.nombre, [
          ...(entidades.get(abierta.nombre) ?? []),
          { inicio: abierta.inicio, fin: i },
        ]);
        abierta = null;
      }
    });
    for (const { k, tabla } of lista) {
      const bloques = entidades.get(tabla);
      if (!bloques) {
        sinEntidad.push(k);
        continue;
      }
      if (bloques.length > 1) {
        ambiguas.push(k);
        continue;
      }
      const { inicio, fin } = bloques[0];
      let pendiente = [];
      for (let i = inicio + 1; i < fin; i += 1) {
        const linea = lineas[i];
        const comentario = linea.match(/^\s+'\s?(.*)$/);
        if (comentario) {
          pendiente.push({ texto: comentario[1].trim(), linea: i + 1 });
          continue;
        }
        const columna = linea.match(/^\s*\*?\s*([a-z_][a-z0-9_]*)\s*:/);
        if (columna && pendiente.length) {
          const texto = pendiente
            .map((p) => p.texto)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (texto)
            porColumna.set(`${k}.${columna[1]}`, {
              texto,
              fuente: `${diagrama}:${pendiente[0].linea}`,
            });
        }
        pendiente = [];
      }
    }
  }
  return { porColumna, ambiguas, sinEntidad };
}
