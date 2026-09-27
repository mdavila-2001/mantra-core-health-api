import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACCESSIBLE_CONTENT_LIMITS } from '../../common/dto/accessible-content.dto';

const read = (path: string) =>
  readFileSync(join(process.cwd(), 'database/SQL', path), 'utf8').replaceAll(
    '\r\n',
    '\n',
  );
const patch =
  'patches/2026-09-26_v4233_files_diagnostic_reports_accessibility.sql';

/** Las dos tablas que ganan los textos, con el DDL que las declara. */
const TABLAS = [
  { schema: 'common', tabla: 'files', ddl: '02_common/02_tables.sql' },
  {
    schema: 'clinical',
    tabla: 'diagnostic_reports',
    ddl: '08_clinical/02_tables.sql',
  },
] as const;

/** Columna SQL → clave del tope en la API. */
const COLUMNAS = [
  ['alt_text', 'altText'],
  ['description', 'description'],
  ['transcription', 'transcription'],
] as const;

describe('v4.2.33 · textos accesibles de archivos y reportes (contrato DDL ↔ API)', () => {
  it.each(TABLAS)(
    '$schema.$tabla declara las tres columnas opcionales en su 02_tables.sql',
    ({ schema, tabla, ddl }) => {
      const bloque = read(ddl).match(
        new RegExp(
          `CREATE TABLE IF NOT EXISTS "${schema}"\\."${tabla}" \\([\\s\\S]*?\\n\\);`,
        ),
      )?.[0];
      expect(bloque).toBeDefined();
      expect(bloque).toMatch(/\n\s+"alt_text" varchar,\n/);
      expect(bloque).toMatch(/\n\s+"description" text,\n/);
      expect(bloque).toMatch(/\n\s+"transcription" text,\n/);
    },
  );

  it.each(TABLAS)(
    'el parche agrega a $schema.$tabla las columnas y un CHECK por columna con el tope de la API',
    ({ schema, tabla }) => {
      const sql = read(patch);
      for (const [columna, clave] of COLUMNAS) {
        expect(sql).toContain(
          `ALTER TABLE "${schema}"."${tabla}"\n    ADD COLUMN IF NOT EXISTS "${columna}"`,
        );
        expect(sql).toContain(
          `CHECK ("${columna}" IS NULL OR char_length("${columna}") <= ${ACCESSIBLE_CONTENT_LIMITS[clave]})`,
        );
      }
    },
  );

  it('el parche es aditivo: sin backfill ni borrado de datos', () => {
    expect(read(patch)).not.toMatch(/^\s*(UPDATE|DELETE|TRUNCATE)\s/gim);
    expect(read(patch)).not.toMatch(/DROP\s+(TABLE|COLUMN)/i);
  });
});
