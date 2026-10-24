import { jest } from '@jest/globals';

// Mock laxo: conserva el 'jest' de runtime evitando los tipos estrictos de @jest/globals.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuditLogRepository } from './audit-log.repository';
import {
  runWithAuditRequestContext,
  type AuditRequestContext,
} from '../../../common/audit-trail';
import { CONCEPTS } from '../../../common/constants/concepts';

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
    expect(em.calls.indexOf('execute')).toBeLessThan(
      em.calls.indexOf('findOne'),
    );
    expect(row.previousHash).toBe('hash-anterior');
    expect(typeof row.recordHash).toBe('string');
  });

  describe('origen de la petición (informe C §1.4.1)', () => {
    const DEVICE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const context = (): AuditRequestContext => ({
      ip: '10.0.0.9',
      sessionId: 'session-1',
      actorUserId: 'u1',
      sealedSuccess: false,
      sealedFailure: false,
    });

    /** EM que responde la sesión con su dispositivo y anota cada SQL. */
    function emWithSession(deviceId: string | null) {
      const em = buildEm();
      em.sql = [] as string[];
      em.execute = mockFn((sql: string) => {
        em.sql.push(sql);
        return Promise.resolve(
          sql.includes('iam.sessions') ? [{ device_id: deviceId }] : [],
        );
      });
      return em;
    }

    it('llena ip y device_id desde la petición y marca el sello', async () => {
      const repo = new AuditLogRepository();
      const em = emWithSession(DEVICE);
      const ctx = context();

      const row: any = await runWithAuditRequestContext(ctx, () =>
        repo.append(em, {
          ...baseData,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        }),
      );

      expect(row.ip).toBe('10.0.0.9');
      expect(row.deviceId).toBe(DEVICE);
      expect(ctx.sealedSuccess).toBe(true);
      expect(ctx.sealedFailure).toBe(false);
    });

    it('consulta la sesión una sola vez por petición', async () => {
      const repo = new AuditLogRepository();
      const em = emWithSession(DEVICE);
      const ctx = context();

      await runWithAuditRequestContext(ctx, async () => {
        await repo.append(em, baseData);
        await repo.append(em, baseData);
      });

      expect(
        em.sql.filter((q: string) => q.includes('iam.sessions')),
      ).toHaveLength(1);
    });

    it('una sesión sin dispositivo deja device_id vacío', async () => {
      const repo = new AuditLogRepository();
      const em = emWithSession(null);

      const row: any = await runWithAuditRequestContext(context(), () =>
        repo.append(em, baseData),
      );
      expect(row.deviceId).toBeUndefined();
    });

    it('un sello de fallo marca sealedFailure, no sealedSuccess', async () => {
      const repo = new AuditLogRepository();
      const ctx = context();
      await runWithAuditRequestContext(ctx, () =>
        repo.append(emWithSession(null), {
          ...baseData,
          outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
        }),
      );
      expect(ctx).toMatchObject({ sealedSuccess: false, sealedFailure: true });
    });

    it('lo que trae el llamador manda sobre la petición', async () => {
      const repo = new AuditLogRepository();
      const row: any = await runWithAuditRequestContext(context(), () =>
        repo.append(emWithSession(DEVICE), { ...baseData, ip: '127.0.0.1' }),
      );
      expect(row.ip).toBe('127.0.0.1');
    });

    it('fuera de una petición no consulta nada extra', async () => {
      const repo = new AuditLogRepository();
      const em = emWithSession(DEVICE);
      const row: any = await repo.append(em, baseData);
      expect(row.ip).toBeUndefined();
      expect(em.sql.some((q: string) => q.includes('iam.sessions'))).toBe(
        false,
      );
    });
  });
});
