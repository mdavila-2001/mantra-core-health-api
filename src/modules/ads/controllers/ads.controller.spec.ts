import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AdsController } from './ads.controller';

const actor = { id: 'user-1', roles: ['ADS_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';
const FEED = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const accountsService = {
    provisionAdAccount: mockFn(),
    linkPartner: mockFn(),
    connectPlatform: mockFn(),
  };
  const campaignsService = {
    launchCampaign: mockFn(),
    createTargeting: mockFn(),
    assignIdentity: mockFn(),
    createBudgetSchedule: mockFn(),
  };
  const dataService = {
    createEventPolicy: mockFn(),
    ingestInsights: mockFn(),
    sendConversion: mockFn(),
    uploadOfflineConversions: mockFn(),
    runFeed: mockFn(),
  };
  const optimizationService = {
    createExperiment: mockFn(),
    evaluateRule: mockFn(),
    recordReviewEvent: mockFn(),
    submitAppeal: mockFn(),
    issueInvoice: mockFn(),
    submitLead: mockFn(),
  };
  return {
    controller: new AdsController(
      accountsService as any,
      campaignsService as any,
      dataService as any,
      optimizationService as any,
    ),
    accountsService,
    campaignsService,
    dataService,
    optimizationService,
  };
}

describe('AdsController', () => {
  it('delegates account provisioning with the route business manager (UC-43-01)', async () => {
    const d = build();
    const dto = { externalAccountRef: 'act_1' } as any;
    d.accountsService.provisionAdAccount.mockResolvedValue({ id: ID });

    await d.controller.provisionAdAccount(ID, dto, actor);

    expect(d.accountsService.provisionAdAccount).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates partner linking (UC-43-02)', async () => {
    const d = build();
    const dto = { partnerName: 'Agencia' } as any;
    d.accountsService.linkPartner.mockResolvedValue({ partnerId: ID });

    await d.controller.linkPartner(ID, dto, actor);

    expect(d.accountsService.linkPartner).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates the platform connection (UC-43-03)', async () => {
    const d = build();
    const dto = { platform: 'META' } as any;
    d.accountsService.connectPlatform.mockResolvedValue({ id: ID });

    await d.controller.connectPlatform(dto, actor);

    expect(d.accountsService.connectPlatform).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the campaign launch (UC-43-04)', async () => {
    const d = build();
    const dto = { name: 'Campaña' } as any;
    d.campaignsService.launchCampaign.mockResolvedValue({ campaignId: ID });

    await d.controller.launchCampaign(ID, dto, actor);

    expect(d.campaignsService.launchCampaign).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates targeting and identity assignment (UC-43-05)', async () => {
    const d = build();
    const targetingDto = { ageMin: 25 } as any;
    const identityDto = { adIdentityAssetId: ID } as any;
    d.campaignsService.createTargeting.mockResolvedValue({
      targetingSpecId: ID,
    });
    d.campaignsService.assignIdentity.mockResolvedValue({ assignmentId: ID });

    await d.controller.createTargeting(ID, targetingDto, actor);
    await d.controller.assignIdentity(ID, identityDto, actor);

    expect(d.campaignsService.createTargeting).toHaveBeenCalledWith(
      ID,
      targetingDto,
      actor,
    );
    expect(d.campaignsService.assignIdentity).toHaveBeenCalledWith(
      ID,
      identityDto,
      actor,
    );
  });

  it('delegates the event data policy (UC-43-06)', async () => {
    const d = build();
    const dto = { code: 'POL' } as any;
    d.dataService.createEventPolicy.mockResolvedValue({ id: ID });

    await d.controller.createEventPolicy(dto, actor);

    expect(d.dataService.createEventPolicy).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates insight ingestion (UC-43-07)', async () => {
    const d = build();
    const dto = { rows: [] } as any;
    d.dataService.ingestInsights.mockResolvedValue({ factRows: 0 });

    await d.controller.ingestInsights(dto, actor);

    expect(d.dataService.ingestInsights).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the server-side conversion with the route dataset (UC-43-08)', async () => {
    const d = build();
    const dto = { eventName: 'Purchase' } as any;
    d.dataService.sendConversion.mockResolvedValue({ duplicate: false });

    await d.controller.sendConversion(ID, dto, actor);

    expect(d.dataService.sendConversion).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates the offline conversion upload (UC-43-09)', async () => {
    const d = build();
    const dto = { events: [] } as any;
    d.dataService.uploadOfflineConversions.mockResolvedValue({
      totalEvents: 0,
    });

    await d.controller.uploadOfflineConversions(dto, actor);

    expect(d.dataService.uploadOfflineConversions).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates experiment creation and rule evaluation (UC-43-10, UC-43-11)', async () => {
    const d = build();
    const experimentDto = { name: 'Exp' } as any;
    const ruleDto = { matchedEntityIds: [] } as any;
    d.optimizationService.createExperiment.mockResolvedValue({ id: ID });
    d.optimizationService.evaluateRule.mockResolvedValue({
      ruleExecutionId: ID,
    });

    await d.controller.createExperiment(ID, experimentDto, actor);
    await d.controller.evaluateRule(ID, ruleDto, actor);

    expect(d.optimizationService.createExperiment).toHaveBeenCalledWith(
      ID,
      experimentDto,
      actor,
    );
    expect(d.optimizationService.evaluateRule).toHaveBeenCalledWith(
      ID,
      ruleDto,
      actor,
    );
  });

  it('delegates review events and appeals (UC-43-12)', async () => {
    const d = build();
    const reviewDto = { reviewStatus: 'APPROVED' } as any;
    const appealDto = { appealReason: 'motivo' } as any;
    d.optimizationService.recordReviewEvent.mockResolvedValue({
      reviewEventId: ID,
    });
    d.optimizationService.submitAppeal.mockResolvedValue({ id: ID });

    await d.controller.recordReviewEvent(ID, reviewDto, actor);
    await d.controller.submitAppeal(ID, appealDto, actor);

    expect(d.optimizationService.recordReviewEvent).toHaveBeenCalledWith(
      ID,
      reviewDto,
      actor,
    );
    expect(d.optimizationService.submitAppeal).toHaveBeenCalledWith(
      ID,
      appealDto,
      actor,
    );
  });

  it('delegates the feed run with both route ids (UC-43-13)', async () => {
    const d = build();
    const dto = { items: [] } as any;
    d.dataService.runFeed.mockResolvedValue({ itemsRead: 0 });

    await d.controller.runFeed(ID, FEED, dto, actor);

    expect(d.dataService.runFeed).toHaveBeenCalledWith(ID, FEED, dto, actor);
  });

  it('delegates invoice issuance (UC-43-14)', async () => {
    const d = build();
    const dto = { invoiceNumber: 'ADS-1' } as any;
    d.optimizationService.issueInvoice.mockResolvedValue({ id: ID });

    await d.controller.issueInvoice(ID, dto, actor);

    expect(d.optimizationService.issueInvoice).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the lead submission (UC-43-15)', async () => {
    const d = build();
    const dto = { externalLeadId: 'lead-1' } as any;
    d.optimizationService.submitLead.mockResolvedValue({ id: ID });

    await d.controller.submitLead(ID, dto, actor);

    expect(d.optimizationService.submitLead).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the budget schedule (UC-43-16)', async () => {
    const d = build();
    const dto = { amount: '100.00' } as any;
    d.campaignsService.createBudgetSchedule.mockResolvedValue({ id: ID });

    await d.controller.createBudgetSchedule(ID, dto, actor);

    expect(d.campaignsService.createBudgetSchedule).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.dataService.ingestInsights.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.ingestInsights({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
