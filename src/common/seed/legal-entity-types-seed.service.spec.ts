import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LegalEntityTypesSeedService } from './legal-entity-types-seed.service';
import { LEGAL_ENTITY_TYPES } from '../../modules/directory/legal-entity-types';

const QUANTITY = LEGAL_ENTITY_TYPES.length;

/**
 * Construye el seed con un contexto de persistencia controlado — mismo patrón
 * que `bo-geography-seed.service.spec.ts`: un `em` en memoria que responde
 * `find`/`create`/`flush` sin tocar una base real.
 *
 * @param existingConcepts - Concept ids que la base ya tiene sembrados.
 * @param existingProperties - Ids de propiedad que ya existen (para probar
 *   idempotencia).
 * @returns Servicio, filas creadas y utilidades de lectura.
 */
function build(
  existingConcepts: Set<string> = new Set(
    LEGAL_ENTITY_TYPES.map((e) => e.conceptId),
  ),
  existingProperties: Set<string> = new Set(),
) {
  const created: { entity: string; data: any }[] = [];

  const em = {
    find: mockFn((entity: any, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      const source =
        entity.name === 'CatalogConcepts'
          ? existingConcepts
          : existingProperties;
      return Promise.resolve(
        ids.filter((id) => source.has(id)).map((id) => ({ id })),
      );
    }),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new LegalEntityTypesSeedService(
    orm as never,
    logger as never,
  );
  return { service, em, created, logger };
}

describe('LegalEntityTypesSeedService', () => {
  it('siembra país y categoría canónica para cada forma societaria sembrada', async () => {
    const { service, created } = build();

    const result = await service.run();

    expect(result.properties).toBe(QUANTITY * 2);
    const properties = created.filter(
      (row) => row.entity === 'ConceptProperties',
    );
    expect(properties).toHaveLength(QUANTITY * 2);

    const countrySrl = properties.find(
      (row) =>
        row.data.conceptId ===
          LEGAL_ENTITY_TYPES.find((e) => e.code === 'SRL')!.conceptId &&
        row.data.propertyCode === 'legal-entity-country',
    );
    expect(countrySrl?.data.valueJson).toBe('BO');

    const categoryLlc = properties.find(
      (row) =>
        row.data.conceptId ===
          LEGAL_ENTITY_TYPES.find((e) => e.code === 'US_LLC')!.conceptId &&
        row.data.propertyCode === 'legal-entity-canonical-category',
    );
    expect(categoryLlc?.data.valueJson).toBe('LIMITED_LIABILITY');
  });

  it('cubre las 40 formas del diccionario ampliado', () => {
    expect(QUANTITY).toBe(40);
  });

  it('siembra la categoría de las formas no societarias y del sector público', async () => {
    const { service, created } = build();

    await service.run();

    const categoryOf = (code: string) =>
      created.find(
        (row) =>
          row.data.conceptId ===
            LEGAL_ENTITY_TYPES.find((e) => e.code === code)!.conceptId &&
          row.data.propertyCode === 'legal-entity-canonical-category',
      )?.data.valueJson;
    expect(categoryOf('COOPERATIVA')).toBe('COOPERATIVE');
    expect(categoryOf('FUNDACION')).toBe('NONPROFIT');
    expect(categoryOf('ENTIDAD_PUBLICA')).toBe('PUBLIC_ENTITY');
    expect(categoryOf('EMPRESA_ESTATAL_MIXTA')).toBe('STATE_OWNED_ENTERPRISE');
    expect(categoryOf('SAM')).toBe('CORPORATION');
    expect(categoryOf('PROFESIONAL_INDEPENDIENTE')).toBe('SOLE_PROPRIETORSHIP');
  });

  it('en una base sembrada con el diccionario de 21 agrega sólo las formas nuevas', async () => {
    const original = LEGAL_ENTITY_TYPES.slice(0, 21);
    const first = build(new Set(original.map((e) => e.conceptId)));
    await first.service.run();
    const already = new Set(first.created.map((row) => row.data.id as string));

    const { service, created } = build(
      new Set(LEGAL_ENTITY_TYPES.map((e) => e.conceptId)),
      already,
    );

    const result = await service.run();

    expect(result.properties).toBe((QUANTITY - 21) * 2);
    const touched = new Set(created.map((row) => row.data.conceptId));
    for (const entry of original) {
      expect(touched.has(entry.conceptId)).toBe(false);
    }
  });

  it('no inserta nada en una segunda corrida: todo ya existe', async () => {
    // Primera corrida real, para conocer los ids deterministas que generó.
    const first = build();
    await first.service.run();
    const idsGenerated = new Set(
      first.created.map((row) => row.data.id as string),
    );

    const { service, created } = build(
      new Set(LEGAL_ENTITY_TYPES.map((e) => e.conceptId)),
      idsGenerated,
    );

    const result = await service.run();

    expect(result.properties).toBe(0);
    expect(created).toHaveLength(0);
  });

  it('omite con aviso las formas societarias cuyo concepto todavía no está sembrado', async () => {
    const { service, created, logger } = build(new Set());

    const result = await service.run();

    expect(result.properties).toBe(0);
    expect(created).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ count: QUANTITY }),
      expect.stringContaining('todavía no está en el catálogo'),
    );
  });
});
