import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IamAuthController } from './iam-auth.controller';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const authService = {
    login: mockFn(),
    refresh: mockFn(),
    logoutAll: mockFn(),
    purgeSessions: mockFn(),
  };
  const assistedRegistrationService = { activateAccount: mockFn() };
  const selfRegistrationService = {
    registerPatient: mockFn(),
    verifyEmail: mockFn(),
  };
  const organizationRegistrationService = { registerOrganization: mockFn() };
  const practitionerRegistrationService = { registerPractitioner: mockFn() };
  const emailVerificationService = { resend: mockFn() };
  const passwordResetService = {
    requestReset: mockFn(),
    resetPassword: mockFn(),
  };
  const controller = new IamAuthController(
    authService as any,
    assistedRegistrationService as any,
    selfRegistrationService as any,
    organizationRegistrationService as any,
    practitionerRegistrationService as any,
    passwordResetService as any,
    emailVerificationService as any,
  );
  return {
    controller,
    authService,
    assistedRegistrationService,
    selfRegistrationService,
    organizationRegistrationService,
    practitionerRegistrationService,
    passwordResetService,
  };
}

/** Respuesta mínima de Express: sólo lo que usa la entrega por cookie. */
function resStub() {
  return { cookie: mockFn(), clearCookie: mockFn() };
}

/** Petición sin cabecera `Cookie`: el modo por defecto no la mira. */
function reqStub() {
  return { headers: {} };
}

describe('IamAuthController', () => {
  it('delegates login with the client ip (UC-01-04)', async () => {
    const d = build();
    const dto = { email: 'a@x.io', password: 'password123' };
    d.authService.login.mockResolvedValue({ accessToken: 'at' });
    await expect(
      d.controller.login(dto as any, '1.2.3.4', resStub() as any),
    ).resolves.toEqual({
      accessToken: 'at',
    });
    expect(d.authService.login).toHaveBeenCalledWith(dto, '1.2.3.4');
  });

  it('delegates refresh (UC-01-06)', async () => {
    const d = build();
    const dto = { refreshToken: 'r' };
    d.authService.refresh.mockResolvedValue({ accessToken: 'at' });
    await d.controller.refresh(dto, reqStub() as any, resStub() as any);
    // Con la cookie apagada -el default- el token sale del cuerpo y llega al
    // dominio en crudo.
    expect(d.authService.refresh).toHaveBeenCalledWith('r');
  });

  it('delegates logoutAll for the current user (UC-01-08)', async () => {
    const d = build();
    const actor = { id: 'u1', roles: [] } as any;
    await d.controller.logoutAll(actor);
    expect(d.authService.logoutAll).toHaveBeenCalledWith(actor);
  });

  it('delegates purge (UC-01-11)', async () => {
    const d = build();
    const actor = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;
    await d.controller.purge(actor);
    expect(d.authService.purgeSessions).toHaveBeenCalledWith(actor);
  });

  it('delegates patient self-registration with the client ip', async () => {
    const d = build();
    // Los cinco de abajo del documento y la contraseña son obligatorios desde
    // la TAREA 03 (AC-03-3): sin ellos el DTO no valida.
    const dto = {
      nationalId: '1234567',
      password: 'password123',
      displayName: 'Ana',
      email: 'ana@example.test',
      birthDate: '1990-05-17',
      phone: '+591 70012345',
      sexAtBirth: 'FEMALE' as const,
      residenceMunicipalityConceptId: '11111111-1111-4111-8111-111111111111',
    };
    await d.controller.registerPatient(dto, '1.2.3.4');
    expect(d.selfRegistrationService.registerPatient).toHaveBeenCalledWith(
      dto,
      '1.2.3.4',
    );
  });

  it('delegates organization self-registration with the client ip', async () => {
    const d = build();
    const dto = {
      organization: { code: 'CLINICA_X', legalName: 'Clínica X S.A.' },
      owner: {
        email: 'admin@clinicax.bo',
        password: 'password123',
        displayName: 'Ana',
      },
    };
    await d.controller.registerOrganization(dto as any, '1.2.3.4');
    expect(
      d.organizationRegistrationService.registerOrganization,
    ).toHaveBeenCalledWith(dto, '1.2.3.4');
  });

  it('delegates email verification', async () => {
    const d = build();
    const dto = { token: 'raw-token' };
    await d.controller.verifyEmail(dto);
    expect(d.selfRegistrationService.verifyEmail).toHaveBeenCalledWith(dto);
  });

  it('delegates the reset request with the client ip', async () => {
    const d = build();
    const dto = { identifier: 'alguien@redesa.test' };
    await d.controller.forgotPassword(dto as any, '1.2.3.4');
    expect(d.passwordResetService.requestReset).toHaveBeenCalledWith(
      dto,
      '1.2.3.4',
    );
  });

  it('delegates the reset consumption with the client ip', async () => {
    const d = build();
    const dto = { token: 'raw-token', newPassword: 'nueva-clave-123' };
    await d.controller.resetPassword(dto as any, '1.2.3.4');
    expect(d.passwordResetService.resetPassword).toHaveBeenCalledWith(
      dto,
      '1.2.3.4',
    );
  });
});
