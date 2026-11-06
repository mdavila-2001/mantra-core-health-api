import { Injectable } from '@nestjs/common';
import {
  BULK_IMPORT_FORMATS,
  BULK_IMPORT_LIMITS,
  type BulkImportFormat,
} from '../bulk-import.constants';
import {
  exampleRow,
  type KindSchema,
  type NormalizedRow,
} from '../schema/field-schema';
import { ALL_KIND_SCHEMAS } from '../schema/registry';

/** Un archivo listo para descargar. */
export interface TemplateFile {
  readonly content: Buffer;
  readonly contentType: string;
  readonly fileName: string;
}

/** Una columna de la plantilla JSON. */
export interface TemplateColumn {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description: string;
  readonly example: string;
  /** De qué DTO/entidad existente sale el campo. */
  readonly source: string;
  /** Valores admitidos, si el campo es de lista cerrada. */
  readonly allowedValues?: readonly string[];
}

/** Plantilla JSON: `{ kind, version, columns, example, rules }`. */
export interface JsonTemplate {
  readonly kind: string;
  readonly version: string;
  readonly columns: readonly TemplateColumn[];
  readonly example: readonly NormalizedRow[];
  readonly rules: readonly string[];
}

/** Entrada del catálogo de plantillas. */
export interface TemplateCatalogEntry {
  readonly kind: string;
  readonly version: string;
  readonly group: string;
  readonly title: string;
  readonly description: string;
  readonly permission: string;
  readonly columnCount: number;
  readonly formats: readonly BulkImportFormat[];
}

function csvCell(value: string): string {
  return /[",\n\r;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Genera las plantillas (regla T1) **desde el mismo esquema que valida**.
 *
 * Nada se guarda en un archivo: si alguien agrega una columna al esquema, la
 * plantilla CSV, la JSON y la validación cambian juntas. Los ejemplos son
 * sintéticos y están declarados como tales (`.invalid`, `SINT-…`).
 */
@Injectable()
export class TemplateService {
  /** Catálogo de todos los tipos de carga. */
  catalog(): readonly TemplateCatalogEntry[] {
    return ALL_KIND_SCHEMAS.map((schema) => ({
      kind: schema.kind,
      version: schema.version,
      group: schema.group,
      title: schema.title,
      description: schema.description,
      permission: schema.permission,
      columnCount: schema.fields.length,
      formats: BULK_IMPORT_FORMATS,
    }));
  }

  /** La plantilla en JSON (esquema de campos + fila de ejemplo + reglas). */
  json(schema: KindSchema): JsonTemplate {
    return {
      kind: schema.kind,
      version: schema.version,
      columns: schema.fields.map((f) => ({
        name: f.name,
        type: f.type,
        required: f.required,
        description: f.description,
        example: f.example,
        source: f.source,
        ...(f.values ? { allowedValues: f.values } : {}),
      })),
      example: [exampleRow(schema)],
      rules: [
        ...schema.rules,
        `Formatos admitidos: ${BULK_IMPORT_FORMATS.join(', ')}. Máximo ${BULK_IMPORT_LIMITS.maxRows} filas y ${BULK_IMPORT_LIMITS.maxBytes / (1024 * 1024)} MB por archivo.`,
        'Los ejemplos son sintéticos: reemplácelos por los datos reales antes de cargar.',
      ],
    };
  }

  /** La plantilla CSV: encabezado y una fila de ejemplo. */
  csv(schema: KindSchema): Buffer {
    const names = schema.fields.map((f) => f.name);
    const example = exampleRow(schema);
    const lines = [
      names.map(csvCell).join(','),
      names.map((n) => csvCell(example[n] ?? '')).join(','),
    ];
    return Buffer.from(`${lines.join('\n')}\n`, 'utf8');
  }

  /** La plantilla como archivo con nombre y tipo, lista para descargar. */
  file(schema: KindSchema, format: BulkImportFormat): TemplateFile {
    const base = `plantilla-${schema.kind}-v${schema.version}`;
    if (format === 'csv') {
      return {
        content: this.csv(schema),
        contentType: 'text/csv; charset=utf-8',
        fileName: `${base}.csv`,
      };
    }
    return {
      content: Buffer.from(
        `${JSON.stringify(this.json(schema), null, 2)}\n`,
        'utf8',
      ),
      contentType: 'application/json; charset=utf-8',
      fileName: `${base}.json`,
    };
  }
}
