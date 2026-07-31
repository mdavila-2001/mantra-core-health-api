/** Bytes recibidos más lo que se sabe de ellos antes de persistirlos. */
export interface StoredFileInput {
  /**
   * Contenido binario del archivo.
   */
  buffer: Buffer;
  /**
   * Nombre original tal como lo envió el cliente.
   */
  originalName: string;
  /**
   * Tipo MIME declarado por el cliente.
   */
  mimeType: string;
}

/** Lo que el almacenamiento devuelve una vez que los bytes están a salvo. */
export interface StoredFile {
  /**
   * URI con la que el backend vuelve a localizar el contenido. Su forma la
   * decide el adaptador (`file://…`, `s3://…`); ningún llamador debe
   * interpretarla, sólo persistirla y devolverla al adaptador.
   */
  storageUri: string;
  /**
   * Tamaño real de lo escrito, no el declarado por el cliente.
   */
  sizeBytes: number;
  /**
   * SHA-256 hexadecimal del contenido, calculado por el adaptador.
   */
  contentHash: string;
}

/**
 * Punto de extensión del almacenamiento de archivos. Aísla "dónde viven los
 * bytes" de "qué sabemos del archivo": `common.files`/`common.file_versions`
 * guardan la metadata y una `storageUri` opaca, y este adaptador es el único
 * que sabe qué significa esa URI.
 *
 * Se elige por `FILE_STORAGE_ADAPTER` en `FileStorageModule`. Hoy sólo existe
 * el adaptador local en disco; un `S3FileStorageAdapter` entraría aquí sin
 * tocar servicios ni controladores.
 */
export interface FileStorageAdapter {
  /** Persiste el contenido y describe lo que quedó almacenado. */
  store(input: StoredFileInput): Promise<StoredFile>;
  /** Recupera el contenido previamente almacenado bajo esa URI. */
  retrieve(storageUri: string): Promise<Buffer>;
}

/** Token de inyección del adaptador activo. */
export const FILE_STORAGE_ADAPTER = Symbol('FILE_STORAGE_ADAPTER');
