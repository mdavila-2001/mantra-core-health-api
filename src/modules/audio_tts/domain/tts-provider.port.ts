export interface TtsSynthesisInput {
  text: string;
  language: string;
  voiceProfile: string;
  providerVoiceRef: string;
  model: string;
  outputFormat: string;
  sampleRate: number;
  /** Identificador de esta petición concreta, para correlacionar con el proveedor. */
  requestId: string;
}

export interface TtsSynthesisResult {
  audio: Buffer;
  /** Tipo real devuelto por el proveedor, no el solicitado. */
  mimeType: string;
  provider: string;
  model: string;
  requestId?: string;
  /**
   * Consumo en unidades facturables. Es el reportado por el proveedor cuando lo
   * publica en una cabecera y una estimación local (caracteres) cuando no.
   * `usageIsReported` distingue las dos cosas: una contabilidad que no sabe si
   * está estimando no sirve para conciliar contra una factura.
   */
  usageUnits: number;
  usageIsReported: boolean;
  durationMs: number;
}

export interface TtsProviderHealth {
  provider: string;
  /** `false` cuando faltan credenciales o voz: el worker lo publica en su sonda. */
  configured: boolean;
}

/**
 * Quién convierte texto en audio.
 *
 * Solo el proceso worker registra una implementación de este puerto, y por eso
 * es el único que necesita la credencial del proveedor. La API resuelve, cifra y
 * contabiliza sin poder gastar ni un carácter.
 */
export interface TtsProviderPort {
  readonly providerName: string;
  synthesize(input: TtsSynthesisInput): Promise<TtsSynthesisResult>;
  health(): Promise<TtsProviderHealth>;
}
