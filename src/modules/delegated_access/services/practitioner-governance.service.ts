import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { governanceShortName } from '../delegated_access.governance-concepts';
import type {
  PendingApprovalDto,
  PendingApprovalsPageDto,
  PendingApprovalsQueryDto,
  PractitionerGovernancePanelDto,
} from '../dto';
import {
  PractitionerGovernanceRepository,
  type ApprovalsCursor,
  type PendingApprovalRow,
} from '../repositories/practitioner-governance.repository';
import { SupportLinksRepository } from '../repositories/support-links.repository';

const DEFAULT_PAGE = 50;
/** Alertas que caben en la tarjeta «Para su atención»; no es un listado. */
const PANEL_ANOMALIES = 50;
const SOMEONE = 'Alguien de su equipo';

/** Qué pide cada tipo de aprobación, dicho en la voz de la pantalla («usted»). */
const ASKS: Readonly<Record<string, (what: string | null) => string>> = {
  ACTION: (what) => `pide permiso para ${what ?? 'una acción'}`,
  GRANT_CHANGE: (what) =>
    `pide un cambio de permisos${what ? ` (${what})` : ''}`,
  SOD_EXCEPTION: () => 'pide una excepción a la separación de funciones',
  ENGAGEMENT_MOVE: () => 'pide mover su vínculo a otro lugar',
  REACTIVATION: () => 'pide reactivar su acceso',
};

/** Qué se pide y qué pasa si se aprueba, en una frase. */
export function approvalSummary(
  kind: string,
  who: string,
  what: string | null,
): string {
  const ask = ASKS[kind]?.(what) ?? 'pide su aprobación';
  return `${who} ${ask}.`;
}

/** Codifica hasta dónde llegó una página; opaco para quien lo recibe. */
export function encodeApprovalsCursor(row: PendingApprovalRow): string {
  return Buffer.from(`${row.createdAt.toISOString()}|${row.id}`).toString(
    'base64url',
  );
}

/** Lee un cursor; uno que no es nuestro es un pedido mal hecho. */
export function decodeApprovalsCursor(cursor: string): ApprovalsCursor {
  const [iso, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  const createdAt = new Date(iso ?? '');
  if (!id || Number.isNaN(createdAt.getTime())) {
    throw new BadRequestException('El cursor no es válido');
  }
  return { createdAt, id };
}

/**
 * Lo que espera al doctor en «Mi equipo» (tarjeta «Para su atención» y
 * pantalla de aprobaciones): revisiones de acceso, alertas sobre su agenda y
 * aprobaciones de cuatro ojos que le tocan.
 *
 * Solo lee. Decidir una aprobación o una revisión es otra operación.
 */
@Injectable()
export class PractitionerGovernanceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Lecturas del gobierno de accesos.
   * @param links - Vínculos con su equipo de apoyo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PractitionerGovernanceRepository,
    private readonly links: SupportLinksRepository,
  ) {}

  /**
   * El panel del doctor: cuántas revisiones lo esperan y qué alertas hay
   * abiertas sobre las personas de su equipo.
   *
   * @param actor - El doctor.
   * @returns El panel; vacío si no tiene perfil profesional o equipo.
   */
  async panel(actor: AuthenticatedUser): Promise<PractitionerGovernancePanelDto> {
    const em = this.em.fork();
    const team = await this.teamOf(actor);
    const [pendingReviews, anomalies] = await Promise.all([
      this.repo.countPendingReviews(em, actor.id),
      this.repo.findOpenAnomalies(
        em,
        [...team.keys()],
        PANEL_ANOMALIES,
      ),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      team: [],
      pendingReviews,
      openAnomalies: anomalies.map((a) => ({
        id: a.id,
        userId: a.userId,
        kindConceptId: governanceShortName(a.kindCode),
        windowStart: a.windowStart.toISOString(),
        observed: a.observed,
        threshold: a.threshold,
      })),
    };
  }

  /**
   * Las aprobaciones que el doctor puede decidir, más nuevas primero.
   *
   * @param actor - El doctor.
   * @param q - Tamaño de página y cursor.
   * @returns La página.
   */
  async pendingApprovals(
    actor: AuthenticatedUser,
    q: PendingApprovalsQueryDto,
  ): Promise<PendingApprovalsPageDto> {
    const limit = q.limit ?? DEFAULT_PAGE;
    const team = await this.teamOf(actor);
    const rows = await this.repo.findPendingForDoctor(this.em.fork(), {
      doctorUserId: actor.id,
      teamUserIds: [...team.keys()],
      limit: limit + 1,
      after: q.cursor ? decodeApprovalsCursor(q.cursor) : undefined,
    });
    const page = rows.slice(0, limit);
    const items = page.map((row): PendingApprovalDto => {
      const who = team.get(row.requesterUserId) ?? SOMEONE;
      const kind = governanceShortName(row.kindCode);
      return {
        id: row.id,
        tenantId: row.tenantId,
        kind,
        status: 'PENDING',
        approverKind: 'DOCTOR_OWNER',
        ...(row.permissionCode ? { atom: row.permissionCode } : {}),
        requesterUserId: row.requesterUserId,
        ...(row.subjectUserId ? { subjectUserId: row.subjectUserId } : {}),
        ...(row.reasonText ? { reasonText: row.reasonText } : {}),
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        summary: approvalSummary(kind, who, row.permissionCode),
      };
    });
    return {
      items,
      count: items.length,
      nextCursor:
        rows.length > limit ? encodeApprovalsCursor(page[page.length - 1]!) : null,
    };
  }

  /** Las personas de apoyo con vínculo activo con el doctor: `userId` → nombre. */
  private async teamOf(
    actor: AuthenticatedUser,
  ): Promise<Map<string, string>> {
    if (!actor.practitionerProfileId) return new Map();
    const rows = await this.links.findLinks(this.em.fork(), {
      practitionerProfileId: actor.practitionerProfileId,
      statuses: ['ACTIVE'],
    });
    return new Map(rows.map((r) => [r.supportUserId, r.supportName ?? SOMEONE]));
  }
}
