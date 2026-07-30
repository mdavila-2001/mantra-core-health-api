import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ErpContractsService } from './erp-contracts.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['ERP_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const UUID = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const contractsRepo = {
    createPartner: mockFn(),
    findPartnerById: mockFn(),
    findPartnerByNumber: mockFn(),
    createBankAccount: mockFn(),
    findBankAccountForUpdate: mockFn(),
    createContract: mockFn(),
    findContractByIdForUpdate: mockFn(),
    findContractByNumber: mockFn(),
    createApprovalRequest: mockFn(),
    createAmendment: mockFn(),
    createRenewal: mockFn(),
    createTermination: mockFn(),
    createPaymentSchedule: mockFn(),
    findSchedulesByContract: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ErpContractsService(
    em as any,
    contractsRepo,
    logger as any,
  );
  return { service, tx, contractsRepo };
}

describe('ErpContractsService', () => {
  describe('createPartner (UC-38-01)', () => {
    const dto = {
      tenantId: TENANT,
      partnerNumber: 'BP-001',
      category: 'SUPPLIER' as const,
      displayName: 'Insumos SRL',
    };

    it('creates the partner and leaves its bank account unverified', async () => {
      const d = build();
      d.contractsRepo.findPartnerByNumber.mockResolvedValue(null);
      d.contractsRepo.createPartner.mockReturnValue({ id: 'bp-1' });
      d.contractsRepo.createBankAccount.mockReturnValue({ id: 'bank-1' });

      const res = await d.service.createPartner(
        { ...dto, bankName: 'Banco Unión', ibanMasked: '****1234' },
        actor,
      );

      expect(res.bankAccountId).toBe('bank-1');
      expect(d.contractsRepo.createBankAccount).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          verificationStatusConceptId: CONCEPTS.BANK_UNVERIFIED,
        }),
      );
    });

    it('hashes the account identifier instead of storing it in the clear', async () => {
      const d = build();
      d.contractsRepo.findPartnerByNumber.mockResolvedValue(null);
      d.contractsRepo.createPartner.mockReturnValue({ id: 'bp-1' });
      d.contractsRepo.createBankAccount.mockReturnValue({ id: 'bank-1' });

      await d.service.createPartner(
        { ...dto, bankName: 'Banco Unión', ibanMasked: '****1234' },
        actor,
      );

      const persisted = d.contractsRepo.createBankAccount.mock.calls[0][1];
      expect(persisted.accountNumberHash).toHaveLength(64);
      expect(persisted.accountNumberHash).not.toBe('****1234');
    });

    it('rejects a duplicate partner number in the tenant', async () => {
      const d = build();
      d.contractsRepo.findPartnerByNumber.mockResolvedValue({
        id: 'bp-existing',
      });

      await expect(
        d.service.createPartner(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('verifyBankAccount (UC-38-02)', () => {
    it('marks the account as verified', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({ id: 'bp-1' });
      const account: any = {
        id: 'bank-1',
        businessPartnerId: UUID,
        verificationStatusConceptId: CONCEPTS.BANK_UNVERIFIED,
      };
      d.contractsRepo.findBankAccountForUpdate.mockResolvedValue(account);

      const res = await d.service.verifyBankAccount(UUID, UUID, actor);

      expect(res.verificationStatusConceptId).toBe(CONCEPTS.BANK_VERIFIED);
    });

    it('rejects an account that belongs to another partner', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({ id: 'bp-1' });
      d.contractsRepo.findBankAccountForUpdate.mockResolvedValue({
        id: 'bank-1',
        businessPartnerId: 'other-partner',
      });

      await expect(
        d.service.verifyBankAccount(UUID, UUID, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects verifying twice', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({ id: 'bp-1' });
      d.contractsRepo.findBankAccountForUpdate.mockResolvedValue({
        id: 'bank-1',
        businessPartnerId: UUID,
        verificationStatusConceptId: CONCEPTS.BANK_VERIFIED,
      });

      await expect(
        d.service.verifyBankAccount(UUID, UUID, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createContract (UC-38-03)', () => {
    const dto = {
      tenantId: TENANT,
      contractNumber: 'CT-001',
      contractType: 'SERVICE' as const,
      title: 'Mantenimiento anual',
      primaryBusinessPartnerId: UUID,
      startDate: '2026-01-01T00:00:00Z',
    };

    it('creates the contract as a draft pending approval', async () => {
      const d = build();
      d.contractsRepo.findContractByNumber.mockResolvedValue(null);
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: 'bp-1',
        displayName: 'Insumos SRL',
      });
      d.contractsRepo.createContract.mockReturnValue({ id: 'ct-1' });

      const res = await d.service.createContract(dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.CONTRACT_DRAFT);
      expect(res.approvalStatusConceptId).toBe(CONCEPTS.APPROVAL_PENDING);
    });

    it('rejects an end date before the start date', async () => {
      const d = build();

      await expect(
        d.service.createContract(
          { ...dto, endDate: '2025-01-01T00:00:00Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate contract number', async () => {
      const d = build();
      d.contractsRepo.findContractByNumber.mockResolvedValue({
        id: 'ct-existing',
      });

      await expect(
        d.service.createContract(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('requestApproval (UC-38-04)', () => {
    it('activates the contract when the decision is APPROVED', async () => {
      const d = build();
      const contract: any = {
        id: 'ct-1',
        statusConceptId: CONCEPTS.CONTRACT_DRAFT,
      };
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      d.contractsRepo.createApprovalRequest.mockReturnValue({ id: 'appr-1' });

      const res = await d.service.requestApproval(
        UUID,
        { decision: 'APPROVED' },
        actor,
      );

      expect(res.contractActivated).toBe(true);
      expect(contract.statusConceptId).toBe(CONCEPTS.CONTRACT_ACTIVE);
    });

    it('leaves the contract in draft when the approval is only requested', async () => {
      const d = build();
      const contract: any = {
        id: 'ct-1',
        statusConceptId: CONCEPTS.CONTRACT_DRAFT,
      };
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      d.contractsRepo.createApprovalRequest.mockReturnValue({ id: 'appr-1' });

      const res = await d.service.requestApproval(UUID, {}, actor);

      expect(res.contractActivated).toBe(false);
      expect(contract.statusConceptId).toBe(CONCEPTS.CONTRACT_DRAFT);
    });

    it('rejects approving a terminated contract', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue({
        id: 'ct-1',
        statusConceptId: CONCEPTS.CONTRACT_TERMINATED,
      });

      await expect(
        d.service.requestApproval(UUID, { decision: 'APPROVED' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createAmendment (UC-38-05)', () => {
    it('reopens the approval because the agreed terms changed', async () => {
      const d = build();
      const contract: any = {
        id: 'ct-1',
        statusConceptId: CONCEPTS.CONTRACT_ACTIVE,
        approvalStatusConceptId: CONCEPTS.APPROVAL_APPROVED,
      };
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      d.contractsRepo.createAmendment.mockReturnValue({ id: 'am-1' });

      await d.service.createAmendment(
        UUID,
        { baseVersionId: UUID, amendmentType: 'PRICE' },
        actor,
      );

      expect(contract.approvalStatusConceptId).toBe(CONCEPTS.APPROVAL_PENDING);
    });

    it('rejects amending a terminated contract', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue({
        id: 'ct-1',
        statusConceptId: CONCEPTS.CONTRACT_TERMINATED,
      });

      await expect(
        d.service.createAmendment(
          UUID,
          { baseVersionId: UUID, amendmentType: 'SCOPE' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createRenewal (UC-38-06)', () => {
    it('extends the contract end date', async () => {
      const d = build();
      const contract: any = {
        id: 'ct-1',
        statusConceptId: CONCEPTS.CONTRACT_ACTIVE,
        endDate: new Date('2026-12-31T00:00:00Z'),
      };
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      d.contractsRepo.createRenewal.mockReturnValue({ id: 'rn-1' });

      await d.service.createRenewal(
        UUID,
        { renewalType: 'NEGOTIATED', newEndDate: '2027-12-31T00:00:00Z' },
        actor,
      );

      expect(contract.endDate.toISOString()).toContain('2027-12-31');
    });

    it('rejects a renewal that does not extend the term', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue({
        id: 'ct-1',
        statusConceptId: CONCEPTS.CONTRACT_ACTIVE,
        endDate: new Date('2026-12-31T00:00:00Z'),
      });

      await expect(
        d.service.createRenewal(
          UUID,
          { renewalType: 'AUTOMATIC', newEndDate: '2026-06-30T00:00:00Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createTermination (UC-38-07)', () => {
    it('terminates the contract', async () => {
      const d = build();
      const contract: any = {
        id: 'ct-1',
        statusConceptId: CONCEPTS.CONTRACT_ACTIVE,
      };
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      d.contractsRepo.createTermination.mockReturnValue({ id: 'tm-1' });

      const res = await d.service.createTermination(
        UUID,
        { terminationType: 'CAUSE', effectiveDate: '2026-06-30T00:00:00Z' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.CONTRACT_TERMINATED);
      expect(contract.statusConceptId).toBe(CONCEPTS.CONTRACT_TERMINATED);
    });

    it('rejects terminating twice', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue({
        id: 'ct-1',
        statusConceptId: CONCEPTS.CONTRACT_TERMINATED,
      });

      await expect(
        d.service.createTermination(
          UUID,
          { terminationType: 'CAUSE', effectiveDate: '2026-06-30T00:00:00Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('generatePaymentSchedule (UC-38-16)', () => {
    const dto = { installments: 4, firstDueDate: '2026-01-31T00:00:00Z' };

    it('splits the contract value across the installments', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue({
        id: 'ct-1',
        totalValue: '12000.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
      });
      d.contractsRepo.findSchedulesByContract.mockResolvedValue([]);

      const res = await d.service.generatePaymentSchedule(UUID, dto, actor);

      expect(res.created).toBe(4);
      expect(res.installmentAmount).toBe('3000.00');
      expect(d.contractsRepo.createPaymentSchedule).toHaveBeenCalledTimes(4);
    });

    it('is idempotent: does not regenerate an existing schedule', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue({
        id: 'ct-1',
        totalValue: '12000.00',
      });
      d.contractsRepo.findSchedulesByContract.mockResolvedValue([
        { amount: '3000.00' },
      ]);

      const res = await d.service.generatePaymentSchedule(UUID, dto, actor);

      expect(res.created).toBe(0);
      expect(d.contractsRepo.createPaymentSchedule).not.toHaveBeenCalled();
    });

    it('rejects generating a schedule without a contract value', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue({
        id: 'ct-1',
      });

      await expect(
        d.service.generatePaymentSchedule(UUID, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the contract does not exist', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(null);

      await expect(
        d.service.generatePaymentSchedule(UUID, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
