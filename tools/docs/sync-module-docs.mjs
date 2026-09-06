// Refleja los README.md reales de src/modules/<módulo>/ hacia
// docs/modules/<módulo>.md para el portal MkDocs. No genera prosa nueva: cada
// módulo ya tiene su "contrato por dominio" real (ESTADO-Y-PENDIENTES.md,
// tabla "Mapa documental") — fuente de verdad = src/modules/<módulo>/README.md,
// mantenida junto al código. Duplicar esa prosa a mano en docs/ sería
// contenido genérico o desactualizado; este script la mantiene sincronizada.
//
// También genera docs/modules/index.md: catálogo dinámico de módulos con sus
// métricas reales (controllers/services/repos/entities/dto), cruzado contra
// tools/alovida/coverage-report.mjs.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const MODULES_DIR = join(ROOT, 'src', 'modules');
const OUT_DIR = join(ROOT, 'docs', 'modules');
mkdirSync(OUT_DIR, { recursive: true });

// URL real del remoto (no una URL de ejemplo/inventada) — se resuelve del
// propio repositorio, no se hardcodea un placeholder.
function resolveGithubBase() {
  try {
    const url = execSync('git remote get-url origin', { cwd: ROOT })
      .toString()
      .trim();
    const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/);
    if (m) return `https://github.com/${m[1]}/${m[2]}/blob/master`;
  } catch {
    /* sin remoto configurado */
  }
  return null;
}
const GITHUB_BASE = resolveGithubBase();

const countFiles = (dir, suffix) => {
  let n = 0;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(suffix)) n++;
    }
  };
  try {
    walk(dir);
  } catch {
    /* dir may not exist for this module (e.g. no dto/) */
  }
  return n;
};

const modules = readdirSync(MODULES_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const rows = [];

for (const name of modules) {
  const moduleDir = join(MODULES_DIR, name);
  const readmePath = join(moduleDir, 'README.md');
  let readme;
  try {
    readme = readFileSync(readmePath, 'utf-8');
  } catch {
    console.error(
      `Sin README.md: ${name} — omitido (todos los módulos deberían tener uno, ver docs/reports/system-inventory.md)`,
    );
    continue;
  }

  const metrics = {
    controllers: countFiles(moduleDir, '.controller.ts'),
    services: countFiles(moduleDir, '.service.ts'),
    repositories: countFiles(moduleDir, '.repository.ts'),
    entities: countFiles(moduleDir, '.entity.ts'),
    dtos: countFiles(moduleDir, '.dto.ts'),
  };

  const sourceRef = GITHUB_BASE
    ? `[\`src/modules/${name}/README.md\`](${GITHUB_BASE}/src/modules/${name}/README.md)`
    : `\`src/modules/${name}/README.md\``;

  // El README real enlaza a otros archivos del propio módulo con rutas
  // relativas (p. ej. `./controllers/README.md`) — válidas en el árbol de
  // src/, no dentro del portal MkDocs (docs_dir no incluye src/). Se
  // reescriben a la fuente real en GitHub en vez de dejarlas rotas o
  // quitarles el enlace.
  const rewriteRelativeLinks = (text) => {
    if (!GITHUB_BASE) return text.replace(/\]\(\.\/([^)]+)\)/g, ']()');
    return text.replace(
      /\]\(\.\/([^)]+)\)/g,
      (_m, rel) => `](${GITHUB_BASE}/src/modules/${name}/${rel})`,
    );
  };
  readme = rewriteRelativeLinks(readme);

  const mirrored = `<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/${name}/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo \`${name}\`

**Fuente:** ${sourceRef}
· ${metrics.controllers} controllers · ${metrics.services} services · ${metrics.repositories} repositories · ${metrics.entities} entidades · ${metrics.dtos} DTO

---

${readme}
`;

  writeFileSync(join(OUT_DIR, `${name}.md`), mirrored, 'utf-8');
  rows.push({ name, ...metrics });
}

const totalRow = rows.reduce(
  (acc, r) => ({
    controllers: acc.controllers + r.controllers,
    services: acc.services + r.services,
    repositories: acc.repositories + r.repositories,
    entities: acc.entities + r.entities,
    dtos: acc.dtos + r.dtos,
  }),
  { controllers: 0, services: 0, repositories: 0, entities: 0, dtos: 0 },
);

const modulesWithEntities = rows.filter((row) => row.entities > 0).length;

const indexMd = `# Catálogo de módulos

> Generado por \`yarn docs:modules:sync\` desde \`src/modules/*/README.md\` reales — no editar a
> mano. ${rows.length} módulos, de los cuales ${modulesWithEntities} tienen entidades propias (ver
> [\`docs/reports/system-inventory.md\`](../reports/system-inventory.md) §2 para la reconciliación
> del conteo).

| Módulo | Controllers | Services | Repositories | Entidades | DTO |
|---|---:|---:|---:|---:|---:|
${rows
  .sort((a, b) => b.controllers - a.controllers)
  .map(
    (r) =>
      `| [\`${r.name}\`](${r.name}.md) | ${r.controllers} | ${r.services} | ${r.repositories} | ${r.entities} | ${r.dtos} |`,
  )
  .join('\n')}
| **Total** | **${totalRow.controllers}** | **${totalRow.services}** | **${totalRow.repositories}** | **${totalRow.entities}** | **${totalRow.dtos}** |
`;

writeFileSync(join(OUT_DIR, 'index.md'), indexMd, 'utf-8');

console.log(`Sincronizados ${rows.length} módulos → docs/modules/`);
