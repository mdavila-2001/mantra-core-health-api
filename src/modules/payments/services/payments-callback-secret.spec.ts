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

/**
 * MCH-019 · el callback del gateway se verifica con el secreto de la conexión
 * configurada (`gateway_connections.webhook_secret_ref`), no con uno derivado
 * por gateway desde una raíz compartida.
 *
 * Fail-closed: sin conexión, sin referencia, con una referencia que no resuelve
 * o con una conexión de otro gateway, el callback se rechaza sin tocar estado.
 */

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const SECRETO_A = 'a'.repeat(40);
const SECRETO_A_NUEVO = 'n'.repeat(40);
const SECRETO_B = 'b'.repeat(40);

interface Escenario {
  /** Conexión que referencia la intención (o ninguna). */
  gatewayConnectionId?: string;
  /** Conexiones existentes por id. */
  conexiones: Record<
    string,
    { gatewayId: string; webhookSecretRef?: string | null }
  >;
}

/** Arma el servicio con una transacción PROCESSING del gateway `gw-1`. */
function build(esc: Escenario) {
  const transaction = {
    id: 'txn-1',
    gatewayId: 'gw-1',
    paymentIntentId: 'intent-1',
    statusConceptId: CONCEPTS.TXN_PROCESSING,
  };
  const intent = {
    id: 'intent-1',
    gatewayId: 'gw-1',
    gatewayConnectionId: esc.gatewayConnectionId,
    statusConceptId: CONCEPTS.PI_PROCESSING,
  };
  const tx = {
    flush: mockFn(),
    findOne: mockFn((entity: unknown, where: { id: string }) => {
      if (entity === PaymentIntents)
        return Promise.resolve(where.id === intent.id ? intent : null);
      if (entity === GatewayConnections) {
        const c = esc.conexiones[where.id];
        return Promise.resolve(c ? { id: where.id, ...c } : null);
      }
      return Promise.resolve(null);
    }),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const intentsRepo = { findByIdForUpdate: mockFn(() => intent) };
  const transactionsRepo = {
    findByGatewayRef: mockFn(() => Promise.resolve(transaction)),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PaymentsTransactionsService(
    em as any,
    intentsRepo as any,
    {} as any,
    transactionsRepo as any,
    logger as any,
  );
  return { service, transaction, intent, logger };
}

const cuerpo = {
  gatewayTransactionRef: 'ref-1',
  outcome: 'CAPTURED' as const,
};

/** Firma el callback como lo haría el proveedor con el secreto dado. */
function firmar(secret: string): string {
  return signPayload(
    secret,
    canonicalJson({ ...cuerpo, authorizationCode: undefined }),
  );
}

describe('applyCallback · secreto por conexión (MCH-019)', () => {
  const previo = { ...process.env };
  beforeEach(() => {
    process.env.WEBHOOK_SECRET_TEST_A = SECRETO_A;
    process.env.WEBHOOK_SECRET_TEST_A_V2 = SECRETO_A_NUEVO;
    process.env.WEBHOOK_SECRET_TEST_B = SECRETO_B;
  });
  afterEach(() => {
    process.env = { ...previo };
  });

  const dosConexiones = (refA: string): Escenario => ({
    gatewayConnectionId: 'conn-a',
    conexiones: {
      'conn-a': { gatewayId: 'gw-1', webhookSecretRef: refA },
      'conn-b': {
        gatewayId: 'gw-1',
        webhookSecretRef: 'env:WEBHOOK_SECRET_TEST_B',
      },
    },
  });

  it('acepta la firma hecha con el secreto de la conexión configurada', async () => {
    const d = build(dosConexiones('env:WEBHOOK_SECRET_TEST_A'));

    const res = await d.service.applyCallback('gw', {
      ...cuerpo,
      signature: firmar(SECRETO_A),
    });

    expect(res.duplicate).toBe(false);
    expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_CAPTURED);
  });

  it('rechaza la firma del esquema derivado por gateway cuando la conexión tiene su secreto', async () => {
    const d = build(dosConexiones('env:WEBHOOK_SECRET_TEST_A'));

    await expect(
      d.service.applyCallback('gw', {
        ...cuerpo,
        signature: firmar(deriveWebhookSecret('payments-gateway', 'gw-1')),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
  });

  it('AC03 · una firma de otra conexión no autoriza la transacción', async () => {
    const d = build(dosConexiones('env:WEBHOOK_SECRET_TEST_A'));

    await expect(
      d.service.applyCallback('gw', {
        ...cuerpo,
        signature: firmar(SECRETO_B),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(d.transaction.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
  });

  it('AC02 · rotación: durante la ventana valen ambas versiones; después sólo la nueva', async () => {
    const ventana = build(
      dosConexiones('env:WEBHOOK_SECRET_TEST_A_V2,env:WEBHOOK_SECRET_TEST_A'),
    );
    await expect(
      ventana.service.applyCallback('gw', {
        ...cuerpo,
        signature: firmar(SECRETO_A),
      }),
    ).resolves.toMatchObject({ duplicate: false });

    const rotada = build(dosConexiones('env:WEBHOOK_SECRET_TEST_A_V2'));
    await expect(
      rotada.service.applyCallback('gw', {
        ...cuerpo,
        signature: firmar(SECRETO_A),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      rotada.service.applyCallback('gw', {
        ...cuerpo,
        signature: firmar(SECRETO_A_NUEVO),
      }),
    ).resolves.toMatchObject({ duplicate: false });
  });

  it('AC02 · rotar una conexión no afecta a las demás', async () => {
    // La intención apunta a conn-b; conn-a se rotó. conn-b sigue con su secreto.
    const d = build({
      ...dosConexiones('env:WEBHOOK_SECRET_TEST_A_V2'),
      gatewayConnectionId: 'conn-b',
    });

    await expect(
      d.service.applyCallback('gw', {
        ...cuerpo,
        signature: firmar(SECRETO_B),
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
            webhookSecretRef: 'env:WEBHOOK_SECRET_TEST_A',
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
            webhookSecretRef: 'env:WEBHOOK_SECRET_NO_EXISTE',
          },
        },
      },
    ],
  ] as Array<[string, Escenario]>)(
    'fail-closed: rechaza aunque la firma sea del esquema anterior cuando %s',
    async (_caso, esc) => {
      const d = build(esc);

      await expect(
        d.service.applyCallback('gw', {
          ...cuerpo,
          signature: firmar(deriveWebhookSecret('payments-gateway', 'gw-1')),
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
      d.service.applyCallback('gw', { ...cuerpo, signature: firmar('test') }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
