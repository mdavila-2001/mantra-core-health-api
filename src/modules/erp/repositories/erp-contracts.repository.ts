import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  BusinessPartners,
  BusinessPartnerBankAccounts,
  Contracts,
  ContractApprovalRequests,
  ContractAmendments,
  ContractRenewals,
  ContractTerminations,
  ContractPaymentSchedules,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create partner data.
 */
export interface CreatePartnerData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de partner number mantenido por la instancia.
   */
  partnerNumber: string;
  /**
   * Identificador asociado a partner category concept.
   */
  partnerCategoryConceptId: string;
  /**
   * Valor de display name mantenido por la instancia.
   */
  displayName: string;
  /**
   * Valor de legal name mantenido por la instancia.
   */
  legalName?: string;
  /**
   * Identificador asociado a tax.
   */
  taxId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create contract data.
 */
export interface CreateContractData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de contract number mantenido por la instancia.
   */
  contractNumber: string;
  /**
   * Identificador asociado a contract type concept.
   */
  contractTypeConceptId: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a counterparty type concept.
   */
  counterpartyTypeConceptId: string;
  /**
   * Identificador asociado a counterparty ref.
   */
  counterpartyRefId?: string;
  /**
   * Valor de counterparty name mantenido por la instancia.
   */
  counterpartyName?: string;
  /**
   * Identificador asociado a primary business partner.
   */
  primaryBusinessPartnerId?: string;
  /**
   * Valor de start date mantenido por la instancia.
   */
  startDate: Date;
  /**
   * Valor de end date mantenido por la instancia.
   */
  endDate?: Date;
  /**
   * Valor de total value mantenido por la instancia.
   */
  totalValue?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a owner user.
   */
  ownerUserId?: string;
  /**
   * Identificador asociado a approval status concept.
   */
  approvalStatusConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de socios de negocio y del ciclo de vida contractual. */
@Injectable()
export class ErpContractsRepository {
  /**
   * Crea create partner.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create partner conforme al contrato `BusinessPartners`.
   */
  createPartner(em: EntityManager, data: CreatePartnerData): BusinessPartners {
    return em.create(
      BusinessPartners,
      {
        tenantId: data.tenantId,
        partnerNumber: data.partnerNumber,
        partnerCategoryConceptId: data.partnerCategoryConceptId,
        displayName: data.displayName,
        legalName: data.legalName,
        taxId: data.taxId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find partner by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find partner by id conforme al contrato `Promise<BusinessPartners | null>`.
   */
  findPartnerById(
    em: EntityManager,
    id: string,
  ): Promise<BusinessPartners | null> {
    return em.findOne(BusinessPartners, { id });
  }

  /** El número de socio es único por tenant; anticipa el conflicto de la UNIQUE. */
  findPartnerByNumber(
    em: EntityManager,
    tenantId: string,
    partnerNumber: string,
  ): Promise<BusinessPartners | null> {
    return em.findOne(BusinessPartners, { tenantId, partnerNumber });
  }

  /**
   * Crea create bank account.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create bank account conforme al contrato `BusinessPartnerBankAccounts`.
   */
  createBankAccount(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a business partner.
       */
      businessPartnerId: string;
      /**
       * Valor de bank name mantenido por la instancia.
       */
      bankName: string;
      /**
       * Valor de account holder name mantenido por la instancia.
       */
      accountHolderName?: string;
      /**
       * Valor de iban masked mantenido por la instancia.
       */
      ibanMasked?: string;
      /**
       * Valor de account number hash mantenido por la instancia.
       */
      accountNumberHash?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Valor de is primary mantenido por la instancia.
       */
      isPrimary?: boolean;
      /**
       * Identificador asociado a verification status concept.
       */
      verificationStatusConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): BusinessPartnerBankAccounts {
    return em.create(
      BusinessPartnerBankAccounts,
      {
        businessPartnerId: data.businessPartnerId,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        ibanMasked: data.ibanMasked,
        accountNumberHash: data.accountNumberHash,
        currencyConceptId: data.currencyConceptId,
        isPrimary: data.isPrimary ?? false,
        verificationStatusConceptId: data.verificationStatusConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find bank account for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find bank account for update conforme al contrato `Promise<BusinessPartnerBankAccounts | null>`.
   */
  findBankAccountForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<BusinessPartnerBankAccounts | null> {
    return em.findOne(
      BusinessPartnerBankAccounts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Crea create contract.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create contract conforme al contrato `Contracts`.
   */
  createContract(em: EntityManager, data: CreateContractData): Contracts {
    return em.create(
      Contracts,
      {
        tenantId: data.tenantId,
        contractNumber: data.contractNumber,
        contractTypeConceptId: data.contractTypeConceptId,
        title: data.title,
        description: data.description,
        counterpartyTypeConceptId: data.counterpartyTypeConceptId,
        counterpartyRefId: data.counterpartyRefId,
        counterpartyName: data.counterpartyName,
        primaryBusinessPartnerId: data.primaryBusinessPartnerId,
        startDate: data.startDate,
        endDate: data.endDate,
        totalValue: data.totalValue,
        currencyConceptId: data.currencyConceptId,
        ownerUserId: data.ownerUserId,
        approvalStatusConceptId: data.approvalStatusConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find contract by id for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find contract by id for update conforme al contrato `Promise<Contracts | null>`.
   */
  findContractByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Contracts | null> {
    return em.findOne(
      Contracts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find contract by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param contractNumber - Valor de contract number requerido por la operación.
   * @returns Resultado de find contract by number conforme al contrato `Promise<Contracts | null>`.
   */
  findContractByNumber(
    em: EntityManager,
    tenantId: string,
    contractNumber: string,
  ): Promise<Contracts | null> {
    return em.findOne(Contracts, { tenantId, contractNumber });
  }

  /**
   * Crea create approval request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create approval request conforme al contrato `ContractApprovalRequests`.
   */
  createApprovalRequest(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a contract.
       */
      contractId: string;
      /**
       * Identificador asociado a approval type concept.
       */
      approvalTypeConceptId: string;
      /**
       * Identificador asociado a requested by user.
       */
      requestedByUserId?: string;
      /**
       * Valor de due at mantenido por la instancia.
       */
      dueAt?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
    },
  ): ContractApprovalRequests {
    return em.create(
      ContractApprovalRequests,
      {
        contractId: data.contractId,
        approvalTypeConceptId: data.approvalTypeConceptId,
        requestedByUserId: data.requestedByUserId,
        requestedAt: new Date(),
        dueAt: data.dueAt,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create amendment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create amendment conforme al contrato `ContractAmendments`.
   */
  createAmendment(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a contract.
       */
      contractId: string;
      /**
       * Identificador asociado a base version.
       */
      baseVersionId: string;
      /**
       * Identificador asociado a amendment type concept.
       */
      amendmentTypeConceptId: string;
      /**
       * Valor de reason text mantenido por la instancia.
       */
      reasonText?: string;
      /**
       * Valor de effective date mantenido por la instancia.
       */
      effectiveDate?: Date;
      /**
       * Identificador asociado a requested by user.
       */
      requestedByUserId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): ContractAmendments {
    return em.create(
      ContractAmendments,
      {
        contractId: data.contractId,
        baseVersionId: data.baseVersionId,
        amendmentTypeConceptId: data.amendmentTypeConceptId,
        reasonText: data.reasonText,
        effectiveDate: data.effectiveDate,
        requestedByUserId: data.requestedByUserId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create renewal.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create renewal conforme al contrato `ContractRenewals`.
   */
  createRenewal(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a contract.
       */
      contractId: string;
      /**
       * Identificador asociado a renewal type concept.
       */
      renewalTypeConceptId: string;
      /**
       * Valor de renewal effective date mantenido por la instancia.
       */
      renewalEffectiveDate?: Date;
      /**
       * Valor de new end date mantenido por la instancia.
       */
      newEndDate?: Date;
      /**
       * Valor de proposed value mantenido por la instancia.
       */
      proposedValue?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a initiated by user.
       */
      initiatedByUserId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): ContractRenewals {
    return em.create(
      ContractRenewals,
      {
        contractId: data.contractId,
        renewalTypeConceptId: data.renewalTypeConceptId,
        renewalEffectiveDate: data.renewalEffectiveDate,
        newEndDate: data.newEndDate,
        proposedValue: data.proposedValue,
        currencyConceptId: data.currencyConceptId,
        initiatedByUserId: data.initiatedByUserId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create termination.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create termination conforme al contrato `ContractTerminations`.
   */
  createTermination(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a contract.
       */
      contractId: string;
      /**
       * Identificador asociado a termination type concept.
       */
      terminationTypeConceptId: string;
      /**
       * Valor de notice date mantenido por la instancia.
       */
      noticeDate?: Date;
      /**
       * Valor de effective date mantenido por la instancia.
       */
      effectiveDate?: Date;
      /**
       * Valor de reason text mantenido por la instancia.
       */
      reasonText?: string;
      /**
       * Identificador asociado a initiated by user.
       */
      initiatedByUserId?: string;
      /**
       * Valor de settlement amount mantenido por la instancia.
       */
      settlementAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): ContractTerminations {
    return em.create(
      ContractTerminations,
      {
        contractId: data.contractId,
        terminationTypeConceptId: data.terminationTypeConceptId,
        noticeDate: data.noticeDate,
        effectiveDate: data.effectiveDate,
        reasonText: data.reasonText,
        initiatedByUserId: data.initiatedByUserId,
        settlementAmount: data.settlementAmount,
        currencyConceptId: data.currencyConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create payment schedule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create payment schedule conforme al contrato `ContractPaymentSchedules`.
   */
  createPaymentSchedule(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a contract.
       */
      contractId: string;
      /**
       * Valor de installment number mantenido por la instancia.
       */
      installmentNumber: number;
      /**
       * Valor de due date mantenido por la instancia.
       */
      dueDate: Date;
      /**
       * Valor de amount mantenido por la instancia.
       */
      amount: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a payment direction concept.
       */
      paymentDirectionConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): ContractPaymentSchedules {
    return em.create(
      ContractPaymentSchedules,
      {
        contractId: data.contractId,
        installmentNumber: data.installmentNumber,
        dueDate: data.dueDate,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        paymentDirectionConceptId: data.paymentDirectionConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Cuotas ya generadas: la generación es idempotente y no debe duplicarlas. */
  findSchedulesByContract(
    em: EntityManager,
    contractId: string,
  ): Promise<ContractPaymentSchedules[]> {
    return em.find(ContractPaymentSchedules, { contractId });
  }
}
