import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { FileCategory, FileSensitivity } from '../../common/dto';
import {
  FileUploadService,
  type UploadedFileBytes,
} from '../../common/services';
import { RegistrationDocumentUploadResponseDto } from '../dto';

/** Único formato admitido por esta vía: el registro de procesos pide PDF. */
const REGISTRATION_DOCUMENT_ALLOWED_MIME_TYPES = ['application/pdf'] as const;

/**
 * Pre-carga pública de un documento legal del registro de organización
 * (subtarea 1.2): `POST /iam/auth/upload-registration-document`.
 *
 * Delega en `FileUploadService.uploadAnonymous` con una política más
 * estricta que la de `/common/files/upload` (sólo PDF, no toda la categoría
 * `DOCUMENT`) y sin actor: quien sube todavía no tiene cuenta. El archivo
 * queda sin dueño hasta que `POST /iam/auth/register-organization` lo
 * reclama por su `fileId` (`AttachableFileService.claimAnonymousUpload`,
 * dentro de la transacción del alta).
 */
@Injectable()
export class IamRegistrationDocumentUploadService {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamRegistrationDocumentUploadService.name);
  }

  /**
   * @param file - Contenido recibido por multipart.
   * @returns El `fileId` a reenviar en `legalDocuments` del alta.
   * @throws PreconditionFailedException si el contenido viene vacío, excede
   *   el máximo configurado o no es un PDF (por magic bytes, no por el
   *   `Content-Type` declarado).
   */
  async upload(
    file: UploadedFileBytes | undefined,
  ): Promise<RegistrationDocumentUploadResponseDto> {
    const uploaded = await this.fileUploadService.uploadAnonymous(
      file,
      { category: FileCategory.DOCUMENT, sensitivity: FileSensitivity.NORMAL },
      {
        allowedMimeTypes: REGISTRATION_DOCUMENT_ALLOWED_MIME_TYPES,
        operation: 'iam.auth.upload-registration-document',
      },
    );
    this.logger.info(
      {
        operation: 'iam.auth.upload-registration-document',
        fileId: uploaded.id,
      },
      'Registration document uploaded anonymously',
    );
    return {
      fileId: uploaded.id,
      // `FileResponseDto.originalName` es opcional; acá siempre viene, porque
      // el interceptor de multer no deja pasar un `file` sin nombre.
      originalName: file?.originalname ?? uploaded.originalName ?? '',
      sizeBytes: uploaded.sizeBytes,
      mimeType: uploaded.mimeType,
    };
  }
}
