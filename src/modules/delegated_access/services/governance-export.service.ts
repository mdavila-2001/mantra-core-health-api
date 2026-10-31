import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { isIP } from 'node:net';
import { PinoLogger } from 'nestjs-pino';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { sha256Hex } from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  CampaignExportQueryDto,
  ExportedFileDto,
} from '../dto/access-reviews.dto';
import {
  EXPORT_REASON_CODES,
  type ExportGovernanceReportDto,
} from '../dto/governance-reports.dto';
import {
  AccessDecisionLogRepository,
  AccessReviewRepository,
} from '../repositories';
import { AccessReviewCampaignsService } from './access-review-campaigns.service';
import {
  ITEM_STATE_BY_CONCEPT,
  REVIEWER_KIND_BY_CONCEPT,
} from './access-review-concepts';
import { evidenceAtomCodes } from './access-review-views';
import { DelegationScopeService } from './delegation-scope.service';
import { GovernanceAccessService } from './governance-access.service';
import { GovernanceAnomaliesService } from './governance-anomalies.service';
import { GovernanceEvents, GovernanceEventType } from './governance-events';
import { GovernanceReportsService } from './governance-reports.service';
import {
  SUPPORT_STEP_UP_PORT,
  type SupportStepUpPort,
} from './support-access-context.ports';

/** Átomo que exige exportar a un administrador delegado. */
export const EXPORT_ATOM = 'audit.activity.export';
/** Antigüedad máxima del paso extra para exportar (`DEFAULT_STEP_UP_MAX_AGE_MINUTES` de `iam`). */
export const EXPORT_STEP_UP_MAX_AGE_MINUTES = 10;
/** Largo mínimo del motivo de una exportación. */
export const EXPORT_REASON_MIN = 10;

/** Informes exportables (`:kind`). */
export const EXPORT_KINDS = [
  'summary',
  'access-matrix',
  'privilege-creep',
  'unused-access',
  'ownerless',
  'exceptions',
  'anomalies',
] as const;

/** Dimensiones de la matriz de accesos (el único informe que las pide). */
const MATRIX_DIMENSIONS: readonly unknown[] = [
  'person',
  'doctor',
  'service',
  'location',
];

/**
 * Filtros de una exportación que el informe de verdad entiende (`by`, `group`, `id`,
 * `days`), con su tipo y rango. Todo lo demás se DESCARTA (B-B12): `filters` llegaba como
 * un objeto libre de hasta 1 MB que se copiaba al archivo exportado, al asiento y al
 * evento, es decir, un canal para meter texto arbitrario (o datos de pacientes) en la
 * evidencia de auditoría. Lo que no es un objeto simple se descarta entero.
 *
 * @param raw - Lo que mandó el cliente.
 * @returns Solo filtros conocidos y válidos.
 */
export function sanitizeExportFilters(raw: unknown): Record<string, unknown> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const f = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (MATRIX_DIMENSIONS.includes(f.by)) out.by = f.by;
  if (f.group === 'category' || f.group === 'atom') out.group = f.group;
  if (typeof f.id === 'string' && UUID.test(f.id)) out.id = f.id;
  if (
    typeof f.days === 'number' &&
    Number.isInteger(f.days) &&
    f.days >= 1 &&
    f.days <= 365
  ) {
    out.days = f.days;
  }
  return out;
}

type Row = Record<string, unknown>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cell(value: unknown): string {
  const text = (v: unknown): string =>
    typeof v === 'string' ? v : (JSON.stringify(v) ?? '');
  const raw =
    value === null || value === undefined
      ? ''
      : Array.isArray(value)
        ? value.map(text).join('|')
        : text(value);
  // Una celda que empieza por un operador de fórmula se neutraliza (inyección CSV).
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * CSV de filas planas: la cabecera es la unión de las claves en el orden en que
 * aparecen. Escapa comillas, comas y saltos de línea, y neutraliza las celdas
 * que un programa de hojas de cálculo tomaría por fórmulas.
 *
 * @param rows - Filas planas (solo identificadores, números y códigos).
 * @returns El texto CSV; vacío si no hay filas.
 */
export function toCsv(rows: readonly Row[]): string {
  if (rows.length === 0) return '';
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [
    columns.join(','),
    ...rows.map((r) => columns.map((c) => cell(r[c])).join(',')),
  ].join('\n');
}

/**
 * Exportación auditable de informes de gobierno (CONTRATO-GOBIERNO §6.6): exige
 * `SECURITY_ADMIN` o `audit.activity.export`, un motivo de al menos 10
 * caracteres y un paso extra reciente (MFA fresco, `STEP_UP_PORT`). La exportación de
 * una campaña pide lo mismo, con el motivo como código (A-B4). El archivo
 * lleva `generatedAt`, `generatedBy`, `filters`, `rowCount` y su `sha256`; queda
 * un asiento en `access_decision_log` (átomo `audit.activity.export`, con
 * `kind`, `rowCount` y `sha256`) y un evento. Sin datos de pacientes.
 */
@Injectable()
export class GovernanceExportService {
  /**
   * @param em - Contexto de persistencia.
   * @param reports - Filas de los informes.
   * @param anomalies - Anomalías.
   * @param reviews - Campañas e ítems.
   * @param campaigns - Resultados de campañas.
   * @param access - Autorización y población del administrador.
   * @param stepUp - Paso extra de la sesión.
   * @param decisionLog - Bitácora WORM de decisiones.
   * @param events - Eventos de dominio (outbox).
   * @param scope - Política común de organización.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reports: GovernanceReportsService,
    private readonly anomalies: GovernanceAnomaliesService,
    private readonly reviews: AccessReviewRepository,
    private readonly campaigns: AccessReviewCampaignsService,
    private readonly access: GovernanceAccessService,
    @Inject(SUPPORT_STEP_UP_PORT) private readonly stepUp: SupportStepUpPort,
    private readonly decisionLog: AccessDecisionLogRepository,
    private readonly events: GovernanceEvents,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GovernanceExportService.name);
  }

  /**
   * Exporta un informe. Orden de las comprobaciones: autoridad → tipo → motivo
   * (422) → paso extra (403).
   *
   * @param actor - Quien exporta.
   * @param kind - Informe (`:kind`).
   * @param dto - Formato, motivo y filtros.
   * @param ctx - Origen de la petición.
   * @throws PreconditionFailedException 422 `EXPORT_KIND_INVALID` / `EXPORT_REASON_REQUIRED`.
   * @throws DomainException 403 `STEP_UP_REQUIRED` / `STEP_UP_UNAVAILABLE`.
   */
  async exportReport(
    actor: AuthenticatedUser,
    kind: string,
    dto: Pick<
      ExportGovernanceReportDto,
      'format' | 'reason' | 'reasonCode' | 'filters'
    >,
    ctx: { ip?: string },
  ): Promise<ExportedFileDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const authority = await this.access.authorize(
        tx,
        actor,
        tenantId,
        EXPORT_ATOM,
      );
      if (!(EXPORT_KINDS as readonly string[]).includes(kind)) {
        throw new PreconditionFailedException(
          'Ese informe no se puede exportar.',
          { kinds: [...EXPORT_KINDS] },
          Reason.EXPORT_KIND_INVALID,
        );
      }
      const reason = (dto.reason ?? '').trim();
      if (reason.length < EXPORT_REASON_MIN) {
        throw new PreconditionFailedException(
          'Escriba para qué exporta el informe (al menos 10 caracteres, sin datos de pacientes).',
          undefined,
          Reason.EXPORT_REASON_REQUIRED,
        );
      }
      await this.requireStepUp(tx, actor);
      const filters = sanitizeExportFilters(dto.filters);
      const rows =
        kind === 'anomalies'
          ? (
              await this.anomalies.listFor(tx, tenantId, authority, {})
            ).items.map((a): Row => ({ ...a }))
          : ((await this.reports.rowsOf(
              tx,
              tenantId,
              authority,
              kind,
              filters,
            )) ?? []);
      return this.seal(
        tx,
        actor,
        tenantId,
        kind,
        dto.format,
        rows,
        filters,
        { text: reason, code: dto.reasonCode ?? 'OTHER' },
        ctx,
      );
    });
  }

  /**
   * Exporta los ítems de una campaña (solo `SECURITY_ADMIN`, lo exige la ruta). Igual que
   * un informe (A-B4): exige un motivo y un paso extra reciente. Como el filtro viaja en
   * la URL (GET), el motivo es solo un CÓDIGO de `EXPORT_REASON_CODES` — nunca texto libre,
   * que quedaría en los registros del servidor y los intermediarios.
   *
   * Orden de las comprobaciones: campaña (404) → motivo (422) → paso extra (403).
   *
   * @throws ResourceNotFoundException 404 `REVIEW_CAMPAIGN_NOT_FOUND`.
   * @throws PreconditionFailedException 422 `EXPORT_REASON_REQUIRED`.
   * @throws DomainException 403 `STEP_UP_REQUIRED` / `STEP_UP_UNAVAILABLE`.
   */
  async exportCampaign(
    id: string,
    query: Pick<CampaignExportQueryDto, 'format' | 'reasonCode'>,
    actor: AuthenticatedUser,
    ctx: { ip?: string },
  ): Promise<ExportedFileDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const campaign = await this.reviews.findCampaignById(tx, tenantId, id);
      if (!campaign) {
        throw new ResourceNotFoundException(
          'Campaña no encontrada',
          undefined,
          Reason.REVIEW_CAMPAIGN_NOT_FOUND,
        );
      }
      const reasonCode = query.reasonCode;
      if (
        !reasonCode ||
        !(EXPORT_REASON_CODES as readonly string[]).includes(reasonCode)
      ) {
        throw new PreconditionFailedException(
          'Indique para qué exporta la campaña (el motivo es un código: auditoría, regulatorio, control interno, incidente u otro).',
          { reasonCodes: [...EXPORT_REASON_CODES] },
          Reason.EXPORT_REASON_REQUIRED,
        );
      }
      await this.requireStepUp(tx, actor);
      const items = await this.reviews.findItemsByCampaign(tx, id);
      const results = this.campaigns.resultsOf(campaign, items);
      const rows: Row[] = items.map((i) => ({
        itemId: i.id,
        engagementId: i.organizationUserAssignmentId,
        grantId: i.supportScopeGrantId ?? null,
        reviewerKind: REVIEWER_KIND_BY_CONCEPT[i.reviewerKindConceptId] ?? null,
        state: ITEM_STATE_BY_CONCEPT[i.decisionConceptId] ?? null,
        atoms: evidenceAtomCodes(i.evidenceJson),
        decidedAt: i.decidedAt?.toISOString() ?? null,
        dueAt: i.dueAt.toISOString(),
        evidenceHash: i.evidenceHash ?? null,
      }));
      return this.seal(
        tx,
        actor,
        tenantId,
        'campaign-results',
        query.format ?? 'json',
        rows,
        { campaignId: id, results },
        { code: reasonCode },
        ctx,
      );
    });
  }

  /** Paso extra reciente: 403 `STEP_UP_REQUIRED` (con cómo resolverlo) o `STEP_UP_UNAVAILABLE`. */
  private async requireStepUp(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const age = actor.sessionId
      ? await this.stepUp.ageMinutes(actor.sessionId)
      : null;
    if (age === undefined) {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'No se pudo comprobar el segundo paso de verificación. Inténtelo de nuevo en unos minutos.',
        undefined,
        'STEP_UP_UNAVAILABLE',
      );
    }
    if (age === null || age > EXPORT_STEP_UP_MAX_AGE_MINUTES) {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Para exportar, confirme de nuevo su identidad con el segundo paso de verificación.',
        {
          maxAgeMinutes: EXPORT_STEP_UP_MAX_AGE_MINUTES,
          enrolled: await this.stepUp.isEnrolled(tx, actor.id),
        },
        'STEP_UP_REQUIRED',
      );
    }
  }

  /** Arma el archivo con su huella, deja el asiento WORM y publica el evento. */
  private async seal(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    kind: string,
    format: 'csv' | 'json',
    rows: readonly Row[],
    filters: Record<string, unknown>,
    reason: { text?: string; code: string } | undefined,
    ctx: { ip?: string },
  ): Promise<ExportedFileDto> {
    const generatedAt = new Date();
    const content =
      format === 'csv'
        ? toCsv(rows)
        : JSON.stringify(
            {
              kind,
              generatedAt: generatedAt.toISOString(),
              generatedBy: actor.id,
              filters,
              rowCount: rows.length,
              rows,
            },
            null,
            2,
          );
    const sha256 = sha256Hex(content);
    await this.decisionLog.appendNow(tx, {
      tenantId,
      userId: actor.id,
      permissionCode: EXPORT_ATOM,
      effectConceptId: DELEG.DECISION_EFFECT_PERMIT,
      reasonCode: 'GOVERNANCE_REPORT_EXPORTED',
      ...(actor.sessionId && UUID.test(actor.sessionId)
        ? { sessionId: actor.sessionId }
        : {}),
      ...(ctx.ip && isIP(ctx.ip) ? { ip: ctx.ip } : {}),
      detail: {
        kind,
        format,
        rowCount: rows.length,
        sha256,
        // El motivo es texto libre y podría traer datos de pacientes: el asiento
        // guarda solo su código, su longitud y su huella (no se puede leer ni
        // revertir), nunca el texto.
        ...(reason
          ? {
              reasonCode: reason.code,
              ...(reason.text !== undefined
                ? {
                    reasonLength: reason.text.length,
                    reasonSha256: sha256Hex(reason.text),
                  }
                : {}),
            }
          : {}),
      },
      recordedAt: generatedAt,
      recordedByUserId: actor.id,
    });
    await this.events.publish(tx, {
      tenantId,
      type: GovernanceEventType.reportExported,
      aggregate: 'governance_report',
      aggregateId: tenantId,
      payload: {
        kind,
        rowCount: rows.length,
        sha256,
        exportedAt: generatedAt.toISOString(),
      },
      actorUserId: actor.id,
    });
    this.logger.info(
      {
        operation: 'delegated_access.governance.export',
        kind,
        format,
        rowCount: rows.length,
      },
      'Governance report exported',
    );
    return {
      format,
      kind,
      generatedAt: generatedAt.toISOString(),
      generatedBy: actor.id,
      filters,
      rowCount: rows.length,
      sha256,
      content,
    };
  }
}
