import { createHash } from 'node:crypto';
import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { TelemetryEventsService } from './telemetry-events.service';
import {
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
  createGlobalValidationPipe,
  runWithTenant,
} from '../../../../common';
import {
  CaptureActivityEventsDto,
  CreateClientContextDto,
} from '../../presentation/dto';
import { TELE } from '../../telemetry.concepts';
import { TelemetryErrorReason } from '../../telemetry.error-reasons';

/** Actor A: dueño de la sesión `sess-token-a` (iam.sessions.id = `iam-sess-a`). */
const actor = {
  id: 'user-a',
  sessionId: 'sess-token-a',
  roles: ['USER'],
} as any;
const IAM_SESSION_A = 'iam-sess-a';
const TENANT_A = 'tenant-a';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const schemasRepo = { findById: mockFn() };
  const eventsRepo = {
    findByIdempotencyKey: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const propertiesRepo = { create: mockFn() };
  const journeysRepo = {
    findById: mockFn(),
    findOpenBySession: mockFn(),
    create: mockFn(),
  };
  const contextsRepo = { create: mockFn(), findById: mockFn() };
  const webVitalsRepo = { create: mockFn() };
  const funnelsRepo = { findById: mockFn() };
  const conversionsRepo = { findExisting: mockFn(), create: mockFn() };
  const subjectsRepo = { findById: mockFn() };
  const consentsRepo = {
    findLatest: mockFn().mockResolvedValue({
      decisionConceptId: TELE.DECISION_GRANTED,
    }),
  };
  // Por defecto el propósito exige consentimiento: el gate funciona como antes.
  const purposesRepo = {
    findById: mockFn().mockResolvedValue({ requiresConsent: true }),
  };
  // Sólo las sesiones de A son de A: `belongsToUser` compara contra su id real.
  const sessionsRepo = {
    findIdByToken: mockFn((_tx: unknown, userId: string, token: string) =>
      Promise.resolve(
        userId === 'user-a' && token === 'sess-token-a'
          ? IAM_SESSION_A
          : userId === 'user-b' && token === 'sess-token-b'
            ? 'iam-sess-b'
            : null,
      ),
    ),
    belongsToUser: mockFn((_tx: unknown, sessionId: string, userId: string) =>
      Promise.resolve(userId === 'user-a' && sessionId === IAM_SESSION_A),
    ),
  };
  const webAnalytics = {
    trackActivityEvents: mockFn(),
    trackWebVitals: mockFn(),
    trackConversion: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new TelemetryEventsService(
    em as any,
    schemasRepo as any,
    eventsRepo,
    propertiesRepo,
    journeysRepo,
    contextsRepo as any,
    webVitalsRepo,
    funnelsRepo as any,
    conversionsRepo,
    subjectsRepo as any,
    consentsRepo as any,
    purposesRepo as any,
    sessionsRepo as any,
    webAnalytics as any,
    logger as any,
  );
  return {
    service,
    tx,
    schemasRepo,
    eventsRepo,
    propertiesRepo,
    journeysRepo,
    contextsRepo,
    webVitalsRepo,
    funnelsRepo,
    conversionsRepo,
    subjectsRepo,
    consentsRepo,
    purposesRepo,
    sessionsRepo,
    webAnalytics,
  };
}

/** Esquema de evento con una propiedad declarada. */
const schemaWith = (over: Record<string, unknown> = {}) => ({
  id: 's1',
  eventName: 'page_view',
  purposeDefinitionId: 'p1',
  portalTypeConceptId: TELE.PORTAL_WEB,
  propertySchemaJson: {
    type: 'object',
    properties: {
      screen_name: { type: 'string', maxLength: 30 },
      specialty: { type: 'string' },
      note: { type: 'string', phi: true },
    },
  },
  phiAllowed: false,
  ...over,
});

/** Falla esperada: devuelve la excepción o lanza si no hubo. */
async function failure(promise: Promise<unknown>): Promise<DomainException> {
  try {
    await promise;
  } catch (error) {
    return error as DomainException;
  }
  throw new Error('debía rechazar');
}

describe('TelemetryEventsService', () => {
  describe('captureActivityEvents (UC-28-07)', () => {
    it('captures a batch and materializes a journey', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue(schemaWith());
      const journey: any = {
        id: 'j1',
        entryEventId: undefined,
        exitEventId: undefined,
        eventCount: 0,
      };
      d.journeysRepo.create.mockReturnValue(journey);
      d.eventsRepo.create.mockReturnValue({ id: 'e1' });

      const res = await d.service.captureActivityEvents(
        {
          events: [
            {
              eventSchemaDefinitionId: 's1',
              properties: [
                { propertyName: 'screen_name', valueString: 'home' },
              ],
            },
          ],
        },
        actor,
      );

      expect(res.inserted).toBe(1);
      expect(res.eventIds).toEqual(['e1']);
      expect(res.sessionJourneyId).toBe('j1');
      expect(journey.eventCount).toBe(1);
      expect(d.propertiesRepo.create).toHaveBeenCalledTimes(1);
    });

    it('Correcto: la identidad, la sesión y el tenant del evento salen del servidor', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue(schemaWith());
      d.journeysRepo.create.mockReturnValue({ id: 'j1', eventCount: 0 });
      d.eventsRepo.create.mockReturnValue({ id: 'e1' });

      await runWithTenant(TENANT_A, () =>
        d.service.captureActivityEvents(
          {
            // Un cliente que insiste en mandar identidad propia: el DTO ya no la
            // declara, y aun así el servicio no la lee.
            events: [
              {
                eventSchemaDefinitionId: 's1',
                userId: 'user-b',
                sessionId: 'iam-sess-b',
                tenantId: 'tenant-b',
              } as any,
            ],
          },
          actor,
        ),
      );

      expect(d.eventsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user-a',
          sessionId: IAM_SESSION_A,
          tenantId: TENANT_A,
        }),
      );
      expect(d.journeysRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sessionId: IAM_SESSION_A }),
      );
      expect(d.consentsRepo.findLatest).toHaveBeenCalledWith(
        expect.anything(),
        'user-a',
        'p1',
      );
    });

    it('Límite: el reintento con la misma clave no inserta ni cuenta dos veces', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue(schemaWith());
      const journey: any = { id: 'j1', eventCount: 1 };
      d.journeysRepo.findOpenBySession.mockResolvedValue(journey);
      d.eventsRepo.findByIdempotencyKey.mockResolvedValue({ id: 'e0' });

      const res = await d.service.captureActivityEvents(
        {
          events: [
            { eventSchemaDefinitionId: 's1', eventIdempotencyKey: 'k1' },
          ],
        },
        actor,
      );

      expect(res).toMatchObject({ inserted: 0, skipped: 1 });
      expect(d.eventsRepo.create).not.toHaveBeenCalled();
      expect(journey.eventCount).toBe(1);
      // La clave se busca acotada al usuario: la de otro no descarta mis eventos.
      expect(d.eventsRepo.findByIdempotencyKey).toHaveBeenCalledWith(
        expect.anything(),
        'k1',
        'user-a',
      );
    });

    it('Error: el sessionJourneyId de otro usuario responde 404 y no toca el journey ni inserta', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue(schemaWith());
      const journeyB: any = {
        id: 'j-b',
        sessionId: 'iam-sess-b',
        eventCount: 7,
        entryEventId: 'x',
      };
      d.journeysRepo.findById.mockResolvedValue(journeyB);

      const error = await failure(
        d.service.captureActivityEvents(
          {
            events: [
              { eventSchemaDefinitionId: 's1', sessionJourneyId: 'j-b' },
            ],
          },
          actor,
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(TelemetryErrorReason.JOURNEY_OUT_OF_SCOPE);
      expect(error.details).toBeUndefined();
      expect(d.eventsRepo.create).not.toHaveBeenCalled();
      expect(journeyB.eventCount).toBe(7);
      expect(journeyB.exitEventId).toBeUndefined();
      expect(d.webAnalytics.trackActivityEvents).not.toHaveBeenCalled();
    });

    it('Error: el analyticsSubjectId de otro usuario responde 404 sin insertar', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue(schemaWith());
      d.subjectsRepo.findById.mockResolvedValue({
        id: 'sub-b',
        userId: 'user-b',
      });

      const error = await failure(
        d.service.captureActivityEvents(
          {
            events: [
              { eventSchemaDefinitionId: 's1', analyticsSubjectId: 'sub-b' },
            ],
          },
          actor,
        ),
      );

      expect(error.reason).toBe(TelemetryErrorReason.SUBJECT_OUT_OF_SCOPE);
      expect(d.eventsRepo.create).not.toHaveBeenCalled();
      expect(d.journeysRepo.create).not.toHaveBeenCalled();
    });

    it('un journey y un sujeto propios se aceptan', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue(schemaWith());
      d.subjectsRepo.findById.mockResolvedValue({
        id: 'sub-a',
        userId: 'user-a',
      });
      const journey: any = {
        id: 'j-a',
        sessionId: IAM_SESSION_A,
        eventCount: 0,
      };
      d.journeysRepo.findById.mockResolvedValue(journey);
      d.eventsRepo.create.mockReturnValue({ id: 'e1' });

      const res = await d.service.captureActivityEvents(
        {
          events: [
            {
              eventSchemaDefinitionId: 's1',
              analyticsSubjectId: 'sub-a',
              sessionJourneyId: 'j-a',
            },
          ],
        },
        actor,
      );

      expect(res.sessionJourneyId).toBe('j-a');
      expect(journey.eventCount).toBe(1);
    });

    it('412 si el token no corresponde a una sesión registrada', async () => {
      const d = build();
      const error = await failure(
        d.service.captureActivityEvents(
          { events: [{ eventSchemaDefinitionId: 's1' }] },
          { id: 'user-a', roles: [] } as any,
        ),
      );
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe(TelemetryErrorReason.SESSION_NOT_RESOLVED);
      expect(d.eventsRepo.create).not.toHaveBeenCalled();
    });

    it('skips events when consent is not granted', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue(schemaWith());
      d.consentsRepo.findLatest.mockResolvedValue({
        decisionConceptId: TELE.DECISION_WITHDRAWN,
      });

      const res = await d.service.captureActivityEvents(
        { events: [{ eventSchemaDefinitionId: 's1' }] },
        actor,
      );

      expect(res.inserted).toBe(0);
      expect(res.skipped).toBe(1);
      expect(d.eventsRepo.create).not.toHaveBeenCalled();
      // Lo que el gate descarta tampoco puede salir hacia la analítica externa.
      expect(d.webAnalytics.trackActivityEvents).toHaveBeenCalledWith([], {
        tenantId: undefined,
      });
    });

    describe('uso agregado sin consentimiento (PLATFORM_USAGE_AGGREGATE)', () => {
      const ANON_SCHEMA = 'anon-schema';
      const anonSchema = (over: Record<string, unknown> = {}) =>
        schemaWith({
          id: ANON_SCHEMA,
          eventName: 'pagina_vista_anonima',
          purposeDefinitionId: 'p-anon',
          propertySchemaJson: { type: 'object', properties: {} },
          ...over,
        });
      /** Esquema anónimo, propósito sin consentimiento y sin decisión del usuario. */
      const withoutConsentDecision = () => {
        const d = build();
        d.schemasRepo.findById.mockResolvedValue(anonSchema());
        d.purposesRepo.findById.mockResolvedValue({ requiresConsent: false });
        d.consentsRepo.findLatest.mockResolvedValue(null);
        d.eventsRepo.create.mockReturnValue({ id: 'e-anon' });
        return d;
      };

      it('Correcto: sin decisión de consentimiento la vista anónima entra sin usuario, sesión ni sujeto', async () => {
        const d = withoutConsentDecision();

        const res = await d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: ANON_SCHEMA,
                eventName: 'pagina_vista',
                routeTemplate: '/pacientes/:id/agenda',
              },
            ],
          },
          actor,
        );

        expect(res).toMatchObject({ inserted: 1, skipped: 0 });
        expect(res.sessionJourneyId).toBeUndefined();
        const row = d.eventsRepo.create.mock.calls[0][1];
        expect(row.userId).toBeUndefined();
        expect(row.sessionId).toBeUndefined();
        expect(row.analyticsSubjectId).toBeUndefined();
        expect(row.eventName).toBe('pagina_vista');
        expect(row.routeTemplate).toBe('/pacientes/:id/agenda');
        // No consulta el consentimiento, no abre journey, no reenvía.
        expect(d.consentsRepo.findLatest).not.toHaveBeenCalled();
        expect(d.journeysRepo.create).not.toHaveBeenCalled();
        expect(d.journeysRepo.findOpenBySession).not.toHaveBeenCalled();
        expect(d.webAnalytics.trackActivityEvents).toHaveBeenCalledWith([], {
          tenantId: undefined,
        });
      });

      it('Límite: otro nombre de evento se guarda con el del esquema y la clave se acota a los anónimos', async () => {
        const d = withoutConsentDecision();
        d.eventsRepo.findByIdempotencyKey.mockResolvedValue(null);

        await d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: ANON_SCHEMA,
                eventName: 'clic',
                eventIdempotencyKey: 'k1',
                routeTemplate: '/inicio',
              },
            ],
          },
          actor,
        );

        expect(d.eventsRepo.create.mock.calls[0][1].eventName).toBe(
          'pagina_vista_anonima',
        );
        // La clave del cliente no se guarda tal cual: se acota por un hash a
        // quien la envía, para que nadie pueda adelantarse con la misma clave.
        const [, usedKey, scope] =
          d.eventsRepo.findByIdempotencyKey.mock.calls[0];
        expect(usedKey).toMatch(/^[0-9a-f]{64}$/u);
        // Es un HMAC con secreto del servidor, no un hash que se pueda reconstruir
        // con datos conocidos.
        expect(usedKey).not.toBe(
          createHash('sha256')
            .update(`anon\u0000user-a\u0000${TENANT_A}\u0000k1`)
            .digest('hex'),
        );
        expect(usedKey).not.toBe('k1');
        expect(scope).toBeNull();
        expect(d.eventsRepo.create.mock.calls[0][1].eventIdempotencyKey).toBe(
          usedKey,
        );
      });

      it('Límite: en producción sin secreto el evento anónimo no se deduplica (clave aleatoria)', async () => {
        const antes = {
          env: process.env.NODE_ENV,
          secret: process.env.TELEMETRY_IDEMPOTENCY_SECRET,
        };
        process.env.NODE_ENV = 'production';
        delete process.env.TELEMETRY_IDEMPOTENCY_SECRET;
        try {
          const d = withoutConsentDecision();
          d.eventsRepo.findByIdempotencyKey.mockResolvedValue(null);
          const batch = {
            events: [
              {
                eventSchemaDefinitionId: ANON_SCHEMA,
                eventIdempotencyKey: 'k1',
                routeTemplate: '/inicio',
              },
            ],
          };
          await d.service.captureActivityEvents(batch, actor);
          await d.service.captureActivityEvents(batch, actor);
          const keys = d.eventsRepo.findByIdempotencyKey.mock.calls.map(
            (c: unknown[]) => c[1],
          );
          expect(new Set(keys).size).toBe(2);
        } finally {
          process.env.NODE_ENV = antes.env;
          if (antes.secret === undefined)
            delete process.env.TELEMETRY_IDEMPOTENCY_SECRET;
          else process.env.TELEMETRY_IDEMPOTENCY_SECRET = antes.secret;
        }
      });

      it('Límite: la misma clave de dos personas distintas no colisiona entre anónimos', async () => {
        const d = withoutConsentDecision();
        d.eventsRepo.findByIdempotencyKey.mockResolvedValue(null);
        const batch = {
          events: [
            {
              eventSchemaDefinitionId: ANON_SCHEMA,
              eventIdempotencyKey: 'misma',
              routeTemplate: '/inicio',
            },
          ],
        };

        await d.service.captureActivityEvents(batch, actor);
        await d.service.captureActivityEvents(batch, {
          ...actor,
          id: 'user-b',
          sessionId: 'sess-token-b',
        });

        const keys = d.eventsRepo.findByIdempotencyKey.mock.calls.map(
          (c: unknown[]) => c[1],
        );
        expect(new Set(keys).size).toBe(2);
      });

      it('Límite: el reenvío anónimo con la misma clave no inserta', async () => {
        const d = withoutConsentDecision();
        d.eventsRepo.findByIdempotencyKey.mockResolvedValue({ id: 'previo' });

        const res = await d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: ANON_SCHEMA,
                eventIdempotencyKey: 'k1',
                routeTemplate: '/inicio',
              },
            ],
          },
          actor,
        );

        expect(res).toMatchObject({ inserted: 0, skipped: 1 });
        expect(d.eventsRepo.create).not.toHaveBeenCalled();
      });

      it.each([
        ['sin plantilla de ruta', undefined],
        ['con un correo en la ruta', '/u/ana@correo.com'],
        ['con un documento en la ruta', '/pacientes/12345678/ficha'],
        [
          'con un UUID en la ruta',
          '/pacientes/3f2b8c1e-9d4a-4c7e-8a11-5b6d7e8f9a0b',
        ],
        ['con un tramo hexadecimal corto', '/enlace/a3f9c2e1b7'],
        ['con texto libre en mayúsculas', '/Juan-Perez/ficha'],
        ['con un punto o un espacio', '/inicio/mi ficha.v2'],
        ['con un parámetro que arrastra dígitos', '/enlace/:a1234567890'],
        ['con más de ocho segmentos', '/a/b/c/d/e/f/g/h/i'],
      ])('Error 422: %s', async (_name, routeTemplate) => {
        const d = withoutConsentDecision();

        const error = await failure(
          d.service.captureActivityEvents(
            {
              events: [{ eventSchemaDefinitionId: ANON_SCHEMA, routeTemplate }],
            },
            actor,
          ),
        );

        expect(error.reason).toBe(TelemetryErrorReason.ANONYMOUS_ROUTE_INVALID);
        expect(d.eventsRepo.create).not.toHaveBeenCalled();
      });

      it('Error 422: el esquema anónimo no admite propiedades', async () => {
        const d = withoutConsentDecision();

        const error = await failure(
          d.service.captureActivityEvents(
            {
              events: [
                {
                  eventSchemaDefinitionId: ANON_SCHEMA,
                  routeTemplate: '/inicio',
                  properties: [{ propertyName: 'x_doc', valueNumber: 0.5 }],
                },
              ],
            },
            actor,
          ),
        );

        expect(error.reason).toBe(
          TelemetryErrorReason.EVENT_PROPERTY_NOT_ALLOWED,
        );
        expect(d.eventsRepo.create).not.toHaveBeenCalled();
      });

      it('Autorización negativa: un evento con sujeto sigue descartado sin consentimiento aunque el propósito no lo exija', async () => {
        const d = withoutConsentDecision();
        d.subjectsRepo.findById.mockResolvedValue({
          id: 'subj-a',
          userId: 'user-a',
        });

        const res = await d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: ANON_SCHEMA,
                analyticsSubjectId: 'subj-a',
                routeTemplate: '/inicio',
              },
            ],
          },
          actor,
        );

        expect(res).toMatchObject({ inserted: 0, skipped: 1 });
        expect(d.eventsRepo.create).not.toHaveBeenCalled();
      });

      it('Autorización negativa: el sujeto de otro usuario sigue respondiendo 404', async () => {
        const d = withoutConsentDecision();
        d.subjectsRepo.findById.mockResolvedValue({
          id: 'subj-b',
          userId: 'user-b',
        });

        const error = await failure(
          d.service.captureActivityEvents(
            {
              events: [
                {
                  eventSchemaDefinitionId: ANON_SCHEMA,
                  analyticsSubjectId: 'subj-b',
                  routeTemplate: '/inicio',
                },
              ],
            },
            actor,
          ),
        );

        expect(error).toBeInstanceOf(ResourceNotFoundException);
        expect(d.eventsRepo.create).not.toHaveBeenCalled();
      });

      it('Autorización negativa: un propósito sin dato de requires_consent exige consentimiento', async () => {
        const d = withoutConsentDecision();
        d.purposesRepo.findById.mockResolvedValue({ requiresConsent: null });

        const res = await d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: ANON_SCHEMA,
                routeTemplate: '/inicio',
              },
            ],
          },
          actor,
        );

        expect(res).toMatchObject({ inserted: 0, skipped: 1 });
      });

      it('Autorización negativa: el clic identificable de ux_interaccion se descarta sin decisión', async () => {
        const d = build();
        d.schemasRepo.findById.mockResolvedValue(schemaWith());
        d.purposesRepo.findById.mockResolvedValue({ requiresConsent: true });
        d.consentsRepo.findLatest.mockResolvedValue(null);

        const res = await d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: 's1',
                eventName: 'clic',
                routeTemplate: '/inicio',
              },
            ],
          },
          actor,
        );

        expect(res).toMatchObject({ inserted: 0, skipped: 1 });
        expect(d.eventsRepo.create).not.toHaveBeenCalled();
      });

      it('Lote mixto sin decisión: entra la vista anónima y se descarta el clic', async () => {
        const d = build();
        d.schemasRepo.findById.mockImplementation((_tx: unknown, id: string) =>
          Promise.resolve(id === ANON_SCHEMA ? anonSchema() : schemaWith()),
        );
        d.purposesRepo.findById.mockImplementation((_tx: unknown, id: string) =>
          Promise.resolve({ requiresConsent: id !== 'p-anon' }),
        );
        d.consentsRepo.findLatest.mockResolvedValue(null);
        d.eventsRepo.create.mockReturnValue({ id: 'e-anon' });

        const res = await d.service.captureActivityEvents(
          {
            events: [
              { eventSchemaDefinitionId: 's1', eventName: 'clic' },
              {
                eventSchemaDefinitionId: ANON_SCHEMA,
                routeTemplate: '/inicio',
              },
            ],
          },
          actor,
        );

        expect(res).toMatchObject({ inserted: 1, skipped: 1 });
        expect(d.eventsRepo.create).toHaveBeenCalledTimes(1);
      });

      it('412: un esquema DEPRECATED ya no acepta eventos', async () => {
        const d = build();
        d.schemasRepo.findById.mockResolvedValue(
          schemaWith({ statusConceptId: TELE.SCHEMA_DEPRECATED }),
        );

        const error = await failure(
          d.service.captureActivityEvents(
            { events: [{ eventSchemaDefinitionId: 's1' }] },
            actor,
          ),
        );

        expect(error).toBeInstanceOf(PreconditionFailedException);
        expect(error.reason).toBe(TelemetryErrorReason.EVENT_SCHEMA_NOT_ACTIVE);
        expect(d.eventsRepo.create).not.toHaveBeenCalled();
      });
    });

    it('forwards what it persisted to the web analytics adapter', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue(schemaWith());
      d.subjectsRepo.findById.mockResolvedValue({
        id: 'subj-1',
        userId: 'user-a',
      });
      d.journeysRepo.create.mockReturnValue({ id: 'j1', eventCount: 0 });
      d.eventsRepo.create.mockReturnValue({ id: 'e1' });

      await runWithTenant('t1', () =>
        d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: 's1',
                analyticsSubjectId: 'subj-1',
                routeTemplate: '/doctores/:id',
                occurredAt: '2026-08-17T10:00:00.000Z',
                properties: [
                  { propertyName: 'specialty', valueString: 'cardio' },
                ],
              },
            ],
          },
          actor,
        ),
      );

      expect(d.webAnalytics.trackActivityEvents).toHaveBeenCalledWith(
        [
          {
            eventName: 'page_view',
            analyticsSubjectId: 'subj-1',
            sessionJourneyId: 'j1',
            routeTemplate: '/doctores/:id',
            occurredAt: new Date('2026-08-17T10:00:00.000Z'),
            consentGranted: true,
            properties: { specialty: 'cardio' },
          },
        ],
        { tenantId: 't1' },
      );
    });

    it('404 when a schema is missing', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.captureActivityEvents(
          { events: [{ eventSchemaDefinitionId: 'nope' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    describe('gobernanza de propiedades (TEL-03)', () => {
      it('Error: una clave no declarada en el esquema revierte el evento y nada llega al proveedor', async () => {
        const d = build();
        d.schemasRepo.findById.mockResolvedValue(schemaWith());

        const error = await failure(
          d.service.captureActivityEvents(
            {
              events: [
                {
                  eventSchemaDefinitionId: 's1',
                  properties: [
                    { propertyName: 'fingerprint', valueString: 'abc' },
                  ],
                },
              ],
            },
            actor,
          ),
        );

        expect(error.getStatus()).toBe(422);
        expect(error.reason).toBe(
          TelemetryErrorReason.EVENT_PROPERTY_NOT_ALLOWED,
        );
        expect(d.eventsRepo.create).not.toHaveBeenCalled();
        expect(d.propertiesRepo.create).not.toHaveBeenCalled();
        expect(d.webAnalytics.trackActivityEvents).not.toHaveBeenCalled();
      });

      it('Falla catalogada: email se rechaza sin devolver ni registrar su valor', async () => {
        const d = build();
        d.schemasRepo.findById.mockResolvedValue(schemaWith());

        const error = await failure(
          d.service.captureActivityEvents(
            {
              events: [
                {
                  eventSchemaDefinitionId: 's1',
                  properties: [
                    {
                      propertyName: 'email',
                      valueString: 'persona@example.test',
                    },
                  ],
                },
              ],
            },
            actor,
          ),
        );

        expect(error.reason).toBe(
          TelemetryErrorReason.EVENT_PROPERTY_NOT_ALLOWED,
        );
        const visible = JSON.stringify([
          error.getResponse(),
          d.webAnalytics.trackActivityEvents.mock.calls,
          (d as any).tx.flush.mock.calls,
        ]);
        expect(visible).not.toContain('persona@example.test');
        expect(visible).not.toContain('"email"');
      });

      it('Falla catalogada: PHI declarado con phiAllowed=false se rechaza', async () => {
        const d = build();
        d.schemasRepo.findById.mockResolvedValue(schemaWith());

        const error = await failure(
          d.service.captureActivityEvents(
            {
              events: [
                {
                  eventSchemaDefinitionId: 's1',
                  properties: [{ propertyName: 'note', valueString: 'tos' }],
                },
              ],
            },
            actor,
          ),
        );

        expect(error.reason).toBe(
          TelemetryErrorReason.EVENT_PROPERTY_NOT_ALLOWED,
        );
        expect(d.eventsRepo.create).not.toHaveBeenCalled();
      });

      it('Correcto: sólo la propiedad declarada se persiste y llega al puerto', async () => {
        const d = build();
        d.schemasRepo.findById.mockResolvedValue(schemaWith());
        d.journeysRepo.create.mockReturnValue({ id: 'j1', eventCount: 0 });
        d.eventsRepo.create.mockReturnValue({ id: 'e1' });

        await d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: 's1',
                properties: [
                  {
                    propertyName: 'screen_name',
                    valueString: 'home',
                    // El cliente no decide la clasificación.
                    dataClassificationConceptId: 'cliente-dice-publico',
                  },
                ],
              },
            ],
          },
          actor,
        );

        expect(d.propertiesRepo.create).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            propertyName: 'screen_name',
            valueString: 'home',
            dataClassificationConceptId: TELE.DATA_CLASS_INTERNAL,
          }),
        );
        const [sent] = d.webAnalytics.trackActivityEvents.mock.calls[0];
        expect(sent[0].properties).toEqual({ screen_name: 'home' });
      });

      it('Límite: 25 propiedades admitidas en su longitud máxima se conservan sin truncar', async () => {
        const d = build();
        const properties: Record<string, unknown> = {};
        const names = Array.from({ length: 25 }, (_, i) => `prop_${i}`);
        for (const name of names) {
          properties[name] = { type: 'string', maxLength: 30 };
        }
        d.schemasRepo.findById.mockResolvedValue(
          schemaWith({ propertySchemaJson: { properties } }),
        );
        d.journeysRepo.create.mockReturnValue({ id: 'j1', eventCount: 0 });
        d.eventsRepo.create.mockReturnValue({ id: 'e1' });

        await d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: 's1',
                properties: names.map((propertyName) => ({
                  propertyName,
                  valueString: 'x'.repeat(30),
                })),
              },
            ],
          },
          actor,
        );

        const [sent] = d.webAnalytics.trackActivityEvents.mock.calls[0];
        expect(Object.keys(sent[0].properties)).toHaveLength(25);
        expect(sent[0].properties.prop_24).toBe('x'.repeat(30));
      });

      it('lo marcado forward:false se persiste pero no sale al proveedor', async () => {
        const d = build();
        d.schemasRepo.findById.mockResolvedValue(
          schemaWith({
            propertySchemaJson: {
              properties: {
                screen_name: { type: 'string' },
                region: { type: 'string', forward: false },
              },
            },
          }),
        );
        d.journeysRepo.create.mockReturnValue({ id: 'j1', eventCount: 0 });
        d.eventsRepo.create.mockReturnValue({ id: 'e1' });

        await d.service.captureActivityEvents(
          {
            events: [
              {
                eventSchemaDefinitionId: 's1',
                properties: [
                  { propertyName: 'screen_name', valueString: 'home' },
                  { propertyName: 'region', valueString: 'sc' },
                ],
              },
            ],
          },
          actor,
        );

        expect(d.propertiesRepo.create).toHaveBeenCalledTimes(2);
        const [sent] = d.webAnalytics.trackActivityEvents.mock.calls[0];
        expect(sent[0].properties).toEqual({ screen_name: 'home' });
      });
    });
  });

  describe('captureClientContext (UC-28-08)', () => {
    it('creates a journey and the client context on the authenticated session', async () => {
      const d = build();
      d.journeysRepo.create.mockReturnValue({ id: 'j1', startedAt: undefined });
      d.contextsRepo.create.mockReturnValue({
        id: 'ctx1',
        createdAt: new Date(),
      });
      const res = await d.service.captureClientContext(
        { sessionId: 'sess-del-cliente' } as any,
        actor,
      );
      expect(res.id).toBe('ctx1');
      expect(res.sessionJourneyId).toBe('j1');
      expect(d.contextsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sessionId: IAM_SESSION_A }),
      );
    });

    it('404 when the referenced journey does not exist', async () => {
      const d = build();
      d.journeysRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.captureClientContext(
          { sessionJourneyId: 'j9' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('Error: el journey de otro usuario responde 404 y no crea contexto', async () => {
      const d = build();
      d.journeysRepo.findById.mockResolvedValue({
        id: 'j-b',
        sessionId: 'iam-sess-b',
      });
      const error = await failure(
        d.service.captureClientContext(
          { sessionJourneyId: 'j-b' } as any,
          actor,
        ),
      );
      expect(error.reason).toBe(TelemetryErrorReason.JOURNEY_OUT_OF_SCOPE);
      expect(d.contextsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('recordWebVitals (UC-28-09)', () => {
    it('records a batch of metrics', async () => {
      const d = build();
      d.webVitalsRepo.create
        .mockReturnValueOnce({ id: 'w1' })
        .mockReturnValueOnce({ id: 'w2' });
      const res = await d.service.recordWebVitals(
        {
          metrics: [
            { metric: 'LCP', metricValue: 1200 },
            { metric: 'CLS', metricValue: 0.1 },
          ],
        },
        actor,
      );
      expect(res.inserted).toBe(2);
      expect(res.ids).toEqual(['w1', 'w2']);
      const [forwarded] = d.webAnalytics.trackWebVitals.mock.calls[0];
      expect(forwarded).toHaveLength(2);
      expect(forwarded[0]).toMatchObject({ metric: 'LCP', metricValue: 1200 });
    });

    it('404 when a referenced journey is missing', async () => {
      const d = build();
      d.journeysRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.recordWebVitals(
          {
            metrics: [
              { metric: 'LCP', metricValue: 1, sessionJourneyId: 'j9' },
            ],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it.each([
      [
        'journey',
        { sessionJourneyId: 'x' },
        TelemetryErrorReason.JOURNEY_OUT_OF_SCOPE,
      ],
      [
        'sujeto',
        { analyticsSubjectId: 'x' },
        TelemetryErrorReason.SUBJECT_OUT_OF_SCOPE,
      ],
      [
        'evento',
        { userActivityEventId: 'x' },
        TelemetryErrorReason.EVENT_OUT_OF_SCOPE,
      ],
      [
        'contexto',
        { clientContextId: 'x' },
        TelemetryErrorReason.CONTEXT_OUT_OF_SCOPE,
      ],
    ])(
      'Error: %s de otro usuario responde 404 y no inserta la métrica',
      async (_k, ref, reason) => {
        const d = build();
        d.journeysRepo.findById.mockResolvedValue({
          id: 'x',
          sessionId: 'iam-sess-b',
        });
        d.subjectsRepo.findById.mockResolvedValue({
          id: 'x',
          userId: 'user-b',
        });
        d.eventsRepo.findById.mockResolvedValue({ id: 'x', userId: 'user-b' });
        d.contextsRepo.findById.mockResolvedValue({
          id: 'x',
          sessionId: 'iam-sess-b',
        });

        const error = await failure(
          d.service.recordWebVitals(
            { metrics: [{ metric: 'LCP', metricValue: 1, ...ref }] } as any,
            actor,
          ),
        );

        expect(error.reason).toBe(reason);
        expect(d.webVitalsRepo.create).not.toHaveBeenCalled();
        expect(d.webAnalytics.trackWebVitals).not.toHaveBeenCalled();
      },
    );
  });

  describe('recordConversion (UC-28-11)', () => {
    it('records a conversion and marks the journey converted', async () => {
      const d = build();
      d.funnelsRepo.findById.mockResolvedValue({
        id: 'f1',
        funnelCode: 'appointment_booked',
        versionNumber: 2,
      });
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', userId: 'user-a' });
      d.conversionsRepo.findExisting.mockResolvedValue(null);
      d.conversionsRepo.create.mockReturnValue({
        id: 'cv1',
        funnelDefinitionId: 'f1',
        analyticsSubjectId: 's1',
      });
      const journey: any = {
        id: 'j1',
        sessionId: IAM_SESSION_A,
        journeyStatusConceptId: TELE.JOURNEY_OPEN,
      };
      d.journeysRepo.findById.mockResolvedValue(journey);

      const res = await d.service.recordConversion(
        {
          funnelDefinitionId: 'f1',
          analyticsSubjectId: 's1',
          sessionJourneyId: 'j1',
        },
        actor,
      );
      expect(res.id).toBe('cv1');
      expect(journey.journeyStatusConceptId).toBe(TELE.JOURNEY_CONVERTED);
      expect(d.webAnalytics.trackConversion).toHaveBeenCalledWith(
        expect.objectContaining({
          funnelCode: 'appointment_booked',
          funnelVersion: 2,
          analyticsSubjectId: 's1',
          sessionJourneyId: 'j1',
        }),
      );
    });

    it('does not re-forward an already recorded conversion', async () => {
      const d = build();
      d.funnelsRepo.findById.mockResolvedValue({ id: 'f1' });
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', userId: 'user-a' });
      d.conversionsRepo.findExisting.mockResolvedValue({
        id: 'cv1',
        funnelDefinitionId: 'f1',
        analyticsSubjectId: 's1',
        createdAt: new Date(),
      });

      const res = await d.service.recordConversion(
        {
          funnelDefinitionId: 'f1',
          analyticsSubjectId: 's1',
        },
        actor,
      );

      expect(res.id).toBe('cv1');
      // GA4 no deduplica eventos clave: reenviarla contaría dos conversiones.
      expect(d.webAnalytics.trackConversion).not.toHaveBeenCalled();
    });

    it('404 when the funnel is missing', async () => {
      const d = build();
      d.funnelsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.recordConversion(
          {
            funnelDefinitionId: 'f9',
            analyticsSubjectId: 's1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('Error: la conversión a nombre del sujeto de otro usuario responde 404 sin escribir', async () => {
      const d = build();
      d.funnelsRepo.findById.mockResolvedValue({ id: 'f1' });
      d.subjectsRepo.findById.mockResolvedValue({
        id: 's-b',
        userId: 'user-b',
      });

      const error = await failure(
        d.service.recordConversion(
          { funnelDefinitionId: 'f1', analyticsSubjectId: 's-b' },
          actor,
        ),
      );

      expect(error.reason).toBe(TelemetryErrorReason.SUBJECT_OUT_OF_SCOPE);
      expect(d.conversionsRepo.create).not.toHaveBeenCalled();
      expect(d.webAnalytics.trackConversion).not.toHaveBeenCalled();
    });

    it('Error: marcar convertido el journey de otro usuario responde 404 sin escribir', async () => {
      const d = build();
      d.funnelsRepo.findById.mockResolvedValue({ id: 'f1' });
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', userId: 'user-a' });
      const journeyB: any = {
        id: 'j-b',
        sessionId: 'iam-sess-b',
        journeyStatusConceptId: TELE.JOURNEY_OPEN,
      };
      d.journeysRepo.findById.mockResolvedValue(journeyB);

      const error = await failure(
        d.service.recordConversion(
          {
            funnelDefinitionId: 'f1',
            analyticsSubjectId: 's1',
            sessionJourneyId: 'j-b',
          },
          actor,
        ),
      );

      expect(error.reason).toBe(TelemetryErrorReason.JOURNEY_OUT_OF_SCOPE);
      expect(journeyB.journeyStatusConceptId).toBe(TELE.JOURNEY_OPEN);
      expect(d.conversionsRepo.create).not.toHaveBeenCalled();
    });

    it('Error: el completionEventId de otro usuario responde 404 sin escribir', async () => {
      const d = build();
      d.funnelsRepo.findById.mockResolvedValue({ id: 'f1' });
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', userId: 'user-a' });
      d.eventsRepo.findById.mockResolvedValue({ id: 'e-b', userId: 'user-b' });

      const error = await failure(
        d.service.recordConversion(
          {
            funnelDefinitionId: 'f1',
            analyticsSubjectId: 's1',
            completionEventId: 'e-b',
          },
          actor,
        ),
      );

      expect(error.reason).toBe(TelemetryErrorReason.EVENT_OUT_OF_SCOPE);
      expect(d.conversionsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('closeJourney (UC-28-13)', () => {
    it('closes an open journey', async () => {
      const d = build();
      const journey: any = {
        id: 'j1',
        sessionId: IAM_SESSION_A,
        journeyStatusConceptId: TELE.JOURNEY_OPEN,
        eventCount: 3,
      };
      d.journeysRepo.findById.mockResolvedValue(journey);
      const res = await d.service.closeJourney('j1', {}, actor);
      expect(res.journeyStatusConceptId).toBe(TELE.JOURNEY_CLOSED);
      expect(journey.endedAt).toBeInstanceOf(Date);
    });

    it('404 when the journey is missing', async () => {
      const d = build();
      d.journeysRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.closeJourney('j9', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('422 when the journey is already closed', async () => {
      const d = build();
      d.journeysRepo.findById.mockResolvedValue({
        id: 'j1',
        sessionId: IAM_SESSION_A,
        journeyStatusConceptId: TELE.JOURNEY_CLOSED,
      });
      await expect(
        d.service.closeJourney('j1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('Falla catalogada: cerrar el journey de otro usuario responde igual que uno inexistente y no lo muta', async () => {
      const ajeno = build();
      const journeyB: any = {
        id: 'j-b',
        sessionId: 'iam-sess-b',
        journeyStatusConceptId: TELE.JOURNEY_OPEN,
        eventCount: 4,
      };
      ajeno.journeysRepo.findById.mockResolvedValue(journeyB);
      const inexistente = build();
      inexistente.journeysRepo.findById.mockResolvedValue(null);

      const a = await failure(ajeno.service.closeJourney('j-b', {}, actor));
      const b = await failure(
        inexistente.service.closeJourney('j-b', {}, actor),
      );

      expect(a.getStatus()).toBe(404);
      expect(a.reason).toBe(TelemetryErrorReason.JOURNEY_OUT_OF_SCOPE);
      expect(a.getResponse()).toEqual(b.getResponse());
      expect(journeyB.journeyStatusConceptId).toBe(TELE.JOURNEY_OPEN);
      expect(journeyB.endedAt).toBeUndefined();
      expect(journeyB.eventCount).toBe(4);
    });

    it('Error: el exitEventId de otro usuario responde 404 y no cierra', async () => {
      const d = build();
      const journey: any = {
        id: 'j1',
        sessionId: IAM_SESSION_A,
        journeyStatusConceptId: TELE.JOURNEY_OPEN,
      };
      d.journeysRepo.findById.mockResolvedValue(journey);
      d.eventsRepo.findById.mockResolvedValue({ id: 'e-b', userId: 'user-b' });

      const error = await failure(
        d.service.closeJourney('j1', { exitEventId: 'e-b' }, actor),
      );

      expect(error.reason).toBe(TelemetryErrorReason.EVENT_OUT_OF_SCOPE);
      expect(journey.journeyStatusConceptId).toBe(TELE.JOURNEY_OPEN);
    });
  });

  describe('cuerpo de la ingesta (TEL-02)', () => {
    const pipe = createGlobalValidationPipe();
    const SCHEMA = '3b6f7a52-2a2e-4a53-9f3b-0d5a1d3c9e11';
    const OTHER = '3b6f7a52-2a2e-4a53-9f3b-0d5a1d3c9e12';

    it.each(['userId', 'sessionId', 'tenantId'])(
      'el pipe global rechaza %s en un evento: la identidad no viene del cliente',
      async (field) => {
        await expect(
          pipe.transform(
            {
              events: [{ eventSchemaDefinitionId: SCHEMA, [field]: OTHER }],
            },
            { type: 'body', metatype: CaptureActivityEventsDto },
          ),
        ).rejects.toMatchObject({ status: 400 });
      },
    );

    it('el pipe global rechaza sessionId en el contexto de cliente', async () => {
      await expect(
        pipe.transform(
          { sessionId: OTHER },
          { type: 'body', metatype: CreateClientContextDto },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('un evento sin campos de identidad pasa la validación', async () => {
      await expect(
        pipe.transform(
          { events: [{ eventSchemaDefinitionId: SCHEMA }] },
          { type: 'body', metatype: CaptureActivityEventsDto },
        ),
      ).resolves.toBeInstanceOf(CaptureActivityEventsDto);
    });

    it('más de 25 propiedades por evento se rechaza antes de llegar al servicio', async () => {
      const properties = Array.from({ length: 26 }, (_, i) => ({
        propertyName: `p${i}`,
        valueString: 'x',
      }));
      await expect(
        pipe.transform(
          { events: [{ eventSchemaDefinitionId: SCHEMA, properties }] },
          { type: 'body', metatype: CaptureActivityEventsDto },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });
  });
});
