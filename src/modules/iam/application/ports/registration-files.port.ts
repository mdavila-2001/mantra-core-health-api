import type { EntityManager } from '@mikro-orm/postgresql';

/** Un archivo recibido por multipart, ya en memoria. */
export interface RegistrationUploadedFile {
  readonly originalname: string;
  readonly mimetype: string;
  readonly buffer: Buffer;
}

/** Qué se sube y bajo qué política. */
export interface AnonymousUploadRequest {
  readonly category: 'DOCUMENT' | 'IMAGE';
  readonly sensitivity: 'NORMAL' | 'PHI';
  readonly allowedMimeTypes: readonly string[];
  readonly operation: string;
}

export interface AnonymousUploadResult {
  readonly id: string;
  readonly originalName?: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
}

export interface FileClaimOptions {
  readonly allowedMimeTypes?: readonly string[];
  readonly allowedCategoryConceptId?: string;
  readonly operation?: string;
}

export interface ClaimedFile {
  readonly file: { readonly sensitivityConceptId?: string };
  readonly version: { readonly sizeBytes: string };
}

/**
 * Archivos del registro: la subida anónima previa a la cuenta y su reclamo,
 * dentro de la transacción del alta, por la cuenta recién creada.
 */
export interface RegistrationFilesPort {
  uploadAnonymous(
    file: RegistrationUploadedFile | undefined,
    request: AnonymousUploadRequest,
  ): Promise<AnonymousUploadResult>;

  claimAnonymousUpload(
    tx: EntityManager,
    fileId: string,
    claim: { readonly ownerUserId: string; readonly tenantId: string },
    options: FileClaimOptions,
    labels?: { readonly subject: string; readonly notFound: string },
  ): Promise<ClaimedFile>;
}

export const REGISTRATION_FILES_PORT = Symbol('IAM_REGISTRATION_FILES_PORT');
