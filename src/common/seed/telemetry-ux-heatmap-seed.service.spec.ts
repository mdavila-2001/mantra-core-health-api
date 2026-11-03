import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import {
  ANONYMOUS_PAGE_VIEW_PROPERTY_SCHEMA,
  TelemetryUxHeatmapSeedService,
  UX_INTERACTION_PROPERTY_SCHEMA,
} from './telemetry-ux-heatmap-seed.service';
import { TELE } from '../../modules/telemetry/telemetry.concepts';
import {
  EventPropertyRejection,
  validateEventProperties,
  type RawEventProperty,
} from '../../modules/telemetry/domain/event-property-policy';
import { CONCEPTS, SEED } from '../constants/concepts';

/**
 * Construye el sistema bajo prueba con un `EntityManager` doblado y con
 * estado: lo que `create` registra lo encuentra después `findOne`, como haría
 * la base. Así una segunda corrida sobre el mismo doble prueba la idempotencia
 * de verdad y no sólo con ids puestos a mano.
 *
 * @param existing - Filas que la base ya tiene antes de la primera corrida.
 * @param takenCodes - Códigos de propósito que ya existen con otro id.
 * @returns El servicio y lo que el doble registró.
 */
function build(
  existing: Record<string, unknown>[] = [],
  takenCodes: string[] = [],
) {
  const store = new Map<string, Record<string, unknown>>(
    existing.map((row) => [row.id as string, row]),
  );
  const created: { entidad: string; datos: Record<string, unknown> }[] = [];
  const em = {
    findOne: fn(
      async (
        _entity: unknown,
        where: { id?: string; purposeCode?: string },
      ) => {
        if (where.purposeCode !== undefined) {
          return takenCodes.includes(where.purposeCode)
            ? { id: 'otro-id' }
            : null;
        }
        return store.get(where.id!) ?? null;
      },
    ),
    create: fn((entity: { name: string }, data: Record<string, unknown>) => {
      created.push({ entidad: entity.name, datos: data });
      store.set(data.id as string, data);
      return data;
    }),
    flush: fn(async () => undefined),
  };
  const orm = { em: { fork: () => em } };
  const logger = { setContext: fn(), info: fn(), warn: fn() };
  const service = new TelemetryUxHeatmapSeedService(
    orm as never,
    logger as never,
  );
  return { service, created, logger, store };
}

const byId = (
  created: { datos: Record<string, unknown> }[],
  id: string,
): Record<string, unknown> | undefined =>
  created.find((c) => c.datos.id === id)?.datos;

describe('TelemetryUxHeatmapSeedService', () => {
  it('siembra los dos propósitos y los dos esquemas nuevos con ids deterministas', async () => {
    const { service, created } = build();

    const counters = await service.run();

    expect(counters).toEqual({ purposes: 2, schemas: 2, deprecated: 0 });
    expect(created.map((c) => c.datos.id)).toEqual([
      SEED.uxHeatmapPurposeId,
      SEED.uxHeatmapEventSchemaV2Id,
      SEED.platformUsageAggregatePurposeId,
      SEED.pageViewAnonymousEventSchemaId,
    ]);
    expect(byId(created, SEED.uxHeatmapEventSchemaV2Id)).toMatchObject({
      eventName: 'ux_interaccion',
      schemaVersion: 2,
      purposeDefinitionId: SEED.uxHeatmapPurposeId,
      portalTypeConceptId: TELE.PORTAL_WEB,
      phiAllowed: false,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      propertySchemaJson: UX_INTERACTION_PROPERTY_SCHEMA,
    });
  });

  it('el propósito de mapas de calor exige consentimiento y no fija retención', async () => {
    // Cuántos días se guardan las interacciones es una decisión de privacidad
    // pendiente: sembrar un número la daría por tomada.
    const { service, created } = build();

    await service.run();

    const purpose = byId(created, SEED.uxHeatmapPurposeId)!;
    expect(purpose).toMatchObject({
      legalBasisConceptId: TELE.LEGAL_BASIS_CONSENT,
      requiresConsent: true,
      permitsMarketingUse: false,
      permitsCrossTenantAggregation: false,
    });
    expect(purpose).not.toHaveProperty('defaultRetentionDays');
  });

  it('el uso agregado no exige consentimiento, retiene 90 días y no admite propiedades', async () => {
    const { service, created } = build();

    await service.run();

    expect(byId(created, SEED.platformUsageAggregatePurposeId)).toMatchObject({
      purposeCode: 'PLATFORM_USAGE_AGGREGATE',
      legalBasisConceptId: TELE.LEGAL_BASIS_LEGITIMATE_INTEREST,
      requiresConsent: false,
      permitsMarketingUse: false,
      permitsCrossTenantAggregation: true,
      defaultRetentionDays: 90,
    });
    expect(byId(created, SEED.pageViewAnonymousEventSchemaId)).toMatchObject({
      eventName: 'pagina_vista_anonima',
      schemaVersion: 1,
      purposeDefinitionId: SEED.platformUsageAggregatePurposeId,
      phiAllowed: false,
      propertySchemaJson: ANONYMOUS_PAGE_VIEW_PROPERTY_SCHEMA,
    });
  });

  it('deprecia la v1 de ux_interaccion una sola vez', async () => {
    const v1 = {
      id: SEED.uxHeatmapEventSchemaId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    };
    const { service } = build([v1]);

    expect(await service.run()).toEqual({
      purposes: 2,
      schemas: 2,
      deprecated: 1,
    });
    expect(v1.statusConceptId).toBe(TELE.SCHEMA_DEPRECATED);
    expect((v1 as { effectiveTo?: Date }).effectiveTo).toBeInstanceOf(Date);
  });

  it('una segunda corrida sobre la misma base no inserta ni cambia nada', async () => {
    const v1 = {
      id: SEED.uxHeatmapEventSchemaId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    };
    const { service, created } = build([v1]);

    await service.run();
    const afterFirst = created.length;
    const second = await service.run();

    expect(second).toEqual({ purposes: 0, schemas: 0, deprecated: 0 });
    expect(created).toHaveLength(afterFirst);
  });

  it('con todo ya sembrado no inserta nada', async () => {
    const { service, created } = build([
      { id: SEED.uxHeatmapPurposeId },
      { id: SEED.uxHeatmapEventSchemaV2Id },
      { id: SEED.platformUsageAggregatePurposeId },
      { id: SEED.pageViewAnonymousEventSchemaId },
      {
        id: SEED.uxHeatmapEventSchemaId,
        statusConceptId: TELE.SCHEMA_DEPRECATED,
      },
    ]);

    expect(await service.run()).toEqual({
      purposes: 0,
      schemas: 0,
      deprecated: 0,
    });
    expect(created).toHaveLength(0);
  });

  it('con el código de mapas de calor ya tomado no siembra lo que cuelga de él ni toca la v1', async () => {
    const v1 = {
      id: SEED.uxHeatmapEventSchemaId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    };
    const { service, created, logger } = build([v1], ['PORTAL_UX_HEATMAP']);

    const counters = await service.run();

    // El uso agregado es independiente y se siembra igual.
    expect(counters).toEqual({ purposes: 1, schemas: 1, deprecated: 0 });
    expect(byId(created, SEED.uxHeatmapEventSchemaV2Id)).toBeUndefined();
    expect(v1.statusConceptId).toBe(CONCEPTS.STATE_ACTIVE);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('con ambos códigos tomados no siembra ni duplica', async () => {
    const { service, created, logger } = build(
      [],
      ['PORTAL_UX_HEATMAP', 'PLATFORM_USAGE_AGGREGATE'],
    );

    expect(await service.run()).toEqual({
      purposes: 0,
      schemas: 0,
      deprecated: 0,
    });
    expect(created).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it('los ids no cambian entre versiones del código', () => {
    // El frontend los usa como valor por defecto: cambiarlos rompería la
    // captura de todos los despliegues sin aviso.
    expect(SEED.uxHeatmapPurposeId).toBe(
      '9889b3b6-4293-5266-bba2-b27fa26bec2e',
    );
    expect(SEED.uxHeatmapEventSchemaId).toBe(
      '70768433-6a5e-562f-a03b-c59b34e65bbd',
    );
    expect(SEED.uxHeatmapEventSchemaV2Id).toBe(
      '5c1d901c-94da-5c97-b115-e89e303c2c20',
    );
    expect(SEED.platformUsageAggregatePurposeId).toBe(
      'd4bc62cd-9826-5f2b-a239-9d1c95f0dd54',
    );
    expect(SEED.pageViewAnonymousEventSchemaId).toBe(
      'df630ae0-3bf4-567d-97f3-5b75ea77bc94',
    );
  });
});

/**
 * El esquema sembrado se prueba contra la política real del servidor: cada
 * propiedad que emite el SDK (`ux-events.ts` del front) tiene que pasar, y lo
 * que no está declarado o excede el rango tiene que rechazarse.
 */
describe('esquema ux_interaccion v2 frente a la política de propiedades', () => {
  const schema = {
    eventName: 'ux_interaccion',
    propertySchemaJson: UX_INTERACTION_PROPERTY_SCHEMA,
    phiAllowed: false,
  };
  const n = (propertyName: string, valueNumber: number): RawEventProperty => ({
    propertyName,
    valueType: 'NUMBER',
    valueNumber,
  });
  const s = (propertyName: string, valueString: string): RawEventProperty => ({
    propertyName,
    valueType: 'STRING',
    valueString,
  });
  const b = (
    propertyName: string,
    valueBoolean: boolean,
  ): RawEventProperty => ({
    propertyName,
    valueType: 'BOOLEAN',
    valueBoolean,
  });
  const rule = (properties: RawEventProperty[]): string | undefined => {
    try {
      validateEventProperties(schema, properties);
    } catch (error) {
      if (error instanceof EventPropertyRejection) return error.rule;
      throw error;
    }
    return undefined;
  };

  it('válido: un clic completo con todas las propiedades del SDK y las del mapa de calor', () => {
    const clic: RawEventProperty[] = [
      n('ancho_vp', 1440),
      n('alto_vp', 900),
      n('alto_doc_px', 2300),
      s('tamano_pantalla', 'escritorio'),
      s('objetivo', 'button[data-testid=agenda-guardar]'),
      s('data_part', 'tarjeta-agenda'),
      b('es_interactivo', true),
      b('es_teclado', false),
      b('es_clic_repetido', false),
      b('es_clic_muerto', true),
      n('x_doc', 0.4132),
      n('y_doc_px', 812),
      n('x_vp', 0.4132),
      n('y_vp', 0.9),
      n('objetivo_x', 0.5),
      n('objetivo_y', 0.42),
      s('pestana', '0b6f3f0e-7d63-4c0d-9a54-0e0a3a2a9f10'),
    ];

    expect(validateEventProperties(schema, clic)).toHaveLength(clic.length);
  });

  it('válido: abandono, ruta anterior y foco de campo', () => {
    expect(
      rule([
        n('profundidad_max', 0.75),
        n('ms_en_pagina', 31_000),
        n('clics', 4),
        s('ruta_anterior', '/pacientes/:id'),
        s('tipo_campo', 'text'),
      ]),
    ).toBeUndefined();
  });

  it('límite: los extremos de cada rango entran', () => {
    expect(
      rule([
        n('x_doc', 0),
        n('x_vp', 1),
        n('ancho_vp', 20_000),
        n('alto_doc_px', 1_000_000),
        s('pestana', 'x'.repeat(36)),
      ]),
    ).toBeUndefined();
  });

  it.each([
    ['coordenada fuera de 0-1', [n('x_doc', 1.0001)], 'VALUE_OUT_OF_RANGE'],
    ['coordenada negativa', [n('y_vp', -0.1)], 'VALUE_OUT_OF_RANGE'],
    ['entero con decimales', [n('ancho_vp', 1440.5)], 'TYPE_MISMATCH'],
    ['viewport enorme', [n('ancho_vp', 20_001)], 'VALUE_OUT_OF_RANGE'],
    [
      'tamaño de pantalla fuera del enum',
      [s('tamano_pantalla', 'reloj')],
      'VALUE_OUT_OF_RANGE',
    ],
    ['booleano como texto', [s('es_clic_muerto', 'si')], 'TYPE_MISMATCH'],
    ['propiedad no declarada', [s('user_agent', 'x')], 'NOT_DECLARED'],
    ['correo en el selector', [s('objetivo', 'a@b.co')], 'PROHIBITED_VALUE'],
    [
      'documento en el selector',
      [s('objetivo', 'fila-12345678')],
      'PROHIBITED_VALUE',
    ],
    [
      'pestaña demasiado larga',
      [s('pestana', 'x'.repeat(37))],
      'VALUE_OUT_OF_RANGE',
    ],
    ['propiedad repetida', [n('clics', 1), n('clics', 2)], 'DUPLICATE'],
  ] as const)('inválido: %s', (_name, properties, expected) => {
    expect(rule([...properties])).toBe(expected);
  });

  it('el esquema anónimo no admite ninguna propiedad', () => {
    expect(() =>
      validateEventProperties(
        {
          eventName: 'pagina_vista_anonima',
          propertySchemaJson: ANONYMOUS_PAGE_VIEW_PROPERTY_SCHEMA,
          phiAllowed: false,
        },
        [s('objetivo', 'a')],
      ),
    ).toThrow(EventPropertyRejection);
  });
});
