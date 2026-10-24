#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · ROW · reporte de cobertura de `out/`.
//
// Cuenta, por fuente (= país del registro): filas, fabricantes, marcas, tipos,
// clases de riesgo y país del fabricante; más los huecos del manifiesto.
// Fabricantes y marcas se cuentan por texto exacto (sin normalizar: eso lo hace
// `master/`). Escribe `COVERAGE.md` y `out/coverage.json`. Sin red.
//
// Uso: node tools/terminology-import/diagnostic-devices/row/coverage.mjs
// =============================================================================

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { gzLines, readManifest } from './lib/read-out.mjs';
import { OUT_DIR, ROW_DIR } from './lib/row.mjs';

/** País de la autoridad de cada fuente. */
const REGISTRY_COUNTRY = {
  'anvisa-produtos': 'BR',
  'anvisa-produtos-modelos': 'BR',
  'pmda-approvals': 'JP',
  'hc-mdall': 'CA',
  'tga-daen': 'AU',
  'cdsco-import-licences': 'IN',
  'tfda-devices': 'TW',
  'tfda-tudid': 'TW',
  'invima-dispositivos': 'CO',
};

const TOP = 25;

function bump(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

const top = (map, n = TOP) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, n);
const fmt = (n) => n.toLocaleString('es-BO');

async function main() {
  const manifest = readManifest();
  const bySource = new Map();
  const allManufacturers = new Set();
  const allBrands = new Set();
  for (const file of manifest.files) {
    let s = bySource.get(file.source);
    if (s === undefined) {
      s = {
        rows: 0,
        manufacturers: new Set(),
        brands: new Set(),
        withModel: 0,
        types: new Map(),
        classes: new Map(),
        countries: new Map(),
        manufacturersByCountry: new Map(),
      };
      bySource.set(file.source, s);
    }
    for await (const line of gzLines(join(OUT_DIR, file.path))) {
      const r = JSON.parse(line);
      s.rows += 1;
      s.manufacturers.add(r.manufacturerName);
      allManufacturers.add(r.manufacturerName);
      if (r.brandName) {
        s.brands.add(r.brandName);
        allBrands.add(`${r.manufacturerName}\u0000${r.brandName}`);
      }
      if (r.model) s.withModel += 1;
      bump(s.types, r.deviceTypeName ?? '(sin tipo en la fuente)');
      bump(s.classes, r.riskClass ?? '(sin clase en la fuente)');
      bump(s.countries, r.manufacturerCountry ?? '(sin país)');
      const mk = `${r.manufacturerCountry ?? '(sin país)'}\u0000${r.manufacturerName}`;
      if (!s.manufacturersByCountry.has(mk))
        s.manufacturersByCountry.set(mk, true);
    }
  }

  const json = {
    generatedAt: new Date().toISOString(),
    manifestGeneratedAt: manifest.generatedAt,
    totals: {
      rows: [...bySource.values()].reduce((n, s) => n + s.rows, 0),
      manufacturersExact: allManufacturers.size,
      manufacturerBrandPairsExact: allBrands.size,
    },
    sources: {},
    gaps: manifest.gaps,
  };
  const md = [];
  md.push('# Cobertura · equipos de diagnóstico · resto del mundo (ROW)');
  md.push('');
  md.push(
    `Generado por \`coverage.mjs\` desde \`out/manifest.json\` (${manifest.generatedAt}). No editar a mano.`,
  );
  md.push('');
  md.push(
    'Fabricantes y marcas se cuentan por texto exacto, sin normalizar; la unión entre fuentes la hace `master/`.',
  );
  md.push(
    'Las filas incluyen todos los dispositivos de cada registro: el recorte a «diagnóstico» lo hace `master/` (ver `SOURCES.md`).',
  );
  md.push('');
  md.push('## Totales');
  md.push('');
  md.push(
    '| Fuente | País del registro | Filas | Con modelo | Fabricantes (exacto) | Marcas (exacto) | Tipos distintos |',
  );
  md.push('|---|---|--:|--:|--:|--:|--:|');
  for (const [source, s] of bySource) {
    md.push(
      `| \`${source}\` | ${REGISTRY_COUNTRY[source] ?? '?'} | ${fmt(s.rows)} | ${fmt(s.withModel)} | ${fmt(s.manufacturers.size)} | ${fmt(s.brands.size)} | ${fmt(s.types.size)} |`,
    );
    const countryCounts = new Map();
    for (const key of s.manufacturersByCountry.keys())
      bump(countryCounts, key.split('\u0000')[0]);
    json.sources[source] = {
      registryCountry: REGISTRY_COUNTRY[source] ?? null,
      rows: s.rows,
      rowsWithModel: s.withModel,
      manufacturersExact: s.manufacturers.size,
      brandsExact: s.brands.size,
      deviceTypes: s.types.size,
      topDeviceTypes: top(s.types),
      riskClasses: top(s.classes, 50),
      rowsByManufacturerCountry: top(s.countries, 60),
      manufacturersByCountry: top(countryCounts, 60),
    };
  }
  md.push(
    `| **Total** | | **${fmt(json.totals.rows)}** | | **${fmt(json.totals.manufacturersExact)}** | **${fmt(json.totals.manufacturerBrandPairsExact)}** (fabricante+marca) | |`,
  );
  md.push('');
  for (const [source, info] of Object.entries(json.sources)) {
    md.push(`## \`${source}\``);
    md.push('');
    md.push(`### Tipos más frecuentes (de ${fmt(info.deviceTypes)})`);
    md.push('');
    md.push('| Tipo (verbatim) | Filas |');
    md.push('|---|--:|');
    for (const [k, v] of info.topDeviceTypes)
      md.push(`| ${String(k).replace(/\|/g, '\\|')} | ${fmt(v)} |`);
    md.push('');
    md.push('### Clase de riesgo');
    md.push('');
    md.push(info.riskClasses.map(([k, v]) => `\`${k}\` ${fmt(v)}`).join(' · '));
    md.push('');
    md.push('### Fabricantes por país del fabricante');
    md.push('');
    md.push(
      info.manufacturersByCountry.map(([k, v]) => `${k} ${fmt(v)}`).join(' · '),
    );
    md.push('');
  }
  md.push('## Huecos');
  md.push('');
  md.push('| Fuente | Motivo | URL |');
  md.push('|---|---|---|');
  for (const g of manifest.gaps)
    md.push(`| \`${g.source}\` | ${g.reason} | ${g.url} |`);
  md.push('');

  writeFileSync(join(ROW_DIR, 'COVERAGE.md'), md.join('\n'));
  writeFileSync(
    join(OUT_DIR, 'coverage.json'),
    JSON.stringify(json, null, 2) + '\n',
  );
  console.log(
    `COVERAGE.md y out/coverage.json: ${fmt(json.totals.rows)} filas, ${fmt(json.totals.manufacturersExact)} fabricantes, ${fmt(json.totals.manufacturerBrandPairsExact)} fabricante+marca`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
