import {
  classifyColumn,
  type ClassificationProposal,
} from '../../domain/classification/column-classifier';
import type {
  CatalogacionInventory,
  InvColumn,
  InvTable,
} from './catalogacion-inventory';
import {
  TemplateIndex,
  classifyColumnBusiness,
  classifyTablePurpose,
  type QualifiedText,
} from './explanation-quality';
import {
  columnSystemExplanation,
  tableSystemExplanation,
} from './system-explanation';

/** Texto propio de una tabla en la bóveda (el dataset ya descartó lo que es plantilla de la bóveda). */
export interface VaultTableNote {
  reference: string;
  sha256: string;
  business?: string;
  example?: string;
  existence?: string;
}

export interface VaultDataset {
  generatedBy?: string;
  source: { vault: string; sha256: string; [clave: string]: unknown };
  tables: Readonly<Record<string, VaultTableNote>>;
}

/** Los tres moldes (tabla, columna, campo de DTO) con que se decide qué es plantilla. */
export interface QualityContext {
  tableIndex: TemplateIndex;
  columnIndex: TemplateIndex;
  dtoIndex: TemplateIndex;
}

/** Recorre el inventario una vez y cuenta en cuántos objetos distintos aparece cada molde. */
export function buildQualityContext(
  inventory: CatalogacionInventory,
): QualityContext {
  const tableIndex = new TemplateIndex();
  const columnIndex = new TemplateIndex();
  const dtoIndex = new TemplateIndex();
  for (const table of inventory.tables) {
    tableIndex.add(table.id, table.purpose.text, [table.name]);
    for (const column of table.columns)
      columnIndex.add(`${table.id}.${column.name}`, column.description.text, [
        table.name,
        column.name,
      ]);
  }
  for (const op of inventory.operations) {
    for (const field of [...op.requestFields, ...op.responseFields])
      dtoIndex.add(`${op.id}.${field.name}`, field.description, [field.name]);
  }
  return { tableIndex, columnIndex, dtoIndex };
}

export interface ColumnAssessment {
  column: InvColumn;
  /** Explicación de negocio (la que puede ser `VACIA`). */
  business: QualifiedText;
  /** Explicación de sistema: estructural, siempre `AUTO_DETECTADA`. */
  system: string;
  /** Lo que propone el clasificador existente (`classifyColumn`), o `null` si ninguna regla aplica. */
  sensitivity: ClassificationProposal | null;
}

export interface TableAssessment {
  table: InvTable;
  purpose: QualifiedText;
  vault: VaultTableNote | null;
  system: string;
  columns: ColumnAssessment[];
}

/** Evalúa una tabla y sus columnas con los moldes del inventario completo. */
export function assessTable(
  table: InvTable,
  context: QualityContext,
  vault: VaultTableNote | null,
): TableAssessment {
  const vaultBusiness = vault?.business
    ? { text: vault.business, reference: vault.reference }
    : null;
  return {
    table,
    vault,
    purpose: classifyTablePurpose(
      {
        id: table.id,
        name: table.name,
        purpose: {
          text: table.purpose.text,
          reference: table.purpose.reference,
        },
      },
      context.tableIndex,
      vaultBusiness,
    ),
    system: tableSystemExplanation(table),
    columns: table.columns.map((column) => ({
      column,
      business: classifyColumnBusiness(
        {
          name: column.name,
          nativeType: column.nativeType,
          description: column.description,
        },
        [table.name],
        context.columnIndex,
      ),
      system: columnSystemExplanation(table, column),
      sensitivity: classifyColumn({
        columnName: column.name,
        nativeType: column.nativeType,
        objectName: table.name,
        schemaName: table.schema,
      }),
    })),
  };
}
