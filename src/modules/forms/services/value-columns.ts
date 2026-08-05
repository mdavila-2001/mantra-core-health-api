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
 * Traduce un `dataType` técnico + valor a la única columna `value_*` que
 * corresponde (REC 3.4: value[x] exclusivo). Centraliza la exclusividad para que
 * captura (UC-09-08), corrección (UC-09-09), importación (UC-09-10) y migración
 * (UC-09-13) construyan valores de forma consistente.
 */
export function buildValueColumns(
  dataType: string,
  value: unknown,
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
      return { valueConceptId: scalarString(dataType, value) };
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
