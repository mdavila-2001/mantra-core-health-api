import type { CatalogacionInventory } from './catalogacion-inventory';
import {
  classifyDtoFieldDescription,
  classifyOperationExplanation,
  emptyTally,
  tally,
  type QualifiedText,
  type QualityTally,
} from './explanation-quality';
import {
  assessTable,
  buildQualityContext,
  type VaultDataset,
} from './quality-context';

/**
 * Cobertura honesta de la catalogación: cada cifra lleva su numerador y su denominador, y lo que no
 * se puede medir se dice (`null`), nunca se redondea a 0 % ni a 100 %. Pura: la misma entrada da el
 * mismo informe.
 */

export interface Ratio {
  covered: number;
  denominator: number;
  /** `null` si no hay nada que dividir. */
  ratio: number | null;
}

export const ratio = (covered: number, denominator: number): Ratio => ({
  covered,
  denominator,
  ratio:
    denominator === 0
      ? null
      : Math.round((covered / denominator) * 10_000) / 10_000,
});

export interface SchemaDescriptionLike {
  business: string | null;
  system: string | null;
}

export interface CatalogacionCoverage {
  tables: {
    total: number;
    /** Calidad del propósito de la tabla. */
    purposeQuality: QualityTally;
    /** Tablas con propósito `CURADA` (texto propio del modelo o de la bóveda). */
    withCuratedPurpose: Ratio;
    /** Tablas con propósito `CURADA` y razón de existir con texto propio (bóveda). */
    withPurposeAndExistence: Ratio;
    /**
     * Tablas con el grano de fila respondido. Ninguna fuente del inventario lo declara, así que vale
     * 0 por construcción: es la brecha que impide enviar CUALQUIER ficha sembrada a revisión.
     */
    withRowGrain: Ratio;
    /** Tablas cuyo propósito viene de una nota propia de la bóveda. */
    withVaultOwnText: Ratio;
    withDomain: Ratio;
    touchedByAnEndpoint: Ratio;
    withOrmEntity: Ratio;
  };
  columns: {
    total: number;
    /** Calidad de la explicación de NEGOCIO de cada columna. */
    businessQuality: QualityTally;
    /** Descrita = negocio `CURADA` o `AUTO_DETECTADA` (nunca plantilla ni vacía). */
    described: Ratio;
    /** Descrita con texto propio (sin contar las reglas estándar). */
    describedCurated: Ratio;
    /** Con una propuesta de sensibilidad del clasificador. */
    withSensitivityProposal: Ratio;
    /** La explicación de SISTEMA es estructural y existe para toda columna del inventario. */
    withSystemExplanation: Ratio;
    /** Tablas cuyas columnas están todas descritas. */
    tablesFullyDescribed: Ratio;
  };
  operations: {
    total: number;
    businessQuality: QualityTally;
    systemQuality: QualityTally;
    withRequestDto: Ratio;
    mutationsWithRequestDto: Ratio;
    withResponseDto: Ratio;
    withTablesOrDeclaredNone: Ratio;
    directTableLinks: Ratio;
    requestFieldQuality: QualityTally;
    responseFieldQuality: QualityTally;
    withFlow: Ratio;
  };
  schemas: {
    total: number;
    withBusinessDescription: Ratio;
    systemQuality: 'AUTO_DETECTADA';
  };
  glossary: { terms: number };
  vault: { tablesWithOwnText: number; sha256: string };
}

export function computeCoverage(
  inventory: CatalogacionInventory,
  vault: VaultDataset,
  schemaDescriptions: Readonly<Record<string, SchemaDescriptionLike>>,
): CatalogacionCoverage {
  const context = buildQualityContext(inventory);
  const purposeQuality = emptyTally();
  const businessQuality = emptyTally();
  let curatedPurpose = 0;
  let purposeAndExistence = 0;
  let vaultOwn = 0;
  let withDomain = 0;
  let touched = 0;
  let withOrm = 0;
  let columnsTotal = 0;
  let described = 0;
  let describedCurated = 0;
  let withProposal = 0;
  let fullyDescribed = 0;
  for (const table of inventory.tables) {
    const a = assessTable(table, context, vault.tables[table.id] ?? null);
    purposeQuality[a.purpose.quality] += 1;
    if (a.purpose.quality === 'CURADA') curatedPurpose += 1;
    if (a.purpose.source === 'NOTA_BOVEDA') vaultOwn += 1;
    if (a.purpose.quality === 'CURADA' && a.vault?.existence)
      purposeAndExistence += 1;
    if (table.domain) withDomain += 1;
    if (table.operations.length > 0) touched += 1;
    if (table.ormEntity) withOrm += 1;
    let todas = table.columns.length > 0;
    for (const c of a.columns) {
      columnsTotal += 1;
      businessQuality[c.business.quality] += 1;
      const ok =
        c.business.quality === 'CURADA' ||
        c.business.quality === 'AUTO_DETECTADA';
      if (ok) described += 1;
      else todas = false;
      if (c.business.quality === 'CURADA') describedCurated += 1;
      if (c.sensitivity) withProposal += 1;
    }
    if (todas) fullyDescribed += 1;
  }

  const opsBusiness: QualityTally = emptyTally();
  const opsSystem: QualityTally = emptyTally();
  let withReq = 0;
  let mutations = 0;
  let mutationsWithReq = 0;
  let withRes = 0;
  let withTables = 0;
  let links = 0;
  let directLinks = 0;
  let withFlow = 0;
  const reqFields: QualifiedText[] = [];
  const resFields: QualifiedText[] = [];
  for (const op of inventory.operations) {
    const ref = `inventario/endpoints/${op.module}.json#${op.id}`;
    opsBusiness[
      classifyOperationExplanation(
        {
          estado: op.businessExplanation.state,
          texto: op.businessExplanation.text,
        },
        op.reviewState,
        ref,
      ).quality
    ] += 1;
    opsSystem[
      classifyOperationExplanation(
        {
          estado: op.systemExplanation.state,
          texto: op.systemExplanation.text,
        },
        op.reviewState,
        ref,
      ).quality
    ] += 1;
    if (op.requestDto) withReq += 1;
    if (op.isMutation) {
      mutations += 1;
      if (op.requestDto) mutationsWithReq += 1;
    }
    if (op.responseDto) withRes += 1;
    if (op.tables.length > 0 || op.hasNoTables) withTables += 1;
    for (const t of op.tables) {
      links += 1;
      if (t.confidence === 'DIRECTA') directLinks += 1;
    }
    if (op.flowCodes.length > 0) withFlow += 1;
    for (const f of op.requestFields)
      reqFields.push(
        classifyDtoFieldDescription(
          f,
          op.requestDto ?? op.id,
          context.dtoIndex,
          f.reference,
        ),
      );
    for (const f of op.responseFields)
      resFields.push(
        classifyDtoFieldDescription(
          f,
          op.responseDto ?? op.id,
          context.dtoIndex,
          f.reference,
        ),
      );
  }

  const schemaNames = Object.keys(schemaDescriptions);
  const withBusiness = schemaNames.filter(
    (s) => schemaDescriptions[s].business,
  ).length;
  return {
    tables: {
      total: inventory.tables.length,
      purposeQuality,
      withCuratedPurpose: ratio(curatedPurpose, inventory.tables.length),
      withPurposeAndExistence: ratio(
        purposeAndExistence,
        inventory.tables.length,
      ),
      withRowGrain: ratio(0, inventory.tables.length),
      withVaultOwnText: ratio(vaultOwn, inventory.tables.length),
      withDomain: ratio(withDomain, inventory.tables.length),
      touchedByAnEndpoint: ratio(touched, inventory.tables.length),
      withOrmEntity: ratio(withOrm, inventory.tables.length),
    },
    columns: {
      total: columnsTotal,
      businessQuality,
      described: ratio(described, columnsTotal),
      describedCurated: ratio(describedCurated, columnsTotal),
      withSensitivityProposal: ratio(withProposal, columnsTotal),
      withSystemExplanation: ratio(columnsTotal, columnsTotal),
      tablesFullyDescribed: ratio(fullyDescribed, inventory.tables.length),
    },
    operations: {
      total: inventory.operations.length,
      businessQuality: opsBusiness,
      systemQuality: opsSystem,
      withRequestDto: ratio(withReq, inventory.operations.length),
      mutationsWithRequestDto: ratio(mutationsWithReq, mutations),
      withResponseDto: ratio(withRes, inventory.operations.length),
      withTablesOrDeclaredNone: ratio(withTables, inventory.operations.length),
      directTableLinks: ratio(directLinks, links),
      requestFieldQuality: tally(reqFields),
      responseFieldQuality: tally(resFields),
      withFlow: ratio(withFlow, inventory.operations.length),
    },
    schemas: {
      total: schemaNames.length,
      withBusinessDescription: ratio(withBusiness, schemaNames.length),
      systemQuality: 'AUTO_DETECTADA',
    },
    glossary: { terms: inventory.glossary.length },
    vault: {
      tablesWithOwnText: Object.keys(vault.tables).length,
      sha256: vault.source.sha256,
    },
  };
}
