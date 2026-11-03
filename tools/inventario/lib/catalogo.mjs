// Catálogo de datos: una ficha por tabla del modelo (DDL canónico), con sus columnas, relaciones,
// índices, restricciones, las operaciones que la tocan y cómo se compara con el ORM.
//
// Cada descripción cita su fuente o dice «sin dato». Nada se infiere por el nombre de una columna:
// lo que no tiene fuente se muestra como tal. La estructura (PK, FK, único, obligatoria) sí es un
// hecho del DDL y se muestra como «rol estructural», separada de la descripción.
import fs from 'node:fs';
import path from 'node:path';
import { clave } from './modelo.mjs';
import { aSnake, familiaDeTipo } from './orm.mjs';

const MARCA_DE_VERSION = /^\+\s*v[\d.]+(\s*\([^)]*\))?\s*[:.]?\s*$/i;
const DOC_INDICES =
  'Mantra Core Health Context/docs/architecture/indexing-strategy.md';

/**
 * ¿Dónde declara el modelo una tabla que el DDL relacional no tiene? Busca su nombre calificado en
 * `NoSQL/**` (Timescale, pgvector…) y en `SQL/patches/**`. Si no aparece en ninguna, lo dice.
 */
export function ubicacionDeDdl(modelRoot, esquema, tabla) {
  const calificados = [`"${esquema}"."${tabla}"`, `${esquema}.${tabla}`];
  const buscar = (dir) => {
    const ruta = path.join(modelRoot, dir);
    if (!fs.existsSync(ruta)) return null;
    const pila = [ruta];
    while (pila.length) {
      const actual = pila.pop();
      for (const e of fs.readdirSync(actual, { withFileTypes: true })) {
        const p = path.join(actual, e.name);
        if (e.isDirectory()) pila.push(p);
        else if (
          e.name.endsWith('.sql') &&
          calificados.some((c) => fs.readFileSync(p, 'utf8').includes(c))
        )
          return path.relative(modelRoot, p);
      }
    }
    return null;
  };
  const nosql = buscar('NoSQL');
  if (nosql) return { tipo: 'NOSQL', fuente: nosql };
  const parche = buscar('SQL/patches');
  if (parche) return { tipo: 'PARCHE', fuente: parche };
  return { tipo: 'SIN_DDL', fuente: null };
}

/** Parte `"a", "b"` o `lower(x), y` en elementos de primer nivel. */
export function partirColumnas(texto) {
  const partes = [];
  let actual = '';
  let profundidad = 0;
  let comilla = null;
  for (const c of texto) {
    if (comilla) {
      if (c === comilla) comilla = null;
    } else if (c === "'") comilla = c;
    else if (c === '"' && profundidad > 0) comilla = c;
    else if (c === '(') profundidad += 1;
    else if (c === ')') profundidad -= 1;
    if (c === ',' && profundidad === 0 && !comilla) {
      partes.push(actual.trim());
      actual = '';
    } else actual += c;
  }
  if (actual.trim()) partes.push(actual.trim());
  return partes.map((p) =>
    /^"[^"]+"$/.test(p)
      ? { columna: p.slice(1, -1) }
      : /^[a-z_][a-z0-9_]*$/i.test(p)
        ? { columna: p }
        : { expresion: p },
  );
}

/** Método de acceso de cada índice (`USING gist`…) leído de su DDL de origen. */
function metodosDeIndice(modelRoot, filas) {
  const metodos = new Map();
  const archivos = new Set(filas.map((f) => f.source_ddl));
  for (const archivo of archivos) {
    const ruta = path.join(modelRoot, archivo);
    if (!fs.existsSync(ruta)) continue;
    const texto = fs.readFileSync(ruta, 'utf8');
    for (const m of texto.matchAll(
      /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?"?([a-z0-9_]+)"?\s+ON\s+[^\n]*?USING\s+(gist|gin|brin|hash|spgist)\b/gi,
    ))
      metodos.set(`${archivo}|${m[1]}`, m[2].toLowerCase());
  }
  return metodos;
}

const REGLA_POR_METODO = {
  gist: 'GiST para periodos, no solapamiento y geografía',
  brin: 'BRIN para logs e historiales append-only de gran volumen',
  gin: 'GIN para búsqueda textual gobernada',
};
const NUMERO_DE_REGLA = { unico: 2, fk: 3, gist: 6, brin: 7, gin: 8 };

/**
 * @param {object} deps
 * @param {string} deps.modelRoot
 * @param {ReturnType<import('./modelo.mjs').leerModelo>} deps.modelo
 * @param {Map<string, {texto: string, fuente: string}>} deps.comentarios - puml por `schema.tabla.columna`
 * @param {Map<string, object>} deps.orm - `leerColumnasDeEntidades`
 * @param {Map<string, object[]>} deps.consultas - `leerConsultas` por clave de entidad
 * @param {Map<string, object>} deps.entidades - `datos.entidades`
 * @param {object[]} deps.endpoints - inventario de endpoints
 * @param {Map<string, {fuente: string, forma: string}[]>} deps.appendOnly - por `modulo.tabla`
 * @param {Map<string, string>} deps.dominioPorEsquema
 * @param {object|null} [deps.derivaBd] - `inventario/catalogo/deriva-bd.json`, si existe
 */
export function construirCatalogo({
  derivaBd = null,
  modelRoot,
  modelo,
  comentarios,
  orm,
  consultas,
  entidades,
  endpoints,
  appendOnly,
  dominioPorEsquema,
}) {
  const metodos = metodosDeIndice(
    modelRoot,
    [...modelo.indices.values()].flat(),
  );

  // operaciones por tabla
  const operaciones = new Map();
  for (const e of endpoints)
    for (const t of e.tablas) {
      const k = clave(t.schema, t.tabla);
      const lista = operaciones.get(k) ?? [];
      if (
        !lista.some(
          (o) =>
            o.operacionId === e.id &&
            o.operacion === t.operacion &&
            o.detalle === t.detalle,
        )
      )
        lista.push({
          operacionId: e.id,
          metodo: e.metodo,
          ruta: e.ruta,
          operacion: t.operacion,
          detalle: t.detalle,
          confianza: t.confianza,
        });
      operaciones.set(k, lista);
    }

  // relaciones
  const salientes = new Map();
  const entrantes = new Map();
  for (const r of modelo.relaciones) {
    const origen = clave(r.source_schema, r.source_table);
    const destino = clave(r.target_schema, r.target_table);
    const columnas = r.source_columns.split(',').map((c) => c.trim());
    const hacia = r.target_columns.split(',').map((c) => c.trim());
    const base = {
      constraint: r.constraint_name,
      resolucion: r.resolution,
      fuente: r.source_ddl,
    };
    salientes.set(origen, [
      ...(salientes.get(origen) ?? []),
      {
        ...base,
        columnas,
        hacia: {
          schema: r.target_schema,
          tabla: r.target_table,
          columnas: hacia,
        },
      },
    ]);
    entrantes.set(destino, [
      ...(entrantes.get(destino) ?? []),
      {
        ...base,
        desde: { schema: r.source_schema, tabla: r.source_table, columnas },
        columnas: hacia,
      },
    ]);
  }

  // entidad por tabla y módulo del ORM
  const entidadPorTabla = new Map();
  for (const e of entidades.values())
    entidadPorTabla.set(clave(e.schema, e.tabla), e);

  const tablas = [];
  const deriva = {
    entidadesSinTabla: [],
    tablasSinEntidad: [],
    columnasAusentesEnOrm: 0,
    columnasDeMasEnOrm: 0,
    nulabilidad: 0,
    tipos: 0,
  };

  for (const [k, t] of modelo.tablas) {
    const columnasDdl = modelo.columnas.get(k) ?? [];
    const restricciones = modelo.restricciones.get(k) ?? [];
    const entidad = entidadPorTabla.get(k) ?? null;
    const detalleOrm = orm.get(k) ?? null;
    const fks = salientes.get(k) ?? [];
    const pk = new Set(
      restricciones
        .filter((r) => r.constraint_type === 'PRIMARY KEY')
        .flatMap((r) => r.columns.split(',').map((c) => c.trim())),
    );
    const unicas = restricciones.filter(
      (r) => r.constraint_type === 'UNIQUE INDEX',
    );

    // ---- columnas
    const columnas = columnasDdl.map((c) => {
      const fk = fks
        .filter((f) => f.columnas.includes(c.column))
        .map((f) => ({
          constraint: f.constraint,
          hacia: {
            schema: f.hacia.schema,
            tabla: f.hacia.tabla,
            columna: f.hacia.columnas[f.columnas.indexOf(c.column)],
          },
        }));
      const uk = unicas
        .filter((u) =>
          u.columns
            .split(',')
            .map((x) => x.trim())
            .includes(c.column),
        )
        .map((u) => u.constraint_name);
      const delOrm = detalleOrm?.columnas.get(c.column) ?? null;
      const puml = comentarios.get(`${k}.${c.column}`) ?? null;
      let descripcion;
      let anotacion = null;
      if (puml && !MARCA_DE_VERSION.test(puml.texto))
        descripcion = {
          texto: puml.texto,
          tipo: 'MODELO_PUML',
          fuente: puml.fuente,
        };
      else if (delOrm?.comentario)
        descripcion = {
          texto: delOrm.comentario,
          tipo: 'JSDOC_ENTIDAD',
          fuente: delOrm.fuente,
        };
      else if (delOrm?.comentarioEstandar)
        descripcion = {
          texto: delOrm.comentarioEstandar,
          tipo: 'JSDOC_ESTANDAR',
          fuente: delOrm.fuente,
        };
      else descripcion = { estado: 'SIN_DATO' };
      if (puml && MARCA_DE_VERSION.test(puml.texto))
        anotacion = {
          version: puml.texto.replace(/^\+\s*/, ''),
          fuente: puml.fuente,
        };

      const rol = [];
      if (pk.has(c.column)) rol.push('Clave primaria');
      for (const f of fk)
        rol.push(
          `Clave foránea → ${f.hacia.schema}.${f.hacia.tabla}.${f.hacia.columna}`,
        );
      for (const u of uk) rol.push(`Parte de la restricción única ${u}`);
      rol.push(c.nullable === 'NO' ? 'Obligatoria' : 'Opcional');

      // comparación con el ORM
      let orme = 'COINCIDE';
      const dif = [];
      if (!delOrm) orme = entidad ? 'AUSENTE_EN_ORM' : 'SIN_ENTIDAD';
      else {
        if ((c.nullable === 'NO') === delOrm.nulable && !delOrm.pk) {
          orme = 'NULABILIDAD_DIVERGE';
          dif.push(
            `el modelo dice ${c.nullable === 'NO' ? 'obligatoria' : 'opcional'} y la entidad ${delOrm.nulable ? 'opcional' : 'obligatoria'}`,
          );
        }
        const tipoOrm = familiaDeTipo(delOrm.tipo);
        const tipoDdl = familiaDeTipo(c.data_type);
        // `type: 'array'` de MikroORM es cualquier arreglo; `json` se materializa como jsonb en PostgreSQL
        const equivalente =
          (tipoOrm === 'array' && tipoDdl?.endsWith('[]')) ||
          (tipoOrm === 'json' && tipoDdl === 'jsonb');
        if (tipoOrm && tipoDdl && tipoOrm !== tipoDdl && !equivalente) {
          orme = orme === 'COINCIDE' ? 'TIPO_DIVERGE' : orme;
          dif.push(`el modelo dice ${c.data_type} y la entidad ${delOrm.tipo}`);
        }
      }
      if (orme === 'AUSENTE_EN_ORM') deriva.columnasAusentesEnOrm += 1;
      if (orme === 'NULABILIDAD_DIVERGE') deriva.nulabilidad += 1;
      if (orme === 'TIPO_DIVERGE') deriva.tipos += 1;

      return {
        nombre: c.column,
        ordinal: Number(c.ordinal),
        tipo: c.data_type,
        nulable: c.nullable !== 'NO',
        defecto: c.default || null,
        pk: pk.has(c.column),
        fk,
        uk,
        restricciones: c.restrictions || null,
        rol,
        descripcion,
        ...(anotacion ? { anotacion } : {}),
        clasificacion: { estado: 'SIN_FUENTE' },
        orm: {
          estado: orme,
          ...(dif.length ? { detalle: dif } : {}),
          ...(delOrm
            ? { propiedad: delOrm.propiedad, fuente: delOrm.fuente }
            : {}),
        },
        fuente: c.source_ddl,
      };
    });

    // ---- columnas del ORM que el DDL no tiene
    const nombresDdl = new Set(columnasDdl.map((c) => c.column));
    const deMas = detalleOrm
      ? [...detalleOrm.columnas.values()]
          .filter((c) => !nombresDdl.has(c.columna))
          .map((c) => ({
            columna: c.columna,
            propiedad: c.propiedad,
            fuente: c.fuente,
          }))
      : [];
    deriva.columnasDeMasEnOrm += deMas.length;
    if (!entidad) deriva.tablasSinEntidad.push(k);

    // ---- índices
    const indices = (modelo.indices.get(k) ?? []).map((i) => {
      const cols = partirColumnas(i.columns_or_expression);
      const soloColumnas = cols.every((x) => x.columna);
      const nombres = cols.filter((x) => x.columna).map((x) => x.columna);
      const unico = i.unique === 'YES';
      const metodo =
        i.metodo ?? metodos.get(`${i.source_ddl}|${i.index_name}`) ?? null;
      const paraQue = [];
      if (unico)
        paraQue.push({
          tipo: 'DOCUMENTO',
          texto: `Garantiza que no se repita la combinación (${nombres.join(', ') || i.columns_or_expression})`,
          fuente: `${DOC_INDICES} regla ${NUMERO_DE_REGLA.unico}`,
          criterio: 'el índice es UNIQUE',
        });
      if (soloColumnas) {
        const fkCubierta = fks.find(
          (f) =>
            f.columnas.length <= nombres.length &&
            f.columnas.every((c, idx) => nombres[idx] === c),
        );
        if (fkCubierta)
          paraQue.push({
            tipo: 'DOCUMENTO',
            texto: `Soporta la clave foránea ${fkCubierta.constraint}: PostgreSQL no indexa las FK por sí mismo`,
            fuente: `${DOC_INDICES} regla ${NUMERO_DE_REGLA.fk}`,
            criterio: 'las primeras columnas del índice son las de la FK',
          });
      }
      if (metodo && REGLA_POR_METODO[metodo])
        paraQue.push({
          tipo: 'DOCUMENTO',
          texto: REGLA_POR_METODO[metodo],
          fuente: `${DOC_INDICES} regla ${NUMERO_DE_REGLA[metodo]}`,
          criterio: `el índice usa ${metodo.toUpperCase()}`,
        });
      if (i.predicate)
        paraQue.push({
          tipo: 'ESTRUCTURAL',
          texto: `Índice parcial: sólo indexa las filas donde ${i.predicate}`,
          fuente: i.source_ddl,
          criterio: 'el DDL declara un predicado',
        });
      if (soloColumnas && entidad && nombres.length) {
        const propADdl = new Map(
          [...(detalleOrm?.columnas.values() ?? [])].map((c) => [
            c.propiedad,
            c.columna,
          ]),
        );
        const candidatas = (consultas.get(entidad.clave) ?? []).filter((q) => {
          const cols2 = new Set(
            [...q.propiedades, ...q.orden].map(
              (p) => propADdl.get(p) ?? aSnake(p),
            ),
          );
          return cols2.has(nombres[0]);
        });
        if (candidatas.length)
          paraQue.push({
            tipo: 'CONSULTA',
            confianza: 'POR_PREFIJO_DE_FILTRO',
            texto: `${candidatas.length} consulta(s) de repositorio filtran u ordenan por «${nombres[0]}», la primera columna del índice`,
            consultas: candidatas
              .slice(0, 3)
              .map((q) => ({ metodo: q.metodo, fuente: q.fuente })),
            criterio: 'candidatura estática: no hay plan de ejecución',
          });
      }
      return {
        nombre: i.index_name,
        unico,
        columnas: cols,
        predicado: i.predicate || null,
        metodo,
        origen: i.omitido ? 'SQL_NO_CATALOGADO_EN_CSV' : 'CSV',
        paraQue: paraQue.length ? paraQue : [{ estado: 'SIN_USO_DETECTADO' }],
        fuente: i.source_ddl,
      };
    });

    // ---- gobierno
    const declaraciones = detalleOrm
      ? (appendOnly.get(`${detalleOrm.modulo}.${t.table}`) ?? [])
      : [];
    tablas.push({
      id: k,
      schema: t.schema,
      tabla: t.table,
      dominio: dominioPorEsquema.get(t.schema) ?? null,
      diagrama: t.source_diagram,
      ddl: t.source_ddl,
      proposito: {
        texto: t.business_rationale || null,
        estado: t.rationale_status,
        fuente: t.rationale_evidence || null,
      },
      entidadOrm: entidad
        ? {
            clase: entidad.clase,
            archivo: entidad.relative,
            modulo: entidad.modulo,
          }
        : null,
      gobierno: {
        appendOnly: declaraciones.length
          ? {
              valor: true,
              estado: 'DECLARADO_EN_README',
              fuentes: declaraciones.map((d) => d.fuente),
            }
          : { estado: 'NO_DECLARADO' },
        pii: { estado: 'SIN_FUENTE' },
        financiera: { estado: 'SIN_FUENTE' },
        criticaParaAuditoria: { estado: 'SIN_FUENTE' },
        retencion: { estado: 'SIN_FUENTE' },
        responsable: { estado: 'SIN_FUENTE' },
      },
      columnas,
      relaciones: { salientes: fks, entrantes: entrantes.get(k) ?? [] },
      indices,
      restricciones: restricciones.map((r) => ({
        nombre: r.constraint_name,
        tipo: r.constraint_type,
        columnas: r.columns,
        definicion: r.definition,
      })),
      operaciones: operaciones.get(k) ?? [],
      deriva: {
        ddl: 'PRESENTE',
        orm: {
          estado: entidad
            ? columnas.every((c) => c.orm.estado === 'COINCIDE') &&
              !deMas.length
              ? 'COINCIDE'
              : 'DIVERGE'
            : 'SIN_ENTIDAD',
          columnasDeMas: deMas,
        },
        desplegada: derivaBd?.tablas?.[k] ?? { estado: 'SIN_VERIFICAR' },
      },
      revision: { estado: 'AUTO_DETECTADA' },
    });
  }
  for (const e of entidades.values())
    if (!modelo.tablas.has(clave(e.schema, e.tabla)))
      deriva.entidadesSinTabla.push({
        tabla: clave(e.schema, e.tabla),
        clase: e.clase,
        archivo: e.relative,
        ddl: ubicacionDeDdl(modelRoot, e.schema, e.tabla),
      });
  tablas.sort((a, b) => a.id.localeCompare(b.id));
  return { tablas, deriva };
}

/** Cifras del catálogo para el índice, las pruebas y el reporte. */
export function resumirCatalogo(tablas) {
  const columnas = tablas.flatMap((t) => t.columnas);
  const indices = tablas.flatMap((t) => t.indices);
  const cuenta = (lista, f) =>
    lista.reduce((a, x) => ((a[f(x)] = (a[f(x)] ?? 0) + 1), a), {});
  const conDescripcion = columnas.filter((c) => c.descripcion.texto);
  const conParaQue = indices.filter((i) => !i.paraQue[0].estado);
  return {
    esquemas: new Set(tablas.map((t) => t.schema)).size,
    tablas: tablas.length,
    columnas: columnas.length,
    indices: indices.length,
    relaciones: tablas.reduce((n, t) => n + t.relaciones.salientes.length, 0),
    columnasConDescripcion: conDescripcion.length,
    descripcionPorFuente: cuenta(conDescripcion, (c) => c.descripcion.tipo),
    indicesConParaQue: conParaQue.length,
    paraQuePorTipo: cuenta(
      conParaQue.flatMap((i) => i.paraQue),
      (p) => p.tipo,
    ),
    tablasConEntidad: tablas.filter((t) => t.entidadOrm).length,
    tablasAppendOnlyDeclaradas: tablas.filter(
      (t) => t.gobierno.appendOnly.valor,
    ).length,
    tablasConOperaciones: tablas.filter((t) => t.operaciones.length).length,
    orm: cuenta(tablas, (t) => t.deriva.orm.estado),
    columnasOrm: cuenta(columnas, (c) => c.orm.estado),
  };
}
