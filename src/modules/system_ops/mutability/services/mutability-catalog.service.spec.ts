import { jest } from '@jest/globals';
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { GOVERNANCE_VIEW_ROLES } from '../../../../common/auth/governance-read.roles';
import { MutabilityController } from '../controllers/mutability.controller';
import { ListMutabilityQueryDto } from '../dto/mutability.dto';
import { MutabilityCatalogService } from './mutability-catalog.service';
import { MutabilityLookupService } from './mutability-lookup.service';
import { MutabilityRegistryReader } from './mutability-registry.reader';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const registryWith = (keys: string[] | null) =>
  ({
    registeredKeys: mockFn(() => Promise.resolve(keys ? new Set(keys) : null)),
  }) as unknown as MutabilityRegistryReader;

describe('MutabilityCatalogService', () => {
  const service = new MutabilityCatalogService(
    registryWith(['audit.audit_log']),
  );

  it('lista paginada con total y cursor, ordenada por schema.tabla', async () => {
    const first = await service.list({ limit: 5 } as ListMutabilityQueryDto);
    expect(first.items).toHaveLength(5);
    expect(first.total).toBe(service.all().length);
    expect(first.nextCursor).not.toBeNull();
    const keys = first.items.map((i) => `${i.schema}.${i.table}`);
    expect([...keys].sort()).toEqual(keys);
    const second = await service.list({
      limit: 5,
      cursor: first.nextCursor!,
    } as ListMutabilityQueryDto);
    expect(second.items[0]).not.toEqual(first.items[4]);
    expect(`${second.items[0].schema}.${second.items[0].table}` > keys[4]).toBe(
      true,
    );
  });

  it('filtra por schema, modo, evidencia, hallazgo y texto', async () => {
    const byMode = await service.list({
      writeMode: 'LIFECYCLE_ONLY',
      limit: 200,
    } as ListMutabilityQueryDto);
    expect(byMode.items.length).toBeGreaterThan(0);
    expect(byMode.items.every((i) => i.writeMode === 'LIFECYCLE_ONLY')).toBe(
      true,
    );

    const enforced = await service.list({
      evidence: 'ENFORCED_DB',
      limit: 200,
    } as ListMutabilityQueryDto);
    expect(
      enforced.items.every((i) => i.writeModeLevel === 'ENFORCED_DB'),
    ).toBe(true);

    const contradictions = await service.list({
      finding: 'CONTRADICTION',
      limit: 200,
    } as ListMutabilityQueryDto);
    expect(contradictions.items.length).toBeGreaterThan(0);
    expect(contradictions.items.every((i) => i.contradictions > 0)).toBe(true);

    const none = await service.list({
      finding: 'NONE',
      limit: 200,
    } as ListMutabilityQueryDto);
    expect(
      none.items.every((i) => i.contradictions === 0 && i.gaps === 0),
    ).toBe(true);

    const text = await service.list({
      q: 'AUDIT_LOG',
      schema: 'audit',
    } as ListMutabilityQueryDto);
    expect(text.items.map((i) => i.table)).toContain('audit_log');

    const pay = await service.list({
      database: 'pay',
      limit: 200,
    } as ListMutabilityQueryDto);
    expect(pay.items.every((i) => i.database === 'pay')).toBe(true);
  });

  it('marca registered desde el registro; si no se pudo consultar es null (no «No»)', async () => {
    const hit = await service.list({
      q: 'audit_log',
      schema: 'audit',
    } as ListMutabilityQueryDto);
    expect(hit.items.find((i) => i.table === 'audit_log')?.registered).toBe(
      true,
    );
    const other = await service.list({
      q: 'data_access_log',
      schema: 'audit',
    } as ListMutabilityQueryDto);
    expect(
      other.items.find((i) => i.table === 'data_access_log')?.registered,
    ).toBe(false);
    const blind = new MutabilityCatalogService(registryWith(null));
    const page = await blind.list({ limit: 1 } as ListMutabilityQueryDto);
    expect(page.items[0].registered).toBeNull();
  });

  it('detalle: evidencia con fuente y contradicciones con ambas caras; tabla inexistente → 404', async () => {
    const d = await service.detail('chart', 'clinical_note_versions');
    expect(d.evidence.length).toBeGreaterThan(0);
    expect(d.evidence.every((e) => e.source && e.level && e.kind)).toBe(true);
    const c = d.findings.find((f) => f.kind === 'CONTRADICTION')!;
    expect(c.a.source).toBeTruthy();
    expect(c.b?.source).toContain('chart-notes.service.ts');
    await expect(service.detail('nope', 'nada')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('resumen: cada modo y cada nivel con numerador y denominador, y la suma cierra', async () => {
    const s = await service.summary();
    expect(s.totalTables).toBe(service.all().length);
    expect(s.byWriteMode.reduce((n, m) => n + m.numerator, 0)).toBe(
      s.totalTables,
    );
    expect(s.byEvidence.reduce((n, m) => n + m.numerator, 0)).toBe(
      s.totalTables,
    );
    expect(s.byWriteMode.every((m) => m.denominator === s.totalTables)).toBe(
      true,
    );
    const unknown = s.byWriteMode.find((m) => m.writeMode === 'UNKNOWN')!;
    expect(s.decided.numerator).toBe(s.totalTables - unknown.numerator);
    expect(
      s.findingCodes.some(
        (c) => c.code === 'DECLARED_NOT_ENFORCED' && c.kind === 'GAP',
      ),
    ).toBe(true);
    expect(s.registered).toEqual({ numerator: 1, denominator: s.totalTables });
    expect(s.pendingCompliance).toBeGreaterThanOrEqual(s.withDeclaredPeriod);
  });
});

describe('MutabilityLookupService (punto de extensión de la sonda)', () => {
  const lookup = new MutabilityLookupService(
    new MutabilityCatalogService(registryWith([])),
  );
  it('devuelve el modo declarado con su nivel y si está en disputa', () => {
    expect(lookup.declared('audit', 'audit_log')).toMatchObject({
      writeMode: 'APPEND_ONLY',
      writeModeLevel: 'ENFORCED_DB',
      contested: false,
    });
    expect(lookup.declared('chart', 'clinical_note_versions')).toMatchObject({
      writeMode: 'APPEND_ONLY',
      contested: true,
    });
  });
  it('una tabla que el catálogo no conoce es null, distinto de UNKNOWN', () => {
    expect(lookup.declared('x', 'y')).toBeNull();
  });
});

describe('MutabilityController', () => {
  it('las tres lecturas exigen los mismos roles de lectura de gobierno que GovernanceReadController', () => {
    for (const method of ['list', 'summary', 'detail'] as const) {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        Reflect.get(MutabilityController.prototype, method) as object,
      ) as readonly string[] | undefined;
      expect(roles).toEqual([...GOVERNANCE_VIEW_ROLES]);
    }
  });

  it('delega en el servicio', async () => {
    const svc = { list: mockFn(), summary: mockFn(), detail: mockFn() };
    const c = new MutabilityController(svc as never);
    await c.list({ q: 'x' } as never);
    await c.summary();
    await c.detail('audit', 'audit_log');
    expect(svc.list).toHaveBeenCalledWith({ q: 'x' });
    expect(svc.detail).toHaveBeenCalledWith('audit', 'audit_log');
  });

  it('valida los filtros: rechaza valores fuera de catálogo y campos no declarados', async () => {
    const check = (input: object) =>
      validate(plainToInstance(ListMutabilityQueryDto, input), {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
    expect(
      await check({
        writeMode: 'APPEND_ONLY',
        evidence: 'ENFORCED_DB',
        finding: 'ANY',
        limit: '20',
      }),
    ).toEqual([]);
    expect((await check({ writeMode: 'BORRABLE' })).length).toBeGreaterThan(0);
    expect((await check({ schema: 'a; drop table x' })).length).toBeGreaterThan(
      0,
    );
    expect((await check({ rol: 'admin' })).length).toBeGreaterThan(0);
  });
});
