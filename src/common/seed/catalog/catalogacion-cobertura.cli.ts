/**
 * Genera el informe de cobertura de la catalogación (numerador y denominador, sin redondear a
 * 0 % ni a 100 %) y lo escribe donde se le pida.
 *
 *   node_modules/.bin/tsx src/common/seed/catalog/catalogacion-cobertura.cli.ts \
 *     --out ../mantra-core-health/docs/trabajo/2026-10-31-catalogacion/COBERTURA.md \
 *     [--adjuntar "etiqueta=ruta"]...
 *
 * Lo que mide sale del inventario (`inventario/`), de la bóveda (dataset versionado) y de las reglas
 * del clasificador. La siembra se ejecuta contra el DOBLE EN MEMORIA con todas las tablas como
 * «observadas»: es un plan, no una base viva (no había PostgreSQL); el informe lo dice.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import {
  computeCoverage,
  type CatalogacionCoverage,
  type Ratio,
} from '../../../modules/data_catalog/application/catalogacion/catalog-coverage';
import { readCatalogacionInventory } from '../../../modules/data_catalog/application/catalogacion/catalogacion-inventory';
import type { QualityTally } from '../../../modules/data_catalog/application/catalogacion/explanation-quality';
import type { VaultDataset } from '../../../modules/data_catalog/application/catalogacion/quality-context';
import { SCHEMA_DESCRIPTIONS } from '../../../modules/data_catalog/domain/schema-descriptions.generated';
import { runCatalogSeed } from './catalog-documentation-seed.service';
import { InMemoryCatalogSeedStore } from './catalog-seed.store';
import type { ObjectIndex } from './catalog-seed.types';

const { values } = parseArgs({
  options: {
    out: { type: 'string' },
    adjuntar: { type: 'string', multiple: true },
  },
});

const pct = (r: Ratio): string =>
  r.ratio === null
    ? 'sin dato'
    : `${(r.ratio * 100).toFixed(1).replace('.', ',')} %`;
const fila = (nombre: string, r: Ratio): string =>
  `| ${nombre} | ${r.covered} | ${r.denominator} | ${pct(r)} |`;
const calidad = (nombre: string, t: QualityTally): string =>
  `| ${nombre} | ${t.CURADA} | ${t.PLANTILLA} | ${t.AUTO_DETECTADA} | ${t.VACIA} |`;

function contarDecoradores(dir: string): {
  controllers: number;
  decorators: number;
} {
  let controllers = 0;
  let decorators = 0;
  const visitar = (d: string): void => {
    for (const nombre of readdirSync(d)) {
      const ruta = join(d, nombre);
      if (statSync(ruta).isDirectory()) visitar(ruta);
      else if (nombre.endsWith('.controller.ts')) {
        controllers += 1;
        decorators += (
          readFileSync(ruta, 'utf8').match(
            /^\s*@(Get|Post|Put|Patch|Delete)\(/gm,
          ) ?? []
        ).length;
      }
    }
  };
  visitar(dir);
  return { controllers, decorators };
}

function render(
  c: CatalogacionCoverage,
  extra: {
    decorators: { controllers: number; decorators: number };
    inventoryOps: number;
    seed: Awaited<ReturnType<typeof runCatalogSeed>>;
    segunda: Awaited<ReturnType<typeof runCatalogSeed>>;
    adjuntos: { etiqueta: string; texto: string }[];
  },
): string {
  const r = extra.seed.result;
  const s = extra.seed.plan.annotations.stats;
  const paso = (
    n: string,
    p: { planned: number; inserted: number; skipped?: string },
    p2: { inserted: number },
  ): string =>
    `| ${n} | ${p.planned} | ${p.inserted} | ${p2.inserted} |${p.skipped ? ` ${p.skipped}` : ''}`;
  const l = [
    '# Cobertura de la catalogación',
    '',
    '> Generado por `src/common/seed/catalog/catalogacion-cobertura.cli.ts` (no se edita a mano). Cada cifra lleva',
    '> numerador y denominador; lo que no tiene fuente se cuenta como brecha, no se rellena.',
    '> **Peldaño de evidencia:** `TESTED` para el plan y la lógica (doble en memoria). La escritura real en',
    '> PostgreSQL **no se ejecutó** (no hay base disponible): ver «No cubierto».',
    '',
    '## Etiquetas de calidad de una explicación',
    '',
    '- `CURADA`: texto propio de esa tabla/columna/campo (comentario del modelo, JSDoc de la entidad, nota propia de la bóveda). **No** implica revisada: nada está aprobado.',
    '- `PLANTILLA`: la misma frase, quitado lo que varía, en 3 objetos o más, o un molde de generador. Relleno: no se siembra como descripción.',
    '- `AUTO_DETECTADA`: la armó una regla determinista o una herramienta con datos con fuente (estructura del DDL, `created_at`/`tenant_id`/…, `summary` del contrato).',
    '- `VACIA`: sin fuente. Brecha visible; nunca relleno.',
    '',
    '## Tablas',
    '',
    '| Medida | Numerador | Denominador | % |',
    '|---|---:|---:|---:|',
    fila(
      'Tablas con propósito CURADO (modelo o bóveda propia)',
      c.tables.withCuratedPurpose,
    ),
    fila(
      '…con el propósito rescatado de una nota propia de la bóveda (el del modelo es plantilla o falta)',
      c.tables.withVaultOwnText,
    ),
    fila(
      'Tablas con propósito CURADO y razón de existir propia',
      c.tables.withPurposeAndExistence,
    ),
    fila(
      'Tablas con grano de fila respondido (no existe fuente)',
      c.tables.withRowGrain,
    ),
    fila('Tablas con dominio de negocio', c.tables.withDomain),
    fila(
      'Tablas tocadas por al menos un endpoint',
      c.tables.touchedByAnEndpoint,
    ),
    fila('Tablas con entidad del ORM', c.tables.withOrmEntity),
    fila(
      'Tablas con todas sus columnas descritas',
      c.columns.tablesFullyDescribed,
    ),
    '',
    '| Calidad del propósito de la tabla | CURADA | PLANTILLA | AUTO_DETECTADA | VACIA |',
    '|---|---:|---:|---:|---:|',
    calidad('Propósito', c.tables.purposeQuality),
    '',
    '## Columnas',
    '',
    '| Medida | Numerador | Denominador | % |',
    '|---|---:|---:|---:|',
    fila('Columnas descritas (CURADA o AUTO_DETECTADA)', c.columns.described),
    fila(
      'Columnas con descripción propia (CURADA)',
      c.columns.describedCurated,
    ),
    fila(
      'Columnas con propuesta de sensibilidad del clasificador',
      c.columns.withSensitivityProposal,
    ),
    fila(
      'Columnas con explicación de sistema (estructural)',
      c.columns.withSystemExplanation,
    ),
    '',
    '| Calidad de la explicación de NEGOCIO | CURADA | PLANTILLA | AUTO_DETECTADA | VACIA |',
    '|---|---:|---:|---:|---:|',
    calidad('Columnas', c.columns.businessQuality),
    '',
    '## Operaciones (endpoints)',
    '',
    '| Medida | Numerador | Denominador | % |',
    '|---|---:|---:|---:|',
    fila('Operaciones con DTO de petición', c.operations.withRequestDto),
    fila(
      'Operaciones que mutan, con DTO de petición',
      c.operations.mutationsWithRequestDto,
    ),
    fila('Operaciones con DTO de respuesta', c.operations.withResponseDto),
    fila(
      'Operaciones con tablas afectadas (o declaradas sin tablas)',
      c.operations.withTablesOrDeclaredNone,
    ),
    fila(
      'Vínculos operación→tabla con confianza DIRECTA',
      c.operations.directTableLinks,
    ),
    fila('Operaciones asignadas a un flujo', c.operations.withFlow),
    '',
    '| Calidad | CURADA | PLANTILLA | AUTO_DETECTADA | VACIA |',
    '|---|---:|---:|---:|---:|',
    calidad(
      'Explicación de negocio de la operación',
      c.operations.businessQuality,
    ),
    calidad(
      'Explicación de sistema de la operación',
      c.operations.systemQuality,
    ),
    calidad(
      'Descripción de campos del cuerpo (petición)',
      c.operations.requestFieldQuality,
    ),
    calidad(
      'Descripción de campos de la respuesta',
      c.operations.responseFieldQuality,
    ),
    '',
    '## Inventario frente al código',
    '',
    `- Controllers en \`src\`: ${extra.decorators.controllers}; decoradores \`@Get/@Post/@Put/@Patch/@Delete\`: ${extra.decorators.decorators}.`,
    `- Operaciones inventariadas: ${extra.inventoryOps}. Las dos cifras no tienen por qué coincidir (un decorador puede declarar varias rutas o ninguna operación HTTP pública); la verificación oficial es \`yarn inventario:verificar\` (adjunta abajo).`,
    '',
    '## Esquemas',
    '',
    '| Medida | Numerador | Denominador | % |',
    '|---|---:|---:|---:|',
    fila(
      'Esquemas con descripción de negocio (bóveda, módulo)',
      c.schemas.withBusinessDescription,
    ),
    '',
    `La explicación de sistema de un esquema (\`schema-descriptions.generated.ts\`) es ${c.schemas.systemQuality}: se arma con métricas del módulo. No hay tabla en el modelo para persistir fichas por esquema, así que se sirven desde ese archivo generado.`,
    '',
    '## Siembra (plan contra el doble en memoria; NO es una base viva)',
    '',
    `Procedencia: inventario \`inventario/\` + dataset de la bóveda (sha256 \`${c.vault.sha256}\`, ${c.vault.tablesWithOwnText} tablas con texto propio) + reglas del clasificador. Versión ${r.version}.`,
    '',
    '| Paso | Planificado | Insertado 1.ª corrida | Insertado 2.ª corrida |',
    '|---|---:|---:|---:|',
    paso('system_ops.data_domains', r.domains, extra.segunda.result.domains),
    paso(
      'system_ops.data_classifications',
      r.classifications,
      extra.segunda.result.classifications,
    ),
    paso(
      'catalog_glossary_terms',
      r.glossaryTerms,
      extra.segunda.result.glossaryTerms,
    ),
    paso(
      'catalog_glossary_term_revisions',
      r.glossaryRevisions,
      extra.segunda.result.glossaryRevisions,
    ),
    paso(
      'catalog_lineage_edges (endpoint→tabla)',
      r.lineageEdges,
      extra.segunda.result.lineageEdges,
    ),
    paso(
      'catalog_annotations (tablas + columnas)',
      r.annotations,
      extra.segunda.result.annotations,
    ),
    paso(
      'catalog_annotation_revisions',
      r.annotationRevisions,
      extra.segunda.result.annotationRevisions,
    ),
    paso('catalog_evidence_items', r.evidence, extra.segunda.result.evidence),
    paso(
      'catalog_objects.domain_id (enlace)',
      r.objectDomainLinks,
      extra.segunda.result.objectDomainLinks,
    ),
    '',
    `- Fichas de tabla: ${JSON.stringify(s.tableStatus)}; fichas de columna: ${JSON.stringify(s.columnStatus)}. **Ninguna APPROVED.**`,
    `- Vínculos operación→tabla no sembrados por apuntar a una tabla fuera del catálogo: ${r.lineageSkippedUncataloged}.`,
    `- Términos de glosario descartados por duplicados exactos: ${r.glossaryDuplicatesDropped}; términos: ${c.glossary.terms}.`,
    '- El linaje se siembra con `is_official = false`: «oficial» es una aprobación de una persona.',
    '',
  ];
  for (const a of extra.adjuntos)
    l.push(
      `## Salida adjunta: ${a.etiqueta}`,
      '',
      '```text',
      a.texto.trimEnd(),
      '```',
      '',
    );
  return `${l.join('\n')}\n`;
}

async function main(): Promise<void> {
  const inventory = readCatalogacionInventory();
  const vault = JSON.parse(
    readFileSync(join(__dirname, 'data', 'vault-table-notes.json'), 'utf8'),
  ) as VaultDataset;
  const coverage = computeCoverage(inventory, vault, SCHEMA_DESCRIPTIONS);
  const objects: ObjectIndex = new Map(
    inventory.tables.map((t) => [
      t.id,
      {
        id: `obj:${t.id}`,
        columns: new Map(
          t.columns.map((c) => [c.name, `col:${t.id}.${c.name}`]),
        ),
      },
    ]),
  );
  const store = new InMemoryCatalogSeedStore().withObjects(objects);
  const now = new Date('2026-10-31T00:00:00.000Z');
  const seed = await runCatalogSeed({ store, inventory, vault, now });
  const segunda = await runCatalogSeed({ store, inventory, vault, now });
  const adjuntos = (values.adjuntar ?? []).map((spec) => {
    const i = spec.indexOf('=');
    return {
      etiqueta: spec.slice(0, i),
      texto: readFileSync(spec.slice(i + 1), 'utf8'),
    };
  });
  const md = render(coverage, {
    decorators: contarDecoradores(join(process.cwd(), 'src')),
    inventoryOps: inventory.operations.length,
    seed,
    segunda,
    adjuntos,
  });
  if (values.out) writeFileSync(values.out, md);
  else process.stdout.write(md);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
