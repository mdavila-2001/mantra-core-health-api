import { PreconditionFailedException } from '../../../common';
import type { ValueColumns } from '../repositories';

/**
 * Traduce un `dataType` técnico + valor a la única columna `value_*` que
 * corresponde (REC 3.4: value[x] exclusivo). Centraliza la exclusividad para que
 * captura (UC-09-08), corrección (UC-09-09), importación (UC-09-10) y migración
 * (UC-09-13) construyan valores de forma consistente.
 */
export function buildValueColumns(dataType: string, value: unknown): ValueColumns {
  if (value === undefined || value === null) {
    throw new PreconditionFailedException('El valor no puede ser nulo', { dataType });
  }
  switch (dataType) {
    case 'string':
      return { valueString: String(value) };
    case 'text':
      return { valueText: String(value) };
    case 'integer':
      return { valueInteger: String(value) };
    case 'decimal':
      return { valueDecimal: String(value) };
    case 'boolean':
      return { valueBoolean: Boolean(value) };
    case 'date':
      return { valueDate: new Date(String(value)) };
    case 'datetime':
      return { valueDatetime: new Date(String(value)) };
    case 'time':
      return { valueTime: String(value) };
    case 'code':
      return { valueConceptId: String(value) };
    case 'reference':
      return { valueReferenceId: String(value) };
    case 'uuid':
      return { valueReferenceId: String(value) };
    case 'binary':
      return { fileId: String(value) };
    case 'json':
      return { valueJson: value };
    default:
      throw new PreconditionFailedException('Tipo de dato no soportado', { dataType });
  }
}
