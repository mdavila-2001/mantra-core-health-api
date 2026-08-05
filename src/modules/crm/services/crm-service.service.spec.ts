import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CrmServiceService } from './crm-service.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['CRM_AGENT'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const UUID = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const forked = { fork: mockFn() };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forked),
  };
  const serviceRepo = {
    createActivity: mockFn(),
    createTask: mockFn(),
    createNote: mockFn(),
    createPartnership: mockFn(),
    createAgreement: mockFn(),
    createCase: mockFn(),
    findCaseByIdForUpdate: mockFn(),
    findCaseByNumber: mockFn(),
    createCaseComment: mockFn(),
    recordCaseStatusChange: mockFn(),
    findActivitiesByAccount: mockFn(),
    findCasesByAccount: mockFn(),
  };
  const salesRepo = {
    findAccountById: mockFn(),
    findContactById: mockFn(),
    findChannelEndpointForUpdate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CrmServiceService(
    em as any,
    serviceRepo as any,
    salesRepo as any,
    logger as any,
  );
  return { service, tx, serviceRepo, salesRepo };
}

describe('CrmServiceService', () => {
  describe('createActivity (UC-49-05 y UC-49-06)', () => {
    const base = {
      tenantId: TENANT,
      subjectType: 'ACCOUNT' as const,
      subjectRefId: UUID,
      direction: 'OUTBOUND' as const,
    };

    it('creates the task subtype for a TASK activity', async () => {
      const d = build();
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });

      const res = await d.service.createActivity(
        { ...base, activityType: 'TASK' },
        actor,
      );

      expect(res.subtypeCreated).toBe(true);
      expect(d.serviceRepo.createTask).toHaveBeenCalled();
    });

    it('creates the note subtype and requires its body', async () => {
      const d = build();
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });

      const res = await d.service.createActivity(
        { ...base, activityType: 'NOTE', bodyText: 'Llamar la próxima semana' },
        actor,
      );

      expect(res.subtypeCreated).toBe(true);
      expect(d.serviceRepo.createNote).toHaveBeenCalled();
    });

    it('rejects a NOTE without body', async () => {
      const d = build();
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });

      await expect(
        d.service.createActivity(
          { ...base, activityType: 'NOTE' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('records a CALL without any subtype row', async () => {
      const d = build();
      d.serviceRepo.createActivity.mockReturnValue({ id: 'act-1' });

      const res = await d.service.createActivity(
        { ...base, activityType: 'CALL' },
        actor,
      );

      expect(res.subtypeCreated).toBe(false);
      expect(d.serviceRepo.createTask).not.toHaveBeenCalled();
      expect(d.serviceRepo.createNote).not.toHaveBeenCalled();
    });
  });

  describe('createPartnership (UC-49-10)', () => {
    const dto = {
      tenantId: TENANT,
      name: 'Alianza Norte',
      partnershipType: 'REFERRAL' as const,
      partnerRefType: 'crm_accounts',
      partnerRefId: UUID,
    };

    it('creates the framework agreement when a commitment is given', async () => {
      const d = build();
      d.serviceRepo.createPartnership.mockReturnValue({ id: 'part-1' });
      d.serviceRepo.createAgreement.mockReturnValue({ id: 'agr-1' });

      const res = await d.service.createPartnership(
        { ...dto, commitmentAmount: '50000.00' },
        actor,
      );

      expect(res.agreementId).toBe('agr-1');
    });

    it('skips the agreement when there is no commitment', async () => {
      const d = build();
      d.serviceRepo.createPartnership.mockReturnValue({ id: 'part-1' });

      const res = await d.service.createPartnership(dto, actor);

      expect(res.agreementId).toBeUndefined();
      expect(d.serviceRepo.createAgreement).not.toHaveBeenCalled();
    });
  });

  describe('createCase (UC-49-11)', () => {
    const dto = {
      tenantId: TENANT,
      caseNumber: 'CASE-001',
      subject: 'Error de facturación',
    };

    it('opens the case and seeds its status history', async () => {
      const d = build();
      d.serviceRepo.findCaseByNumber.mockResolvedValue(null);
      d.serviceRepo.createCase.mockReturnValue({ id: 'case-1' });

      const res = await d.service.createCase(dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.CASE_OPEN);
      expect(d.serviceRepo.recordCaseStatusChange).toHaveBeenCalled();
    });

    it('rejects a duplicate case number within the tenant', async () => {
      const d = build();
      d.serviceRepo.findCaseByNumber.mockResolvedValue({ id: 'case-existing' });

      await expect(
        d.service.createCase(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('changeCaseStatus (UC-49-12 y UC-49-13)', () => {
    it('stamps closedAt when the case reaches a closing state', async () => {
      const d = build();
      const serviceCase = {
        id: 'case-1',
        statusConceptId: CONCEPTS.CASE_IN_PROGRESS,
      };
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue(serviceCase);

      const res = await d.service.changeCaseStatus(
        UUID,
        { status: 'RESOLVED' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.CASE_RESOLVED);
      expect(res.closedAt).toEqual(expect.any(String));
    });

    it('records the transition in the case history', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        statusConceptId: CONCEPTS.CASE_OPEN,
      });

      await d.service.changeCaseStatus(UUID, { status: 'IN_PROGRESS' }, actor);

      expect(d.serviceRepo.recordCaseStatusChange).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          fromStatusConceptId: CONCEPTS.CASE_OPEN,
          toStatusConceptId: CONCEPTS.CASE_IN_PROGRESS,
        }),
      );
    });

    it('rejects transitioning to the same status', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        statusConceptId: CONCEPTS.CASE_OPEN,
      });

      await expect(
        d.service.changeCaseStatus(UUID, { status: 'OPEN' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to reopen a closed case through this path', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        statusConceptId: CONCEPTS.CASE_CLOSED,
      });

      await expect(
        d.service.changeCaseStatus(UUID, { status: 'OPEN' }, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('addCaseComment (UC-49-12)', () => {
    it('adds the comment to an open case', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        statusConceptId: CONCEPTS.CASE_OPEN,
      });
      d.serviceRepo.createCaseComment.mockReturnValue({ id: 'comment-1' });

      const res = await d.service.addCaseComment(
        UUID,
        { commentText: 'Revisado' },
        actor,
      );

      expect(res.id).toBe('comment-1');
    });

    it('refuses to comment on a closed case', async () => {
      const d = build();
      d.serviceRepo.findCaseByIdForUpdate.mockResolvedValue({
        id: 'case-1',
        statusConceptId: CONCEPTS.CASE_CLOSED,
      });

      await expect(
        d.service.addCaseComment(UUID, { commentText: 'Tardío' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('setChannelOptIn (UC-49-15)', () => {
    it('revoking consent flags the endpoint as do-not-contact', async () => {
      const d = build();
      d.salesRepo.findContactById.mockResolvedValue({ id: 'contact-1' });
      const endpoint = { id: 'ep-1', contactId: UUID, doNotContact: false };
      d.salesRepo.findChannelEndpointForUpdate.mockResolvedValue(endpoint);

      const res = await d.service.setChannelOptIn(
        UUID,
        UUID,
        { optIn: false },
        actor,
      );

      expect(res.doNotContact).toBe(true);
      expect(endpoint.doNotContact).toBe(true);
    });

    it('granting consent clears the flag', async () => {
      const d = build();
      d.salesRepo.findContactById.mockResolvedValue({ id: 'contact-1' });
      d.salesRepo.findChannelEndpointForUpdate.mockResolvedValue({
        id: 'ep-1',
        contactId: UUID,
        doNotContact: true,
      });

      const res = await d.service.setChannelOptIn(
        UUID,
        UUID,
        { optIn: true },
        actor,
      );

      expect(res.doNotContact).toBe(false);
    });

    it('rejects an endpoint that belongs to another contact', async () => {
      const d = build();
      d.salesRepo.findContactById.mockResolvedValue({ id: 'contact-1' });
      d.salesRepo.findChannelEndpointForUpdate.mockResolvedValue({
        id: 'ep-1',
        contactId: 'another-contact',
      });

      await expect(
        d.service.setChannelOptIn(UUID, UUID, { optIn: true }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('getAccount360 (UC-49-14)', () => {
    it('aggregates activities and cases without opening a write transaction', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue({
        id: 'acc-1',
        name: 'Clínica Sur',
      });
      d.serviceRepo.findActivitiesByAccount.mockResolvedValue([{}, {}]);
      d.serviceRepo.findCasesByAccount.mockResolvedValue([{}]);

      const res = await d.service.getAccount360(UUID);

      expect(res).toEqual({
        accountId: UUID,
        name: 'Clínica Sur',
        activityCount: 2,
        caseCount: 1,
      });
    });

    it('throws when the account does not exist', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue(null);

      await expect(d.service.getAccount360(UUID)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});
