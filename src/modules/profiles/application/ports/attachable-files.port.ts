import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';

export interface AttachableFileOptions {
  readonly allowedMimeTypes?: readonly string[];
  readonly operation?: string;
  readonly allowIfFileIdIn?: readonly string[];
}

export interface AttachableFileLabels {
  readonly subject: string;
  readonly notFound: string;
}

export interface AttachableFilesPort {
  assertUsableBy(
    em: EntityManager,
    fileId: string,
    actor: AuthenticatedUser,
    options?: AttachableFileOptions,
    labels?: AttachableFileLabels,
  ): Promise<{ file: unknown; version: { sizeBytes: string } }>;
}

export const ATTACHABLE_FILES_PORT = Symbol('ATTACHABLE_FILES_PORT');
