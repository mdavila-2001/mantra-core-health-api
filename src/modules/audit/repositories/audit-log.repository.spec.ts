import { jest } from '@jest/globals';

// Mock laxo: conserva el 'jest' de runtime evitando los tipos estrictos de @jest/globals.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuditLogRepository } from './audit-log.repository';

/**
 * EntityManager de prueba que registra el ORDEN de las llamadas (`calls`) para
 * poder afirmar que el cerrojo se toma ANTES de leer el tip de la cadena.
 */
function buildEm() {
  const calls: string[] = [];
  const em: any = {
    calls,
    execute: mockFn((sql: string, params: any[]) => {
      calls.push('execute');
      em.lastLockSql = sql;
      em.lastLockParams = params;
      return Promise.resolve([{ pg_advisory_xact_lock: '' }]);
    }),
    findOne: mockFn(() => {
      calls.push('findOne');
      return Promise.resolve(em.tip ?? null);
    }),
    create: mockFn((_entity: any, payload: any) => {
      calls.push('create');
      return { id: 'row-1', ...payload };
    }),
    tip: null as any,
  };
  return em;
}

const baseData = {
  userId: 'u1',
  action: 'UPDATE',
  entity: 'users',
  outcomeConceptId: 'oc-success',
  tenantId: 't1',
};

describe('AuditLogRepository (serialización del hash-chain WORM)', () => {
  it('toma el pg_advisory_xact_lock ANTES de leer el tip y de insertar', async () => {
    const repo = new AuditLogRepository();
    const em = buildEm();

    await repo.append(em, baseData);

    // El cerrojo debe ser lo primero, luego la lectura del tip, luego el insert.
    expect(em.calls).toEqual(['execute', 'findOne', 'create']);
    expect(em.lastLockSql).toContain('pg_advisory_xact_lock');
    expect(em.lastLockSql).toContain('hashtext');
  });

  it('deriva la clave del cerrojo del tenant (aísla cadenas por partición)', async () => {
    const repo = new AuditLogRepository();
    const em = buildEm();

    await repo.append(em, baseData);
    expect(em.lastLockParams).toEqual(['audit:t1']);
  });

  it('usa una clave estable para la partición global (tenant_id IS NULL)', async () => {
    const repo = new AuditLogRepository();
    const em = buildEm();

    await repo.append(em, { ...baseData, tenantId: undefined });
    // No debe ser NULL: 'audit:' vacío obtiene un cerrojo real para la cadena global.
    expect(em.lastLockParams).toEqual(['audit:']);
  });

  it('encadena el nuevo eslabón con el record_hash del tip bajo el cerrojo', async () => {
    const repo = new AuditLogRepository();
    const em = buildEm();
    em.tip = { recordHash: 'hash-anterior' };

    const row: any = await repo.append(em, baseData);

    // El lock se tomó antes de que findChainTip devolviera el previous_hash.
    expect(em.calls.indexOf('execute')).toBeLessThan(em.calls.indexOf('findOne'));
    expect(row.previousHash).toBe('hash-anterior');
    expect(typeof row.recordHash).toBe('string');
  });
});
