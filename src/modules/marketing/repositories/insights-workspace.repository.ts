import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EntityManager } from '@mikro-orm/postgresql';
import { InsightsSqlBase, isoTs } from './insights-sql';

export interface NotificationPreferencesRow {
  matrix_json: Record<string, string[]>;
  frequency_code: string;
  digest_hour: number | null;
  quiet_from: string | null;
  quiet_to: string | null;
  quiet_exempt_critical: boolean;
  row_version: number;
}

export interface UserPreferencesRow {
  density_code: string;
  theme_code: string;
  nav_collapsed: boolean;
  timezone: string | null;
  row_version: number;
}

export interface SavedViewRow {
  id: string;
  name: string;
  url: string | null;
  row_version: number;
}

export interface ReportRow {
  id: string;
  title: string;
  type_code: string;
  audience_code: string;
  period_from: string;
  period_to: string;
  campaign_ids_json: string[] | null;
  channels_json: string[] | null;
  sections_json: string[] | null;
  created_at: string;
  row_version: number;
}

export interface NotificationPreferencesData {
  matrix: Record<string, string[]>;
  frequency: string;
  digestHour: number;
  quietFrom: string | null;
  quietTo: string | null;
  quietExemptCritical: boolean;
}

export interface UserPreferencesData {
  density: string;
  theme: string;
  navCollapsed: boolean;
  timezone: string | null;
}

export interface SavedViewData {
  name: string;
  moduleCode: string;
  url: string;
}

export interface ReportData {
  title: string;
  type: string;
  audience: string;
  periodFrom: string;
  periodTo: string;
  campaignIds: string[];
  channels: string[];
  sections: string[];
}

const NOTIFICATION_COLUMNS = `matrix_json, frequency_code, digest_hour,
       to_char(quiet_from, 'HH24:MI') AS quiet_from, to_char(quiet_to, 'HH24:MI') AS quiet_to,
       quiet_exempt_critical, row_version`;
const VIEW_COLUMNS = `id, name, filters_json ->> 'url' AS url, row_version`;
const REPORT_COLUMNS = `id, title, type_code, audience_code, period_from::text AS period_from,
       period_to::text AS period_to, campaign_ids_json, channels_json, sections_json,
       ${isoTs('created_at')} AS created_at, row_version`;

/**
 * Lo que cada persona guarda en AloVida Insights: preferencias de aviso y de
 * interfaz, vistas guardadas e informes. **Toda** consulta se acota por
 * `user_id`: un usuario nunca ve ni toca filas de otro. SQL crudo; las
 * operaciones compuestas corren en `transaction` con la fila bloqueada.
 */
@Injectable()
export class InsightsWorkspaceRepository extends InsightsSqlBase {
  constructor(em: EntityManager) {
    super(em);
  }

  transaction<T>(
    work: (tx: InsightsWorkspaceRepository) => Promise<T>,
  ): Promise<T> {
    return this.em.transactional((tem) =>
      work(new InsightsWorkspaceRepository(tem)),
    );
  }

  /** Serializa las escrituras de un usuario (límite de informes, nombres de vista). */
  async lockUser(userId: string): Promise<void> {
    await this.sql(`SELECT pg_advisory_xact_lock(hashtext(?))`, [
      `insights-workspace:${userId}`,
    ]);
  }

  // --- preferencias de aviso -------------------------------------------

  notificationPreferences(
    userId: string,
    lock = false,
  ): Promise<NotificationPreferencesRow | null> {
    return this.one<NotificationPreferencesRow>(
      `SELECT ${NOTIFICATION_COLUMNS}
         FROM marketing.insights_notification_preferences
        WHERE user_id = ?${lock ? ' FOR UPDATE' : ''}`,
      [userId],
    );
  }

  async insertNotificationPreferences(
    userId: string,
    data: NotificationPreferencesData,
  ): Promise<boolean> {
    const rows = await this.sql<{ id: string }>(
      `INSERT INTO marketing.insights_notification_preferences
         (id, user_id, matrix_json, frequency_code, digest_hour, quiet_from, quiet_to,
          quiet_exempt_critical, created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       VALUES (?, ?, ?::jsonb, ?, ?, ?::time, ?::time, ?, clock_timestamp(), clock_timestamp(), ?, ?, 1)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING id`,
      [
        randomUUID(),
        userId,
        JSON.stringify(data.matrix),
        data.frequency,
        data.digestHour,
        data.quietFrom,
        data.quietTo,
        data.quietExemptCritical,
        userId,
        userId,
      ],
    );
    return rows.length > 0;
  }

  async updateNotificationPreferences(
    userId: string,
    data: NotificationPreferencesData,
  ): Promise<void> {
    await this.sql(
      `UPDATE marketing.insights_notification_preferences
          SET matrix_json = ?::jsonb, frequency_code = ?, digest_hour = ?, quiet_from = ?::time,
              quiet_to = ?::time, quiet_exempt_critical = ?, updated_at = clock_timestamp(),
              updated_by_user_id = ?, row_version = row_version + 1
        WHERE user_id = ?`,
      [
        JSON.stringify(data.matrix),
        data.frequency,
        data.digestHour,
        data.quietFrom,
        data.quietTo,
        data.quietExemptCritical,
        userId,
        userId,
      ],
    );
  }

  // --- preferencias de interfaz ----------------------------------------

  userPreferences(
    userId: string,
    lock = false,
  ): Promise<UserPreferencesRow | null> {
    return this.one<UserPreferencesRow>(
      `SELECT density_code, theme_code, nav_collapsed, timezone, row_version
         FROM marketing.insights_user_preferences
        WHERE user_id = ?${lock ? ' FOR UPDATE' : ''}`,
      [userId],
    );
  }

  async insertUserPreferences(
    userId: string,
    data: UserPreferencesData,
  ): Promise<boolean> {
    const rows = await this.sql<{ id: string }>(
      `INSERT INTO marketing.insights_user_preferences
         (id, user_id, density_code, theme_code, nav_collapsed, timezone,
          created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       VALUES (?, ?, ?, ?, ?, ?, clock_timestamp(), clock_timestamp(), ?, ?, 1)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING id`,
      [
        randomUUID(),
        userId,
        data.density,
        data.theme,
        data.navCollapsed,
        data.timezone,
        userId,
        userId,
      ],
    );
    return rows.length > 0;
  }

  async updateUserPreferences(
    userId: string,
    data: UserPreferencesData,
  ): Promise<void> {
    await this.sql(
      `UPDATE marketing.insights_user_preferences
          SET density_code = ?, theme_code = ?, nav_collapsed = ?, timezone = ?,
              updated_at = clock_timestamp(), updated_by_user_id = ?, row_version = row_version + 1
        WHERE user_id = ?`,
      [
        data.density,
        data.theme,
        data.navCollapsed,
        data.timezone,
        userId,
        userId,
      ],
    );
  }

  // --- vistas guardadas ------------------------------------------------

  savedViews(userId: string): Promise<SavedViewRow[]> {
    return this.sql<SavedViewRow>(
      `SELECT ${VIEW_COLUMNS}
         FROM marketing.insights_saved_views
        WHERE user_id = ?
        ORDER BY created_at, id`,
      [userId],
    );
  }

  savedView(userId: string, id: string): Promise<SavedViewRow | null> {
    return this.one<SavedViewRow>(
      `SELECT ${VIEW_COLUMNS}
         FROM marketing.insights_saved_views
        WHERE user_id = ? AND id = ?`,
      [userId, id],
    );
  }

  /** Id de OTRA vista del mismo usuario con ese nombre, si la hay. */
  async savedViewNamed(
    userId: string,
    name: string,
    exceptId: string,
  ): Promise<string | null> {
    const row = await this.one<{ id: string }>(
      `SELECT id FROM marketing.insights_saved_views
        WHERE user_id = ? AND name = ? AND id <> ?`,
      [userId, name, exceptId],
    );
    return row?.id ?? null;
  }

  /** Id de la vista que existe con ese id, sea de quien sea (para no pisar la de otro). */
  async savedViewOwner(id: string): Promise<string | null> {
    const row = await this.one<{ user_id: string }>(
      `SELECT user_id FROM marketing.insights_saved_views WHERE id = ?`,
      [id],
    );
    return row?.user_id ?? null;
  }

  async upsertSavedView(
    userId: string,
    id: string,
    data: SavedViewData,
  ): Promise<void> {
    await this.sql(
      `INSERT INTO marketing.insights_saved_views
         (id, user_id, name, module_code, filters_json, created_at, updated_at,
          created_by_user_id, updated_by_user_id, row_version)
       VALUES (?, ?, ?, ?, ?::jsonb, clock_timestamp(), clock_timestamp(), ?, ?, 1)
       ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name, module_code = EXCLUDED.module_code,
              filters_json = EXCLUDED.filters_json, updated_at = clock_timestamp(),
              updated_by_user_id = EXCLUDED.updated_by_user_id,
              row_version = marketing.insights_saved_views.row_version + 1
        WHERE marketing.insights_saved_views.user_id = EXCLUDED.user_id
          AND (marketing.insights_saved_views.name, marketing.insights_saved_views.module_code,
               marketing.insights_saved_views.filters_json)
              IS DISTINCT FROM (EXCLUDED.name, EXCLUDED.module_code, EXCLUDED.filters_json)`,
      [
        id,
        userId,
        data.name,
        data.moduleCode,
        JSON.stringify({ url: data.url }),
        userId,
        userId,
      ],
    );
  }

  async deleteSavedView(userId: string, id: string): Promise<void> {
    await this.sql(
      `DELETE FROM marketing.insights_saved_views WHERE user_id = ? AND id = ?`,
      [userId, id],
    );
  }

  // --- informes --------------------------------------------------------

  reports(userId: string): Promise<ReportRow[]> {
    return this.sql<ReportRow>(
      `SELECT ${REPORT_COLUMNS}
         FROM marketing.insights_reports
        WHERE user_id = ?
        ORDER BY created_at DESC, id`,
      [userId],
    );
  }

  report(userId: string, id: string): Promise<ReportRow | null> {
    return this.one<ReportRow>(
      `SELECT ${REPORT_COLUMNS}
         FROM marketing.insights_reports
        WHERE user_id = ? AND id = ?`,
      [userId, id],
    );
  }

  async reportOwner(id: string): Promise<string | null> {
    const row = await this.one<{ user_id: string }>(
      `SELECT user_id FROM marketing.insights_reports WHERE id = ?`,
      [id],
    );
    return row?.user_id ?? null;
  }

  async upsertReport(
    userId: string,
    id: string,
    data: ReportData,
  ): Promise<void> {
    await this.sql(
      `INSERT INTO marketing.insights_reports
         (id, user_id, title, type_code, audience_code, period_from, period_to,
          campaign_ids_json, channels_json, sections_json, created_at, updated_at,
          created_by_user_id, updated_by_user_id, row_version)
       VALUES (?, ?, ?, ?, ?, ?::date, ?::date, ?::jsonb, ?::jsonb, ?::jsonb,
               clock_timestamp(), clock_timestamp(), ?, ?, 1)
       ON CONFLICT (id) DO UPDATE
          SET title = EXCLUDED.title, type_code = EXCLUDED.type_code,
              audience_code = EXCLUDED.audience_code, period_from = EXCLUDED.period_from,
              period_to = EXCLUDED.period_to, campaign_ids_json = EXCLUDED.campaign_ids_json,
              channels_json = EXCLUDED.channels_json, sections_json = EXCLUDED.sections_json,
              updated_at = clock_timestamp(), updated_by_user_id = EXCLUDED.updated_by_user_id,
              row_version = marketing.insights_reports.row_version + 1
        WHERE marketing.insights_reports.user_id = EXCLUDED.user_id
          AND (marketing.insights_reports.title, marketing.insights_reports.type_code,
               marketing.insights_reports.audience_code, marketing.insights_reports.period_from,
               marketing.insights_reports.period_to, marketing.insights_reports.campaign_ids_json,
               marketing.insights_reports.channels_json, marketing.insights_reports.sections_json)
              IS DISTINCT FROM (EXCLUDED.title, EXCLUDED.type_code, EXCLUDED.audience_code,
               EXCLUDED.period_from, EXCLUDED.period_to, EXCLUDED.campaign_ids_json,
               EXCLUDED.channels_json, EXCLUDED.sections_json)`,
      [
        id,
        userId,
        data.title,
        data.type,
        data.audience,
        data.periodFrom,
        data.periodTo,
        JSON.stringify(data.campaignIds),
        JSON.stringify(data.channels),
        JSON.stringify(data.sections),
        userId,
        userId,
      ],
    );
  }

  /**
   * Deja los `keep` informes más nuevos del usuario y borra el resto; devuelve
   * cuántos expulsó. Se llama con el usuario bloqueado (`lockUser`).
   */
  async trimReports(userId: string, keep: number): Promise<number> {
    const rows = await this.sql<{ id: string }>(
      `DELETE FROM marketing.insights_reports
        WHERE id IN (
          SELECT id FROM marketing.insights_reports
           WHERE user_id = ?
           ORDER BY created_at DESC, id
          OFFSET ?)
        RETURNING id`,
      [userId, keep],
    );
    return rows.length;
  }

  async deleteReport(userId: string, id: string): Promise<void> {
    await this.sql(
      `DELETE FROM marketing.insights_reports WHERE user_id = ? AND id = ?`,
      [userId, id],
    );
  }
}
