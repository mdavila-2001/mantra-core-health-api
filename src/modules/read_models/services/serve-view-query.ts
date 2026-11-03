import { BadRequestException } from '@nestjs/common';
import type { RequestedFilters } from './projection-executor.service';

/** Petición de datos de una vista, ya validada. */
export interface ServeViewQuery {
  /** Cursor de la página anterior. */
  readonly cursor?: string;
  /** Tamaño de página pedido. */
  readonly limit?: number;
  /** Código de la opción de orden pedida. */
  readonly sort?: string;
  /** Propósito de uso declarado (`catalog_concepts.id`). */
  readonly purposeOfUse?: string;
  /** Paciente cuyo contexto se declara. */
  readonly patientProfileId?: string;
  /** Valores de filtro por código de filtro declarado en el contrato. */
  readonly filters: RequestedFilters;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CURSOR_LENGTH = 1024;
const MAX_TOKEN_LENGTH = 120;
const MAX_FILTER_VALUE_LENGTH = 200;
const MAX_LIMIT = 10_000;
const RESERVED = new Set([
  'cursor',
  'limit',
  'sort',
  'purposeOfUse',
  'patientProfileId',
]);

/**
 * Valida el query string de `GET .../data`.
 *
 * Las claves reservadas (`cursor`, `limit`, `sort`, `purposeOfUse`,
 * `patientProfileId`) se interpretan; **cualquier otra clave es un filtro** y se
 * valida contra el contrato en el ejecutor: un filtro no declarado se rechaza
 * sin ejecutar SQL. Sólo se admiten valores escalares (un arreglo o un objeto no
 * se coerciona).
 *
 * @param raw - `request.query` tal como llega.
 * @returns La petición validada.
 * @throws BadRequestException si algún valor no es escalar o tiene formato inválido.
 */
export function parseServeViewQuery(
  raw: Record<string, unknown> | undefined,
): ServeViewQuery {
  const query = raw ?? {};
  const text = (key: string, max: number): string | undefined => {
    const value = query[key];
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || value.length === 0 || value.length > max) {
      throw new BadRequestException(`El parámetro «${key}» no es válido`);
    }
    return value;
  };
  const uuid = (key: string): string | undefined => {
    const value = text(key, 36);
    if (value !== undefined && !UUID.test(value)) {
      throw new BadRequestException(`El parámetro «${key}» no es válido`);
    }
    return value;
  };

  let limit: number | undefined;
  const rawLimit = text('limit', 10);
  if (rawLimit !== undefined) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new BadRequestException('El parámetro «limit» no es válido');
    }
  }

  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (RESERVED.has(key)) continue;
    if (
      typeof value !== 'string' ||
      value.length === 0 ||
      value.length > MAX_FILTER_VALUE_LENGTH ||
      key.length > MAX_TOKEN_LENGTH
    ) {
      throw new BadRequestException(`El filtro «${key}» no es válido`);
    }
    filters[key] = value;
  }

  return {
    cursor: text('cursor', MAX_CURSOR_LENGTH),
    limit,
    sort: text('sort', MAX_TOKEN_LENGTH),
    purposeOfUse: uuid('purposeOfUse'),
    patientProfileId: uuid('patientProfileId'),
    filters,
  };
}
