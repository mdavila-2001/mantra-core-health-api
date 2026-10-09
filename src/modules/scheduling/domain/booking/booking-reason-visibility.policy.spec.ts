import { canSeeBookingReason } from './booking-reason-visibility.policy';

/** Actor mínimo para estos casos: sólo lo que la política mira. */
function actor(overrides: {
  patientProfileId?: string;
  practitionerProfileId?: string;
}) {
  return overrides as never;
}

describe('canSeeBookingReason (MCH-030 · política pura, sin app)', () => {
  const booking = { patientProfileId: 'paciente-1' };

  it('sin actor (anónimo), nunca lo ve', () => {
    expect(canSeeBookingReason(booking, undefined)).toBe(false);
  });

  it('el titular de la cita lo ve', () => {
    expect(
      canSeeBookingReason(booking, actor({ patientProfileId: 'paciente-1' })),
    ).toBe(true);
  });

  it('un paciente distinto no lo ve', () => {
    expect(
      canSeeBookingReason(
        booking,
        actor({ patientProfileId: 'otro-paciente' }),
      ),
    ).toBe(false);
  });

  it('quien representa al paciente (B.1) lo ve, aunque no sea el titular', () => {
    const representative = actor({ patientProfileId: 'madre-1' });
    const represented = new Set(['paciente-1']);
    expect(
      canSeeBookingReason(booking, representative, undefined, represented),
    ).toBe(true);
  });

  it('un representante de OTRO paciente no lo ve', () => {
    const representative = actor({ patientProfileId: 'madre-1' });
    const represented = new Set(['paciente-de-otra-familia']);
    expect(
      canSeeBookingReason(booking, representative, undefined, represented),
    ).toBe(false);
  });

  it('el profesional que atiende lo ve', () => {
    const practitioner = actor({ practitionerProfileId: 'prof-1' });
    expect(canSeeBookingReason(booking, practitioner, 'prof-1')).toBe(true);
  });

  it('un profesional que no atiende esta cita no lo ve', () => {
    const otherPractitioner = actor({ practitionerProfileId: 'prof-2' });
    expect(canSeeBookingReason(booking, otherPractitioner, 'prof-1')).toBe(
      false,
    );
  });

  it('sin resolver quién atiende, ningún profesional lo ve por esa vía', () => {
    const practitioner = actor({ practitionerProfileId: 'prof-1' });
    expect(canSeeBookingReason(booking, practitioner, undefined)).toBe(false);
  });

  it('un administrador de agenda sin perfil clínico/paciente no lo ve', () => {
    const admin = actor({});
    expect(canSeeBookingReason(booking, admin, 'prof-1')).toBe(false);
  });
});
