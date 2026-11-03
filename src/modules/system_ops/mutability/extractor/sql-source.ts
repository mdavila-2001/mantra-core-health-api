/**
 * Lectura de los SQL del modelo: qué tablas existen, qué columnas tienen y qué barreras físicas
 * (disparadores y privilegios) impiden escribirlas. Funciones puras sobre texto: el acceso a
 * disco vive en `extract-model.ts`.
 */

/** Tabla declarada en un `CREATE TABLE`. */
export interface SqlTable {
  schema: string;
  table: string;
  columns: string[];
  /** `archivo:línea`. */
  source: string;
}

/** Barrera física sobre una tabla. */
export interface SqlBarrier {
  schema: string;
  table: string;
  via: 'TRIGGER' | 'REVOKE' | 'DYNAMIC_TRIGGER' | 'DYNAMIC_REVOKE';
  /** Nombre del trigger o privilegios revocados. */
  name: string;
  /** `ALL`: ningún UPDATE; `PARTIAL`: sólo ciertos UPDATE (guardas de ciclo de vida). */
  update: 'ALL' | 'PARTIAL' | false;
  delete: boolean;
  truncate: boolean;
  /** `archivo:línea`. */
  source: string;
  /** El privilegio sólo se revoca si el rol `mantra_app` existe en esa base. */
  conditional: boolean;
  /** Comentario inmediato que menciona la retención (el DELETE se deja abierto a propósito). */
  retentionNote: boolean;
}

/** Funciones de disparador que bloquean por completo la operación del evento. */
const FORBID_FUNCTIONS = new Set(['forbid_mutation', 'forbid_truncate']);

/**
 * Funciones de disparador que dejan pasar una parte del UPDATE (cerrar una vigencia, avanzar un
 * estado de forma monótona). Es conocimiento curado: cada una se revisó leyendo su cuerpo.
 */
export const LIFECYCLE_GUARD_FUNCTIONS = new Set([
  'guard_governance_policy_revision',
  'structure_history_close_only',
  'connector_money_flags_monotone',
  'connector_charges_send_claims_monotone',
]);

function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

/** Nombre sin comillas ni calificador de schema. */
function bareName(raw: string): string {
  return raw.replace(/"/g, '').split('.').pop() ?? raw;
}

function splitQualified(
  raw: string,
  defaultSchema?: string,
): { schema: string; table: string } | null {
  const parts = raw.replace(/"/g, '').trim().split('.');
  if (parts.length === 2) return { schema: parts[0], table: parts[1] };
  if (parts.length === 1 && defaultSchema)
    return { schema: defaultSchema, table: parts[0] };
  return null;
}

const IDENT = '(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)';
const QUALIFIED = `${IDENT}(?:\\.${IDENT})?`;

/**
 * Tablas de un archivo SQL: `CREATE TABLE [IF NOT EXISTS] "schema"."tabla" ( … )` más las columnas que
 * agregan los `ALTER TABLE … ADD COLUMN`. En las bases `pay` las tablas no llevan schema: se pasa
 * `defaultSchema`.
 */
export function parseSqlTables(
  text: string,
  file: string,
  defaultSchema?: string,
): SqlTable[] {
  const tables = new Map<string, SqlTable>();
  const create = new RegExp(
    `CREATE TABLE(?: IF NOT EXISTS)?\\s+(${QUALIFIED})\\s*\\(`,
    'g',
  );
  for (const m of text.matchAll(create)) {
    const name = splitQualified(m[1], defaultSchema);
    if (!name) continue;
    // cuerpo hasta el paréntesis que cierra
    let depth = 1;
    let i = (m.index ?? 0) + m[0].length;
    const start = i;
    while (i < text.length && depth > 0) {
      const c = text[i];
      if (c === '(') depth += 1;
      else if (c === ')') depth -= 1;
      i += 1;
    }
    const body = text.slice(start, i - 1);
    const columns: string[] = [];
    for (const line of body.split('\n')) {
      const col = line.match(/^\s*"([^"]+)"\s+[a-zA-Z]/);
      if (col) columns.push(col[1]);
    }
    const key = `${name.schema}.${name.table}`;
    if (!tables.has(key))
      tables.set(key, {
        ...name,
        columns,
        source: `${file}:${lineOf(text, m.index ?? 0)}`,
      });
  }
  const alter = new RegExp(
    `ALTER TABLE(?: IF EXISTS)?(?: ONLY)?\\s+(${QUALIFIED})\\s+([^;]+);`,
    'g',
  );
  for (const m of text.matchAll(alter)) {
    const name = splitQualified(m[1], defaultSchema);
    const table = name && tables.get(`${name.schema}.${name.table}`);
    if (!table) continue;
    for (const add of m[2].matchAll(
      /ADD COLUMN(?: IF NOT EXISTS)?\s+"([^"]+)"/g,
    ))
      if (!table.columns.includes(add[1])) table.columns.push(add[1]);
  }
  return [...tables.values()];
}

function eventsOf(raw: string): Set<string> {
  return new Set(
    raw
      .toUpperCase()
      .split(/\s+OR\s+/)
      .map((e) => e.trim().split(/\s+/)[0]),
  );
}

/**
 * Barreras de un archivo SQL. Reconoce:
 *  - `CREATE TRIGGER … BEFORE <eventos> ON tabla … EXECUTE FUNCTION f()` con `f` en las listas de arriba;
 *  - `REVOKE <privilegios> ON tabla FROM mantra_app` (se ignora `FROM PUBLIC`: es casi nominal);
 *  - los dos patrones dinámicos que usa el modelo (lista `VALUES` + `trg_close_only`, y `ARRAY[…]` + `REVOKE … %s`).
 *
 * No intenta interpretar PL/pgSQL en general: lo que no reconoce no se cuenta (queda sin evidencia).
 */
export function parseSqlBarriers(
  text: string,
  file: string,
  defaultSchema?: string,
): SqlBarrier[] {
  const out: SqlBarrier[] = [];

  const trigger = new RegExp(
    `CREATE (?:OR REPLACE )?TRIGGER\\s+(${IDENT})\\s+BEFORE\\s+([A-Za-z ]+?)\\s+ON\\s+(${QUALIFIED})\\s+(?:FOR EACH (?:ROW|STATEMENT)\\s+)?EXECUTE (?:FUNCTION|PROCEDURE)\\s+(${QUALIFIED})\\(\\)`,
    'g',
  );
  for (const m of text.matchAll(trigger)) {
    const fn = bareName(m[4]);
    const isForbid = FORBID_FUNCTIONS.has(fn);
    const isLifecycle = LIFECYCLE_GUARD_FUNCTIONS.has(fn);
    if (!isForbid && !isLifecycle) continue;
    const name = splitQualified(m[3], defaultSchema);
    if (!name) continue;
    const events = eventsOf(m[2]);
    const idx = m.index ?? 0;
    const before = text.slice(Math.max(0, idx - 700), idx);
    out.push({
      ...name,
      via: 'TRIGGER',
      name: `${bareName(m[1])} → ${fn}`,
      update: events.has('UPDATE') ? (isLifecycle ? 'PARTIAL' : 'ALL') : false,
      delete: events.has('DELETE'),
      truncate: events.has('TRUNCATE'),
      source: `${file}:${lineOf(text, idx)}`,
      conditional: false,
      retentionNote: /retenci[oó]n|retention/i.test(
        before.split('\n').slice(-4).join('\n'),
      ),
    });
  }

  const revoke = new RegExp(
    `REVOKE\\s+([A-Z, ]+?)\\s+ON\\s+(?:TABLE\\s+)?(${QUALIFIED})\\s+FROM\\s+mantra_app`,
    'g',
  );
  for (const m of text.matchAll(revoke)) {
    const name = splitQualified(m[2], defaultSchema);
    if (!name) continue;
    const privs = new Set(m[1].split(',').map((p) => p.trim().toUpperCase()));
    const idx = m.index ?? 0;
    out.push({
      ...name,
      via: 'REVOKE',
      name: `REVOKE ${[...privs].join(', ')} FROM mantra_app`,
      update: privs.has('UPDATE') ? 'ALL' : false,
      delete: privs.has('DELETE'),
      truncate: privs.has('TRUNCATE'),
      source: `${file}:${lineOf(text, idx)}`,
      conditional: /rolname\s*=\s*'mantra_app'/.test(
        text.slice(Math.max(0, idx - 900), idx),
      ),
      retentionNote: false,
    });
  }

  out.push(...parseDynamicCloseOnly(text, file));
  out.push(...parseDynamicArrayRevoke(text, file));
  return out;
}

/**
 * Patrón dinámico 1: `FOR r IN SELECT * FROM (VALUES ('tabla', …), …) AS v(historia, …) LOOP
 * EXECUTE format('CREATE TRIGGER trg_close_only BEFORE UPDATE OR DELETE ON "audit".%I …
 * "audit"."structure_history_close_only"()', r.historia)`. Devuelve las tablas de la lista `VALUES`.
 */
export function parseDynamicCloseOnly(
  text: string,
  file: string,
): SqlBarrier[] {
  const out: SqlBarrier[] = [];
  const fmt =
    /CREATE TRIGGER (\w+) BEFORE UPDATE OR DELETE ON "([a-z_]+)"\.%I[^']*?EXECUTE FUNCTION "[a-z_]+"\."(\w+)"\(\)'/g;
  for (const m of text.matchAll(fmt)) {
    if (!LIFECYCLE_GUARD_FUNCTIONS.has(m[3])) continue;
    const idx = m.index ?? 0;
    const head = text.slice(Math.max(0, idx - 2500), idx);
    const values = head.lastIndexOf('(VALUES');
    if (values < 0) continue;
    const list = head.slice(values);
    for (const row of list.matchAll(/\(\s*'([a-z_0-9]+)'\s*,/g))
      out.push({
        schema: m[2],
        table: row[1],
        via: 'DYNAMIC_TRIGGER',
        name: `${m[1]} → ${m[3]}`,
        update: 'PARTIAL',
        delete: true,
        truncate: false,
        source: `${file}:${lineOf(text, idx)}`,
        conditional: false,
        retentionNote: false,
      });
  }
  return out;
}

/**
 * Patrón dinámico 2: `historias text[] := ARRAY['schema.tabla', …]` y, dentro del mismo bloque,
 * `FOREACH t IN ARRAY historias LOOP EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON %s FROM mantra_app', t)`.
 */
export function parseDynamicArrayRevoke(
  text: string,
  file: string,
): SqlBarrier[] {
  const out: SqlBarrier[] = [];
  const re =
    /(\w+)\s+text\[\]\s*:=\s*ARRAY\[([^\]]+)\][\s\S]{0,600}?format\('REVOKE ([A-Z, ]+?) ON %s FROM mantra_app'/g;
  for (const m of text.matchAll(re)) {
    const privs = new Set(m[3].split(',').map((p) => p.trim().toUpperCase()));
    const idx = m.index ?? 0;
    for (const item of m[2].matchAll(/'([a-z_0-9]+)\.([a-z_0-9]+)'/g))
      out.push({
        schema: item[1],
        table: item[2],
        via: 'DYNAMIC_REVOKE',
        name: `REVOKE ${[...privs].join(', ')} FROM mantra_app`,
        update: privs.has('UPDATE') ? 'ALL' : false,
        delete: privs.has('DELETE'),
        truncate: privs.has('TRUNCATE'),
        source: `${file}:${lineOf(text, idx)}`,
        conditional: true,
        retentionNote: false,
      });
  }
  return out;
}
