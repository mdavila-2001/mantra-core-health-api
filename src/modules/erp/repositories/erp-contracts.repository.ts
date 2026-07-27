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

export interface CreatePartnerData {
  tenantId: string;
  partnerNumber: string;
  partnerCategoryConceptId: string;
  displayName: string;
  legalName?: string;
  taxId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateContractData {
  tenantId: string;
  contractNumber: string;
  contractTypeConceptId: string;
  title: string;
  description?: string;
  counterpartyTypeConceptId: string;
  counterpartyRefId?: string;
  counterpartyName?: string;
  primaryBusinessPartnerId?: string;
  startDate: Date;
  endDate?: Date;
  totalValue?: string;
  currencyConceptId?: string;
  ownerUserId?: string;
  approvalStatusConceptId: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de socios de negocio y del ciclo de vida contractual. */
@Injectable()
export class ErpContractsRepository {
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

  createBankAccount(
    em: EntityManager,
    data: {
      businessPartnerId: string;
      bankName: string;
      accountHolderName?: string;
      ibanMasked?: string;
      accountNumberHash?: string;
      currencyConceptId?: string;
      isPrimary?: boolean;
      verificationStatusConceptId: string;
      statusConceptId: string;
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

  findContractByNumber(
    em: EntityManager,
    tenantId: string,
    contractNumber: string,
  ): Promise<Contracts | null> {
    return em.findOne(Contracts, { tenantId, contractNumber });
  }

  createApprovalRequest(
    em: EntityManager,
    data: {
      contractId: string;
      approvalTypeConceptId: string;
      requestedByUserId?: string;
      dueAt?: Date;
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

  createAmendment(
    em: EntityManager,
    data: {
      contractId: string;
      baseVersionId: string;
      amendmentTypeConceptId: string;
      reasonText?: string;
      effectiveDate?: Date;
      requestedByUserId?: string;
      statusConceptId: string;
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

  createRenewal(
    em: EntityManager,
    data: {
      contractId: string;
      renewalTypeConceptId: string;
      renewalEffectiveDate?: Date;
      newEndDate?: Date;
      proposedValue?: string;
      currencyConceptId?: string;
      initiatedByUserId?: string;
      statusConceptId: string;
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

  createTermination(
    em: EntityManager,
    data: {
      contractId: string;
      terminationTypeConceptId: string;
      noticeDate?: Date;
      effectiveDate?: Date;
      reasonText?: string;
      initiatedByUserId?: string;
      settlementAmount?: string;
      currencyConceptId?: string;
      statusConceptId: string;
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

  createPaymentSchedule(
    em: EntityManager,
    data: {
      contractId: string;
      installmentNumber: number;
      dueDate: Date;
      amount: string;
      currencyConceptId?: string;
      paymentDirectionConceptId: string;
      statusConceptId: string;
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
