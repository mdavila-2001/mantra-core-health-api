import { parseIntegrityMatrix, parsePumlDeclarations } from './declarations';

describe('parsePumlDeclarations', () => {
  const puml = `@startuml
title Module 10 — Audit\\n(schema: audit)
entity "iam.sessions" as iam_sessions <<REFERENCE_ONLY>> { * id : uuid <<PK>> }
entity audit_log <<LOG>> {
entity clinical_note_versions <<IMMUTABLE>> {
entity "INDEXES · x" as idxset_x <<INDEX_SET>> {
entity data_access_log <<APPEND_ONLY>> <<LOG>> {
entity plain_table {
`;
  it('devuelve estereotipos, schema del módulo y línea; descarta referencias e índices', () => {
    const out = parsePumlDeclarations(puml, 'd.puml');
    expect(out.map((d) => [d.name, d.stereotypes, d.source])).toEqual([
      ['audit_log', ['LOG'], 'd.puml:4'],
      ['clinical_note_versions', ['IMMUTABLE'], 'd.puml:5'],
      ['data_access_log', ['APPEND_ONLY', 'LOG'], 'd.puml:7'],
    ]);
    expect(out[0].moduleSchema).toBe('audit');
  });
});

describe('parseIntegrityMatrix', () => {
  const md = `### Módulo 10 · \`audit\`

| Tabla | Estereotipo | Reglas declaradas |
|-------|-------------|-------------------|
| \`audit_log\` | \`IMMUTABLE, REFERENCE_ONLY\` | **UPDATE_DELETE** forbidden |
| \`data_access_log\` | \`APPEND_ONLY, REFERENCE_ONLY\` | **UPDATE** forbidden; **DELETE** retention purge only (UC-10-09) |

### Módulo 70 · \`observability\`

| \`observability.error_events\` | \`LOG, REFERENCE_ONLY\` | **UPDATE** forbidden; **RETENTION** 14 days raw (drop_chunks; DELETE allowed) |
| \`authz.permissions\` | \`REFERENCE_ONLY\` | **CHECK_SQL** ck_x \\| "a" > 0 |
`;
  it('extrae las reglas de escritura y el plazo declarado, y salta las filas sin reglas de mutabilidad', () => {
    const rows = parseIntegrityMatrix(md, 'm.md');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      name: 'audit_log',
      moduleSchema: 'audit',
      updateDeleteForbidden: true,
      updateForbidden: true,
      deleteRetentionOnly: false,
      source: 'm.md:5',
    });
    expect(rows[1]).toMatchObject({
      updateForbidden: true,
      updateDeleteForbidden: false,
      deleteRetentionOnly: true,
    });
    expect(rows[2]).toMatchObject({
      name: 'observability.error_events',
      retentionDays: 14,
    });
    expect(rows[2].retentionText).toContain('RETENTION');
  });
});
