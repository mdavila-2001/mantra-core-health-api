import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ReferralsController } from './referrals.controller';

const actor = { id: 'md-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const referralsService = {
    create: mockFn(),
    respond: mockFn(),
    listMine: mockFn(),
    listByPatient: mockFn(),
    get: mockFn(),
    counterReferral: mockFn(),
    cancel: mockFn(),
  };
  const controller = new ReferralsController(referralsService as any);
  return { controller, referralsService };
}

describe('ReferralsController', () => {
  it('delegates create (UC-18-07)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1' };
    await d.controller.create(dto, actor);
    expect(d.referralsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates respond (UC-18-08)', async () => {
    const d = build();
    const dto = { decision: 'ACCEPT' };
    await d.controller.respond('ref1', dto as any, actor);
    expect(d.referralsService.respond).toHaveBeenCalledWith('ref1', dto, actor);
  });

  it('delegates listByPatient with the actor (authz en el servicio)', async () => {
    const d = build();
    await d.controller.listByPatient('p1', actor);
    expect(d.referralsService.listByPatient).toHaveBeenCalledWith('p1', actor);
  });

  it('delegates get, counter-referral and cancel (v4263)', async () => {
    const d = build();
    await d.controller.get('ref1', actor);
    expect(d.referralsService.get).toHaveBeenCalledWith('ref1', actor);
    const dto = { counterReferralText: 'Alta de fisioterapia' };
    await d.controller.counterReferral('ref1', dto, actor);
    expect(d.referralsService.counterReferral).toHaveBeenCalledWith(
      'ref1',
      dto,
      actor,
    );
    await d.controller.cancel('ref1', actor);
    expect(d.referralsService.cancel).toHaveBeenCalledWith('ref1', actor);
  });

  it('delegates listMine (CV-10) to the authenticated actor', async () => {
    const d = build();
    await d.controller.listMine(actor);
    expect(d.referralsService.listMine).toHaveBeenCalledWith(actor);
  });
});
