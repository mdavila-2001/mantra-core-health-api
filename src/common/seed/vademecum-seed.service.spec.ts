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
    // «Base ya completa» tiene que responder a las DOS formas de consulta que
    // usa el servicio, no sólo a una. Las designaciones, propiedades e
    // interacciones se buscan por id; los conceptos, en cambio, se buscan por
    // su clave natural `(code_system_version_id, code)` —que es lo correcto:
    // el id del dataset no es el que manda si la fila ya llegó por otro
    // camino—. Un doble que sólo entendía `id.$in` devolvía «no existe» para
    // los 17 conceptos y el servicio, con razón, los creaba.
    em.find.mockImplementation((_entity: unknown, where: any) => {
      if (where?.id?.$in) {
        return Promise.resolve(where.id.$in.map((id: string) => ({ id })));
      }
      if (where?.code?.$in) {
        const [versionId] = where.codeSystemVersionId?.$in ?? [];
        return Promise.resolve(
          where.code.$in.map((code: string, i: number) => ({
            id: `concepto-existente-${i}`,
            codeSystemVersionId: versionId,
            code,
          })),
        );
      }
      return Promise.resolve([]);
    });
    em.findOne.mockResolvedValue({ id: 'ya-existe' });

    const result = await service.run('development', false);

    expect(result.inserted).toBe(0);
    expect(em.create).not.toHaveBeenCalled();
  });

  it('sobre una base que ya dice lo mismo que el dataset no corrige nada', async () => {
    const { service, em } = build();
    const conceptById = new Map(
      vademecumDataset.concepts.map((c) => [c.id, c]),
    );
    const designationById = new Map(
      vademecumDataset.designations.map((d) => [d.id, d]),
    );
    const propertyById = new Map(
      vademecumDataset.properties.map((p) => [p.id, p]),
    );
    em.find.mockImplementation((_entity: unknown, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      if (ids.length > 0 && conceptById.has(ids[0])) {
        return Promise.resolve(
          ids.map((id) => ({
            id,
            display: conceptById.get(id)!.display,
            definition: undefined,
          })),
        );
      }
      if (ids.length > 0 && designationById.has(ids[0])) {
        return Promise.resolve(
          ids.map((id) => ({
            id,
            preferred: designationById.get(id)!.preferred,
          })),
        );
      }
      if (ids.length > 0 && propertyById.has(ids[0])) {
        // Como lo devuelve Postgres: `jsonb` no conserva el orden de las claves.
        const reordenado = (v: unknown): unknown =>
          Array.isArray(v)
            ? v.map(reordenado)
            : v !== null && typeof v === 'object'
              ? Object.fromEntries(
                  Object.entries(v)
                    .reverse()
                    .map(([k, x]) => [k, reordenado(x)]),
                )
              : v;
        return Promise.resolve(
          ids.map((id) => ({
            id,
            valueJson: reordenado(propertyById.get(id)!.value_json),
          })),
        );
      }
      if (where?.code?.$in) {
        const [versionId] = where.codeSystemVersionId?.$in ?? [];
        return Promise.resolve(
          vademecumDataset.concepts.map((c) => ({
            id: c.id,
            codeSystemVersionId: versionId,
            code: c.code,
          })),
        );
      }
      return Promise.resolve([]);
    });
    em.findOne.mockResolvedValue({ id: 'ya-existe' });

    const result = await service.run('development', false);

    expect(result).toEqual({ inserted: 0, reconciled: 0 });
  });

  it('corrige el nombre en inglés de un medicamento ya cargado al oficial de la LINAME', async () => {
    const { service, em } = build();
    const salbutamol = vademecumDataset.concepts.find(
      (c) => c.code === 'R03AC02',
    )!;
    const fila = {
      id: salbutamol.id,
      display: 'Albuterol',
      definition: 'Short-acting beta-2 agonist.',
    } as any;
    em.find.mockImplementation((_entity: unknown, where: any) => {
      const ids: string[] = where?.id?.$in ?? [];
      if (ids.includes(salbutamol.id)) return Promise.resolve([fila]);
      if (where?.code?.$in) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    await service.run('development', false);

    expect(fila.display).toBe('Salbutamol');
    expect(fila.definition).toBeUndefined();
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

  it('el dataset declara sólo el vademécum de desarrollo y la LINAME, y ninguna de las tres que no lo respaldan', () => {
    // La LINAME (Ministerio de Salud y Deportes de Bolivia) sí respalda lo que
    // aporta: nombre, forma, concentración, código LINAME, ATC y uso restringido.
    expect(
      vademecumDataset.sources.map((source) => source.code).sort(),
    ).toEqual(['LINAME_BO', 'MANTRA_DEV_VADEMECUM']);

    const codes = vademecumDataset.sources.map((source) => source.code);
    expect(codes).not.toContain('RXNORM');
    expect(codes).not.toContain('SNOMED_CT');
    expect(codes).not.toContain('WHO_ATC');
  });

  it('el code system del vademécum apunta a una fuente declarada', () => {
    const sourceIds = new Set(
      vademecumDataset.sources.map((source) => source.id),
    );

    for (const system of vademecumDataset.codeSystem) {
      expect(sourceIds.has(system.source_id)).toBe(true);
    }
  });
});

describe('vademécum: la LINAME 2022-2024', () => {
  it('trae los medicamentos esenciales de Bolivia por ATC nivel 5, en castellano y con sus presentaciones', () => {
    expect(vademecumDataset.concepts.length).toBeGreaterThan(480);
    for (const concept of vademecumDataset.concepts) {
      expect(concept.code).toMatch(/^[A-Z]\d{2}[A-Z]{2}\d{2}$/);
      expect(concept.definition).toBeNull();
    }
    const gentamicina = vademecumDataset.concepts.find(
      (c) => c.code === 'J01GB03',
    )!;
    const presentaciones = vademecumDataset.properties.find(
      (p) =>
        p.concept_id === gentamicina.id &&
        p.property_code === 'liname_presentations',
    )!;
    expect(presentaciones.value_json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'J-01-49',
          form: 'Inyectable',
          strength: '80 mg',
        }),
      ]),
    );
  });

  it('ningún nombre de los 17 de desarrollo queda en inglés', () => {
    const ingles = [
      'Omeprazole',
      'Albuterol',
      'Amoxicillin',
      'Atorvastatin',
      'Azithromycin',
      'Amlodipine',
      'Acetaminophen',
    ];
    expect(
      vademecumDataset.concepts.filter((c) => ingles.includes(c.display)),
    ).toEqual([]);
  });
});
