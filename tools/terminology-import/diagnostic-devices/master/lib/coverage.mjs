// =============================================================================
// Reporte de cobertura de la consolidación: tipos, fabricantes, marcas,
// modelos, regiones consolidadas y pendientes, fusiones dudosas y huecos.
// Texto visible en castellano (de usted); claves en inglés.
// =============================================================================

const count = (xs, f) => {
  const m = new Map();
  for (const x of xs) {
    const k = f(x);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...m.entries()].sort(
      (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])),
    ),
  );
};

export function coverageReport({
  taxonomy,
  catalog,
  resolution,
  industry = null,
  emdnCheck = null,
  sourceStats,
  regionStatus,
  panelParts,
  ivdPanels,
  mirrors,
}) {
  const nodes = taxonomy.nodes;
  const dxNodes = nodes.filter((n) => n.diagnostic === true);
  const usedTypes = new Set(catalog.models.flatMap((m) => m.deviceTypes));
  const brands = new Set(
    catalog.models
      .filter((m) => m.brand)
      .map((m) => `${m.manufacturerId}\u0000${m.brand.toUpperCase()}`),
  );
  const registrations = catalog.models.reduce(
    (n, m) => n + m.registrations.length,
    0,
  );
  const mergesByRule = count(
    catalog.manufacturers.flatMap((e) => e.merges),
    (x) => x.rule,
  );
  const json = {
    generatedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    regions: regionStatus.map(({ files: _f, ...r }) => r),
    sources: sourceStats,
    taxonomy: {
      nodes: nodes.length,
      bySystem: count(nodes, (n) => n.system),
      diagnosticBySystem: count(dxNodes, (n) => n.system),
      byDecision: count(nodes, (n) => `${n.system}:${n.diagnostic}:${n.basis}`),
      diagnosticByBranch: count(dxNodes, (n) => `${n.system}:${n.branch}`),
      crosswalks: taxonomy.crosswalks.length,
      crosswalksBySystems: count(
        taxonomy.crosswalks,
        (c) => `${c.from.split('|')[0]}→${c.to.split('|')[0]}`,
      ),
      diagnosticTypesWithModels: usedTypes.size,
      ivdPanelsMeasured: ivdPanels,
      panelParts,
    },
    catalog: {
      rowsIncluded: catalog.included,
      rowsNotDiagnostic: catalog.excluded.notDiagnostic,
      rowsUndetermined: catalog.excluded.undetermined,
      rowsWithoutType: catalog.excluded.noType,
      undeterminedTopTypes: Object.fromEntries(
        [...catalog.excluded.undeterminedByType.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50),
      ),
      manufacturers: catalog.manufacturers.length,
      brands: brands.size,
      models: catalog.models.length,
      registrations,
      modelsByJurisdictionCount: count(
        catalog.models,
        (m) => m.jurisdictions.length,
      ),
      modelsByJurisdiction: count(
        catalog.models.flatMap((m) => m.jurisdictions),
        (j) => j,
      ),
      manufacturersByCountry: count(
        catalog.manufacturers,
        (e) => e.countries[0] ?? '(sin país)',
      ),
    },
    manufacturers: {
      entitiesAll: resolution.entities.length,
      mergesByRule,
      reviewByKind: count(resolution.review, (r) => r.kind),
    },
    industry,
    emdnCopies: emdnCheck,
    mirrors: Object.fromEntries(
      Object.entries(mirrors).map(([k, m]) => [
        k,
        {
          repo: m.repo,
          commit: m.commit,
          files: Object.values(m.files).map((f) => ({
            path: f.path,
            sha256: f.sha256,
            officialUrl: f.officialUrl,
          })),
        },
      ]),
    ),
  };

  const line = (k, v) =>
    `| ${k} | ${typeof v === 'number' ? v.toLocaleString('es-BO') : v} |`;
  const table = (obj, h1, h2) =>
    [
      `| ${h1} | ${h2} |`,
      '|---|---:|',
      ...Object.entries(obj).map(([k, v]) => line(k, v)),
    ].join('\n');
  const md = [
    '# Cobertura de la consolidación de equipos de diagnóstico',
    '',
    `Generado: ${json.generatedAt}. Se genera con \`build.mjs\`; no lo edite a mano.`,
    '',
    '## Regiones',
    '',
    '| Región | Estado | Rama / carpeta | Commit | Filas leídas |',
    '|---|---|---|---|---:|',
    ...json.regions.map(
      (r) =>
        `| ${r.region} | ${r.status === 'consolidated' ? 'consolidada' : r.status === 'pending' ? 'pendiente' : r.status} | ${r.ref ?? r.dir ?? r.reason ?? ''} | ${r.commit ? r.commit.slice(0, 12) : ''} | ${r.rowsRead ?? 0} |`,
    ),
    '',
    '## Fuentes',
    '',
    '| Fuente | Región | Leídas | Válidas | Inválidas | Duplicadas |',
    '|---|---|---:|---:|---:|---:|',
    ...sourceStats.map(
      (s) =>
        `| ${s.source} | ${s.region} | ${s.read} | ${s.valid} | ${s.invalid} | ${s.duplicates} |`,
    ),
    '',
    '## Taxonomía',
    '',
    table(
      {
        Nodos: json.taxonomy.nodes,
        'Mapeos publicados': json.taxonomy.crosswalks,
        'Tipos de diagnóstico con al menos un modelo':
          json.taxonomy.diagnosticTypesWithModels,
      },
      'Medida',
      'Valor',
    ),
    '',
    table(json.taxonomy.bySystem, 'Nomenclatura', 'Nodos'),
    '',
    table(
      json.taxonomy.diagnosticByBranch,
      'Nomenclatura:rama de diagnóstico',
      'Nodos',
    ),
    '',
    table(json.taxonomy.byDecision, 'Nomenclatura:decisión:criterio', 'Nodos'),
    '',
    '## Catálogo',
    '',
    table(
      {
        'Filas de diagnóstico consolidadas': json.catalog.rowsIncluded,
        'Filas no diagnósticas (descartadas)': json.catalog.rowsNotDiagnostic,
        'Filas sin decisión (tipo sin criterio publicado)':
          json.catalog.rowsUndetermined,
        '… de ellas sin ningún tipo': json.catalog.rowsWithoutType,
        Fabricantes: json.catalog.manufacturers,
        Marcas: json.catalog.brands,
        Modelos: json.catalog.models,
        Registros: json.catalog.registrations,
      },
      'Medida',
      'Valor',
    ),
    '',
    table(
      json.catalog.modelsByJurisdiction,
      'Jurisdicción',
      'Modelos con registro',
    ),
    '',
    table(
      json.catalog.modelsByJurisdictionCount,
      'Jurisdicciones por modelo',
      'Modelos',
    ),
    '',
    '## Fabricantes: fusiones y revisión',
    '',
    table(json.manufacturers.mergesByRule, 'Regla de fusión', 'Fusiones'),
    '',
    table(
      json.manufacturers.reviewByKind,
      'Caso para revisión (no fusionado)',
      'Casos',
    ),
    '',
    '## Listados del sector (asociaciones y ferias)',
    '',
    industry
      ? table(
          {
            Organizaciones: industry.organizations,
            'Menciones con URL': industry.mentions,
            'Empresas distintas': industry.companies,
            '… que cruzan con un fabricante de los registros':
              industry.companiesMatchedToRegistry,
            '… solo en listados del sector (candidatas)':
              industry.companiesOnlyInIndustryLists,
          },
          'Medida',
          'Valor',
        )
      : 'Sin `data/industry-directories.json`.',
    '',
  ].join('\n');
  return { json, markdown: `${md}\n` };
}
