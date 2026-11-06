import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { LabCatalogRepository } from '../../src/modules/study_catalog/repositories/lab-catalog.repository';
import { StudyCatalogRepository } from '../../src/modules/study_catalog/repositories/study-catalog.repository';
import {
  catalogVersionOf,
  toCatalogItems,
} from '../../src/modules/diagnostic_units/services/lab-portal-study-catalog.items';

/**
 * The lab's «Agregar del catálogo» read path against real Postgres, with the
 * boot seeds and `yarn catalog:studies:load` applied (precondition): the same
 * SQL and mapping `GET /diagnostics/lab/catalog` uses. It proves the catalog is
 * browsable by sample type with every análisis and its components, not the 47
 * basic boot análisis under «Otros análisis».
 */
describe('Lab catalog by sample type (integration, real Postgres)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: PostgreSqlDriver,
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5433),
      user: process.env.DB_USER ?? 'mantra',
      password: process.env.DB_PASSWORD,
      dbName: process.env.DB_NAME ?? 'mantra_redesa_health',
      entities: [],
      discovery: { warnWhenNoEntities: false },
    });
  });
  afterAll(() => orm.close(true));

  it('groups the loaded catalog by sample type, with components', async () => {
    const em = orm.em.fork() as EntityManager;
    const rows = await new StudyCatalogRepository().findPage(em, {
      family: 'LAB',
      tokens: [],
      limit: 1000,
    });
    const parts = await new LabCatalogRepository().findDirectComponents(
      em,
      rows.map((r) => r.id),
    );
    const items = [...toCatalogItems(rows, parts).values()];
    expect(catalogVersionOf(rows)).not.toBeNull();
    const of = (type: string) => items.filter((i) => i.sampleType === type);

    expect(of('BLOOD').length).toBeGreaterThan(300);
    expect(of('URINE').length).toBeGreaterThanOrEqual(20);
    const hemograma = of('BLOOD').find((i) => i.code === 'HEMOGRAMA');
    expect(hemograma?.section.name).toBe('Hematología');
    expect(hemograma?.components.length).toBeGreaterThan(10);
    const ego = of('URINE').find((i) => /general de orina/i.test(i.name));
    expect(ego?.components.length).toBeGreaterThan(10);
    // The basic boot análisis reused by the loader now carry their section.
    const urico = items.find((i) => /^ácido úrico/i.test(i.name));
    expect(urico?.section.code).not.toBe('OTROS');
    expect(urico?.sampleType).toBe('BLOOD');
  });
});
