import type { AudioDynamicField, NormalizedDynamicValue } from './audio.types';

function hasControlChars(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
}
const HTML_LIKE = /<[^>]*>/u;
const URL_LIKE = /(?:https?:\/\/|www\.)/iu;
const EMAIL_LIKE = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/u;
const TOKEN_LIKE = /\b(?:bearer|sk-|eyJ)[A-Za-z0-9._-]{10,}/u;
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u;
const SAFE_TEXT = /^[\p{L}\p{M}\p{N}\s'’.,&()/-]+$/u;

export class InvalidDynamicAudioValueError extends Error {
  constructor(
    readonly field: string,
    readonly reason: string,
  ) {
    super(`Valor dinámico inválido para ${field}: ${reason}`);
  }
}

/** Normaliza y valida únicamente datos explícitamente autorizados para TTS. */
export function normalizeDynamicValue(
  field: AudioDynamicField,
  rawValue: string | undefined,
): NormalizedDynamicValue | undefined {
  if (rawValue === undefined || rawValue.trim() === '') {
    if (field.required)
      throw new InvalidDynamicAudioValueError(field.name, 'requerido');
    return undefined;
  }
  const compact = rawValue.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  const maxLength =
    field.maxLength ?? (field.type === 'PERSON_NAME' ? 60 : 120);
  if (compact.length > maxLength) {
    throw new InvalidDynamicAudioValueError(field.name, 'longitud excedida');
  }
  if (
    hasControlChars(compact) ||
    HTML_LIKE.test(compact) ||
    URL_LIKE.test(compact) ||
    EMAIL_LIKE.test(compact) ||
    TOKEN_LIKE.test(compact)
  ) {
    throw new InvalidDynamicAudioValueError(
      field.name,
      'contenido no permitido',
    );
  }

  const displayValue = normalizeByKind(field, compact);
  return {
    displayValue,
    cacheValue: displayValue.toLocaleLowerCase('es'),
  };
}

function normalizeByKind(field: AudioDynamicField, value: string): string {
  switch (field.type) {
    case 'PERSON_NAME':
      if (!PERSON_NAME.test(value)) {
        throw new InvalidDynamicAudioValueError(field.name, 'nombre no válido');
      }
      return titleCaseName(value);
    case 'SAFE_TEXT':
      if (!SAFE_TEXT.test(value)) {
        throw new InvalidDynamicAudioValueError(
          field.name,
          'texto no permitido',
        );
      }
      return value;
    case 'ENUM': {
      const allowed = field.allowedValues ?? [];
      const match = allowed.find(
        (item) =>
          item.toLocaleLowerCase('es') === value.toLocaleLowerCase('es'),
      );
      if (!match)
        throw new InvalidDynamicAudioValueError(
          field.name,
          'fuera del catálogo',
        );
      return match;
    }
  }
}

function titleCaseName(value: string): string {
  return value
    .toLocaleLowerCase('es')
    .split(' ')
    .map((part) =>
      part.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase('es')),
    )
    .join(' ');
}
