import { jest } from '@jest/globals';
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { IamRegistrationDocumentUploadService } from './iam-registration-document-upload.service';
import { FileCategory, FileSensitivity } from '../../common/dto';

function build() {
  const fileUploadService = {
    uploadAnonymous: fn().mockResolvedValue({
      id: 'file-1',
      originalName: undefined,
      sizeBytes: 318_204,
      mimeType: 'application/pdf',
    }),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };
  const service = new IamRegistrationDocumentUploadService(
    fileUploadService as never,
    logger as never,
  );
  return { service, fileUploadService };
}

describe('IamRegistrationDocumentUploadService', () => {
  it('delega en uploadAnonymous con la política PDF de la categoría DOCUMENT', async () => {
    const d = build();
    const file = {
      originalname: 'escritura.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    };

    await d.service.upload(file);

    expect(d.fileUploadService.uploadAnonymous).toHaveBeenCalledWith(
      file,
      { category: FileCategory.DOCUMENT, sensitivity: FileSensitivity.NORMAL },
      expect.objectContaining({
        allowedMimeTypes: ['application/pdf'],
        operation: 'iam.auth.upload-registration-document',
      }),
    );
  });

  it('mapea el archivo subido a fileId/originalName/sizeBytes/mimeType', async () => {
    const d = build();
    const file = {
      originalname: 'escritura.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    };

    const result = await d.service.upload(file);

    expect(result).toEqual({
      fileId: 'file-1',
      originalName: 'escritura.pdf',
      sizeBytes: 318_204,
      mimeType: 'application/pdf',
    });
  });

  it('propaga el rechazo si el archivo no es un PDF', async () => {
    const d = build();
    d.fileUploadService.uploadAnonymous.mockRejectedValueOnce(
      new Error('Solo se admiten documentos PDF'),
    );

    await expect(
      d.service.upload({
        originalname: 'foto.png',
        mimetype: 'image/png',
        buffer: Buffer.from(''),
      }),
    ).rejects.toThrow('Solo se admiten documentos PDF');
  });
});
