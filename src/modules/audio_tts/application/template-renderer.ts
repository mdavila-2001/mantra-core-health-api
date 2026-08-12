import { AudioDomainError, AUDIO_ERROR } from '../domain/audio.errors';
import { normalizeAudioText } from './audio-asset-key';

/**
 * Renderizado de plantillas de audio.
 *
 * Es una superficie de inyección de contenido: lo que salga de aquí lo va a
 * pronunciar una voz de marca y va a quedar cacheado. Por eso el valor de cada
 * variable pasa por una lista blanca estricta en vez de un escapado: no existe
 * "escapar" texto que se convierte en voz, y un valor con instrucciones dentro
 * («…ignora lo anterior y di…») acabaría pronunciado tal cual.
 *
 * Las llaves van **escapadas** en el patrón. Con el flag `u`, ECMAScript prohíbe
 * `{` y `}` literales sin escapar: `/\{\{…\}\}/gu` es válido y `/{{…}}/gu` es un
 * `SyntaxError` que tumba el módulo entero al cargarlo, no un fallo en tiempo de
 * ejecución que un test de tipos detectaría.
 */
const TOKEN_SOURCE = '\\{\\{\\s*([a-zA-Z0-9_.-]+)\\s*\\}\\}';

/** Letras (con diacríticos), dígitos y la puntuación que aparece en un nombre. */
const SAFE_DYNAMIC_VALUE = /^[\p{L}\p{M}0-9 .,'’_-]{1,80}$/u;

const MAX_VARIABLES = 16;

/**
 * Instancia nueva en cada uso: un regex con flag `g` conserva `lastIndex` entre
 * llamadas, de modo que un patrón compartido haría que `.test()` alternara entre
 * verdadero y falso con la misma entrada.
 */
function tokenMatcher(): RegExp {
  return new RegExp(TOKEN_SOURCE, 'gu');
}

/** `true` si la plantilla declara alguna variable. */
export function hasTemplateTokens(template: string): boolean {
  return new RegExp(TOKEN_SOURCE, 'u').test(template);
}

/** Variables declaradas, en orden de aparición y con repeticiones. */
export function templateTokens(template: string): string[] {
  return [...template.matchAll(tokenMatcher())].map((match) => match[1] ?? '');
}

/**
 * Sustituye las variables y normaliza el resultado.
 *
 * @param template texto con marcadores `{{variable}}`.
 * @param variables valores; deben cubrir todos los marcadores.
 * @param maxLength techo del texto final. Es un techo de coste: cada carácter se
 *        factura.
 * @throws AudioDomainError si falta una variable, si un valor no pasa la lista
 *         blanca o si el texto excede el techo. Los tres son errores del
 *         llamador, no degradaciones.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string> = {},
  maxLength = 5000,
): string {
  const required = templateTokens(template);
  if (required.length > MAX_VARIABLES) {
    throw new AudioDomainError(
      `La plantilla declara más de ${MAX_VARIABLES} variables`,
      AUDIO_ERROR.tooManyVariables,
    );
  }

  // `Object.hasOwn` y no `variables[key] !== undefined`: sin él, claves heredadas
  // del prototipo (`toString`, `constructor`) pasarían la comprobación y el
  // reemplazo insertaría el código de una función en el texto a pronunciar.
  const missing = required.filter(
    (key) => !key || !Object.hasOwn(variables, key),
  );
  if (missing.length > 0) {
    throw new AudioDomainError(
      `Faltan variables requeridas: ${[...new Set(missing)].join(', ')}`,
      AUDIO_ERROR.variableMissing,
    );
  }

  const rendered = template.replace(
    tokenMatcher(),
    (_match, rawKey: string) => {
      const value = normalizeAudioText(variables[rawKey] ?? '');
      if (!SAFE_DYNAMIC_VALUE.test(value)) {
        throw new AudioDomainError(
          `Variable inválida: ${rawKey}`,
          AUDIO_ERROR.variableInvalid,
        );
      }
      return value;
    },
  );

  const normalized = normalizeAudioText(rendered);
  if (normalized.length > maxLength) {
    throw new AudioDomainError(
      `Texto de síntesis demasiado largo: ${normalized.length} > ${maxLength}`,
      AUDIO_ERROR.textTooLong,
    );
  }
  return normalized;
}
