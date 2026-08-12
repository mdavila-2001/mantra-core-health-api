import { createHash } from 'node:crypto';

/**
 * Identidad de un audio: todo lo que, si cambia, produce un audio distinto.
 *
 * Incluir el tenant no es simetría con el resto del modelo, es aislamiento: sin
 * él, dos tenants que saludan a una persona con el mismo nombre compartirían la
 * misma fila, y un acierto de caché sería la prueba de que ese nombre existe en
 * el otro tenant. Los audios compartidos (sin variables) pasan `tenantId`
 * indefinido a propósito y así se cachean una sola vez para toda la plataforma.
 */
export interface AudioAssetIdentity {
  templateCode: string;
  templateVersion: number;
  renderedText: string;
  language: string;
  provider: string;
  model: string;
  voiceProfile: string;
  voiceVersion: number;
  providerVoiceRef: string;
  outputFormat: string;
  sampleRate: number;
  tenantId?: string;
}

/**
 * Normaliza el texto antes de que entre en la clave.
 *
 * `NFKC` unifica las formas Unicode equivalentes y el colapso de espacios evita
 * que `"Hola  María"` y `"Hola María"` se paguen dos veces. Se aplica también al
 * texto que se envía al proveedor, de modo que la clave describe exactamente lo
 * que se sintetizó.
 */
export function normalizeAudioText(value: string): string {
  return value.normalize('NFKC').replace(/\s+/gu, ' ').trim();
}

/**
 * Huella SHA-256 de la identidad completa.
 *
 * Se serializa con un orden de campos **fijo y explícito** en lugar de volcar el
 * objeto: `JSON.stringify` respeta el orden de inserción, así que reordenar las
 * propiedades de la interfaz cambiaría todas las claves y dejaría huérfana la
 * caché entera sin que ningún test lo notara.
 */
export function buildAudioAssetKey(input: AudioAssetIdentity): string {
  const canonical = JSON.stringify({
    templateCode: input.templateCode,
    templateVersion: input.templateVersion,
    renderedText: normalizeAudioText(input.renderedText),
    language: input.language.toLowerCase(),
    provider: input.provider,
    model: input.model,
    voiceProfile: input.voiceProfile,
    voiceVersion: input.voiceVersion,
    providerVoiceRef: input.providerVoiceRef,
    outputFormat: input.outputFormat,
    sampleRate: input.sampleRate,
    tenantId: input.tenantId ?? null,
  });
  return createHash('sha256').update(canonical).digest('hex');
}
