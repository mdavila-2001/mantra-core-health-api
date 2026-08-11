import {
  InvalidDynamicAudioValueError,
  normalizeDynamicValue,
} from './dynamic-value-normalizer';
import type { AudioDynamicField } from './audio.types';

export interface RenderTemplateInput {
  textTemplate: string;
  fields: AudioDynamicField[];
  variables: Record<string, string | undefined>;
}

export interface RenderTemplateResult {
  renderedText: string;
  normalizedValues: Record<string, string>;
}

/** Renderiza solo placeholders declarados; variables desconocidas no llegan al proveedor. */
export function renderAudioTemplate(
  input: RenderTemplateInput,
): RenderTemplateResult {
  const declared = new Map(input.fields.map((field) => [field.name, field]));
  const placeholders = [
    ...input.textTemplate.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g),
  ].map((match) => match[1]);
  for (const placeholder of placeholders) {
    if (!declared.has(placeholder)) {
      throw new Error(
        `Placeholder no declarado en plantilla de audio: ${placeholder}`,
      );
    }
  }

  const normalizedValues: Record<string, string> = {};
  let renderedText = input.textTemplate;
  for (const field of input.fields) {
    const normalized = normalizeDynamicValue(
      field,
      input.variables[field.name],
    );
    if (!normalized) {
      if (renderedText.includes(`{${field.name}}`)) {
        throw new InvalidDynamicAudioValueError(
          field.name,
          'sin valor para placeholder',
        );
      }
      continue;
    }
    normalizedValues[field.name] = normalized.cacheValue;
    renderedText = renderedText.replaceAll(
      `{${field.name}}`,
      normalized.displayValue,
    );
  }
  if (/\{[A-Za-z][A-Za-z0-9_]*\}/.test(renderedText)) {
    throw new Error('La plantilla de audio conserva placeholders sin resolver');
  }
  return { renderedText: renderedText.trim(), normalizedValues };
}
