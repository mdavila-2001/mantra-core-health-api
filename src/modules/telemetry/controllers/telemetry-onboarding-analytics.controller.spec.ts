import { createGlobalValidationPipe } from '../../../common';
import {
  IngestOnboardingEventsDto,
  TelemetryOnboardingAnalyticsController,
} from './telemetry-onboarding-analytics.controller';
import { TelemetryOnboardingAnalyticsService } from '../services/telemetry-onboarding-analytics.service';

describe('TelemetryOnboardingAnalyticsController', () => {
  let controller: TelemetryOnboardingAnalyticsController;
  let service: TelemetryOnboardingAnalyticsService;

  beforeEach(() => {
    service = new TelemetryOnboardingAnalyticsService();
    controller = new TelemetryOnboardingAnalyticsController(service);
  });

  it('registra eventos de telemetría de onboarding', () => {
    const result = controller.recordEvents({
      events: [
        {
          eventType: 'step_view',
          formType: 'patient',
          draftId: 'draft-1',
          stepIndex: 0,
          stepKey: 'identidad',
          timestamp: new Date().toISOString(),
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it('genera reporte de embudo con métricas de deserción por paso', () => {
    const report = controller.getFunnelReport('patient', '7d');
    expect(report.formType).toBe('patient');
    expect(report.totalStarted).toBeGreaterThan(0);
    expect(report.steps.length).toBeGreaterThan(0);
    expect(report.steps[0].stepNumber).toBe(1);
    expect(report.bottleneckStepNumber).toBeDefined();
  });

  it('genera reporte de mapa de calor con puntajes térmicos por campo', () => {
    const report = controller.getHeatmapReport('patient', 'errors', '7d');
    expect(report.formType).toBe('patient');
    expect(report.metric).toBe('errors');
    expect(report.fields.length).toBeGreaterThan(0);
    expect(report.fields.some((f) => f.thermalLevel === 'critical')).toBe(true);
  });

  describe('cuerpo de la ingesta con el pipe global', () => {
    const pipe = createGlobalValidationPipe();
    const evento = {
      eventType: 'step_view',
      formType: 'practitioner',
      draftId: 't-0b1c2d3e',
      stepIndex: 2,
      stepKey: 'access',
      timestamp: '2026-10-26T21:00:00.000Z',
    };

    it('acepta el lote tal como lo manda el front (antes respondía 400)', async () => {
      await expect(
        pipe.transform(
          { events: [evento] },
          { type: 'body', metatype: IngestOnboardingEventsDto },
        ),
      ).resolves.toBeInstanceOf(IngestOnboardingEventsDto);
    });

    it('rechaza un tipo de evento desconocido', async () => {
      await expect(
        pipe.transform(
          { events: [{ ...evento, eventType: 'otro' }] },
          { type: 'body', metatype: IngestOnboardingEventsDto },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('rechaza propiedades ajenas al evento', async () => {
      await expect(
        pipe.transform(
          { events: [{ ...evento, email: 'x@y.z' }] },
          { type: 'body', metatype: IngestOnboardingEventsDto },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });
  });
});
