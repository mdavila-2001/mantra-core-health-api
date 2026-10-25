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
import { ErpScopeService } from './erp-scope.service';
import { T1, T2, expectNotFound, inTenant } from './erp.testing';

const actor = { id: 'user-1', roles: ['ERP_ADMIN'] } as any;
const TENANT = T1;
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
    findBankAccountById: mockFn(),
    findBankAccountForUpdate: mockFn(),
    createContract: mockFn(),
    findContractByIdForUpdate: mockFn(),
    findContractById: mockFn(),
    findLeaseContractById: mockFn(),
    findRequisitionById: mockFn(),
    findContractByNumber: mockFn(),
    createApprovalRequest: mockFn(),
    createAmendment: mockFn(),
    createRenewal: mockFn(),
    createTermination: mockFn(),
    createPaymentSchedule: mockFn(),
    findSchedulesByContract: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = new ErpScopeService(contractsRepo as any, {} as any);
  const raw = new ErpContractsService(
    em as any,
    contractsRepo,
    scope,
    logger as any,
  );
  return { raw, service: inTenant(raw), tx, contractsRepo };
}

/** Deja la cuenta disponible para la lectura sin bloqueo y para la bloqueada. */
function seedAccount(d: ReturnType<typeof build>, account: any) {
  d.contractsRepo.findBankAccountById.mockResolvedValue(account);
  d.contractsRepo.findBankAccountForUpdate.mockResolvedValue(account);
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
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: 'bp-1',
        tenantId: TENANT,
      });
      const account: any = {
        id: 'bank-1',
        businessPartnerId: UUID,
        verificationStatusConceptId: CONCEPTS.BANK_UNVERIFIED,
      };
      seedAccount(d, account);

      const res = await d.service.verifyBankAccount(UUID, UUID, actor);

      expect(res.verificationStatusConceptId).toBe(CONCEPTS.BANK_VERIFIED);
    });

    it('rejects an account that belongs to another partner', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: 'bp-1',
        tenantId: TENANT,
      });
      seedAccount(d, {
        id: 'bank-1',
        businessPartnerId: 'other-partner',
      });

      await expect(
        d.service.verifyBankAccount(UUID, UUID, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects verifying twice', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: 'bp-1',
        tenantId: TENANT,
      });
      seedAccount(d, {
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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

  describe('alcance de tenant (ERP-01)', () => {
    const foreignContract = () => ({
      id: 'ct-b',
      tenantId: T2,
      statusConceptId: CONCEPTS.CONTRACT_ACTIVE,
      approvalStatusConceptId: CONCEPTS.APPROVAL_APPROVED,
      endDate: new Date('2026-12-31T00:00:00Z'),
      totalValue: '12000.00',
    });
    const partnerDto = {
      partnerNumber: 'BP-001',
      category: 'SUPPLIER' as const,
      displayName: 'Insumos SRL',
    };

    it('correcto: el alta toma el tenant del contexto aunque el cuerpo no lo declare', async () => {
      const d = build();
      d.contractsRepo.findPartnerByNumber.mockResolvedValue(null);
      d.contractsRepo.createPartner.mockReturnValue({ id: 'bp-1' });
      await d.service.createPartner(partnerDto, actor);
      expect(d.contractsRepo.createPartner).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('falla catalogada: un tenantId del cuerpo ajeno a la sesión responde 404 y no escribe', async () => {
      const d = build();
      await expectNotFound(
        d.service.createPartner({ ...partnerDto, tenantId: T2 }, actor),
      );
      expect(d.contractsRepo.findPartnerByNumber).not.toHaveBeenCalled();
      expect(d.contractsRepo.createPartner).not.toHaveBeenCalled();
    });

    it('los socios se buscan por id + tenant activo', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: 'bp-1',
        tenantId: TENANT,
      });
      seedAccount(d, {
        id: 'bank-1',
        businessPartnerId: UUID,
        verificationStatusConceptId: CONCEPTS.BANK_UNVERIFIED,
      });
      await d.service.verifyBankAccount(UUID, UUID, actor);
      expect(d.contractsRepo.findPartnerById).toHaveBeenCalledWith(
        d.tx,
        UUID,
        TENANT,
      );
    });

    it('verificar la cuenta de un socio de B responde 404 y la cuenta queda sin verificar', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: 'bp-b',
        tenantId: T2,
      });
      const account: any = {
        id: 'bank-b',
        businessPartnerId: 'bp-b',
        verificationStatusConceptId: CONCEPTS.BANK_UNVERIFIED,
      };
      seedAccount(d, account);
      await expectNotFound(d.service.verifyBankAccount(UUID, UUID, actor));
      expect(account.verificationStatusConceptId).toBe(
        CONCEPTS.BANK_UNVERIFIED,
      );
    });

    it('una cuenta de un socio de B bajo un socio propio responde 404 sin bloquearla', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockImplementation(
        (_tx: unknown, id: string) =>
          Promise.resolve({
            id,
            tenantId: id === 'bp-b' ? T2 : TENANT,
          }),
      );
      const account: any = {
        id: 'bank-b',
        businessPartnerId: 'bp-b',
        verificationStatusConceptId: CONCEPTS.BANK_UNVERIFIED,
      };
      seedAccount(d, account);
      await expectNotFound(d.service.verifyBankAccount(UUID, 'bank-b', actor));
      expect(account.verificationStatusConceptId).toBe(
        CONCEPTS.BANK_UNVERIFIED,
      );
    });

    it('un socio ajeno responde igual que uno inexistente', async () => {
      const ajeno = build();
      ajeno.contractsRepo.findPartnerById.mockResolvedValue({
        id: 'bp-b',
        tenantId: T2,
      });
      const inexistente = build();
      inexistente.contractsRepo.findPartnerById.mockResolvedValue(null);
      const a = await expectNotFound(
        ajeno.service.verifyBankAccount(UUID, UUID, actor),
      );
      const b = await expectNotFound(
        inexistente.service.verifyBankAccount(UUID, UUID, actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('crear un contrato con un socio de B responde 404 y no escribe', async () => {
      const d = build();
      d.contractsRepo.findContractByNumber.mockResolvedValue(null);
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: UUID,
        tenantId: T2,
        displayName: 'Ajeno',
      });
      await expectNotFound(
        d.service.createContract(
          {
            contractNumber: 'CT-9',
            contractType: 'SERVICE',
            title: 't',
            primaryBusinessPartnerId: UUID,
            startDate: '2026-01-01T00:00:00Z',
          },
          actor,
        ),
      );
      expect(d.contractsRepo.createContract).not.toHaveBeenCalled();
    });

    it('correcto: A crea el contrato con su socio y queda en el tenant de A', async () => {
      const d = build();
      d.contractsRepo.findContractByNumber.mockResolvedValue(null);
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: UUID,
        tenantId: TENANT,
        displayName: 'Propio',
      });
      d.contractsRepo.createContract.mockReturnValue({ id: 'ct-1' });
      await d.service.createContract(
        {
          contractNumber: 'CT-1',
          contractType: 'SERVICE',
          title: 't',
          primaryBusinessPartnerId: UUID,
          startDate: '2026-01-01T00:00:00Z',
        },
        actor,
      );
      expect(d.contractsRepo.createContract).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('los contratos se bloquean por id + tenant activo', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue({
        id: 'ct-1',
        tenantId: TENANT,
        statusConceptId: CONCEPTS.CONTRACT_ACTIVE,
      });
      d.contractsRepo.createTermination.mockReturnValue({ id: 'tm-1' });
      await d.service.createTermination(
        UUID,
        { terminationType: 'CAUSE', effectiveDate: '2026-06-30T00:00:00Z' },
        actor,
      );
      expect(d.contractsRepo.findContractByIdForUpdate).toHaveBeenCalledWith(
        d.tx,
        UUID,
        TENANT,
      );
    });

    it('aprobar el contrato de B no lo activa ni crea la solicitud', async () => {
      const d = build();
      const contract: any = {
        ...foreignContract(),
        statusConceptId: CONCEPTS.CONTRACT_DRAFT,
      };
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      await expectNotFound(
        d.service.requestApproval(UUID, { decision: 'APPROVED' }, actor),
      );
      expect(contract.statusConceptId).toBe(CONCEPTS.CONTRACT_DRAFT);
      expect(d.contractsRepo.createApprovalRequest).not.toHaveBeenCalled();
    });

    it('enmendar el contrato de B no cambia su aprobación', async () => {
      const d = build();
      const contract: any = foreignContract();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      await expectNotFound(
        d.service.createAmendment(
          UUID,
          { baseVersionId: UUID, amendmentType: 'PRICE' },
          actor,
        ),
      );
      expect(contract.approvalStatusConceptId).toBe(CONCEPTS.APPROVAL_APPROVED);
      expect(d.contractsRepo.createAmendment).not.toHaveBeenCalled();
    });

    it('renovar el contrato de B conserva su vigencia', async () => {
      const d = build();
      const contract: any = foreignContract();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      await expectNotFound(
        d.service.createRenewal(
          UUID,
          { renewalType: 'NEGOTIATED', newEndDate: '2030-12-31T00:00:00Z' },
          actor,
        ),
      );
      expect(contract.endDate.toISOString()).toContain('2026-12-31');
      expect(d.contractsRepo.createRenewal).not.toHaveBeenCalled();
    });

    it('terminar el contrato de B no lo termina', async () => {
      const d = build();
      const contract: any = foreignContract();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      await expectNotFound(
        d.service.createTermination(
          UUID,
          { terminationType: 'CAUSE', effectiveDate: '2026-06-30T00:00:00Z' },
          actor,
        ),
      );
      expect(contract.statusConceptId).toBe(CONCEPTS.CONTRACT_ACTIVE);
      expect(d.contractsRepo.createTermination).not.toHaveBeenCalled();
    });

    it('generar el cronograma del contrato de B no crea cuotas', async () => {
      const d = build();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(
        foreignContract(),
      );
      await expectNotFound(
        d.service.generatePaymentSchedule(
          UUID,
          { installments: 4, firstDueDate: '2026-01-31T00:00:00Z' },
          actor,
        ),
      );
      expect(d.contractsRepo.createPaymentSchedule).not.toHaveBeenCalled();
    });

    it('un contrato ajeno responde igual que uno inexistente', async () => {
      const ajeno = build();
      ajeno.contractsRepo.findContractByIdForUpdate.mockResolvedValue(
        foreignContract(),
      );
      const inexistente = build();
      inexistente.contractsRepo.findContractByIdForUpdate.mockResolvedValue(
        null,
      );
      const a = await expectNotFound(
        ajeno.service.createTermination(
          UUID,
          { terminationType: 'CAUSE', effectiveDate: '2026-06-30T00:00:00Z' },
          actor,
        ),
      );
      const b = await expectNotFound(
        inexistente.service.createTermination(
          UUID,
          { terminationType: 'CAUSE', effectiveDate: '2026-06-30T00:00:00Z' },
          actor,
        ),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('el mismo contrato lo opera el rol ERP de su propio tenant', async () => {
      const d = build();
      const contract: any = foreignContract();
      d.contractsRepo.findContractByIdForUpdate.mockResolvedValue(contract);
      d.contractsRepo.createTermination.mockReturnValue({ id: 'tm-1' });
      await inTenant(d.raw, T2).createTermination(
        UUID,
        { terminationType: 'CAUSE', effectiveDate: '2026-06-30T00:00:00Z' },
        actor,
      );
      expect(contract.statusConceptId).toBe(CONCEPTS.CONTRACT_TERMINATED);
    });

    it('sin tenant en el contexto no se lee ni se escribe nada', async () => {
      const d = build();
      await expect(
        d.raw.createTermination(
          UUID,
          { terminationType: 'CAUSE', effectiveDate: '2026-06-30T00:00:00Z' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.contractsRepo.findContractByIdForUpdate).not.toHaveBeenCalled();
    });
  });
});
