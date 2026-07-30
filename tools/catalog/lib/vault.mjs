// Lector de la bóveda SALUD (Obsidian). Devuelve el modelo oficial normalizado.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Raíz de la bóveda SALUD (Obsidian). Se puede reapuntar con SALUD_VAULT sin
// tocar el código: por defecto se asume que la bóveda es hermana del repositorio.
export const VAULT = process.env.SALUD_VAULT
  ?? join(process.cwd(), '..', 'Mantra Core Health Vault', 'SALUD');
const ENT = join(VAULT, 'Entidades');
const FKDIR = join(VAULT, 'FK');

// Las notas de la bóveda se guardan con finales de línea CRLF (Obsidian en Windows).
// Todas las expresiones de abajo anclan bloques con `\n`, así que la normalización va
// en la lectura: sin esto ningún bloque ```puml``` casa y la bóveda se lee sin campos.
const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const puml = (t) => { const m = t.match(/```puml\n([\s\S]*?)```/); return m ? m[1].split('\n') : []; };

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
        const m = raw.match(/^\s*(PK|IX|UK|FT|GIN|GIST)\s+(\S+)\s*:\s*\(([^)]*)\)\s*(.*)$/);
        if (!m) continue;
        list.push({
          kind: m[1], name: m[2],
          // Las columnas pueden traer dirección de orden ("recorded_at DESC").
          // Se conserva en minúsculas junto al nombre: un índice descendente no
          // es intercambiable por uno ascendente para un ORDER BY ... DESC LIMIT.
          cols: m[3].split(',').map((c) => c.trim().toLowerCase()).filter(Boolean),
          unique: /UNIQUE/i.test(m[4]),
          method: ((m[4].match(/(BTREE|GIN|GIST|HASH|BRIN|IVFFLAT|HNSW)/i) || [, 'BTREE'])[1]).toLowerCase(),
        });
      }
      indexSets.set(`${schema}.${table.replace(/^idxset_/, '')}`, list);
      continue;
    }

    const fields = [];
    for (const raw of puml(text)) {
      if (/^\s*--\s*$/.test(raw) || /^\s*\.\./.test(raw)) continue;
      const m = raw.match(/^(\s*)(\*?)\s*([a-z_0-9]+)\s*:\s*([a-z0-9_ ()\[\],]+?)\s*(<<[^>]+>>)?\s*$/i);
      if (!m) continue;
      fields.push({ name: m[3], type: m[4].trim(), required: m[2] === '*', marker: (m[5] || '').replace(/[<>]/g, '') });
    }
    if (fields.length === 0) {
      const tb = text.match(/```text\n([\s\S]*?)```/);
      for (const raw of tb ? tb[1].split('\n') : []) {
        const m = raw.match(/^-\s+([a-z_0-9]+)\s+([a-z0-9_]+(?:\[\])?)\s*(.*)$/i);
        if (!m) continue;
        fields.push({
          name: m[1], type: m[2],
          required: /NOT NULL/i.test(m[3]) || /\bPK\b/.test(m[3]),
          marker: /\bPK\b/.test(m[3]) ? 'PK' : (/\bFK\b/.test(m[3]) ? 'FK' : ''),
        });
      }
    }
    entities.set(`${schema}.${table}`, {
      schema, table, tipo, fields, module,
      referenceOnly: /REFERENCE_ONLY/.test(text),
    });
  }

  // Extensiones de los Patch v4.0.x: columnas añadidas a entidades ya existentes.
  for (const patch of readdirSync(VAULT).filter((d) => d.startsWith('Patch '))) {
    const dir = join(VAULT, patch, 'Extensiones');
    let files = [];
    try { files = readdirSync(dir); } catch { continue; }
    for (const f of files) {
      const base = f.replace(/^Ext /, '').replace(/\.md$/, '');
      const target = entities.get(base);
      if (!target) continue;
      const text = read(join(dir, f));
      const tb = text.match(/```text\n([\s\S]*?)```/);
      for (const raw of tb ? tb[1].split('\n') : []) {
        const m = raw.match(/^-\s+([a-z_0-9]+)(?:\s+([a-z0-9_]+(?:\[\])?))?\s*(.*)$/i);
        if (!m) continue;
        if (target.fields.some((x) => x.name === m[1])) continue;
        // Las notas de extensión solo marcan explícitamente NOT NULL; cuando no
        // dicen nada se asume opcional, que es la lectura conservadora: dar por
        // obligatoria una columna que no lo es produciría INSERT rechazados.
        target.fields.push({
          name: m[1], type: m[2] || 'uuid',
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
    const t = text.match(/## Apunta a →\n- \[\[E ([a-z_0-9]+)\.([a-z_0-9]+)[|\]]/);
    if (!t) continue;
    foreignKeys.push({
      schema, table, column,
      targetSchema: t[1], targetTable: t[2],
      inferred: /_\(convención/.test(text),
    });
  }

  return { entities, indexSets, foreignKeys };
}

// Primary key declarada por la bóveda (por defecto `id`).
export function primaryKeyOf(entity) {
  const pk = entity.fields.filter((f) => /PK/.test(f.marker)).map((f) => f.name);
  return pk.length ? pk : ['id'];
}
