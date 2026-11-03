import { isPatientOnlyActor } from './actor-kind';

/**
 * Despacho de la ruta compartida de disputas por quién es el actor (carril 16,
 * REQ-16-032): el cuerpo nunca decide la rama.
 */
describe('isPatientOnlyActor', () => {
  it('un paciente sin roles de prestador entra como paciente', () => {
    expect(isPatientOnlyActor(['PATIENT'])).toBe(true);
    expect(isPatientOnlyActor(['PATIENT', 'USER'])).toBe(true);
  });

  it.each([
    ['BILLING'],
    ['FINANCE'],
    ['BILLING_OPERATOR'],
    ['SECURITY_ADMIN'],
    ['SUPERADMIN'],
  ])('PATIENT + %s entra como prestador', (role) => {
    expect(isPatientOnlyActor(['PATIENT', role])).toBe(false);
  });

  it('sin el rol de paciente nunca es paciente', () => {
    expect(isPatientOnlyActor(['PRACTITIONER'])).toBe(false);
    expect(isPatientOnlyActor(['SECURITY_ADMIN'])).toBe(false);
    expect(isPatientOnlyActor([])).toBe(false);
  });

  it('roles ausentes no rompen y no son paciente', () => {
    expect(isPatientOnlyActor(undefined)).toBe(false);
  });

  it('un profesional que además es paciente entra como paciente: sólo objeta lo propio', () => {
    expect(isPatientOnlyActor(['PATIENT', 'PRACTITIONER'])).toBe(true);
  });

  it('no distingue mayúsculas: un código en minúscula no es el rol', () => {
    expect(isPatientOnlyActor(['patient'])).toBe(false);
  });
});
