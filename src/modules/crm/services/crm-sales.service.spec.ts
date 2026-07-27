import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CrmSalesService } from './crm-sales.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['CRM_AGENT'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const UUID = '22222222-2222-2222-2222-222222222222';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const salesRepo = {
    createAccount: mockFn(),
    findAccountById: mockFn(),
    createTeamMember: mockFn(),
    findTeamMember: mockFn(),
    createContact: mockFn(),
    createLead: mockFn(),
    findLeadByIdForUpdate: mockFn(),
    createOpportunity: mockFn(),
    findOpportunityByIdForUpdate: mockFn(),
    findStageById: mockFn(),
    recordStageChange: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CrmSalesService(
    em as any,
    salesRepo as any,
    logger as any,
  );
  return { service, tx, salesRepo };
}

describe('CrmSalesService', () => {
  describe('createAccount (UC-49-01)', () => {
    it('creates the account and registers the creator as owner', async () => {
      const d = build();
      d.salesRepo.createAccount.mockReturnValue({ id: 'acc-1' });

      const res = await d.service.createAccount(
        { tenantId: TENANT, name: 'Clínica Sur', accountType: 'CUSTOMER' },
        actor,
      );

      expect(res.id).toBe('acc-1');
      expect(res.primaryContactId).toBeUndefined();
      expect(d.salesRepo.createTeamMember).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_OWNER,
        }),
      );
    });

    it('creates the primary contact in the same transaction when provided', async () => {
      const d = build();
      d.salesRepo.createAccount.mockReturnValue({ id: 'acc-1' });
      d.salesRepo.createContact.mockReturnValue({ id: 'contact-1' });

      const res = await d.service.createAccount(
        {
          tenantId: TENANT,
          name: 'Clínica Sur',
          accountType: 'CUSTOMER',
          primaryContactFirstName: 'Ana',
        },
        actor,
      );

      expect(res.primaryContactId).toBe('contact-1');
    });
  });

  describe('addTeamMember (UC-49-02)', () => {
    it('adds the member with the requested role', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue({ id: 'acc-1' });
      d.salesRepo.findTeamMember.mockResolvedValue(null);
      d.salesRepo.createTeamMember.mockReturnValue({ id: 'member-1' });

      const res = await d.service.addTeamMember(
        UUID,
        { userId: 'user-2', teamRole: 'MEMBER' },
        actor,
      );

      expect(res.teamRole).toBe('MEMBER');
    });

    it('rejects adding the same user twice', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue({ id: 'acc-1' });
      d.salesRepo.findTeamMember.mockResolvedValue({ id: 'member-existing' });

      await expect(
        d.service.addTeamMember(
          UUID,
          { userId: 'user-2', teamRole: 'MEMBER' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when the account does not exist', async () => {
      const d = build();
      d.salesRepo.findAccountById.mockResolvedValue(null);

      await expect(
        d.service.addTeamMember(
          UUID,
          { userId: 'user-2', teamRole: 'MEMBER' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('qualifyLead (UC-49-03)', () => {
    it('marks the lead as qualified and stores the score as a decimal string', async () => {
      const d = build();
      const lead: any = {
        id: 'lead-1',
        leadStatusConceptId: CONCEPTS.LEAD_NEW,
      };
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(lead);

      const res = await d.service.qualifyLead(
        UUID,
        { leadScore: 80, qualified: true },
        actor,
      );

      expect(res.leadStatusConceptId).toBe(CONCEPTS.LEAD_QUALIFIED);
      expect(lead.leadScore).toBe('80');
    });

    it('disqualifies the lead when the score is not enough', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue({
        id: 'lead-1',
        leadStatusConceptId: CONCEPTS.LEAD_NEW,
      });

      const res = await d.service.qualifyLead(
        UUID,
        { leadScore: 10, qualified: false },
        actor,
      );

      expect(res.leadStatusConceptId).toBe(CONCEPTS.LEAD_DISQUALIFIED);
    });

    it('rejects re-qualifying an already converted lead', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue({
        id: 'lead-1',
        leadStatusConceptId: CONCEPTS.LEAD_CONVERTED,
      });

      await expect(
        d.service.qualifyLead(
          UUID,
          { leadScore: 90, qualified: true },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('convertLead (UC-49-04)', () => {
    const dto = {
      pipelineId: UUID,
      stageId: UUID,
      opportunityName: 'Contrato anual',
    };

    it('creates the opportunity and links it back to the lead', async () => {
      const d = build();
      const lead: any = {
        id: 'lead-1',
        tenantId: TENANT,
        leadStatusConceptId: CONCEPTS.LEAD_QUALIFIED,
        ownerUserId: 'user-1',
      };
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue(lead);
      d.salesRepo.createOpportunity.mockReturnValue({ id: 'opp-1' });

      const res = await d.service.convertLead(UUID, dto, actor);

      expect(res.opportunityId).toBe('opp-1');
      expect(lead.leadStatusConceptId).toBe(CONCEPTS.LEAD_CONVERTED);
      expect(lead.convertedOpportunityId).toBe('opp-1');
      expect(d.salesRepo.recordStageChange).toHaveBeenCalled();
    });

    it('refuses to convert a lead that was never qualified', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue({
        id: 'lead-1',
        leadStatusConceptId: CONCEPTS.LEAD_NEW,
      });

      await expect(
        d.service.convertLead(UUID, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to convert the same lead twice', async () => {
      const d = build();
      d.salesRepo.findLeadByIdForUpdate.mockResolvedValue({
        id: 'lead-1',
        leadStatusConceptId: CONCEPTS.LEAD_CONVERTED,
      });

      await expect(
        d.service.convertLead(UUID, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('advanceStage (UC-49-07)', () => {
    it('moves the stage and records the change with the stage probability', async () => {
      const d = build();
      const opportunity: any = {
        id: 'opp-1',
        stageId: 'stage-1',
        amount: '15000.00',
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
      };
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue(opportunity);
      d.salesRepo.findStageById.mockResolvedValue({
        id: 'stage-2',
        probabilityPercent: '60',
      });

      const res = await d.service.advanceStage(
        UUID,
        { toStageId: 'stage-2' },
        actor,
      );

      expect(res.stageId).toBe('stage-2');
      expect(opportunity.probabilityPercent).toBe('60');
      expect(d.salesRepo.recordStageChange).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          fromStageId: 'stage-1',
          toStageId: 'stage-2',
        }),
      );
    });

    it('rejects advancing a closed opportunity', async () => {
      const d = build();
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue({
        id: 'opp-1',
        statusConceptId: CONCEPTS.OPPORTUNITY_WON,
      });

      await expect(
        d.service.advanceStage(UUID, { toStageId: 'stage-2' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects moving to the stage it is already in', async () => {
      const d = build();
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue({
        id: 'opp-1',
        stageId: 'stage-2',
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
      });

      await expect(
        d.service.advanceStage(UUID, { toStageId: 'stage-2' }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('win / lose opportunity (UC-49-08 y UC-49-09)', () => {
    it('marks the opportunity as won and stamps wonAt', async () => {
      const d = build();
      const opportunity: any = {
        id: 'opp-1',
        stageId: 'stage-3',
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
      };
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue(opportunity);

      const res = await d.service.winOpportunity(UUID, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.OPPORTUNITY_WON);
      expect(opportunity.wonAt).toBeInstanceOf(Date);
    });

    it('marks the opportunity as lost with its reason', async () => {
      const d = build();
      const opportunity: any = {
        id: 'opp-1',
        stageId: 'stage-3',
        statusConceptId: CONCEPTS.OPPORTUNITY_OPEN,
      };
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue(opportunity);

      const res = await d.service.loseOpportunity(
        UUID,
        { reason: 'PRICE' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.OPPORTUNITY_LOST);
      expect(opportunity.lostReasonConceptId).toBe(CONCEPTS.LOST_REASON_PRICE);
    });

    it('rejects closing an opportunity that is already closed', async () => {
      const d = build();
      d.salesRepo.findOpportunityByIdForUpdate.mockResolvedValue({
        id: 'opp-1',
        statusConceptId: CONCEPTS.OPPORTUNITY_LOST,
      });

      await expect(
        d.service.winOpportunity(UUID, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
