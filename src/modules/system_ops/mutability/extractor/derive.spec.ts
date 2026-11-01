import type { CodeFact } from './code-facts';
import type { CodeObservation } from './code-usage';
import type { MatrixDeclaration, PumlDeclaration } from './declarations';
import {
  dedupeBarriers,
  deriveMutability,
  resolveName,
  type DeriveInput,
  type KnownTable,
} from './derive';
import type { SqlBarrier } from './sql-source';

const table = (
  schema: string,
  name: string,
  columns: string[] = ['id'],
): KnownTable => ({
  schema,
  table: name,
  columns,
  source: `ddl:${schema}.${name}`,
  database: 'main',
});
const barrier = (over: Partial<SqlBarrier>): SqlBarrier => ({
  schema: 's',
  table: 't',
  via: 'TRIGGER',
  name: 'trg → forbid_mutation',
  update: 'ALL',
  delete: true,
  truncate: false,
  source: 'p.sql:1',
  conditional: false,
  retentionNote: false,
  ...over,
});
const puml = (
  name: string,
  stereotypes: string[],
  moduleSchema = 's',
): PumlDeclaration => ({
  name,
  stereotypes,
  moduleSchema,
  source: `d.puml:${name}`,
});
const matrix = (over: Partial<MatrixDeclaration>): MatrixDeclaration => ({
  name: 't',
  moduleSchema: 's',
  stereotypes: [],
  updateDeleteForbidden: false,
  updateForbidden: false,
  deleteRetentionOnly: false,
  truncateForbidden: false,
  retentionDays: null,
  retentionText: null,
  source: 'm.md:1',
  ...over,
});
const obs = (
  detalle: CodeObservation['detalle'],
  confianza: string,
  fuente = 'src/x.ts:1',
): CodeObservation => ({ detalle, confianza, fuente });

function run(over: Partial<DeriveInput> & { tables?: KnownTable[] }) {
  return deriveMutability({
    tables: [table('s', 't')],
    barriers: [],
    puml: [],
    matrix: [],
    readme: new Map(),
    code: new Map(),
    facts: [],
    genericExecutorsEmpty: null,
    ...over,
  });
}

describe('deriveMutability — modo de escritura', () => {
  it('sin ninguna evidencia: UNKNOWN y nivel UNKNOWN (no se rellena)', () => {
    const [r] = run({ tables: [table('s', 't', ['id', 'name'])] });
    expect(r.writeMode).toBe('UNKNOWN');
    expect(r.writeModeLevel).toBe('UNKNOWN');
    expect(r.disposition).toBe('UNKNOWN');
    expect(r.legalHold).toBe('UNKNOWN');
    expect(r.findings).toEqual([]);
    expect(r.evidence.some((e) => e.kind === 'STRUCTURE_HINT')).toBe(true);
  });

  it('trigger UPDATE+DELETE → APPEND_ONLY / ENFORCED_DB con la fuente exacta', () => {
    const [r] = run({ barriers: [barrier({})] });
    expect(r).toMatchObject({
      writeMode: 'APPEND_ONLY',
      writeModeLevel: 'ENFORCED_DB',
    });
    expect(r.evidence[0]).toMatchObject({
      kind: 'TRIGGER_BLOCK',
      source: 'p.sql:1',
      level: 'ENFORCED_DB',
    });
  });

  it('trigger sólo UPDATE → APPEND_ONLY_PURGEABLE', () => {
    const [r] = run({ barriers: [barrier({ delete: false })] });
    expect(r.writeMode).toBe('APPEND_ONLY_PURGEABLE');
  });

  it('guarda de ciclo de vida → LIFECYCLE_ONLY; un REVOKE de tabla no la convierte en APPEND_ONLY', () => {
    const [r] = run({
      barriers: [
        barrier({ update: 'PARTIAL', name: 'close_only' }),
        barrier({
          via: 'DYNAMIC_REVOKE',
          name: 'REVOKE',
          update: 'ALL',
          delete: true,
        }),
      ],
    });
    expect(r.writeMode).toBe('LIFECYCLE_ONLY');
  });

  it('REVOKE DELETE a la app sin más → UPDATABLE / ENFORCED_DB', () => {
    const [r] = run({
      barriers: [
        barrier({
          via: 'REVOKE',
          update: false,
          delete: true,
          conditional: true,
        }),
      ],
    });
    expect(r).toMatchObject({
      writeMode: 'UPDATABLE',
      writeModeLevel: 'ENFORCED_DB',
    });
  });

  it('sólo TRUNCATE no decide el modo', () => {
    const [r] = run({
      barriers: [barrier({ update: false, delete: false, truncate: true })],
    });
    expect(r.writeMode).toBe('UNKNOWN');
  });

  it('estereotipo IMMUTABLE sin barrera → APPEND_ONLY / DECLARED_MODEL y brecha DECLARED_NOT_ENFORCED', () => {
    const [r] = run({ puml: [puml('t', ['IMMUTABLE'])] });
    expect(r).toMatchObject({
      writeMode: 'APPEND_ONLY',
      writeModeLevel: 'DECLARED_MODEL',
    });
    expect(r.findings.map((f) => f.code)).toEqual(['DECLARED_NOT_ENFORCED']);
    expect(r.findings[0].kind).toBe('GAP');
  });

  it('<<HISTORY>>/<<LOG>> no declaran inmutabilidad: sólo contexto', () => {
    const [r] = run({ puml: [puml('t', ['HISTORY'])] });
    expect(r.writeMode).toBe('UNKNOWN');
    expect(r.evidence.find((e) => e.kind === 'STEREOTYPE_CONTEXT')?.level).toBe(
      'INFERRED',
    );
  });

  it('README sólo → APPEND_ONLY / DECLARED_DOC, brecha de severidad baja', () => {
    const [r] = run({
      readme: new Map([['s.t', [{ fuente: 'src/modules/s/README.md:9' }]]]),
    });
    expect(r).toMatchObject({
      writeMode: 'APPEND_ONLY',
      writeModeLevel: 'DECLARED_DOC',
    });
    expect(r.findings[0]).toMatchObject({
      code: 'DECLARED_NOT_ENFORCED',
      severity: 'LOW',
    });
  });

  it('la matriz con «UPDATE prohibido; DELETE por retención» → APPEND_ONLY_PURGEABLE declarado', () => {
    const [r] = run({
      puml: [puml('t', ['APPEND_ONLY'])],
      matrix: [matrix({ updateForbidden: true, deleteRetentionOnly: true })],
    });
    expect(r.writeMode).toBe('APPEND_ONLY_PURGEABLE');
    expect(r.writeModeLevel).toBe('DECLARED_MODEL');
  });

  it('la barrera física gana al estereotipo', () => {
    const [r] = run({
      barriers: [barrier({ delete: false })],
      puml: [puml('t', ['IMMUTABLE'])],
    });
    expect(r).toMatchObject({
      writeMode: 'APPEND_ONLY_PURGEABLE',
      writeModeLevel: 'ENFORCED_DB',
    });
  });

  it('código: BORRA directo → UPDATABLE_DELETABLE / ENFORCED_CODE; ACTUALIZA directo → UPDATABLE / ENFORCED_CODE', () => {
    const del = run({
      code: new Map([
        ['s.t', [obs('BORRA', 'POR_SQL'), obs('ACTUALIZA', 'DIRECTA')]],
      ]),
    })[0];
    expect(del).toMatchObject({
      writeMode: 'UPDATABLE_DELETABLE',
      writeModeLevel: 'ENFORCED_CODE',
    });
    const upd = run({
      code: new Map([['s.t', [obs('ACTUALIZA', 'DIRECTA')]]]),
    })[0];
    expect(upd).toMatchObject({
      writeMode: 'UPDATABLE',
      writeModeLevel: 'ENFORCED_CODE',
    });
  });

  it('código inferido por tipo de endpoint (POR_TIPO) sólo llega a INFERRED', () => {
    const [r] = run({
      code: new Map([['s.t', [obs('ACTUALIZA', 'POR_TIPO')]]]),
    });
    expect(r).toMatchObject({
      writeMode: 'UPDATABLE',
      writeModeLevel: 'INFERRED',
    });
  });

  it('columnas: deleted_at → SOFT_DELETE INFERRED; row_version → UPDATABLE INFERRED', () => {
    expect(
      run({ tables: [table('s', 't', ['id', 'deleted_at'])] })[0],
    ).toMatchObject({ writeMode: 'SOFT_DELETE', writeModeLevel: 'INFERRED' });
    expect(
      run({ tables: [table('s', 't', ['id', 'row_version'])] })[0],
    ).toMatchObject({ writeMode: 'UPDATABLE', writeModeLevel: 'INFERRED' });
  });
});

describe('deriveMutability — contradicciones (se registran, no se resuelven)', () => {
  it('declarada inmutable con ACTUALIZA directo: CONTRADICTION con ambas evidencias y el modo NO cambia', () => {
    const [r] = run({
      puml: [puml('t', ['IMMUTABLE'])],
      code: new Map([['s.t', [obs('ACTUALIZA', 'DIRECTA', 'src/a.ts:5')]]]),
    });
    const f = r.findings.find((x) => x.code === 'DECLARED_VS_CODE_UPDATE');
    expect(f).toMatchObject({ kind: 'CONTRADICTION', severity: 'HIGH' });
    expect(f?.a.source).toBe('d.puml:t');
    expect(f?.b?.source).toBe('src/a.ts:5');
    // el modo sigue siendo el declarado: la contradicción no elige bando
    expect(r.writeMode).toBe('APPEND_ONLY');
    expect(r.writeModeLevel).toBe('DECLARED_MODEL');
  });

  it('si la contradicción es sólo inferida (POR_TIPO) la severidad es baja y lo dice', () => {
    const [r] = run({
      puml: [puml('t', ['IMMUTABLE'])],
      code: new Map([['s.t', [obs('ACTUALIZA', 'POR_TIPO')]]]),
    });
    const f = r.findings.find((x) => x.kind === 'CONTRADICTION');
    expect(f?.severity).toBe('LOW');
    expect(f?.summary).toContain('inferida');
  });

  it('barrera física + BORRA en código: ENFORCED_VS_CODE_DELETE', () => {
    const [r] = run({
      barriers: [barrier({})],
      puml: [puml('t', ['IMMUTABLE'])],
      code: new Map([['s.t', [obs('BORRA', 'DIRECTA')]]]),
    });
    expect(r.findings.map((f) => f.code)).toContain('ENFORCED_VS_CODE_DELETE');
    expect(r.findings.map((f) => f.code)).not.toContain(
      'DECLARED_VS_CODE_DELETE',
    );
  });

  it('declarada «DELETE sólo por retención»: un BORRA en código NO es contradicción', () => {
    const [r] = run({
      matrix: [matrix({ updateForbidden: true, deleteRetentionOnly: true })],
      code: new Map([['s.t', [obs('BORRA', 'DIRECTA')]]]),
    });
    expect(r.findings.filter((f) => f.kind === 'CONTRADICTION')).toEqual([]);
  });

  it('barrera sin ninguna declaración: ENFORCED_WITHOUT_DECLARATION', () => {
    const [r] = run({ barriers: [barrier({})] });
    expect(r.findings.map((f) => f.code)).toEqual([
      'ENFORCED_WITHOUT_DECLARATION',
    ]);
  });

  it('deleted_at pero el código también borra con DELETE: SOFT_COLUMN_VS_HARD_DELETE', () => {
    const [r] = run({
      tables: [table('s', 't', ['id', 'deleted_at'])],
      code: new Map([['s.t', [obs('BORRA', 'POR_SQL')]]]),
    });
    expect(r.findings.map((f) => f.code)).toContain(
      'SOFT_COLUMN_VS_HARD_DELETE',
    );
    expect(r.writeMode).toBe('UPDATABLE_DELETABLE');
  });
});

describe('deriveMutability — retención y legal hold', () => {
  const fact: CodeFact = {
    schema: 's',
    table: 't',
    kind: 'PURGE_PATH',
    disposition: 'PURGE_BY_RETENTION',
    claim: 'purga',
    file: 'src/p.ts',
    line: 3,
    contains: 'x',
  };

  it('el plazo sólo se copia si una fuente lo declara y siempre queda PENDIENTE_DE_CUMPLIMIENTO', () => {
    const [declared] = run({
      matrix: [
        matrix({
          updateForbidden: true,
          deleteRetentionOnly: true,
          retentionDays: 14,
          retentionText: 'RETENTION 14 days',
        }),
      ],
    });
    expect(declared.disposition).toBe('PURGE_BY_RETENTION');
    expect(declared.retention).toEqual({
      days: 14,
      source: 'm.md:1',
      status: 'PENDIENTE_DE_CUMPLIMIENTO',
    });

    const [noPeriod] = run({ facts: [fact] });
    expect(noPeriod.disposition).toBe('PURGE_BY_RETENTION');
    expect(noPeriod.dispositionLevel).toBe('ENFORCED_CODE');
    expect(noPeriod.retention).toEqual({
      days: null,
      source: null,
      status: 'PENDIENTE_DE_CUMPLIMIENTO',
    });
  });

  it('sin política ni código: la disposición es UNKNOWN, nunca KEEP', () => {
    expect(run({ barriers: [barrier({})] })[0].disposition).toBe('UNKNOWN');
  });

  it('HOLD_AWARE sólo con un resolvedor en código; HOLD_CAPABLE_NOT_ENFORCED con vía de borrado y sin barrido genérico', () => {
    const aware = run({
      facts: [
        {
          ...fact,
          kind: 'HOLD_RESOLVER',
          disposition: undefined,
          legalHold: 'HOLD_AWARE',
        },
      ],
    })[0];
    expect(aware.legalHold).toBe('HOLD_AWARE');
    const capable = run({
      facts: [fact],
      genericExecutorsEmpty: { source: 'mod.ts:79' },
    })[0];
    expect(capable.legalHold).toBe('HOLD_CAPABLE_NOT_ENFORCED');
    expect(capable.evidence.some((e) => e.kind === 'CODE_NO_HOLD_SWEEP')).toBe(
      true,
    );
    const unknown = run({ facts: [fact] })[0];
    expect(unknown.legalHold).toBe('UNKNOWN');
    const noPath = run({ genericExecutorsEmpty: { source: 'mod.ts:79' } })[0];
    expect(noPath.legalHold).toBe('UNKNOWN');
  });
});

describe('utilidades', () => {
  const known = new Set(['audit.audit_log', 'iam.users', 'a.dup', 'b.dup']);
  const byName = new Map([
    ['audit_log', ['audit.audit_log']],
    ['dup', ['a.dup', 'b.dup']],
  ]);
  it('resolveName: calificado, por schema del módulo, único por nombre, ambiguo → null', () => {
    expect(resolveName('iam.users', null, known, byName)).toBe('iam.users');
    expect(resolveName('audit_log', 'audit', known, byName)).toBe(
      'audit.audit_log',
    );
    expect(resolveName('audit_log', 'otro', known, byName)).toBe(
      'audit.audit_log',
    );
    expect(resolveName('dup', 'zzz', known, byName)).toBeNull();
    expect(resolveName('nope.x', null, known, byName)).toBeNull();
  });
  it('dedupeBarriers une las fuentes de la misma barrera', () => {
    const out = dedupeBarriers([
      barrier({ source: 'a:1' }),
      barrier({ source: 'b:2' }),
      barrier({ source: 'a:1' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('a:1 ; b:2');
  });
});
