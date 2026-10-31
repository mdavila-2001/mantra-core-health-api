import { DomainException } from '../../../common';
import { MarketingErrorReason } from '../marketing.error-reasons';
import type {
  NotificationPreferencesData,
  NotificationPreferencesRow,
  ReportData,
  ReportRow,
  SavedViewData,
  SavedViewRow,
  UserPreferencesData,
  UserPreferencesRow,
} from '../repositories/insights-workspace.repository';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  InsightsWorkspaceService,
  moduleOfUrl,
} from './insights-workspace.service';

/** Repositorio en memoria con las mismas reglas del SQL: todo por `user_id`. */
class FakeRepo {
  views: (SavedViewRow & { userId: string; module: string })[] = [];
  reports_: (ReportRow & { userId: string; order: number })[] = [];
  notifications = new Map<string, NotificationPreferencesRow>();
  prefs = new Map<string, UserPreferencesRow>();
  private clock = 0;

  transaction<T>(work: (tx: FakeRepo) => Promise<T>) {
    return work(this);
  }
  async lockUser() {}

  async notificationPreferences(userId: string) {
    return this.notifications.get(userId) ?? null;
  }
  async insertNotificationPreferences(
    userId: string,
    d: NotificationPreferencesData,
  ) {
    if (this.notifications.has(userId)) return false;
    this.notifications.set(userId, this.notificationRow(d, 1));
    return true;
  }
  async updateNotificationPreferences(
    userId: string,
    d: NotificationPreferencesData,
  ) {
    const row = this.notifications.get(userId)!;
    this.notifications.set(
      userId,
      this.notificationRow(d, row.row_version + 1),
    );
  }
  private notificationRow(
    d: NotificationPreferencesData,
    v: number,
  ): NotificationPreferencesRow {
    return {
      matrix_json: d.matrix,
      frequency_code: d.frequency,
      digest_hour: d.digestHour,
      quiet_from: d.quietFrom,
      quiet_to: d.quietTo,
      quiet_exempt_critical: d.quietExemptCritical,
      row_version: v,
    };
  }

  async userPreferences(userId: string) {
    return this.prefs.get(userId) ?? null;
  }
  async insertUserPreferences(userId: string, d: UserPreferencesData) {
    if (this.prefs.has(userId)) return false;
    this.prefs.set(userId, this.prefRow(d, 1));
    return true;
  }
  async updateUserPreferences(userId: string, d: UserPreferencesData) {
    this.prefs.set(
      userId,
      this.prefRow(d, this.prefs.get(userId)!.row_version + 1),
    );
  }
  private prefRow(d: UserPreferencesData, v: number): UserPreferencesRow {
    return {
      density_code: d.density,
      theme_code: d.theme,
      nav_collapsed: d.navCollapsed,
      timezone: d.timezone,
      row_version: v,
    };
  }

  async savedViews(userId: string) {
    return this.views.filter((v) => v.userId === userId);
  }
  async savedView(userId: string, id: string) {
    return this.views.find((v) => v.userId === userId && v.id === id) ?? null;
  }
  async savedViewNamed(userId: string, name: string, exceptId: string) {
    return (
      this.views.find(
        (v) => v.userId === userId && v.name === name && v.id !== exceptId,
      )?.id ?? null
    );
  }
  async savedViewOwner(id: string) {
    return this.views.find((v) => v.id === id)?.userId ?? null;
  }
  async upsertSavedView(userId: string, id: string, d: SavedViewData) {
    const row = this.views.find((v) => v.id === id);
    if (row) {
      if (row.name !== d.name || row.url !== d.url) row.row_version += 1;
      Object.assign(row, { name: d.name, url: d.url, module: d.moduleCode });
    } else {
      this.views.push({
        id,
        userId,
        name: d.name,
        url: d.url,
        module: d.moduleCode,
        row_version: 1,
      });
    }
  }
  async deleteSavedView(userId: string, id: string) {
    this.views = this.views.filter(
      (v) => !(v.userId === userId && v.id === id),
    );
  }

  async reports(userId: string) {
    return this.reports_
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.order - a.order);
  }
  async report(userId: string, id: string) {
    return (
      this.reports_.find((r) => r.userId === userId && r.id === id) ?? null
    );
  }
  async reportOwner(id: string) {
    return this.reports_.find((r) => r.id === id)?.userId ?? null;
  }
  async upsertReport(userId: string, id: string, d: ReportData) {
    const base = {
      title: d.title,
      type_code: d.type,
      audience_code: d.audience,
      period_from: d.periodFrom,
      period_to: d.periodTo,
      campaign_ids_json: d.campaignIds,
      channels_json: d.channels,
      sections_json: d.sections,
    };
    const row = this.reports_.find((r) => r.id === id);
    if (row) Object.assign(row, base, { row_version: row.row_version + 1 });
    else {
      const order = ++this.clock;
      this.reports_.push({
        id,
        userId,
        order,
        created_at: `2026-10-30T10:00:${String(order).padStart(2, '0')}.000Z`,
        row_version: 1,
        ...base,
      });
    }
  }
  async trimReports(userId: string, keep: number) {
    const mine = (await this.reports(userId)).slice(keep);
    this.reports_ = this.reports_.filter((r) => !mine.includes(r));
    return mine.length;
  }
  async deleteReport(userId: string, id: string) {
    this.reports_ = this.reports_.filter(
      (r) => !(r.userId === userId && r.id === id),
    );
  }
}

const A = { id: 'user-a', roles: ['MARKETING_MANAGER'] } as any;
const B = { id: 'user-b', roles: ['MARKETING_MANAGER'] } as any;
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function build() {
  const repo = new FakeRepo();
  const facts = { meta: async () => ({ dataset: 'demo' }) };
  return {
    repo,
    service: new InsightsWorkspaceService(repo as any, facts as any),
  };
}

const failure = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    const e = error as DomainException;
    return { status: e.getStatus(), reason: e.reason };
  }
  return null;
};

const report = (n: number, over: Record<string, unknown> = {}) =>
  ({
    title: `Informe ${n}`,
    type: 'executive',
    audience: 'direction',
    periodFrom: '2026-10-01',
    periodTo: '2026-10-29',
    campaignIds: ['c1'],
    channels: ['google'],
    sections: ['summary'],
    ...over,
  }) as any;

describe('InsightsWorkspaceService · vistas guardadas', () => {
  it('PUT con el mismo id dos veces deja UNA fila y no sube la versión si nada cambió', async () => {
    const { repo, service } = build();
    const view = { name: 'Mi vista', url: '/insights/campaigns?c=c1&p=30d' };
    const first = await service.putSavedView(uuid(1), view, A);
    const second = await service.putSavedView(uuid(1), view, A);
    expect(repo.views).toHaveLength(1);
    expect(first.data).toEqual(second.data);
    expect(second.data).toMatchObject({
      id: uuid(1),
      url: view.url,
      rowVersion: 1,
    });
    expect(repo.views[0].module).toBe('campaigns');
    const renamed = await service.putSavedView(
      uuid(1),
      { ...view, name: 'Otro' },
      A,
    );
    expect(renamed.data.rowVersion).toBe(2);
  });

  it('el mismo nombre en OTRO id del mismo usuario → 409 MARKETING_INSIGHTS_VIEW_NAME_TAKEN', async () => {
    const { repo, service } = build();
    await service.putSavedView(
      uuid(1),
      { name: 'Mi vista', url: '/insights' },
      A,
    );
    expect(
      await failure(
        service.putSavedView(
          uuid(2),
          { name: 'Mi vista', url: '/insights/funnel' },
          A,
        ),
      ),
    ).toEqual({
      status: 409,
      reason: MarketingErrorReason.INSIGHTS_VIEW_NAME_TAKEN,
    });
    expect(repo.views).toHaveLength(1);
  });

  it('el mismo nombre de OTRO usuario es válido (la unicidad es por usuario)', async () => {
    const { service } = build();
    await service.putSavedView(
      uuid(1),
      { name: 'Mi vista', url: '/insights' },
      A,
    );
    await expect(
      service.putSavedView(uuid(2), { name: 'Mi vista', url: '/insights' }, B),
    ).resolves.toBeDefined();
  });

  it('aislamiento: B no ve, no pisa y no borra las vistas de A', async () => {
    const { repo, service } = build();
    await service.putSavedView(uuid(1), { name: 'De A', url: '/insights' }, A);
    expect((await service.listSavedViews(B)).data).toEqual([]);
    expect(
      await failure(
        service.putSavedView(
          uuid(1),
          { name: 'Robada', url: '/insights/funnel' },
          B,
        ),
      ),
    ).toEqual({
      status: 404,
      reason: MarketingErrorReason.INSIGHTS_RESOURCE_NOT_AVAILABLE,
    });
    await service.deleteSavedView(uuid(1), B); // 204 idempotente, pero no borra
    expect(repo.views).toHaveLength(1);
    expect(repo.views[0]).toMatchObject({ name: 'De A', userId: 'user-a' });
    expect((await service.listSavedViews(A)).data).toHaveLength(1);
  });

  it('DELETE es idempotente', async () => {
    const { service } = build();
    await service.putSavedView(uuid(1), { name: 'x', url: '/insights' }, A);
    await service.deleteSavedView(uuid(1), A);
    await expect(service.deleteSavedView(uuid(1), A)).resolves.toBeUndefined();
    expect((await service.listSavedViews(A)).data).toEqual([]);
  });

  it('moduleOfUrl toma el módulo del portal', () => {
    expect(moduleOfUrl('/insights')).toBe('overview');
    expect(moduleOfUrl('/insights/')).toBe('overview');
    expect(moduleOfUrl('/insights/campaigns?c=c1')).toBe('campaigns');
    expect(moduleOfUrl('/insights/social/x?p=7d')).toBe('social');
  });
});

describe('InsightsWorkspaceService · informes', () => {
  it('el 13.º informe expulsa el más viejo: quedan 12, el primero se fue y el último está', async () => {
    const { repo, service } = build();
    for (let n = 1; n <= 12; n += 1)
      await service.putReport(uuid(n), report(n), A);
    expect((await service.listReports(A)).data).toHaveLength(12);
    await service.putReport(uuid(13), report(13), A);
    const { data } = await service.listReports(A);
    expect(data).toHaveLength(12);
    expect(data.map((r) => r.id)).not.toContain(uuid(1));
    expect(data[0].id).toBe(uuid(13)); // el más nuevo primero
    expect(data[11].id).toBe(uuid(2));
    expect(repo.reports_).toHaveLength(12);
  });

  it('repetir un PUT no cuenta como informe nuevo (idempotente) y nada se expulsa', async () => {
    const { service } = build();
    for (let n = 1; n <= 12; n += 1)
      await service.putReport(uuid(n), report(n), A);
    await service.putReport(uuid(1), report(1), A);
    const { data } = await service.listReports(A);
    expect(data).toHaveLength(12);
    expect(data.map((r) => r.id)).toContain(uuid(1));
  });

  it('el límite es POR usuario: los informes de B no expulsan los de A ni cuentan para A', async () => {
    const { service } = build();
    for (let n = 1; n <= 12; n += 1)
      await service.putReport(uuid(n), report(n), A);
    await service.putReport(uuid(100), report(100), B);
    expect((await service.listReports(A)).data).toHaveLength(12);
    expect((await service.listReports(B)).data.map((r) => r.id)).toEqual([
      uuid(100),
    ]);
  });

  it('aislamiento: B no puede pisar ni borrar un informe de A', async () => {
    const { repo, service } = build();
    await service.putReport(uuid(1), report(1), A);
    expect(
      await failure(
        service.putReport(uuid(1), report(1, { title: 'Robado' }), B),
      ),
    ).toEqual({
      status: 404,
      reason: MarketingErrorReason.INSIGHTS_RESOURCE_NOT_AVAILABLE,
    });
    await service.deleteReport(uuid(1), B);
    expect(repo.reports_).toHaveLength(1);
    expect(repo.reports_[0].title).toBe('Informe 1');
  });

  it('periodo invertido → 422', async () => {
    const { service } = build();
    expect(
      await failure(
        service.putReport(
          uuid(1),
          report(1, { periodFrom: '2026-10-29', periodTo: '2026-10-01' }),
          A,
        ),
      ),
    ).toEqual({
      status: 422,
      reason: MarketingErrorReason.INSIGHTS_BODY_INVALID,
    });
  });
});

describe('InsightsWorkspaceService · preferencias', () => {
  const prefs = {
    matrix: { critical: ['app'], risk: ['app'], anomaly: [], opportunity: [] },
    frequency: 'daily_digest',
    digestHour: 9,
    quietFrom: '22:00',
    quietTo: '07:00',
    quietExemptCritical: false,
  } as any;

  it('sin fila devuelve los valores por defecto con rowVersion 0 y nothingIsSent', async () => {
    const { service } = build();
    expect((await service.getNotificationPreferences(A)).data).toEqual({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      nothingIsSent: true,
    });
    expect((await service.getUserPreferences(A)).data).toMatchObject({
      rowVersion: 0,
      theme: 'system',
    });
  });

  it('alta sin If-Match; edición exige la versión (412 sin ella o vieja); sin cambios no sube', async () => {
    const { service } = build();
    const created = await service.putNotificationPreferences(
      prefs,
      undefined,
      A,
    );
    expect(created.data).toMatchObject({
      rowVersion: 1,
      frequency: 'daily_digest',
      quietFrom: '22:00',
      nothingIsSent: true,
    });
    expect(
      await failure(service.putNotificationPreferences(prefs, undefined, A)),
    ).toMatchObject({ status: 412 });
    const same = await service.putNotificationPreferences(prefs, '1', A);
    expect(same.data.rowVersion).toBe(1);
    const changed = await service.putNotificationPreferences(
      { ...prefs, digestHour: 10 },
      '1',
      A,
    );
    expect(changed.data).toMatchObject({ rowVersion: 2, digestHour: 10 });
    expect(
      await failure(service.putNotificationPreferences(prefs, '1', A)),
    ).toEqual({
      status: 412,
      reason: MarketingErrorReason.INSIGHTS_VERSION_MISMATCH,
    });
  });

  it('aislamiento: las preferencias de A no aparecen en B y B parte de cero', async () => {
    const { service } = build();
    await service.putUserPreferences(
      {
        density: 'compact',
        theme: 'dark',
        navCollapsed: true,
        timezone: 'America/La_Paz',
      },
      undefined,
      A,
    );
    expect((await service.getUserPreferences(A)).data).toMatchObject({
      density: 'compact',
      rowVersion: 1,
    });
    expect((await service.getUserPreferences(B)).data).toMatchObject({
      density: 'comfortable',
      rowVersion: 0,
      timezone: null,
    });
    await service.putNotificationPreferences(prefs, undefined, A);
    expect((await service.getNotificationPreferences(B)).data.rowVersion).toBe(
      0,
    );
    // B crea la suya sin chocar con la versión de A
    const b = await service.putUserPreferences(
      {
        density: 'comfortable',
        theme: 'light',
        navCollapsed: false,
        timezone: null,
      },
      undefined,
      B,
    );
    expect(b.data).toMatchObject({ theme: 'light', rowVersion: 1 });
    expect((await service.getUserPreferences(A)).data.theme).toBe('dark');
  });
});
