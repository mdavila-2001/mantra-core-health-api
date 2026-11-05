import { jest } from '@jest/globals';
import { PaymentsTransactionsService } from './payments-transactions.service';
import { GatewayConnections, PaymentIntents } from '../entities';
import {
  CONCEPTS,
  UnauthorizedException,
  canonicalJson,
  deriveWebhookSecret,
  signPayload,
} from '../../../common';
import { PaymentsErrorReason } from '../payments.error-reasons';

/**
 * MCH-019 · el callback del gateway se verifica con el secreto de la conexión
 * configurada (`gateway_connections.webhook_secret_ref`), no con uno derivado
 * por gateway desde una raíz compartida.
 *
 * Fail-closed: sin conexión, sin referencia, con una referencia que no resuelve
 * o con una conexión de otro gateway, el callback se rechaza sin tocar estado.
 */

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PFX = 'WEBHOOK_SECRET_11111111111111111111111111111111_';
const TENANT = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT = '22222222-2222-2222-2222-222222222222';

const SECRET_A = 'a'.repeat(40);
const SECRET_TO_NEW = 'n'.repeat(40);
const SECRET_B = 'b'.repeat(40);

interface Scenario {
  /** Conexión que referencia la intención (o ninguna). */
  gatewayConnectionId?: string;
  /** Conexiones existentes por id. */
  conexiones: Record<
    string,
    {
      gatewayId: string;
      webhookSecretRef?: string | null;
      /** Por defecto, el tenant de la intención. */
      tenantId?: string;
    }
  >;
  /** Endpoints registrados para la conexión de la intención. */
  endpoints?: Array<Record<string, unknown>>;
}

/** Arma el servicio con una transacción PROCESSING del gateway `gw-1`. */
function build(esc: Scenario) {
  const transaction = {
    id: 'txn-1',
    gatewayId: 'gw-1',
    paymentIntentId: 'intent-1',
    amount: '100.00',
    statusConceptId: CONCEPTS.TXN_PROCESSING,
  };
  const intent = {
    id: 'intent-1',
    gatewayId: 'gw-1',
    tenantId: TENANT,
    gatewayConnectionId: esc.gatewayConnectionId,
    amount: '100.00',
    statusConceptId: CONCEPTS.PI_PROCESSING,
  };
  const tx = {
    flush: mockFn(),
    findOne: mockFn((entity: unknown, where: { id: string }) => {
      if (entity === PaymentIntents)
        return Promise.resolve(where.id === intent.id ? intent : null);
      if (entity === GatewayConnections) {
        const c = esc.conexiones[where.id];
        return Promise.resolve(
          c ? { id: where.id, tenantId: TENANT, ...c } : null,
        );
      }
      return Promise.resolve(null);
    }),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const intentsRepo = { findByIdForUpdate: mockFn(() => intent) };
  const transactionsRepo = {
    findByGatewayRef: mockFn(() => Promise.resolve(transaction)),
    // MCH-011: el callback verificado se archiva en la bandeja de webhooks.
    findWebhookEventByRef: mockFn(() => Promise.resolve(null)),
    recordWebhookEvent: mockFn(),
    // MCH-036: el estado de la intención se deriva de lo capturado.
    findByIntent: mockFn(() => Promise.resolve([transaction])),
    findCallbackEndpoints: mockFn(() => Promise.resolve(esc.endpoints ?? [])),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PaymentsTransactionsService(
    em as any,
    intentsRepo as any,
    {} as any,
    transactionsRepo as any,
    logger as any,
  );
  return { service, transaction, intent, logger, transactionsRepo };
}

const body = {
  gatewayTransactionRef: 'ref-1',
  outcome: 'CAPTURED' as const,
};

/** Firma el callback como lo haría el proveedor con el secreto dado. */
function sign(secret: string): string {
  return signPayload(
    secret,
    canonicalJson({ ...body, authorizationCode: undefined }),
  );
}

describe('applyCallback · secreto por conexión (MCH-019)', () => {
  const previous = { ...process.env };
  beforeEach(() => {
    process.env[`${PFX}TEST_A`] = SECRET_A;
    process.env[`${PFX}TEST_A_V2`] = SECRET_TO_NEW;
    process.env[`${PFX}TEST_B`] = SECRET_B;
  });
  afterEach(() => {
    process.env = { ...previous };
  });

  const twoConnections = (refA: string): Scenario => ({
    gatewayConnectionId: 'conn-a',
    conexiones: {
      'conn-a': { gatewayId: 'gw-1', webhookSecretRef: refA },
      'conn-b': {
        gatewayId: 'gw-1',
        webhookSecretRef: `env:${PFX}TEST_B`,
      },
    },
  });

  it('acepta la firma hecha con el secreto de la conexión configurada', async () => {
    const d = build(twoConnections(`env:${PFX}TEST_A`));

    const res = await d.service.applyCallback('gw', {
      ...body,
      signature: sign(SECRET_A),
    });

    expect(res.duplicate).toBe(false);
    expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_CAPTURED);
  });

  it('rechaza la firma del esquema derivado por gateway cuando la conexión tiene su secreto', async () => {
    const d = build(twoConnections(`env:${PFX}TEST_A`));

    await expect(
      d.service.applyCallback('gw', {
        ...body,
        signature: sign(deriveWebhookSecret('payments-gateway', 'gw-1')),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
  });

  it('AC03 · una firma de otra conexión no autoriza la transacción', async () => {
    const d = build(twoConnections(`env:${PFX}TEST_A`));

    await expect(
      d.service.applyCallback('gw', {
        ...body,
        signature: sign(SECRET_B),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
  });

  it('AC02 · rotación: durante la ventana valen ambas versiones; después sólo la nueva', async () => {
    const window = build(
      twoConnections(`env:${PFX}TEST_A_V2,env:${PFX}TEST_A`),
    );
    await expect(
      window.service.applyCallback('gw', {
        ...body,
        signature: sign(SECRET_A),
      }),
    ).resolves.toMatchObject({ duplicate: false });

    const rotated = build(twoConnections(`env:${PFX}TEST_A_V2`));
    await expect(
      rotated.service.applyCallback('gw', {
        ...body,
        signature: sign(SECRET_A),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      rotated.service.applyCallback('gw', {
        ...body,
        signature: sign(SECRET_TO_NEW),
      }),
    ).resolves.toMatchObject({ duplicate: false });
  });

  it('AC02 · rotar una conexión no afecta a las demás', async () => {
    // La intención apunta a conn-b; conn-a se rotó. conn-b sigue con su secreto.
    const d = build({
      ...twoConnections(`env:${PFX}TEST_A_V2`),
      gatewayConnectionId: 'conn-b',
    });

    await expect(
      d.service.applyCallback('gw', {
        ...body,
        signature: sign(SECRET_B),
      }),
    ).resolves.toMatchObject({ duplicate: false });
  });

  it.each([
    ['la intención no tiene conexión', { conexiones: {} }],
    [
      'la conexión no existe',
      { gatewayConnectionId: 'conn-x', conexiones: {} },
    ],
    [
      'la conexión no tiene webhook_secret_ref',
      {
        gatewayConnectionId: 'conn-a',
        conexiones: { 'conn-a': { gatewayId: 'gw-1', webhookSecretRef: null } },
      },
    ],
    [
      'la conexión es de otro gateway',
      {
        gatewayConnectionId: 'conn-a',
        conexiones: {
          'conn-a': {
            gatewayId: 'gw-otro',
            webhookSecretRef: `env:${PFX}TEST_A`,
          },
        },
      },
    ],
    [
      'la referencia apunta a una variable no destinada a secretos de webhook',
      {
        gatewayConnectionId: 'conn-a',
        conexiones: {
          'conn-a': { gatewayId: 'gw-1', webhookSecretRef: 'env:NODE_ENV' },
        },
      },
    ],
    [
      'la variable referenciada no está definida',
      {
        gatewayConnectionId: 'conn-a',
        conexiones: {
          'conn-a': {
            gatewayId: 'gw-1',
            webhookSecretRef: `env:${PFX}NO_EXISTE`,
          },
        },
      },
    ],
  ] as Array<[string, Scenario]>)(
    'fail-closed: rechaza aunque la firma sea del esquema anterior cuando %s',
    async (_case, esc) => {
      const d = build(esc);

      await expect(
        d.service.applyCallback('gw', {
          ...body,
          signature: sign(deriveWebhookSecret('payments-gateway', 'gw-1')),
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
    },
  );

  it('fail-closed: una referencia a una variable conocida no sirve para forjar', async () => {
    process.env.NODE_ENV = 'test';
    const d = build({
      gatewayConnectionId: 'conn-a',
      conexiones: {
        'conn-a': { gatewayId: 'gw-1', webhookSecretRef: 'env:NODE_ENV' },
      },
    });

    await expect(
      d.service.applyCallback('gw', { ...body, signature: sign('test') }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('AC04 · una referencia que no lleva el prefijo del tenant dueño de la conexión se rechaza (secreto de otro tenant)', async () => {
    // La variable existe y es válida, pero pertenece al espacio de otro tenant.
    const otherPfx = 'WEBHOOK_SECRET_22222222222222222222222222222222_';
    process.env[`${otherPfx}TEST_A`] = SECRET_A;
    const d = build({
      gatewayConnectionId: 'conn-a',
      conexiones: {
        'conn-a': {
          gatewayId: 'gw-1',
          webhookSecretRef: `env:${otherPfx}TEST_A`,
        },
      },
    });

    await expect(
      d.service.applyCallback('gw', { ...body, signature: sign(SECRET_A) }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
  });

  it('AC04 · una referencia sin ningún prefijo de tenant (formato anterior) se rechaza', async () => {
    process.env.WEBHOOK_SECRET_LEGACY_A = SECRET_A;
    const d = build({
      gatewayConnectionId: 'conn-a',
      conexiones: {
        'conn-a': {
          gatewayId: 'gw-1',
          webhookSecretRef: 'env:WEBHOOK_SECRET_LEGACY_A',
        },
      },
    });

    await expect(
      d.service.applyCallback('gw', { ...body, signature: sign(SECRET_A) }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('AC04 · en una rotación todas las entradas deben ser del tenant', async () => {
    const d = build(
      twoConnections(`env:${PFX}TEST_A,env:WEBHOOK_SECRET_AJENO_A`),
    );

    await expect(
      d.service.applyCallback('gw', { ...body, signature: sign(SECRET_A) }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('AC04 · una conexión de otro tenant que la intención no autoriza la transacción', async () => {
    const d = build({
      gatewayConnectionId: 'conn-a',
      conexiones: {
        'conn-a': {
          gatewayId: 'gw-1',
          tenantId: OTHER_TENANT,
          webhookSecretRef: `env:${PFX}TEST_A`,
        },
      },
    });

    await expect(
      d.service.applyCallback('gw', { ...body, signature: sign(SECRET_A) }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
  });
});

describe('applyCallback · endpoint configurado (PAY-03)', () => {
  const previous = { ...process.env };
  beforeEach(() => {
    process.env[`${PFX}TEST_A`] = SECRET_A;
  });
  afterEach(() => {
    process.env = { ...previous };
  });

  const scenario = (endpoints: Array<Record<string, unknown>>): Scenario => ({
    gatewayConnectionId: 'conn-a',
    conexiones: {
      'conn-a': { gatewayId: 'gw-1', webhookSecretRef: `env:${PFX}TEST_A` },
    },
    endpoints,
  });
  const endpoint = (overrides: Record<string, unknown> = {}) => ({
    callbackPath: 'libelula',
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    allowedSourceCidrsJson: null,
    replayWindowSeconds: null,
    ...overrides,
  });
  const signedWithTimestamp = (timestamp: string) =>
    signPayload(
      SECRET_A,
      canonicalJson({ ...body, authorizationCode: undefined, timestamp }),
    );

  it('sin endpoints registrados para la conexión se conserva el comportamiento anterior', async () => {
    const d = build(scenario([]));

    await expect(
      d.service.applyCallback('cualquier-ruta', {
        ...body,
        signature: sign(SECRET_A),
      }),
    ).resolves.toMatchObject({ duplicate: false });
  });

  it('acepta la ruta de un endpoint activo de la conexión', async () => {
    const d = build(scenario([endpoint()]));

    await expect(
      d.service.applyCallback('libelula', {
        ...body,
        signature: sign(SECRET_A),
      }),
    ).resolves.toMatchObject({ duplicate: false });
    expect(d.transactionsRepo.findCallbackEndpoints).toHaveBeenCalledWith(
      expect.anything(),
      'conn-a',
    );
  });

  it('rechaza, con firma válida, una ruta que no es un endpoint de la conexión sin mutar nada', async () => {
    const d = build(scenario([endpoint()]));

    const attempt = d.service.applyCallback('otra-ruta', {
      ...body,
      signature: sign(SECRET_A),
    });

    await expect(attempt).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(attempt).rejects.toMatchObject({
      reason: PaymentsErrorReason.GATEWAY_CALLBACK_ENDPOINT_NOT_ALLOWED,
    });
    expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
    expect(d.transactionsRepo.recordWebhookEvent).not.toHaveBeenCalled();
  });

  it('rechaza un endpoint que no está activo', async () => {
    const d = build(
      scenario([endpoint({ stateConceptId: CONCEPTS.STATE_REVOKED })]),
    );

    await expect(
      d.service.applyCallback('libelula', {
        ...body,
        signature: sign(SECRET_A),
      }),
    ).rejects.toMatchObject({
      reason: PaymentsErrorReason.GATEWAY_CALLBACK_ENDPOINT_NOT_ALLOWED,
    });
  });

  it('exige que la IP de origen esté en las redes del endpoint', async () => {
    const restricted = scenario([
      endpoint({ allowedSourceCidrsJson: ['203.0.113.0/24', '2001:db8::/32'] }),
    ]);
    const call = (ip?: string) =>
      build(restricted).service.applyCallback(
        'libelula',
        { ...body, signature: sign(SECRET_A) },
        ip,
      );

    await expect(call('203.0.113.77')).resolves.toMatchObject({
      duplicate: false,
    });
    await expect(call('::ffff:203.0.113.77')).resolves.toMatchObject({
      duplicate: false,
    });
    await expect(call('2001:db8::1')).resolves.toMatchObject({
      duplicate: false,
    });
    for (const outside of [
      '198.51.100.9',
      '2001:db9::1',
      'no-es-ip',
      undefined,
    ]) {
      await expect(call(outside)).rejects.toMatchObject({
        reason: PaymentsErrorReason.GATEWAY_CALLBACK_SOURCE_NOT_ALLOWED,
      });
    }
  });

  it('una lista de redes mal formada falla cerrada', async () => {
    const d = build(
      scenario([endpoint({ allowedSourceCidrsJson: ['999.1.1.1/8'] })]),
    );

    await expect(
      d.service.applyCallback(
        'libelula',
        { ...body, signature: sign(SECRET_A) },
        '203.0.113.77',
      ),
    ).rejects.toMatchObject({
      reason: PaymentsErrorReason.GATEWAY_CALLBACK_SOURCE_NOT_ALLOWED,
    });
  });

  it('con ventana de repetición exige un timestamp firmado dentro de ella', async () => {
    const windowed = scenario([endpoint({ replayWindowSeconds: 300 })]);
    const fresh = new Date(Date.now() - 60_000).toISOString();
    const stale = new Date(Date.now() - 3_600_000).toISOString();

    await expect(
      build(windowed).service.applyCallback('libelula', {
        ...body,
        timestamp: fresh,
        signature: signedWithTimestamp(fresh),
      }),
    ).resolves.toMatchObject({ duplicate: false });

    await expect(
      build(windowed).service.applyCallback('libelula', {
        ...body,
        timestamp: stale,
        signature: signedWithTimestamp(stale),
      }),
    ).rejects.toMatchObject({
      reason: PaymentsErrorReason.GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW,
    });

    // Sin timestamp no puede demostrar su antigüedad.
    await expect(
      build(windowed).service.applyCallback('libelula', {
        ...body,
        signature: sign(SECRET_A),
      }),
    ).rejects.toMatchObject({
      reason: PaymentsErrorReason.GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW,
    });
  });

  it('el timestamp está firmado: cambiarlo invalida la firma', async () => {
    const windowed = scenario([endpoint({ replayWindowSeconds: 300 })]);
    const original = new Date(Date.now() - 3_600_000).toISOString();
    const forged = new Date().toISOString();

    await expect(
      build(windowed).service.applyCallback('libelula', {
        ...body,
        timestamp: forged,
        signature: signedWithTimestamp(original),
      }),
    ).rejects.toMatchObject({
      reason: PaymentsErrorReason.GATEWAY_WEBHOOK_SIGNATURE_INVALID,
    });
  });
});
