import { TransactionContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { enterAuthBoundaryContext } from '../../application/services/auth-boundary-context';
import { Injectable } from '@nestjs/common';
import type { SniffedMimeType } from '../../../../common';
import { FileCategory, FileSensitivity } from '../../../common/dto';
import { AttachableFileService } from '../../../common/services/attachable-file.service';
import { FileUploadService } from '../../../common/services/file-upload.service';
import type {
  AnonymousUploadRequest,
  RegistrationFilesPort,
  RegistrationUploadedFile,
} from '../../application/ports/registration-files.port';

/** Subida anónima y reclamo de archivos del registro, que gobierna `common`. */
@Injectable()
export class CommonRegistrationFilesAdapter implements RegistrationFilesPort {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly attachableFiles: AttachableFileService,
    private readonly em: EntityManager,
  ) {}

  uploadAnonymous(
    file: RegistrationUploadedFile | undefined,
    request: AnonymousUploadRequest,
  ) {
    return this.em.transactional(async (tx) => {
      await enterAuthBoundaryContext(tx);
      return TransactionContext.create(tx, () =>
        this.fileUploadService.uploadAnonymous(
          file,
          {
            category: FileCategory[request.category],
            sensitivity: FileSensitivity[request.sensitivity],
          },
          {
            allowedMimeTypes:
              request.allowedMimeTypes as readonly SniffedMimeType[],
            operation: request.operation,
          },
        ),
      );
    });
  }

  claimAnonymousUpload(
    ...args: Parameters<RegistrationFilesPort['claimAnonymousUpload']>
  ) {
    return this.attachableFiles.claimAnonymousUpload(
      ...(args as Parameters<AttachableFileService['claimAnonymousUpload']>),
    );
  }
}
