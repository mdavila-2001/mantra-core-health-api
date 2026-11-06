import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
} from '../../../common';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import {
  INSIGHTS_REPORT_HISTORY_LIMIT,
  type InsightsAlertSeverity,
  type InsightsEnvelope,
  type InsightsNotificationChannel,
  type InsightsNotificationPreferencesDto,
  type InsightsReportDto,
  type InsightsSavedViewDto,
  type InsightsUserPreferencesDto,
  type PutNotificationPreferencesDto,
  type PutReportDto,
  type PutSavedViewDto,
  type PutUserPreferencesDto,
} from '../dto/insights-workspace.dto';
import { MarketingErrorReason } from '../marketing.error-reasons';
import {
  InsightsWorkspaceRepository,
  type NotificationPreferencesData,
  type NotificationPreferencesRow,
  type ReportRow,
  type SavedViewRow,
  type UserPreferencesData,
  type UserPreferencesRow,
} from '../repositories/insights-workspace.repository';
import { InsightsFactsService } from './insights-facts.service';
import { assertVersion, parseIfMatch } from './insights-if-match';

/** Lo que ve quien todavía no guardó nada: `rowVersion` 0. */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  InsightsNotificationPreferencesDto,
  'nothingIsSent'
> = {
  matrix: {
    critical: ['app', 'mail', 'slack'],
    risk: ['app', 'mail'],
    anomaly: ['app'],
    opportunity: ['app'],
  },
  frequency: 'immediate',
  digestHour: 8,
  quietFrom: null,
  quietTo: null,
  quietExemptCritical: true,
  rowVersion: 0,
};

export const DEFAULT_USER_PREFERENCES: InsightsUserPreferencesDto = {
  density: 'comfortable',
  theme: 'system',
  navCollapsed: false,
  timezone: null,
  rowVersion: 0,
};

const SEVERITIES: readonly InsightsAlertSeverity[] = [
  'critical',
  'risk',
  'anomaly',
  'opportunity',
];

const notAvailable = (what: string, id: string) =>
  new ResourceNotFoundException(
    `${what} no existe`,
    { id },
    MarketingErrorReason.INSIGHTS_RESOURCE_NOT_AVAILABLE,
  );

/** Módulo del portal al que apunta la URL de una vista (`/insights/campaigns?…` → `campaigns`). */
export function moduleOfUrl(url: string): string {
  const path = url.split('?')[0].split('/').filter(Boolean);
  return path[1] ?? 'overview';
}

/**
 * Lo que cada persona guarda en AloVida Insights. **Todo se acota por el id
 * del usuario autenticado** (`actor.id`): ninguna operación recibe un
 * `userId` del cliente ni lee filas de otro usuario.
 */
@Injectable()
export class InsightsWorkspaceService {
  constructor(
    private readonly repo: InsightsWorkspaceRepository,
    private readonly facts: InsightsFactsService,
  ) {}

  private async envelope<T>(data: T): Promise<InsightsEnvelope<T>> {
    return { data, meta: await this.facts.meta(null, []) };
  }

  // --- preferencias de aviso -------------------------------------------

  private toNotification(
    row: NotificationPreferencesRow,
  ): InsightsNotificationPreferencesDto {
    const matrix = Object.fromEntries(
      SEVERITIES.map((severity) => [
        severity,
        (row.matrix_json[severity] ?? []) as InsightsNotificationChannel[],
      ]),
    ) as Record<InsightsAlertSeverity, InsightsNotificationChannel[]>;
    return {
      matrix,
      frequency:
        row.frequency_code === 'daily_digest' ? 'daily_digest' : 'immediate',
      digestHour:
        row.digest_hour ?? DEFAULT_NOTIFICATION_PREFERENCES.digestHour,
      quietFrom: row.quiet_from,
      quietTo: row.quiet_to,
      quietExemptCritical: row.quiet_exempt_critical,
      nothingIsSent: true,
      rowVersion: Number(row.row_version),
    };
  }

  async getNotificationPreferences(
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsNotificationPreferencesDto>> {
    const row = await this.repo.notificationPreferences(actor.id);
    return this.envelope(
      row
        ? this.toNotification(row)
        : { ...DEFAULT_NOTIFICATION_PREFERENCES, nothingIsSent: true },
    );
  }

  async putNotificationPreferences(
    dto: PutNotificationPreferencesDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsNotificationPreferencesDto>> {
    const expected = parseIfMatch(ifMatch);
    const data: NotificationPreferencesData = {
      matrix: Object.fromEntries(
        SEVERITIES.map((severity) => [severity, [...dto.matrix[severity]]]),
      ),
      frequency: dto.frequency,
      digestHour: dto.digestHour,
      quietFrom: dto.quietFrom,
      quietTo: dto.quietTo,
      quietExemptCritical: dto.quietExemptCritical,
    };
    const saved = await this.repo.transaction(async (tx) => {
      let row = await tx.notificationPreferences(actor.id, true);
      if (!row) {
        assertVersion(expected, null);
        if (!(await tx.insertNotificationPreferences(actor.id, data))) {
          // Otra pestaña del mismo usuario la creó entre la lectura y el alta.
          row = await tx.notificationPreferences(actor.id, true);
          assertVersion(expected, row ? Number(row.row_version) : null);
        }
      } else {
        assertVersion(expected, Number(row.row_version));
        const current = this.toNotification(row);
        const same =
          JSON.stringify(current.matrix) === JSON.stringify(data.matrix) &&
          current.frequency === data.frequency &&
          current.digestHour === data.digestHour &&
          current.quietFrom === data.quietFrom &&
          current.quietTo === data.quietTo &&
          current.quietExemptCritical === data.quietExemptCritical;
        if (!same) await tx.updateNotificationPreferences(actor.id, data);
      }
      const fresh = await tx.notificationPreferences(actor.id);
      if (!fresh)
        throw new Error('Las preferencias guardadas no se encuentran');
      return this.toNotification(fresh);
    });
    return this.envelope(saved);
  }

  // --- preferencias de interfaz ----------------------------------------

  private toUserPreferences(
    row: UserPreferencesRow,
  ): InsightsUserPreferencesDto {
    return {
      density: row.density_code,
      theme: row.theme_code,
      navCollapsed: row.nav_collapsed,
      timezone: row.timezone,
      rowVersion: Number(row.row_version),
    };
  }

  async getUserPreferences(
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsUserPreferencesDto>> {
    const row = await this.repo.userPreferences(actor.id);
    return this.envelope(
      row ? this.toUserPreferences(row) : { ...DEFAULT_USER_PREFERENCES },
    );
  }

  async putUserPreferences(
    dto: PutUserPreferencesDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsUserPreferencesDto>> {
    const expected = parseIfMatch(ifMatch);
    const data: UserPreferencesData = {
      density: dto.density,
      theme: dto.theme,
      navCollapsed: dto.navCollapsed,
      timezone: dto.timezone,
    };
    const saved = await this.repo.transaction(async (tx) => {
      let row = await tx.userPreferences(actor.id, true);
      if (!row) {
        assertVersion(expected, null);
        if (!(await tx.insertUserPreferences(actor.id, data))) {
          row = await tx.userPreferences(actor.id, true);
          assertVersion(expected, row ? Number(row.row_version) : null);
        }
      } else {
        assertVersion(expected, Number(row.row_version));
        const same =
          row.density_code === data.density &&
          row.theme_code === data.theme &&
          row.nav_collapsed === data.navCollapsed &&
          row.timezone === data.timezone;
        if (!same) await tx.updateUserPreferences(actor.id, data);
      }
      const fresh = await tx.userPreferences(actor.id);
      if (!fresh)
        throw new Error('Las preferencias guardadas no se encuentran');
      return this.toUserPreferences(fresh);
    });
    return this.envelope(saved);
  }

  // --- vistas guardadas ------------------------------------------------

  private toView(row: SavedViewRow): InsightsSavedViewDto {
    return {
      id: row.id,
      name: row.name,
      url: row.url ?? '/insights',
      rowVersion: Number(row.row_version),
    };
  }

  async listSavedViews(
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsSavedViewDto[]>> {
    const rows = await this.repo.savedViews(actor.id);
    return this.envelope(rows.map((row) => this.toView(row)));
  }

  /**
   * Guarda una vista con el `id` que mandó el cliente: repetir la petición no
   * duplica. El nombre es único por usuario (409). Un `id` que ya es de otro
   * usuario responde 404, igual que si no existiera.
   */
  async putSavedView(
    id: string,
    dto: PutSavedViewDto,
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsSavedViewDto>> {
    const saved = await this.repo.transaction(async (tx) => {
      await tx.lockUser(actor.id);
      const owner = await tx.savedViewOwner(id);
      if (owner !== null && owner !== actor.id) {
        throw notAvailable('La vista guardada', id);
      }
      if (await tx.savedViewNamed(actor.id, dto.name, id)) {
        throw new ConflictException(
          'Ya tienes una vista guardada con ese nombre',
          { name: dto.name },
          MarketingErrorReason.INSIGHTS_VIEW_NAME_TAKEN,
        );
      }
      await tx.upsertSavedView(actor.id, id, {
        name: dto.name,
        moduleCode: moduleOfUrl(dto.url),
        url: dto.url,
      });
      const row = await tx.savedView(actor.id, id);
      if (!row) throw new Error('La vista guardada no se encuentra');
      return this.toView(row);
    });
    return this.envelope(saved);
  }

  /** Idempotente: borrar lo que no existe (o es de otro usuario) no falla ni toca nada. */
  async deleteSavedView(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.repo.deleteSavedView(actor.id, id);
  }

  // --- informes --------------------------------------------------------

  private toReport(row: ReportRow): InsightsReportDto {
    return {
      id: row.id,
      title: row.title,
      type: row.type_code,
      audience: row.audience_code,
      periodFrom: row.period_from,
      periodTo: row.period_to,
      campaignIds: row.campaign_ids_json ?? [],
      channels: row.channels_json ?? [],
      sections: row.sections_json ?? [],
      createdAt: row.created_at,
      rowVersion: Number(row.row_version),
    };
  }

  async listReports(
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsReportDto[]>> {
    const rows = await this.repo.reports(actor.id);
    return this.envelope(rows.map((row) => this.toReport(row)));
  }

  /**
   * Guarda un informe en el historial del usuario (máximo
   * `INSIGHTS_REPORT_HISTORY_LIMIT`): el siguiente expulsa el más viejo.
   * Idempotente por `id`.
   */
  async putReport(
    id: string,
    dto: PutReportDto,
    actor: AuthenticatedUser,
  ): Promise<InsightsEnvelope<InsightsReportDto>> {
    if (dto.periodTo < dto.periodFrom) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'El periodo del informe termina antes de empezar',
        { periodFrom: dto.periodFrom, periodTo: dto.periodTo },
        MarketingErrorReason.INSIGHTS_BODY_INVALID,
      );
    }
    const saved = await this.repo.transaction(async (tx) => {
      await tx.lockUser(actor.id);
      const owner = await tx.reportOwner(id);
      if (owner !== null && owner !== actor.id) {
        throw notAvailable('El informe', id);
      }
      await tx.upsertReport(actor.id, id, {
        title: dto.title,
        type: dto.type,
        audience: dto.audience,
        periodFrom: dto.periodFrom,
        periodTo: dto.periodTo,
        campaignIds: [...dto.campaignIds],
        channels: [...dto.channels],
        sections: [...dto.sections],
      });
      await tx.trimReports(actor.id, INSIGHTS_REPORT_HISTORY_LIMIT);
      const row = await tx.report(actor.id, id);
      if (!row) throw new Error('El informe guardado no se encuentra');
      return this.toReport(row);
    });
    return this.envelope(saved);
  }

  async deleteReport(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.repo.deleteReport(actor.id, id);
  }
}
