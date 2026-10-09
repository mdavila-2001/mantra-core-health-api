import { jest } from '@jest/globals';
import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Post,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TransactionPropagation } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { defer, lastValueFrom, of, throwError } from 'rxjs';
import {
  AccessLogged,
  Audited,
  NotAudited,
  getAuditRequestContext,
  markAuditSealed,
} from '../../../common/audit-trail';
import { CONCEPTS } from '../../../common/constants/concepts';
import { AUD } from '../audit.concepts';
import type {
  AppendAuditData,
  AuditLogRepository,
  DataAccessLogRepository,
  RecordDataAccessData,
} from '../repositories';
import { AuditTrailInterceptor } from './audit-trail.interceptor';

const ACTOR = '11111111-1111-4111-8111-111111111111';
const TENANT = '22222222-2222-4222-8222-222222222222';
const THING = '33333333-3333-4333-8333-333333333333';
const PATIENT = '44444444-4444-4444-8444-444444444444';

@Controller('things')
class ThingsController {
  @Post(':id/close')
  close(): void {}

  @Post()
  @Audited({
    action: 'THING_CREATED',
    entity: 'thing',
    entityId: 'result.id',
  })
  create(): void {}

  @Post('relay')
  @NotAudited('Plomería de cola: rastro propio.')
  relay(): void {}

  @Get(':id')
  find(): void {}

  @Get('patients/:patientProfileId/chart')
  @AccessLogged({
    resourceType: 'PATIENT_CHART',
    patient: 'param:patientProfileId',
  })
  chart(): void {}

  @Get('me/results/:reportId')
  @AccessLogged({
    resourceType: 'DIAGNOSTIC_REPORT',
    patient: 'actor',
    resourceId: 'param:reportId',
  })
  ownResult(): void {}
}

type Handler = keyof ThingsController;

interface Harness {
  interceptor: AuditTrailInterceptor;
  appended: AppendAuditData[];
  accesses: RecordDataAccessData[];
  transactionOptions: unknown[];
  executed: string[];
  events: string[];
}

interface HarnessOptions {
  inRequestTransaction?: boolean;
  appendFails?: boolean;
  recordFails?: boolean;
  existingPatients?: string[];
}

/**
 * EntityManager falso: `fork()` devuelve un EM cuyo `transactional` ejecuta el
 * callback con un `tx` que anota los SQL y las opciones de propagación.
 */
function harness(options: HarnessOptions = {}): Harness {
  const appended: AppendAuditData[] = [];
  const accesses: RecordDataAccessData[] = [];
  const transactionOptions: unknown[] = [];
  const executed: string[] = [];
  const events: string[] = [];
  const existing = new Set(options.existingPatients ?? []);

  const tx = {
    execute: jest.fn(async (sql: string, params?: unknown[]) => {
      executed.push(sql);
      if (sql.includes('patient_profiles')) {
        return existing.has(String(params?.[0])) ? [{ id: params?.[0] }] : [];
      }
      return [];
    }),
  };
  const fork = {
    isInTransaction: () => options.inRequestTransaction === true,
    transactional: jest.fn(
      async (cb: (em: typeof tx) => Promise<unknown>, opts?: unknown) => {
        transactionOptions.push(opts);
        return cb(tx);
      },
    ),
  };
  const em = { fork: jest.fn(() => fork) } as unknown as EntityManager;

  const auditLogRepo = {
    append: jest.fn(async (_tx: unknown, data: AppendAuditData) => {
      events.push(`append:${data.outcomeConceptId}`);
      if (options.appendFails) throw new Error('lock timeout');
      appended.push(data);
      return data;
    }),
  } as unknown as AuditLogRepository;
  const dataAccessLogRepo = {
    record: jest.fn((_tx: unknown, data: RecordDataAccessData) => {
      events.push('access');
      if (options.recordFails) throw new Error('insert failed');
      accesses.push(data);
      return data;
    }),
  } as unknown as DataAccessLogRepository;

  return {
    interceptor: new AuditTrailInterceptor(
      em,
      new Reflector(),
      auditLogRepo,
      dataAccessLogRepo,
    ),
    appended,
    accesses,
    transactionOptions,
    executed,
    events,
  };
}

interface RequestShape {
  method: string;
  params?: Record<string, string>;
  user?: Record<string, unknown>;
  ip?: string;
  resolvedTenantId?: string;
}

function httpContext(
  handler: Handler,
  request: RequestShape,
): ExecutionContext {
  // Referencia al handler sólo para leer su metadata: nunca se invoca.
  const handlerRef: unknown = Reflect.get(ThingsController.prototype, handler);
  return {
    getType: () => 'http',
    getHandler: () => handlerRef,
    getClass: () => ThingsController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const actor = (extra: Record<string, unknown> = {}) => ({
  id: ACTOR,
  roles: ['ADMIN'],
  sessionId: 'session-1',
  ...extra,
});

const returning = (value: unknown): CallHandler => ({
  handle: () => of(value),
});
const failing = (error: Error): CallHandler => ({
  handle: () => throwError(() => error),
});

function run(
  h: Harness,
  handler: Handler,
  request: RequestShape,
  next: CallHandler,
) {
  return lastValueFrom(
    h.interceptor.intercept(httpContext(handler, request), next),
  );
}

describe('AuditTrailInterceptor', () => {
  const originalRls = process.env.RLS_ENFORCE;
  afterEach(() => {
    process.env.RLS_ENFORCE = originalRls;
    jest.restoreAllMocks();
  });

  describe('rutas que mutan', () => {
    it('sella el éxito con la identidad derivada de la ruta, el tenant y la ip', async () => {
      const h = harness();
      const result = await run(
        h,
        'close',
        {
          method: 'POST',
          params: { id: THING },
          user: actor(),
          ip: '10.0.0.7',
          resolvedTenantId: TENANT,
        },
        returning({ ok: true }),
      );

      expect(result).toEqual({ ok: true });
      expect(h.appended).toEqual([
        {
          userId: ACTOR,
          action: 'HTTP POST /things/:id/close',
          entity: 'things',
          entityId: THING,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          tenantId: TENANT,
          recordedByUserId: ACTOR,
        },
      ]);
    });

    it('usa el nombre de negocio de @Audited y el id del resultado', async () => {
      const h = harness();
      await run(
        h,
        'create',
        { method: 'POST', user: actor() },
        returning({ id: THING }),
      );
      expect(h.appended[0]).toMatchObject({
        action: 'THING_CREATED',
        entity: 'thing',
        entityId: THING,
      });
    });

    it('sella el fallo en una transacción REQUIRES_NEW y re-lanza el error original', async () => {
      const h = harness();
      const original = new BadRequestException('cuerpo inválido');

      await expect(
        run(
          h,
          'close',
          { method: 'POST', params: { id: THING }, user: actor() },
          failing(original),
        ),
      ).rejects.toBe(original);

      expect(h.appended).toHaveLength(1);
      expect(h.appended[0].outcomeConceptId).toBe(CONCEPTS.OUTCOME_FAILURE);
      expect(h.transactionOptions).toEqual([
        { propagation: TransactionPropagation.REQUIRES_NEW },
      ]);
    });

    it('si sellar el fallo falla, gana el error original y queda registrado', async () => {
      const logged = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const h = harness({ appendFails: true });
      const original = new BadRequestException('cuerpo inválido');

      await expect(
        run(h, 'close', { method: 'POST', user: actor() }, failing(original)),
      ).rejects.toBe(original);
      expect(logged).toHaveBeenCalledWith(
        expect.stringContaining(
          'AUDIT_SEAL_FAILED HTTP POST /things/:id/close',
        ),
      );
    });

    it('si sellar el éxito falla, la mutación ya confirmada no se convierte en error', async () => {
      const logged = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const h = harness({ appendFails: true });

      await expect(
        run(h, 'close', { method: 'POST', user: actor() }, returning('done')),
      ).resolves.toBe('done');
      expect(logged).toHaveBeenCalledTimes(1);
    });

    it('no repite el sello cuando el servicio ya selló dentro de su transacción', async () => {
      const h = harness();
      const sealingService: CallHandler = {
        handle: () =>
          defer(async () => {
            markAuditSealed(true);
            return 'ok';
          }),
      };
      await run(h, 'close', { method: 'POST', user: actor() }, sealingService);
      expect(h.appended).toEqual([]);
    });

    it('un éxito sellado por el servicio no impide sellar el fallo posterior', async () => {
      const h = harness();
      const sealsThenFails: CallHandler = {
        handle: () =>
          defer(async () => {
            markAuditSealed(true);
            throw new BadRequestException('después del sello');
          }),
      };
      await expect(
        run(h, 'close', { method: 'POST', user: actor() }, sealsThenFails),
      ).rejects.toThrow('después del sello');
      expect(h.appended.map((a) => a.outcomeConceptId)).toEqual([
        CONCEPTS.OUTCOME_FAILURE,
      ]);
    });

    it('expone ip y sesión a los sellos que haga el propio servicio', async () => {
      const h = harness();
      let seen: unknown;
      const inspecting: CallHandler = {
        handle: () =>
          defer(async () => {
            seen = getAuditRequestContext();
            return 'ok';
          }),
      };
      await run(
        h,
        'close',
        { method: 'PATCH', user: actor(), ip: '::1' },
        inspecting,
      );
      expect(seen).toMatchObject({
        ip: '::1',
        sessionId: 'session-1',
        actorUserId: ACTOR,
      });
    });

    it('descarta una ip que no es inet', async () => {
      const h = harness();
      let seen: unknown;
      const inspecting: CallHandler = {
        handle: () => defer(async () => (seen = getAuditRequestContext()?.ip)),
      };
      await run(
        h,
        'close',
        { method: 'POST', user: actor(), ip: 'proxy.local' },
        inspecting,
      );
      expect(seen).toBeUndefined();
    });

    it('@NotAudited deja pasar sin sellar', async () => {
      const h = harness();
      await run(h, 'relay', { method: 'POST', user: actor() }, returning('ok'));
      expect(h.appended).toEqual([]);
    });

    it('sin actor (ruta @Public) no sella: audit_log.user_id es NOT NULL', async () => {
      const h = harness();
      await run(h, 'close', { method: 'POST' }, returning('ok'));
      expect(h.appended).toEqual([]);
    });

    it('se une a la transacción de la petición sin tocar el contexto RLS', async () => {
      process.env.RLS_ENFORCE = 'true';
      const h = harness({ inRequestTransaction: true });
      await run(
        h,
        'close',
        { method: 'POST', user: actor(), resolvedTenantId: TENANT },
        returning('ok'),
      );
      expect(h.appended).toHaveLength(1);
      expect(h.transactionOptions).toEqual([undefined]);
      expect(h.executed).toEqual([]);
    });

    it('con RLS y transacción propia fija el tenant, local a esa transacción', async () => {
      process.env.RLS_ENFORCE = 'true';
      const h = harness();
      await run(
        h,
        'close',
        { method: 'POST', user: actor(), resolvedTenantId: TENANT },
        returning('ok'),
      );
      expect(h.executed).toEqual([
        "select set_config('app.system_context', 'false', true)",
        "select set_config('app.current_tenant_id', ?, true)",
      ]);
    });

    it('no ignora contextos que no son HTTP', async () => {
      const h = harness();
      const context = {
        getType: () => 'rpc',
      } as unknown as ExecutionContext;
      await lastValueFrom(h.interceptor.intercept(context, returning('ok')));
      expect(h.appended).toEqual([]);
    });
  });

  describe('lecturas de PHI', () => {
    it('una lectura sin @AccessLogged no escribe nada', async () => {
      const h = harness();
      await run(
        h,
        'find',
        { method: 'GET', params: { id: THING }, user: actor() },
        returning('ok'),
      );
      expect(h.accesses).toEqual([]);
      expect(h.appended).toEqual([]);
    });

    it('registra el acceso ANTES de ejecutar el handler', async () => {
      const h = harness({ existingPatients: [PATIENT] });
      const handler: CallHandler = {
        handle: () =>
          defer(async () => {
            h.events.push('handler');
            return 'chart';
          }),
      };
      await run(
        h,
        'chart',
        {
          method: 'GET',
          params: { patientProfileId: PATIENT },
          user: actor(),
          resolvedTenantId: TENANT,
        },
        handler,
      );
      expect(h.events).toEqual(['access', 'handler']);
      expect(h.accesses).toEqual([
        {
          userId: ACTOR,
          actionConceptId: AUD.ACTION_READ,
          patientProfileId: PATIENT,
          tenantId: TENANT,
          purpose: 'TREATMENT',
          resourceType: 'PATIENT_CHART',
          resourceId: undefined,
          recordedByUserId: ACTOR,
        },
      ]);
    });

    it('un paciente inexistente no se escribe como FK (el 404 sigue siendo 404)', async () => {
      const h = harness({ existingPatients: [] });
      await run(
        h,
        'chart',
        { method: 'GET', params: { patientProfileId: PATIENT }, user: actor() },
        returning('404 del servicio'),
      );
      expect(h.accesses[0].patientProfileId).toBeUndefined();
    });

    it('el titular leyendo lo suyo usa su perfil y el propósito PATIENT_ACCESS', async () => {
      const h = harness();
      await run(
        h,
        'ownResult',
        {
          method: 'GET',
          params: { reportId: THING },
          user: actor({ patientProfileId: PATIENT }),
        },
        returning('ok'),
      );
      expect(h.accesses[0]).toMatchObject({
        patientProfileId: PATIENT,
        purpose: 'PATIENT_ACCESS',
        resourceType: 'DIAGNOSTIC_REPORT',
        resourceId: THING,
      });
    });

    it('sin evidencia del acceso no hay lectura', async () => {
      const h = harness({ recordFails: true });
      const handle = jest.fn(() => of('chart'));
      await expect(
        run(
          h,
          'chart',
          {
            method: 'GET',
            params: { patientProfileId: PATIENT },
            user: actor(),
          },
          { handle },
        ),
      ).rejects.toThrow('insert failed');
      expect(handle).not.toHaveBeenCalled();
    });
  });
});
