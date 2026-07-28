import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Accounts, AccountDeterminationRules } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una cuenta del plan contable. */
export interface CreateAccountData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a account type concept.
   */
  accountTypeConceptId: string;
  /**
   * Identificador asociado a normal balance concept.
   */
  normalBalanceConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a account group.
   */
  accountGroupId?: string;
  /**
   * Identificador asociado a parent account.
   */
  parentAccountId?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de is configurable mantenido por la instancia.
   */
  isConfigurable: boolean;
  /**
   * Valor de is postable mantenido por la instancia.
   */
  isPostable: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a `accounting.accounts` (plan de cuentas) y a las reglas de
 * determinación automática (`account_determination_rules`, UC-16-02, solo lectura
 * en el flujo de posteo).
 */
@Injectable()
export class AccountsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Accounts | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Accounts | null> {
    return em.findOne(Accounts, { id });
  }

  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<Accounts | null>`.
   */
  findByCode(
    em: EntityManager,
    practiceId: string,
    code: string,
  ): Promise<Accounts | null> {
    return em.findOne(Accounts, { practiceId, code });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Accounts`.
   */
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
