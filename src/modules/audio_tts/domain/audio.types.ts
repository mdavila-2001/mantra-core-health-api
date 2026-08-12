/**
 * Vocabulario del dominio de audio sintetizado.
 *
 * El ciclo de vida se modela como cadena con CHECK en base y no como concepto de
 * `terminology.catalog_concepts` —a diferencia de los estados de negocio del
 * resto del modelo— porque no es vocabulario clínico ni administrativo: es
 * maquinaria interna de una caché. Resolverlo por concepto obligaría a una
 * lectura de terminología en el camino caliente de cada `resolve()` y a sembrar
 * cinco conceptos para describir estados que ninguna interfaz de usuario
 * muestra.
 */

export type AudioAssetStatus =
  'PENDING' | 'GENERATING' | 'READY' | 'FAILED_RETRYABLE' | 'FAILED_PERMANENT';

export const AUDIO_ASSET_STATUSES: readonly AudioAssetStatus[] = [
  'PENDING',
  'GENERATING',
  'READY',
  'FAILED_RETRYABLE',
  'FAILED_PERMANENT',
];

/**
 * Estrategia de una plantilla.
 *
 * - `STATIC`   texto fijo sin variables; se pre-genera y se comparte.
 * - `DYNAMIC`  lleva variables (`{{nombre}}`), así que su texto renderizado
 *              puede contener datos de una persona.
 * - `FALLBACK` audio genérico de degradación; nunca lleva variables.
 */
export type AudioTemplateStrategy = 'STATIC' | 'DYNAMIC' | 'FALLBACK';

export const AUDIO_TEMPLATE_STRATEGIES: readonly AudioTemplateStrategy[] = [
  'STATIC',
  'DYNAMIC',
  'FALLBACK',
];

export interface AudioTemplateRecord {
  code: string;
  version: number;
  strategy: AudioTemplateStrategy;
  templateText: string;
  language?: string;
  fallbackTemplateCode?: string;
  isActive: boolean;
}

/**
 * Dimensiones que definen la identidad criptográfica de un asset.
 *
 * Cualquier cambio en una de ellas produce un asset **distinto**: cambiar la voz
 * o el formato no reescribe el audio existente, crea otro. Es lo que hace que
 * una rotación de voz no sirva audio antiguo bajo la promesa de la nueva.
 */
export interface AudioRenderIdentity {
  language: string;
  provider: string;
  model: string;
  providerVoiceRef: string;
  voiceProfile: string;
  voiceVersion: number;
  outputFormat: string;
  sampleRate: number;
}

export interface AudioAssetRecord extends AudioRenderIdentity {
  id: string;
  assetKey: string;
  /**
   * Tenant propietario, o `undefined` en los assets compartidos.
   *
   * Los `STATIC` y `FALLBACK` no llevan tenant a propósito: su texto no depende
   * de nadie, así que un solo audio sirve a toda la plataforma y pre-generarlo
   * una vez basta. Los `DYNAMIC` sí lo llevan, porque su texto renderizado puede
   * incluir el nombre de una persona y una caché compartida entre tenants
   * convertiría un acierto de caché en una filtración.
   */
  tenantId?: string;
  templateCode: string;
  templateVersion: number;
  status: AudioAssetStatus;
  renderedTextEncrypted: string;
  providerModel: string;
  reservedUnits: number;
  attempts: number;
  correlationId?: string;
  claimedAt?: Date;
  claimedBy?: string;
  storageUri?: string;
  mimeType?: string;
  checksumSha256?: string;
  bytes?: number;
  lastErrorCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolveAudioRequest {
  templateCode: string;
  variables?: Record<string, string>;
  actorId?: string;
  language?: string;
  correlationId?: string;
}

/**
 * Resultado de resolver un audio. Los cuatro estados son terminales para el
 * llamador y ninguno es un error:
 *
 * | Estado        | Qué hacer                                              |
 * |---------------|--------------------------------------------------------|
 * | `READY`       | reproducir `storageUri`                                |
 * | `QUEUED`      | seguir sin audio y volver a consultar por `assetId`    |
 * | `FALLBACK`    | reproducir el audio genérico (sin mencionar el nombre) |
 * | `UNAVAILABLE` | seguir sin audio; **nunca** tratarlo como fallo        |
 */
export type ResolveAudioResult =
  | { status: 'READY'; assetId: string; storageUri: string; cacheHit: true }
  | { status: 'QUEUED'; assetId: string; cacheHit: false }
  | { status: 'FALLBACK'; assetId: string; storageUri: string; reason: string }
  | { status: 'UNAVAILABLE'; reason: string };

/** Trabajo que el worker recibe al reclamar un asset. Lleva el texto ya en claro. */
export interface AudioGenerationJob {
  assetId: string;
  /**
   * Texto a sintetizar, descifrado por la API.
   *
   * Viaja en claro por el mismo canal interno autenticado por el que el worker
   * de `messaging` recibe el cuerpo de una notificación. La alternativa —enviar
   * el criptograma y darle la clave de datos al worker— duplicaría el número de
   * procesos que pueden descifrar texto de personas sin reducir ninguna
   * exposición: el worker tiene que ver el texto en claro de todos modos para
   * poder enviarlo al proveedor.
   */
  text: string;
  language: string;
  providerVoiceRef: string;
  model: string;
  outputFormat: string;
  sampleRate: number;
  attempts: number;
  correlationId?: string;
}
