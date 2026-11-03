import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Lo que la catalogación necesita del inventario generado (`inventario/**`), ya en una forma
 * estrecha y sin dependencia del resto del módulo. Es lectura: nada de esto se escribe aquí.
 */

export interface InvColumn {
  name: string;
  ordinal: number;
  nativeType: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultExpr: string | null;
  foreignKeys: { schema: string; table: string; column: string }[];
  description: {
    text: string | null;
    kind: string | null;
    reference: string | null;
  };
}

export interface InvTableOperation {
  operationId: string;
  access: 'LEE' | 'ESCRIBE' | 'BORRA';
  detail: string | null;
  confidence: string | null;
}

export interface InvTable {
  id: string;
  schema: string;
  name: string;
  domain: { name: string; number: number; reference: string } | null;
  purpose: { text: string | null; state: string; reference: string | null };
  ormEntity: { className: string; file: string } | null;
  appendOnly: { declared: boolean; reference: string | null };
  columns: InvColumn[];
  outgoingRelations: number;
  incomingRelations: number;
  indexes: { total: number; unique: number };
  operations: InvTableOperation[];
}

export interface InvDtoField {
  name: string;
  description: string | null;
  reference: string | null;
}

export interface InvOperation {
  id: string;
  origin: string;
  method: string;
  path: string;
  module: string;
  businessExplanation: { state: string; text: string | null };
  systemExplanation: { state: string; text: string | null };
  reviewState: string;
  requestDto: string | null;
  responseDto: string | null;
  requestFields: InvDtoField[];
  responseFields: InvDtoField[];
  tables: {
    schema: string;
    table: string;
    access: 'LEE' | 'ESCRIBE' | 'BORRA';
    detail: string | null;
    confidence: string | null;
    source: string | null;
  }[];
  hasNoTables: boolean;
  isMutation: boolean;
  flowCodes: string[];
}

export interface InvGlossaryTerm {
  term: string;
  definition: string;
  source: string;
  relatedTables: string[];
}

export interface CatalogacionInventory {
  /** Directorio del que se leyó. */
  directory: string;
  tables: InvTable[];
  operations: InvOperation[];
  glossary: InvGlossaryTerm[];
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json =>
  v !== null && typeof v === 'object' ? (v as Json) : {};
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

/** Directorio por defecto del inventario: el mismo criterio que `InventoryRepository.directory()`. */
export function defaultInventoryDirectory(): string {
  return resolve(
    process.env.INVENTARIO_DIR ?? join(process.cwd(), 'inventario'),
  );
}

function parseTable(raw: Json): InvTable {
  const dominio = obj(raw.dominio);
  const proposito = obj(raw.proposito);
  const orm = obj(raw.entidadOrm);
  const gobierno = obj(raw.gobierno);
  const appendOnly = obj(gobierno.appendOnly);
  const relaciones = obj(raw.relaciones);
  const indices = arr(raw.indices).map(obj);
  return {
    id: String(raw.id),
    schema: String(raw.schema),
    name: String(raw.tabla),
    domain: str(dominio.dominio)
      ? {
          name: String(dominio.dominio),
          number: Number(dominio.numero),
          reference: str(dominio.fuente) ?? '',
        }
      : null,
    purpose: {
      text: str(proposito.texto),
      state: str(proposito.estado) ?? 'DESCONOCIDO',
      reference: str(proposito.fuente),
    },
    ormEntity: str(orm.clase)
      ? { className: String(orm.clase), file: str(orm.archivo) ?? '' }
      : null,
    appendOnly: {
      declared: appendOnly.estado === 'DECLARADO_EN_README',
      reference: str(appendOnly.fuente),
    },
    columns: arr(raw.columnas).map((c) => {
      const col = obj(c);
      const desc = obj(col.descripcion);
      return {
        name: String(col.nombre),
        ordinal: Number(col.ordinal),
        nativeType: String(col.tipo),
        nullable: col.nulable === true,
        primaryKey: col.pk === true,
        unique: arr(col.uk).length > 0,
        defaultExpr: str(col.defecto),
        foreignKeys: arr(col.fk).map((f) => {
          const hacia = obj(obj(f).hacia);
          return {
            schema: String(hacia.schema),
            table: String(hacia.tabla),
            column: String(hacia.columna),
          };
        }),
        description: {
          text: str(desc.texto),
          kind: str(desc.tipo),
          reference: str(desc.fuente),
        },
      };
    }),
    outgoingRelations: arr(relaciones.salientes).length,
    incomingRelations: arr(relaciones.entrantes).length,
    indexes: {
      total: indices.length,
      unique: indices.filter((i) => i.unico === true).length,
    },
    operations: arr(raw.operaciones).map((o) => {
      const op = obj(o);
      return {
        operationId: String(op.operacionId),
        access: op.operacion as InvTableOperation['access'],
        detail: str(op.detalle),
        confidence: str(op.confianza),
      };
    }),
  };
}

function parseFields(value: unknown): InvDtoField[] {
  return arr(obj(value).campos).map((c) => {
    const campo = obj(c);
    return {
      name: String(campo.campo),
      description: str(campo.descripcion),
      reference: str(campo.fuente),
    };
  });
}

function parseOperation(raw: Json): InvOperation {
  const exp = obj(raw.explicacion);
  const neg = obj(exp.negocio);
  const sis = obj(exp.sistema);
  const cuerpo = obj(raw.cuerpo);
  const respuesta = obj(raw.respuesta);
  const metodo = String(raw.metodo);
  return {
    id: String(raw.id),
    origin: String(raw.origen),
    method: metodo,
    path: String(raw.ruta),
    module: String(raw.modulo),
    businessExplanation: {
      state: str(neg.estado) ?? 'SIN_FUENTE',
      text: str(neg.texto),
    },
    systemExplanation: {
      state: str(sis.estado) ?? 'SIN_FUENTE',
      text: str(sis.texto),
    },
    reviewState: str(obj(raw.revision).estado) ?? 'DESCONOCIDO',
    requestDto: str(cuerpo.dto),
    responseDto: str(respuesta.dto),
    requestFields: parseFields(raw.cuerpo),
    responseFields: parseFields(raw.respuesta),
    tables: arr(raw.tablas).map((t) => {
      const tabla = obj(t);
      return {
        schema: String(tabla.schema),
        table: String(tabla.tabla),
        access: tabla.operacion as 'LEE' | 'ESCRIBE' | 'BORRA',
        detail: str(tabla.detalle),
        confidence: str(tabla.confianza),
        source: str(tabla.fuente),
      };
    }),
    hasNoTables: raw.sinTablas !== null && raw.sinTablas !== undefined,
    isMutation: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo),
    flowCodes: arr(raw.flujos).map((f) => String(obj(f).codigo)),
  };
}

/**
 * Lee el inventario. Lanza si el directorio no tiene el inventario: una catalogación sobre nada
 * no debe pasar por «0 de 0».
 */
export function readCatalogacionInventory(
  directory: string = defaultInventoryDirectory(),
): CatalogacionInventory {
  if (!existsSync(join(directory, 'endpoints', 'indice.json')))
    throw new Error(
      `El inventario no está en ${directory}: se genera con yarn inventario:endpoints, :flujos y :catalogo`,
    );
  const noTabla = new Set(['indice.json', 'deriva-bd.json']);
  const tables: InvTable[] = [];
  for (const file of readdirSync(join(directory, 'catalogo')).sort()) {
    if (!file.endsWith('.json') || noTabla.has(file)) continue;
    for (const t of arr(readJson(join(directory, 'catalogo', file))))
      tables.push(parseTable(obj(t)));
  }
  const operations: InvOperation[] = [];
  for (const file of readdirSync(join(directory, 'endpoints')).sort()) {
    if (!file.endsWith('.json') || file === 'indice.json') continue;
    for (const o of arr(readJson(join(directory, 'endpoints', file))))
      operations.push(parseOperation(obj(o)));
  }
  const glossary = existsSync(join(directory, 'glosario.json'))
    ? arr(readJson(join(directory, 'glosario.json'))).map((g) => {
        const t = obj(g);
        return {
          term: String(t.termino),
          definition: String(t.definicion),
          source: String(t.fuente),
          relatedTables: arr(t.tablasRelacionadas).map(String),
        };
      })
    : [];
  tables.sort((a, b) => a.id.localeCompare(b.id));
  operations.sort((a, b) => a.id.localeCompare(b.id));
  return { directory, tables, operations, glossary };
}
