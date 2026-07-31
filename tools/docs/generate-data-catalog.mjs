// Genera docs/data/entity-catalog.md a partir de dos fuentes reales:
//   1. Las 1184 entidades MikroORM realmente implementadas (tools/catalog/lib/tsentities.mjs
//      -> readTsEntities(), la misma lectura que usa `yarn orm:catalog`).
//   2. La bóveda SALUD (Obsidian, sibling del repo) con el propósito de negocio real de cada
//      entidad (tools/catalog/lib/vault.mjs -> readVault()) — la misma fuente que
//      `tools/catalog/generate-catalog.mjs` ya usa para generar src/orm/catalog/.
//
// No inventa descripciones: si una entidad implementada no tiene entrada en la bóveda, se marca
// explícitamente como "sin descripción de negocio en la bóveda" en vez de fabricar una frase.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { readTsEntities } from '../catalog/lib/tsentities.mjs';
import { readVault } from '../catalog/lib/vault.mjs';

const OUT_DIR = join(process.cwd(), 'docs', 'data');
mkdirSync(OUT_DIR, { recursive: true });

const ts = readTsEntities(); // schema.table -> {schema, table, className, props, module, ...}
const { entities: vault, indexSets, foreignKeys } = readVault(); // schema.table -> {...}

function extractBusinessSummary(vaultEntry) {
  if (!vaultEntry?.raw) return null;
  const m = vaultEntry.raw.match(/\*\*Negocio:\*\*\s*(.+?)(?:\n\n|\*\*Ejemplo)/s);
  if (!m) return null;
  return m[1].replace(/\*\*/g, '').replace(/\[\[([^|\]]+)\|?([^\]]*)\]\]/g, (_x, a, b) => b || a).replace(/\s+/g, ' ').trim();
}

// readVault() no expone el markdown crudo directamente en todas las versiones de la librería;
// se relee aquí solo el campo de propósito de forma defensiva si vault entries no lo trae.
import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
const VAULT_ENT_DIR = join(process.cwd(), '..', 'mantra_core_technologies_health_docs', 'SALUD', 'Entidades');
const summaryByKey = new Map();
try {
  for (const file of readdirSync(VAULT_ENT_DIR)) {
    if (!file.endsWith('.md') || !file.startsWith('E ')) continue;
    const base = file.replace(/^E /, '').replace(/\.md$/, '');
    const dot = base.indexOf('.');
    const schema = base.slice(0, dot);
    const table = base.slice(dot + 1);
    const text = readFileSync(join(VAULT_ENT_DIR, file), 'utf-8');
    const m = text.match(/\*\*Negocio:\*\*\s*(.+?)(?:\n\n|\*\*Ejemplo)/s);
    if (m) {
      const clean = m[1]
        .replace(/\*\*/g, '')
        .replace(/\[\[([^|\]]+)\|?([^\]]*)\]\]/g, (_x, a, b) => (b || a))
        .replace(/\s+/g, ' ')
        .trim();
      summaryByKey.set(`${schema}.${table}`, clean);
    }
  }
} catch (e) {
  console.error('No se pudo leer la bóveda SALUD en', VAULT_ENT_DIR, '—', e.message);
}

const rows = [];
let withSummary = 0;
for (const [key, entity] of ts) {
  const summary = summaryByKey.get(key) ?? null;
  if (summary) withSummary++;
  const pk = entity.props.find((p) => p.primary);
  const fkCount = entity.props.filter((p) => /_id$/.test(p.fieldName) && !p.primary).length;
  const hasRowVersion = entity.props.some((p) => p.version);
  rows.push({
    key,
    schema: entity.schema,
    table: entity.table,
    module: entity.module,
    className: entity.className,
    fieldCount: entity.props.length,
    pk: pk ? pk.fieldName : '(sin PK detectada)',
    hasRowVersion,
    summary,
  });
  void fkCount;
}
rows.sort((a, b) => a.key.localeCompare(b.key));

const bySchema = new Map();
for (const r of rows) {
  if (!bySchema.has(r.schema)) bySchema.set(r.schema, []);
  bySchema.get(r.schema).push(r);
}

let md = `# Catálogo de entidades

> Generado por \`yarn docs:data:sync\` (\`tools/docs/generate-data-catalog.mjs\`) cruzando las
> **${ts.size} entidades MikroORM reales** (\`tools/catalog/lib/tsentities.mjs\`) contra el
> propósito de negocio real de la bóveda SALUD (Obsidian, sibling de este repositorio —
> \`../mantra_core_technologies_health_docs/SALUD/Entidades\`, la misma fuente que usa
> \`yarn orm:catalog\`). **${withSummary}/${rows.length}** entidades tienen descripción de negocio
> verificada en la bóveda; las que no, se marcan explícitamente en vez de fabricar una frase
> genérica.
>
> Este es el catálogo de lo **implementado**. La bóveda describe ${vault.size} entidades en total
> — la diferencia (${vault.size - ts.size}) son entidades diseñadas pero no materializadas aún en
> código; ver [entidades no implementadas](#entidades-diseñadas-no-implementadas) al final.

## Por schema (${bySchema.size} schemas · ${rows.length} entidades)

`;

for (const [schema, list] of [...bySchema.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  md += `### \`${schema}\` (${list.length} entidades, módulo \`${list[0].module}\`)\n\n`;
  md += `| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |\n`;
  md += `|---|---|---:|---|:---:|---|\n`;
  for (const r of list) {
    const purpose = r.summary ? r.summary.slice(0, 220) + (r.summary.length > 220 ? '…' : '') : '_sin descripción verificada en la bóveda_';
    md += `| \`${r.table}\` | \`${r.className}\` | ${r.fieldCount} | \`${r.pk}\` | ${r.hasRowVersion ? '✅' : '—'} | ${purpose} |\n`;
  }
  md += '\n';
}

// Vault-only entities (designed, not implemented)
const tsKeys = new Set(ts.keys());
const vaultOnly = [...vault.keys()].filter((k) => !tsKeys.has(k)).sort();
md += `## Entidades diseñadas, no implementadas\n\n`;
md += `${vaultOnly.length} entidades existen en la bóveda de diseño pero no tienen entidad MikroORM real en \`src/modules/**/entities\` al momento de esta generación. No se documentan como catálogo activo — es trabajo de modelo pendiente de materializar, no una entidad utilizable hoy.\n\n`;
md += '<details><summary>Ver lista completa</summary>\n\n';
md += vaultOnly.map((k) => `- \`${k}\``).join('\n');
md += '\n\n</details>\n';

writeFileSync(join(OUT_DIR, 'entity-catalog.md'), md, 'utf-8');
console.log(`Catálogo generado: ${rows.length} entidades implementadas (${withSummary} con descripción de negocio), ${vaultOnly.length} solo-diseño → docs/data/entity-catalog.md`);
