import { PreconditionFailedException } from '../../../common';
import type { ValueColumns } from '../repositories';

function scalarString(dataType: string, value: unknown): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return `${value}`;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  throw new PreconditionFailedException(
    `El valor de ${dataType} debe ser escalar`,
    { dataType },
  );
}

function dateValue(dataType: string, value: unknown): Date {
  const parsed = new Date(scalarString(dataType, value));
  if (Number.isNaN(parsed.getTime())) {
    throw new PreconditionFailedException(
      `El valor de ${dataType} no es válido`,
      {
        dataType,
      },
    );
  }
  return parsed;
}

function booleanValue(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  throw new PreconditionFailedException('El valor boolean no es válido', {
    dataType: 'boolean',
  });
}

/**
 * Lo que `buildValueColumns` necesita saber del campo para un `code`: si
 * resuelve contra un conjunto de valores (concepto real, `value_concept_id`)
 * o contra opciones propias tecleadas a mano (texto libre, `value_code`). Sin
 * esto, un `code` sin `valueSetId` intentaría escribir una opción como «Ex
 * fumador» en una columna `uuid` con FK a `terminology.catalog_concepts`, y
 * la base lo rechazaría — no es casualidad, es la columna equivocada.
 */
export interface CodeFieldKind {
  readonly valueSetId?: string;
}

/**
 * Traduce un `dataType` técnico + valor a la única columna `value_*` que
 * corresponde (REC 3.4: value[x] exclusivo). Centraliza la exclusividad para que
 * captura (UC-09-08), corrección (UC-09-09), importación (UC-09-10) y migración
 * (UC-09-13) construyan valores de forma consistente.
 *
 * @param field - Sólo hace falta para `dataType: 'code'`: decide entre
 *   `value_concept_id` (campo con `valueSetId`) y `value_code` (campo con
 *   opciones propias). Ausente, se asume options — es el caso más nuevo y el
 *   único para el que el llamador podría no tener el campo a mano todavía.
 */
export function buildValueColumns(
  dataType: string,
  value: unknown,
  field?: CodeFieldKind,
): ValueColumns {
  if (value === undefined || value === null) {
    throw new PreconditionFailedException('El valor no puede ser nulo', {
      dataType,
    });
  }
  switch (dataType) {
    case 'string':
      return { valueString: scalarString(dataType, value) };
    case 'text':
      return { valueText: scalarString(dataType, value) };
    case 'integer':
      return { valueInteger: scalarString(dataType, value) };
    case 'decimal':
      return { valueDecimal: scalarString(dataType, value) };
    case 'boolean':
      return { valueBoolean: booleanValue(value) };
    case 'date':
      return { valueDate: dateValue(dataType, value) };
    case 'datetime':
      return { valueDatetime: dateValue(dataType, value) };
    case 'time':
      return { valueTime: scalarString(dataType, value) };
    case 'code':
      return field?.valueSetId !== undefined
        ? { valueConceptId: scalarString(dataType, value) }
        : { valueCode: scalarString(dataType, value) };
    case 'reference':
      return { valueReferenceId: scalarString(dataType, value) };
    case 'uuid':
      return { valueReferenceId: scalarString(dataType, value) };
    case 'binary':
      return { fileId: scalarString(dataType, value) };
    case 'json':
      return { valueJson: value };
    default:
      throw new PreconditionFailedException('Tipo de dato no soportado', {
        dataType,
      });
  }
}
