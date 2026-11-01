import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../common';
import { INTEG } from '../../../integrations/integrations.concepts';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import { readConfig } from '../../infrastructure/repositories/erp-connection.repository';
import { ErpConnectionUseCases } from './erp-connection.use-cases';
import { OrderStockSourceResolver } from './order-stock-source.resolver';

type AnyFn = (...args: any[]) => any;
const fn = <T extends AnyFn = AnyFn>(impl?: T) => jest.fn<T>(impl);

const ACTOR = { id: 'user-1', roles: ['PHARMACY_STAFF'] } as never;

function record(overrides: Record<string, unknown> = {}) {
  const connection = {
    id: 'conn-1',
    stateConceptId: INTEG.CONN_ACTIVE,
    configJson: {
      baseUrl: 'http://farmacia.test/std',
      pharmacyCode: 'FARM-1',
      siteCodes: { 'site-1': 'SUC-CENTRO' },
      keyLast4: '1234',
    },
  };
  return {
    link: { id: 'link-1' },
    connection,
    systemCode: 'ALOVIDA_STANDARD',
    config: readConfig(connection.configJson),
    credential: { id: 'cred-1', secretRef: 'enc:v1:sellado' },
    ...overrides,
  };
}

function doubles(opts: { cipherReady?: boolean } = {}) {
  const tx = { flush: fn(async () => undefined) };
  const em = {
    fork: fn(() => em),
    transactional: fn(async (work: AnyFn) => work(tx)),
  };
  const connections = {
    findSite: fn(async () => ({
      id: 'site-1',
      pharmacyId: 'ph-1',
      code: 'SC',
    })),
    findForPharmacy: fn(async (): Promise<ReturnType<typeof record> | null> =>
      record(),
    ),
    findConnectionById: fn(async () => record().connection),
    recordStatus: fn(),
    findPharmacy: fn(async () => ({ id: 'ph-1', tenantId: 't-1', code: 'P' })),
    findActiveSites: fn(async () => [
      { id: 'site-1', name: 'Centro', code: 'SC' },
    ]),
    findProviderByCode: fn(async () => ({ id: 'prov-1' })),
    updateConnection: fn(),
    rotateCredential: fn(() => ({ id: 'cred-2' })),
  };
  const reads = {
    findMappings: fn(async () => [
      { pharmacyProductId: 'prod-1', externalProductCode: 'E-1' },
      { pharmacyProductId: 'prod-2', externalProductCode: 'E-2' },
    ]),
  };
  const adapter = {
    stockForSite: fn(async () => [{ code: 'E-1', quantity: 7 }]),
    checkHealth: fn(async () => undefined),
  };
  const catalogs = { forAccess: fn(() => adapter) };
  const ready = opts.cipherReady ?? true;
  const cipher = {
    isConfigured: fn(() => ready),
    encrypt: fn((plain: string) => `enc:v1:${plain.length}`),
    decrypt: fn(() => 'clave-real-1234'),
  };
  const scope = { requireManagedPharmacy: fn(async () => ({})) };
  const logger = { setContext: fn(), info: fn(), warn: fn() };
  const resolver = new OrderStockSourceResolver(
    em as never,
    connections as never,
    reads as never,
    catalogs as never,
    cipher as never,
    logger as never,
  );
  const useCases = new ErpConnectionUseCases(
    em as never,
    scope as never,
    connections as never,
    catalogs as never,
    cipher as never,
    logger as never,
  );
  return { resolver, useCases, connections, adapter, catalogs, cipher, logger };
}

describe('OrderStockSourceResolver (FAR-C9)', () => {
  it('manual cuando la farmacia no tiene conexión', async () => {
    const d = doubles();
    d.connections.findForPharmacy.mockResolvedValue(null);

    await expect(d.resolver.resolve('site-1', ['prod-1'])).resolves.toEqual({
      mode: 'MANUAL',
    });
    expect(d.catalogs.forAccess).not.toHaveBeenCalled();
  });

  it('manual cuando la conexión está desactivada', async () => {
    const d = doubles();
    const paused = record();
    paused.connection.stateConceptId = INTEG.CONN_PAUSED;
    d.connections.findForPharmacy.mockResolvedValue(paused);

    await expect(d.resolver.resolve('site-1', ['prod-1'])).resolves.toEqual({
      mode: 'MANUAL',
    });
  });

  it('conectada: consulta la sucursal con su código, 3 s como máximo, y deja la conexión activa', async () => {
    const d = doubles();

    const source = await d.resolver.resolve('site-1', ['prod-1', 'prod-2']);

    expect(d.catalogs.forAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        systemCode: 'ALOVIDA_STANDARD',
        pharmacyCode: 'FARM-1',
        apiKey: 'clave-real-1234',
        timeoutMs: 3000,
      }),
    );
    expect(d.adapter.stockForSite).toHaveBeenCalledWith('SUC-CENTRO', 'FARM-1');
    // E-2 no vino en la respuesta: el sistema no lo tiene.
    expect(source).toEqual({
      mode: 'CONNECTED',
      liveQuantities: new Map([
        ['prod-1', 7],
        ['prod-2', 0],
      ]),
    });
    expect(d.connections.recordStatus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        statusCode: 'PINV_ERP_CONNECTION_ACTIVE',
        reasonCode: null,
      }),
    );
  });

  it('si no responde: manual (las líneas entran «por confirmar») y la conexión queda con error UNREACHABLE', async () => {
    const d = doubles();
    d.adapter.stockForSite.mockRejectedValue(
      new ExternalCatalogUnavailableError('GET → ECONNREFUSED'),
    );

    await expect(d.resolver.resolve('site-1', ['prod-1'])).resolves.toEqual({
      mode: 'MANUAL',
    });
    expect(d.connections.recordStatus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        statusCode: 'PINV_ERP_CONNECTION_ERROR',
        reasonCode: 'PINV_ERP_REASON_UNREACHABLE',
      }),
    );
  });

  it('si rechaza la clave: manual y la conexión queda con error AUTH_REJECTED', async () => {
    const d = doubles();
    d.adapter.stockForSite.mockRejectedValue(
      new ExternalCatalogUnavailableError('GET → 401', 'AUTH_REJECTED'),
    );

    await expect(d.resolver.resolve('site-1', ['prod-1'])).resolves.toEqual({
      mode: 'MANUAL',
    });
    expect(d.connections.recordStatus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ reasonCode: 'PINV_ERP_REASON_AUTH_REJECTED' }),
    );
  });

  it('sin llave de cifrado en el servidor: manual, sin llamar a nadie', async () => {
    const d = doubles({ cipherReady: false });

    await expect(d.resolver.resolve('site-1', ['prod-1'])).resolves.toEqual({
      mode: 'MANUAL',
    });
    expect(d.catalogs.forAccess).not.toHaveBeenCalled();
  });

  it('nunca lanza: un problema inesperado deja el pedido en manual', async () => {
    const d = doubles();
    d.connections.findSite.mockRejectedValue(new Error('se cayó la base'));

    await expect(d.resolver.resolve('site-1', ['prod-1'])).resolves.toEqual({
      mode: 'MANUAL',
    });
  });
});

describe('ErpConnectionUseCases (FAR-C9)', () => {
  it('sin llave de cifrado, guardar y probar responden un error claro', async () => {
    const d = doubles({ cipherReady: false });

    const save = d.useCases.save('ph-1', { mode: 'CONNECTED' } as never, ACTOR);
    await expect(save).rejects.toBeInstanceOf(PreconditionFailedException);
    await expect(save).rejects.toThrow(
      'Falta configurar el cifrado de conexiones',
    );
    await expect(
      d.useCases.testDraft(
        'ph-1',
        {
          systemCode: 'ALOVIDA_STANDARD',
          baseUrl: 'http://x',
          pharmacyCode: 'F',
          apiKey: 'k1234',
        },
        ACTOR,
      ),
    ).rejects.toThrow('Falta configurar el cifrado de conexiones');
  });

  it('la vista nunca lleva la clave: solo ••••1234', async () => {
    const d = doubles();

    const view = await d.useCases.view('ph-1', ACTOR);

    expect(view.keyHint).toBe('••••1234');
    expect(JSON.stringify(view)).not.toContain('clave-real');
    expect(JSON.stringify(view)).not.toContain('enc:v1');
    expect(view.mode).toBe('CONNECTED');
    expect(view.sites[0]).toEqual(
      expect.objectContaining({ siteId: 'site-1', externalCode: 'SUC-CENTRO' }),
    );
  });

  it('guarda la clave cifrada y conserva la anterior si no se manda otra', async () => {
    const d = doubles();

    await d.useCases.save(
      'ph-1',
      { mode: 'CONNECTED', baseUrl: 'http://farmacia.test/nueva' } as never,
      ACTOR,
    );
    expect(d.connections.rotateCredential).not.toHaveBeenCalled();
    expect(d.connections.updateConnection).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        enabled: true,
        config: expect.objectContaining({
          baseUrl: 'http://farmacia.test/nueva',
          keyLast4: '1234',
        }),
      }),
    );

    await d.useCases.save(
      'ph-1',
      { mode: 'CONNECTED', apiKey: 'otra-clave-5678' } as never,
      ACTOR,
    );
    expect(d.cipher.encrypt).toHaveBeenCalledWith('otra-clave-5678');
    expect(d.connections.rotateCredential).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ id: 'cred-1' }),
      'enc:v1:15',
      'user-1',
    );
  });

  it('conectar sin clave y sin una guardada: 422', async () => {
    const d = doubles();
    d.connections.findForPharmacy.mockResolvedValue(null);

    await expect(
      d.useCases.save(
        'ph-1',
        {
          mode: 'CONNECTED',
          systemCode: 'ALOVIDA_STANDARD',
          baseUrl: 'http://x',
          pharmacyCode: 'F',
        } as never,
        ACTOR,
      ),
    ).rejects.toThrow('Falta la clave de la conexión');
  });

  it('«Probar» con datos del formulario devuelve el motivo sin detalle interno y no guarda nada', async () => {
    const d = doubles();
    d.adapter.checkHealth.mockRejectedValue(
      new ExternalCatalogUnavailableError('GET /x → 401', 'AUTH_REJECTED'),
    );

    const result = await d.useCases.testDraft(
      'ph-1',
      {
        systemCode: 'ALOVIDA_STANDARD',
        baseUrl: 'http://x/',
        pharmacyCode: 'F',
        apiKey: 'mala-0000',
      },
      ACTOR,
    );

    expect(result).toEqual({ result: 'AUTH_REJECTED' });
    expect(d.catalogs.forAccess).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'http://x', apiKey: 'mala-0000' }),
    );
    expect(d.connections.recordStatus).not.toHaveBeenCalled();
    expect(d.connections.updateConnection).not.toHaveBeenCalled();
  });

  it('«Probar» lo guardado deja el estado: no responde', async () => {
    const d = doubles();
    d.adapter.checkHealth.mockRejectedValue(
      new ExternalCatalogUnavailableError('timeout'),
    );

    const result = await d.useCases.testSaved('ph-1', ACTOR);

    expect(result.result).toBe('UNREACHABLE');
    expect(d.connections.recordStatus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ reasonCode: 'PINV_ERP_REASON_UNREACHABLE' }),
    );
  });
});
