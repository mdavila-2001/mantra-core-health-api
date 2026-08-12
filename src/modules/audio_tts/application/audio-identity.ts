import type { AudioTtsConfig } from '../config/audio-tts.env';
import type {
  AudioRenderIdentity,
  AudioTemplateRecord,
} from '../domain/audio.types';
import { buildAudioAssetKey } from './audio-asset-key';

export interface AudioRenderTarget extends AudioRenderIdentity {
  /** Modelo con el que se pedirá el audio; se persiste en la fila del asset. */
  providerModel: string;
}

export interface ResolvedAudioIdentity extends AudioRenderTarget {
  assetKey: string;
}

/**
 * Referencia de voz que el proveedor entiende.
 *
 * Se separa de `voiceProfile` (el nombre de marca, estable) porque son cosas
 * distintas: cambiar de proveedor conservando el perfil de marca cambia esta
 * referencia, y ambas entran en la identidad para que el cambio produzca audios
 * nuevos en vez de reutilizar los del proveedor anterior.
 */
function providerVoiceRef(config: AudioTtsConfig): string {
  if (config.provider === 'elevenlabs') return config.elevenLabsVoiceId;
  if (config.provider === 'fake') return 'fake-default';
  return '';
}

/**
 * Dimensiones de identidad **sin** la clave.
 *
 * Sirven para buscar un fallback equivalente: un audio genérico solo sustituye a
 * otro si comparte idioma, voz, modelo y formato. Sin este filtro se serviría un
 * audio en otro idioma como si fuera el correcto.
 */
export function renderIdentityOf(
  config: AudioTtsConfig,
  template: AudioTemplateRecord,
  languageOverride?: string,
): AudioRenderTarget {
  const model = config.elevenLabsModelId || config.model;
  return {
    language: (
      languageOverride ??
      template.language ??
      config.defaultLanguage
    ).toLowerCase(),
    provider: config.provider,
    model,
    providerModel: model,
    providerVoiceRef: providerVoiceRef(config),
    voiceProfile: config.voiceProfile,
    voiceVersion: config.voiceVersion,
    outputFormat: config.elevenLabsOutputFormat || config.defaultFormat,
    sampleRate: config.sampleRate,
  };
}

/**
 * Identidad completa, incluida la clave del asset.
 *
 * @param tenantId tenant propietario, o `undefined` para un audio compartido.
 *        Quien decide cuál de los dos es `shouldScopeByTenant`, no este
 *        cálculo: aquí solo entra en la huella.
 */
export function resolveAudioIdentity(
  config: AudioTtsConfig,
  template: AudioTemplateRecord,
  renderedText: string,
  languageOverride?: string,
  tenantId?: string,
): ResolvedAudioIdentity {
  const identity = renderIdentityOf(config, template, languageOverride);
  return {
    ...identity,
    assetKey: buildAudioAssetKey({
      templateCode: template.code,
      templateVersion: template.version,
      renderedText,
      tenantId,
      ...identity,
    }),
  };
}

/**
 * ¿Este audio pertenece a un tenant o se comparte?
 *
 * Se decide por la **estrategia declarada**, no por si el texto acabó teniendo
 * variables: una plantilla `DYNAMIC` cuyo render de hoy no sustituyó nada sigue
 * siendo capaz de contener un nombre mañana, y compartir su primera versión
 * dejaría en la caché global una fila que después se reutilizaría entre tenants.
 */
export function shouldScopeByTenant(template: AudioTemplateRecord): boolean {
  return template.strategy === 'DYNAMIC';
}
