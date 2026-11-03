import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import {
  AttachableFileService,
  FileUploadService,
} from '../../../common/services';
import { FileVersions, Files } from '../../../common/entities';
import {
  PAYMENT_RECEIPT_MAX_BYTES,
  PAYMENT_RECEIPT_MIME_TYPES,
} from '../../domain/booking/payment-receipt';
import type {
  PaymentReceiptFileContent,
  PaymentReceiptFileInfo,
  PaymentReceiptFilesPort,
} from '../../application/ports/payment-receipt-files.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

const OPERATION = 'scheduling.booking.payment-receipt';

const LABELS = {
  subject: 'El comprobante',
  notFound: 'El comprobante no existe',
};

/** Implementa los archivos de los comprobantes sobre los servicios de `common`. */
@Injectable()
export class CommonPaymentReceiptFilesAdapter implements PaymentReceiptFilesPort {
  constructor(
    private readonly attachable: AttachableFileService,
    private readonly uploads: FileUploadService,
  ) {}

  async assertAttachable(
    uow: UnitOfWork,
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptFileInfo> {
    try {
      const { file, version } = await this.attachable.assertUsableBy(
        uow,
        fileId,
        actor,
        { allowedMimeTypes: PAYMENT_RECEIPT_MIME_TYPES, operation: OPERATION },
        LABELS,
      );
      if (Number(version.sizeBytes) > PAYMENT_RECEIPT_MAX_BYTES) {
        throw new PreconditionFailedException(
          'El comprobante supera los 5 MB',
          { fileId },
        );
      }
      return {
        mimeType: version.mimeType,
        originalName: file.originalName ?? null,
      };
    } catch (error: unknown) {
      // Para quien adjunta, un archivo que no existe o que no es suyo es un
      // comprobante que no sirve, igual que uno de otro formato: 422 y no un
      // 404 o 403 que se confundiría con la cita.
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw new PreconditionFailedException(
          'El comprobante no es un archivo suyo que se pueda adjuntar',
          { fileId },
        );
      }
      throw error;
    }
  }

  async describe(
    uow: UnitOfWork,
    fileIds: readonly string[],
  ): Promise<Map<string, PaymentReceiptFileInfo>> {
    const byId = new Map<string, PaymentReceiptFileInfo>();
    if (fileIds.length === 0) return byId;

    const files = await uow.find(Files, { id: { $in: [...fileIds] } });
    const versionIds = files
      .map((file) => file.currentVersionId)
      .filter((id): id is string => typeof id === 'string');
    const versions =
      versionIds.length === 0
        ? []
        : await uow.find(FileVersions, { id: { $in: versionIds } });
    const mimeByVersion = new Map(versions.map((v) => [v.id, v.mimeType]));

    for (const file of files) {
      byId.set(file.id, {
        mimeType:
          (file.currentVersionId === undefined
            ? undefined
            : mimeByVersion.get(file.currentVersionId)) ??
          'application/octet-stream',
        originalName: file.originalName ?? null,
      });
    }
    return byId;
  }

  download(fileId: string): Promise<PaymentReceiptFileContent> {
    return this.uploads.downloadForAuthorizedContext(fileId, OPERATION);
  }
}
