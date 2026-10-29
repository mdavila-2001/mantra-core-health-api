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
  ) {}

  uploadAnonymous(
    file: RegistrationUploadedFile | undefined,
    request: AnonymousUploadRequest,
  ) {
    return this.fileUploadService.uploadAnonymous(
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
    );
  }

  claimAnonymousUpload(
    ...args: Parameters<RegistrationFilesPort['claimAnonymousUpload']>
  ) {
    return this.attachableFiles.claimAnonymousUpload(
      ...(args as Parameters<AttachableFileService['claimAnonymousUpload']>),
    );
  }
}
