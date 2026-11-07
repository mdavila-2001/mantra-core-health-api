import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { UpdateMyNameUseCase } from '../../src/modules/iam/application/use-cases/update-my-name.use-case';
import { UsersRepository } from '../../src/modules/iam/infrastructure/repositories/users.repository';
import { buildOrmConfig } from '../../src/orm/config/orm.config';

/**
 * The account name corrected by its owner, against real PostgreSQL: the four parts are recomposed
 * into `iam.users.display_name`, who changed it is stamped, and nobody else's row moves. Synthetic
 * data tagged `NAME-<suffix>`, created and removed by the test.
 */
describe('iam · el nombre de la propia cuenta (DB real)', () => {
  let orm: MikroORM;
  const mark = `NAME-${randomUUID().slice(0, 8)}`;
  const ownId = randomUUID();
  const otherId = randomUUID();
  const quiet = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  } as never;

  const run = (sql: string, params: unknown[] = []) =>
    orm.em.getConnection().execute(sql, params, 'run');
  const one = async <T>(sql: string, params: unknown[]): Promise<T> =>
    ((await orm.em.getConnection().execute(sql, params, 'all')) as T[])[0]!;

  beforeAll(async () => {
    orm = await MikroORM.init({
      ...buildOrmConfig(),
      entities: ['src/modules/**/entities/*.entity.ts'],
    });
    await new TerminologySeedService(orm, quiet).run();
    for (const id of [ownId, otherId]) {
      await run(
        `insert into iam.users (id, status_concept_id, display_name, created_at, updated_at) values (?, ?, ?, now(), now())`,
        [id, CONCEPTS.USER_ACTIVE, `${mark} Wendy Jennyfer Dávila Tamal`],
      );
    }
  });

  afterAll(async () => {
    if (!orm) return;
    // The account keeps a history row per change: it goes first or the FK refuses the delete.
    await run('delete from audit.users_history where user_id in (?, ?)', [
      ownId,
      otherId,
    ]);
    await run('delete from iam.users where id in (?, ?)', [ownId, otherId]);
    await orm.close(true);
  });

  it('recomposes the name, stamps the author and leaves other accounts alone', async () => {
    const useCase = new UpdateMyNameUseCase(
      orm.em.fork(),
      new UsersRepository(),
    );

    const result = await useCase.execute({ id: ownId } as never, {
      name: 'Wendy',
      middleName: 'Jennyfer',
      lastName: 'Dávila',
      motherLastName: 'Yamal',
    });

    expect(result).toEqual({ displayName: 'Wendy Jennyfer Dávila Yamal' });
    const own = await one<{ display_name: string; updated_by_user_id: string }>(
      'select display_name, updated_by_user_id from iam.users where id = ?',
      [ownId],
    );
    expect(own).toMatchObject({
      display_name: 'Wendy Jennyfer Dávila Yamal',
      updated_by_user_id: ownId,
    });
    const other = await one<{ display_name: string }>(
      'select display_name from iam.users where id = ?',
      [otherId],
    );
    expect(other.display_name).toBe(`${mark} Wendy Jennyfer Dávila Tamal`);
  });
});
