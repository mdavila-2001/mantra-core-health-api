/**
 * Fusiona los reportes de cobertura de las suites unitaria e de integración.
 *
 * Ninguna suite por sí sola cubre todo el código nuevo: la unitaria mockea el
 * repositorio y el EntityManager (no ejecuta el cuerpo real de los servicios),
 * mientras que la de integración recorre los endpoints reales pero infra-atribuye
 * los controladores finos bajo la instrumentación ESM. La cobertura efectiva es la
 * unión de ambas, que es lo que calcula este script.
 *
 * Uso:
 *   yarn test:cov            # genera coverage/coverage-final.json
 *   yarn test:integration:cov# genera coverage-integration/coverage-final.json
 *   node tools/coverage/merge-coverage.mjs
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const libCoverage = require('istanbul-lib-coverage');

const REPORTS = ['coverage/coverage-final.json', 'coverage-integration/coverage-final.json'];
const map = libCoverage.createCoverageMap({});
for (const file of REPORTS) {
  if (!existsSync(file)) {
    console.error(`Falta ${file}; ejecuta ambas suites con cobertura primero.`);
    process.exit(1);
  }
  map.merge(JSON.parse(readFileSync(file, 'utf8')));
}

const isProductionSource = (f) => {
  const inScope = /\/(modules\/(iam|common|terminology)|src\/common)\//.test(f);
  const excluded =
    /\/entities\//.test(f) ||
    /\.module\.ts$/.test(f) ||
    /\/index\.ts$/.test(f) ||
    /\.spec\.ts$/.test(f) ||
    /\.int-spec\.ts$/.test(f);
  return inScope && !excluded;
};

const summary = libCoverage.createCoverageSummary();
let files = 0;
for (const f of map.files()) {
  if (isProductionSource(f)) {
    summary.merge(map.fileCoverageFor(f).toSummary());
    files++;
  }
}

const json = summary.toJSON();
console.log(`Cobertura combinada (unitaria + integración) sobre ${files} archivos de producción:`);
for (const key of ['statements', 'branches', 'functions', 'lines']) {
  const m = json[key];
  console.log(`  ${key.padEnd(11)}: ${m.pct}%  (${m.covered}/${m.total})`);
}
