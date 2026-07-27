import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CrmController } from './crm.controller';

const actor = { id: 'user-1', roles: ['CRM_AGENT'] };
const ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const salesService = {
    createAccount: mockFn(),
    addTeamMember: mockFn(),
    createLead: mockFn(),
    qualifyLead: mockFn(),
    convertLead: mockFn(),
    advanceStage: mockFn(),
    winOpportunity: mockFn(),
    loseOpportunity: mockFn(),
  };
  const serviceService = {
    createActivity: mockFn(),
    createPartnership: mockFn(),
    createCase: mockFn(),
    addCaseComment: mockFn(),
    changeCaseStatus: mockFn(),
    setChannelOptIn: mockFn(),
    getAccount360: mockFn(),
  };
  return {
    controller: new CrmController(salesService as any, serviceService as any),
    salesService,
    serviceService,
  };
}

describe('CrmController', () => {
  it('delegates account creation with the actor (UC-49-01)', async () => {
    const d = build();
    const dto = { name: 'Clínica' } as any;
    d.salesService.createAccount.mockResolvedValue({ id: 'acc-1' });

    await d.controller.createAccount(dto, actor);

    expect(d.salesService.createAccount).toHaveBeenCalledWith(dto, actor);
  });

  it('passes the account id when adding a team member (UC-49-02)', async () => {
    const d = build();
    const dto = { userId: 'u2', teamRole: 'MEMBER' } as any;
    d.salesService.addTeamMember.mockResolvedValue({ id: 'm1' });

    await d.controller.addTeamMember(ID, dto, actor);

    expect(d.salesService.addTeamMember).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates lead qualification (UC-49-03)', async () => {
    const d = build();
    const dto = { leadScore: 80, qualified: true } as any;
    d.salesService.qualifyLead.mockResolvedValue({ id: 'lead-1' });

    await d.controller.qualifyLead(ID, dto, actor);

    expect(d.salesService.qualifyLead).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates lead conversion (UC-49-04)', async () => {
    const d = build();
    const dto = { pipelineId: ID, stageId: ID, opportunityName: 'X' } as any;
    d.salesService.convertLead.mockResolvedValue({ opportunityId: 'opp-1' });

    await d.controller.convertLead(ID, dto, actor);

    expect(d.salesService.convertLead).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates activity creation (UC-49-05)', async () => {
    const d = build();
    const dto = { activityType: 'TASK' } as any;
    d.serviceService.createActivity.mockResolvedValue({ id: 'act-1' });

    await d.controller.createActivity(dto, actor);

    expect(d.serviceService.createActivity).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates stage advance, win and lose (UC-49-07/08/09)', async () => {
    const d = build();
    d.salesService.advanceStage.mockResolvedValue({});
    d.salesService.winOpportunity.mockResolvedValue({});
    d.salesService.loseOpportunity.mockResolvedValue({});

    await d.controller.advanceStage(ID, { toStageId: ID }, actor);
    await d.controller.winOpportunity(ID, actor);
    await d.controller.loseOpportunity(ID, { reason: 'PRICE' } as any, actor);

    expect(d.salesService.advanceStage).toHaveBeenCalled();
    expect(d.salesService.winOpportunity).toHaveBeenCalledWith(ID, actor);
    expect(d.salesService.loseOpportunity).toHaveBeenCalledWith(
      ID,
      { reason: 'PRICE' },
      actor,
    );
  });

  it('resolves a case by delegating a RESOLVED transition (UC-49-13)', async () => {
    const d = build();
    d.serviceService.changeCaseStatus.mockResolvedValue({ caseId: ID });

    await d.controller.resolveCase(ID, actor);

    expect(d.serviceService.changeCaseStatus).toHaveBeenCalledWith(
      ID,
      { status: 'RESOLVED' },
      actor,
    );
  });

  it('passes both contact and endpoint ids for consent (UC-49-15)', async () => {
    const d = build();
    const dto = { optIn: false } as any;
    d.serviceService.setChannelOptIn.mockResolvedValue({ doNotContact: true });

    await d.controller.setChannelOptIn(ID, ID, dto, actor);

    expect(d.serviceService.setChannelOptIn).toHaveBeenCalledWith(
      ID,
      ID,
      dto,
      actor,
    );
  });

  it('delegates the 360 view without an actor (read-only) (UC-49-14)', async () => {
    const d = build();
    d.serviceService.getAccount360.mockResolvedValue({ accountId: ID });

    await d.controller.getAccount360(ID);

    expect(d.serviceService.getAccount360).toHaveBeenCalledWith(ID);
  });

  it('propagates service errors', async () => {
    const d = build();
    d.serviceService.createCase.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.createCase({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
