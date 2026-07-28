import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { CommonFilesController } from './common-files.controller';
import {
  CreateFileDerivativeDto,
  CreateFileDto,
  CreateFileLinkDto,
  CreateFileVersionDto,
  DerivativeType,
  FileCategory,
  FileSensitivity,
  OwnerType,
} from '../dto';
import type { AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'user-1', roles: [] };

describe('CommonFilesController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const service = {
      createFile: fn(),
      createVersion: fn(),
      createDerivative: fn(),
      createLink: fn(),
      softDelete: fn(),
      generateDownloadUrl: fn(),
    };
    const controller = new CommonFilesController(service as never);
    return { service, controller };
  }

  it('delegates createFile', async () => {
    const { service, controller } = build();
    service.createFile.mockResolvedValue({ id: 'file-1' });
    const dto: CreateFileDto = {
      originalName: 'd.pdf',
      category: FileCategory.DOCUMENT,
      sensitivity: FileSensitivity.NORMAL,
      mimeType: 'application/pdf',
      sizeBytes: 1,
      contentHash: 'h',
      storageUri: 's3://b/d.pdf',
    };
    const result = await controller.createFile(dto, user);
    expect(service.createFile).toHaveBeenCalledWith(dto, user);
    expect(result).toEqual({ id: 'file-1' });
  });

  it('delegates createVersion', async () => {
    const { service, controller } = build();
    service.createVersion.mockResolvedValue({ id: 'ver-2' });
    const dto: CreateFileVersionDto = {
      mimeType: 'application/pdf',
      sizeBytes: 2,
      contentHash: 'h2',
      storageUri: 's3://b/d2.pdf',
    };
    const result = await controller.createVersion('file-1', dto, user);
    expect(service.createVersion).toHaveBeenCalledWith('file-1', dto, user);
    expect(result).toEqual({ id: 'ver-2' });
  });

  it('delegates createDerivative', async () => {
    const { service, controller } = build();
    service.createDerivative.mockResolvedValue({ id: 'der-1' });
    const dto: CreateFileDerivativeDto = {
      derivativeType: DerivativeType.OCR,
      storageUri: 's3://b/ocr.txt',
      mimeType: 'text/plain',
      sizeBytes: 3,
      contentHash: 'h3',
    };
    const result = await controller.createDerivative(
      'file-1',
      'ver-1',
      dto,
      user,
    );
    expect(service.createDerivative).toHaveBeenCalledWith(
      'file-1',
      'ver-1',
      dto,
      user,
    );
    expect(result).toEqual({ id: 'der-1' });
  });

  it('delegates createLink', async () => {
    const { service, controller } = build();
    service.createLink.mockResolvedValue({ id: 'link-1' });
    const dto: CreateFileLinkDto = {
      ownerType: OwnerType.PATIENT,
      ownerId: '11111111-1111-1111-1111-111111111111',
    };
    const result = await controller.createLink('file-1', dto, user);
    expect(service.createLink).toHaveBeenCalledWith('file-1', dto, user);
    expect(result).toEqual({ id: 'link-1' });
  });

  it('delegates softDelete', async () => {
    const { service, controller } = build();
    service.softDelete.mockResolvedValue({
      id: 'file-1',
      deletedAt: new Date(),
    });
    const result = await controller.softDelete('file-1', user);
    expect(service.softDelete).toHaveBeenCalledWith('file-1', user);
    expect(result.id).toBe('file-1');
  });

  it('delegates downloadUrl', async () => {
    const { service, controller } = build();
    service.generateDownloadUrl.mockResolvedValue({
      url: 'u',
      expiresAt: new Date(),
    });
    const result = await controller.downloadUrl('file-1');
    expect(service.generateDownloadUrl).toHaveBeenCalledWith('file-1');
    expect(result.url).toBe('u');
  });
});
