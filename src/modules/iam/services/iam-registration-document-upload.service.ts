import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { FileCategory, FileSensitivity } from '../../common/dto';
import {
  FileUploadService,
  type UploadedFileBytes,
} from '../../common/services';
import { RegistrationDocumentUploadResponseDto } from '../dto';
import { PreconditionFailedException } from '../../../common';

/** Único formato admitido por esta vía: el registro de procesos pide PDF. */
const REGISTRATION_DOCUMENT_ALLOWED_MIME_TYPES = ['application/pdf'] as const;

/**
 * Pre-carga pública de un PDF para un registro —documento legal de
 * organización o credencial profesional—: `POST /iam/auth/upload-registration-document`.
 *
 * Delega en `FileUploadService.uploadAnonymous` con una política más
 * estricta que la de `/common/files/upload` (sólo PDF, no toda la categoría
 * `DOCUMENT`) y sin actor: quien sube todavía no tiene cuenta. El archivo
 * queda sin dueño hasta que el alta correspondiente lo reclama por su
 * `fileId` (`AttachableFileService.claimAnonymousUpload`, dentro de la
 * transacción del alta).
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
   * @returns El `fileId` a reenviar en `legalDocuments` o `credentials[].fileId`.
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

  /** Precarga privada de firma/sello; la cuenta aún no existe. */
  async uploadSignatureImage(
    file: UploadedFileBytes | undefined,
  ): Promise<RegistrationDocumentUploadResponseDto> {
    if (file && file.buffer.byteLength > 2 * 1024 * 1024) {
      throw new PreconditionFailedException(
        'La imagen supera el límite de 2 MB',
      );
    }
    const uploaded = await this.fileUploadService.uploadAnonymous(
      file,
      { category: FileCategory.IMAGE, sensitivity: FileSensitivity.PHI },
      {
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        operation: 'iam.auth.upload-registration-signature-image',
      },
    );
    return {
      fileId: uploaded.id,
      originalName: file?.originalname ?? uploaded.originalName ?? '',
      sizeBytes: uploaded.sizeBytes,
      mimeType: uploaded.mimeType,
    };
  }
}
