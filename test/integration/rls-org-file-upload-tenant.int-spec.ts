import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import pg from 'pg';
import { CONCEPTS, SEED, runWithTenant } from '../../src/common';
import { applyTenantRls } from '../../src/common/tenant/rls-transaction';
import { FileVersions } from '../../src/modules/common/entities/file_versions.entity';
import { Files } from '../../src/modules/common/entities/files.entity';
import { FileCategory, FileSensitivity } from '../../src/modules/common/dto';
import {
  FileDerivativesRepository,
  FileLinksRepository,
  FileVersionsRepository,
  FilesRepository,
} from '../../src/modules/common/repositories';
import { FilesService } from '../../src/modules/common/services/files.service';

/**
 * An organization logo upload failed with 500 (support code
 * 9c0b3ada4c8b95a345422625f1c98ced): `FilesService.createFile` always wrote
 * `common.files.tenant_id` = DEFAULT, while `TenantContextInterceptor` had set
 * `app.current_tenant_id` to the actor's organization. Under forced RLS the
 * `tenant_isolation` policy rejects that INSERT, and a logo stored earlier in
 * DEFAULT is invisible to its organization.
 *
 * The real service runs through a runtime role the spec creates and drops
 * (LOGIN, NOBYPASSRLS, member of `mantra_app`, which `2026-08-05_tenant_rls.sql`
 * grants DML to), inside a transaction shaped like the interceptor's: RLS
 * context set to the organization's tenant and the tenant in the async
 * context. It needs only the owner connection (`DB_*`), like the rest of the
 * integration suite.
 */
const env = {
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: process.env.DB_PORT ?? '5432',
  DB_NAME: process.env.DB_NAME ?? 'mantra_redesa_health',
  DB_USER: process.env.DB_USER ?? 'mantra',
  DB_PASSWORD: process.env.DB_PASSWORD ?? 'mantra',
};
const RUNTIME_ROLE = `int_rls_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
const RUNTIME_PASSWORD = randomUUID();

describe('organization upload under forced RLS: the file belongs to the request tenant', () => {
  let orm: MikroORM;
  let owner: pg.Client;
  let service: FilesService;
  let orgTenantId: string;
  let userId: string;
  const created: string[] = [];
  const previousEnforce = process.env.RLS_ENFORCE;
  const previousApp = [process.env.DB_APP_USER, process.env.DB_APP_PASSWORD];

  /** The owner also goes through forced RLS: each statement runs as system. */
  const asOwner = async <T>(run: () => Promise<T>): Promise<T> => {
    await owner.query('BEGIN');
    try {
      await owner.query(
        "select set_config('app.system_context', 'true', true)",
      );
      const result = await run();
      await owner.query('COMMIT');
      return result;
    } catch (error) {
      await owner.query('ROLLBACK');
      throw error;
    }
  };

  /** What `TenantContextInterceptor` does with RLS_ENFORCE=true. */
  const asOrganizationRequest = <T>(work: () => Promise<T>): Promise<T> =>
    runWithTenant(orgTenantId, () =>
      orm.em.transactional(async (tx) => {
        await applyTenantRls(tx, orgTenantId);
        return work();
      }),
    );

  const upload = () =>
    service.createFile(
      {
        originalName: 'logo.png',
        category: FileCategory.IMAGE,
        sensitivity: FileSensitivity.NORMAL,
        mimeType: 'image/png',
        sizeBytes: 1,
        contentHash: 'int-spec',
        storageUri: `int-spec://logo-${randomUUID()}`,
      },
      { id: userId, roles: ['PHARMACY_STAFF'] },
    );

  beforeAll(async () => {
    process.env.DOTENV_CONFIG_PATH = 'no-such-file.env';
    process.env.RLS_ENFORCE = 'true';
    // The ORM config reads the runtime role from the process environment.
    process.env.DB_APP_USER = RUNTIME_ROLE;
    process.env.DB_APP_PASSWORD = RUNTIME_PASSWORD;
    owner = new pg.Client({
      host: env.DB_HOST,
      port: Number(env.DB_PORT),
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    });
    await owner.connect();
    await owner.query(
      `create role ${RUNTIME_ROLE} login inherit nosuperuser nobypassrls password '${RUNTIME_PASSWORD}' in role mantra_app`,
    );

    const configPath: string = '../../src/orm/config/orm.config';
    const envPath: string = '../../src/orm/config/orm.env';
    const { buildOrmConfig } = (await import(
      configPath
    )) as typeof import('../../src/orm/config/orm.config');
    const { loadOrmEnv } = (await import(
      envPath
    )) as typeof import('../../src/orm/config/orm.env');
    orm = await MikroORM.init({
      ...buildOrmConfig(
        loadOrmEnv({
          ...env,
          DB_APP_USER: RUNTIME_ROLE,
          DB_APP_PASSWORD: RUNTIME_PASSWORD,
        }),
      ),
      entities: [Files, FileVersions],
      entitiesTs: [],
      metadataProvider: ReflectMetadataProvider,
      metadataCache: { enabled: false },
      discovery: { warnWhenNoEntities: false },
    });
    const logger = { setContext: () => undefined, info: () => undefined };
    service = new FilesService(
      orm.em as never,
      new FilesRepository(),
      new FileVersionsRepository(),
      new FileDerivativesRepository(),
      new FileLinksRepository(),
      logger as never,
    );

    const refs = await asOwner(async () => {
      const tenant = await owner.query<{ id: string }>(
        'select id from directory.tenants where id <> $1 limit 1',
        [SEED.tenantId],
      );
      const user = await owner.query<{ id: string }>(
        'select id from iam.users limit 1',
      );
      return { tenantId: tenant.rows[0]?.id, userId: user.rows[0]?.id };
    });
    if (!refs.tenantId || !refs.userId) {
      throw new Error(
        'The database needs a tenant other than DEFAULT and one user (the file has real FKs)',
      );
    }
    orgTenantId = refs.tenantId;
    userId = refs.userId;
  });

  afterAll(async () => {
    try {
      await asOwner(async () => {
        for (const id of created) {
          await owner.query(
            'update common.files set current_version_id = null where id = $1',
            [id],
          );
          await owner.query(
            'delete from common.file_versions where file_id = $1',
            [id],
          );
          await owner.query('delete from common.files where id = $1', [id]);
        }
      });
    } finally {
      await orm?.close(true);
      await owner?.query(`drop role if exists ${RUNTIME_ROLE}`);
      await owner?.end();
      for (const [key, value] of [
        ['DB_APP_USER', previousApp[0]],
        ['DB_APP_PASSWORD', previousApp[1]],
      ] as const) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      if (previousEnforce === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = previousEnforce;
    }
  });

  it('control: under the organization tenant, a DEFAULT-tenant row is rejected by RLS', async () => {
    await expect(
      asOrganizationRequest(() =>
        orm.em.execute(
          'insert into common.files (id, tenant_id, category_concept_id, sensitivity_concept_id, lifecycle_status_concept_id, created_at, updated_at) values (gen_random_uuid(), ?, ?, ?, ?, now(), now())',
          [
            SEED.tenantId,
            CONCEPTS.FILE_CATEGORY_IMAGE,
            CONCEPTS.SENSITIVITY_NORMAL,
            CONCEPTS.FILE_ACTIVE,
          ],
        ),
      ),
    ).rejects.toThrow(/row-level security/u);
  });

  it('an organization member uploads: the file is created in that tenant and read back there', async () => {
    const file = await asOrganizationRequest(() => upload());
    created.push(file.id);

    const stored = await asOwner(async () => {
      const { rows } = await owner.query<{
        tenant_id: string;
        created_by_user_id: string;
      }>(
        'select tenant_id, created_by_user_id from common.files where id = $1',
        [file.id],
      );
      return rows[0];
    });
    expect(stored).toEqual({
      tenant_id: orgTenantId,
      created_by_user_id: userId,
    });

    // The organization reads it back through the runtime role («Sin logo» before).
    const seen = await asOrganizationRequest(() =>
      new FilesRepository().findById(orm.em as never, file.id),
    );
    expect(seen?.id).toBe(file.id);
  });
});
