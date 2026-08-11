import type { IndexTuple } from '../catalog.types';

/** Índices del módulo TTS/audio-assets; extensión no perteneciente al modelo SALUD generado. */
export const audioAssetsIndexes: readonly IndexTuple[] = [
  ['audio_templates', 'uq_audio_templates_key_version', ['template_key', 'version'], true, 'btree'],
  ['audio_assets', 'uq_audio_assets_asset_key', ['asset_key'], true, 'btree'],
  ['audio_assets', 'ix_audio_assets_template_status', ['template_key', 'template_version', 'generation_status'], false, 'btree'],
  ['audio_assets', 'ix_audio_assets_last_used_at', ['last_used_at'], false, 'btree'],
  ['audio_assets', 'ix_audio_assets_synthesis_reuse', ['rendered_text_hash', 'provider', 'provider_model', 'voice_version', 'generation_status'], false, 'btree'],
  ['audio_generation_usage', 'uq_audio_generation_usage_period_provider', ['period_key', 'provider'], true, 'btree'],
  ['audio_generation_events', 'ix_audio_generation_events_asset_created', ['asset_key', 'created_at desc'], false, 'btree'],
  ['audio_generation_events', 'ix_audio_generation_events_template_created', ['template_key', 'created_at desc'], false, 'btree'],
];
