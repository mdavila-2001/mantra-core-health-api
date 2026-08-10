import { createHash } from 'node:crypto';
import type { AudioSynthesisProfile } from './audio.types';

export interface BuildAudioAssetKeyInput extends AudioSynthesisProfile {
  templateId: string;
  templateVersion: number;
  normalizedText: string;
  variant: 'PRIMARY' | 'FALLBACK';
}

/** Identidad semántica del asset específico de plantilla. */
export function buildAudioAssetKey(input: BuildAudioAssetKeyInput): string {
  return sha256Text(JSON.stringify({
    templateId: input.templateId, templateVersion: input.templateVersion, variant: input.variant,
    ...synthesisPayload(input),
  }));
}

/**
 * Identidad de síntesis independiente de plantilla. Permite que dos plantillas
 * distintas con exactamente el mismo texto/perfil reutilicen el mismo binario.
 */
export function buildAudioSynthesisFingerprint(input: AudioSynthesisProfile & { normalizedText: string }): string {
  return sha256Text(JSON.stringify(synthesisPayload(input)));
}

function synthesisPayload(input: AudioSynthesisProfile & { normalizedText: string }): Record<string, unknown> {
  return {
    normalizedText: input.normalizedText, language: input.language, provider: input.provider,
    providerModel: input.providerModel, voiceProfile: input.voiceProfile,
    providerVoiceRef: input.providerVoiceRef, voiceVersion: input.voiceVersion,
    audioFormat: input.audioFormat, sampleRate: input.sampleRate,
    normalizerVersion: input.normalizerVersion,
  };
}

export function normalizeRenderedText(text: string): string {
  return text.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('es');
}

export function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
