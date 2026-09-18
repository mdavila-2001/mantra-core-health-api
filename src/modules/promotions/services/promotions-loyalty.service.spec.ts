import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PromotionsLoyaltyService } from './promotions-loyalty.service';
import {
  CONCEPTS,
  ConflictException,
  encodeKeysetCursor,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['PROMOTIONS_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const PROGRAM = '22222222-2222-2222-2222-222222222222';
const MEMBERSHIP = '33333333-3333-3333-3333-333333333333';
const MEMBER = '44444444-4444-4444-4444-444444444444';
const RULE = '55555555-5555-5555-5555-555555555555';
const REFERRAL = '66666666-6666-6666-6666-666666666666';
const REFEREE = '77777777-7777-7777-7777-777777777777';
/** El perfil de paciente del titular, tal como viaja en el claim `pid`. */
const PATIENT_PROFILE = '88888888-8888-8888-8888-888888888888';
/** Otro paciente: sirve para demostrar que nadie puede leer lo ajeno. */
const OTHER_PATIENT = '99999999-9999-9999-9999-999999999999';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const loyaltyRepo = {
    createProgram: mockFn(),
    findProgramById: mockFn(),
    findProgramByCode: mockFn(),
    findActivePrograms: mockFn(),
    createTier: mockFn(),
    findTiersByProgram: mockFn(),
    createEarningRule: mockFn(),
    findEarningRuleById: mockFn(),
    createMembership: mockFn(),
    findMembershipByMember: mockFn(),
    findMembershipsByMemberRef: mockFn(),
    findMembershipForUpdate: mockFn(),
    findMembershipsForSweep: mockFn(),
    createLedgerEntry: mockFn(),
    findLedgerEntryByKey: mockFn(),
    findLedgerByMembership: mockFn(),
    findLedgerPageByMembership: mockFn(),
    findEarnEntriesInPeriod: mockFn(),
    findExpirableEntries: mockFn(),
    findReferralProgramById: mockFn(),
    createReferral: mockFn(),
    findReferralByCode: mockFn(),
    findReferralForUpdate: mockFn(),
    findReferralsByReferrer: mockFn(),
  };
  // El crédito de billetera se delega al servicio de pagos (contrato entre
  // dominios): find-or-create + idempotencia + saldo viven allí.
  const walletsService = {
    creditWallet: mockFn().mockResolvedValue({
      walletId: 'w-1',
      entryId: 'wle-1',
      balanceAfter: '10.00',
      duplicate: false,
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PromotionsLoyaltyService(
    em as any,
    loyaltyRepo,
    walletsService as any,
    logger as any,
  );
  return { service, em, tx, loyaltyRepo, walletsService };
}

/** Niveles típicos: bronce desde 0, plata desde 100, oro desde 500. */
function tiers(): any[] {
  return [
    { id: 'tier-bronze', minPoints: '0', ordinal: 1, multiplier: '1' },
    { id: 'tier-silver', minPoints: '100', ordinal: 2, multiplier: '2' },
    { id: 'tier-gold', minPoints: '500', ordinal: 3, multiplier: '3' },
  ];
}

/**
 * Ejecuta la operación membership.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de membership conforme al contrato `any`.
 */
function membership(overrides: Record<string, unknown> = {}): any {
  return {
    id: MEMBERSHIP,
    loyaltyProgramId: PROGRAM,
    memberTypeConceptId: CONCEPTS.REWARD_MEMBER_USER,
    memberRefId: MEMBER,
    currentTierId: 'tier-bronze',
    pointsBalance: '50.00',
    lifetimePoints: '50.00',
    statusConceptId: CONCEPTS.MEMBERSHIP_ACTIVE,
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Un programa activo del tenant, como lo devuelve el repositorio. */
function program(overrides: Record<string, unknown> = {}): any {
  return {
    id: PROGRAM,
    tenantId: TENANT,
    name: 'Puntos del tenant',
    pointsCurrencyName: 'puntos',
    stateConceptId: CONCEPTS.LOYALTY_ACTIVE,
    ...overrides,
  };
}

/**
 * Ejecuta la operación earning rule.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de earning rule conforme al contrato `any`.
 */
function earningRule(overrides: Record<string, unknown> = {}): any {
  return {
    id: RULE,
    loyaltyProgramId: PROGRAM,
    pointsAmount: '10',
    isActive: true,
    ...overrides,
  };
}

describe('PromotionsLoyaltyService', () => {
  describe('createProgram (UC-51-01)', () => {
    const dto = {
      tenantId: TENANT,
      code: 'LOY-01',
      name: 'Club Salud',
      programType: 'TIERED' as const,
      tiers: [
        { code: 'GOLD', name: 'Oro', minPoints: '500' },
        { code: 'BRONZE', name: 'Bronce', minPoints: '0' },
      ],
    };

    it('creates the program in draft and orders the tiers by threshold', async () => {
      const d = build();
      d.loyaltyRepo.findProgramByCode.mockResolvedValue(null);
      d.loyaltyRepo.createProgram.mockReturnValue({ id: 'prog-1' });
      let n = 0;
      d.loyaltyRepo.createTier.mockImplementation(() => ({
        id: `tier-${++n}`,
      }));

      const res = await d.service.createProgram(dto, actor);

      expect(res.stateConceptId).toBe(CONCEPTS.LOYALTY_DRAFT);
      expect(res.tierIds).toHaveLength(2);
      // El ordinal 1 va al umbral menor, no al primero que llegó en el cuerpo.
      expect(d.loyaltyRepo.createTier.mock.calls[0][1]).toMatchObject({
        code: 'BRONZE',
        ordinal: 1,
      });
      expect(d.loyaltyRepo.createTier.mock.calls[1][1]).toMatchObject({
        code: 'GOLD',
        ordinal: 2,
      });
    });

    it('rejects a duplicate code in the tenant', async () => {
      const d = build();
      d.loyaltyRepo.findProgramByCode.mockResolvedValue({
        id: 'prog-existing',
      });

      await expect(
        d.service.createProgram(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('requires expiry days when the policy is ROLLING', async () => {
      const d = build();
      d.loyaltyRepo.findProgramByCode.mockResolvedValue(null);

      await expect(
        d.service.createProgram(
          { ...dto, expiryPolicy: 'ROLLING' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a points rule with no points to give', async () => {
      const d = build();
      d.loyaltyRepo.findProgramByCode.mockResolvedValue(null);

      await expect(
        d.service.createProgram(
          {
            ...dto,
            earningRules: [
              {
                code: 'R1',
                name: 'Reserva',
                eventType: 'BOOKING_COMPLETED' as const,
                awardType: 'POINTS' as const,
              },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('enrollMember (UC-51-02)', () => {
    const dto = { memberType: 'USER' as const, memberRefId: MEMBER };

    it('enrolls the member in the base tier with a zeroed balance', async () => {
      const d = build();
      d.loyaltyRepo.findProgramById.mockResolvedValue({
        id: PROGRAM,
        stateConceptId: CONCEPTS.LOYALTY_ACTIVE,
      });
      d.loyaltyRepo.findMembershipByMember.mockResolvedValue(null);
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(tiers());
      d.loyaltyRepo.createMembership.mockReturnValue({
        id: MEMBERSHIP,
        currentTierId: 'tier-bronze',
        pointsBalance: '0',
        lifetimePoints: '0',
      });

      const res = await d.service.enrollMember(PROGRAM, dto, actor);

      expect(res).toMatchObject({
        id: MEMBERSHIP,
        currentTierId: 'tier-bronze',
        alreadyEnrolled: false,
      });
    });

    it('is idempotent: an existing membership is returned untouched', async () => {
      const d = build();
      d.loyaltyRepo.findProgramById.mockResolvedValue({
        id: PROGRAM,
        stateConceptId: CONCEPTS.LOYALTY_ACTIVE,
      });
      d.loyaltyRepo.findMembershipByMember.mockResolvedValue(membership());

      const res = await d.service.enrollMember(PROGRAM, dto, actor);

      expect(res.alreadyEnrolled).toBe(true);
      expect(d.loyaltyRepo.createMembership).not.toHaveBeenCalled();
      expect(d.loyaltyRepo.createLedgerEntry).not.toHaveBeenCalled();
    });

    it('credits the signup bonus and moves the member to the tier it reaches', async () => {
      const d = build();
      d.loyaltyRepo.findProgramById.mockResolvedValue({
        id: PROGRAM,
        stateConceptId: CONCEPTS.LOYALTY_ACTIVE,
      });
      d.loyaltyRepo.findMembershipByMember.mockResolvedValue(null);
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(tiers());
      const created: any = { id: MEMBERSHIP, currentTierId: 'tier-bronze' };
      d.loyaltyRepo.createMembership.mockReturnValue(created);

      const res = await d.service.enrollMember(
        PROGRAM,
        { ...dto, signupBonusPoints: '150' },
        actor,
      );

      expect(res.pointsBalance).toBe('150');
      expect(created.currentTierId).toBe('tier-silver');
      expect(d.loyaltyRepo.createLedgerEntry).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ reasonConceptId: CONCEPTS.REASON_SIGNUP }),
      );
    });

    it('refuses to enroll into a program that is not active', async () => {
      const d = build();
      d.loyaltyRepo.findProgramById.mockResolvedValue({
        id: PROGRAM,
        stateConceptId: CONCEPTS.LOYALTY_DRAFT,
      });

      await expect(
        d.service.enrollMember(PROGRAM, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the program does not exist', async () => {
      const d = build();
      d.loyaltyRepo.findProgramById.mockResolvedValue(null);

      await expect(
        d.service.enrollMember(PROGRAM, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('earnPoints (UC-51-03)', () => {
    const dto = { earningRuleId: RULE, idempotencyKey: 'evt-1' };

    it('applies the tier multiplier and updates balance and lifetime', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      const member = membership({ currentTierId: 'tier-silver' });
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(member);
      d.loyaltyRepo.findEarningRuleById.mockResolvedValue(earningRule());
      d.loyaltyRepo.findProgramById.mockResolvedValue({ id: PROGRAM });
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(tiers());
      d.loyaltyRepo.createLedgerEntry.mockReturnValue({
        id: 'led-1',
        loyaltyMembershipId: MEMBERSHIP,
        points: '20.00',
        balanceAfter: '70.00',
      });

      const res = await d.service.earnPoints(MEMBERSHIP, dto, actor);

      // Plata multiplica por 2: la regla da 10, se acreditan 20.
      expect(res.points).toBe('20.00');
      expect(member.pointsBalance).toBe('70.00');
      expect(member.lifetimePoints).toBe('70.00');
      expect(res.duplicate).toBe(false);
    });

    it('returns the previous entry when the idempotency key repeats', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue({
        id: 'led-prev',
        loyaltyMembershipId: MEMBERSHIP,
        points: '10.00',
        balanceAfter: '60.00',
      });
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());

      const res = await d.service.earnPoints(MEMBERSHIP, dto, actor);

      expect(res).toMatchObject({ ledgerEntryId: 'led-prev', duplicate: true });
      expect(d.loyaltyRepo.createLedgerEntry).not.toHaveBeenCalled();
    });

    it('promotes the member when the lifetime total crosses the next threshold', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      const member = membership({
        pointsBalance: '95.00',
        lifetimePoints: '95.00',
      });
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(member);
      d.loyaltyRepo.findEarningRuleById.mockResolvedValue(earningRule());
      d.loyaltyRepo.findProgramById.mockResolvedValue({ id: PROGRAM });
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(tiers());
      d.loyaltyRepo.createLedgerEntry.mockReturnValue({
        id: 'led-1',
        loyaltyMembershipId: MEMBERSHIP,
        points: '10.00',
        balanceAfter: '105.00',
      });

      await d.service.earnPoints(MEMBERSHIP, dto, actor);

      expect(member.currentTierId).toBe('tier-silver');
    });

    it('sets an expiry date when the program uses a rolling policy', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());
      d.loyaltyRepo.findEarningRuleById.mockResolvedValue(earningRule());
      d.loyaltyRepo.findProgramById.mockResolvedValue({
        id: PROGRAM,
        expiryPolicyConceptId: CONCEPTS.EXPIRY_ROLLING,
        pointsExpiryDays: 365,
      });
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(tiers());
      d.loyaltyRepo.createLedgerEntry.mockReturnValue({
        id: 'led-1',
        loyaltyMembershipId: MEMBERSHIP,
        points: '10.00',
        balanceAfter: '60.00',
      });

      await d.service.earnPoints(MEMBERSHIP, dto, actor);

      expect(
        d.loyaltyRepo.createLedgerEntry.mock.calls[0][1].expiresAt,
      ).toBeInstanceOf(Date);
    });

    it('rejects a rule that reached its cap in the period', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());
      d.loyaltyRepo.findEarningRuleById.mockResolvedValue(
        earningRule({
          capPerPeriod: 2,
          periodConceptId: CONCEPTS.CAP_PERIOD_DAY,
        }),
      );
      d.loyaltyRepo.findEarnEntriesInPeriod.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
      ]);

      await expect(
        d.service.earnPoints(MEMBERSHIP, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a rule that belongs to a different program', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());
      d.loyaltyRepo.findEarningRuleById.mockResolvedValue(
        earningRule({ loyaltyProgramId: 'other-program' }),
      );

      await expect(
        d.service.earnPoints(MEMBERSHIP, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a rule that is out of its validity window', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());
      d.loyaltyRepo.findEarningRuleById.mockResolvedValue(
        earningRule({ validTo: new Date('2020-01-01T00:00:00Z') }),
      );

      await expect(
        d.service.earnPoints(MEMBERSHIP, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the membership does not exist', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(null);

      await expect(
        d.service.earnPoints(MEMBERSHIP, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('redeemPoints (UC-51-04)', () => {
    const dto = { points: '30', idempotencyKey: 'red-1' };

    it('subtracts from the balance and leaves lifetime points untouched', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      const member = membership();
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(member);
      d.loyaltyRepo.createLedgerEntry.mockReturnValue({
        id: 'led-1',
        loyaltyMembershipId: MEMBERSHIP,
        points: '30',
        balanceAfter: '20.00',
      });

      const res = await d.service.redeemPoints(MEMBERSHIP, dto, actor);

      expect(member.pointsBalance).toBe('20.00');
      expect(member.lifetimePoints).toBe('50.00');
      expect(res.balanceAfter).toBe('20.00');
    });

    it('refuses to redeem more than the balance', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());

      await expect(
        d.service.redeemPoints(
          MEMBERSHIP,
          { ...dto, points: '999' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a non-positive redemption', async () => {
      const d = build();

      await expect(
        d.service.redeemPoints(
          MEMBERSHIP,
          { ...dto, points: '0' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('returns the previous entry when the key repeats', async () => {
      const d = build();
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue({
        id: 'led-prev',
        loyaltyMembershipId: MEMBERSHIP,
        points: '30',
        balanceAfter: '20.00',
      });
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());

      const res = await d.service.redeemPoints(MEMBERSHIP, dto, actor);

      expect(res.duplicate).toBe(true);
      expect(d.loyaltyRepo.createLedgerEntry).not.toHaveBeenCalled();
    });
  });

  describe('recomputeBalance (UC-51-05)', () => {
    it('reprojects balance and lifetime from the ledger', async () => {
      const d = build();
      const member = membership({
        pointsBalance: '999',
        lifetimePoints: '999',
      });
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(member);
      d.loyaltyRepo.findLedgerByMembership.mockResolvedValue([
        { directionConceptId: CONCEPTS.POINTS_EARN, points: '200' },
        { directionConceptId: CONCEPTS.POINTS_REDEEM, points: '50' },
        { directionConceptId: CONCEPTS.POINTS_EXPIRE, points: '20' },
      ]);
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(tiers());

      const res = await d.service.recomputeBalance(MEMBERSHIP, actor);

      expect(res.pointsBalance).toBe('130.00');
      expect(res.lifetimePoints).toBe('200.00');
      expect(res.currentTierId).toBe('tier-silver');
      expect(res.tierChanged).toBe(true);
    });

    it('never reports a negative balance', async () => {
      const d = build();
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());
      d.loyaltyRepo.findLedgerByMembership.mockResolvedValue([
        { directionConceptId: CONCEPTS.POINTS_EARN, points: '10' },
        { directionConceptId: CONCEPTS.POINTS_REDEEM, points: '50' },
      ]);
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(tiers());

      const res = await d.service.recomputeBalance(MEMBERSHIP, actor);

      expect(res.pointsBalance).toBe('0.00');
    });

    it('reports no tier change when the member stays put', async () => {
      const d = build();
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());
      d.loyaltyRepo.findLedgerByMembership.mockResolvedValue([
        { directionConceptId: CONCEPTS.POINTS_EARN, points: '50' },
      ]);
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(tiers());

      const res = await d.service.recomputeBalance(MEMBERSHIP, actor);

      expect(res.tierChanged).toBe(false);
    });
  });

  describe('expirePoints (UC-51-06)', () => {
    const dto = { loyaltyProgramId: PROGRAM };

    it('expires the vested entry and lowers the balance', async () => {
      const d = build();
      const member = membership({ pointsBalance: '50.00' });
      d.loyaltyRepo.findMembershipsForSweep.mockResolvedValue([member]);
      d.loyaltyRepo.findExpirableEntries.mockResolvedValue([
        { id: 'led-old', points: '20' },
      ]);
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);

      const res = await d.service.expirePoints(dto, actor);

      expect(res).toEqual({ scanned: 1, affected: 1, pointsExpired: '20.00' });
      expect(member.pointsBalance).toBe('30.00');
    });

    it('does not expire the same entry twice', async () => {
      const d = build();
      d.loyaltyRepo.findMembershipsForSweep.mockResolvedValue([membership()]);
      d.loyaltyRepo.findExpirableEntries.mockResolvedValue([
        { id: 'led-old', points: '20' },
      ]);
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue({
        id: 'led-expire',
      });

      const res = await d.service.expirePoints(dto, actor);

      expect(res).toMatchObject({ affected: 0, pointsExpired: '0.00' });
      expect(d.loyaltyRepo.createLedgerEntry).not.toHaveBeenCalled();
    });

    it('never expires more than the remaining balance', async () => {
      const d = build();
      const member = membership({ pointsBalance: '10.00' });
      d.loyaltyRepo.findMembershipsForSweep.mockResolvedValue([member]);
      d.loyaltyRepo.findExpirableEntries.mockResolvedValue([
        { id: 'led-old', points: '100' },
      ]);
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);

      const res = await d.service.expirePoints(dto, actor);

      expect(res.pointsExpired).toBe('10.00');
      expect(member.pointsBalance).toBe('0.00');
    });

    it('reports an empty sweep when nothing is due', async () => {
      const d = build();
      d.loyaltyRepo.findMembershipsForSweep.mockResolvedValue([membership()]);
      d.loyaltyRepo.findExpirableEntries.mockResolvedValue([]);

      const res = await d.service.expirePoints(dto, actor);

      expect(res).toEqual({ scanned: 1, affected: 0, pointsExpired: '0.00' });
    });

    it('touches every scanned membership even without expirable points, so the next sweep rotates past it', async () => {
      const d = build();
      const member = membership({ updatedByUserId: undefined });
      d.loyaltyRepo.findMembershipsForSweep.mockResolvedValue([member]);
      d.loyaltyRepo.findExpirableEntries.mockResolvedValue([]);

      await d.service.expirePoints(dto, actor);

      expect(member.updatedByUserId).toBe(actor.id);
    });
  });

  describe('listActivePrograms (UC-51-06, descubrimiento)', () => {
    it('maps active programs to their summary and uses the active-state concept', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([
        { id: PROGRAM, code: 'LOY-01', name: 'Programa 1' },
      ]);

      const res = await d.service.listActivePrograms();

      expect(d.loyaltyRepo.findActivePrograms).toHaveBeenCalledWith(
        d.em,
        CONCEPTS.LOYALTY_ACTIVE,
        100,
        undefined,
      );
      expect(res).toEqual({
        programs: [{ id: PROGRAM, code: 'LOY-01', name: 'Programa 1' }],
      });
    });

    it('forwards a custom limit and returns an empty list when there are none', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([]);

      const res = await d.service.listActivePrograms(10);

      expect(d.loyaltyRepo.findActivePrograms).toHaveBeenCalledWith(
        d.em,
        CONCEPTS.LOYALTY_ACTIVE,
        10,
        undefined,
      );
      expect(res).toEqual({ programs: [] });
    });

    it('scopes the query to the caller tenant when one is provided', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([]);

      await d.service.listActivePrograms(10, 'tenant-1');

      expect(d.loyaltyRepo.findActivePrograms).toHaveBeenCalledWith(
        d.em,
        CONCEPTS.LOYALTY_ACTIVE,
        10,
        'tenant-1',
      );
    });
  });

  describe('createReferral (UC-51-12)', () => {
    /**
     * Ejecuta la operación active program.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de active program conforme al contrato `any`.
     */
    function activeProgram(overrides: Record<string, unknown> = {}): any {
      return {
        id: PROGRAM,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...overrides,
      };
    }

    it('issues a pending referral with a free code', async () => {
      const d = build();
      d.loyaltyRepo.findReferralProgramById.mockResolvedValue(activeProgram());
      d.loyaltyRepo.findReferralByCode.mockResolvedValue(null);
      d.loyaltyRepo.createReferral.mockReturnValue({ id: REFERRAL });

      const res = await d.service.createReferral(PROGRAM, {}, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.REFERRAL_PENDING);
      expect(res.referralCode).toEqual(expect.any(String));
      expect(d.loyaltyRepo.createReferral).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ referrerUserId: actor.id }),
      );
    });

    it('refuses to exceed the per-user referral cap', async () => {
      const d = build();
      d.loyaltyRepo.findReferralProgramById.mockResolvedValue(
        activeProgram({ maxReferralsPerUser: 2 }),
      );
      d.loyaltyRepo.findReferralsByReferrer.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
      ]);

      await expect(
        d.service.createReferral(PROGRAM, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a program that is not active', async () => {
      const d = build();
      d.loyaltyRepo.findReferralProgramById.mockResolvedValue(
        activeProgram({ stateConceptId: CONCEPTS.STATE_EXPIRED }),
      );

      await expect(
        d.service.createReferral(PROGRAM, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('qualifyReferral (UC-51-13)', () => {
    const dto = {
      refereeUserId: REFEREE,
      qualifyingEvent: 'FIRST_BOOKING' as const,
      referrerMembershipId: MEMBERSHIP,
      refereeMembershipId: 'membership-referee',
    };

    /**
     * Ejecuta la operación pending referral.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de pending referral conforme al contrato `any`.
     */
    function pendingReferral(overrides: Record<string, unknown> = {}): any {
      return {
        id: REFERRAL,
        referralProgramId: PROGRAM,
        referrerUserId: actor.id,
        statusConceptId: CONCEPTS.REFERRAL_PENDING,
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación rewarding program.
     * @returns Resultado de rewarding program conforme al contrato `any`.
     */
    function rewardingProgram(): any {
      return {
        id: PROGRAM,
        tenantId: TENANT,
        currencyConceptId: 'currency-usd',
        referrerAwardTypeConceptId: CONCEPTS.AWARD_POINTS,
        referrerAwardAmount: '100',
        refereeAwardTypeConceptId: CONCEPTS.AWARD_POINTS,
        refereeAwardAmount: '50',
        qualifyingEventConceptId: CONCEPTS.QUALIFY_FIRST_BOOKING,
      };
    }

    it('qualifies the referral and credits both parties', async () => {
      const d = build();
      const referral = pendingReferral();
      d.loyaltyRepo.findReferralForUpdate.mockResolvedValue(referral);
      d.loyaltyRepo.findReferralProgramById.mockResolvedValue(
        rewardingProgram(),
      );
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(tiers());
      let n = 0;
      d.loyaltyRepo.createLedgerEntry.mockImplementation(() => ({
        id: `led-${++n}`,
      }));

      const res = await d.service.qualifyReferral(REFERRAL, dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.REFERRAL_QUALIFIED);
      expect(res.referrerLedgerEntryId).toBe('led-1');
      expect(res.refereeLedgerEntryId).toBe('led-2');
      expect(referral.refereeUserId).toBe(REFEREE);
    });

    it('does not reward twice when the event is redelivered', async () => {
      const d = build();
      d.loyaltyRepo.findReferralForUpdate.mockResolvedValue(pendingReferral());
      d.loyaltyRepo.findReferralProgramById.mockResolvedValue(
        rewardingProgram(),
      );
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue({
        id: 'led-existing',
      });

      const res = await d.service.qualifyReferral(REFERRAL, dto, actor);

      expect(res.referrerLedgerEntryId).toBe('led-existing');
      expect(d.loyaltyRepo.createLedgerEntry).not.toHaveBeenCalled();
    });

    it('rejects self-referral', async () => {
      const d = build();
      d.loyaltyRepo.findReferralForUpdate.mockResolvedValue(
        pendingReferral({ referrerUserId: REFEREE }),
      );

      await expect(
        d.service.qualifyReferral(REFERRAL, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an event that is not the qualifying one', async () => {
      const d = build();
      d.loyaltyRepo.findReferralForUpdate.mockResolvedValue(pendingReferral());
      d.loyaltyRepo.findReferralProgramById.mockResolvedValue({
        ...rewardingProgram(),
        qualifyingEventConceptId: CONCEPTS.QUALIFY_FIRST_PAYMENT,
      });

      await expect(
        d.service.qualifyReferral(REFERRAL, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects qualifying a referral twice', async () => {
      const d = build();
      d.loyaltyRepo.findReferralForUpdate.mockResolvedValue(
        pendingReferral({ statusConceptId: CONCEPTS.REFERRAL_QUALIFIED }),
      );

      await expect(
        d.service.qualifyReferral(REFERRAL, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('credits the wallet for a wallet-credit award via the payments WalletsService', async () => {
      const d = build();
      d.loyaltyRepo.findReferralForUpdate.mockResolvedValue(pendingReferral());
      d.loyaltyRepo.findReferralProgramById.mockResolvedValue({
        ...rewardingProgram(),
        referrerAwardTypeConceptId: CONCEPTS.AWARD_WALLET_CREDIT,
        refereeAwardTypeConceptId: CONCEPTS.AWARD_WALLET_CREDIT,
      });
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());
      let n = 0;
      d.walletsService.creditWallet.mockImplementation(() =>
        Promise.resolve({
          walletId: `w-${n}`,
          entryId: `wled-${++n}`,
          balanceAfter: '70.00',
          duplicate: false,
        }),
      );

      const res = await d.service.qualifyReferral(REFERRAL, dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.REFERRAL_QUALIFIED);
      expect(res.referrerLedgerEntryId).toBe('wled-1');
      expect(res.refereeLedgerEntryId).toBe('wled-2');
      // El crédito se delega al servicio de pagos (2 abonos), no se toca el ledger
      // de puntos ni se escriben las tablas de pagos desde promotions.
      expect(d.walletsService.creditWallet).toHaveBeenCalledTimes(2);
      expect(d.loyaltyRepo.createLedgerEntry).not.toHaveBeenCalled();
      const refereeCall = d.walletsService.creditWallet.mock.calls[1][1];
      expect(refereeCall).toMatchObject({
        amount: '50',
        idempotencyKey: `referral:${REFERRAL}:referee`,
        sourceType: 'member_referral',
      });
    });

    it('is idempotent on wallet credit: the payments service dedupes by key', async () => {
      const d = build();
      d.loyaltyRepo.findReferralForUpdate.mockResolvedValue(pendingReferral());
      d.loyaltyRepo.findReferralProgramById.mockResolvedValue({
        ...rewardingProgram(),
        referrerAwardTypeConceptId: CONCEPTS.AWARD_WALLET_CREDIT,
        refereeAwardTypeConceptId: CONCEPTS.AWARD_WALLET_CREDIT,
      });
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(membership());
      d.walletsService.creditWallet.mockResolvedValue({
        walletId: 'w-1',
        entryId: 'wled-existing',
        balanceAfter: '20.00',
        duplicate: true,
      });

      const res = await d.service.qualifyReferral(REFERRAL, dto, actor);

      expect(res.referrerLedgerEntryId).toBe('wled-existing');
      // La idempotencia la resuelve el servicio de pagos (clave UNIQUE del ledger).
      expect(d.walletsService.creditWallet).toHaveBeenCalled();
    });
  });

  /* ─── Autoservicio del paciente (R-T-E6B1) ───────────────────────────── */

  describe('myLoyalty (R-T-E6B1)', () => {
    /** El titular sale del token: `pid` es el perfil de paciente. */
    const patient = {
      id: 'user-9',
      roles: ['PATIENT'],
      patientProfileId: PATIENT_PROFILE,
    } as any;

    it('sin programas activos en el tenant no hay membresía que mostrar', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([]);

      const res = await d.service.myLoyalty(patient, TENANT);

      expect(res).toEqual({ enrolled: false });
      expect(d.loyaltyRepo.findMembershipsByMemberRef).not.toHaveBeenCalled();
    });

    it('sin membresía responde enrolled=false, sin fabricar una', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([program()]);
      d.loyaltyRepo.findMembershipsByMemberRef.mockResolvedValue([]);

      const res = await d.service.myLoyalty(patient, TENANT);

      expect(res).toEqual({ enrolled: false });
    });

    it('devuelve saldo, acumulado y nivel de la membresía propia', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([program()]);
      d.loyaltyRepo.findMembershipsByMemberRef.mockResolvedValue([
        membership({
          memberTypeConceptId: CONCEPTS.REWARD_MEMBER_PATIENT,
          memberRefId: PATIENT_PROFILE,
          currentTierId: 'tier-silver',
          pointsBalance: '440.00',
          lifetimePoints: '720.00',
          enrolledAt: new Date('2026-05-01T10:00:00Z'),
        }),
      ]);
      d.loyaltyRepo.findTiersByProgram.mockResolvedValue(
        tiers().map((tier) => ({ ...tier, code: tier.id, name: tier.id })),
      );

      const res = await d.service.myLoyalty(patient, TENANT);

      expect(res.enrolled).toBe(true);
      expect(res.membership?.pointsBalance).toBe('440.00');
      expect(res.membership?.lifetimePoints).toBe('720.00');
      expect(res.membership?.tier?.multiplier).toBe('2');
      expect(res.membership?.active).toBe(true);
      expect(res.membership?.programName).toBe('Puntos del tenant');
    });

    it('busca la membresía por el paciente del token y como REWARD_MEMBER_PATIENT', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([program()]);
      d.loyaltyRepo.findMembershipsByMemberRef.mockResolvedValue([]);

      await d.service.myLoyalty(patient, TENANT);

      expect(d.loyaltyRepo.findMembershipsByMemberRef).toHaveBeenCalledWith(
        expect.anything(),
        [PROGRAM],
        CONCEPTS.REWARD_MEMBER_PATIENT,
        PATIENT_PROFILE,
      );
    });

    it('una cuenta sin perfil de paciente no llega a consultar nada', async () => {
      const d = build();

      await expect(
        d.service.myLoyalty(
          { id: 'user-9', roles: ['PATIENT'] } as any,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.loyaltyRepo.findActivePrograms).not.toHaveBeenCalled();
    });

    it('OWNERSHIP: con el token de otro paciente consulta ese otro titular, nunca el pedido por nadie más', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([program()]);
      d.loyaltyRepo.findMembershipsByMemberRef.mockResolvedValue([]);

      await d.service.myLoyalty(
        {
          id: 'user-8',
          roles: ['PATIENT'],
          patientProfileId: OTHER_PATIENT,
        } as any,
        TENANT,
      );

      expect(d.loyaltyRepo.findMembershipsByMemberRef).toHaveBeenCalledWith(
        expect.anything(),
        [PROGRAM],
        CONCEPTS.REWARD_MEMBER_PATIENT,
        OTHER_PATIENT,
      );
    });
  });

  describe('myPointsLedger (R-T-E6B1)', () => {
    const patient = {
      id: 'user-9',
      roles: ['PATIENT'],
      patientProfileId: PATIENT_PROFILE,
    } as any;

    /** Prepara una membresía propia encontrable. */
    function conMembresia(d: any): void {
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([program()]);
      d.loyaltyRepo.findMembershipsByMemberRef.mockResolvedValue([
        membership({
          memberTypeConceptId: CONCEPTS.REWARD_MEMBER_PATIENT,
          memberRefId: PATIENT_PROFILE,
        }),
      ]);
    }

    /** Una entrada del ledger con fecha e id controlados. */
    function entry(id: string, iso: string): any {
      return {
        id,
        loyaltyMembershipId: MEMBERSHIP,
        directionConceptId: CONCEPTS.POINTS_EARN,
        reasonConceptId: CONCEPTS.REASON_EVENT,
        points: '70.00',
        balanceAfter: '440.00',
        recordedAt: new Date(iso),
        occurredAt: new Date(iso),
      };
    }

    it('lee sólo el ledger de la membresía propia y nunca sin tope', async () => {
      const d = build();
      conMembresia(d);
      d.loyaltyRepo.findLedgerPageByMembership.mockResolvedValue([
        entry('e-1', '2026-09-14T10:00:00Z'),
      ]);

      const res = await d.service.myPointsLedger(patient, TENANT, {});

      expect(d.loyaltyRepo.findLedgerPageByMembership).toHaveBeenCalledWith(
        expect.anything(),
        MEMBERSHIP,
        21,
        undefined,
      );
      expect(res.entries).toHaveLength(1);
      expect(res.entries[0]?.direction).toBe('POINTS_EARN');
      expect(res.entries[0]?.reason).toBe('REASON_EVENT');
      expect(res.nextCursor).toBeUndefined();
    });

    it('con más filas que el tope devuelve cursor y recorta la página', async () => {
      const d = build();
      conMembresia(d);
      d.loyaltyRepo.findLedgerPageByMembership.mockResolvedValue([
        entry('e-1', '2026-09-14T10:00:00Z'),
        entry('e-2', '2026-09-13T10:00:00Z'),
        entry('e-3', '2026-09-12T10:00:00Z'),
      ]);

      const res = await d.service.myPointsLedger(patient, TENANT, { limit: 2 });

      expect(res.entries.map((e: any) => e.entryId)).toEqual(['e-1', 'e-2']);
      expect(res.nextCursor).toBeDefined();
    });

    it('el cursor devuelto continúa por la última fila entregada: orden estable', async () => {
      const d = build();
      conMembresia(d);
      d.loyaltyRepo.findLedgerPageByMembership.mockResolvedValue([
        entry('e-1', '2026-09-14T10:00:00Z'),
        entry('e-2', '2026-09-13T10:00:00Z'),
      ]);
      const primera = await d.service.myPointsLedger(patient, TENANT, {
        limit: 1,
      });

      d.loyaltyRepo.findLedgerPageByMembership.mockResolvedValue([]);
      await d.service.myPointsLedger(patient, TENANT, {
        limit: 1,
        cursor: primera.nextCursor,
      });

      expect(d.loyaltyRepo.findLedgerPageByMembership).toHaveBeenLastCalledWith(
        expect.anything(),
        MEMBERSHIP,
        2,
        { recordedAt: new Date('2026-09-14T10:00:00Z'), id: 'e-1' },
      );
    });

    it('un cursor que no trae las claves de orden se rechaza', async () => {
      const d = build();
      conMembresia(d);

      await expect(
        d.service.myPointsLedger(patient, TENANT, {
          cursor: encodeKeysetCursor({ otra: 'cosa' }),
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('sin membresía devuelve página vacía, no el ledger de nadie', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([program()]);
      d.loyaltyRepo.findMembershipsByMemberRef.mockResolvedValue([]);

      const res = await d.service.myPointsLedger(patient, TENANT, {});

      expect(res).toEqual({ entries: [] });
      expect(d.loyaltyRepo.findLedgerPageByMembership).not.toHaveBeenCalled();
    });
  });

  describe('redeemOwnPoints (R-T-E6B1)', () => {
    const patient = {
      id: 'user-9',
      roles: ['PATIENT'],
      patientProfileId: PATIENT_PROFILE,
    } as any;
    const dto = { points: '100', idempotencyKey: 'k-propia' } as any;

    function conMembresia(d: any): void {
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([program()]);
      d.loyaltyRepo.findMembershipsByMemberRef.mockResolvedValue([
        membership({
          memberTypeConceptId: CONCEPTS.REWARD_MEMBER_PATIENT,
          memberRefId: PATIENT_PROFILE,
          pointsBalance: '440.00',
        }),
      ]);
    }

    it('canjea sobre la membresía derivada del token', async () => {
      const d = build();
      conMembresia(d);
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(
        membership({ pointsBalance: '440.00' }),
      );
      d.loyaltyRepo.createLedgerEntry.mockImplementation(
        (_tx: any, data: any) => ({
          id: 'entry-1',
          ...data,
        }),
      );

      const res = await d.service.redeemOwnPoints(patient, TENANT, dto);

      expect(d.loyaltyRepo.findMembershipForUpdate).toHaveBeenCalledWith(
        expect.anything(),
        MEMBERSHIP,
      );
      expect(res.membershipId).toBe(MEMBERSHIP);
    });

    it('OWNERSHIP: una clave de idempotencia de otra membresía se rechaza, no devuelve datos ajenos', async () => {
      const d = build();
      conMembresia(d);
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue({
        id: 'entry-ajena',
        loyaltyMembershipId: 'membresia-de-otro',
      });

      await expect(
        d.service.redeemOwnPoints(patient, TENANT, dto),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.loyaltyRepo.findMembershipForUpdate).not.toHaveBeenCalled();
    });

    it('sin membresía propia no se canjea nada', async () => {
      const d = build();
      d.loyaltyRepo.findActivePrograms.mockResolvedValue([program()]);
      d.loyaltyRepo.findMembershipsByMemberRef.mockResolvedValue([]);

      await expect(
        d.service.redeemOwnPoints(patient, TENANT, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.loyaltyRepo.findLedgerEntryByKey).not.toHaveBeenCalled();
    });

    it('conserva la regla de negocio: saldo insuficiente sigue fallando', async () => {
      const d = build();
      conMembresia(d);
      d.loyaltyRepo.findLedgerEntryByKey.mockResolvedValue(null);
      d.loyaltyRepo.findMembershipForUpdate.mockResolvedValue(
        membership({ pointsBalance: '10.00' }),
      );

      await expect(
        d.service.redeemOwnPoints(patient, TENANT, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
