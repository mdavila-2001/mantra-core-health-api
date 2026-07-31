import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import type { MockProviderEnv } from './env';

function buildContext(headerValue: string | undefined): ExecutionContext {
  const request = {
    header: (name: string) =>
      name.toLowerCase() === 'x-api-key' ? headerValue : undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function envWithKey(apiKey?: string): MockProviderEnv {
  return {
    port: 4100,
    apiKey,
    notificationsFailureRate: 0,
    deletionsFailureRate: 0,
    simulatedLatencyMs: 0,
  };
}

describe('ApiKeyGuard', () => {
  it('deja pasar cualquier request si no hay MOCK_API_KEY configurada', () => {
    const guard = new ApiKeyGuard(envWithKey(undefined));

    expect(guard.canActivate(buildContext(undefined))).toBe(true);
  });

  it('acepta la request cuando el header coincide con la clave configurada', () => {
    const guard = new ApiKeyGuard(envWithKey('secret-123'));

    expect(guard.canActivate(buildContext('secret-123'))).toBe(true);
  });

  it('rechaza la request cuando el header no coincide', () => {
    const guard = new ApiKeyGuard(envWithKey('secret-123'));

    expect(() => guard.canActivate(buildContext('otra-clave'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza la request cuando falta el header', () => {
    const guard = new ApiKeyGuard(envWithKey('secret-123'));

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});
