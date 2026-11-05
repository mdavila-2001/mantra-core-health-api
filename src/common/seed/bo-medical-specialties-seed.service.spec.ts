import { describe, expect, it, jest } from '@jest/globals';

import modelSpecialties from './data/specialty-services/model-specialties.json';
import dentalDataset from './data/bolivia/dental-specialties.dataset.json';
import { BoMedicalSpecialtiesSeedService } from './bo-medical-specialties-seed.service';
import {
  BO_MEDICAL_SPECIALTIES,
  BO_SPECIALTY_PARENT_PROPERTY_CODE,
  boSpecialtyConceptCode,
  boSpecialtyConceptId,
  boSpecialtyDesignationId,
  boSpecialtyMemberId,
  boSpecialtyPropertyId,
  BO_SPECIALTY_DISCIPLINE_PROPERTY_CODE,
  normalizeSpecialtyName,
} from './bo-medical-specialties.catalog';

/** Ejecuta la operación mock fn. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const VALUE_SET_ID = 'vs-medical-specialty';
const VERSION_ID = 'vs-medical-specialty-v1';
const N = BO_MEDICAL_SPECIALTIES.length;

/** Un miembro del conjunto que no es de este seed (el del modelo). */
interface ForeignMember {
  id: string;
  conceptId: string;
  ordinal: number;
  code: string;
  display: string;
}

/** Los códigos del modelo, tal como los fotografía el repo. */
const MODEL = modelSpecialties.specialties as {
  code: string;
  display: string;
  conceptId: string;
}[];

/** Los 63 del modelo como miembros de la versión vigente. */
const modelMembers = (): ForeignMember[] =>
  MODEL.map((s, ordinal) => ({
    id: `model-member-${s.code}`,
    conceptId: s.conceptId,
    ordinal,
    code: s.code,
    display: s.display,
  }));

/**
 * Seed con un `em` en memoria.
 *
 * @param options.foreign - Miembros ajenos de la versión vigente.
 * @param options.existing - Ids que la base ya tiene (conceptos, designaciones…).
 * @param options.ownMembers - Membresías propias ya guardadas, con su ordinal.
 * @param options.valueSet - Si el conjunto existe.
 */
function build(
  options: {
    foreign?: ForeignMember[];
    existing?: Set<string>;
    ownMembers?: { id: string; conceptId: string; ordinal: number }[];
    valueSet?: boolean;
  } = {},
) {
  const foreign = options.foreign ?? modelMembers();
  const existing = options.existing ?? new Set<string>();
  const ownMembers = (options.ownMembers ?? []).map((m) => ({
    ...m,
    included: true,
  }));
  const created: { entity: string; data: any }[] = [];

  const em = {
    findOne: mockFn((entity: any) => {
      if (options.valueSet === false) return Promise.resolve(null);
      if (entity.name === 'ValueSets')
        return Promise.resolve({ id: VALUE_SET_ID });
      return Promise.resolve({ id: VERSION_ID, valueSetId: VALUE_SET_ID });
    }),
    find: mockFn((entity: any, where: any) => {
      if (entity.name === 'ValueSetMembers' && where.valueSetVersionId) {
        return Promise.resolve([
          ...foreign.map((m) => ({
            id: m.id,
            conceptId: m.conceptId,
            ordinal: m.ordinal,
            included: true,
          })),
          ...ownMembers,
        ]);
      }
      const ids: string[] = where?.id?.$in ?? [];
      if (entity.name === 'CatalogConcepts') {
        const byId = new Map(foreign.map((m) => [m.conceptId, m]));
        const hits = ids.filter((id) => byId.has(id));
        if (hits.length > 0) {
          return Promise.resolve(
            hits.map((id) => ({
              id,
              code: byId.get(id)!.code,
              display: byId.get(id)!.display,
            })),
          );
        }
      }
      return Promise.resolve(
        ids.filter((id) => existing.has(id)).map((id) => ({ id })),
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
  const service = new BoMedicalSpecialtiesSeedService(
    orm as any,
    logger as any,
  );
  return {
    service,
    created,
    ownMembers,
    logger,
    rowsOf: (entity: string) =>
      created.filter((r) => r.entity === entity).map((r) => r.data),
  };
}

describe('catálogo de especialidades ampliadas', () => {
  const modelCodes = new Set(MODEL.map((s) => s.code));
  const modelNames = new Set(
    MODEL.map((s) => normalizeSpecialtyName(s.display)),
  );
  const ownCodes = new Set(BO_MEDICAL_SPECIALTIES.map((s) => s.code));

  it('es amplio: más de cien especialidades nuevas, médicas y odontológicas', () => {
    expect(N).toBeGreaterThanOrEqual(100);
    expect(
      BO_MEDICAL_SPECIALTIES.filter((s) => s.discipline === 'ODONTOLOGICA')
        .length,
    ).toBeGreaterThanOrEqual(12);
  });

  it('no repite códigos ni nombres', () => {
    expect(ownCodes.size).toBe(N);
    const names = BO_MEDICAL_SPECIALTIES.map((s) =>
      normalizeSpecialtyName(s.display),
    );
    expect(new Set(names).size).toBe(N);
  });

  it('no repite ninguna especialidad del modelo, ni por código ni por nombre', () => {
    for (const s of BO_MEDICAL_SPECIALTIES) {
      expect(modelCodes.has(s.code)).toBe(false);
      expect(modelNames.has(normalizeSpecialtyName(s.display))).toBe(false);
    }
  });

  it('cada troncal existe en el modelo o en esta lista', () => {
    for (const s of BO_MEDICAL_SPECIALTIES) {
      if (!s.parentCode) continue;
      expect(modelCodes.has(s.parentCode) || ownCodes.has(s.parentCode)).toBe(
        true,
      );
    }
  });

  it('con el modelo, cubre toda la lista odontológica del stakeholder', () => {
    // El dataset es extracción del padrón del stakeholder y no se edita: lo
    // que se comprueba es que ninguna de sus especialidades quede sin concepto.
    const all = new Set([
      ...modelNames,
      ...BO_MEDICAL_SPECIALTIES.map((s) => normalizeSpecialtyName(s.display)),
    ]);
    for (const row of dentalDataset.datos) {
      const name = normalizeSpecialtyName(row.especialidad);
      const covered =
        all.has(name) ||
        // «ODONTOLOGIA GENERAL» es `ODONTOLOGIA` del modelo.
        name === 'odontologia general';
      expect({ name, covered }).toEqual({ name, covered: true });
    }
  });

  it('cubre las especialidades que el research marcó como huecos del modelo', () => {
    for (const code of [
      'NEUROCIRUGIA',
      'CIRUGIA_PLASTICA',
      'CIRUGIA_CARDIOVASCULAR',
      'CIRUGIA_TORACICA',
      'CIRUGIA_CABEZA_CUELLO',
      'MASTOLOGIA',
      'MEDICINA_NUCLEAR',
      'RADIOTERAPIA',
      'GENETICA_MEDICA',
      'HEPATOLOGIA',
      'ALERGOLOGIA',
      'AUDITORIA_MEDICA',
      'SALUD_PUBLICA',
      'RADIOLOGIA_ORAL',
    ]) {
      expect(ownCodes.has(code)).toBe(true);
    }
  });
});

describe('BoMedicalSpecialtiesSeedService', () => {
  it('sin el conjunto no escribe nada y avisa', async () => {
    const { service, created, logger } = build({ valueSet: false });

    const counters = await service.run();

    expect(created).toHaveLength(0);
    expect(counters.memberships).toBe(0);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('primera corrida: concepto, designación, propiedades y membresía de cada una', async () => {
    const { service, rowsOf } = build();

    const counters = await service.run();

    const withParent = BO_MEDICAL_SPECIALTIES.filter((s) => s.parentCode);
    expect(counters).toEqual({
      concepts: N,
      designations: N,
      properties: N + withParent.length,
      memberships: N,
      reordered: 0,
      shadowed: 0,
    });

    const concept = rowsOf('CatalogConcepts').find(
      (c) => c.id === boSpecialtyConceptId('NEUROCIRUGIA'),
    );
    expect(concept).toMatchObject({
      code: boSpecialtyConceptCode('NEUROCIRUGIA'),
      display: 'Neurocirugía',
      selectable: true,
    });
    expect(
      rowsOf('ConceptDesignations').some(
        (d) => d.id === boSpecialtyDesignationId('NEUROCIRUGIA'),
      ),
    ).toBe(true);
    expect(
      rowsOf('ConceptProperties').find(
        (p) =>
          p.id ===
          boSpecialtyPropertyId(
            'HEPATOLOGIA',
            BO_SPECIALTY_PARENT_PROPERTY_CODE,
          ),
      ),
    ).toMatchObject({ valueJson: 'GASTROENTEROLOGIA' });
    expect(
      rowsOf('ConceptProperties').find(
        (p) =>
          p.id ===
          boSpecialtyPropertyId(
            'ORTOPEDIA_MAXILAR',
            BO_SPECIALTY_DISCIPLINE_PROPERTY_CODE,
          ),
      ),
    ).toMatchObject({ valueJson: 'ODONTOLOGICA' });
  });

  it('suma detrás de las del modelo, en orden alfabético, sin tocar las del modelo', async () => {
    const { service, rowsOf } = build();

    await service.run();

    const members = rowsOf('ValueSetMembers');
    // Ninguna membresía nueva es del modelo: sólo se crean las propias.
    expect(members.every((m) => m.valueSetVersionId === VERSION_ID)).toBe(true);
    const ordinals = members.map((m) => m.ordinal);
    expect(ordinals).toEqual(
      Array.from({ length: N }, (_, i) => MODEL.length + i),
    );
    const displays = members.map(
      (m) =>
        BO_MEDICAL_SPECIALTIES.find(
          (s) => boSpecialtyConceptId(s.code) === m.conceptId,
        )!.display,
    );
    expect(displays).toEqual(
      [...displays].sort((a, b) => a.localeCompare(b, 'es')),
    );
  });

  it('segunda corrida: no escribe nada', async () => {
    const existing = new Set<string>();
    for (const s of BO_MEDICAL_SPECIALTIES) {
      existing.add(boSpecialtyConceptId(s.code));
      existing.add(boSpecialtyDesignationId(s.code));
      existing.add(
        boSpecialtyPropertyId(s.code, BO_SPECIALTY_DISCIPLINE_PROPERTY_CODE),
      );
      if (s.parentCode)
        existing.add(
          boSpecialtyPropertyId(s.code, BO_SPECIALTY_PARENT_PROPERTY_CODE),
        );
    }
    const sorted = [...BO_MEDICAL_SPECIALTIES].sort((a, b) =>
      a.display.localeCompare(b.display, 'es'),
    );
    const ownMembers = sorted.map((s, i) => ({
      id: boSpecialtyMemberId(VERSION_ID, s.code),
      conceptId: boSpecialtyConceptId(s.code),
      ordinal: MODEL.length + i,
    }));

    const { service, created } = build({ existing, ownMembers });
    const counters = await service.run();

    expect(created).toHaveLength(0);
    expect(counters).toMatchObject({
      concepts: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
      reordered: 0,
    });
  });

  it('al ampliar la lista realinea el ordinal de las propias ya sembradas', async () => {
    const neuro = {
      id: boSpecialtyMemberId(VERSION_ID, 'NEUROCIRUGIA'),
      conceptId: boSpecialtyConceptId('NEUROCIRUGIA'),
      // La posición que tenía con una lista más corta.
      ordinal: MODEL.length + 3,
    };
    const { service, ownMembers } = build({ ownMembers: [neuro] });

    const counters = await service.run();

    const sorted = [...BO_MEDICAL_SPECIALTIES].sort((a, b) =>
      a.display.localeCompare(b.display, 'es'),
    );
    const expected =
      MODEL.length + sorted.findIndex((s) => s.code === 'NEUROCIRUGIA');
    expect(ownMembers[0].ordinal).toBe(expected);
    expect(counters.reordered).toBe(1);
    expect(counters.memberships).toBe(N - 1);
  });

  it('no suma lo que el conjunto ya trae por otra vía (mismo código o mismo nombre)', async () => {
    const foreign = [
      ...modelMembers(),
      // El modelo suma Neurocirugía con su código.
      {
        id: 'model-member-NEUROCIRUGIA',
        conceptId: 'model-neurocirugia',
        ordinal: MODEL.length,
        code: 'NEUROCIRUGIA',
        display: 'Neurocirugía',
      },
      // Y Mastología con otro código pero el mismo nombre.
      {
        id: 'model-member-MAMA',
        conceptId: 'model-mama',
        ordinal: MODEL.length + 1,
        code: 'MAMA',
        display: 'MASTOLOGÍA',
      },
    ];
    const { service, rowsOf } = build({ foreign });

    const counters = await service.run();

    expect(counters.shadowed).toBe(2);
    expect(counters.memberships).toBe(N - 2);
    const memberConcepts = rowsOf('ValueSetMembers').map((m) => m.conceptId);
    expect(memberConcepts).not.toContain(boSpecialtyConceptId('NEUROCIRUGIA'));
    expect(memberConcepts).not.toContain(boSpecialtyConceptId('MASTOLOGIA'));
    // Detrás del último miembro ajeno.
    expect(Math.min(...rowsOf('ValueSetMembers').map((m) => m.ordinal))).toBe(
      MODEL.length + 2,
    );
  });

  it('reconoce el código del suplente de formularios (`clinical-forms:specialty:X`)', async () => {
    const foreign = [
      {
        id: 'cf-member',
        conceptId: 'cf-hepato',
        ordinal: 0,
        code: 'clinical-forms:specialty:HEPATOLOGIA',
        display: 'Hígado',
      },
    ];
    const { service, rowsOf } = build({ foreign });

    await service.run();

    expect(rowsOf('ValueSetMembers').map((m) => m.conceptId)).not.toContain(
      boSpecialtyConceptId('HEPATOLOGIA'),
    );
  });
});
