import { jest } from '@jest/globals';
import { VerificationBypassService } from './verification-bypass.service';

// Mismo doble suelto que `profiles-practitioners.service.spec.ts`: evita el
// tipado estricto `Mock<never>` de `@jest/globals` bajo el tsconfig raíz.
const mockFn = (): any => (jest.fn as any)();

function logger() {
  return {
    setContext: mockFn(),
    warn: mockFn(),
    info: mockFn(),
  } as any;
}

describe('VerificationBypassService', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFlag = process.env.DEV_VERIFICATION_BYPASS;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalFlag === undefined) delete process.env.DEV_VERIFICATION_BYPASS;
    else process.env.DEV_VERIFICATION_BYPASS = originalFlag;
  });

  it('aborta la construcción si el bypass está activo en producción', () => {
    process.env.NODE_ENV = 'production';
    process.env.DEV_VERIFICATION_BYPASS = 'true';

    expect(() => new VerificationBypassService(logger())).toThrow(
      /DEV_VERIFICATION_BYPASS está activo en producción/,
    );
  });

  it('isActive() refleja el flag fuera de producción', () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_VERIFICATION_BYPASS = 'true';

    const service = new VerificationBypassService(logger());

    expect(service.isActive()).toBe(true);
  });

  it('isActive() es false por defecto', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DEV_VERIFICATION_BYPASS;

    const service = new VerificationBypassService(logger());

    expect(service.isActive()).toBe(false);
  });

  it('loguea un warning estructurado cuando el bypass está activo', () => {
    process.env.NODE_ENV = 'test';
    process.env.DEV_VERIFICATION_BYPASS = 'true';
    const log = logger();

    new VerificationBypassService(log);

    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'verification_bypass.active' }),
      expect.any(String),
    );
  });

  it('no loguea nada cuando el bypass está apagado', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DEV_VERIFICATION_BYPASS;
    const log = logger();

    new VerificationBypassService(log);

    expect(log.warn).not.toHaveBeenCalled();
  });
});
