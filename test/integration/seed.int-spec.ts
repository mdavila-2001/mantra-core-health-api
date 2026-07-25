import { MikroORM } from '@mikro-orm/postgresql';
import buildConfig from '../../src/orm/config/orm.config';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { CONCEPTS } from '../../src/common/constants/concepts';

/**
 * Verifica que el seed materializa el catálogo de conceptos internos contra una
 * base real y que es idempotente (una segunda ejecución no vuelve a insertar).
 */
describe('TerminologySeedService (integración)', () => {
  let orm: MikroORM;
  const logger = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  };

  beforeAll(async () => {
    orm = await MikroORM.init(buildConfig);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it('materializa los conceptos y es idempotente', async () => {
    const service = new TerminologySeedService(orm, logger as never);

    await service.run();
    const second = await service.run();

    // La segunda pasada no inserta nada: el catálogo ya está completo.
    expect(second.inserted).toBe(0);

    const em = orm.em.fork();
    const active = await em.getConnection().execute(
      'select id from terminology.catalog_concepts where id = ?',
      [CONCEPTS.USER_ACTIVE],
    );
    expect(active).toHaveLength(1);
  });
});
