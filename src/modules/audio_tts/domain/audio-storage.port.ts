export interface StoreAudioInput {
  assetId: string;
  buffer: Buffer;
  mimeType: string;
  outputFormat: string;
}

export interface StoredAudio {
  /** Referencia canónica persistida (`s3://bucket/clave` o `file://…`). */
  storageUri: string;
  /** Checksum del contenido efectivamente almacenado, no del buffer entrante. */
  checksumSha256: string;
  sizeBytes: number;
}

/**
 * Dónde viven los bytes del audio.
 *
 * Se declara aparte de `FileStorageAdapter` (`common/storage`) en vez de
 * reutilizarlo porque este dominio necesita dos cosas que aquel contrato no
 * tiene y que no son opcionales aquí: **URL firmada con expiración**
 * (`publicUrl`, para que un navegador reproduzca el audio sin exponer el bucket)
 * y **borrado** (`remove`, para retirar un asset cuya voz se rotó). Ampliar el
 * contrato compartido obligaría a que el adaptador local de subidas de ficheros
 * implementara firma de URLs, que no significa nada en disco.
 */
export interface AudioStoragePort {
  store(input: StoreAudioInput): Promise<StoredAudio>;
  exists(storageUri: string): Promise<boolean>;
  read(storageUri: string): Promise<Buffer>;
  /** URL consumible por un cliente HTTP; firmada y con expiración si el backend lo permite. */
  publicUrl(storageUri: string, ttlSeconds: number): Promise<string>;
  remove(storageUri: string): Promise<void>;
}
