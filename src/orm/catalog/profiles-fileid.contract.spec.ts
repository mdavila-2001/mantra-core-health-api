import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { profilesForeignKeys } from './foreign-keys/profiles.fk';
import { profilesIndexes } from './indexes/profiles.idx';

const read = (path: string) =>
  readFileSync(join(process.cwd(), 'database/SQL', path), 'utf8');
const table = 'jurisdiction_authorizations';
const patch =
  'patches/2026-09-13_v4212_jurisdiction_authorizations_file_id.sql';

describe('profiles.fileId / canonical Model PR #20', () => {
  it('reuses the approved patch verbatim (LF-normalized for Git Windows checkouts)', () => {
    // Model cb1c4f5de1843c811d1d5321302993b694f30ab0, not a newly authored migration.
    expect(
      createHash('sha256')
        .update(read(patch).replaceAll('\r\n', '\n'))
        .digest('hex'),
    ).toBe('49b071762c8f8fef1d6c0597ab7e02ef77dfa4de121e684c3d19e8a35cdbe3c3');
  });

  it('declares the optional UUID on the correct table, without a default/backfill', () => {
    const sql = read('05_profiles/02_tables.sql').match(
      /CREATE TABLE IF NOT EXISTS "profiles"\."jurisdiction_authorizations" \([\s\S]*?\n\);/,
    )?.[0];
    expect(sql).toMatch(/\n\s+"file_id" uuid,\r?\n/);
    expect(read(patch)).not.toMatch(/^\s*(UPDATE|DELETE|TRUNCATE|DROP)\s/gim);
  });

  it('publishes exactly one matching FK tuple and canonical deferred DDL without a cascade', () => {
    expect(
      profilesForeignKeys.filter(
        (row) => row[0] === table && row[1] === 'file_id',
      ),
    ).toEqual([[table, 'file_id', 'common', 'files', 'id']]);
    expect(read('05_profiles/90_fk_deferred.sql')).toMatch(
      /ADD CONSTRAINT "fk_jurisdiction_authorizations_file_id" FOREIGN KEY \("file_id"\)\s+REFERENCES "common"\."files" \("id"\);/,
    );
  });

  it('publishes a nonunique BTREE index, not a uniqueness requirement for shared files', () => {
    expect(
      profilesIndexes.filter(
        (row) =>
          row[0] === table &&
          row[1] === 'ix_jurisdiction_authorizations_file_id',
      ),
    ).toEqual([
      [
        table,
        'ix_jurisdiction_authorizations_file_id',
        ['file_id'],
        false,
        'btree',
      ],
    ]);
    expect(read('05_profiles/04_indexes.sql')).toContain(
      'CREATE INDEX IF NOT EXISTS "ix_jurisdiction_authorizations_file_id" ON "profiles"."jurisdiction_authorizations" ("file_id");',
    );
  });

  it('reports the profiles counts that the vendored profiles DDL actually declares', () => {
    // Antes fijaba la fila literal de v4.2.12 (127 FK · 136 índices). El módulo
    // siguió creciendo en el modelo y la fila quedó vieja; lo que este contrato
    // protege es que el reporte vendorizado describa el DDL vendorizado, así que
    // la fila esperada se deriva de los mismos archivos.
    const foreignKeys =
      read('05_profiles/03_fk_intra.sql') +
      read('05_profiles/90_fk_deferred.sql');
    const tables = read('05_profiles/02_tables.sql').match(
      /^CREATE TABLE IF NOT EXISTS /gm,
    )?.length;
    const fkCount = foreignKeys.match(/ FOREIGN KEY \(/g)?.length;
    const inferredCount = foreignKeys.match(
      /-- \(inferida por convención\)/g,
    )?.length;
    const indexCount = read('05_profiles/04_indexes.sql').match(
      /^CREATE (UNIQUE )?INDEX IF NOT EXISTS /gm,
    )?.length;
    expect(read('_generation_report.md')).toContain(
      `| 05 | profiles | ${tables} | ${fkCount} | ${inferredCount ?? 0} | ${indexCount} | 0 |`,
    );
  });
});
