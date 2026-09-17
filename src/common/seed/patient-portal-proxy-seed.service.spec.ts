import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { PatientPortalProxySeedService } from './patient-portal-proxy-seed.service';
import { CONS } from '../../modules/consent/consent.concepts';
import { SEED } from '../constants/concepts';

/**
 * Construye el sistema bajo prueba con un `EntityManager` doblado.
 *
 * @param existentes - Ids que la base ya tiene; el resto se considera ausente.
 * @returns El servicio y lo que el doble registró.
 */
function build(existentes: string[] = []) {
  const yaEstan = new Set(existentes);
  const creados: { entidad: string; datos: Record<string, unknown> }[] = [];
  const em = {
    findOne: fn(async (_entidad: unknown, where: { id: string }) =>
      yaEstan.has(where.id) ? { id: where.id } : null,
    ),
    create: fn((entidad: { name: string }, datos: Record<string, unknown>) => {
      creados.push({ entidad: entidad.name, datos });
      return datos;
    }),
    flush: fn(async () => undefined),
  };
  const orm = { em: { fork: () => em } };
  const logger = { setContext: fn(), info: fn(), warn: fn() };
  const service = new PatientPortalProxySeedService(
    orm as never,
    logger as never,
  );
  return { service, creados, em };
}

describe('PatientPortalProxySeedService', () => {
  it('siembra el conjunto, su versión vigente y la base legal', async () => {
    const { service, creados } = build();

    const contadores = await service.run();

    expect(contadores).toEqual({ valueSets: 1, versions: 1, legalBases: 1 });
    expect(creados.map((c) => c.entidad)).toEqual([
      'ValueSets',
      'ValueSetVersions',
      'ProcessingLegalBases',
    ]);
  });

  it('la versión queda marcada vigente', async () => {
    // Sin `isDefault` la expansión del conjunto responde 404 aunque exista.
    const { service, creados } = build();

    await service.run();

    const version = creados.find((c) => c.entidad === 'ValueSetVersions')!;
    expect(version.datos).toMatchObject({
      id: SEED.patientPortalProxyScopeVersionId,
      valueSetId: SEED.patientPortalProxyScopeValueSetId,
      isDefault: true,
    });
  });

  it('la base legal es representación legal, nunca consentimiento', async () => {
    // Un menor de tres años no consiente que su madre vea sus estudios.
    // Anotarlo como consentimiento sería dejar una afirmación falsa en la base.
    const { service, creados } = build();

    await service.run();

    const base = creados.find((c) => c.entidad === 'ProcessingLegalBases')!;
    expect(base.datos).toMatchObject({
      id: SEED.guardianProxyLegalBasisId,
      tenantId: SEED.tenantId,
      processingPurposeId: SEED.processingPurposeId,
      jurisdictionConceptId: CONS.JURISDICTION_BO,
      generalLegalBasisConceptId: CONS.LEGAL_BASIS_LEGAL_REPRESENTATION,
      statusConceptId: CONS.LEGAL_BASIS_ACTIVE,
    });
    expect(base.datos['generalLegalBasisConceptId']).not.toBe(
      CONS.LEGAL_BASIS_CONSENT,
    );
  });

  it('el conjunto va sin miembros: el alcance no está decidido', async () => {
    const { service, creados } = build();

    await service.run();

    expect(creados.some((c) => c.entidad === 'ValueSetMembers')).toBe(false);
  });

  it('una segunda corrida no inserta nada', async () => {
    const { service, creados } = build([
      SEED.patientPortalProxyScopeValueSetId,
      SEED.patientPortalProxyScopeVersionId,
      SEED.guardianProxyLegalBasisId,
    ]);

    const contadores = await service.run();

    expect(contadores).toEqual({ valueSets: 0, versions: 0, legalBases: 0 });
    expect(creados).toEqual([]);
  });

  it('completa sólo lo que falta si una corrida anterior quedó a medias', async () => {
    const { service, creados } = build([
      SEED.patientPortalProxyScopeValueSetId,
    ]);

    const contadores = await service.run();

    expect(contadores).toEqual({ valueSets: 0, versions: 1, legalBases: 1 });
    expect(creados.map((c) => c.entidad)).toEqual([
      'ValueSetVersions',
      'ProcessingLegalBases',
    ]);
  });
});
