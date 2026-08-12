import {
  hasTemplateTokens,
  renderTemplate,
  templateTokens,
} from './template-renderer';
import { AUDIO_ERROR, AudioDomainError } from '../domain/audio.errors';

/**
 * El primer caso no es ceremonia: en la versión desacoplada del worker este
 * módulo llevaba un regex con llaves sin escapar y flag `u`, que es un
 * `SyntaxError` de JavaScript — el módulo no se podía ni cargar, y con él caía
 * todo el flujo de resolución. Un test de tipos no lo detecta; ejecutar el patrón,
 * sí.
 */
describe('template-renderer', () => {
  it('carga el patrón de variables en runtime (las llaves van escapadas)', () => {
    expect(hasTemplateTokens('Hola, {{name}}')).toBe(true);
    expect(hasTemplateTokens('Hola')).toBe(false);
    expect(templateTokens('{{a}} y {{ b }}')).toEqual(['a', 'b']);
  });

  it('sustituye las variables y normaliza espacios y forma Unicode', () => {
    expect(
      renderTemplate('Bienvenido, {{name}}.', { name: '  María   José ' }),
    ).toBe('Bienvenido, María José.');
  });

  it('devuelve el texto tal cual cuando la plantilla no tiene variables', () => {
    expect(renderTemplate('Bienvenido.')).toBe('Bienvenido.');
  });

  it('rechaza una variable que la plantilla exige y el llamador no envió', () => {
    expect(() => renderTemplate('Hola, {{name}}', {})).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.variableMissing }),
    );
  });

  it('no acepta claves heredadas del prototipo como si fueran variables', () => {
    // Sin `Object.hasOwn`, `toString` pasaría la comprobación de presencia y el
    // reemplazo insertaría el código de una función en el texto a pronunciar.
    expect(() => renderTemplate('Hola, {{toString}}', {})).toThrow(
      AudioDomainError,
    );
  });

  it('rechaza un valor con caracteres fuera de la lista blanca', () => {
    // No existe "escapar" texto que se convierte en voz: un valor con
    // instrucciones dentro acabaría pronunciado tal cual.
    expect(() =>
      renderTemplate('Hola, {{name}}', { name: '<script>alert(1)</script>' }),
    ).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.variableInvalid }),
    );
  });

  it('acepta nombres con diacríticos, apóstrofos y guiones', () => {
    expect(renderTemplate('{{name}}', { name: "Ñuño O'Higgins-Peña" })).toBe(
      "Ñuño O'Higgins-Peña",
    );
  });

  it('rechaza un texto que supera el techo de coste', () => {
    expect(() =>
      renderTemplate('{{name}}', { name: 'a'.repeat(80) }, 16),
    ).toThrow(expect.objectContaining({ audioCode: AUDIO_ERROR.textTooLong }));
  });

  it('rechaza una plantilla con más variables de las admitidas', () => {
    const template = Array.from({ length: 17 }, (_, i) => `{{v${i}}}`).join(
      ' ',
    );
    const variables = Object.fromEntries(
      Array.from({ length: 17 }, (_, i) => [`v${i}`, 'x']),
    );
    expect(() => renderTemplate(template, variables)).toThrow(
      expect.objectContaining({ audioCode: AUDIO_ERROR.tooManyVariables }),
    );
  });

  it('no arrastra estado entre llamadas del comprobador de variables', () => {
    // Un regex con flag `g` compartido conserva `lastIndex`, de modo que `.test()`
    // alternaría entre true y false con la misma entrada.
    expect(hasTemplateTokens('{{a}}')).toBe(true);
    expect(hasTemplateTokens('{{a}}')).toBe(true);
  });
});
