import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IamAuthController } from './iam-auth.controller';

function build() {
  const authService = {
    login: mockFn(),
    refresh: mockFn(),
    logoutAll: mockFn(),
    purgeSessions: mockFn(),
  };
  const controller = new IamAuthController(authService as any);
  return { controller, authService };
}

describe('IamAuthController', () => {
  it('delegates login with the client ip (UC-01-04)', async () => {
    const d = build();
    const dto = { email: 'a@x.io', password: 'password123' };
    d.authService.login.mockResolvedValue({ accessToken: 'at' });
    await expect(d.controller.login(dto as any, '1.2.3.4')).resolves.toEqual({
      accessToken: 'at',
    });
    expect(d.authService.login).toHaveBeenCalledWith(dto, '1.2.3.4');
  });

  it('delegates refresh (UC-01-06)', async () => {
    const d = build();
    const dto = { refreshToken: 'r' };
    await d.controller.refresh(dto);
    expect(d.authService.refresh).toHaveBeenCalledWith(dto);
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
});
