import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  COVERAGE_MAX_STUDIES,
  SearchDiagnosticUnitsQueryDto,
} from './catalog.dto';

const RX = '1f0c5b6e-2a1d-4c3e-9b8a-7d6e5f4a3b2c';
const ECO = '2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

/**
 * Valida la query como lo hace el `ValidationPipe` global.
 *
 * @param query - Parámetros recibidos, como texto.
 * @returns Las propiedades con error, ordenadas.
 */
async function errors(query: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(SearchDiagnosticUnitsQueryDto, query, {
    enableImplicitConversion: true,
  });
  const found = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return [...new Set(found.map((e) => e.property))].sort();
}

describe('SearchDiagnosticUnitsQueryDto — búsqueda por cobertura', () => {
  it('correcto: los conceptos llegan separados por coma, sin repetidos ni vacíos', async () => {
    const dto = plainToInstance(SearchDiagnosticUnitsQueryDto, {
      studyConceptIds: ` ${RX},${ECO},,${RX} `,
    });
    expect(dto.studyConceptIds).toEqual([RX, ECO]);
    expect(await errors({ studyConceptIds: `${RX},${ECO}` })).toEqual([]);
  });

  it('correcto: sin el parámetro el buscador de siempre no pide nada nuevo', async () => {
    expect(await errors({})).toEqual([]);
    expect(await errors({ kind: 'IMAGING', studyCode: 'RX-TORAX' })).toEqual(
      [],
    );
  });

  it('inválido: un concepto que no es uuid, o la lista vacía', async () => {
    expect(await errors({ studyConceptIds: `${RX},torax` })).toEqual([
      'studyConceptIds',
    ]);
    expect(await errors({ studyConceptIds: ',' })).toEqual(['studyConceptIds']);
  });

  it('límite: hasta COVERAGE_MAX_STUDIES conceptos', async () => {
    const uuid = (n: number) =>
      `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    const list = (count: number) =>
      Array.from({ length: count }, (_, i) => uuid(i + 1)).join(',');
    expect(
      await errors({ studyConceptIds: list(COVERAGE_MAX_STUDIES) }),
    ).toEqual([]);
    expect(
      await errors({ studyConceptIds: list(COVERAGE_MAX_STUDIES + 1) }),
    ).toEqual(['studyConceptIds']);
  });

  it('límite: lat y lng en rango WGS84', async () => {
    expect(await errors({ lat: '-17.7834', lng: '-63.1821' })).toEqual([]);
    expect(await errors({ lat: '90', lng: '180' })).toEqual([]);
    expect(await errors({ lat: '91', lng: '0' })).toEqual(['lat']);
    expect(await errors({ lat: '0', lng: '-181' })).toEqual(['lng']);
    expect(await errors({ lat: 'norte', lng: '0' })).toEqual(['lat']);
  });
});
