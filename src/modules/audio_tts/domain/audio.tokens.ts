/**
 * Tokens de inyección del dominio de audio.
 *
 * Existen para que las piezas que hablan con el exterior (base, disco/S3,
 * proveedor de síntesis) sean sustituibles sin tocar la aplicación: los tests
 * inyectan dobles en memoria y el worker registra el adaptador del proveedor
 * que la configuración seleccione.
 */

/** `AudioTtsConfig` ya validada. */
export const AUDIO_TTS_CONFIG = Symbol('AUDIO_TTS_CONFIG');

/** `AudioStoragePort`: dónde viven los bytes del audio. */
export const AUDIO_STORAGE = Symbol('AUDIO_STORAGE');

/** `TtsProviderPort`: quién sintetiza. Solo se registra en el proceso worker. */
export const AUDIO_TTS_PROVIDER = Symbol('AUDIO_TTS_PROVIDER');
