import {
  EventPropertyRejection,
  validateEventProperties,
  type EventSchemaPolicy,
  type PropertyRule,
} from './event-property-policy';

const schema = (over: Partial<EventSchemaPolicy> = {}): EventSchemaPolicy => ({
  eventName: 'screen_view',
  propertySchemaJson: {
    type: 'object',
    properties: {
      screen_name: { type: 'string', maxLength: 20 },
      step: { type: 'integer', minimum: 1, maximum: 10 },
      is_new: { type: 'boolean' },
      channel: { type: 'string', enum: ['web', 'app'] },
      note: { type: 'string', phi: true },
      region: { type: 'string', forward: false },
    },
  },
  phiAllowed: false,
  ...over,
});

const rule = (fn: () => unknown): PropertyRule | undefined => {
  try {
    fn();
  } catch (error) {
    if (error instanceof EventPropertyRejection) return error.rule;
    throw error;
  }
  return undefined;
};

describe('validateEventProperties (TEL-03)', () => {
  it('Correcto: acepta la propiedad declarada con su tipo', () => {
    expect(
      validateEventProperties(schema(), [
        { propertyName: 'screen_name', valueString: 'home' },
      ]),
    ).toEqual([
      {
        propertyName: 'screen_name',
        valueType: 'STRING',
        valueString: 'home',
        sensitive: false,
        forwardable: true,
      },
    ]);
  });

  it('sin propiedades no hay nada que validar', () => {
    expect(validateEventProperties(schema(), undefined)).toEqual([]);
    expect(validateEventProperties(schema(), [])).toEqual([]);
  });

  it('Límite: el valor en la longitud máxima exacta pasa y uno más no', () => {
    expect(
      validateEventProperties(schema(), [
        { propertyName: 'screen_name', valueString: 'a'.repeat(20) },
      ]),
    ).toHaveLength(1);
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          { propertyName: 'screen_name', valueString: 'a'.repeat(21) },
        ]),
      ),
    ).toBe('VALUE_OUT_OF_RANGE');
  });

  it('Límite: mínimo y máximo numéricos son inclusivos', () => {
    for (const n of [1, 10]) {
      expect(
        validateEventProperties(schema(), [
          { propertyName: 'step', valueNumber: n },
        ]),
      ).toHaveLength(1);
    }
    for (const n of [0, 11, 1.5]) {
      expect(
        rule(() =>
          validateEventProperties(schema(), [
            { propertyName: 'step', valueNumber: n },
          ]),
        ),
      ).toBeDefined();
    }
  });

  it('Error: una clave no declarada en el esquema se rechaza', () => {
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          { propertyName: 'otra', valueString: 'x' },
        ]),
      ),
    ).toBe('NOT_DECLARED');
  });

  it('Error: un esquema sin properties no admite ninguna propiedad', () => {
    expect(
      rule(() =>
        validateEventProperties(
          schema({ propertySchemaJson: { type: 'object' } }),
          [{ propertyName: 'screen_name', valueString: 'x' }],
        ),
      ),
    ).toBe('NOT_DECLARED');
    expect(
      rule(() =>
        validateEventProperties(schema({ propertySchemaJson: null }), [
          { propertyName: 'screen_name', valueString: 'x' },
        ]),
      ),
    ).toBe('NOT_DECLARED');
  });

  it('Error: email se rechaza por nombre aunque el esquema lo declare', () => {
    const s = schema({
      propertySchemaJson: {
        properties: {
          email: { type: 'string' },
          patientEmail: { type: 'string' },
        },
      },
    });
    expect(
      rule(() =>
        validateEventProperties(s, [
          { propertyName: 'email', valueString: 'x' },
        ]),
      ),
    ).toBe('PROHIBITED_NAME');
    expect(
      rule(() =>
        validateEventProperties(s, [
          { propertyName: 'patientEmail', valueString: 'x' },
        ]),
      ),
    ).toBe('PROHIBITED_NAME');
  });

  it('screen_name no se rechaza por contener «name»', () => {
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          { propertyName: 'screen_name', valueString: 'home' },
        ]),
      ),
    ).toBeUndefined();
  });

  it('Error: un valor con forma de correo o de documento se rechaza', () => {
    for (const value of ['persona@example.test', '12345678']) {
      expect(
        rule(() =>
          validateEventProperties(schema(), [
            { propertyName: 'screen_name', valueString: value },
          ]),
        ),
      ).toBe('PROHIBITED_VALUE');
    }
  });

  it('Falla catalogada: PHI declarado con phiAllowed=false se rechaza', () => {
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          { propertyName: 'note', valueString: 'dolor' },
        ]),
      ),
    ).toBe('PHI_NOT_ALLOWED');
  });

  it('con phiAllowed=true admite lo marcado phi, pero nunca lo reenvía', () => {
    const [p] = validateEventProperties(schema({ phiAllowed: true }), [
      { propertyName: 'note', valueString: 'dolor' },
    ]);
    expect(p).toMatchObject({ sensitive: true, forwardable: false });
  });

  it('forward:false mantiene la propiedad fuera del reenvío', () => {
    const [p] = validateEventProperties(schema(), [
      { propertyName: 'region', valueString: 'sc' },
    ]);
    expect(p.forwardable).toBe(false);
  });

  it('Error: el tipo del valor debe coincidir con el declarado', () => {
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          { propertyName: 'screen_name', valueNumber: 3 },
        ]),
      ),
    ).toBe('TYPE_MISMATCH');
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          { propertyName: 'is_new', valueString: 'true' },
        ]),
      ),
    ).toBe('TYPE_MISMATCH');
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          { propertyName: 'screen_name', valueString: 'a', valueNumber: 1 },
        ]),
      ),
    ).toBe('TYPE_MISMATCH');
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          {
            propertyName: 'screen_name',
            valueType: 'NUMBER',
            valueString: 'a',
          },
        ]),
      ),
    ).toBe('TYPE_MISMATCH');
  });

  it('el enum restringe los valores', () => {
    expect(
      validateEventProperties(schema(), [
        { propertyName: 'channel', valueString: 'web' },
      ]),
    ).toHaveLength(1);
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          { propertyName: 'channel', valueString: 'fax' },
        ]),
      ),
    ).toBe('VALUE_OUT_OF_RANGE');
  });

  it('una propiedad repetida se rechaza', () => {
    expect(
      rule(() =>
        validateEventProperties(schema(), [
          { propertyName: 'step', valueNumber: 1 },
          { propertyName: 'step', valueNumber: 2 },
        ]),
      ),
    ).toBe('DUPLICATE');
  });

  it('los patrones prohibidos del propio esquema se aplican', () => {
    const s = schema({
      prohibitedPropertyPatternsJson: {
        names: ['channel'],
        namePatterns: ['^region_'],
        valuePatterns: ['^secreto'],
      },
      propertySchemaJson: {
        properties: {
          channel: { type: 'string' },
          region_x: { type: 'string' },
          screen_name: { type: 'string' },
        },
      },
    });
    expect(
      rule(() =>
        validateEventProperties(s, [
          { propertyName: 'channel', valueString: 'a' },
        ]),
      ),
    ).toBe('PROHIBITED_NAME');
    expect(
      rule(() =>
        validateEventProperties(s, [
          { propertyName: 'region_x', valueString: 'a' },
        ]),
      ),
    ).toBe('PROHIBITED_NAME');
    expect(
      rule(() =>
        validateEventProperties(s, [
          { propertyName: 'screen_name', valueString: 'secreto-1' },
        ]),
      ),
    ).toBe('PROHIBITED_VALUE');
  });

  it('un esquema mal formado cierra en lugar de abrir', () => {
    expect(
      rule(() =>
        validateEventProperties(
          schema({ prohibitedPropertyPatternsJson: { valuePatterns: ['('] } }),
          [{ propertyName: 'screen_name', valueString: 'a' }],
        ),
      ),
    ).toBe('SCHEMA_INVALID');
    expect(
      rule(() =>
        validateEventProperties(
          schema({
            propertySchemaJson: { properties: { x: { type: 'blob' } } },
          }),
          [{ propertyName: 'x', valueString: 'a' }],
        ),
      ),
    ).toBe('SCHEMA_INVALID');
  });

  it('el rechazo no lleva el nombre ni el valor de la propiedad', () => {
    try {
      validateEventProperties(schema(), [
        { propertyName: 'diagnostico', valueString: 'cancer-de-mama' },
      ]);
      throw new Error('debía rechazar');
    } catch (error) {
      const text = JSON.stringify([
        (error as Error).message,
        (error as Error).stack?.split('\n')[0],
      ]);
      expect(text).not.toContain('diagnostico');
      expect(text).not.toContain('cancer');
    }
  });
});
