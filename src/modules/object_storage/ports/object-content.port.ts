import type { Readable } from 'node:stream';

/**
 * Dónde viven los bytes de una versión, tal como lo resuelve el servidor.
 *
 * Sale siempre del espacio de nombres registrado (bucket y backend) y de la
 * clave de la carga o de la versión; nunca de una URI que haya mandado el
 * cliente. Esa es la diferencia entre verificar un objeto y verificar lo que
 * alguien dice de un objeto.
 */
export interface ObjectContentLocator {
  /** `object_namespaces.backend_code`: qué proveedor sabe leerlo. */
  backendCode: string;
  /** `object_namespaces.bucket_or_container`. */
  bucket: string;
  /** Clave exacta del objeto dentro del bucket. */
  key: string;
  /** Versión del proveedor, si el espacio tiene versionado. */
  providerVersionId?: string;
}

/** Lo que el proveedor afirma del objeto sin entregar sus bytes. */
export interface ObjectContentStat {
  sizeBytes: bigint;
  /** Versión que devolvió el proveedor; ausente si el bucket no versiona. */
  providerVersionId?: string;
  /** ETag del proveedor. En multiparte no es un hash del contenido. */
  etag?: string;
}

/** Hash calculado leyendo los bytes que el proveedor tiene guardados. */
export interface ObjectContentDigest {
  sha256: string;
  sizeBytes: bigint;
}

/** Bytes listos para entregar, sin que el llamador conozca al proveedor. */
export interface ObjectContentStream {
  body: Readable;
  contentLength?: number;
}

/**
 * El proveedor no pudo responder, o el backend no tiene lector. No es «no
 * existe»: quien lo recibe no puede dar por buena ni por mala la verificación,
 * y por eso se corta sin completar nada.
 */
export class ObjectContentUnavailableError extends Error {
  constructor(readonly reasonCode: string) {
    super(`Contenido del objeto no disponible: ${reasonCode}`);
    this.name = 'ObjectContentUnavailableError';
  }
}

/**
 * Lectura física de los objetos del módulo 60.
 *
 * Existe porque el catálogo registraba tamaño, SHA y versión tal como los
 * declaraba el cliente (MCH-021) y servía la URI del proveedor sin firma
 * (MCH-009). Con este puerto el servidor mira los bytes: para verificar al
 * cerrar una carga y para entregarlos detrás de un acceso firmado.
 */
export interface ObjectContentReader {
  /** `null` si el objeto no existe. Lanza {@link ObjectContentUnavailableError} si no se sabe. */
  stat(locator: ObjectContentLocator): Promise<ObjectContentStat | null>;
  /**
   * Lee el objeto completo y calcula su SHA-256. `expectedEtag` ata la lectura
   * a la misma versión que se inspeccionó: si cambió entre medio, falla.
   */
  digest(
    locator: ObjectContentLocator,
    expectedEtag?: string,
  ): Promise<ObjectContentDigest>;
  /** Abre los bytes para entregarlos. */
  open(locator: ObjectContentLocator): Promise<ObjectContentStream>;
}

/** Token de inyección del lector activo. */
export const OBJECT_CONTENT_READER = Symbol('OBJECT_CONTENT_READER');
