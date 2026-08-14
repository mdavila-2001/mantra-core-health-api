import { Inject, Injectable } from '@nestjs/common';
import {
  FILE_STORAGE_ADAPTER,
  ResourceNotFoundException,
  getCurrentTenantId,
  type FileStorageAdapter,
} from '../../common';
import { AudioAssetsRepository } from './repositories/audio-assets.repository';

@Injectable()
export class AudioContentService {
  constructor(
    private readonly repository: AudioAssetsRepository,
    @Inject(FILE_STORAGE_ADAPTER) private readonly storage: FileStorageAdapter,
  ) {}

  async get(
    assetId: string,
  ): Promise<{ buffer: Buffer; mimeType: string; checksum?: string }> {
    const asset = await this.repository.findAssetById(assetId);
    if (!asset || asset.generationStatus !== 'READY' || !asset.storageKey) {
      throw new ResourceNotFoundException(
        'Asset de audio listo no encontrado',
        { assetId },
      );
    }
    // Un asset acotado a otro tenant no existe para quien pregunta. Mientras la
    // caché era global no había nada que comprobar aquí; con `tenant_id` en el
    // modelo, servir los bytes por id bastaría para oír el nombre de una persona
    // de otro tenant. Se responde 404 y no 403 a propósito: un 403 confirmaría
    // que el identificador es válido.
    const tenantId = getCurrentTenantId();
    if (asset.tenantId && tenantId && asset.tenantId !== tenantId) {
      throw new ResourceNotFoundException(
        'Asset de audio listo no encontrado',
        { assetId },
      );
    }
    const buffer = await this.storage.retrieve(asset.storageKey);
    await this.repository.touchUsage(asset.id);
    return {
      buffer,
      mimeType: mimeTypeForFormat(asset.audioFormat),
      checksum: asset.checksumSha256,
    };
  }
}

function mimeTypeForFormat(format: string): string {
  if (format.startsWith('mp3')) return 'audio/mpeg';
  if (format.startsWith('wav')) return 'audio/wav';
  if (format.startsWith('pcm')) return 'audio/L16';
  if (format.startsWith('opus')) return 'audio/ogg';
  return 'application/octet-stream';
}
