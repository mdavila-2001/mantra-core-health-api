import { Injectable } from '@nestjs/common';
import { FileUploadService } from '../../../common/services';
import type {
  AdmissionFileContent,
  AdmissionFilesPort,
} from '../../application/ports/admission-files.port';

/** Entrega los bytes de un archivo que la admisión ya autorizó. */
@Injectable()
export class AdmissionFilesAdapter implements AdmissionFilesPort {
  constructor(private readonly files: FileUploadService) {}

  downloadAuthorized(
    fileId: string,
    operation: string,
  ): Promise<AdmissionFileContent> {
    return this.files.downloadForAuthorizedContext(fileId, operation);
  }
}
