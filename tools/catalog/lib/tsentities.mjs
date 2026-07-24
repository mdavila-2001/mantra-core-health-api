// Lector de las entidades MikroORM ya presentes en src/modules/**/entities.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SRC_MODULES = join(process.cwd(), 'src', 'modules');

export function readTsEntities() {
  const map = new Map(); // schema.table -> {...}
  for (const mod of readdirSync(SRC_MODULES)) {
    const dir = join(SRC_MODULES, mod, 'entities');
    let files = [];
    try { files = readdirSync(dir); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith('.entity.ts')) continue;
      const path = join(dir, f);
      const text = readFileSync(path, 'utf8');
      const schema = (text.match(/schema:\s*'([^']+)'/) || [])[1];
      const table = (text.match(/tableName:\s*'([^']+)'/) || [])[1];
      const className = (text.match(/export class (\w+)/) || [])[1];
      const props = [];
      const re = /@(PrimaryKey|Property|ManyToOne|OneToOne|Enum)\(\{([\s\S]*?)\}\)\s*(?:\/\/[^\n]*\n\s*)?(\w+)([!?]?):/g;
      let m;
      while ((m = re.exec(text))) {
        const opts = m[2];
        props.push({
          propName: m[3],
          fieldName: (opts.match(/fieldName:\s*'([^']+)'/) || [])[1] || snake(m[3]),
          type: (opts.match(/\btype:\s*'([^']+)'/) || [])[1],
          columnType: (opts.match(/columnType:\s*'([^']+)'/) || [])[1],
          nullable: /nullable:\s*true/.test(opts),
          version: /version:\s*true/.test(opts),
          primary: m[1] === 'PrimaryKey',
        });
      }
      if (!schema || !table) continue;
      map.set(`${schema}.${table}`, {
        schema, table, className, props, module: mod, file: f,
        loc: text.split('\n').length,
      });
    }
  }
  return map;
}

export const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
export const pascal = (s) => s.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
export const camel = (s) => { const p = pascal(s); return p.charAt(0).toLowerCase() + p.slice(1); };
