import { describe, it, expect, jest } from '@jest/globals';
import { VademecumSeedService } from './vademecum-seed.service';
import vademecumDataset from './data/vademecum/vademecum.dataset.json';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * `em.find` responde con lo que ya existe (por defecto, nada); `em.findOne`
 * cubre las entidades que el servicio busca una por una (fuentes, code
 * system, versión, interacciones).
 *
 * @returns Servicio y dobles observables.
 */
function build() {
  const em = {
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn(),
    flush: jest.fn(() => Promise.resolve()),
  } as any;
  const orm = { em: { fork: () => em } } as any;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as any;
  const service = new VademecumSeedService(orm, logger);
  return { service, em, logger };
}

describe('VademecumSeedService', () => {
  it('sobre una base vacía inserta las fuentes, el code system, los conceptos y sus propiedades', async () => {
    const { service, em } = build();

    const result = await service.run('development', false);

    expect(result.inserted).toBeGreaterThan(0);
    expect(em.create).toHaveBeenCalled();
  });

  it('se niega en producción sin autorización explícita', async () => {
    const { service, em, logger } = build();

    const result = await service.run('production', false);

    expect(result).toEqual({ inserted: 0, skipped: 'production-not-allowed' });
    expect(em.create).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('en producción con SEED_VADEMECUM_ALLOW_PRODUCTION sí siembra', async () => {
    const { service, em } = build();

    const result = await service.run('production', true);

    expect(result.skipped).toBeUndefined();
    expect(result.inserted).toBeGreaterThan(0);
    expect(em.create).toHaveBeenCalled();
  });

  it('reejecutado sobre una base ya completa no inserta nada', async () => {
    const { service, em } = build();
    em.find.mockImplementation((_entity: unknown, where: any) =>
      Promise.resolve((where?.id?.$in ?? []).map((id: string) => ({ id }))),
    );
    em.findOne.mockResolvedValue({ id: 'ya-existe' });

    const result = await service.run('development', false);

    expect(result).toEqual({ inserted: 0 });
    expect(em.create).not.toHaveBeenCalled();
  });

  // --- B-13: el dataset nunca vuelve a traer contenido clínico ni las tres
  // fuentes que no lo respaldan. Es la aserción negativa que fija la
  // corrección: si alguien reintroduce estas claves a mano, este test las
  // atrapa sin depender de que corra la base de datos. ---------------------

  it('el dataset no declara ninguna propiedad clínica sin lector (contraindicaciones, indicaciones, efectos adversos, monitoreo)', () => {
    const clinicalCodes = new Set([
      'contraindications',
      'indications',
      'adverse_effects',
      'monitoring',
    ]);

    const found = vademecumDataset.properties.filter((property) =>
      clinicalCodes.has(property.property_code),
    );

    expect(found).toEqual([]);
  });

  it('el dataset no declara códigos externos (rxnorm_cui, snomed_code) que las fuentes citadas no respaldan', () => {
    const falseAttributionCodes = new Set(['rxnorm_cui', 'snomed_code']);

    const found = vademecumDataset.properties.filter((property) =>
      falseAttributionCodes.has(property.property_code),
    );

    expect(found).toEqual([]);
  });

  it('el dataset declara una única fuente, y no es RxNorm, SNOMED CT ni WHO ATC/DDD', () => {
    expect(vademecumDataset.sources).toHaveLength(1);

    const codes = vademecumDataset.sources.map((source) => source.code);
    expect(codes).not.toContain('RXNORM');
    expect(codes).not.toContain('SNOMED_CT');
    expect(codes).not.toContain('WHO_ATC');
  });

  it('el code system del vademécum apunta a la única fuente declarada', () => {
    const sourceIds = new Set(
      vademecumDataset.sources.map((source) => source.id),
    );

    for (const system of vademecumDataset.codeSystem) {
      expect(sourceIds.has(system.source_id)).toBe(true);
    }
  });
});
