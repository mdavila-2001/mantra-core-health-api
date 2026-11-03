import {
  parseDynamicArrayRevoke,
  parseDynamicCloseOnly,
  parseSqlBarriers,
  parseSqlTables,
} from './sql-source';

const TABLES = `
CREATE TABLE IF NOT EXISTS "audit"."audit_log" (
    "id" uuid NOT NULL,
    "created_at" timestamptz NOT NULL,
    CONSTRAINT "pk_audit_log" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "common"."files" (
    "id" uuid NOT NULL,
    "name" varchar(100) NOT NULL
);
ALTER TABLE "common"."files" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz, ADD COLUMN IF NOT EXISTS "row_version" integer;
`;

describe('parseSqlTables', () => {
  it('lee tablas calificadas con sus columnas y las que agrega un ALTER TABLE', () => {
    const tables = parseSqlTables(TABLES, 'x.sql');
    expect(tables.map((t) => `${t.schema}.${t.table}`)).toEqual([
      'audit.audit_log',
      'common.files',
    ]);
    expect(tables[0].columns).toEqual(['id', 'created_at']);
    expect(tables[1].columns).toEqual([
      'id',
      'name',
      'deleted_at',
      'row_version',
    ]);
    expect(tables[0].source).toBe('x.sql:2');
  });

  it('en las bases pay las tablas no llevan schema: usa el que se le pasa', () => {
    const t = parseSqlTables(
      'CREATE TABLE IF NOT EXISTS "ledger_legs" (\n "id" text NOT NULL\n);',
      'ddl.sql',
      'pay_ledger',
    );
    expect(t[0]).toMatchObject({ schema: 'pay_ledger', table: 'ledger_legs' });
  });

  it('no inventa tablas desde texto que no es un CREATE TABLE', () => {
    expect(parseSqlTables('-- CREATE TABLE sin paren', 'x.sql')).toEqual([]);
  });
});

describe('parseSqlBarriers', () => {
  it('UPDATE OR DELETE con forbid_mutation bloquea ambos', () => {
    const [b] = parseSqlBarriers(
      `CREATE TRIGGER trg_forbid_mutation BEFORE UPDATE OR DELETE ON "audit"."audit_log"
    FOR EACH ROW EXECUTE FUNCTION "integrity"."forbid_mutation"();`,
      'f.sql',
    );
    expect(b).toMatchObject({
      schema: 'audit',
      table: 'audit_log',
      update: 'ALL',
      delete: true,
      truncate: false,
      via: 'TRIGGER',
      source: 'f.sql:1',
    });
  });

  it('BEFORE UPDATE solo deja el DELETE abierto y detecta el comentario de retención', () => {
    const [b] = parseSqlBarriers(
      `-- UPDATE: forbidden → barrera física parcial (DELETE permitido: retención)
CREATE TRIGGER trg_forbid_update BEFORE UPDATE ON "audit"."data_access_log"
    FOR EACH ROW EXECUTE FUNCTION "integrity"."forbid_mutation"();`,
      'f.sql',
    );
    expect(b.update).toBe('ALL');
    expect(b.delete).toBe(false);
    expect(b.retentionNote).toBe(true);
  });

  it('BEFORE TRUNCATE sólo bloquea TRUNCATE', () => {
    const [b] = parseSqlBarriers(
      `CREATE TRIGGER t BEFORE TRUNCATE ON "a"."b" FOR EACH STATEMENT EXECUTE FUNCTION "integrity"."forbid_truncate"();`,
      'f.sql',
    );
    expect(b).toMatchObject({ update: false, delete: false, truncate: true });
  });

  it('una guarda de ciclo de vida bloquea el UPDATE sólo en parte', () => {
    const [b] = parseSqlBarriers(
      `CREATE TRIGGER trg_guard_policy_revision BEFORE UPDATE OR DELETE ON "system_ops"."governance_policy_revisions"
    FOR EACH ROW EXECUTE FUNCTION "system_ops"."guard_governance_policy_revision"();`,
      'f.sql',
    );
    expect(b).toMatchObject({ update: 'PARTIAL', delete: true });
  });

  it('ignora disparadores que no son de mutabilidad (consistencia de tenant)', () => {
    expect(
      parseSqlBarriers(
        `CREATE TRIGGER trg_support_tenant_consistency BEFORE INSERT OR UPDATE ON "a"."b" FOR EACH ROW EXECUTE FUNCTION "integrity"."support_tenant_consistency"();`,
        'f.sql',
      ),
    ).toEqual([]);
  });

  it('REVOKE a mantra_app cuenta; REVOKE a PUBLIC no, y marca si es condicional al rol', () => {
    const out = parseSqlBarriers(
      `REVOKE UPDATE, DELETE ON "audit"."audit_log" FROM PUBLIC;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mantra_app') THEN
        REVOKE UPDATE, TRUNCATE ON "observability"."error_events" FROM mantra_app;
    END IF;
END $$;`,
      'f.sql',
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      schema: 'observability',
      table: 'error_events',
      via: 'REVOKE',
      update: 'ALL',
      delete: false,
      truncate: true,
      conditional: true,
    });
  });

  it('en pay lee funciones sin calificar y el default schema', () => {
    const out = parseSqlBarriers(
      `CREATE TRIGGER ledger_legs_immutable BEFORE UPDATE OR DELETE ON ledger_legs FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER connector_charges_monotone_trg BEFORE UPDATE ON connector_charges FOR EACH ROW EXECUTE FUNCTION connector_charges_send_claims_monotone();`,
      'ddl.sql',
      'pay_x',
    );
    expect(out.map((b) => [b.table, b.update, b.delete])).toEqual([
      ['ledger_legs', 'ALL', true],
      ['connector_charges', 'PARTIAL', false],
    ]);
  });
});

describe('patrones dinámicos', () => {
  const closeOnly = `
        SELECT * FROM (VALUES
            ('practice_sites_history', 'practice.practice_sites', 'practice_site_id'),
            ('care_spaces_history',    'practice.care_spaces',    'care_space_id')
        ) AS v(historia, origen, columna)
    LOOP
        EXECUTE format('CREATE TRIGGER trg_close_only BEFORE UPDATE OR DELETE ON "audit".%I FOR EACH ROW EXECUTE FUNCTION "audit"."structure_history_close_only"()',
                       r.historia);`;

  it('lista VALUES + trg_close_only: una guarda por tabla de la lista', () => {
    const out = parseDynamicCloseOnly(closeOnly, 'p.sql');
    expect(out.map((b) => `${b.schema}.${b.table}`)).toEqual([
      'audit.practice_sites_history',
      'audit.care_spaces_history',
    ]);
    expect(out[0]).toMatchObject({ update: 'PARTIAL', delete: true });
  });

  it('un trigger dinámico con función desconocida no se cuenta', () => {
    expect(
      parseDynamicCloseOnly(
        closeOnly.replace('structure_history_close_only', 'otra_funcion'),
        'p.sql',
      ),
    ).toEqual([]);
  });

  it('ARRAY + REVOKE %s: una barrera por elemento del arreglo', () => {
    const out = parseDynamicArrayRevoke(
      `historias text[] := ARRAY[
        'audit.practice_sites_history',
        'audit.care_spaces_history'
    ];
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mantra_app') THEN
        FOREACH t IN ARRAY historias LOOP
            EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON %s FROM mantra_app', t);`,
      'p.sql',
    );
    expect(out.map((b) => b.table)).toEqual([
      'practice_sites_history',
      'care_spaces_history',
    ]);
    expect(out[0]).toMatchObject({
      update: 'ALL',
      delete: true,
      truncate: true,
    });
  });
});
