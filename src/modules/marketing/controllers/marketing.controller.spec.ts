import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MarketingController } from './marketing.controller';
import { TrackedLinkRedirectController } from './tracked-link-redirect.controller';

const actor = { id: 'user-1', roles: ['MARKETING_MANAGER'] };
const ID = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const campaignsService = {
    createSegment: mockFn(),
    refreshSegment: mockFn(),
    createCampaign: mockFn(),
    materializeMembers: mockFn(),
    publishTemplateVersion: mockFn(),
  };
  const journeysService = {
    createJourney: mockFn(),
    addSteps: mockFn(),
    activateJourney: mockFn(),
    advanceEnrollment: mockFn(),
    exitEnrollment: mockFn(),
    createTrackedLink: mockFn(),
    registerClick: mockFn(),
    recordTouchpoint: mockFn(),
    computeAttribution: mockFn(),
  };
  return {
    controller: new MarketingController(
      campaignsService as any,
      journeysService as any,
    ),
    redirect: new TrackedLinkRedirectController(journeysService as any),
    campaignsService,
    journeysService,
  };
}

describe('MarketingController', () => {
  it('delegates segment creation (UC-50-01)', async () => {
    const d = build();
    const dto = { code: 'SEG-VIP' } as any;
    d.campaignsService.createSegment.mockResolvedValue({ id: 'seg-1' });

    await d.controller.createSegment(dto, actor);

    expect(d.campaignsService.createSegment).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the segment refresh with the route id (UC-50-02)', async () => {
    const d = build();
    const dto = { members: [] } as any;
    d.campaignsService.refreshSegment.mockResolvedValue({ segmentId: ID });

    await d.controller.refreshSegment(ID, dto, actor);

    expect(d.campaignsService.refreshSegment).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates campaign creation (UC-50-03)', async () => {
    const d = build();
    const dto = { code: 'CMP-01' } as any;
    d.campaignsService.createCampaign.mockResolvedValue({ id: 'cmp-1' });

    await d.controller.createCampaign(dto, actor);

    expect(d.campaignsService.createCampaign).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates audience materialization (UC-50-04)', async () => {
    const d = build();
    const dto = {} as any;
    d.campaignsService.materializeMembers.mockResolvedValue({ campaignId: ID });

    await d.controller.materializeMembers(ID, dto, actor);

    expect(d.campaignsService.materializeMembers).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates template publication using the route code (UC-50-05)', async () => {
    const d = build();
    const dto = { name: 'Recordatorio' } as any;
    d.campaignsService.publishTemplateVersion.mockResolvedValue({ version: 1 });

    await d.controller.publishTemplateVersion('TPL-REM', dto, actor);

    expect(d.campaignsService.publishTemplateVersion).toHaveBeenCalledWith(
      'TPL-REM',
      dto,
      actor,
    );
  });

  it('delegates journey creation and step addition (UC-50-06)', async () => {
    const d = build();
    const journeyDto = { code: 'JRN-01' } as any;
    const stepsDto = { steps: [] } as any;
    d.journeysService.createJourney.mockResolvedValue({ id: 'jrn-1' });
    d.journeysService.addSteps.mockResolvedValue({ journeyId: ID });

    await d.controller.createJourney(journeyDto, actor);
    await d.controller.addSteps(ID, stepsDto, actor);

    expect(d.journeysService.createJourney).toHaveBeenCalledWith(
      journeyDto,
      actor,
    );
    expect(d.journeysService.addSteps).toHaveBeenCalledWith(
      ID,
      stepsDto,
      actor,
    );
  });

  it('delegates journey activation (UC-50-07)', async () => {
    const d = build();
    const dto = { cohort: [] } as any;
    d.journeysService.activateJourney.mockResolvedValue({ journeyId: ID });

    await d.controller.activateJourney(ID, dto, actor);

    expect(d.journeysService.activateJourney).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates enrollment advance and exit (UC-50-08, UC-50-09)', async () => {
    const d = build();
    const advanceDto = {} as any;
    const exitDto = { reason: 'GOAL' } as any;
    d.journeysService.advanceEnrollment.mockResolvedValue({ enrollmentId: ID });
    d.journeysService.exitEnrollment.mockResolvedValue({ enrollmentId: ID });

    await d.controller.advanceEnrollment(ID, advanceDto, actor);
    await d.controller.exitEnrollment(ID, exitDto, actor);

    expect(d.journeysService.advanceEnrollment).toHaveBeenCalledWith(
      ID,
      advanceDto,
      actor,
    );
    expect(d.journeysService.exitEnrollment).toHaveBeenCalledWith(
      ID,
      exitDto,
      actor,
    );
  });

  it('delegates tracked link creation (UC-50-10)', async () => {
    const d = build();
    const dto = { code: 'ABC123' } as any;
    d.journeysService.createTrackedLink.mockResolvedValue({ id: 'lnk-1' });

    await d.controller.createTrackedLink(dto, actor);

    expect(d.journeysService.createTrackedLink).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates touchpoint recording (UC-50-11)', async () => {
    const d = build();
    const dto = { touchType: 'CLICK' } as any;
    d.journeysService.recordTouchpoint.mockResolvedValue({ id: 'tp-1' });

    await d.controller.recordTouchpoint(dto, actor);

    expect(d.journeysService.recordTouchpoint).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates attribution computation (UC-50-12)', async () => {
    const d = build();
    const dto = { model: 'LINEAR' } as any;
    d.journeysService.computeAttribution.mockResolvedValue({ touches: [] });

    await d.controller.computeAttribution(dto, actor);

    expect(d.journeysService.computeAttribution).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.campaignsService.createSegment.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.createSegment({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});

describe('TrackedLinkRedirectController', () => {
  it('resolves the link with the optional member identity (UC-50-10)', async () => {
    const d = build();
    d.journeysService.registerClick.mockResolvedValue({
      targetUrl: 'https://x',
    });

    await d.redirect.resolve('ABC123', 'CONTACT', ID);

    expect(d.journeysService.registerClick).toHaveBeenCalledWith(
      'ABC123',
      'CONTACT',
      ID,
    );
  });

  it('resolves an anonymous click without member identity', async () => {
    const d = build();
    d.journeysService.registerClick.mockResolvedValue({
      targetUrl: 'https://x',
    });

    await d.redirect.resolve('ABC123');

    expect(d.journeysService.registerClick).toHaveBeenCalledWith(
      'ABC123',
      undefined,
      undefined,
    );
  });
});
