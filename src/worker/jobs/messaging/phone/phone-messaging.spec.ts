import { jest } from '@jest/globals';
import {
  MOCK_PROVIDER_REF_PREFIX,
  MockPhoneMessagingChannel,
} from './mock-phone-messaging.channel';
import {
  loadPhoneMessagingConfig,
  selectPhoneMessagingChannel,
} from './phone-messaging.config';
import {
  TwilioPhoneMessagingChannel,
  type FetchLike,
} from './twilio-phone-messaging.channel';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function logger() {
  return { info: mockFn(), warn: mockFn(), error: mockFn() };
}

const MENSAJE = {
  toE164: '+59171234567',
  body: 'Alovida: confirmá https://app/vincular-tutor?token=SECRETO',
  reference: 'inv-1',
};

/** Ningún argumento de ninguna llamada al logger lleva el número ni el cuerpo. */
function sinDatosPersonales(log: ReturnType<typeof logger>): void {
  const todo = JSON.stringify([
    log.info.mock.calls,
    log.warn.mock.calls,
    log.error.mock.calls,
  ]);
  expect(todo).not.toContain('71234567');
  expect(todo).not.toContain('SECRETO');
}

describe('MockPhoneMessagingChannel (doble)', () => {
  it('correcto: fuera de producción registra, responde SENT con ref mock: y no loguea PHI', async () => {
    const log = logger();
    const canal = new MockPhoneMessagingChannel('SMS', log as any, false);

    const r = await canal.send(MENSAJE);

    expect(r.outcome).toBe('SENT');
    if (r.outcome !== 'SENT') throw new Error('esperaba SENT');
    expect(r.providerMessageRef.startsWith(MOCK_PROVIDER_REF_PREFIX)).toBe(
      true,
    );
    expect(canal.isReal).toBe(false);
    expect(canal.sent()).toEqual([
      expect.objectContaining({ reference: 'inv-1', channel: 'SMS' }),
    ]);
    expect(JSON.stringify(canal.sent())).not.toContain('71234567');
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ simulated: true }),
      expect.any(String),
    );
    sinDatosPersonales(log);
  });

  it('límite: en producción NO finge éxito (FAILED, no reintentable)', async () => {
    const log = logger();
    const canal = new MockPhoneMessagingChannel('WHATSAPP', log as any, true);

    await expect(canal.send(MENSAJE)).resolves.toEqual({
      outcome: 'FAILED',
      errorCode: 'PROVIDER_NOT_CONFIGURED',
      retryable: false,
    });
    expect(canal.sent()).toEqual([]);
    sinDatosPersonales(log);
  });
});

describe('TwilioPhoneMessagingChannel (contrato contra fetch doble)', () => {
  const config = {
    accountSid: 'AC123',
    authToken: 'tok',
    from: '+15005550006',
    baseUrl: 'https://twilio.test',
  };

  function fetchQueResponde(status: number, json: unknown) {
    return mockFn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => json,
    })) as FetchLike & { mock: any };
  }

  it('correcto: SMS arma POST form con To/From/Body y Basic auth; devuelve el sid', async () => {
    const fetchFn = fetchQueResponde(201, { sid: 'SM1', status: 'queued' });
    const canal = new TwilioPhoneMessagingChannel('SMS', config, fetchFn);

    await expect(canal.send(MENSAJE)).resolves.toEqual({
      outcome: 'SENT',
      providerMessageRef: 'SM1',
    });

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(
      'https://twilio.test/2010-04-01/Accounts/AC123/Messages.json',
    );
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(
      `Basic ${Buffer.from('AC123:tok').toString('base64')}`,
    );
    const form = new URLSearchParams(init.body);
    expect(form.get('To')).toBe('+59171234567');
    expect(form.get('From')).toBe('+15005550006');
    expect(form.get('Body')).toBe(MENSAJE.body);
  });

  it('correcto: WhatsApp antepone whatsapp: a To y From', async () => {
    const fetchFn = fetchQueResponde(201, { sid: 'SM2' });
    const canal = new TwilioPhoneMessagingChannel('WHATSAPP', config, fetchFn);
    await canal.send(MENSAJE);
    const form = new URLSearchParams(fetchFn.mock.calls[0][1].body);
    expect(form.get('To')).toBe('whatsapp:+59171234567');
    expect(form.get('From')).toBe('whatsapp:+15005550006');
  });

  it('límite: 429 y 5xx son reintentables; la red caída también', async () => {
    for (const status of [429, 500, 503]) {
      const canal = new TwilioPhoneMessagingChannel(
        'SMS',
        config,
        fetchQueResponde(status, {}),
      );
      const r = await canal.send(MENSAJE);
      expect(r).toMatchObject({ outcome: 'FAILED', retryable: true });
    }
    const caida = new TwilioPhoneMessagingChannel(
      'SMS',
      config,
      mockFn(async () => {
        throw new Error('ECONNRESET');
      }),
    );
    await expect(caida.send(MENSAJE)).resolves.toEqual({
      outcome: 'FAILED',
      errorCode: 'TWILIO_NETWORK',
      retryable: true,
    });
  });

  it('inválido: 400 con código de Twilio es definitivo y el código no copia el mensaje', async () => {
    const canal = new TwilioPhoneMessagingChannel(
      'SMS',
      config,
      fetchQueResponde(400, {
        code: 21211,
        message: "The 'To' number +59171234567 is not a valid phone number.",
      }),
    );
    const r = await canal.send(MENSAJE);
    expect(r).toEqual({
      outcome: 'FAILED',
      errorCode: 'TWILIO_HTTP_400_21211',
      retryable: false,
    });
  });

  it('inválido: 2xx sin sid no se da por enviado', async () => {
    const canal = new TwilioPhoneMessagingChannel(
      'SMS',
      config,
      fetchQueResponde(201, {}),
    );
    await expect(canal.send(MENSAJE)).resolves.toMatchObject({
      outcome: 'FAILED',
      errorCode: 'TWILIO_MALFORMED_RESPONSE',
    });
  });
});

describe('loadPhoneMessagingConfig + selectPhoneMessagingChannel', () => {
  it('correcto: con SID, token y remitente del canal se activa Twilio y lo dice', () => {
    const log = logger();
    const config = loadPhoneMessagingConfig({
      TWILIO_ACCOUNT_SID: 'AC1',
      TWILIO_AUTH_TOKEN: 't',
      TWILIO_SMS_FROM: '+15005550006',
    });
    const canal = selectPhoneMessagingChannel(config, log as any);
    expect(canal).toBeInstanceOf(TwilioPhoneMessagingChannel);
    expect(canal.isReal).toBe(true);
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'twilio' }),
      expect.any(String),
    );
  });

  it('límite: sin credenciales usa el doble y lo deja escrito al arrancar', () => {
    const log = logger();
    const canal = selectPhoneMessagingChannel(
      loadPhoneMessagingConfig({}),
      log as any,
    );
    expect(canal).toBeInstanceOf(MockPhoneMessagingChannel);
    expect(canal.channel).toBe('SMS');
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'mock' }),
      expect.stringContaining('SIMULADO'),
    );
  });

  it('límite: credenciales de SMS no activan WhatsApp (falta su remitente)', () => {
    const log = logger();
    const config = loadPhoneMessagingConfig({
      PHONE_CHANNEL: 'whatsapp',
      TWILIO_ACCOUNT_SID: 'AC1',
      TWILIO_AUTH_TOKEN: 't',
      TWILIO_SMS_FROM: '+15005550006',
    });
    expect(config.incomplete).toEqual(['TWILIO_WHATSAPP_FROM']);
    const canal = selectPhoneMessagingChannel(config, log as any);
    expect(canal).toBeInstanceOf(MockPhoneMessagingChannel);
    expect(canal.channel).toBe('WHATSAPP');
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ missing: ['TWILIO_WHATSAPP_FROM'] }),
      expect.any(String),
    );
  });

  it('límite: en producción sin credenciales el aviso de arranque dice que no sale nada', () => {
    const log = logger();
    selectPhoneMessagingChannel(
      loadPhoneMessagingConfig({ NODE_ENV: 'production' }),
      log as any,
    );
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ production: true }),
      expect.stringContaining('PROVIDER_NOT_CONFIGURED'),
    );
  });

  it('inválido: un canal desconocido aborta', () => {
    expect(() =>
      loadPhoneMessagingConfig({ PHONE_CHANNEL: 'TELEGRAM' }),
    ).toThrow(/PHONE_CHANNEL/);
  });
});
