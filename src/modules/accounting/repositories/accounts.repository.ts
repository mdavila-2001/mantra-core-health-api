import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Accounts, AccountDeterminationRules } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una cuenta del plan contable. */
export interface CreateAccountData {
  practiceId: string;
  code: string;
  name: string;
  accountTypeConceptId: string;
  normalBalanceConceptId: string;
  statusConceptId: string;
  accountGroupId?: string;
  parentAccountId?: string;
  currencyConceptId?: string;
  isConfigurable: boolean;
  isPostable: boolean;
  actorUserId?: string;
}

/**
 * Acceso a `accounting.accounts` (plan de cuentas) y a las reglas de
 * determinación automática (`account_determination_rules`, UC-16-02, solo lectura
 * en el flujo de posteo).
 */
@Injectable()
export class AccountsRepository {
  findById(em: EntityManager, id: string): Promise<Accounts | null> {
    return em.findOne(Accounts, { id });
  }

  findByCode(
    em: EntityManager,
    practiceId: string,
    code: string,
  ): Promise<Accounts | null> {
    return em.findOne(Accounts, { practiceId, code });
  }

  create(em: EntityManager, data: CreateAccountData): Accounts {
    return em.create(
      Accounts,
      {
        practiceId: data.practiceId,
        code: data.code,
        name: data.name,
        accountTypeConceptId: data.accountTypeConceptId,
        normalBalanceConceptId: data.normalBalanceConceptId,
        statusConceptId: data.statusConceptId,
        accountGroupId: data.accountGroupId,
        parentAccountId: data.parentAccountId,
        currencyConceptId: data.currencyConceptId,
        isConfigurable: data.isConfigurable,
        isPostable: data.isPostable,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** UC-16-02: resuelve la regla de mayor prioridad vigente para un escenario. */
  async findActiveRule(
    em: EntityManager,
    tenantId: string,
    postingScenarioConceptId: string,
    statusConceptId: string,
  ): Promise<AccountDeterminationRules | null> {
    const [rule] = await em.find(
      AccountDeterminationRules,
      { tenantId, postingScenarioConceptId, statusConceptId },
      { orderBy: { priority: 'asc' }, limit: 1 },
    );
    return rule ?? null;
  }
}
