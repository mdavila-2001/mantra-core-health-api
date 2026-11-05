import {
  carrierSignedString,
  carrierWebhookSecrets,
  normalizeCarrierSignature,
} from './tracking-webhook-auth';

const SECRET = 's'.repeat(40);

describe('carrierWebhookSecrets', () => {
  it('lee el secreto propio del transportista del entorno', () => {
    expect(
      carrierWebhookSecrets('DHL_EC', {
        WEBHOOK_SECRET_CARRIER_DHL_EC: SECRET,
      }),
    ).toEqual([SECRET]);
  });

  it('el mapeo es inyectivo: un código con otro formato no comparte variable con ninguno', () => {
    const env = { WEBHOOK_SECRET_CARRIER_DHL_EC: SECRET };
    expect(carrierWebhookSecrets('dhl-ec', env)).toBeNull();
    expect(carrierWebhookSecrets('dhl_ec', env)).toBeNull();
    expect(carrierWebhookSecrets('DHL-EC', env)).toBeNull();
    expect(carrierWebhookSecrets('DHL EC', env)).toBeNull();
  });

  it('devuelve el nuevo y el anterior durante una rotación', () => {
    const prev = 'p'.repeat(40);
    expect(
      carrierWebhookSecrets('DHL', {
        WEBHOOK_SECRET_CARRIER_DHL: SECRET,
        WEBHOOK_SECRET_CARRIER_DHL_PREV: prev,
      }),
    ).toEqual([SECRET, prev]);
  });

  it('es fail-closed: sin variable, con secreto corto o con rotación incompleta no hay secreto', () => {
    expect(carrierWebhookSecrets('DHL', {})).toBeNull();
    expect(
      carrierWebhookSecrets('DHL', { WEBHOOK_SECRET_CARRIER_DHL: 'corto' }),
    ).toBeNull();
    expect(
      carrierWebhookSecrets('DHL', {
        WEBHOOK_SECRET_CARRIER_DHL: SECRET,
        WEBHOOK_SECRET_CARRIER_DHL_PREV: 'corto',
      }),
    ).toBeNull();
  });

  it('un código que no cabe en el nombre de la variable no autentica', () => {
    expect(carrierWebhookSecrets('x'.repeat(41), {})).toBeNull();
    expect(carrierWebhookSecrets('', {})).toBeNull();
  });

  it('no cae al secreto de otro transportista ni a la raíz derivada', () => {
    expect(
      carrierWebhookSecrets('FEDEX', {
        WEBHOOK_SECRET_CARRIER_DHL: SECRET,
        WEBHOOK_SIGNING_KEY: SECRET,
      }),
    ).toBeNull();
  });
});

describe('normalizeCarrierSignature', () => {
  const hex = 'ab'.repeat(32);

  it('acepta 64 hex con o sin prefijo y la lleva a minúsculas', () => {
    expect(normalizeCarrierSignature(hex)).toBe(hex);
    expect(normalizeCarrierSignature(`sha256=${hex.toUpperCase()}`)).toBe(hex);
  });

  it.each([undefined, null, '', 'abc', `md5=${hex}`, `${hex}00`, `x=${hex}`])(
    'rechaza %p',
    (raw) => {
      expect(normalizeCarrierSignature(raw)).toBeNull();
    },
  );
});

describe('carrierSignedString', () => {
  const fields = {
    trackingNumber: 'ABC',
    externalStatusCode: 'DELIVERED',
    externalEventId: 'e1',
  };

  it('es un arreglo JSON con la marca de tiempo y todos los campos del evento', () => {
    expect(carrierSignedString('1700', 'DHL', fields)).toBe(
      '["1700","DHL","ABC","DELIVERED","e1",null,null]',
    );
  });

  it('un valor no puede desplazar la frontera de otro', () => {
    const a = carrierSignedString('1', 'DHL', {
      ...fields,
      trackingNumber: 'A\nB',
      externalStatusCode: 'C',
    });
    const b = carrierSignedString('1', 'DHL', {
      ...fields,
      trackingNumber: 'A',
      externalStatusCode: 'B\nC',
    });
    expect(a).not.toBe(b);
  });
});
