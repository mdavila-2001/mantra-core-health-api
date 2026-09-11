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

const CANTIDAD = LEGAL_ENTITY_TYPES.length;

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

    expect(result.properties).toBe(CANTIDAD * 2);
    const propiedades = created.filter(
      (row) => row.entity === 'ConceptProperties',
    );
    expect(propiedades).toHaveLength(CANTIDAD * 2);

    const paisSrl = propiedades.find(
      (row) =>
        row.data.conceptId ===
          LEGAL_ENTITY_TYPES.find((e) => e.code === 'SRL')!.conceptId &&
        row.data.propertyCode === 'legal-entity-country',
    );
    expect(paisSrl?.data.valueJson).toBe('BO');

    const categoriaLlc = propiedades.find(
      (row) =>
        row.data.conceptId ===
          LEGAL_ENTITY_TYPES.find((e) => e.code === 'US_LLC')!.conceptId &&
        row.data.propertyCode === 'legal-entity-canonical-category',
    );
    expect(categoriaLlc?.data.valueJson).toBe('LIMITED_LIABILITY');
  });

  it('no inserta nada en una segunda corrida: todo ya existe', async () => {
    // Primera corrida real, para conocer los ids deterministas que generó.
    const primera = build();
    await primera.service.run();
    const idsGenerados = new Set(
      primera.created.map((row) => row.data.id as string),
    );

    const { service, created } = build(
      new Set(LEGAL_ENTITY_TYPES.map((e) => e.conceptId)),
      idsGenerados,
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
      expect.objectContaining({ count: CANTIDAD }),
      expect.stringContaining('todavía no está en el catálogo'),
    );
  });
});
