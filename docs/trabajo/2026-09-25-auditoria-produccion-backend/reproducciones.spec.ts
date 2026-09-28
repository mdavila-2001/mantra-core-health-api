/** Reproducciones de auditoría. Todos los datos son sintéticos; sin DB ni red externa.
 * Un test verde confirma la presencia del defecto descrito, NO su corrección.
 */
import 'reflect-metadata';
import { jest, describe, it, expect } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { defer, lastValueFrom } from 'rxjs';
import pino from 'pino';
import { PublicCacheInterceptor } from '../../../src/common/http/public-cache.interceptor';
import { PublicCacheStore } from '../../../src/common/http/public-cache.store';
import { AppController } from '../../../src/app.controller';
import { TenantScopeGuard } from '../../../src/common/auth/tenant-scope.guard';
import { RolesGuard } from '../../../src/common/auth/roles.guard';
import { TenantContextInterceptor } from '../../../src/common/tenant/tenant-context.interceptor';
import { EncountersService } from '../../../src/modules/clinical/services/encounters.service';
import { EncountersRepository } from '../../../src/modules/clinical/repositories/encounters.repository';
import { ClinicalEncountersController } from '../../../src/modules/clinical/controllers/clinical-encounters.controller';
import { PaymentsIntentsController } from '../../../src/modules/payments/controllers/payments-intents.controller';
import { PaymentsIntentsService } from '../../../src/modules/payments/services/payments-intents.service';
import { PaymentIntentsRepository } from '../../../src/modules/payments/repositories/payment-intents.repository';
import { CLIN } from '../../../src/modules/clinical/clinical.concepts';
import { CONCEPTS } from '../../../src/common/constants/concepts';
import { AllExceptionsFilter } from '../../../src/common/filters/all-exceptions.filter';
import { buildPinoOptions } from '../../../src/logging/pino-options';
import { SessionValidator } from '../../../src/common/auth/session-validator';
import { RedisThrottlerStorage } from '../../../src/common/security/redis-throttler.storage';
import { CommunityMessagingGateway } from '../../../src/modules/community/gateways/community-messaging.gateway';
import { SchedulingBookingsService } from '../../../src/modules/scheduling/services/scheduling-bookings.service';
import { SchedulingBookingsController } from '../../../src/modules/scheduling/controllers/scheduling-bookings.controller';

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';
const P1 = '33333333-3333-4333-8333-333333333333';
const P2 = '44444444-4444-4444-8444-444444444444';
const ID = '55555555-5555-4555-8555-555555555555';
const log = { setContext() {}, info() {}, warn() {}, error() {} };

function context(controller: any, method: string, request: any, response: any = {}) {
  return {
    getType: () => 'http', getClass: () => controller,
    getHandler: () => controller.prototype[method],
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as any;
}
function actor(role: string) {
  return { id: ID, sessionId: 'synthetic-session', roles: [role], tenantIds: [T1], scopedRoles: { [T1]: [role] } };
}
async function guarded(controller: any, method: string, request: any, execute: () => Promise<unknown>) {
  const ctx = context(controller, method, request);
  const reflector = new Reflector();
  expect(new TenantScopeGuard(reflector).canActivate(ctx)).toBe(true);
  expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
  const prior = process.env.RLS_ENFORCE;
  process.env.RLS_ENFORCE = 'false'; // Default del despliegue Coolify auditado.
  const interceptor = new TenantContextInterceptor({} as any, reflector);
  if (prior === undefined) delete process.env.RLS_ENFORCE; else process.env.RLS_ENFORCE = prior;
  return lastValueFrom(interceptor.intercept(ctx, { handle: () => defer(execute) }));
}

describe('Reproducciones de defectos de producción (sin persistencia real)', () => {
  it('AUD-09: PATIENT obtiene identificadores de citas ajenas filtrando sólo por recurso', async () => {
    const booking = { id: ID, tenantId: T2, patientProfileId: P2, resourceId: ID,
      statusConceptId: CONCEPTS.BOOKING_CONFIRMED, createdAt: new Date(0), reasonText: 'synthetic private reason' };
    const ownership = jest.fn(async () => { throw new Error('must deny foreign patient'); });
    const service = new SchedulingBookingsService({ fork: () => ({}) } as any,
      { findBookings: async () => ({ rows: [{ booking, slot: null }], fetchCapReached: false }),
        latestRescheduleOrigins: async () => new Map(), findPatientNames: async () => new Map(),
        findPaymentStatesForBookings: async () => new Map() } as any,
      {} as any, { latestBySource: async () => new Map() } as any,
      { findTypesByIds: async () => new Map() } as any, {} as any, {} as any, log as any,
      {} as any, {} as any, { findActiveCarriersByPatients: async () => new Map() } as any,
      {} as any, { findLatestIdsByAppointmentIds: async () => new Map() } as any, {} as any,
      { findActiveProxiedPatientIds: async () => new Set(), assertMayActForPatient: ownership } as any);
    const user = { ...actor('PATIENT'), patientProfileId: P1 };
    const result: any = await guarded(SchedulingBookingsController, 'searchBookings',
      { headers: { 'x-tenant-id': T1 }, user, params: {}, query: { resourceId: ID }, body: {} },
      () => service.searchBookings({ resourceId: ID, includeCancelled: false }, 10, user));
    expect(result.items[0].patientProfileId).toBe(P2);
    expect(result.items[0].id).toBe(ID);
    expect(result.items[0]).not.toHaveProperty('reasonText');
    expect(ownership).not.toHaveBeenCalled();
  });

  it('AUD-01: check-in retorna el paciente de otro tenant por appointmentId', async () => {
    const foreignEncounter = { id: ID, tenantId: T2, patientProfileId: P2,
      appointmentId: ID, statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS, createdAt: new Date(0) };
    const queries: unknown[] = [];
    const tx = { findOne: async (_entity: any, where: any) => {
      queries.push(where); return { id: ID, patientProfileId: P2, tenantId: T2 };
    }, find: async (entity: any, where: any) => {
      queries.push(where); return entity.name === 'Encounters' ? [foreignEncounter] : [];
    } };
    const policy = { assertPuedeEscribirHistoria: jest.fn(async () => { throw new Error('must deny'); }) };
    const service = new EncountersService({ transactional: (fn: any) => fn(tx) } as any,
      new EncountersRepository(), {} as any, {} as any, {} as any, log as any, policy as any,
      // P25 (carril M3, 2026-09-26): `FilesService` para los adjuntos del encuentro.
      {} as any);
    const user = actor('CLINICIAN');
    const dto = { tenantId: T1, patientProfileId: P1, appointmentId: ID };
    const result: any = await guarded(ClinicalEncountersController, 'checkIn',
      { headers: { 'x-tenant-id': T1 }, user, params: {}, query: {}, body: dto },
      () => service.checkIn(dto, user));
    expect(result.patientProfileId).toBe(P2);
    expect(policy.assertPuedeEscribirHistoria).not.toHaveBeenCalled();
    expect(queries).toContainEqual({ appointmentId: ID });
  });

  it('AUD-02: PAYMENTS_ADMIN del tenant A puede marcar FAILED un intent del B', async () => {
    const intent = { id: ID, tenantId: T2, statusConceptId: CONCEPTS.PI_PENDING, rowVersion: 1 };
    const lookups: unknown[] = [];
    const tx = { findOne: async (_entity: any, where: any) => { lookups.push(where); return intent; } };
    const service = new PaymentsIntentsService({ transactional: (fn: any) => fn(tx) } as any,
      new PaymentIntentsRepository(), { createRiskAssessment: () => ({ id: ID }) } as any, log as any);
    const user = actor('PAYMENTS_ADMIN');
    const dto = { riskScore: '90', decision: 'DECLINE' as const, threeDsAuthenticated: false };
    await guarded(PaymentsIntentsController, 'assessRisk',
      { headers: { 'x-tenant-id': T1 }, user, params: { id: ID }, query: {}, body: dto },
      () => service.assessRisk(ID, dto, user));
    expect(intent.statusConceptId).toBe(CONCEPTS.PI_FAILED);
    expect(lookups).toEqual([{ id: ID }]);
  });

  it('AUD-03: readiness responde ok cacheado sin ejecutar la dependencia caída', async () => {
    let probes = 0;
    let down = false;
    const app = new AppController({} as any, { check: async () => {
      probes++;
      if (down) throw new Error('synthetic dependency down');
      return { status: 'ok', checks: {}, timestamp: 'synthetic-first-probe' };
    } } as any);
    const headers: Record<string, string> = {};
    const ctx = context(AppController, 'readiness',
      { method: 'GET', originalUrl: '/readiness', path: '/readiness', headers: {} },
      { setHeader: (key: string, value: string) => { headers[key] = value; }, status() {} });
    const cache = new PublicCacheInterceptor(new Reflector(), new PublicCacheStore());
    const handler = { handle: () => defer(() => app.readiness()) };
    await lastValueFrom(cache.intercept(ctx, handler));
    down = true;
    const second: any = await lastValueFrom(cache.intercept(ctx, handler));
    expect(second.status).toBe('ok');
    expect(probes).toBe(1);
    expect(headers['Cache-Control']).toBe('public, max-age=60, stale-while-revalidate=300');
  });

  it('AUD-04: el filtro y la configuración real de pino conservan payload sintético en err.message', () => {
    const chunks: string[] = [];
    const options = buildPinoOptions().pinoHttp as any;
    const writer = pino(options, { write: (chunk: string) => { chunks.push(chunk); } });
    const filter = new AllExceptionsFilter({ setContext() {}, error: (a: any, b: string) => writer.error(a, b), warn: (a: any, b: string) => writer.warn(a, b) } as any,
      { setAttribute() {}, recordException() {}, addEvent() {} } as any);
    let response: any;
    filter.catch(new Error('insert failed: AUDIT_SYNTHETIC_PRIVATE_PAYLOAD'), {
      switchToHttp: () => ({ getRequest: () => ({ url: '/synthetic', method: 'POST', headers: {}, id: 'audit' }),
        getResponse: () => ({ setHeader() {}, status() { return this; }, json(body: any) { response = body; } }) }),
    } as any);
    expect(JSON.stringify(response)).not.toContain('AUDIT_SYNTHETIC_PRIVATE_PAYLOAD');
    expect(chunks.join('')).toContain('AUDIT_SYNTHETIC_PRIVATE_PAYLOAD');
  });

  it('AUD-05: una sesión activa sigue aceptando el tenant del JWT sin consultar membresías', async () => {
    const sql: string[] = [];
    const validator = new SessionValidator({ getConnection: () => ({ execute: async (q: string) => { sql.push(q); return [{ ok: 1 }]; } }) } as any);
    await validator.assertActive({ sub: ID, sid: 'synthetic-session', typ: 'access', tenants: [T1], roles: ['PAYMENTS_ADMIN'] } as any);
    const user = actor('PAYMENTS_ADMIN');
    const ctx = context(PaymentsIntentsController, 'assessRisk', { headers: { 'x-tenant-id': T1 }, user, params: {}, query: {}, body: {} });
    expect(new TenantScopeGuard(new Reflector()).canActivate(ctx)).toBe(true);
    expect(sql.join('')).not.toContain('tenant_memberships');
  });

  it('AUD-06: el fallback del rate-limit conserva claves expiradas de clientes inactivos', async () => {
    const storage = new RedisThrottlerStorage();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      for (let i = 0; i < 1000; i++) await storage.increment(`synthetic-${i}`, 100, 10, 100);
      clock.mockReturnValue(100000);
      await storage.increment('new-synthetic-client', 100, 10, 100);
      expect((storage as any).local.size).toBe(1001);
    } finally { clock.mockRestore(); }
  });

  it('AUD-07: una nueva evaluación DECLINE revierte una intención ya SUCCEEDED', async () => {
    const intent = { id: ID, tenantId: T1, statusConceptId: CONCEPTS.PI_SUCCEEDED, rowVersion: 1 };
    const tx = { findOne: async () => intent };
    const service = new PaymentsIntentsService({ transactional: (fn: any) => fn(tx) } as any,
      new PaymentIntentsRepository(), { createRiskAssessment: () => ({ id: ID }) } as any, log as any);
    await service.assessRisk(ID, { riskScore: '90', decision: 'DECLINE' }, actor('PAYMENTS_ADMIN'));
    expect(intent.statusConceptId).toBe(CONCEPTS.PI_FAILED);
  });

  it('AUD-08: socket autenticado puede unirse a una conversación tras revocar su sesión', async () => {
    let revoked = false;
    const auth = { authenticate: jest.fn(async () => {
      if (revoked) throw new Error('synthetic revoked session');
      return actor('USER');
    }) };
    const socket = { data: {}, rooms: new Set<string>(), disconnect: jest.fn(), emit: jest.fn(),
      join: jest.fn(async (room: string) => { socket.rooms.add(room); }) };
    const gateway = new CommunityMessagingGateway({ fork: () => ({}) } as any, auth as any,
      { findActiveParticipant: async () => ({ id: ID }) } as any,
      { assertOwnProfile: async () => undefined } as any, {} as any, log as any);
    // La autenticación se movió de `handleConnection` a un middleware de
    // socket.io (`afterInit`, ver community-messaging.gateway.ts) para cerrar
    // una carrera con los `@SubscribeMessage` del propio socket. Acá se
    // reproduce a mano lo que ese middleware hace una sola vez, al conectar:
    // el defecto que documenta AUD-08 —que lo autenticado no se revalida por
    // mensaje— no cambió de lugar, sólo de método.
    (socket as any).data.user = await auth.authenticate();
    revoked = true;
    await gateway.handleJoinConversation(socket as any, { conversationId: ID, profileId: P1 });
    expect(auth.authenticate).toHaveBeenCalledTimes(1);
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.rooms.has(`conversation:${ID}`)).toBe(true);
  });
});
