import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import {
  markAudioAssetReady,
  releaseAudioGenerationBudget,
  reserveAudioGenerationBudget,
} from '../../src/modules/audio_assets/repositories/audio-assets.repository.queries';

/**
 * Contabilidad del presupuesto de audio contra la base real.
 *
 * Estas tres garantías viven **enteras** en SQL —reserva atómica, liquidación en
 * su ventana y devolución exactamente-una-vez—, así que una prueba con dobles no
 * demostraría nada: comprobaría que mis mocks hacen lo que yo escribí en ellos.
 * Aquí se ejecutan las funciones reales del repositorio contra PostgreSQL.
 *
 * Lo que se está protegiendo, en concreto:
 *
 *   1. `estimated_credits` sólo crecía. Un asset que fallaba de forma permanente
 *      dejaba apartado para siempre el crédito que estimó consumir, así que una
 *      racha de fallos del proveedor agotaba el presupuesto del mes **sin haber
 *      generado un solo audio** y todo degradaba a fallback sin explicación.
 *   2. La liquidación usaba el mes del reloj y la reserva el de su momento: un
 *      asset reservado el día 31 y generado el 1 imputaba su consumo a una ventana
 *      sin fila de reserva —el UPDATE no afectaba nada, el consumo se perdía y el
 *      mes anterior se quedaba con crédito apartado—.
 */
describe('Contabilidad del presupuesto de audio (DB real)', () => {
  let orm: MikroORM;
  /**
   * `EntityManager` bifurcado: las funciones del repositorio hacen `findOne`, y
   * MikroORM prohíbe usar el contexto global para eso. En producción reciben el
   * de la petición; aquí, uno propio de la prueba.
   */
  let em: MikroORM['em'];
  const provider = `test-${randomUUID().slice(0, 8)}`;
  const periodKey = '2099-01';
  const createdAssetIds: string[] = [];

  beforeAll(async () => {
    orm = await MikroORM.init({
      ...buildOrmConfig(),
      discovery: { warnWhenNoEntities: false },
    });
    em = orm.em.fork();
  });

  afterAll(async () => {
    // El proveedor es único por corrida, así que basta con retirar lo insertado.
    const connection = orm.em.getConnection();
    if (createdAssetIds.length > 0) {
      const placeholders = createdAssetIds.map(() => '?').join(', ');
      // Los eventos primero: referencian el asset por `asset_key` y quedarían
      // huérfanos en la base de desarrollo si la limpieza sólo borrara assets.
      await connection.execute(
        `delete from audio_assets.audio_generation_events where template_key = 'test.template'`,
        [],
        'run',
      );
      await connection.execute(
        `delete from audio_assets.audio_assets where id in (${placeholders})`,
        createdAssetIds,
        'run',
      );
    }
    await connection.execute(
      `delete from audio_assets.audio_generation_usage where provider = ?`,
      [provider],
      'run',
    );
    await orm.close(true);
  });

  /** Inserta un asset mínimo en PENDING, sin pasar por el resolutor. */
  async function givenPendingAsset(): Promise<string> {
    const id = randomUUID();
    await em.getConnection().execute(
      `insert into audio_assets.audio_assets (
         id, asset_key, template_key, template_version, strategy, language,
         display_value_encrypted, rendered_text_hash, provider, provider_model,
         voice_profile, voice_version, normalizer_version, audio_format,
         generation_status, use_count, metadata, created_at, updated_at
       ) values (?, ?, 'test.template', 1, 'STATIC', 'es-419', 'enc', ?, ?, 'm', 'brand_es_latam_v1',
                 1, 1, 'mp3_44100_128', 'PENDING', 0, '{}'::jsonb, now(), now())`,
      [
        id,
        randomUUID().replace(/-/gu, ''),
        randomUUID().replace(/-/gu, ''),
        provider,
      ],
      'run',
    );
    createdAssetIds.push(id);
    return id;
  }

  async function usage(): Promise<{
    estimated: number;
    consumed: number;
    failures: number;
  }> {
    const rows = await em.getConnection().execute<
      Array<{
        estimated_credits: number;
        consumed_credits: number;
        failure_count: number;
      }>
    >(
      `select estimated_credits, consumed_credits, failure_count
         from audio_assets.audio_generation_usage where period_key=? and provider=?`,
      [periodKey, provider],
      'all',
    );
    const row = rows[0];
    return {
      estimated: Number(row?.estimated_credits ?? 0),
      consumed: Number(row?.consumed_credits ?? 0),
      failures: Number(row?.failure_count ?? 0),
    };
  }

  async function assetRow(assetId: string): Promise<{
    reserved: number | null;
    period: string | null;
    status: string;
  }> {
    const rows = await em.getConnection().execute<
      Array<{
        budget_reserved_units: number | null;
        budget_period_key: string | null;
        generation_status: string;
      }>
    >(
      `select budget_reserved_units, budget_period_key, generation_status
         from audio_assets.audio_assets where id=?`,
      [assetId],
      'all',
    );
    return {
      reserved: rows[0]?.budget_reserved_units ?? null,
      period: rows[0]?.budget_period_key ?? null,
      status: rows[0]?.generation_status ?? 'UNKNOWN',
    };
  }

  it('la reserva aparta crédito y recuerda su ventana', async () => {
    const assetId = await givenPendingAsset();

    const reserved = await reserveAudioGenerationBudget(
      em,
      assetId,
      periodKey,
      provider,
      40,
      1000,
    );

    expect(reserved).toBe(true);
    expect(await usage()).toMatchObject({ estimated: 40, consumed: 0 });
    // La ventana persistida es lo que permite liquidar y devolver en el mes correcto.
    expect(await assetRow(assetId)).toMatchObject({
      reserved: 40,
      period: periodKey,
      status: 'GENERATING',
    });
  });

  it('rechaza la reserva que no cabe en el presupuesto utilizable', async () => {
    const assetId = await givenPendingAsset();
    const before = await usage();

    // El límite se compara contra lo ya estimado: 40 apartados + 1000 no caben en 1000.
    const reserved = await reserveAudioGenerationBudget(
      em,
      assetId,
      periodKey,
      provider,
      1000,
      1000,
    );

    expect(reserved).toBe(false);
    expect((await usage()).estimated).toBe(before.estimated);
    expect((await assetRow(assetId)).reserved).toBeNull();
  });

  it('devuelve la reserva al presupuesto cuando el asset ya no se va a generar', async () => {
    const assetId = await givenPendingAsset();
    await reserveAudioGenerationBudget(
      em,
      assetId,
      periodKey,
      provider,
      25,
      1000,
    );
    const withReservation = await usage();

    const released = await releaseAudioGenerationBudget(em, assetId);

    expect(released).toBe(25);
    expect(await usage()).toMatchObject({
      estimated: withReservation.estimated - 25,
      failures: withReservation.failures + 1,
    });
    expect((await assetRow(assetId)).reserved).toBeNull();
  });

  it('no devuelve dos veces la misma reserva', async () => {
    const assetId = await givenPendingAsset();
    await reserveAudioGenerationBudget(
      em,
      assetId,
      periodKey,
      provider,
      30,
      1000,
    );
    await releaseAudioGenerationBudget(em, assetId);
    const afterFirst = await usage();

    // El segundo camino (barrido, reintento del reporte) lee NULL y no devuelve nada:
    // sin esto, el presupuesto crecería con cada intento de compensación.
    const releasedAgain = await releaseAudioGenerationBudget(em, assetId);

    expect(releasedAgain).toBe(0);
    expect((await usage()).estimated).toBe(afterFirst.estimated);
  });

  it('liquida el consumo contra la ventana de la reserva, no la del reloj', async () => {
    const assetId = await givenPendingAsset();
    await reserveAudioGenerationBudget(
      em,
      assetId,
      periodKey,
      provider,
      50,
      5000,
    );
    const before = await usage();

    await markAudioAssetReady(em, {
      assetId,
      storageUri: 's3://bucket/clave.mp3',
      checksum: 'a'.repeat(64),
      bytes: 2048,
      consumedCredits: 47,
    });

    // `periodKey` es 2099-01: si la liquidación usara el mes del reloj, este
    // consumo habría ido a una fila distinta y aquí seguiría en 0.
    expect(await usage()).toMatchObject({ consumed: before.consumed + 47 });
    // Y la reserva queda cerrada, que es lo que hace la devolución exactamente-una-vez.
    expect(await assetRow(assetId)).toMatchObject({
      reserved: null,
      status: 'READY',
    });
  });

  it('un asset ya liquidado no devuelve crédito si después se marca fallido', async () => {
    const assetId = await givenPendingAsset();
    await reserveAudioGenerationBudget(
      em,
      assetId,
      periodKey,
      provider,
      20,
      5000,
    );
    await markAudioAssetReady(em, {
      assetId,
      storageUri: 's3://bucket/otra.mp3',
      checksum: 'b'.repeat(64),
      bytes: 1024,
      consumedCredits: 20,
    });
    const afterReady = await usage();

    const released = await releaseAudioGenerationBudget(em, assetId);

    expect(released).toBe(0);
    expect((await usage()).estimated).toBe(afterReady.estimated);
  });
});
