import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { TelemetryUxHeatmapSeedService } from './telemetry-ux-heatmap-seed.service';
import { TELE } from '../../modules/telemetry/telemetry.concepts';
import { SEED } from '../constants/concepts';

/**
 * Construye el sistema bajo prueba con un `EntityManager` doblado.
 *
 * @param existing - Ids que la base ya tiene; el resto se considera ausente.
 * @param takenCode - Si el código del propósito ya existe con otro id.
 * @returns El servicio y lo que el doble registró.
 */
function build(existing: string[] = [], takenCode = false) {
  const alreadyPresent = new Set(existing);
  const created: { entidad: string; datos: Record<string, unknown> }[] = [];
  const em = {
    findOne: fn(
      async (entity: unknown, where: { id?: string; purposeCode?: string }) => {
        if (where.purposeCode !== undefined) {
          return takenCode ? { id: 'otro-id' } : null;
        }
        return alreadyPresent.has(where.id!) ? { id: where.id } : null;
      },
    ),
    create: fn((entity: { name: string }, data: Record<string, unknown>) => {
      created.push({ entidad: entity.name, datos: data });
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
  return { service, created, logger };
}

describe('TelemetryUxHeatmapSeedService', () => {
  it('siembra el propósito y su esquema con los ids deterministas', async () => {
    const { service, created } = build();

    const counters = await service.run();

    expect(counters).toEqual({ purposes: 1, schemas: 1 });
    expect(created.map((c) => c.entidad)).toEqual([
      'TrackingPurposeDefinitions',
      'ActivityEventSchemaDefinitions',
    ]);
    expect(created[1]!.datos).toMatchObject({
      id: SEED.uxHeatmapEventSchemaId,
      purposeDefinitionId: SEED.uxHeatmapPurposeId,
      portalTypeConceptId: TELE.PORTAL_WEB,
      phiAllowed: false,
    });
  });

  it('el propósito exige consentimiento y no fija retención', async () => {
    // Cuántos días se guardan las interacciones es una decisión de privacidad
    // pendiente: sembrar un número la daría por tomada.
    const { service, created } = build();

    await service.run();

    const purpose = created[0]!.datos;
    expect(purpose).toMatchObject({
      id: SEED.uxHeatmapPurposeId,
      legalBasisConceptId: TELE.LEGAL_BASIS_CONSENT,
      requiresConsent: true,
      permitsMarketingUse: false,
    });
    expect(purpose).not.toHaveProperty('defaultRetentionDays');
  });

  it('una segunda corrida no inserta nada', async () => {
    const { service, created } = build([
      SEED.uxHeatmapPurposeId,
      SEED.uxHeatmapEventSchemaId,
    ]);

    expect(await service.run()).toEqual({ purposes: 0, schemas: 0 });
    expect(created).toHaveLength(0);
  });

  it('con el código ya tomado por otro id no siembra ni duplica', async () => {
    const { service, created, logger } = build([], true);

    expect(await service.run()).toEqual({ purposes: 0, schemas: 0 });
    expect(created).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalled();
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
  });
});
