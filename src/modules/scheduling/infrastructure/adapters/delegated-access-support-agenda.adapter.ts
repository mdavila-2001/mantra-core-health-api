import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { orderSupportDoctors } from '../../../delegated_access/domain/support-doctors-order';
import { withPersonScope } from '../../../delegated_access/services/tenant-context';
import { SupportAccessPolicy } from '../../../delegated_access/services/support-access.policy';
import type { SupportAccessDecision } from '../../../delegated_access/domain';
import type {
  SupportAgendaDecisionHooks,
  SupportAgendaAnswer,
  SupportAgendaEvaluator,
  SupportAgendaPolicyPort,
  SupportAgendaQuestion,
} from '../../application/ports/support-agenda-policy.port';

/**
 * Adaptador de la política del personal de apoyo (`delegated_access`) al
 * puerto de la agenda. Es el único que conoce al otro módulo.
 */
@Injectable()
export class DelegatedAccessSupportAgendaAdapter implements SupportAgendaPolicyPort {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param policy - Política de acceso del personal de apoyo.
   */
  constructor(private readonly policy: SupportAccessPolicy) {}

  decide(question: SupportAgendaQuestion): Promise<SupportAgendaAnswer> {
    return this.decideWithContext(question, {});
  }

  async decideWithContext(
    question: SupportAgendaQuestion,
    hooks: SupportAgendaDecisionHooks,
  ): Promise<SupportAgendaAnswer> {
    const decision = await this.policy.can({
      userId: question.userId,
      tenantId: question.tenantId,
      action: question.action,
      practitionerProfileId: question.practitionerProfileId,
      healthcareServiceId: question.healthcareServiceId,
      careSpaceId: question.careSpaceId,
      ...(hooks.context ? { context: hooks.context } : {}),
      ...(hooks.completeContext
        ? { completeContext: hooks.completeContext }
        : {}),
    });
    return toAnswer(decision);
  }

  inTenantScope<T>(
    em: EntityManager,
    tenantId: string,
    work: (tx: EntityManager) => Promise<T>,
  ): Promise<T> {
    return withPersonScope(em, (tx, scope) =>
      scope.inTenant(tenantId, () => work(tx)),
    );
  }

  orderDoctors<
    T extends { practitionerProfileId: string; displayName: string },
  >(doctors: readonly T[]): T[] {
    return orderSupportDoctors(doctors);
  }

  async evaluator(
    userId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<SupportAgendaEvaluator> {
    const evaluate = await this.policy.evaluatorFor(userId, tenantId, em);
    const decide: SupportAgendaEvaluator = (question) =>
      toAnswer(
        evaluate({
          action: question.action,
          practitionerProfileId: question.practitionerProfileId,
          healthcareServiceId: question.healthcareServiceId,
          careSpaceId: question.careSpaceId,
          ...(question.context ? { context: question.context } : {}),
        }),
      );
    if (evaluate.prime) decide.prime = evaluate.prime;
    return decide;
  }
}

/** Decisión de la política → respuesta del puerto (los campos nuevos solo si vienen). */
function toAnswer(decision: SupportAccessDecision): SupportAgendaAnswer {
  return {
    allowed: decision.allowed,
    reason: decision.reason,
    grantId: decision.grantId,
    ...(decision.effect ? { effect: decision.effect } : {}),
    ...(decision.atom ? { atom: decision.atom } : {}),
    ...(decision.challenge ? { challenge: decision.challenge } : {}),
    ...(decision.visibleFields
      ? { visibleFields: decision.visibleFields }
      : {}),
  };
}
