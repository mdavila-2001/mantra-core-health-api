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

/**
 * Respuesta Express mínima para los handlers que ahora reciben `@Res`.
 * Con la cookie de refresco apagada —el estado por defecto— no se llama a
 * ninguno de sus métodos; se espían para poder afirmarlo.
 */
function fakeResponse() {
  return { cookie: (jest.fn as any)(), clearCookie: (jest.fn as any)() } as any;
}

describe('IamAuthController', () => {
  it('delegates login with the client ip (UC-01-04)', async () => {
    const d = build();
    const dto = { email: 'a@x.io', password: 'password123' };
    d.authService.login.mockResolvedValue({ accessToken: 'at' });
    const res = fakeResponse();
    await expect(
      d.controller.login(dto as any, '1.2.3.4', res),
    ).resolves.toEqual({
      accessToken: 'at',
    });
    expect(d.authService.login).toHaveBeenCalledWith(dto, '1.2.3.4');
    // Flag apagado: no se emite cookie y el cuerpo llega intacto.
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('delegates refresh (UC-01-06)', async () => {
    const d = build();
    const dto = { refreshToken: 'r' };
    const res = fakeResponse();
    await d.controller.refresh(dto as any, res);
    expect(d.authService.refresh).toHaveBeenCalledWith(dto);
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('delegates logoutAll for the current user (UC-01-08)', async () => {
    const d = build();
    const actor = { id: 'u1', roles: [] } as any;
    const res = fakeResponse();
    await d.controller.logoutAll(actor, res);
    expect(d.authService.logoutAll).toHaveBeenCalledWith(actor);
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it('delegates purge (UC-01-11)', async () => {
    const d = build();
    const actor = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;
    await d.controller.purge(actor);
    expect(d.authService.purgeSessions).toHaveBeenCalledWith(actor);
  });

  it('delegates patient self-registration with the client ip', async () => {
    const d = build();
    const dto = {
      nationalId: '1234567',
      password: 'password123',
      displayName: 'Ana',
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
