import {
  BadRequestException,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  loadStorageEnv,
  type AuthenticatedUser,
} from '../../../common';
import { FileCategory, FileSensitivity } from '../../common/dto';
import { FileUploadService } from '../../common/services/file-upload.service';
import { FilesService } from '../../common/services/files.service';
import type { LabResultFileDto } from '../dto/lab-portal-results.dto';
import type {
  LabResultUploadSessionDto,
  LabResultUploadStartDto,
} from '../dto/lab-portal-uploads.dto';
import { LabPortalResultWritesService } from './lab-portal-result-writes.service';
import { LabPortalResultsService } from './lab-portal-results.service';

/** Part size: under nginx `client_max_body_size` (12M). */
export const LAB_UPLOAD_CHUNK_BYTES = 8 * 1024 * 1024;
/** An abandoned session is dropped after this long. */
const SESSION_TTL_MS = 60 * 60 * 1000;
/** Open sessions per tenant: each one may hold up to the max file size in memory. */
const MAX_SESSIONS_PER_TENANT = 10;
/** Expired sessions are also swept on this period, so idle buffers leave RAM. */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

interface UploadSession {
  readonly tenantId: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly orderId: string;
  readonly note: string | null;
  readonly chunkSize: number;
  readonly totalParts: number;
  readonly parts: Map<number, Buffer>;
  readonly expiresAt: number;
  /** Set while `complete` runs: a second `complete` is refused with 409. */
  completing: boolean;
}

/**
 * Chunked upload of laboratory results.
 *
 * Parts are kept in this process' memory until `complete`, which hands the
 * whole file to the existing file pipeline (`FileUploadService.upload`: MIME
 * sniffing, category allow-list, configured max size, storage adapter) and
 * then attaches it to the order's report. There is no upload-session table,
 * so a session lives in one API instance and dies with it; the configured
 * `FILE_STORAGE_MAX_SIZE_BYTES` bounds both the file and the memory it takes.
 */
@Injectable()
export class LabPortalUploadsService implements OnModuleInit, OnModuleDestroy {
  private readonly sessions = new Map<string, UploadSession>();
  private sweepTimer?: NodeJS.Timeout;

  constructor(
    private readonly em: EntityManager,
    private readonly reads: LabPortalResultsService,
    private readonly writes: LabPortalResultWritesService,
    private readonly files: FileUploadService,
    private readonly fileRecords: FilesService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LabPortalUploadsService.name);
  }

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    // Never keeps the process alive on shutdown.
    this.sweepTimer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.sweepTimer);
    this.sweepTimer = undefined;
    this.sessions.clear();
  }

  async start(
    tenantId: string,
    dto: LabResultUploadStartDto,
  ): Promise<LabResultUploadSessionDto> {
    this.sweep();
    const max = loadStorageEnv().maxSizeBytes;
    if (dto.sizeBytes > max) {
      throw new PreconditionFailedException(
        'El archivo excede el tamaño máximo permitido',
        { maxSizeBytes: max, sizeBytes: dto.sizeBytes },
      );
    }
    await this.reads.assertUploadable(this.em.fork(), tenantId, dto.orderId);
    const open = [...this.sessions.values()].filter(
      (s) => s.tenantId === tenantId,
    );
    if (open.length >= MAX_SESSIONS_PER_TENANT) {
      throw new ConflictException(
        'Hay demasiadas subidas abiertas; termine o cancele alguna.',
      );
    }
    const uploadId = randomUUID();
    const chunkSize = Math.min(LAB_UPLOAD_CHUNK_BYTES, max);
    const totalParts = Math.max(1, Math.ceil(dto.sizeBytes / chunkSize));
    this.sessions.set(uploadId, {
      tenantId,
      fileName: dto.fileName,
      contentType: dto.contentType.trim(),
      sizeBytes: dto.sizeBytes,
      orderId: dto.orderId,
      note: dto.note?.trim() || null,
      chunkSize,
      totalParts,
      parts: new Map(),
      expiresAt: Date.now() + SESSION_TTL_MS,
      completing: false,
    });
    this.logger.info(
      {
        operation: 'diagnostics.lab-portal.upload.start',
        uploadId,
        totalParts,
      },
      'Result upload started',
    );
    return {
      uploadId,
      chunkSizeBytes: chunkSize,
      totalParts,
      receivedParts: [],
    };
  }

  /** Bytes a part must carry: `chunkSize`, except the last one. */
  expectedPartSize(tenantId: string, uploadId: string, index: number): number {
    const session = this.session(tenantId, uploadId);
    if (!Number.isInteger(index) || index < 0 || index >= session.totalParts) {
      throw new BadRequestException(`La parte ${index} está fuera de rango.`);
    }
    return index < session.totalParts - 1
      ? session.chunkSize
      : session.sizeBytes - session.chunkSize * (session.totalParts - 1);
  }

  putPart(
    tenantId: string,
    uploadId: string,
    index: number,
    part: Buffer,
  ): void {
    const expected = this.expectedPartSize(tenantId, uploadId, index);
    if (part.byteLength !== expected) {
      throw new BadRequestException(
        `La parte ${index} trae ${part.byteLength} bytes y se esperaban ${expected}.`,
      );
    }
    const session = this.session(tenantId, uploadId);
    if (session.completing) {
      throw new ConflictException('La subida se está cerrando.');
    }
    session.parts.set(index, part);
  }

  async complete(
    tenantId: string,
    uploadId: string,
    actor: AuthenticatedUser,
  ): Promise<LabResultFileDto> {
    const session = this.session(tenantId, uploadId);
    const missing = Array.from(
      { length: session.totalParts },
      (_, i) => i,
    ).filter((i) => !session.parts.has(i));
    if (missing.length > 0) {
      throw new ConflictException(
        `Faltan ${missing.length} partes del archivo.`,
        {
          missingParts: missing,
        },
      );
    }
    if (session.completing) {
      throw new ConflictException('La subida ya se está cerrando.');
    }
    // Claimed synchronously (no await before it): a concurrent call sees it.
    session.completing = true;
    try {
      // Re-checked here: the order may have changed while the parts travelled.
      await this.reads.assertUploadable(
        this.em.fork(),
        tenantId,
        session.orderId,
      );
      const buffer = Buffer.concat(
        Array.from({ length: session.totalParts }, (_, i) =>
          session.parts.get(i)!,
        ),
      );
      const stored = await this.files.upload(
        {
          originalname: session.fileName,
          mimetype: session.contentType || 'application/octet-stream',
          buffer,
        },
        { category: FileCategory.DOCUMENT, sensitivity: FileSensitivity.PHI },
        actor,
      );
      let result: LabResultFileDto;
      try {
        result = await this.writes.attach(
          tenantId,
          session.orderId,
          stored.id,
          session.note,
          actor,
        );
      } catch (error) {
        await this.discardStored(stored.id, actor);
        throw error;
      }
      // Closed only after the file is stored and attached.
      this.sessions.delete(uploadId);
      this.logger.info(
        {
          operation: 'diagnostics.lab-portal.upload.complete',
          uploadId,
          fileId: stored.id,
        },
        'Result upload stored',
      );
      return result;
    } finally {
      session.completing = false;
    }
  }

  /** Compensation: a stored file that could not be attached must not linger. */
  private async discardStored(
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    try {
      await this.fileRecords.softDelete(fileId, actor);
    } catch {
      this.logger.error(
        { operation: 'diagnostics.lab-portal.upload.compensate', fileId },
        'Could not discard an unattached result file',
      );
    }
  }

  abort(tenantId: string, uploadId: string): void {
    const session = this.sessions.get(uploadId);
    if (session?.tenantId !== tenantId) return;
    if (session.completing) {
      throw new ConflictException('La subida se está cerrando.');
    }
    this.sessions.delete(uploadId);
  }

  /** Another tenant's session answers like a missing one. */
  private session(tenantId: string, uploadId: string): UploadSession {
    const session = this.sessions.get(uploadId);
    if (
      !session ||
      session.tenantId !== tenantId ||
      session.expiresAt < Date.now()
    ) {
      throw new ResourceNotFoundException('La subida no existe o ya se cerró.');
    }
    return session;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now) this.sessions.delete(id);
    }
  }
}
