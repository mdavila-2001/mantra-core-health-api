import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  PatchAlertRuleDto,
  PutAlertWorkflowDto,
  PutNotificationPreferencesDto,
  PutReportDto,
  PutSavedViewDto,
  PutUserPreferencesDto,
} from './insights-workspace.dto';

async function errorsOf<T extends object>(cls: new () => T, plain: unknown) {
  const errors = await validate(plainToInstance(cls, plain) as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((e) => e.property).sort();
}

const snapshot = {
  severity: 'risk',
  title: 'T',
  whatText: 'W',
  detectedOn: '2026-10-29',
  moduleCode: 'campaigns',
  priority: 3,
};

describe('DTO del flujo de trabajo de Insights', () => {
  it('PutAlertWorkflowDto acepta los cuatro estados y rechaza uno ajeno (p. ej. seen)', async () => {
    for (const status of ['new', 'in_progress', 'resolved', 'dismissed']) {
      expect(
        await errorsOf(PutAlertWorkflowDto, {
          status,
          ownerTeam: null,
          snapshot,
        }),
      ).toEqual([]);
    }
    expect(
      await errorsOf(PutAlertWorkflowDto, {
        status: 'seen',
        ownerTeam: null,
        snapshot,
      }),
    ).toEqual(['status']);
  });

  it('ownerTeam acepta null y los siete equipos; undefined o un equipo ajeno no', async () => {
    for (const ownerTeam of [
      null,
      'marketing',
      'innovation',
      'product',
      'communication',
      'content',
      'systems',
      'direction',
    ]) {
      expect(
        await errorsOf(PutAlertWorkflowDto, {
          status: 'new',
          ownerTeam,
          snapshot,
        }),
      ).toEqual([]);
    }
    expect(
      await errorsOf(PutAlertWorkflowDto, { status: 'new', snapshot }),
    ).toEqual(['ownerTeam']);
    expect(
      await errorsOf(PutAlertWorkflowDto, {
        status: 'new',
        ownerTeam: 'ventas',
        snapshot,
      }),
    ).toEqual(['ownerTeam']);
  });

  it('el snapshot es obligatorio y se valida por dentro', async () => {
    expect(
      await errorsOf(PutAlertWorkflowDto, { status: 'new', ownerTeam: null }),
    ).toEqual(['snapshot']);
    expect(
      await errorsOf(PutAlertWorkflowDto, {
        status: 'new',
        ownerTeam: null,
        snapshot: { ...snapshot, priority: 9, severity: 'x' },
      }),
    ).toEqual(['snapshot']);
  });

  it('PatchAlertRuleDto: threshold numérico y enabled booleano (el rango 1..500 es 422 del servicio, no 400 del pipe)', async () => {
    expect(
      await errorsOf(PatchAlertRuleDto, { threshold: 1, enabled: false }),
    ).toEqual([]);
    expect(await errorsOf(PatchAlertRuleDto, { threshold: 0 })).toEqual([]);
    expect(await errorsOf(PatchAlertRuleDto, { threshold: 'alto' })).toEqual([
      'threshold',
    ]);
    expect(await errorsOf(PatchAlertRuleDto, { enabled: 'si' })).toEqual([
      'enabled',
    ]);
  });

  it('notificaciones: canales, frecuencia y horas cerradas', async () => {
    const ok = {
      matrix: {
        critical: ['app', 'mail'],
        risk: [],
        anomaly: ['slack'],
        opportunity: [],
      },
      frequency: 'immediate',
      digestHour: 8,
      quietFrom: null,
      quietTo: '07:00',
      quietExemptCritical: true,
    };
    expect(await errorsOf(PutNotificationPreferencesDto, ok)).toEqual([]);
    expect(
      await errorsOf(PutNotificationPreferencesDto, {
        ...ok,
        frequency: 'weekly',
      }),
    ).toEqual(['frequency']);
    expect(
      await errorsOf(PutNotificationPreferencesDto, { ...ok, digestHour: 24 }),
    ).toEqual(['digestHour']);
    expect(
      await errorsOf(PutNotificationPreferencesDto, {
        ...ok,
        quietFrom: '25:00',
      }),
    ).toEqual(['quietFrom']);
    expect(
      await errorsOf(PutNotificationPreferencesDto, {
        ...ok,
        matrix: { ...ok.matrix, critical: ['sms'] },
      }),
    ).toEqual(['matrix']);
  });

  it('preferencias de interfaz: density y theme cerrados', async () => {
    const ok = {
      density: 'compact',
      theme: 'dark',
      navCollapsed: true,
      timezone: 'America/La_Paz',
    };
    expect(await errorsOf(PutUserPreferencesDto, ok)).toEqual([]);
    expect(
      await errorsOf(PutUserPreferencesDto, { ...ok, timezone: null }),
    ).toEqual([]);
    expect(
      await errorsOf(PutUserPreferencesDto, { ...ok, density: 'tiny' }),
    ).toEqual(['density']);
    expect(
      await errorsOf(PutUserPreferencesDto, { ...ok, theme: 'sepia' }),
    ).toEqual(['theme']);
  });

  it('vista guardada: la url debe ser del portal', async () => {
    expect(
      await errorsOf(PutSavedViewDto, {
        name: ' Mi vista ',
        url: '/insights/campaigns?c=c1&p=30d',
      }),
    ).toEqual([]);
    expect(
      await errorsOf(PutSavedViewDto, {
        name: 'x',
        url: 'https://evil.example/insights',
      }),
    ).toEqual(['url']);
    expect(
      await errorsOf(PutSavedViewDto, { name: 'x', url: '/administration' }),
    ).toEqual(['url']);
    expect(
      await errorsOf(PutSavedViewDto, { name: '   ', url: '/insights' }),
    ).toEqual(['name']);
  });

  it('informe: canales conocidos y fechas de día', async () => {
    const ok = {
      title: 'Mensual',
      type: 'executive',
      audience: 'direction',
      periodFrom: '2026-10-01',
      periodTo: '2026-10-29',
      campaignIds: ['c1'],
      channels: ['google', 'web'],
      sections: ['summary'],
    };
    expect(await errorsOf(PutReportDto, ok)).toEqual([]);
    expect(
      await errorsOf(PutReportDto, { ...ok, channels: ['myspace'] }),
    ).toEqual(['channels']);
    expect(
      await errorsOf(PutReportDto, { ...ok, periodFrom: '2026-13-01' }),
    ).toEqual(['periodFrom']);
  });
});
