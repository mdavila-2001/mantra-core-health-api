import { randomUUID } from 'node:crypto';
import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { PreconditionFailedException } from '../../src/common';
import { StudyDetailReason } from '../../src/modules/clinical/clinical.error-reasons';
import { ServiceRequests } from '../../src/modules/clinical/entities';
import { ServiceRequestsRepository } from '../../src/modules/clinical/repositories/service-requests.repository';
import {
  assertSpecimenImagingExclusive,
  assertStructureFields,
  flatImagingOf,
  imagingViewOf,
} from '../../src/modules/clinical/service-request-imaging';

/**
 * Región marcada en el modelo 3D y tipo de hueso de la orden (modelo v4.2.94),
 * contra Postgres real: la columna se escribe, se relee en otro contexto y la
 * base rechaza lo que la API ya rechaza con 422 (si no, el cliente vería un 500).
 *
 * Real: Postgres con `clinical.service_requests` del modelo v4.2.94 (sus CHECK),
 * el ORM, la entidad y el repositorio. Sin HTTP ni autenticación (eso lo cubren
 * los unitarios del controlador y las suites con la aplicación completa). Las FK
 * entre esquemas (`90_fk_deferred`) no se aplican: la prueba usa ids sintéticos.
 */
describe('Orden de estudio · región 3D y tipo de hueso (integración, Postgres real)', () => {
  let orm: MikroORM;
  const repo = new ServiceRequestsRepository();
  const tenant = randomUUID();
  const concept = () => randomUUID();
  const sitio = concept();
  const hueso = concept();

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: PostgreSqlDriver,
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5433),
      user: process.env.DB_USER ?? 'mantra',
      password: process.env.DB_PASSWORD,
      dbName: process.env.DB_NAME ?? 'mantra_redesa_health',
      entities: [ServiceRequests],
      metadataProvider: TsMorphMetadataProvider,
      discovery: { warnWhenNoEntities: false },
    });
  });

  afterAll(async () => {
    await orm?.em
      .fork()
      .nativeDelete(ServiceRequests, { custodianTenantId: tenant });
    await orm?.close();
  });

  /** Inserta una orden con lo dado y la relee con un contexto nuevo. */
  async function persist(
    extra: Record<string, unknown>,
  ): Promise<ServiceRequests> {
    const em = orm.em.fork();
    const created = repo.create(em, {
      custodianTenantId: tenant,
      patientProfileId: concept(),
      codeConceptId: concept(),
      statusConceptId: concept(),
      ...extra,
    });
    await em.flush();
    return orm.em.fork().findOneOrFail(ServiceRequests, { id: created.id });
  }

  const region = {
    bodySiteConceptId: sitio,
    bodyStructureUberon: 'UBERON:0002398',
    bodyMeshId: 'BP44',
    boneTypeConceptId: hueso,
  };

  it('correcto: estructura, malla y tipo de hueso se persisten y vuelven al releer', async () => {
    const stored = await persist(region);
    expect(stored).toMatchObject(region);
    const view = imagingViewOf(stored, (id) =>
      id ? `n-${id.slice(0, 4)}` : null,
    );
    expect(view).toMatchObject({
      bodyStructureUberon: 'UBERON:0002398',
      bodyMeshId: 'BP44',
      boneTypeConceptId: hueso,
      boneTypeDisplay: `n-${hueso.slice(0, 4)}`,
    });
    expect(flatImagingOf(view)).toMatchObject({
      bodyStructureUberon: 'UBERON:0002398',
      bodyMeshId: 'BP44',
      bodySiteConceptId: sitio,
    });
  });

  it('límite: 64 caracteres caben en la malla; sólo estructura UBERON, sin hueso, también', async () => {
    const largo = 'a'.repeat(64);
    expect((await persist({ bodyMeshId: largo })).bodyMeshId).toBe(largo);
    const sola = await persist({ bodyStructureUberon: 'UBERON:1' });
    expect(sola.boneTypeConceptId ?? null).toBeNull();
  });

  it('compatibilidad: una orden sin los campos nuevos se relee igual y no tiene detalle de imagen', async () => {
    const vieja = await persist({});
    expect(vieja.bodyStructureUberon ?? null).toBeNull();
    expect(vieja.bodyMeshId ?? null).toBeNull();
    expect(vieja.boneTypeConceptId ?? null).toBeNull();
    expect(imagingViewOf(vieja, () => null)).toBeNull();
  });

  describe('la base y la API rechazan lo mismo (la API, antes y con 422)', () => {
    async function dbRejects(
      extra: Record<string, unknown>,
      constraint: string,
    ): Promise<void> {
      await expect(persist(extra)).rejects.toMatchObject({
        code: '23514',
        constraint,
      });
    }

    it('tipo de hueso sin región ni estructura UBERON', async () => {
      await dbRejects(
        { boneTypeConceptId: hueso, bodyMeshId: 'BP44' },
        'ck_service_requests_bone_type_requires_location',
      );
      await expect(
        assertStructureFields(
          { boneTypeConceptId: hueso, bodyMeshId: 'BP44' },
          async () => true,
        ),
      ).rejects.toMatchObject({
        details: {
          reason: StudyDetailReason.BONE_TYPE_REQUIRES_BODY_STRUCTURE,
        },
      });
    });

    it('muestra de laboratorio junto con estructura, malla o hueso', async () => {
      for (const campos of [
        { bodyStructureUberon: 'UBERON:1' },
        { bodyMeshId: 'BP44' },
        { boneTypeConceptId: hueso, bodySiteConceptId: sitio },
      ]) {
        await dbRejects(
          { specimenTypeConceptId: concept(), ...campos },
          'ck_service_requests_specimen_xor_imaging',
        );
        expect(() => assertSpecimenImagingExclusive('muestra', campos)).toThrow(
          PreconditionFailedException,
        );
      }
    });

    it('lateralidad sin región (con sólo la estructura UBERON)', async () => {
      await dbRejects(
        { lateralityConceptId: concept(), bodyStructureUberon: 'UBERON:1' },
        'ck_service_requests_laterality_requires_site',
      );
    });
  });
});
