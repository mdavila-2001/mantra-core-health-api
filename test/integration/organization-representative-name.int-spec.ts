import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { AffiliationCatalogsSeedService } from '../../src/common/seed/affiliation-catalogs-seed.service';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { BranchesRepository } from '../../src/modules/directory/repositories/branches.repository';
import { DirectoryTenantLegalRepository } from '../../src/modules/directory/repositories/directory-tenant-legal.repository';
import { TenantsRepository } from '../../src/modules/directory/repositories/tenants.repository';
import { AffiliationDocumentConceptsService } from '../../src/modules/directory/services/affiliation-document-concepts.service';
import { DirectoryBranchesService } from '../../src/modules/directory/services/directory-branches.service';
import { TenantRepresentativeNameService } from '../../src/modules/directory/services/tenant-representative-name.service';
import { CatalogConceptsRepository } from '../../src/modules/terminology/repositories/catalog-concepts.repository';
import { ValueSetsRepository } from '../../src/modules/terminology/repositories/value-sets.repository';

/**
 * Representative rename and branch coordinates read from a map link, against
 * real PostgreSQL. Synthetic data tagged `ORGWS-<suffix>`, created and removed
 * by the test. Membership authorization has its own spec: the double lets it pass.
 */
describe('organization workspace · representative name and map link (DB real)', () => {
  let orm: MikroORM;
  const mark = `ORGWS-${randomUUID().slice(0, 8)}`;
  const tenantId = randomUUID();
  const personId = randomUUID();
  const actorId = randomUUID();
  const actor = { id: actorId, roles: ['SECURITY_ADMIN'] } as never;
  const allow = { assertCanAdminister: async () => undefined } as never;
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

  beforeAll(async () => {
    orm = await MikroORM.init({
      ...buildOrmConfig(),
      entities: ['src/modules/**/entities/*.entity.ts'],
    });
    await new TerminologySeedService(orm, quiet).run();
    await new AffiliationCatalogsSeedService(orm, quiet).run();
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
    await run(
      `insert into profiles.persons (id, person_status_concept_id, name, middle_name, last_name, display_name, created_at, updated_at)
       values (?, ?, 'Old', 'Middle', 'Name', 'Old Middle Name', now(), now())`,
      [personId, any],
    );
  });

  afterAll(async () => {
    if (!orm) return;
    await run('delete from directory.branches where tenant_id = ?', [tenantId]);
    await run(
      'delete from directory.tenant_legal_representatives where tenant_id = ?',
      [tenantId],
    );
    await run('delete from profiles.persons where id = ?', [personId]);
    await run('delete from directory.tenants where id = ?', [tenantId]);
    await run('delete from iam.users where id = ?', [actorId]);
    await orm.close(true);
  });

  it('renames the legal representative and clears the emptied part', async () => {
    const concepts = new AffiliationDocumentConceptsService(
      new ValueSetsRepository(),
      new CatalogConceptsRepository(),
    );
    const resolved = await concepts.resolve(orm.em.fork());
    const roleConceptId = resolved.representativeRole.get(
      'REPRESENTANTE_LEGAL',
    );
    expect(roleConceptId).toBeDefined();
    await run(
      `insert into directory.tenant_legal_representatives (id, tenant_id, person_id, representative_role_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now())`,
      [randomUUID(), tenantId, personId, roleConceptId, CONCEPTS.STATE_ACTIVE],
    );
    const service = new TenantRepresentativeNameService(
      orm.em.fork(),
      allow,
      new DirectoryTenantLegalRepository(),
      concepts,
      quiet,
    );
    const result = await service.update(
      tenantId,
      'LEGAL_REPRESENTATIVE',
      {
        name: 'Wendy',
        middleName: '',
        lastName: 'Dávila',
        motherLastName: 'Yamal',
      },
      actor,
    );

    expect(result.fullName).toBe('Wendy Dávila Yamal');
    const [row] = await all<Record<string, string | null>>(
      'select name, middle_name, last_name, mother_last_name, display_name, updated_by_user_id from profiles.persons where id = ?',
      [personId],
    );
    expect(row).toMatchObject({
      name: 'Wendy',
      middle_name: null,
      last_name: 'Dávila',
      mother_last_name: 'Yamal',
      display_name: 'Wendy Dávila Yamal',
      updated_by_user_id: actorId,
    });
  });

  it('stores the coordinates the map link resolved, and keeps the link', async () => {
    const link = 'https://maps.app.goo.gl/uwjxPfc6SYBhtQ3e7';
    const service = new DirectoryBranchesService(
      orm.em.fork(),
      new BranchesRepository(),
      new TenantsRepository(),
      allow,
      quiet,
      { resolve: async () => ({ latitude: -16.5, longitude: -68.15 }) },
    );

    const created = await service.create(
      tenantId,
      { code: `${mark}-L`, name: 'Palomanga', locationUrl: link },
      actor,
    );

    expect(created).toMatchObject({ latitude: -16.5, longitude: -68.15 });
    const [row] = await all<Record<string, string>>(
      'select location_url, latitude::text as latitude, longitude::text as longitude, status_concept_id from directory.branches where id = ?',
      [created.id],
    );
    expect(row.location_url).toBe(link);
    expect(Number(row.latitude)).toBeCloseTo(-16.5);
    expect(Number(row.longitude)).toBeCloseTo(-68.15);
    expect(row.status_concept_id).toBe(DIR.BRANCH_ACTIVE);
  });
});
