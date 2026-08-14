import type { AudioEnv } from '../audio.env';
import {
  buildAudioAssetKey,
  normalizeRenderedText,
  sha256Text,
} from '../domain/audio-asset-key';
import type {
  AudioAssetView,
  AudioDynamicField,
  AudioGenerationMode,
  AudioSynthesisProfile,
} from '../domain/audio.types';
import type { AudioAssets, AudioTemplates } from '../entities';
import type { AudioAssetsRepository } from '../repositories/audio-assets.repository';
import type { CreateAudioAssetInput } from '../repositories/audio-assets.repository.types';

interface BuildCreateAudioAssetInput {
  template: AudioTemplates;
  assetKey: string;
  renderedTextHash: string;
  normalizedValues: Record<string, string>;
  profile: AudioSynthesisProfile;
  mode: AudioGenerationMode;
  fallback: boolean;
  encryptedRenderedText: string;
  tenantId?: string;
}

/**
 * ¿Este audio pertenece a un tenant o se comparte con toda la plataforma?
 *
 * Se comparte cuando su texto no puede identificar a nadie: los `STATIC`, los
 * `FALLBACK` y los `ENUMERATED` (conjunto cerrado de valores). Eso es lo que
 * permite pre-generarlos **una vez** para todos los tenants, que es media razón de
 * existir de esta caché.
 *
 * Se acota por tenant en cuanto el render sustituyó un valor de un campo que puede
 * llevar datos de una persona (`PERSON_NAME`) o texto libre (`SAFE_TEXT`, que
 * ninguna lista blanca puede garantizar anónimo). La decisión mira los campos
 * **declarados** por la plantilla, no lo que el valor de hoy parezca.
 */
export function requiresTenantScope(
  fields: readonly AudioDynamicField[],
  normalizedValues: Record<string, string>,
): boolean {
  return fields.some(
    (field) =>
      (field.type === 'PERSON_NAME' || field.type === 'SAFE_TEXT') &&
      normalizedValues[field.name] !== undefined,
  );
}

export function buildCreateAudioAssetInput(
  input: BuildCreateAudioAssetInput,
): CreateAudioAssetInput {
  const normalizedValueHash = Object.keys(input.normalizedValues).length
    ? sha256Text(
        JSON.stringify(
          Object.keys(input.normalizedValues)
            .sort()
            .map((key) => [key, input.normalizedValues[key]]),
        ),
      )
    : undefined;
  return {
    ...input.profile,
    assetKey: input.assetKey,
    tenantId: input.tenantId,
    templateKey: input.template.templateKey,
    templateVersion: input.template.version,
    strategy: input.fallback ? 'FALLBACK' : input.template.strategy,
    normalizedValueHash,
    encryptedRenderedText: input.encryptedRenderedText,
    renderedTextHash: input.renderedTextHash,
    generationMode: input.mode,
  };
}

export function buildAudioSynthesisProfile(
  template: AudioTemplates,
  env: AudioEnv,
): AudioSynthesisProfile {
  if (template.voiceProfile !== env.voiceProfile)
    throw new Error(`Voice profile no configurado: ${template.voiceProfile}`);
  return {
    provider: env.provider,
    providerModel: env.providerModel,
    language: template.language || env.defaultLanguage,
    voiceProfile: template.voiceProfile,
    providerVoiceRef: env.providerVoiceRef,
    voiceVersion: env.voiceVersion,
    audioFormat: env.outputFormat,
    sampleRate: env.sampleRate,
    normalizerVersion: 1,
  };
}

export function toAudioAssetView(asset: AudioAssets): AudioAssetView {
  return {
    id: asset.id,
    templateKey: asset.templateKey,
    templateVersion: asset.templateVersion,
    status: asset.generationStatus as AudioAssetView['status'],
    contentUrl:
      asset.generationStatus === 'READY'
        ? `/audio-assets/${asset.id}/content`
        : undefined,
    checksumSha256: asset.checksumSha256,
    bytes: asset.bytes,
    durationMs: asset.durationMs,
  };
}

export async function findReadyFallbackView(
  template: AudioTemplates,
  repository: AudioAssetsRepository,
  env: AudioEnv,
): Promise<AudioAssetView | undefined> {
  const inline = template.fallbackText
    ? await findReadyAssetForText(
        template,
        template.fallbackText,
        true,
        repository,
        env,
      )
    : null;
  if (inline) return toAudioAssetView(inline);
  if (
    !env.globalFallbackTemplate ||
    env.globalFallbackTemplate === template.templateKey
  )
    return undefined;
  const global = await repository.findTemplate(env.globalFallbackTemplate);
  if (!global || repository.dynamicFields(global).length > 0) return undefined;
  const asset = await findReadyAssetForText(
    global,
    global.textTemplate,
    false,
    repository,
    env,
  );
  return asset ? toAudioAssetView(asset) : undefined;
}

async function findReadyAssetForText(
  template: AudioTemplates,
  text: string,
  fallback: boolean,
  repository: AudioAssetsRepository,
  env: AudioEnv,
): Promise<AudioAssets | null> {
  const profile = buildAudioSynthesisProfile(template, env);
  const key = buildAudioAssetKey({
    ...profile,
    templateId: template.templateKey,
    templateVersion: template.version,
    normalizedText: normalizeRenderedText(text),
    variant: fallback ? 'FALLBACK' : 'PRIMARY',
  });
  const asset = await repository.findAssetByKey(key);
  return asset?.generationStatus === 'READY' ? asset : null;
}
