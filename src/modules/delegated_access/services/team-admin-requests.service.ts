import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type { EngagementRequestItems } from '../entities';
import type {
  AffiliationInvitationCreatedDto,
  CreateAffiliationInvitationDto,
  DecideEngagementRequestDto,
  EngagementDecisionResultDto,
  EngagementRequestItemViewDto,
  EngagementRequestViewDto,
  ItemDecisionDto,
} from '../dto';
import {
  EngagementRequestsRepository,
  RoleTemplatesRepository,
} from '../repositories';
import { AffiliationInvitationsService } from './affiliation-invitations.service';
import { DelegationScopeService } from './delegation-scope.service';
import {
  EngagementRequestsService,
  type DecideScope,
} from './engagement-requests.service';
import { emissionOf } from './engagement-requests.emission';
import { governanceError } from './governance-errors';
import { TARGET_KIND_BY_CONCEPT } from './support-grant-facts';
import { TeamAdminPolicy, type TeamActor } from './team-admin.policy';

const DECIDE = 'team.requests.decide';
const INVITE = 'team.invitations.create';

/** Una solicitud con solo los ítems del alcance de quien consulta. */
export interface TeamRequestView extends Omit<
  EngagementRequestViewDto,
  'items'
> {
  /** Ítems pendientes dentro de su alcance. */
  readonly items: readonly EngagementRequestItemViewDto[];
  /** Ítems pendientes fuera de su alcance (los decide `SECURITY_ADMIN`). */
  readonly otherItems: number;
}

/** Solicitudes pendientes visibles para quien administra. */
export interface TeamRequestsView {
  readonly items: TeamRequestView[];
  readonly count: number;
}

/**
 * Invitaciones y solicitudes por `/org/team/*` (CONTRATO-GOBIERNO §6.4). Quien
 * administra por alcance decide por ítem solo lo suyo, dentro de su techo; lo
 * demás sigue pendiente para `SECURITY_ADMIN`, que conserva la regla de siempre
 * (decidir toda la solicitud).
 */
@Injectable()
export class TeamAdminRequestsService {
  /**
   * @param em - Contexto de persistencia.
   * @param policy - Alcance y techo.
   * @param requests - Solicitudes de vínculo.
   * @param requestsRepo - Lecturas de solicitudes.
   * @param invitations - Invitaciones de afiliación.
   * @param templates - Plantillas de rol.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly policy: TeamAdminPolicy,
    private readonly requests: EngagementRequestsService,
    private readonly requestsRepo: EngagementRequestsRepository,
    private readonly invitations: AffiliationInvitationsService,
    private readonly templates: RoleTemplatesRepository,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TeamAdminRequestsService.name);
  }

  /**
   * Crea una invitación: un delegado invita solo personal de apoyo y solo con
   * plantillas de su techo.
   *
   * @param dto - Cuerpo de la invitación.
   * @param actor - Quien invita.
   * @returns El código (se muestra una sola vez).
   */
  async invite(
    dto: CreateAffiliationInvitationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationInvitationCreatedDto> {
    const tenantId = this.scope.resolveTenant();
    const me = await this.policy.actorOf(
      this.em.fork({ keepTransactionContext: true }),
      actor,
      tenantId,
      INVITE,
      new Date(),
    );
    if (!me.full) {
      const allowed =
        dto.kind === 'SUPPORT_STAFF' &&
        !!dto.roleTemplateCode &&
        me.ctx.assignGrants.some(
          (g) =>
            !g.ceiling.templates ||
            g.ceiling.templates.includes(dto.roleTemplateCode as string),
        );
      if (!allowed) {
        throw governanceError(
          Reason.ADMIN_CEILING_EXCEEDED,
          'Solo puede invitar personal de apoyo con las funciones de su techo.',
        );
      }
    }
    return this.invitations.create(dto, actor);
  }

  /**
   * Solicitudes pendientes con solo los ítems dentro del alcance.
   *
   * @param actor - Quien consulta.
   * @returns Las solicitudes que tienen algún ítem suyo.
   */
  async listRequests(actor: AuthenticatedUser): Promise<TeamRequestsView> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const me = await this.policy.actorOf(
      tx,
      actor,
      tenantId,
      DECIDE,
      new Date(),
    );
    const page = await this.requests.listForTenant({
      status: 'PENDING',
      limit: 100,
    } as never);
    const items: TeamRequestView[] = [];
    for (const request of page.items) {
      const pending = request.items.filter((i) => i.decision === 'PENDING');
      const mine: EngagementRequestItemViewDto[] = [];
      for (const item of pending) {
        const target = await this.policy.targetOf(tx, item);
        if (this.policy.inScope(me, DECIDE, target)) mine.push(item);
      }
      if (mine.length === 0) continue;
      items.push({
        ...request,
        items: mine,
        otherItems: pending.length - mine.length,
      });
    }
    return { items, count: items.length };
  }

  /**
   * Decide los ítems propios; el resto sigue pendiente. `SECURITY_ADMIN` decide
   * como siempre.
   *
   * @param requestId - Solicitud.
   * @param dto - Decisión por ítem.
   * @param actor - Quien decide.
   * @returns Estado, vínculo, permisos y lo que sigue pendiente.
   */
  async decide(
    requestId: string,
    dto: DecideEngagementRequestDto,
    actor: AuthenticatedUser,
  ): Promise<EngagementDecisionResultDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const me = await this.policy.actorOf(
      tx,
      actor,
      tenantId,
      DECIDE,
      new Date(),
    );
    if (me.full) return this.requests.decide(requestId, dto, actor);
    // GP-6: un delegado no decide lo que pidió otro administrador (ni un
    // administrador de seguridad): evita la aprobación cruzada entre pares.
    const request = await this.requestsRepo.findById(tx, requestId);
    if (request) {
      await this.policy.assertUserNotPeer(
        tx,
        me,
        request.requesterUserId,
        tenantId,
        new Date(),
      );
    }
    return this.requests.decide(requestId, dto, actor, {
      scope: this.scopeOf(me, tenantId, requestId),
    });
  }

  /** Alcance y techo de quien decide, como los espera `EngagementRequestsService`. */
  private scopeOf(
    me: TeamActor,
    tenantId: string,
    requestId: string,
  ): DecideScope {
    return {
      inScope: async (item) =>
        this.policy.inScope(
          me,
          DECIDE,
          await this.policy.targetOf(
            this.em.fork({ keepTransactionContext: true }),
            refsOf(item),
          ),
        ),
      assertCeiling: async (item, decision: ItemDecisionDto) => {
        const tx = this.em.fork({ keepTransactionContext: true });
        const request = await this.requestsRepo.findById(tx, requestId);
        const template = request
          ? await this.templates.findById(tx, request.roleTemplateId)
          : null;
        // Se mide EXACTAMENTE lo que `emitGrant` concederá (misma función).
        const emitted = emissionOf(item, decision);
        const target = await this.policy.targetOf(tx, {
          targetKind: emitted.kind,
          ...emitted.refs,
        });
        await this.policy.assertGrantAllowed(tx, me, {
          tenantId,
          target,
          atoms: emitted.actions,
          templateCode: template?.code ?? '',
          validTo: emitted.validTo,
          now: new Date(),
        });
      },
    };
  }
}

/** Referencias de un ítem de solicitud. */
function refsOf(item: EngagementRequestItems) {
  return {
    targetKind: TARGET_KIND_BY_CONCEPT[item.targetKindConceptId],
    practitionerRoleAssignmentId: item.practitionerRoleAssignmentId,
    healthcareServiceId: item.healthcareServiceId,
    careSpaceId: item.careSpaceId,
    practiceSiteId: item.practiceSiteId,
  };
}
