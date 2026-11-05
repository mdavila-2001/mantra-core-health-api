import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import pg from 'pg';
import { CONCEPTS, PreconditionFailedException, SEED } from '../../src/common';
import { applyTenantRls } from '../../src/common/tenant/rls-transaction';
import { FileVersions } from '../../src/modules/common/entities/file_versions.entity';
import { Files } from '../../src/modules/common/entities/files.entity';
import {
  FileVersionsRepository,
  FilesRepository,
} from '../../src/modules/common/repositories';
import { AttachableFileService } from '../../src/modules/common/services/attachable-file.service';

/**
 * #1305 (D-5): el reclamo de una pre-carga anónima corre bajo RLS forzado.
 *
 * El archivo nace en el tenant DEFAULT sin dueño y el reclamo corre en la transacción
 * de la petición, con el tenant de la organización nueva. El ORM se conecta como el
 * rol de runtime (`DB_APP_USER`, sin BYPASSRLS): sin la ventana de sistema de
 * `claimAnonymousUpload`, la fila no se ve y el UPDATE que mueve `tenant_id` afectaría
 * 0 filas. Un cliente `pg` dueño solo siembra, lee el resultado y limpia (la fila y su
 * versión, con ids aleatorios, en `beforeAll` y `afterAll`).
 *
 * Las FKs de `common.files` son reales y el UPDATE del reclamo las valida con el rol
 * de runtime, así que el tenant nuevo y el usuario son filas ya existentes de la base
 * (se buscan; no se crean). Si la base no tiene un segundo tenant ni un usuario, el
 * `beforeAll` falla con un mensaje claro.
 *
 * Los datos de conexión vienen SOLO de variables explícitas: `DB_HOST`, `DB_PORT`,
 * `DB_NAME`, `DB_USER`, `DB_PASSWORD` (dueño) y `DB_APP_USER`, `DB_APP_PASSWORD`
 * (rol de runtime). El dotenv del repo se neutraliza a propósito. Si falta alguna,
 * la suite se salta.
 */
const REQUIRED = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_APP_USER',
  'DB_APP_PASSWORD',
];
const explicit = Object.fromEntries(
  REQUIRED.map((key) => [key, process.env[key]]),
) as Record<string, string | undefined>;
const suite = REQUIRED.every((key) => !!explicit[key])
  ? describe
  : describe.skip;

const FILE_ID = randomUUID();
const VERSION_ID = randomUUID();

suite('#1305 · claimAnonymousUpload under forced RLS', () => {
  let orm: MikroORM;
  let owner: pg.Client;
  let service: AttachableFileService;
  let filesRepo: FilesRepository;
  let otherTenantId: string;
  let userId: string;
  const previousEnforce = process.env.RLS_ENFORCE;

  /** El dueño también pasa por el RLS forzado: cada sentencia va con contexto de sistema. */
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

  const removeFixture = () =>
    asOwner(async () => {
      await owner.query(
        'update common.files set current_version_id = null where id = $1',
        [FILE_ID],
      );
      await owner.query('delete from common.file_versions where id = $1', [
        VERSION_ID,
      ]);
      await owner.query('delete from common.files where id = $1', [FILE_ID]);
    });

  const seedFixture = () =>
    asOwner(async () => {
      await owner.query(
        `insert into common.files
           (id, tenant_id, category_concept_id, sensitivity_concept_id,
            lifecycle_status_concept_id, created_at, updated_at)
         values ($1, $2, $3, $4, $5, now(), now())`,
        [
          FILE_ID,
          SEED.tenantId,
          CONCEPTS.FILE_CATEGORY_DOCUMENT,
          CONCEPTS.SENSITIVITY_NORMAL,
          CONCEPTS.FILE_ACTIVE,
        ],
      );
      await owner.query(
        `insert into common.file_versions
           (id, file_id, version_number, storage_provider_concept_id,
            storage_region_concept_id, storage_uri, mime_type, size_bytes,
            checksum_algorithm_concept_id, content_hash,
            encryption_status_concept_id, malware_scan_status_concept_id,
            recorded_at)
         values ($1, $2, 1, $3, $4, $5, 'application/pdf', 1, $6, $7, $8, $9, now())`,
        [
          VERSION_ID,
          FILE_ID,
          CONCEPTS.STORAGE_PROVIDER_S3,
          CONCEPTS.STORAGE_REGION_DEFAULT,
          `int-spec://${FILE_ID}`,
          CONCEPTS.CHECKSUM_SHA256,
          'int-spec',
          CONCEPTS.ENCRYPTION_NONE,
          CONCEPTS.SCAN_PENDING,
        ],
      );
      await owner.query(
        'update common.files set current_version_id = $2 where id = $1',
        [FILE_ID, VERSION_ID],
      );
    });

  const readFile = () =>
    asOwner(async () => {
      const { rows } = await owner.query<{
        tenant_id: string;
        created_by_user_id: string | null;
      }>(
        'select tenant_id, created_by_user_id from common.files where id = $1',
        [FILE_ID],
      );
      return rows[0];
    });

  /** Lo que hace el interceptor de tenant: transacción del ORM con el tenant fijado. */
  const inRequestTransaction = <T>(
    work: (tx: import('@mikro-orm/postgresql').EntityManager) => Promise<T>,
  ) =>
    orm.em.fork().transactional(async (tx) => {
      await applyTenantRls(tx, otherTenantId);
      return work(tx);
    });

  beforeAll(async () => {
    process.env.DOTENV_CONFIG_PATH = 'no-such-file.env';
    process.env.RLS_ENFORCE = 'true';
    // Variable paths: a relative `import()` without extension does not resolve
    // under `moduleResolution: nodenext`.
    const configPath: string = '../../src/orm/config/orm.config';
    const envPath: string = '../../src/orm/config/orm.env';
    const { buildOrmConfig } = (await import(
      configPath
    )) as typeof import('../../src/orm/config/orm.config');
    const { loadOrmEnv } = (await import(
      envPath
    )) as typeof import('../../src/orm/config/orm.env');

    orm = await MikroORM.init({
      ...buildOrmConfig(loadOrmEnv({ ...explicit })),
      entities: [Files, FileVersions],
      entitiesTs: [],
      metadataProvider: ReflectMetadataProvider,
      metadataCache: { enabled: false },
      discovery: { warnWhenNoEntities: false },
    });
    filesRepo = new FilesRepository();
    service = new AttachableFileService(
      filesRepo,
      new FileVersionsRepository(),
      { setContext: () => undefined, warn: () => undefined } as never,
    );

    owner = new pg.Client({
      host: explicit.DB_HOST,
      port: Number(explicit.DB_PORT),
      database: explicit.DB_NAME,
      user: explicit.DB_USER,
      password: explicit.DB_PASSWORD,
    });
    await owner.connect();
    await removeFixture();

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
        'The database needs a tenant other than the DEFAULT one and one user (the claim writes real FKs)',
      );
    }
    otherTenantId = refs.tenantId;
    userId = refs.userId;
    await seedFixture();
  });

  afterAll(async () => {
    try {
      await removeFixture();
    } finally {
      await owner?.end();
      await orm?.close(true);
      if (previousEnforce === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = previousEnforce;
    }
  });

  it('control: a plain findById in the new tenant does not see the DEFAULT-tenant file (RLS is on)', async () => {
    const seen = await inRequestTransaction((tx) =>
      filesRepo.findById(tx, FILE_ID),
    );
    expect(seen).toBeNull();
  });

  it('claims the file for the new tenant and the caller flush still works', async () => {
    await inRequestTransaction(async (tx) => {
      const { file, version } = await service.claimAnonymousUpload(
        tx,
        FILE_ID,
        { tenantId: otherTenantId, ownerUserId: userId },
        {
          allowedMimeTypes: ['application/pdf'],
          allowedCategoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
        },
      );
      expect(version.id).toBe(VERSION_ID);
      expect(file.tenantId).toBe(otherTenantId);
      // El flush del llamador (UPDATE ya con el tenant nuevo) no debe fallar.
      await tx.flush();
    });

    const row = await readFile();
    expect(row.tenant_id).toBe(otherTenantId);
    expect(row.created_by_user_id).toBe(userId);
  });

  it('a second claim of the same file is refused with 422', async () => {
    await expect(
      inRequestTransaction((tx) =>
        service.claimAnonymousUpload(tx, FILE_ID, {
          tenantId: otherTenantId,
          ownerUserId: userId,
        }),
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
