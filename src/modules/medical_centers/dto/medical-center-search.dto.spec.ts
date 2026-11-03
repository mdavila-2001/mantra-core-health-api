import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  MedicalCenterForOrdersQueryDto,
  MedicalCenterSearchQueryDto,
} from './medical-center-search.dto';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

/**
 * Convierte la query como lo hace el `ValidationPipe` y la valida.
 *
 * @param cls - Clase del DTO.
 * @param query - Parámetros tal como llegan por la URL.
 * @returns La instancia y las propiedades con error.
 */
async function parse<T extends object>(
  cls: new () => T,
  query: Record<string, unknown>,
) {
  const dto = plainToInstance(cls, query);
  const errors = await validate(dto);
  return { dto, invalid: errors.map((e) => e.property) };
}

describe('MedicalCenterSearchQueryDto', () => {
  it('`a,b,a` se parte en [a, b] sin repetidos', async () => {
    const { dto, invalid } = await parse(MedicalCenterSearchQueryDto, {
      procedureConceptIds: `${A},${B},${A}`,
    });

    expect(invalid).toEqual([]);
    expect(dto.procedureConceptIds).toEqual([A, B]);
  });

  it('sin procedimientos da error', async () => {
    const { invalid } = await parse(MedicalCenterSearchQueryDto, {});
    expect(invalid).toContain('procedureConceptIds');
  });

  it('una lista vacía da error', async () => {
    const { invalid } = await parse(MedicalCenterSearchQueryDto, {
      procedureConceptIds: ',,',
    });
    expect(invalid).toContain('procedureConceptIds');
  });

  it('51 procedimientos dan error y 50 pasan', async () => {
    const ids = (n: number) =>
      Array.from(
        { length: n },
        (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      ).join(',');

    expect(
      (
        await parse(MedicalCenterSearchQueryDto, {
          procedureConceptIds: ids(51),
        })
      ).invalid,
    ).toContain('procedureConceptIds');
    expect(
      (
        await parse(MedicalCenterSearchQueryDto, {
          procedureConceptIds: ids(50),
        })
      ).invalid,
    ).toEqual([]);
  });

  it('un valor que no es uuid da error', async () => {
    const { invalid } = await parse(MedicalCenterSearchQueryDto, {
      procedureConceptIds: `${A},no-es-uuid`,
    });
    expect(invalid).toContain('procedureConceptIds');
  });

  it('lat fuera de rango da error', async () => {
    const { invalid } = await parse(MedicalCenterSearchQueryDto, {
      procedureConceptIds: A,
      lat: '91',
      lng: '0',
    });
    expect(invalid).toContain('lat');
  });

  it('lng fuera de rango da error', async () => {
    const { invalid } = await parse(MedicalCenterSearchQueryDto, {
      procedureConceptIds: A,
      lat: '0',
      lng: '181',
    });
    expect(invalid).toContain('lng');
  });

  it('includePartial ausente no viene definido: el servicio lo trata como false', async () => {
    const { dto, invalid } = await parse(MedicalCenterSearchQueryDto, {
      procedureConceptIds: A,
    });
    expect(invalid).toEqual([]);
    expect(dto.includePartial).toBeUndefined();
  });

  it('limit y offset tienen tope y piso', async () => {
    expect(
      (
        await parse(MedicalCenterSearchQueryDto, {
          procedureConceptIds: A,
          limit: '101',
        })
      ).invalid,
    ).toContain('limit');
    expect(
      (
        await parse(MedicalCenterSearchQueryDto, {
          procedureConceptIds: A,
          limit: '0',
        })
      ).invalid,
    ).toContain('limit');
    expect(
      (
        await parse(MedicalCenterSearchQueryDto, {
          procedureConceptIds: A,
          offset: '-1',
        })
      ).invalid,
    ).toContain('offset');
  });
});

describe('MedicalCenterForOrdersQueryDto', () => {
  it('las órdenes se parten por coma sin repetidos', async () => {
    const { dto, invalid } = await parse(MedicalCenterForOrdersQueryDto, {
      serviceRequestIds: `${A},${A},${B}`,
    });

    expect(invalid).toEqual([]);
    expect(dto.serviceRequestIds).toEqual([A, B]);
  });

  it('sin órdenes da error', async () => {
    const { invalid } = await parse(MedicalCenterForOrdersQueryDto, {});
    expect(invalid).toContain('serviceRequestIds');
  });
});
