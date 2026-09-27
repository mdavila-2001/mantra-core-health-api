import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Files } from '../../src/modules/common/entities/files.entity';
import { FileVersions } from '../../src/modules/common/entities/file_versions.entity';
import { JurisdictionAuthorizations } from '../../src/modules/profiles/entities/jurisdiction_authorizations.entity';
import { FilesRepository } from '../../src/modules/common/repositories/files.repository';
import { FileVersionsRepository } from '../../src/modules/common/repositories/file-versions.repository';
import { JurisdictionAuthorizationsRepository } from '../../src/modules/profiles/repositories/jurisdiction-authorizations.repository';
import { AttachableFileService } from '../../src/modules/common/services/attachable-file.service';
import { ProfilesPractitionersService } from '../../src/modules/profiles/services/profiles-practitioners.service';
import { CONCEPTS, type AuthenticatedUser } from '../../src/common';

export const PATCH = '2026-09-13_v4212_jurisdiction_authorizations_file_id.sql';
export const API_BASE = 'f038c3655ef792132aff592cc9fac14fd58b2e1d';
export const table = 'jurisdiction_authorizations';
export const fkName = 'fk_jurisdiction_authorizations_file_id';
export const indexName = 'ix_jurisdiction_authorizations_file_id';
export const actor = {
  id: randomUUID(),
  roles: [],
} as unknown as AuthenticatedUser;
export const profileId = randomUUID();
export const tenantId = randomUUID();
export const authorizations = new JurisdictionAuthorizationsRepository();
const files = new FilesRepository();
const versions = new FileVersionsRepository();

/** Reads canonical vendored SQL, never ORM-generated or invented DDL. */
export function ddl(path: string): string {
  return readFileSync(join(process.cwd(), 'database/SQL', path), 'utf8');
}

/** Extracts one unchanged CREATE TABLE statement from the approved source. */
function tableStatement(source: string, schema: string, name: string): string {
  const statement = source.match(
    new RegExp(
      `CREATE TABLE IF NOT EXISTS "${schema}"\\."${name}" \\([\\s\\S]*?\\n\\);`,
    ),
  )?.[0];
  if (!statement) throw new Error(`Missing canonical table ${schema}.${name}`);
  return statement;
}

/** Isolated slice materialization; refuses existing tables and any generic DB config. */
export async function materialize(
  mode: 'clean' | 'upgrade',
): Promise<MikroORM> {
  if (process.env.UNBLOCKER_FILEID_TEST !== 'synthetic-local-only') {
    throw new Error('Explicit synthetic local opt-in required; no DB fallback');
  }
  const runId = process.env.UNBLOCKER_FILEID_RUN;
  if (!runId || !/^[a-z0-9]{1,16}$/.test(runId)) {
    throw new Error(
      'A fresh synthetic run identifier is required; never reuse/delete fixtures',
    );
  }
  const dbName = `unblocker_fileid_${runId}_${mode}`;
  const orm = await MikroORM.init({
    host: '127.0.0.1',
    port: 55482,
    user: 'unblocker_test',
    password: 'synthetic-local-only',
    dbName,
    entities: [Files, FileVersions, JurisdictionAuthorizations],
    metadataProvider: ReflectMetadataProvider,
    metadataCache: { enabled: false },
    pool: { min: 0, max: 2 },
    debug: false,
  });
  try {
    const connection = orm.em.getConnection();
    const state = await connection.execute(`SELECT current_database() AS db,
      current_user AS role, to_regclass('common.files') AS files,
      to_regclass('profiles.jurisdiction_authorizations') AS authorizations`);
    if (
      state[0].db !== dbName ||
      state[0].role !== 'unblocker_test' ||
      state[0].files ||
      state[0].authorizations
    ) {
      throw new Error(
        'Refusing a nonempty or non-synthetic target; provision a fresh test DB',
      );
    }
    await connection.execute(ddl('02_common/01_schema.sql'));
    await connection.execute(ddl('05_profiles/01_schema.sql'));
    for (const name of ['files', 'file_versions']) {
      await connection.execute(
        tableStatement(ddl('02_common/02_tables.sql'), 'common', name),
      );
    }
    const profiles =
      mode === 'clean'
        ? ddl('05_profiles/02_tables.sql')
        : execFileSync(
            'git',
            ['show', `${API_BASE}:database/SQL/05_profiles/02_tables.sql`],
            { encoding: 'utf8' },
          );
    const create = tableStatement(profiles, 'profiles', table);
    if (mode === 'upgrade' && create.includes('"file_id"'))
      throw new Error('Upgrade baseline is not pre-v4.2.12');
    await connection.execute(create);
    if (mode === 'upgrade') {
      // A pre-existing SYNTHETIC row proves nullable addition without backfill.
      await connection.execute(
        `INSERT INTO profiles.jurisdiction_authorizations
        (id, practitioner_profile_id, jurisdiction_concept_id, license_number, state_concept_id, created_at, updated_at)
        VALUES (?, ?, ?, 'SYNTHETIC-PRE-V4212', ?, now(), now())`,
        [randomUUID(), profileId, randomUUID(), randomUUID()],
      );
      await connection.execute(ddl(`patches/${PATCH}`));
    } else {
      const index = ddl('05_profiles/04_indexes.sql')
        .split(/\r?\n/)
        .find((line) =>
          line.startsWith(`CREATE INDEX IF NOT EXISTS "${indexName}"`),
        );
      const fk = ddl('05_profiles/90_fk_deferred.sql').match(
        /DO \$\$ BEGIN\r?\n\s+ALTER TABLE "profiles"\."jurisdiction_authorizations"\r?\n\s+ADD CONSTRAINT "fk_jurisdiction_authorizations_file_id"[\s\S]*?END \$\$;/,
      )?.[0];
      if (!index || !fk) throw new Error('Missing approved index/FK DDL');
      await connection.execute(index);
      await connection.execute(fk);
    }
    return orm;
  } catch (error) {
    await orm.close(true);
    throw error;
  }
}

/** Real service/repositories/file guard; unrelated profile ownership is a bounded double. */
export function api(orm: MikroORM): ProfilesPractitionersService {
  const logger = { setContext() {}, info() {}, warn() {} };
  const unused = undefined as never;
  return new ProfilesPractitionersService(
    orm.em.fork(),
    unused,
    unused,
    {
      findById: (_em: unknown, id: string) =>
        Promise.resolve(id === profileId ? { profileId } : null),
    } as never,
    authorizations,
    unused,
    unused,
    unused,
    unused,
    {
      assertOwnsPractitionerProfile: (
        _em: unknown,
        id: string,
        user: AuthenticatedUser,
      ) => {
        if (id !== profileId || user.id !== actor.id)
          throw new Error('Synthetic profile ownership mismatch');
        return Promise.resolve();
      },
    } as never,
    unused,
    new AttachableFileService(files, versions, logger as never),
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    logger as never,
  );
}

/** Metadata-only synthetic fixture: never calls an upload/storage adapter. */
export async function givenFile(
  orm: MikroORM,
  options: {
    owner?: string;
    deleted?: boolean;
    noCurrent?: boolean;
    missingVersion?: boolean;
    mime?: string;
    infected?: boolean;
    deletedTimestamp?: boolean;
  } = {},
): Promise<string> {
  const em = orm.em.fork();
  const file = files.create(em, {
    tenantId,
    categoryConceptId: randomUUID(),
    sensitivityConceptId: randomUUID(),
    lifecycleStatusConceptId: options.deleted
      ? CONCEPTS.FILE_DELETED
      : CONCEPTS.FILE_ACTIVE,
    originalName: 'SYNTHETIC-NO-PERSONAL-DATA.pdf',
    actorUserId: options.owner ?? actor.id,
  });
  if (options.deletedTimestamp)
    file.deletedAt = new Date('2000-01-01T00:00:00Z');
  const version = versions.create(em, {
    fileId: file.id,
    versionNumber: 1,
    storageProviderConceptId: randomUUID(),
    storageRegionConceptId: randomUUID(),
    storageUri: `synthetic://unblocker/${file.id}`,
    mimeType: options.mime ?? 'application/pdf',
    sizeBytes: '0',
    checksumAlgorithmConceptId: randomUUID(),
    contentHash: 'synthetic-not-an-object-hash',
    encryptionStatusConceptId: randomUUID(),
    malwareScanStatusConceptId: options.infected
      ? CONCEPTS.SCAN_INFECTED
      : CONCEPTS.SCAN_PENDING,
    recordedAt: new Date(),
    recordedByUserId: actor.id,
  });
  if (!options.noCurrent)
    file.currentVersionId = options.missingVersion ? randomUUID() : version.id;
  await em.flush();
  return file.id;
}
