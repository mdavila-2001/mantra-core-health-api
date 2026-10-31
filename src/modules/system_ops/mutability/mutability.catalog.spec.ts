import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import catalogJson from './data/mutability.catalog.json';
import { CODE_FACTS, verifyCodeFact } from './extractor/code-facts';
import {
  EVIDENCE_LEVELS,
  compareLevel,
  type MutabilityCatalog,
} from './mutability.types';

const catalog = catalogJson as unknown as MutabilityCatalog;
// jest corre desde la raíz del repositorio y en ESM no hay `__dirname`.
const apiRoot = process.cwd();

describe('catálogo de mutabilidad generado: invariantes', () => {
  it('una tabla por clave, sin duplicados', () => {
    const keys = catalog.records.map((r) => `${r.schema}.${r.table}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('sin evidencia el modo es UNKNOWN con nivel UNKNOWN, y al revés', () => {
    for (const r of catalog.records)
      expect(r.writeMode === 'UNKNOWN').toBe(r.writeModeLevel === 'UNKNOWN');
  });

  it('el nivel declarado es el de la evidencia más fuerte que respalda el modo', () => {
    for (const r of catalog.records) {
      if (r.writeMode === 'UNKNOWN') continue;
      const strongest = r.evidence
        .filter((e) => e.supports === 'WRITE_MODE')
        .map((e) => e.level)
        .sort(compareLevel)[0];
      // el modo nunca declara una fuerza que ninguna evidencia sostenga
      expect(compareLevel(strongest, r.writeModeLevel)).toBeLessThanOrEqual(0);
    }
  });

  it('toda evidencia y todo hallazgo cita una fuente', () => {
    for (const r of catalog.records) {
      for (const e of r.evidence) {
        expect(e.source).toBeTruthy();
        expect(EVIDENCE_LEVELS).toContain(e.level);
      }
      for (const f of r.findings) {
        expect(f.a.source).toBeTruthy();
        if (f.code.includes('_VS_CODE')) expect(f.b?.source).toBeTruthy();
      }
    }
  });

  it('un plazo de retención sólo existe con fuente; sin plazo queda PENDIENTE_DE_CUMPLIMIENTO', () => {
    for (const r of catalog.records) {
      if (!r.retention) continue;
      expect(r.retention.status).toBe('PENDIENTE_DE_CUMPLIMIENTO');
      if (r.retention.days !== null) expect(r.retention.source).toBeTruthy();
      expect(r.disposition).toBe('PURGE_BY_RETENTION');
    }
    // sin política ni código que la ejecute, la disposición nunca es KEEP
    expect(catalog.records.some((r) => r.disposition === 'KEEP')).toBe(false);
  });

  it('las contradicciones no cambian el modo: una tabla declarada inmutable con UPDATE en código sigue declarada', () => {
    const r = catalog.records.find(
      (x) => x.schema === 'chart' && x.table === 'clinical_note_versions',
    )!;
    expect(r.writeMode).toBe('APPEND_ONLY');
    expect(r.writeModeLevel).toBe('DECLARED_MODEL');
    expect(r.findings.some((f) => f.code === 'DECLARED_VS_CODE_UPDATE')).toBe(
      true,
    );
  });

  it('cubre la base principal y las bases pay', () => {
    expect(
      catalog.records.filter((r) => r.database === 'main').length,
    ).toBeGreaterThan(1300);
    expect(catalog.records.filter((r) => r.database === 'pay').length).toBe(87);
  });
});

describe('hechos de código: siguen siendo ciertos', () => {
  it.each(CODE_FACTS.map((f) => [`${f.file}:${f.line}`, f] as const))(
    '%s',
    (_label, fact) => {
      const r = verifyCodeFact(fact, (file, line) => {
        const path = join(apiRoot, file);
        return existsSync(path)
          ? (readFileSync(path, 'utf8').split('\n')[line - 1] ?? null)
          : null;
      });
      expect(r.found).not.toBeNull();
      expect(r.ok).toBe(true);
    },
  );

  it('el módulo sigue sin ejecutores de retención genéricos (de ahí HOLD_CAPABLE_NOT_ENFORCED)', () => {
    const line = readFileSync(
      join(apiRoot, 'src/modules/system_ops/system_ops.module.ts'),
      'utf8',
    ).split('\n')[78];
    expect(line).toContain('RETENTION_DISPOSITION_EXECUTORS, useValue: []');
  });
});
