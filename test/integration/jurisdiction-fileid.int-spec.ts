import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../src/common';
import { JurisdictionAuthorizations } from '../../src/modules/profiles/entities/jurisdiction_authorizations.entity';
import { Files } from '../../src/modules/common/entities/files.entity';
import { profilesForeignKeys } from '../../src/orm/catalog/foreign-keys/profiles.fk';
import { profilesIndexes } from '../../src/orm/catalog/indexes/profiles.idx';
import {
  actor,
  api,
  authorizations,
  ddl,
  fkName,
  givenFile,
  indexName,
  materialize,
  PATCH,
  profileId,
  table,
} from './jurisdiction-fileid.testing';

// Opt-in, fresh isolated DB only. No dotenv, app bootstrap, workers, deletes or cleanup.
const isolated =
  process.env.UNBLOCKER_FILEID_TEST === 'synthetic-local-only'
    ? describe
    : describe.skip;
isolated.each(['clean', 'upgrade'] as const)(
  'v4.2.12 jurisdiction fileId (%s)',
  (mode) => {
    let orm: MikroORM;
    beforeAll(async () => {
      orm = await materialize(mode);
    });
    afterAll(async () => {
      if (orm) await orm.close(true);
    });

    it('materializes UUID nullable, nonunique BTREE, validated exact FK with NO ACTION', async () => {
      const connection = orm.em.getConnection();
      const columns = await connection.execute(
        `SELECT data_type, is_nullable, column_default
      FROM information_schema.columns WHERE table_schema = 'profiles' AND table_name = ? AND column_name = 'file_id'`,
        [table],
      );
      expect(columns).toEqual([
        { data_type: 'uuid', is_nullable: 'YES', column_default: null },
      ]);
      const fks = await connection.execute(
        `SELECT c.convalidated, c.confdeltype, c.confupdtype,
      c.condeferrable, pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c WHERE c.conrelid = 'profiles.jurisdiction_authorizations'::regclass AND c.conname = ?`,
        [fkName],
      );
      expect(fks).toEqual([
        {
          convalidated: true,
          confdeltype: 'a',
          confupdtype: 'a',
          condeferrable: false,
          definition: 'FOREIGN KEY (file_id) REFERENCES common.files(id)',
        },
      ]);
      const indexes = await connection.execute(
        `SELECT i.indisunique, i.indisvalid, am.amname,
      pg_get_indexdef(i.indexrelid) AS definition FROM pg_index i
      JOIN pg_class idx ON idx.oid = i.indexrelid JOIN pg_am am ON am.oid = idx.relam
      WHERE i.indrelid = 'profiles.jurisdiction_authorizations'::regclass AND idx.relname = ?`,
        [indexName],
      );
      expect(indexes).toEqual([
        {
          indisunique: false,
          indisvalid: true,
          amname: 'btree',
          definition: `CREATE INDEX ${indexName} ON profiles.jurisdiction_authorizations USING btree (file_id)`,
        },
      ]);
      expect(profilesForeignKeys).toContainEqual([
        table,
        'file_id',
        'common',
        'files',
        'id',
      ]);
      expect(profilesIndexes).toContainEqual([
        table,
        indexName,
        ['file_id'],
        false,
        'btree',
      ]);
    });

    it('persists fileId through the actual API service/repository and reloads from a new identity map', async () => {
      const fileId = await givenFile(orm);
      const response = await api(orm).addJurisdictionAuthorization(
        profileId,
        { licenseNumber: `SYNTHETIC-${randomUUID()}`, fileId },
        actor,
      );
      expect(response.fileId).toBe(fileId);
      const reloaded = await authorizations.findById(
        orm.em.fork(),
        response.id,
      );
      expect(reloaded?.fileId).toBe(fileId);
      const row = await orm.em
        .getConnection()
        .execute(
          'SELECT file_id FROM profiles.jurisdiction_authorizations WHERE id = ?',
          [response.id],
        );
      expect(row).toEqual([{ file_id: fileId }]);
    });

    it('persists NULL without an attachment; upgrade does not backfill synthetic old rows', async () => {
      const response = await api(orm).addJurisdictionAuthorization(
        profileId,
        { licenseNumber: `SYNTHETIC-${randomUUID()}` },
        actor,
      );
      const rows = await orm.em
        .getConnection()
        .execute(
          `SELECT file_id FROM profiles.jurisdiction_authorizations WHERE id = ? OR license_number = 'SYNTHETIC-PRE-V4212'`,
          [response.id],
        );
      expect(rows).toHaveLength(mode === 'upgrade' ? 2 : 1);
      expect(rows.every((row) => row.file_id === null)).toBe(true);
    });

    it('rejects a nonexistent file before publication', async () => {
      const licenseNumber = `SYNTHETIC-MISSING-${randomUUID()}`;
      await expect(
        api(orm).addJurisdictionAuthorization(
          profileId,
          { licenseNumber, fileId: randomUUID() },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(
        await orm.em
          .fork()
          .count(JurisdictionAuthorizations, { licenseNumber }),
      ).toBe(0);
    });

    it.each([
      ['foreign owner', { owner: randomUUID() }, ForbiddenException],
      ['deleted lifecycle', { deleted: true }, PreconditionFailedException],
      [
        'deleted timestamp',
        { deletedTimestamp: true },
        PreconditionFailedException,
      ],
      ['no current version', { noCurrent: true }, PreconditionFailedException],
      [
        'missing version',
        { missingVersion: true },
        PreconditionFailedException,
      ],
      [
        'disallowed MIME',
        { mime: 'application/x-executable' },
        PreconditionFailedException,
      ],
      ['infected version', { infected: true }, PreconditionFailedException],
    ] as const)(
      'rejects %s via existing file guards, with no authorization row',
      async (_name, options, error) => {
        const fileId = await givenFile(orm, options);
        const licenseNumber = `SYNTHETIC-DENY-${randomUUID()}`;
        await expect(
          api(orm).addJurisdictionAuthorization(
            profileId,
            { licenseNumber, fileId },
            actor,
          ),
        ).rejects.toBeInstanceOf(error);
        expect(
          await orm.em
            .fork()
            .count(JurisdictionAuthorizations, { licenseNumber }),
        ).toBe(0);
      },
    );

    it('the physical FK independently rejects nonexistent files, even if API guards are bypassed', async () => {
      const em = orm.em.fork();
      authorizations.create(em, {
        practitionerProfileId: profileId,
        jurisdictionConceptId: randomUUID(),
        licenseNumber: `SYNTHETIC-FK-${randomUUID()}`,
        stateConceptId: randomUUID(),
        fileId: randomUUID(),
      });
      await expect(em.flush()).rejects.toMatchObject({ code: '23503' });
    });

    it('catalog discovery sees the incoming edge and a shared attachment yields count 2 / DENY PHYSICAL DELETE', async () => {
      const fileId = await givenFile(orm);
      for (let i = 0; i < 2; i++)
        await api(orm).addJurisdictionAuthorization(
          profileId,
          { licenseNumber: `SYNTHETIC-SHARED-${randomUUID()}`, fileId },
          actor,
        );
      // Same pg_constraint edge discovery/count used by 7.2, read-only equivalent.
      // Does NOT instantiate a purge executor or evaluate unrelated lifecycle policy.
      const connection = orm.em.getConnection();
      const edges =
        await connection.execute(`SELECT ns.nspname AS schema_name, cls.relname AS table_name,
      att.attname AS column_name, ref.relname AS target, cardinality(con.conkey) AS columns
      FROM pg_constraint con JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace JOIN pg_class ref ON ref.oid = con.confrelid
      JOIN pg_namespace refns ON refns.oid = ref.relnamespace
      JOIN pg_attribute att ON att.attrelid = cls.oid AND att.attnum = con.conkey[1]
      WHERE con.contype = 'f' AND refns.nspname = 'common' AND ref.relname IN ('files', 'file_versions')`);
      const edge = edges.find((e) => e.table_name === table);
      if (!edge) throw new Error('Missing incoming FK in PostgreSQL catalog');
      expect(edge).toEqual({
        schema_name: 'profiles',
        table_name: table,
        column_name: 'file_id',
        target: 'files',
        columns: 1,
      });
      for (const identifier of [
        edge.schema_name,
        edge.table_name,
        edge.column_name,
      ])
        expect(identifier).toMatch(/^[a-z_][a-z0-9_]*$/);
      const count = await connection.execute(
        `SELECT count(*)::text AS count FROM "${edge.schema_name}"."${edge.table_name}" WHERE "${edge.column_name}" = ANY(?::uuid[])`,
        // MikroORM formats parameters before pg; supply a PostgreSQL UUID array
        // literal (UUID fixture only), equivalent to native pg's array binding.
        [`{${fileId}}`],
      );
      expect(count).toEqual([{ count: '2' }]);
      const decision =
        Number(count[0].count) > 0 ? 'DENY PHYSICAL DELETE' : 'NOT CERTIFIED';
      expect(decision).toBe('DENY PHYSICAL DELETE');
      expect(
        await orm.em.fork().findOneOrFail(Files, { id: fileId }),
      ).toBeDefined();
    });

    it('replaying the EXACT canonical patch preserves metadata and all synthetic references', async () => {
      const connection = orm.em.getConnection();
      const before = await connection.execute(
        'SELECT id, file_id FROM profiles.jurisdiction_authorizations ORDER BY id',
      );
      await connection.execute(ddl(`patches/${PATCH}`));
      await connection.execute(ddl(`patches/${PATCH}`));
      expect(
        await connection.execute(
          'SELECT id, file_id FROM profiles.jurisdiction_authorizations ORDER BY id',
        ),
      ).toEqual(before);
      const count = await connection.execute(
        'SELECT count(*)::text AS count FROM pg_constraint WHERE conrelid = ?::regclass AND conname = ?',
        ['profiles.jurisdiction_authorizations', fkName],
      );
      expect(count).toEqual([{ count: '1' }]);
    });
  },
);
