import { jest } from '@jest/globals';
import { NetworkProxyCheckService } from './network-proxy-check.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const PROD = { NODE_ENV: 'production' } as NodeJS.ProcessEnv;

function build(active: number | Error) {
  const em = { fork: () => ({}) };
  const port = {
    countActive:
      active instanceof Error
        ? mockFn().mockRejectedValue(active)
        : mockFn().mockResolvedValue(active),
  };
  const logger = {
    setContext: mockFn(),
    warn: mockFn(),
    info: mockFn(),
    error: mockFn(),
  };
  const service = new NetworkProxyCheckService(
    em as any,
    port as any,
    logger as any,
  );
  return { service, port, logger };
}

describe('NetworkProxyCheckService (TRUST_PROXY_HOPS al arrancar)', () => {
  it('con reglas de red activas y 0 saltos avisa en el log', async () => {
    const d = build(4);
    await expect(d.service.check('0')).resolves.toEqual([
      'TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES',
    ]);
    expect(d.logger.warn).toHaveBeenCalledWith(
      {
        operation: 'iam.network.proxy-check',
        code: 'TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES',
      },
      expect.stringContaining('4 regla(s) de red'),
    );
  });

  it('con un valor inconsistente avisa aunque no haya reglas', async () => {
    const d = build(0);
    await expect(d.service.check('dos')).resolves.toEqual([
      'TRUST_PROXY_HOPS_INVALID',
    ]);
    expect(d.logger.warn).toHaveBeenCalledTimes(1);
  });

  it('coherente: no avisa', async () => {
    const d = build(3);
    await expect(d.service.check('2')).resolves.toEqual([]);
    expect(d.logger.warn).not.toHaveBeenCalled();
  });

  it('un fallo al comprobar (base sin migrar, sin conexión) no tumba el arranque: se registra', async () => {
    const d = build(new Error('relation does not exist'));
    await expect(d.service.check('0')).resolves.toEqual([]);
    expect(d.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'iam.network.proxy-check' }),
      expect.stringContaining('No se pudo comprobar'),
    );
  });

  it('onApplicationBootstrap lee TRUST_PROXY_HOPS del entorno', async () => {
    const original = process.env.TRUST_PROXY_HOPS;
    process.env.TRUST_PROXY_HOPS = '0';
    try {
      const d = build(2);
      await d.service.onApplicationBootstrap();
      expect(d.logger.warn).toHaveBeenCalled();
    } finally {
      if (original === undefined) delete process.env.TRUST_PROXY_HOPS;
      else process.env.TRUST_PROXY_HOPS = original;
    }
  });
});

describe('SEG A-B8: condición de red en uso con 0 saltos de proxy', () => {
  it('en producción, con reglas de red activas y 0 saltos, el arranque FALLA (todos valdrían la IP del proxy)', async () => {
    const d = build(4);
    await expect(d.service.check('0', PROD)).rejects.toThrow(
      /TRUST_PROXY_HOPS/,
    );
    expect(d.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'iam.network.proxy-check',
        code: 'TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES',
      }),
      expect.any(String),
    );
  });

  it('también con el valor vacío o inválido (la API lo trata como 0)', async () => {
    await expect(build(2).service.check(undefined, PROD)).rejects.toThrow();
    await expect(build(2).service.check('dos', PROD)).rejects.toThrow();
  });

  it('TRUST_PROXY_HOPS_ALLOW_ZERO=true declara que no hay proxy delante: arranca, con aviso fuerte', async () => {
    const d = build(4);
    await expect(
      d.service.check('0', { ...PROD, TRUST_PROXY_HOPS_ALLOW_ZERO: 'true' }),
    ).resolves.toEqual(['TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES']);
    expect(d.logger.error).toHaveBeenCalled();
  });

  it('en producción sin reglas de red, o con saltos configurados, arranca sin avisos', async () => {
    await expect(build(0).service.check('0', PROD)).resolves.toEqual([]);
    await expect(build(5).service.check('2', PROD)).resolves.toEqual([]);
  });

  it('fuera de producción no detiene el arranque, pero registra el aviso como error', async () => {
    const d = build(4);
    await expect(
      d.service.check('0', { NODE_ENV: 'development' }),
    ).resolves.toEqual(['TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES']);
    expect(d.logger.error).toHaveBeenCalled();
  });
});
