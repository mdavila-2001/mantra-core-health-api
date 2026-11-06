import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { ConflictException } from '../../src/common';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { BranchesRepository } from '../../src/modules/directory/repositories/branches.repository';
import { TenantsRepository } from '../../src/modules/directory/repositories/tenants.repository';
import { DirectoryBranchesService } from '../../src/modules/directory/services/directory-branches.service';

/**
 * v4.2.92 — la categoría de la sede (`directory.branches.branch_category`)
 * contra PostgreSQL real: alta, edición, lectura y la casa matriz única, tanto
 * por la comprobación del servicio como por el índice `ux_branches_one_head_office`
 * cuando dos pedidos se cruzan.
 *
 * La autorización por membresía tiene su propio spec; acá el doble la deja pasar.
 * Datos sintéticos marcados con `V4292-<sufijo>`, creados y retirados por la prueba.
 */
describe('v4.2.92 · categoría de la sede (DB real)', () => {
  let orm: MikroORM;
  let service: DirectoryBranchesService;
  const branchesRepo = new BranchesRepository();
  const mark = `V4292-${randomUUID().slice(0, 8)}`;
  const tenantId = randomUUID();
  const actorId = randomUUID();
  const actor = { id: actorId, roles: ['SECURITY_ADMIN'] } as never;
  const quiet = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  } as never;

  const run = (sql: string, params: unknown[] = []) =>
    orm.em.getConnection().execute(sql, params, 'run');
  const all = <T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ) => orm.em.getConnection().execute(sql, params, 'all') as Promise<T[]>;

  const build = (repo: BranchesRepository = branchesRepo) =>
    new DirectoryBranchesService(
      orm.em.fork(),
      repo,
      new TenantsRepository(),
      { assertCanAdminister: async () => undefined } as never,
      quiet,
    );

  beforeAll(async () => {
    orm = await MikroORM.init({
      ...buildOrmConfig(),
      entities: ['src/modules/**/entities/*.entity.ts'],
    });
    const needed = [
      CONCEPTS.TENANT_ACTIVE,
      CONCEPTS.USER_ACTIVE,
      DIR.BRANCH_ACTIVE,
      DIR.BRANCH_TYPE_CLINIC,
    ];
    const [{ n }] = await all<{ n: number }>(
      `select count(*)::int as n from terminology.catalog_concepts where id in (?, ?, ?, ?)`,
      needed,
    );
    if (n < needed.length) {
      await new TerminologySeedService(orm, quiet).run();
    }
    const any = CONCEPTS.STATE_ACTIVE;
    await run(
      `insert into iam.users (id, status_concept_id, display_name, created_at, updated_at) values (?, ?, ?, now(), now())`,
      [actorId, CONCEPTS.USER_ACTIVE, mark],
    );
    await run(
      `insert into directory.tenants (id, code, tenant_type_concept_id, legal_name, legal_entity_type_concept_id,
         status_concept_id, verification_status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [tenantId, mark, any, mark, any, CONCEPTS.TENANT_ACTIVE, any],
    );
    service = build();
  });

  afterAll(async () => {
    if (!orm) return;
    await run('delete from directory.branches where tenant_id = ?', [tenantId]);
    await run('delete from directory.tenants where id = ?', [tenantId]);
    await run('delete from iam.users where id = ?', [actorId]);
    await orm.close(true);
  });

  it('una sede sin categoría se guarda como default', async () => {
    const created = await service.create(
      tenantId,
      { code: `${mark}-A`, name: 'Norte' },
      actor,
    );
    expect(created.category).toBe('default');
    const [row] = await all<{ branch_category: string }>(
      'select branch_category from directory.branches where id = ?',
      [created.id],
    );
    expect(row.branch_category).toBe('default');
  });

  it('crea la casa matriz y rechaza con 409 una segunda', async () => {
    const head = await build().create(
      tenantId,
      { code: `${mark}-HQ`, name: 'Casa matriz', category: 'head_office' },
      actor,
    );
    expect(head.category).toBe('head_office');

    await expect(
      build().create(
        tenantId,
        { code: `${mark}-HQ2`, name: 'Otra', category: 'head_office' },
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    const [{ n }] = await all<{ n: number }>(
      `select count(*)::int as n from directory.branches where tenant_id = ? and code = ?`,
      [tenantId, `${mark}-HQ2`],
    );
    expect(n).toBe(0);
  });

  it('edita la categoría y la lectura la devuelve', async () => {
    const created = await build().create(
      tenantId,
      { code: `${mark}-S`, name: 'Sur' },
      actor,
    );
    const updated = await build().update(
      tenantId,
      created.id,
      { category: 'branch' },
      actor,
    );
    expect(updated.category).toBe('branch');

    const listed = await branchesRepo.findByTenant(orm.em.fork(), tenantId);
    expect(listed.find((b) => b.id === created.id)?.branchCategory).toBe(
      'branch',
    );
  });

  it('si dos pedidos se cruzan, el índice único responde 409 y no deja dos casas matrices', async () => {
    // El servicio no ve la casa matriz existente (como si el otro pedido aún no
    // hubiera confirmado): tiene que frenarlo la base.
    const blind = Object.assign(new BranchesRepository(), {
      findHeadOffice: async () => null,
    });
    const created = await build(blind).create(
      tenantId,
      { code: `${mark}-R`, name: 'Carrera' },
      actor,
    );
    await expect(
      build(blind).update(
        tenantId,
        created.id,
        { category: 'head_office' },
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    const [{ n }] = await all<{ n: number }>(
      `select count(*)::int as n from directory.branches where tenant_id = ? and branch_category = 'head_office'`,
      [tenantId],
    );
    expect(n).toBe(1);
  });

  it('la base rechaza una categoría desconocida (ck_branches_branch_category)', async () => {
    await expect(
      run(
        `update directory.branches set branch_category = 'otra' where tenant_id = ?`,
        [tenantId],
      ),
    ).rejects.toThrow(/ck_branches_branch_category/);
  });
});
