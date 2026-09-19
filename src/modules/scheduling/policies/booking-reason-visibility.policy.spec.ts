import { puedeVerElMotivoDeLaCita } from './booking-reason-visibility.policy';

/** Actor mínimo para estos casos: sólo lo que la política mira. */
function actor(overrides: {
  patientProfileId?: string;
  practitionerProfileId?: string;
}) {
  return overrides as never;
}

describe('puedeVerElMotivoDeLaCita (MCH-030 · política pura, sin app)', () => {
  const booking = { patientProfileId: 'paciente-1' };

  it('sin actor (anónimo), nunca lo ve', () => {
    expect(puedeVerElMotivoDeLaCita(booking, undefined)).toBe(false);
  });

  it('el titular de la cita lo ve', () => {
    expect(
      puedeVerElMotivoDeLaCita(
        booking,
        actor({ patientProfileId: 'paciente-1' }),
      ),
    ).toBe(true);
  });

  it('un paciente distinto no lo ve', () => {
    expect(
      puedeVerElMotivoDeLaCita(
        booking,
        actor({ patientProfileId: 'otro-paciente' }),
      ),
    ).toBe(false);
  });

  it('quien representa al paciente (B.1) lo ve, aunque no sea el titular', () => {
    const representante = actor({ patientProfileId: 'madre-1' });
    const representados = new Set(['paciente-1']);
    expect(
      puedeVerElMotivoDeLaCita(
        booking,
        representante,
        undefined,
        representados,
      ),
    ).toBe(true);
  });

  it('un representante de OTRO paciente no lo ve', () => {
    const representante = actor({ patientProfileId: 'madre-1' });
    const representados = new Set(['paciente-de-otra-familia']);
    expect(
      puedeVerElMotivoDeLaCita(
        booking,
        representante,
        undefined,
        representados,
      ),
    ).toBe(false);
  });

  it('el profesional que atiende lo ve', () => {
    const medico = actor({ practitionerProfileId: 'prof-1' });
    expect(puedeVerElMotivoDeLaCita(booking, medico, 'prof-1')).toBe(true);
  });

  it('un profesional que no atiende esta cita no lo ve', () => {
    const otroMedico = actor({ practitionerProfileId: 'prof-2' });
    expect(puedeVerElMotivoDeLaCita(booking, otroMedico, 'prof-1')).toBe(false);
  });

  it('sin resolver quién atiende, ningún profesional lo ve por esa vía', () => {
    const medico = actor({ practitionerProfileId: 'prof-1' });
    expect(puedeVerElMotivoDeLaCita(booking, medico, undefined)).toBe(false);
  });

  it('un administrador de agenda sin perfil clínico/paciente no lo ve', () => {
    const admin = actor({});
    expect(puedeVerElMotivoDeLaCita(booking, admin, 'prof-1')).toBe(false);
  });
});
