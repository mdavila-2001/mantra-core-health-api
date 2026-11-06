import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as entities from '../../src/modules/marketing/entities';
import { InsightsFactsRepository } from '../../src/modules/marketing/repositories/insights-facts.repository';
import { InsightsFactsService } from '../../src/modules/marketing/services/insights-facts.service';

/**
 * Lecturas de AloVida Insights (`/marketing/insights/catalog` y `campaign-facts`)
 * contra PostgreSQL real, con el DDL canónico del módulo 50.
 *
 * Opt-in con `DATA_CATALOG_IT_DB_URL`. Recrea el schema `marketing` y, si no
 * existe, un stub mínimo de `terminology.catalog_concepts (id, code)`: la base
 * debe ser DESECHABLE y sin el catálogo de terminología real. Nunca contra una
 * base compartida. No se aplican `90_fk_deferred.sql` (FKs hacia `iam` y
 * `terminology`), así que no hace falta sembrar esos schemas.
 *
 * Los datos permiten calcular a mano cada resultado esperado.
 */
const DB_URL = process.env.DATA_CATALOG_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;
const DDL = join(process.cwd(), 'database/SQL/50_marketing');

const id = () => randomUUID();
const C1 = id();
const C2 = id();
const NOW = '2026-10-29T23:00:00Z';

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return (error as { getStatus?: () => number }).getStatus?.() ?? 'threw';
  }
}

describeIfDb('AloVida Insights (integración, PostgreSQL real)', () => {
  let client: pg.Client;
  let orm: MikroORM;
  let service: InsightsFactsService;

  const concept = { active: id(), planned: id(), ended: id(), connected: id() };

  beforeAll(async () => {
    client = new pg.Client({ connectionString: DB_URL });
    await client.connect();

    await client.query('CREATE SCHEMA IF NOT EXISTS terminology');
    const real = await client.query(
      `SELECT count(*)::int AS n FROM information_schema.columns
        WHERE table_schema = 'terminology' AND table_name = 'catalog_concepts'
          AND column_name NOT IN ('id', 'code')`,
    );
    if (real.rows[0].n > 0) {
      throw new Error(
        'terminology.catalog_concepts es la tabla real: use una base desechable sin ella.',
      );
    }
    await client.query(
      'CREATE TABLE IF NOT EXISTS terminology.catalog_concepts (id uuid PRIMARY KEY, code varchar NOT NULL)',
    );
    await client.query('DELETE FROM terminology.catalog_concepts');
    for (const [key, code] of [
      ['active', 'ACTIVE'],
      ['planned', 'PLANNED'],
      ['ended', 'ENDED'],
      ['connected', 'CONNECTED'],
    ] as const) {
      await client.query(
        'INSERT INTO terminology.catalog_concepts (id, code) VALUES ($1, $2)',
        [concept[key], code],
      );
    }

    await client.query('DROP SCHEMA IF EXISTS marketing CASCADE');
    for (const file of [
      '01_schema.sql',
      '02_tables.sql',
      '03_fk_intra.sql',
      '04_indexes.sql',
    ]) {
      await client.query(readFileSync(join(DDL, file), 'utf8'));
    }

    const q = (text: string, values: unknown[]) => client.query(text, values);
    const campaign = (
      cid: string,
      code: string,
      status: string,
      over: {
        end?: string | null;
        budget?: number | null;
        targets?: object | null;
      } = {},
    ) =>
      q(
        `INSERT INTO marketing.insights_campaigns
           (id, code, name, short_name, kind_code, objective_text, audience_text, start_on, end_on,
            budget_cents, revenue_per_conversion_cents, targets_json, status_concept_id,
            created_at, updated_at, row_version)
         VALUES ($1, $2, $3, $3, 'acquisition', 'Objetivo', NULL, '2026-10-01', $4, $5, 18500, $6, $7, $8, $8, 1)`,
        [
          cid,
          code,
          `Campaña ${code}`,
          over.end === undefined ? '2026-10-31' : over.end,
          over.budget === undefined ? 4_200_000 : over.budget,
          over.targets === undefined ? { ctr: 0.025, nota: 'x' } : over.targets,
          status,
          NOW,
        ],
      );
    await campaign(C1, 'c1', concept.active);
    await campaign(C2, 'c2', concept.planned, {
      end: null,
      budget: null,
      targets: null,
    });

    const creative = (cid: string, channel: string, code: string) =>
      q(
        `INSERT INTO marketing.insights_creatives
           (id, campaign_id, channel_code, code, name, status_concept_id, created_at, updated_at, row_version)
         VALUES ($1, $2, $3, $4, 'Todos', $5, $6, $6, 1)`,
        [id(), cid, channel, code, concept.active, NOW],
      );
    const creativeId = id();
    await q(
      `INSERT INTO marketing.insights_creatives
         (id, campaign_id, channel_code, code, name, status_concept_id, created_at, updated_at, row_version)
       VALUES ($1, $2, 'web', 'c1-web-a', 'A', $3, $4, $4, 1)`,
      [creativeId, C1, concept.active, NOW],
    );
    await creative(C1, 'google', 'c1-google-all');
    await creative(C1, 'google', 'c1-google-b');
    await creative(C2, 'tiktok', 'c2-tiktok-all');

    for (const [date, label, camp, kind] of [
      ['2026-10-09', 'Viral', C2, 'viral'],
      ['2026-10-01', 'Inicio', C1, 'launch'],
      ['2026-10-15', 'General', null, 'press'],
      ['2026-10-16', 'Tipo ajeno', null, 'otro'],
    ] as const) {
      await q(
        `INSERT INTO marketing.insights_milestones
           (id, occurred_on, label, campaign_id, kind_code, created_at, updated_at, row_version)
         VALUES ($1, $2, $3, $4, $5, $6, $6, 1)`,
        [id(), date, label, camp, kind, NOW],
      );
    }

    await q(
      `INSERT INTO marketing.insights_data_sources
         (id, code, name, last_received_at, status_concept_id, dataset_code, created_at, updated_at, row_version)
       VALUES ($1, 'meta', 'Meta', $2, $3, 'demo', $2, $2, 1),
              ($4, 'web', 'Web', '2026-10-28T10:00:00Z', $3, 'demo', $2, $2, 1)`,
      [id(), NOW, concept.connected, id()],
    );

    // Hechos. c1/google tiene DOS creativos el 2026-10-01 (se suman) y uno solo el 02.
    //   c1 web: video_views NULL siempre (no medido)  ·  c2 tiktok: todo medido.
    const fact = (
      date: string,
      camp: string,
      channel: string,
      creative: string | null,
      v: {
        impressions: number | null;
        videoViews: number | null;
        clicks: number | null;
        spend: number | null;
      },
    ) =>
      q(
        `INSERT INTO marketing.insights_campaign_daily_facts
           (id, fact_date, campaign_id, channel_code, creative_id, impressions, reach, engagements,
            clicks, video_views, watch_seconds, visits, leads, registrations, activations, first_uses,
            conversions, spend_cents, revenue_cents, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, 10, 1, $7, $8, 0, 5, 4, 3, 2, 1, 1, $9, 9000000000, $10)`,
        [
          id(),
          date,
          camp,
          channel,
          creative,
          v.impressions,
          v.clicks,
          v.videoViews,
          v.spend,
          NOW,
        ],
      );
    const g1 = (
      await q(
        `SELECT id FROM marketing.insights_creatives WHERE code = 'c1-google-all'`,
        [],
      )
    ).rows[0].id;
    const g2 = (
      await q(
        `SELECT id FROM marketing.insights_creatives WHERE code = 'c1-google-b'`,
        [],
      )
    ).rows[0].id;
    await fact('2026-10-01', C1, 'google', g1, {
      impressions: 100,
      videoViews: 0,
      clicks: 10,
      spend: 700,
    });
    await fact('2026-10-01', C1, 'google', g2, {
      impressions: 50,
      videoViews: 0,
      clicks: null,
      spend: 300,
    });
    await fact('2026-10-02', C1, 'google', g1, {
      impressions: 80,
      videoViews: 0,
      clicks: 8,
      spend: 500,
    });
    await fact('2026-10-01', C1, 'web', creativeId, {
      impressions: 40,
      videoViews: null,
      clicks: 4,
      spend: null,
    });
    await fact('2026-10-02', C1, 'web', creativeId, {
      impressions: 60,
      videoViews: null,
      clicks: 6,
      spend: null,
    });
    await fact('2026-10-02', C2, 'tiktok', null, {
      impressions: 1000,
      videoViews: 700,
      clicks: 90,
      spend: 2500,
    });
    await fact('2026-10-29', C2, 'tiktok', null, {
      impressions: 900,
      videoViews: 600,
      clicks: 80,
      spend: 2400,
    });

    orm = await MikroORM.init({
      clientUrl: DB_URL,
      entities: Object.values(entities),
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
      allowGlobalContext: true,
    });
    service = new InsightsFactsService(
      new InsightsFactsRepository(orm.em.fork()),
    );
  }, 120_000);

  afterAll(async () => {
    await orm?.close(true);
    await client?.end();
  });

  it('catálogo: campañas por código, bigint a número, estado del value set y canales de los creativos', async () => {
    const { data, meta } = await service.catalog();
    expect(data.campaigns.map((c) => [c.id, c.status])).toEqual([
      ['c1', 'active'],
      ['c2', 'planned'],
    ]);
    expect(data.campaigns[0]).toEqual({
      id: 'c1',
      name: 'Campaña c1',
      objective: 'Objetivo',
      audience: '',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      budgetCents: 4_200_000,
      status: 'active',
      revenuePerConversionCents: 18_500,
      targets: { ctr: 0.025 },
      channels: ['google', 'web'], // distinct de dos creativos google + uno web
    });
    expect(data.campaigns[1]).toMatchObject({
      endDate: null,
      budgetCents: null,
      targets: {},
      channels: ['tiktok'],
    });
    // Ordenados por fecha; el de tipo ajeno se omite y se declara.
    expect(data.milestones).toEqual([
      { date: '2026-10-01', label: 'Inicio', campaignId: 'c1', kind: 'launch' },
      { date: '2026-10-09', label: 'Viral', campaignId: 'c2', kind: 'viral' },
      { date: '2026-10-15', label: 'General', campaignId: null, kind: 'press' },
    ]);
    expect(meta).toMatchObject({
      dataset: 'demo',
      asOf: '2026-10-29',
      cutoff: '2026-10-29',
      window: null,
    });
    expect(meta.notMeasured.map((n) => n.metric)).toEqual(['milestones']);
  });

  it('hechos: suma creativos, bigint a número, NULL se queda NULL y se declara', async () => {
    const { data, meta } = await service.campaignFacts({
      from: '2026-10-01',
      to: '2026-10-02',
    });
    expect(data.map((f) => [f.date, f.campaignId, f.channel])).toEqual([
      ['2026-10-01', 'c1', 'google'],
      ['2026-10-01', 'c1', 'web'],
      ['2026-10-02', 'c1', 'google'],
      ['2026-10-02', 'c1', 'web'],
      ['2026-10-02', 'c2', 'tiktok'],
    ]);
    const google1 = data[0];
    expect(google1).toMatchObject({
      impressions: 150, // 100 + 50
      clicks: 10, // 10 + NULL: SUM ignora NULL, no es 10 + 0 inventado
      spendCents: 1000,
      videoViews: 0, // medido y cero: se distingue de NULL
      revenueCents: 18_000_000_000, // bigint por encima de 2^31, aún entero seguro
    });
    expect(data[1]).toMatchObject({ videoViews: null, spendCents: null });
    expect(data[4]).toMatchObject({ videoViews: 700, spendCents: 2500 });
    expect(meta.window).toEqual({ from: '2026-10-01', to: '2026-10-02' });
    // `clicks` no aparece: la celda c1/google/01-oct suma 10 de un creativo y NULL del otro,
    // y ninguna celda agregada quedó sin dato.
    expect(meta.notMeasured).toEqual([
      {
        metric: 'videoViews',
        reason: 'La fuente no reporta esta medida en: web.',
      },
      {
        metric: 'spendCents',
        reason: 'La fuente no reporta esta medida en: web.',
      },
    ]);
  });

  it('hechos: filtra por campaña y canal, y respeta los extremos de la ventana', async () => {
    const tiktok = await service.campaignFacts({
      from: '2026-10-29',
      to: '2026-10-29',
      campaignIds: ['c2'],
      channels: ['tiktok'],
    });
    expect(tiktok.data).toHaveLength(1);
    expect(tiktok.data[0]).toMatchObject({
      date: '2026-10-29',
      impressions: 900,
    });

    const onlyWeb = await service.campaignFacts({
      from: '2026-10-01',
      to: '2026-10-29',
      channels: ['web'],
    });
    expect(onlyWeb.data.map((f) => f.channel)).toEqual(['web', 'web']);

    const empty = await service.campaignFacts({
      from: '2026-10-10',
      to: '2026-10-20',
    });
    expect(empty.data).toEqual([]);
    expect(empty.meta.notMeasured).toEqual([]);
    expect(empty.meta.asOf).toBe('2026-10-29'); // último día real de la tabla, no de la ventana
  });

  it('un código de campaña que no existe devuelve vacío, no falla', async () => {
    const result = await service.campaignFacts({
      from: '2026-10-01',
      to: '2026-10-29',
      campaignIds: ["c1'; DROP TABLE x; --"],
    });
    expect(result.data).toEqual([]);
  });

  it('ventana inválida → 422', async () => {
    expect(
      await statusOf(
        service.campaignFacts({ from: '2026-10-10', to: '2026-10-01' }),
      ),
    ).toBe(422);
    expect(
      await statusOf(
        service.campaignFacts({ from: '2026-01-01', to: '2026-10-01' }),
      ),
    ).toBe(422);
  });
});
