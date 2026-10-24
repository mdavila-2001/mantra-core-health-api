import { Injectable } from '@nestjs/common';
import { AttachableFileService } from '../../../common/services';
import type { AttachableFilesPort } from '../../application/ports/attachable-files.port';

@Injectable()
export class AttachableFilesAdapter implements AttachableFilesPort {
  constructor(private readonly attachableFiles: AttachableFileService) {}

  assertUsableBy(...args: Parameters<AttachableFilesPort['assertUsableBy']>) {
    return this.attachableFiles.assertUsableBy(...args);
  }
}
