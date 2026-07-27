import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ErpContractsRepository } from '../repositories';
import {
  CreatePartnerDto,
  PartnerResponseDto,
  VerifyBankAccountResponseDto,
  CreateContractDto,
  ContractResponseDto,
  RequestApprovalDto,
  ApprovalResponseDto,
  CreateAmendmentDto,
  CreateRenewalDto,
  CreateTerminationDto,
  ContractChangeResponseDto,
  GeneratePaymentScheduleDto,
  PaymentScheduleResponseDto,
  type PartnerCategory,
  type ContractType,
} from '../dto';

const PARTNER_CATEGORY_CONCEPT: Readonly<Record<PartnerCategory, string>> = {
  SUPPLIER: CONCEPTS.PARTNER_SUPPLIER,
  CUSTOMER: CONCEPTS.PARTNER_CUSTOMER,
  BOTH: CONCEPTS.PARTNER_BOTH,
};

const CONTRACT_TYPE_CONCEPT: Readonly<Record<ContractType, string>> = {
  SERVICE: CONCEPTS.CONTRACT_TYPE_SERVICE,
  SUPPLY: CONCEPTS.CONTRACT_TYPE_SUPPLY,
  LEASE: CONCEPTS.CONTRACT_TYPE_LEASE,
};

/** Estados en los que el contrato admite cambios. */
const MUTABLE_CONTRACT_STATES: readonly string[] = [
  CONCEPTS.CONTRACT_DRAFT,
  CONCEPTS.CONTRACT_ACTIVE,
];

const DEFAULT_INSTALLMENT_INTERVAL_DAYS = 30;

/**
 * Socios de negocio y ciclo de vida contractual: alta, aprobación, enmiendas,
 * renovación, terminación y cronograma de pagos (UC-38-01/02/03/04/05/06/07/16).
 */
@Injectable()
export class ErpContractsService {
  constructor(
    private readonly em: EntityManager,
    private readonly contractsRepo: ErpContractsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ErpContractsService.name);
  }

  /** UC-38-01: alta del socio con su cuenta bancaria principal. */
  async createPartner(
    dto: CreatePartnerDto,
    actor: AuthenticatedUser,
  ): Promise<PartnerResponseDto> {
    this.logger.info(
      {
        operation: 'erp.partner.create',
        tenantId: dto.tenantId,
        partnerNumber: dto.partnerNumber,
      },
      'Creating business partner',
    );

    const duplicate = await this.contractsRepo.findPartnerByNumber(
      this.em,
      dto.tenantId,
      dto.partnerNumber,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un socio con ese número', {
        tenantId: dto.tenantId,
        partnerNumber: dto.partnerNumber,
      });
    }

    return this.em.transactional(async (tx) => {
      const partner = this.contractsRepo.createPartner(tx, {
        tenantId: dto.tenantId,
        partnerNumber: dto.partnerNumber,
        partnerCategoryConceptId: PARTNER_CATEGORY_CONCEPT[dto.category],
        displayName: dto.displayName,
        legalName: dto.legalName,
        taxId: dto.taxId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      let bankAccountId: string | undefined;
      if (dto.bankName) {
        // La cuenta nace sin verificar: cobrar o pagar a una cuenta no verificada es
        // el vector de fraude que UC-38-02 cierra.
        const account = this.contractsRepo.createBankAccount(tx, {
          businessPartnerId: partner.id,
          bankName: dto.bankName,
          accountHolderName: dto.legalName ?? dto.displayName,
          ibanMasked: dto.ibanMasked,
          accountNumberHash: dto.ibanMasked
            ? this.hashAccount(dto.ibanMasked)
            : undefined,
          isPrimary: true,
          verificationStatusConceptId: CONCEPTS.BANK_UNVERIFIED,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        bankAccountId = account.id;
      }

      return {
        id: partner.id,
        partnerNumber: dto.partnerNumber,
        bankAccountId,
      };
    });
  }

  /**
   * UC-38-02: verifica la cuenta bancaria del socio.
   *
   * Verificar es un acto deliberado y auditable: sin él, la cuenta no debería
   * usarse para pagos salientes.
   */
  async verifyBankAccount(
    partnerId: string,
    accountId: string,
    actor: AuthenticatedUser,
  ): Promise<VerifyBankAccountResponseDto> {
    this.logger.info(
      { operation: 'erp.partner.verify-bank', partnerId, accountId },
      'Verifying partner bank account',
    );

    return this.em.transactional(async (tx) => {
      const partner = await this.contractsRepo.findPartnerById(tx, partnerId);
      if (!partner) {
        throw new ResourceNotFoundException('Socio de negocio no encontrado', {
          partnerId,
        });
      }

      const account = await this.contractsRepo.findBankAccountForUpdate(
        tx,
        accountId,
      );
      if (!account) {
        throw new ResourceNotFoundException('Cuenta bancaria no encontrada', {
          accountId,
        });
      }
      if (account.businessPartnerId !== partnerId) {
        throw new PreconditionFailedException(
          'La cuenta no pertenece a ese socio',
          {
            partnerId,
            accountId,
          },
        );
      }
      if (account.verificationStatusConceptId === CONCEPTS.BANK_VERIFIED) {
        throw new ConflictException('La cuenta ya está verificada', {
          accountId,
        });
      }

      account.verificationStatusConceptId = CONCEPTS.BANK_VERIFIED;
      touch(account, actor.id);

      return {
        bankAccountId: accountId,
        verificationStatusConceptId: CONCEPTS.BANK_VERIFIED,
      };
    });
  }

  /** UC-38-03: crea el contrato en borrador, pendiente de aprobación. */
  async createContract(
    dto: CreateContractDto,
    actor: AuthenticatedUser,
  ): Promise<ContractResponseDto> {
    this.logger.info(
      {
        operation: 'erp.contract.create',
        tenantId: dto.tenantId,
        contractNumber: dto.contractNumber,
      },
      'Creating contract',
    );

    if (dto.endDate && new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new PreconditionFailedException(
        'El contrato debe terminar después de empezar',
        {
          contractNumber: dto.contractNumber,
        },
      );
    }

    const duplicate = await this.contractsRepo.findContractByNumber(
      this.em,
      dto.tenantId,
      dto.contractNumber,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un contrato con ese número', {
        tenantId: dto.tenantId,
        contractNumber: dto.contractNumber,
      });
    }

    return this.em.transactional(async (tx) => {
      const partner = await this.contractsRepo.findPartnerById(
        tx,
        dto.primaryBusinessPartnerId,
      );
      if (!partner) {
        throw new ResourceNotFoundException('Socio de negocio no encontrado', {
          partnerId: dto.primaryBusinessPartnerId,
        });
      }

      const contract = this.contractsRepo.createContract(tx, {
        tenantId: dto.tenantId,
        contractNumber: dto.contractNumber,
        contractTypeConceptId: CONTRACT_TYPE_CONCEPT[dto.contractType],
        title: dto.title,
        description: dto.description,
        counterpartyTypeConceptId: CONCEPTS.COUNTERPARTY_PARTNER,
        counterpartyRefId: dto.primaryBusinessPartnerId,
        counterpartyName: partner.displayName,
        primaryBusinessPartnerId: dto.primaryBusinessPartnerId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        totalValue: dto.totalValue,
        currencyConceptId: dto.totalValue ? CONCEPTS.CURRENCY_BOB : undefined,
        ownerUserId: actor.id,
        approvalStatusConceptId: CONCEPTS.APPROVAL_PENDING,
        statusConceptId: CONCEPTS.CONTRACT_DRAFT,
        actorUserId: actor.id,
      });

      return {
        id: contract.id,
        contractNumber: dto.contractNumber,
        statusConceptId: CONCEPTS.CONTRACT_DRAFT,
        approvalStatusConceptId: CONCEPTS.APPROVAL_PENDING,
      };
    });
  }

  /**
   * UC-38-04: solicita (y opcionalmente resuelve) la aprobación del contrato.
   *
   * Aprobar es lo que activa el contrato: un borrador no obliga a nada, así que la
   * transición a `active` cuelga de esta decisión y no del alta.
   */
  async requestApproval(
    contractId: string,
    dto: RequestApprovalDto,
    actor: AuthenticatedUser,
  ): Promise<ApprovalResponseDto> {
    this.logger.info(
      {
        operation: 'erp.contract.approval',
        contractId,
        decision: dto.decision ?? 'PENDING',
      },
      'Processing contract approval',
    );

    return this.em.transactional(async (tx) => {
      const contract = await this.contractsRepo.findContractByIdForUpdate(
        tx,
        contractId,
      );
      if (!contract) {
        throw new ResourceNotFoundException('Contrato no encontrado', {
          contractId,
        });
      }
      if (contract.statusConceptId === CONCEPTS.CONTRACT_TERMINATED) {
        throw new PreconditionFailedException('El contrato está terminado', {
          contractId,
        });
      }

      const status = dto.decision
        ? dto.decision === 'APPROVED'
          ? CONCEPTS.APPROVAL_APPROVED
          : CONCEPTS.APPROVAL_REJECTED
        : CONCEPTS.APPROVAL_PENDING;

      const request = this.contractsRepo.createApprovalRequest(tx, {
        contractId,
        approvalTypeConceptId: CONCEPTS.CONTRACT_TYPE_SERVICE,
        requestedByUserId: actor.id,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        statusConceptId: status,
      });

      let contractActivated = false;
      if (status === CONCEPTS.APPROVAL_APPROVED) {
        contract.approvalStatusConceptId = CONCEPTS.APPROVAL_APPROVED;
        contract.statusConceptId = CONCEPTS.CONTRACT_ACTIVE;
        contractActivated = true;
      } else if (status === CONCEPTS.APPROVAL_REJECTED) {
        contract.approvalStatusConceptId = CONCEPTS.APPROVAL_REJECTED;
      }
      touch(contract, actor.id);

      return { id: request.id, statusConceptId: status, contractActivated };
    });
  }

  /** UC-38-05: registra una enmienda sobre una versión del contrato. */
  async createAmendment(
    contractId: string,
    dto: CreateAmendmentDto,
    actor: AuthenticatedUser,
  ): Promise<ContractChangeResponseDto> {
    this.logger.info(
      {
        operation: 'erp.contract.amend',
        contractId,
        amendmentType: dto.amendmentType,
      },
      'Creating contract amendment',
    );

    return this.em.transactional(async (tx) => {
      const contract = await this.assertMutableContract(tx, contractId);

      const amendment = this.contractsRepo.createAmendment(tx, {
        contractId,
        baseVersionId: dto.baseVersionId,
        amendmentTypeConceptId:
          dto.amendmentType === 'SCOPE'
            ? CONCEPTS.AMENDMENT_SCOPE
            : CONCEPTS.AMENDMENT_PRICE,
        reasonText: dto.reasonText,
        effectiveDate: dto.effectiveDate
          ? new Date(dto.effectiveDate)
          : undefined,
        requestedByUserId: actor.id,
        statusConceptId: CONCEPTS.APPROVAL_PENDING,
        actorUserId: actor.id,
      });

      // Una enmienda vuelve a abrir la aprobación: cambia el alcance o el precio
      // pactado, así que el contrato no puede seguir considerándose aprobado.
      contract.approvalStatusConceptId = CONCEPTS.APPROVAL_PENDING;
      touch(contract, actor.id);

      return {
        id: amendment.id,
        contractId,
        statusConceptId: CONCEPTS.APPROVAL_PENDING,
      };
    });
  }

  /** UC-38-06: renueva el contrato extendiendo su vigencia. */
  async createRenewal(
    contractId: string,
    dto: CreateRenewalDto,
    actor: AuthenticatedUser,
  ): Promise<ContractChangeResponseDto> {
    this.logger.info(
      {
        operation: 'erp.contract.renew',
        contractId,
        renewalType: dto.renewalType,
      },
      'Renewing contract',
    );

    return this.em.transactional(async (tx) => {
      const contract = await this.assertMutableContract(tx, contractId);

      const newEndDate = new Date(dto.newEndDate);
      if (contract.endDate && newEndDate <= contract.endDate) {
        throw new PreconditionFailedException(
          'La renovación debe extender la vigencia más allá del fin actual',
          { contractId },
        );
      }

      const renewal = this.contractsRepo.createRenewal(tx, {
        contractId,
        renewalTypeConceptId:
          dto.renewalType === 'AUTOMATIC'
            ? CONCEPTS.RENEWAL_AUTOMATIC
            : CONCEPTS.RENEWAL_NEGOTIATED,
        renewalEffectiveDate: contract.endDate ?? new Date(),
        newEndDate,
        proposedValue: dto.proposedValue,
        currencyConceptId: dto.proposedValue
          ? CONCEPTS.CURRENCY_BOB
          : undefined,
        initiatedByUserId: actor.id,
        statusConceptId: CONCEPTS.APPROVAL_APPROVED,
        actorUserId: actor.id,
      });

      contract.endDate = newEndDate;
      if (dto.proposedValue) contract.totalValue = dto.proposedValue;
      touch(contract, actor.id);

      return {
        id: renewal.id,
        contractId,
        statusConceptId: CONCEPTS.APPROVAL_APPROVED,
      };
    });
  }

  /** UC-38-07: termina el contrato y fija su liquidación. */
  async createTermination(
    contractId: string,
    dto: CreateTerminationDto,
    actor: AuthenticatedUser,
  ): Promise<ContractChangeResponseDto> {
    this.logger.info(
      {
        operation: 'erp.contract.terminate',
        contractId,
        terminationType: dto.terminationType,
      },
      'Terminating contract',
    );

    return this.em.transactional(async (tx) => {
      const contract = await this.contractsRepo.findContractByIdForUpdate(
        tx,
        contractId,
      );
      if (!contract) {
        throw new ResourceNotFoundException('Contrato no encontrado', {
          contractId,
        });
      }
      if (contract.statusConceptId === CONCEPTS.CONTRACT_TERMINATED) {
        throw new ConflictException('El contrato ya está terminado', {
          contractId,
        });
      }

      const termination = this.contractsRepo.createTermination(tx, {
        contractId,
        terminationTypeConceptId:
          dto.terminationType === 'CAUSE'
            ? CONCEPTS.TERMINATION_CAUSE
            : CONCEPTS.TERMINATION_CONVENIENCE,
        noticeDate: new Date(),
        effectiveDate: new Date(dto.effectiveDate),
        reasonText: dto.reasonText,
        initiatedByUserId: actor.id,
        settlementAmount: dto.settlementAmount,
        currencyConceptId: dto.settlementAmount
          ? CONCEPTS.CURRENCY_BOB
          : undefined,
        statusConceptId: CONCEPTS.APPROVAL_APPROVED,
        actorUserId: actor.id,
      });

      contract.statusConceptId = CONCEPTS.CONTRACT_TERMINATED;
      touch(contract, actor.id);

      return {
        id: termination.id,
        contractId,
        statusConceptId: CONCEPTS.CONTRACT_TERMINATED,
      };
    });
  }

  /**
   * UC-38-16 (job): genera el cronograma de cuotas del contrato.
   *
   * Idempotente: si el contrato ya tiene cuotas no se vuelven a generar, porque
   * duplicarlas descuadraría las obligaciones de pago.
   */
  async generatePaymentSchedule(
    contractId: string,
    dto: GeneratePaymentScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentScheduleResponseDto> {
    this.logger.info(
      {
        operation: 'erp.contract.schedule',
        contractId,
        installments: dto.installments,
      },
      'Generating contract payment schedule',
    );

    return this.em.transactional(async (tx) => {
      const contract = await this.contractsRepo.findContractByIdForUpdate(
        tx,
        contractId,
      );
      if (!contract) {
        throw new ResourceNotFoundException('Contrato no encontrado', {
          contractId,
        });
      }
      if (!contract.totalValue) {
        throw new PreconditionFailedException(
          'El contrato no tiene valor total del que derivar las cuotas',
          { contractId },
        );
      }

      const existing = await this.contractsRepo.findSchedulesByContract(
        tx,
        contractId,
      );
      if (existing.length > 0) {
        return {
          contractId,
          created: 0,
          installmentAmount: existing[0].amount ?? '0.00',
        };
      }

      const installmentAmount = (
        Number(contract.totalValue) / dto.installments
      ).toFixed(2);
      const intervalDays =
        dto.intervalDays ?? DEFAULT_INSTALLMENT_INTERVAL_DAYS;
      const firstDue = new Date(dto.firstDueDate);
      const direction =
        dto.direction === 'INBOUND'
          ? CONCEPTS.PAYMENT_DIRECTION_IN
          : CONCEPTS.PAYMENT_DIRECTION_OUT;

      for (let i = 0; i < dto.installments; i += 1) {
        const dueDate = new Date(firstDue);
        dueDate.setUTCDate(dueDate.getUTCDate() + i * intervalDays);
        this.contractsRepo.createPaymentSchedule(tx, {
          contractId,
          installmentNumber: i + 1,
          dueDate,
          amount: installmentAmount,
          currencyConceptId: contract.currencyConceptId,
          paymentDirectionConceptId: direction,
          statusConceptId: CONCEPTS.SCHEDULE_PENDING,
          actorUserId: actor.id,
        });
      }

      return { contractId, created: dto.installments, installmentAmount };
    });
  }

  /** Contrato existente y en un estado que admite cambios. */
  private async assertMutableContract(tx: EntityManager, contractId: string) {
    const contract = await this.contractsRepo.findContractByIdForUpdate(
      tx,
      contractId,
    );
    if (!contract) {
      throw new ResourceNotFoundException('Contrato no encontrado', {
        contractId,
      });
    }
    if (!MUTABLE_CONTRACT_STATES.includes(contract.statusConceptId)) {
      throw new PreconditionFailedException(
        'El contrato no admite cambios en su estado actual',
        { contractId },
      );
    }
    return contract;
  }

  /** Hash del identificador de cuenta: la base nunca guarda el número completo. */
  private hashAccount(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
