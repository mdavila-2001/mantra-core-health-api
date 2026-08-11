// Lector de la bóveda SALUD (Obsidian). Devuelve el modelo oficial normalizado.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Raíz de la bóveda SALUD (Obsidian). Se puede reapuntar con SALUD_VAULT sin
// tocar el código; por defecto vive junto a este repo, en la raíz del monorepo.
//
// El default apuntaba a `mantra_core_technologies_health_docs/SALUD`, una ruta que
// dejó de existir cuando la bóveda pasó a `Mantra Core Health Vault/`. No degradaba:
// `audit-fidelity.mjs` y `generate-catalog.mjs` morían con ENOENT al arrancar, así que
// los dos verificadores de fidelidad dev-time estuvieron inejecutables (corregido 2026-08-07).
export const VAULT =
  process.env.SALUD_VAULT ??
  join(process.cwd(), '..', 'Mantra Core Health Vault', 'SALUD');
const ENT = join(VAULT, 'Entidades');
const FKDIR = join(VAULT, 'FK');

/**
 * Lee una nota normalizando los finales de línea.
 *
 * La bóveda se edita en Windows y sus 2 547 notas están guardadas con CRLF,
 * mientras que todos los patrones de este módulo se escribieron con `\n`:
 * ```` /```puml\n/ ````, `/## Apunta a →\n- \[\[E/` y `/^  - tipo\/(\S+)$/`
 * (donde `\S+` llegaba a capturar el `\r`, con lo que ningún `tipo/index_set`
 * casaba nunca). El resultado no era un fallo ruidoso sino una bóveda que parecía
 * vacía: el generador escribía un catálogo con casi nada y borraba el resto.
 * Normalizar al leer es lo que mantiene ese detalle de plataforma fuera de cada
 * expresión regular del archivo.
 */
const read = (path) => readFileSync(path, 'utf8').replaceAll('\r\n', '\n');

const puml = (t) => {
  const m = t.match(/```puml\n([\s\S]*?)```/);
  return m ? m[1].split('\n') : [];
};

/**
 * Separa `SPEC … WHERE predicado` respetando paréntesis y comillas.
 *
 * Es el mismo algoritmo que `_split_where` en `salud-db/gen_ddl.py`, a propósito:
 * las dos capas leen el MISMO `<<INDEX_SET>>` y tienen que entenderlo igual, o el
 * DDL de `SQL/` y el catálogo del ORM describen índices distintos con el mismo
 * nombre. Un `IN ('a','b')` dentro del predicado no debe partir la cadena.
 *
 * Devuelve `[spec, predicado|null]`.
 */
const splitWhere = (s) => {
  const isWordChar = (c) => /[a-z0-9_]/i.test(c ?? '');
  const up = s.toUpperCase();
  let depth = 0;
  let inQuote = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuote) {
      if (ch === "'") inQuote = false;
    } else if (ch === "'") {
      inQuote = true;
    } else if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      depth--;
    } else if (
      depth === 0 &&
      up.startsWith('WHERE', i) &&
      !isWordChar(s[i - 1]) &&
      !isWordChar(s[i + 5])
    ) {
      return [s.slice(0, i).trimEnd(), s.slice(i + 5).trim()];
    }
  }
  return [s, null];
};

export function readVault() {
  const entities = new Map(); // schema.table -> {schema,table,tipo,fields,referenceOnly,module}
  const indexSets = new Map(); // schema.table -> [{kind,name,cols,unique,method}]

  for (const file of readdirSync(ENT)) {
    if (!file.endsWith('.md')) continue;
    const base = file.replace(/^E /, '').replace(/\.md$/, '');
    const dot = base.indexOf('.');
    const schema = base.slice(0, dot);
    const table = base.slice(dot + 1);
    const text = read(join(ENT, file));
    const tipo = (text.match(/^  - tipo\/(\S+)$/m) || [, 'plain'])[1];
    const module = (text.match(/^  - modulo\/(\d+)$/m) || [, null])[1];

    if (tipo === 'index_set') {
      const list = [];
      for (const raw of puml(text)) {
        // Los tipos son los que acepta `IDX_HEAD_RE` de gen_ddl.py. `UX` faltaba
        // aquí: un índice declarado con esa etiqueta se descartaba en silencio, y
        // por eso `ux_account_activations_token_hash` (v4.0.8) nunca llegó al
        // catálogo. `FT` se conserva por compatibilidad con notas antiguas.
        const m = raw.match(
          /^\s*(PK|IX|UK|UX|FT|BRIN|GIN|GIST|HASH)\s+(\S+)\s*:\s*\(([^)]*)\)\s*(.*)$/,
        );
        if (!m) continue;
        // El predicado se separa ANTES de buscar UNIQUE y el método, para que una
        // palabra dentro del WHERE no se lea como parte de la especificación.
        const [spec, where] = splitWhere(m[4]);
        list.push({
          kind: m[1],
          name: m[2],
          // Las columnas pueden traer dirección de orden ("recorded_at DESC").
          // Se conserva en minúsculas junto al nombre: un índice descendente no
          // es intercambiable por uno ascendente para un ORDER BY ... DESC LIMIT.
          cols: m[3]
            .split(',')
            .map((c) => c.trim().toLowerCase())
            .filter(Boolean),
          unique: /UNIQUE/i.test(spec),
          method: (spec.match(/(BTREE|GIN|GIST|HASH|BRIN|IVFFLAT|HNSW)/i) || [
            ,
            'BTREE',
          ])[1].toLowerCase(),
          // Índice parcial. Perder el predicado no degrada el índice: lo convierte
          // en otro. Un UNIQUE total sobre `external_subject` rechazaría un alta
          // legítima cuyo sujeto ya tuvo una credencial revocada.
          ...(where ? { where } : {}),
        });
      }
      indexSets.set(`${schema}.${table.replace(/^idxset_/, '')}`, list);
      continue;
    }

    const fields = [];
    for (const raw of puml(text)) {
      if (/^\s*--\s*$/.test(raw) || /^\s*\.\./.test(raw)) continue;
      const m = raw.match(
        /^(\s*)(\*?)\s*([a-z_0-9]+)\s*:\s*([a-z0-9_ ()\[\],]+?)\s*(<<[^>]+>>)?\s*$/i,
      );
      if (!m) continue;
      fields.push({
        name: m[3],
        type: m[4].trim(),
        required: m[2] === '*',
        marker: (m[5] || '').replace(/[<>]/g, ''),
      });
    }
    if (fields.length === 0) {
      const tb = text.match(/```text\n([\s\S]*?)```/);
      for (const raw of tb ? tb[1].split('\n') : []) {
        const m = raw.match(
          /^-\s+([a-z_0-9]+)\s+([a-z0-9_]+(?:\[\])?)\s*(.*)$/i,
        );
        if (!m) continue;
        fields.push({
          name: m[1],
          type: m[2],
          required: /NOT NULL/i.test(m[3]) || /\bPK\b/.test(m[3]),
          marker: /\bPK\b/.test(m[3]) ? 'PK' : /\bFK\b/.test(m[3]) ? 'FK' : '',
        });
      }
    }
    entities.set(`${schema}.${table}`, {
      schema,
      table,
      tipo,
      fields,
      module,
      referenceOnly: /REFERENCE_ONLY/.test(text),
    });
  }

  // Extensiones de los Patch v4.0.x: columnas añadidas a entidades ya existentes.
  for (const patch of readdirSync(VAULT).filter((d) =>
    d.startsWith('Patch '),
  )) {
    const dir = join(VAULT, patch, 'Extensiones');
    let files = [];
    try {
      files = readdirSync(dir);
    } catch {
      continue;
    }
    for (const f of files) {
      const base = f.replace(/^Ext /, '').replace(/\.md$/, '');
      const target = entities.get(base);
      if (!target) continue;
      const text = read(join(dir, f));
      const tb = text.match(/```text\n([\s\S]*?)```/);
      for (const raw of tb ? tb[1].split('\n') : []) {
        const m = raw.match(
          /^-\s+([a-z_0-9]+)(?:\s+([a-z0-9_]+(?:\[\])?))?\s*(.*)$/i,
        );
        if (!m) continue;
        if (target.fields.some((x) => x.name === m[1])) continue;
        // Las notas de extensión solo marcan explícitamente NOT NULL; cuando no
        // dicen nada se asume opcional, que es la lectura conservadora: dar por
        // obligatoria una columna que no lo es produciría INSERT rechazados.
        target.fields.push({
          name: m[1],
          type: m[2] || 'uuid',
          required: /NOT NULL/i.test(m[3] || ''),
          marker: /\bFK\b/.test(m[3] || '') ? 'FK' : '',
        });
      }
    }
  }

  // Claves foráneas: una nota por FK, "## Apunta a →" resuelve la entidad destino.
  const foreignKeys = [];
  for (const file of readdirSync(FKDIR)) {
    if (!file.endsWith('.md')) continue;
    const base = file.replace(/^FK /, '').replace(/\.md$/, '');
    const parts = base.split('.');
    if (parts.length < 3) continue;
    const [schema, table] = parts;
    const column = parts.slice(2).join('.');
    const text = read(join(FKDIR, file));
    const t = text.match(
      /## Apunta a →\n- \[\[E ([a-z_0-9]+)\.([a-z_0-9]+)[|\]]/,
    );
    if (!t) continue;
    foreignKeys.push({
      schema,
      table,
      column,
      targetSchema: t[1],
      targetTable: t[2],
      inferred: /_\(convención/.test(text),
    });
  }

  assertVaultLooksRead({ entities, indexSets, foreignKeys });
  return { entities, indexSets, foreignKeys };
}

/**
 * Aborta si la bóveda se leyó pero casi nada se entendió.
 *
 * El generador reescribe el catálogo completo: escribe lo que encontró y borra el
 * resto. Cuando el parseo falla en masa —una bóveda a medio clonar, un cambio de
 * formato de las notas, o los CRLF que rompían todos los patrones de este
 * archivo— el resultado no es un error sino un catálogo vacío que pisa a uno
 * bueno, y el daño solo se nota al arrancar la aplicación.
 *
 * Los umbrales son deliberadamente bajos: no verifican que el catálogo esté
 * completo, solo que el parseo no se haya derrumbado. Son un fusible, no un test.
 */
function assertVaultLooksRead({ entities, indexSets, foreignKeys }) {
  const MIN = { entities: 500, indexSets: 200, foreignKeys: 500 };
  const observed = {
    entities: entities.size,
    indexSets: indexSets.size,
    foreignKeys: foreignKeys.length,
  };
  const short = Object.keys(MIN).filter((k) => observed[k] < MIN[k]);
  if (short.length === 0) return;
  const detail = short
    .map((k) => `${k}: ${observed[k]} (se esperaban >= ${MIN[k]})`)
    .join(', ');
  throw new Error(
    `La bóveda de ${VAULT} se leyó pero casi nada se pudo interpretar — ${detail}.\n` +
      'Generar el catálogo ahora lo dejaría vacío y borraría el actual, así que se aborta.\n' +
      'Revisá que SALUD_VAULT apunte a la bóveda correcta y que las notas conserven ' +
      'su formato (bloque ```puml, tag `tipo/index_set`, sección "## Apunta a →").',
  );
}

// Primary key declarada por la bóveda (por defecto `id`).
export function primaryKeyOf(entity) {
  const pk = entity.fields
    .filter((f) => /PK/.test(f.marker))
    .map((f) => f.name);
  return pk.length ? pk : ['id'];
}
