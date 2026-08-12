import { createHash } from 'node:crypto';
import type { AudioSynthesisProfile } from './audio.types';

export interface BuildAudioAssetKeyInput extends AudioSynthesisProfile {
  templateId: string;
  templateVersion: number;
  normalizedText: string;
  variant: 'PRIMARY' | 'FALLBACK';
  /**
   * Tenant propietario, o `undefined` cuando el audio es compartido.
   *
   * Va en la huella —y no sólo en una columna— para que el aislamiento no dependa
   * de acordarse de filtrar en cada consulta: dos tenants que saluden a una
   * persona con el mismo nombre obtienen claves distintas y, por tanto, filas
   * distintas. Sin esto, un acierto de caché es la prueba de que ese nombre existe
   * en el otro tenant.
   */
  tenantId?: string;
}

/** Identidad semántica del asset específico de plantilla. */
export function buildAudioAssetKey(input: BuildAudioAssetKeyInput): string {
  return sha256Text(
    JSON.stringify({
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      variant: input.variant,
      tenantId: input.tenantId ?? null,
      ...synthesisPayload(input),
    }),
  );
}

/**
 * Identidad de síntesis independiente de plantilla. Permite que dos plantillas
 * distintas con exactamente el mismo texto/perfil reutilicen el mismo binario.
 *
 * El tenant participa por la misma razón que en `buildAudioAssetKey`: la
 * reutilización de binario es otro camino por el que la caché puede cruzar
 * tenants, y cerrar uno dejando el otro abierto no aísla nada.
 */
export function buildAudioSynthesisFingerprint(
  input: AudioSynthesisProfile & { normalizedText: string; tenantId?: string },
): string {
  return sha256Text(
    JSON.stringify({
      tenantId: input.tenantId ?? null,
      ...synthesisPayload(input),
    }),
  );
}

function synthesisPayload(
  input: AudioSynthesisProfile & { normalizedText: string },
): Record<string, unknown> {
  return {
    normalizedText: input.normalizedText,
    language: input.language,
    provider: input.provider,
    providerModel: input.providerModel,
    voiceProfile: input.voiceProfile,
    providerVoiceRef: input.providerVoiceRef,
    voiceVersion: input.voiceVersion,
    audioFormat: input.audioFormat,
    sampleRate: input.sampleRate,
    normalizerVersion: input.normalizerVersion,
  };
}

export function normalizeRenderedText(text: string): string {
  return text
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('es');
}

export function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
