import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  AssignHandoverDto,
  AssignHandoverResultDto,
  CompleteChecklistItemDto,
  LifecycleCaseDetailDto,
  ListLifecycleCasesQueryDto,
  ListLifecycleCasesResponseDto,
} from '../dto';
import { DelegationScopeService } from './delegation-scope.service';
import { EngagementHandoverService } from './engagement-handover.service';
import { LifecycleService } from './lifecycle.service';
import { TeamAdminPolicy, type TeamActor } from './team-admin.policy';

const VIEW = 'team.members.view';
const HANDOVER = 'team.handover.execute';
/** Átomo extra que exige completar a mano cada ítem (§8.3: «el átomo del ítem»). */
const ITEM_ATOM: Readonly<Record<string, string>> = {
  HANDOVER_ASSIGNED: HANDOVER,
};

/**
 * Casos de ciclo de vida para quien administra por alcance. `SECURITY_ADMIN`
 * ve todos; un administrador delegado ve los de personas dentro de su alcance y
 * los que él mismo abrió (la persona que dio de baja ya no tiene permisos vivos
 * y aun así debe poder terminar su traspaso).
 */
@Injectable()
export class TeamAdminCasesService {
  /**
   * @param em - Contexto de persistencia.
   * @param policy - Alcance y techo.
   * @param lifecycle - Casos de ciclo de vida.
   * @param handover - Traspasos.
   * @param scope - Organización activa verificada.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly policy: TeamAdminPolicy,
    private readonly lifecycle: LifecycleService,
    private readonly handover: EngagementHandoverService,
    private readonly scope: DelegationScopeService,
  ) {}

  /**
   * Casos visibles para el actor.
   *
   * @param actor - Quien consulta.
   * @param query - Tipo y estado.
   * @returns Los casos.
   */
  async cases(
    actor: AuthenticatedUser,
    query: ListLifecycleCasesQueryDto,
  ): Promise<ListLifecycleCasesResponseDto> {
    const { me, visible } = await this.visibility(actor, VIEW);
    const all = await this.lifecycle.listCases(query);
    if (me.full) return all;
    const items = all.items.filter((c) =>
      visible(c.engagementId, c.openedByUserId),
    );
    return { items, count: items.length };
  }

  /**
   * Un caso con su lista y sus traspasos.
   *
   * @param caseId - Caso.
   * @param actor - Quien consulta.
   * @returns El detalle; uno fuera de su alcance responde como inexistente.
   */
  async caseOf(
    caseId: string,
    actor: AuthenticatedUser,
  ): Promise<LifecycleCaseDetailDto> {
    const { visible } = await this.visibility(actor, VIEW);
    const detail = await this.lifecycle.getCase(caseId);
    this.assertVisible(visible, detail);
    return detail;
  }

  /**
   * Marca a mano un ítem de un caso visible.
   *
   * @param caseId - Caso.
   * @param code - Ítem.
   * @param actor - Quien lo marca.
   * @param dto - Nota.
   * @returns El caso al día.
   */
  async completeItem(
    caseId: string,
    code: string,
    actor: AuthenticatedUser,
    dto?: CompleteChecklistItemDto,
  ): Promise<LifecycleCaseDetailDto> {
    const extra = ITEM_ATOM[code];
    const { visible } = await this.visibility(actor, VIEW);
    if (extra) await this.visibility(actor, extra);
    this.assertVisible(visible, await this.lifecycle.getCase(caseId));
    return this.lifecycle.completeItem(caseId, code, actor, dto);
  }

  /**
   * Reasigna los traspasos pendientes de un caso de baja visible.
   *
   * @param caseId - Caso de baja.
   * @param dto - Destinatarios.
   * @param actor - Quien reasigna.
   * @returns El estado del traspaso.
   */
  async assignHandover(
    caseId: string,
    dto: AssignHandoverDto,
    actor: AuthenticatedUser,
  ): Promise<AssignHandoverResultDto> {
    const { visible } = await this.visibility(actor, HANDOVER);
    this.assertVisible(visible, await this.lifecycle.getCase(caseId));
    return this.handover.assign(caseId, dto, actor);
  }

  /** Quién es el actor y qué casos le tocan. */
  private async visibility(
    actor: AuthenticatedUser,
    atom: string,
  ): Promise<{
    me: TeamActor;
    visible: (engagementId: string, openedBy?: string) => boolean;
  }> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const me = await this.policy.actorOf(tx, actor, tenantId, atom, now);
    if (me.full) return { me, visible: () => true };
    const mine = new Set(
      (await this.policy.population(tx, me, tenantId, atom, now)).map(
        (m) => m.record.assignment.id,
      ),
    );
    return {
      me,
      visible: (engagementId, openedBy) =>
        mine.has(engagementId) || openedBy === me.userId,
    };
  }

  private assertVisible(
    visible: (engagementId: string, openedBy?: string) => boolean,
    detail: LifecycleCaseDetailDto,
  ): void {
    if (!visible(detail.engagementId, detail.openedByUserId)) {
      throw new ResourceNotFoundException(
        'Caso no encontrado',
        undefined,
        Reason.LIFECYCLE_CASE_NOT_FOUND,
      );
    }
  }
}
