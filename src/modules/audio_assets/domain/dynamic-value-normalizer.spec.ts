import { InvalidDynamicAudioValueError, normalizeDynamicValue } from './dynamic-value-normalizer';

const personField = { name: 'preferredName', type: 'PERSON_NAME' as const, required: false, maxLength: 60 };

describe('normalizeDynamicValue', () => {
  it('normaliza nombres equivalentes a la misma cacheValue', () => {
    expect(normalizeDynamicValue(personField, '  PABLO  ')).toEqual({ displayValue: 'Pablo', cacheValue: 'pablo' });
    expect(normalizeDynamicValue(personField, 'Pablo')?.cacheValue).toBe('pablo');
  });

  it.each(['pablo@example.com', 'https://example.com', '<b>Pablo</b>', 'eyJ0123456789.token'])('rechaza datos inseguros: %s', (value) => {
    expect(() => normalizeDynamicValue(personField, value)).toThrow(InvalidDynamicAudioValueError);
  });

  it('preserva acentos válidos', () => {
    expect(normalizeDynamicValue(personField, 'josé maría')?.displayValue).toBe('José María');
  });
});
