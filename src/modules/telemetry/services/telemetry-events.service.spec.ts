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
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { TELE } from '../telemetry.concepts';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const schemasRepo = { findById: mockFn() };
  const eventsRepo = { findByIdempotencyKey: mockFn(), create: mockFn() };
  const propertiesRepo = { create: mockFn() };
  const journeysRepo = {
    findById: mockFn(),
    findOpenBySession: mockFn(),
    create: mockFn(),
  };
  const contextsRepo = { create: mockFn() };
  const webVitalsRepo = { create: mockFn() };
  const funnelsRepo = { findById: mockFn() };
  const conversionsRepo = { findExisting: mockFn(), create: mockFn() };
  const subjectsRepo = { findById: mockFn() };
  const consentsRepo = { findLatest: mockFn() };
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
    webAnalytics,
  };
}

describe('TelemetryEventsService', () => {
  describe('captureActivityEvents (UC-28-07)', () => {
    it('captures a batch and materializes a journey', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue({
        id: 's1',
        eventName: 'page_view',
        purposeDefinitionId: 'p1',
        portalTypeConceptId: TELE.PORTAL_WEB,
      });
      const journey: any = {
        id: 'j1',
        entryEventId: undefined,
        exitEventId: undefined,
        eventCount: 0,
      };
      d.journeysRepo.create.mockReturnValue(journey);
      d.eventsRepo.create.mockReturnValue({ id: 'e1' });

      const res = await d.service.captureActivityEvents({
        events: [
          {
            eventSchemaDefinitionId: 's1',
            sessionId: 'sess-1',
            properties: [{ propertyName: 'k', valueString: 'v' }],
          },
        ],
      });

      expect(res.inserted).toBe(1);
      expect(res.eventIds).toEqual(['e1']);
      expect(res.sessionJourneyId).toBe('j1');
      expect(journey.eventCount).toBe(1);
      expect(d.propertiesRepo.create).toHaveBeenCalledTimes(1);
    });

    it('skips events when consent is not granted', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue({
        id: 's1',
        eventName: 'x',
        purposeDefinitionId: 'p1',
      });
      d.consentsRepo.findLatest.mockResolvedValue({
        decisionConceptId: TELE.DECISION_WITHDRAWN,
      });

      const res = await d.service.captureActivityEvents({
        events: [{ eventSchemaDefinitionId: 's1', userId: 'u1' }],
      });

      expect(res.inserted).toBe(0);
      expect(res.skipped).toBe(1);
      expect(d.eventsRepo.create).not.toHaveBeenCalled();
      // Lo que el gate descarta tampoco puede salir hacia la analítica externa.
      expect(d.webAnalytics.trackActivityEvents).toHaveBeenCalledWith([], {
        tenantId: undefined,
      });
    });

    it('forwards what it persisted to the web analytics adapter', async () => {
      const d = build();
      d.schemasRepo.findById.mockResolvedValue({
        id: 's1',
        eventName: 'page_view',
        purposeDefinitionId: 'p1',
        portalTypeConceptId: TELE.PORTAL_WEB,
      });
      d.journeysRepo.create.mockReturnValue({ id: 'j1', eventCount: 0 });
      d.eventsRepo.create.mockReturnValue({ id: 'e1' });

      await d.service.captureActivityEvents({
        events: [
          {
            eventSchemaDefinitionId: 's1',
            sessionId: 'sess-1',
            tenantId: 't1',
            analyticsSubjectId: 'subj-1',
            routeTemplate: '/doctores/:id',
            occurredAt: '2026-08-17T10:00:00.000Z',
            properties: [{ propertyName: 'specialty', valueString: 'cardio' }],
          },
        ],
      });

      expect(d.webAnalytics.trackActivityEvents).toHaveBeenCalledWith(
        [
          {
            eventName: 'page_view',
            analyticsSubjectId: 'subj-1',
            sessionJourneyId: 'j1',
            routeTemplate: '/doctores/:id',
            occurredAt: new Date('2026-08-17T10:00:00.000Z'),
            consentGranted: false,
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
        d.service.captureActivityEvents({
          events: [{ eventSchemaDefinitionId: 'nope' }],
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('captureClientContext (UC-28-08)', () => {
    it('creates a journey and the client context', async () => {
      const d = build();
      d.journeysRepo.create.mockReturnValue({ id: 'j1', startedAt: undefined });
      d.contextsRepo.create.mockReturnValue({
        id: 'ctx1',
        createdAt: new Date(),
      });
      const res = await d.service.captureClientContext({
        sessionId: 'sess-1',
      });
      expect(res.id).toBe('ctx1');
      expect(res.sessionJourneyId).toBe('j1');
    });

    it('404 when the referenced journey does not exist', async () => {
      const d = build();
      d.journeysRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.captureClientContext({ sessionJourneyId: 'j9' } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordWebVitals (UC-28-09)', () => {
    it('records a batch of metrics', async () => {
      const d = build();
      d.webVitalsRepo.create
        .mockReturnValueOnce({ id: 'w1' })
        .mockReturnValueOnce({ id: 'w2' });
      const res = await d.service.recordWebVitals({
        metrics: [
          { metric: 'LCP', metricValue: 1200 },
          { metric: 'CLS', metricValue: 0.1 },
        ],
      });
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
        d.service.recordWebVitals({
          metrics: [{ metric: 'LCP', metricValue: 1, sessionJourneyId: 'j9' }],
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordConversion (UC-28-11)', () => {
    it('records a conversion and marks the journey converted', async () => {
      const d = build();
      d.funnelsRepo.findById.mockResolvedValue({
        id: 'f1',
        funnelCode: 'appointment_booked',
        versionNumber: 2,
      });
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1' });
      d.conversionsRepo.findExisting.mockResolvedValue(null);
      d.conversionsRepo.create.mockReturnValue({
        id: 'cv1',
        funnelDefinitionId: 'f1',
        analyticsSubjectId: 's1',
      });
      const journey: any = {
        id: 'j1',
        journeyStatusConceptId: TELE.JOURNEY_OPEN,
      };
      d.journeysRepo.findById.mockResolvedValue(journey);

      const res = await d.service.recordConversion({
        funnelDefinitionId: 'f1',
        analyticsSubjectId: 's1',
        sessionJourneyId: 'j1',
      });
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
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1' });
      d.conversionsRepo.findExisting.mockResolvedValue({
        id: 'cv1',
        funnelDefinitionId: 'f1',
        analyticsSubjectId: 's1',
        createdAt: new Date(),
      });

      const res = await d.service.recordConversion({
        funnelDefinitionId: 'f1',
        analyticsSubjectId: 's1',
      });

      expect(res.id).toBe('cv1');
      // GA4 no deduplica eventos clave: reenviarla contaría dos conversiones.
      expect(d.webAnalytics.trackConversion).not.toHaveBeenCalled();
    });

    it('404 when the funnel is missing', async () => {
      const d = build();
      d.funnelsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.recordConversion({
          funnelDefinitionId: 'f9',
          analyticsSubjectId: 's1',
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('closeJourney (UC-28-13)', () => {
    it('closes an open journey', async () => {
      const d = build();
      const journey: any = {
        id: 'j1',
        journeyStatusConceptId: TELE.JOURNEY_OPEN,
        eventCount: 3,
      };
      d.journeysRepo.findById.mockResolvedValue(journey);
      const res = await d.service.closeJourney('j1', {});
      expect(res.journeyStatusConceptId).toBe(TELE.JOURNEY_CLOSED);
      expect(journey.endedAt).toBeInstanceOf(Date);
    });

    it('404 when the journey is missing', async () => {
      const d = build();
      d.journeysRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.closeJourney('j9', {} as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('422 when the journey is already closed', async () => {
      const d = build();
      d.journeysRepo.findById.mockResolvedValue({
        id: 'j1',
        journeyStatusConceptId: TELE.JOURNEY_CLOSED,
      });
      await expect(
        d.service.closeJourney('j1', {} as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
