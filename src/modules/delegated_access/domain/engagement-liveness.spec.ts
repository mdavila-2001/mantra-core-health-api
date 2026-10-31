import {
  RECERTIFICATION_GRACE_DAYS,
  isEngagementLive,
  type EngagementLivenessInput,
} from './engagement-liveness';

const NOW = new Date('2026-10-30T12:00:00Z');
const days = (n: number): Date => new Date(NOW.getTime() + n * 86_400_000);

const live = (
  overrides: Partial<EngagementLivenessInput> = {},
): EngagementLivenessInput => ({
  assignmentActive: true,
  validFrom: days(-30),
  validTo: undefined,
  membershipActive: true,
  membershipEndDate: undefined,
  nextRecertificationAt: days(60),
  ...overrides,
});

describe('isEngagementLive (M5)', () => {
  it('un vínculo activo, vigente, con membresía viva y recertificación al día está vivo', () => {
    expect(isEngagementLive(live(), NOW)).toBe(true);
  });

  it('un vínculo no activo no está vivo', () => {
    expect(isEngagementLive(live({ assignmentActive: false }), NOW)).toBe(
      false,
    );
  });

  it('fuera de su vigencia no está vivo', () => {
    expect(isEngagementLive(live({ validFrom: days(1) }), NOW)).toBe(false);
    expect(isEngagementLive(live({ validTo: days(-1) }), NOW)).toBe(false);
  });

  it('con la membresía cerrada, suspendida o vencida no está vivo', () => {
    expect(isEngagementLive(live({ membershipActive: false }), NOW)).toBe(
      false,
    );
    expect(isEngagementLive(live({ membershipEndDate: days(-1) }), NOW)).toBe(
      false,
    );
  });

  it('pasada la fecha de recertificación se mantiene durante la gracia', () => {
    expect(
      isEngagementLive(live({ nextRecertificationAt: days(-10) }), NOW),
    ).toBe(true);
  });

  it(`vencida la gracia de ${RECERTIFICATION_GRACE_DAYS} días no está vivo, aunque el barrido del worker no haya corrido`, () => {
    expect(
      isEngagementLive(
        live({
          nextRecertificationAt: days(-(RECERTIFICATION_GRACE_DAYS + 1)),
        }),
        NOW,
      ),
    ).toBe(false);
  });

  it('sin fecha de recertificación (vínculo anterior a la regla) no se corta por ella', () => {
    expect(
      isEngagementLive(live({ nextRecertificationAt: undefined }), NOW),
    ).toBe(true);
  });
});
