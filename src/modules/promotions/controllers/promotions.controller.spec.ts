import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LoyaltyController } from './loyalty.controller';
import { PromotionsController } from './promotions.controller';
import { PreconditionFailedException, runWithTenant } from '../../../common';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';

const actor = { id: 'user-1', roles: ['PROMOTIONS_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const loyaltyService = {
    createProgram: mockFn(),
    enrollMember: mockFn(),
    earnPoints: mockFn(),
    redeemPoints: mockFn(),
    recomputeBalance: mockFn(),
    expirePoints: mockFn(),
    listActivePrograms: mockFn(),
    myLoyalty: mockFn(),
    myPointsLedger: mockFn(),
    redeemOwnPoints: mockFn(),
    createReferral: mockFn(),
    qualifyReferral: mockFn(),
  };
  const discountsService = {
    createPromotion: mockFn(),
    issueCoupons: mockFn(),
    validateCoupon: mockFn(),
    redeemCoupon: mockFn(),
    applyDiscount: mockFn(),
    reverseRedemption: mockFn(),
  };
  return {
    loyalty: new LoyaltyController(loyaltyService as any),
    promotions: new PromotionsController(discountsService as any),
    loyaltyService,
    discountsService,
  };
}

describe('LoyaltyController', () => {
  it('delegates program creation (UC-51-01)', async () => {
    const d = build();
    const dto = { code: 'LOY-01' } as any;
    d.loyaltyService.createProgram.mockResolvedValue({ id: 'prog-1' });

    await d.loyalty.createProgram(dto, actor);

    expect(d.loyaltyService.createProgram).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates enrollment with the route id (UC-51-02)', async () => {
    const d = build();
    const dto = { memberType: 'USER' } as any;
    d.loyaltyService.enrollMember.mockResolvedValue({ id: ID });

    await d.loyalty.enrollMember(ID, dto, actor);

    expect(d.loyaltyService.enrollMember).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates earn and redeem (UC-51-03, UC-51-04)', async () => {
    const d = build();
    const earnDto = { earningRuleId: ID, idempotencyKey: 'k' } as any;
    const redeemDto = { points: '10', idempotencyKey: 'k2' } as any;
    d.loyaltyService.earnPoints.mockResolvedValue({ ledgerEntryId: 'led-1' });
    d.loyaltyService.redeemPoints.mockResolvedValue({ ledgerEntryId: 'led-2' });

    await d.loyalty.earnPoints(ID, earnDto, actor);
    await d.loyalty.redeemPoints(ID, redeemDto, actor);

    expect(d.loyaltyService.earnPoints).toHaveBeenCalledWith(
      ID,
      earnDto,
      actor,
    );
    expect(d.loyaltyService.redeemPoints).toHaveBeenCalledWith(
      ID,
      redeemDto,
      actor,
    );
  });

  it('delegates the balance recompute (UC-51-05)', async () => {
    const d = build();
    d.loyaltyService.recomputeBalance.mockResolvedValue({ membershipId: ID });

    await d.loyalty.recomputeBalance(ID, actor);

    expect(d.loyaltyService.recomputeBalance).toHaveBeenCalledWith(ID, actor);
  });

  it('delegates the expiry sweep (UC-51-06)', async () => {
    const d = build();
    const dto = { loyaltyProgramId: ID } as any;
    d.loyaltyService.expirePoints.mockResolvedValue({ scanned: 0 });

    await d.loyalty.expirePoints(dto, actor);

    expect(d.loyaltyService.expirePoints).toHaveBeenCalledWith(dto, actor);
  });

  it('scopes the active-program discovery query to the caller tenant (UC-51-06)', async () => {
    const d = build();
    d.loyaltyService.listActivePrograms.mockResolvedValue({
      programs: [{ id: ID, code: 'LOY-01', name: 'Loyalty' }],
    });

    const res = await runWithTenant('tenant-1', () =>
      d.loyalty.listActivePrograms({ limit: 20 }, actor),
    );

    expect(d.loyaltyService.listActivePrograms).toHaveBeenCalledWith(
      20,
      'tenant-1',
    );
    expect(res.programs).toHaveLength(1);
  });

  it('rejects the active-program discovery query when a tenant-scoped caller has no tenant context', () => {
    const d = build();

    expect(() => d.loyalty.listActivePrograms({ limit: 20 }, actor)).toThrow(
      'Se requiere X-Tenant-Id',
    );
    expect(d.loyaltyService.listActivePrograms).not.toHaveBeenCalled();
  });

  it('lets the SYSTEM worker sweep active programs across all tenants', async () => {
    const d = build();
    d.loyaltyService.listActivePrograms.mockResolvedValue({ programs: [] });
    const systemActor = { id: 'worker-1', roles: ['SYSTEM'] };

    await d.loyalty.listActivePrograms({ limit: 20 }, systemActor);

    expect(d.loyaltyService.listActivePrograms).toHaveBeenCalledWith(20);
  });

  it('delegates referral creation and qualification (UC-51-12, UC-51-13)', async () => {
    const d = build();
    const createDto = {} as any;
    const qualifyDto = { refereeUserId: ID } as any;
    d.loyaltyService.createReferral.mockResolvedValue({ id: ID });
    d.loyaltyService.qualifyReferral.mockResolvedValue({ referralId: ID });

    await d.loyalty.createReferral(ID, createDto, actor);
    await d.loyalty.qualifyReferral(ID, qualifyDto, actor);

    expect(d.loyaltyService.createReferral).toHaveBeenCalledWith(
      ID,
      createDto,
      actor,
    );
    expect(d.loyaltyService.qualifyReferral).toHaveBeenCalledWith(
      ID,
      qualifyDto,
      actor,
    );
  });

  /* ─── Autoservicio del paciente (R-T-E6B1) ───────────────────────────── */

  const patient = {
    id: 'user-9',
    roles: ['PATIENT'],
    patientProfileId: '88888888-8888-8888-8888-888888888888',
  } as any;

  it('mi membresía: delega con el actor y el tenant del contexto', async () => {
    const d = build();
    d.loyaltyService.myLoyalty.mockResolvedValue({ enrolled: false });

    const res = await runWithTenant('tenant-1', () =>
      d.loyalty.myLoyalty(patient),
    );

    expect(res).toEqual({ enrolled: false });
    expect(d.loyaltyService.myLoyalty).toHaveBeenCalledWith(
      patient,
      'tenant-1',
    );
  });

  it('mi membresía: sin X-Tenant-Id no se adivina el programa', () => {
    const d = build();

    expect(() => d.loyalty.myLoyalty(patient)).toThrow(
      PreconditionFailedException,
    );
    expect(d.loyaltyService.myLoyalty).not.toHaveBeenCalled();
  });

  it('mis movimientos: pasa la query de paginación tal cual', async () => {
    const d = build();
    d.loyaltyService.myPointsLedger.mockResolvedValue({ entries: [] });
    const query = { limit: 20, cursor: 'c-1' } as any;

    await runWithTenant('tenant-1', () => d.loyalty.myPoints(query, patient));

    expect(d.loyaltyService.myPointsLedger).toHaveBeenCalledWith(
      patient,
      'tenant-1',
      query,
    );
  });

  it('canje propio: el cuerpo no lleva membresía; la deriva el servicio', async () => {
    const d = build();
    d.loyaltyService.redeemOwnPoints.mockResolvedValue({
      ledgerEntryId: 'e-1',
    });
    const dto = { points: '100', idempotencyKey: 'k-1' } as any;

    await runWithTenant('tenant-1', () =>
      d.loyalty.redeemOwnPoints(dto, patient),
    );

    expect(d.loyaltyService.redeemOwnPoints).toHaveBeenCalledWith(
      patient,
      'tenant-1',
      dto,
    );
    expect(Object.keys(dto)).not.toContain('memberRefId');
  });

  it('las rutas del portal exigen PATIENT, y no un MEMBER inexistente', () => {
    const prototipo = LoyaltyController.prototype as unknown as Record<
      string,
      unknown
    >;
    const roles = (metodo: string): string[] =>
      Reflect.getMetadata(ROLES_KEY, prototipo[metodo] as object) ?? [];

    for (const metodo of ['myLoyalty', 'myPoints', 'redeemOwnPoints']) {
      expect(roles(metodo)).toEqual(['PATIENT']);
      expect(roles(metodo)).not.toContain('MEMBER');
    }
  });
});

describe('PromotionsController', () => {
  it('delegates promotion creation (UC-51-07)', async () => {
    const d = build();
    const dto = { code: 'PROMO-01' } as any;
    d.discountsService.createPromotion.mockResolvedValue({ id: ID });

    await d.promotions.createPromotion(dto, actor);

    expect(d.discountsService.createPromotion).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates coupon issuance (UC-51-08)', async () => {
    const d = build();
    const dto = { couponType: 'BATCH', quantity: 5 } as any;
    d.discountsService.issueCoupons.mockResolvedValue({ issued: 5 });

    await d.promotions.issueCoupons(ID, dto, actor);

    expect(d.discountsService.issueCoupons).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates validation without an actor: it mutates nothing (UC-51-09)', async () => {
    const d = build();
    const dto = { code: 'SALUD10' } as any;
    d.discountsService.validateCoupon.mockResolvedValue({ valid: true });

    await d.promotions.validateCoupon(dto);

    expect(d.discountsService.validateCoupon).toHaveBeenCalledWith(dto);
  });

  it('delegates redemption (UC-51-09)', async () => {
    const d = build();
    const dto = { code: 'SALUD10' } as any;
    d.discountsService.redeemCoupon.mockResolvedValue({ id: ID });

    await d.promotions.redeemCoupon(dto, actor);

    expect(d.discountsService.redeemCoupon).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the checkout discount with the order id (UC-51-10)', async () => {
    const d = build();
    const dto = { paymentIntentId: ID } as any;
    d.discountsService.applyDiscount.mockResolvedValue({ redemptionId: ID });

    await d.promotions.applyDiscount(ID, dto, actor);

    expect(d.discountsService.applyDiscount).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the reversal (UC-51-11)', async () => {
    const d = build();
    const dto = { reason: 'REFUND' } as any;
    d.discountsService.reverseRedemption.mockResolvedValue({
      redemptionId: ID,
    });

    await d.promotions.reverseRedemption(ID, dto, actor);

    expect(d.discountsService.reverseRedemption).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.discountsService.createPromotion.mockRejectedValue(new Error('boom'));

    await expect(
      d.promotions.createPromotion({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
