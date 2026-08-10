import { createHash } from 'node:crypto';
import type { AudioSynthesisProfile } from './audio.types';

export interface BuildAudioAssetKeyInput extends AudioSynthesisProfile {
  templateId: string;
  templateVersion: number;
  normalizedText: string;
  variant: 'PRIMARY' | 'FALLBACK';
}

/** JSON canónico con orden de claves fijo; nunca usa texto como nombre de archivo. */
export function buildAudioAssetKey(input: BuildAudioAssetKeyInput): string {
  const canonical = JSON.stringify({
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    variant: input.variant,
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
  });
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function normalizeRenderedText(text: string): string {
  return text.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('es');
}

export function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
