import { createHmac, timingSafeEqual } from 'node:crypto';
import { GoneException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { InsufficientRoleException } from '../../../../common/errors/domain.exception';
import {
  ErrorCode,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { resolveSecret } from '../../../../common/crypto/dev-secret';
import { FileUploadService } from '../../../common/services';
import { ProfilesErrorReason } from '../../profiles.error-reasons';
import { PractitionerAdmissionsRepository } from '../../infrastructure/repositories';
import { PractitionerAdmissionEvidenceService } from './practitioner-admission-evidence.service';
import type { AdmissionDocumentUrlDto } from '../../presentation/dto/admissions.dto';

/** Vida de la URL firmada de un documento: dos minutos. */
export const ADMISSION_DOCUMENT_URL_TTL_MS = 2 * 60 * 1000;

/** Tipos que el navegador puede mostrar en línea sin ejecutar nada activo. */
const INLINE_SAFE_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

/** Un documento listo para servir. */
export interface AdmissionDocumentContent {
  readonly buffer: Buffer;
  readonly mimeType: string;
  readonly disposition: 'inline' | 'attachment';
  readonly fileName: string;
}

function documentSecret(): string {
  return resolveSecret(
    'DOWNLOAD_URL_SECRET',
    'alovida-dev-download-secret',
    'firma de las URL de descarga de documentos de admisiones',
  );
}

/**
 * Documentos de una admisión: el revisor los abre por una URL firmada, atada a
 * su usuario y a la admisión, de vida corta y con cada emisión auditada
 * (`FILE_DOWNLOAD_URL_ISSUED`).
 *
 * ## Por qué no se usa `GET /common/files/:id/content`
 *
 * Esa ruta autoriza por propiedad del archivo o por rol de revisión de
 * plataforma: un `ADMISSIONS_REVIEWER` no es ninguno de los dos, y ampliar esa
 * lista le daría lectura de **cualquier** archivo. Acá la autorización es
 * contextual (BOLA): se sirve un archivo sólo si es de ESA admisión, y se
 * comprueba en la emisión **y** en cada apertura. Los bytes salen de
 * `downloadForAuthorizedContext`, que no autoriza nada por sí mismo.
 */
@Injectable()
export class PractitionerAdmissionDocumentsService {
  constructor(
    private readonly em: EntityManager,
    private readonly admissionsRepo: PractitionerAdmissionsRepository,
    private readonly evidence: PractitionerAdmissionEvidenceService,
    private readonly files: FileUploadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PractitionerAdmissionDocumentsService.name);
  }

  /** Emite la URL firmada de un documento de la admisión. */
  async issueUrl(
    admissionId: string,
    fileId: string,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<AdmissionDocumentUrlDto> {
    this.assertAllowedRole(actor);
    const em = this.em.fork();
    const facts = await this.assertFileBelongs(em, admissionId, fileId);
    const expiry = now.getTime() + ADMISSION_DOCUMENT_URL_TTL_MS;
    const signature = this.sign(admissionId, fileId, actor.id, expiry);
    return {
      url: `/admissions/${admissionId}/documents/${fileId}/content?expires=${expiry}&signature=${signature}`,
      expiresAt: new Date(expiry).toISOString(),
      name: facts.name,
      mimeType: facts.mimeType,
    };
  }

  /** Sirve el documento si la firma, el actor y la pertenencia son válidos. */
  async open(
    admissionId: string,
    fileId: string,
    query: { expires?: string; signature?: string },
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<AdmissionDocumentContent> {
    this.assertAllowedRole(actor);
    const expiry = Number(query.expires);
    if (!query.signature || !Number.isFinite(expiry)) throw invalidUrl();
    const expected = Buffer.from(this.sign(admissionId, fileId, actor.id, expiry), 'hex');
    const presented = Buffer.from(query.signature, 'hex');
    if (presented.length !== expected.length || !timingSafeEqual(presented, expected)) {
      throw invalidUrl();
    }
    if (expiry < now.getTime()) {
      throw new GoneException({
        code: ErrorCode.PRECONDITION_FAILED,
        message: 'La URL del documento venció',
        reason: ProfilesErrorReason.ADMISSION_DOCUMENT_URL_INVALID,
        details: { reason: 'URL_EXPIRED' },
      });
    }
    const em = this.em.fork();
    const facts = await this.assertFileBelongs(em, admissionId, fileId);
    const content = await this.files.downloadForAuthorizedContext(
      fileId,
      'profiles.admission.document',
    );
    const mimeType = INLINE_SAFE_MIME.has(content.mimeType)
      ? content.mimeType
      : 'application/octet-stream';
    return {
      buffer: content.buffer,
      mimeType,
      disposition: INLINE_SAFE_MIME.has(content.mimeType) ? 'inline' : 'attachment',
      fileName: content.originalName ?? facts.name,
    };
  }

  private assertAllowedRole(actor: AuthenticatedUser): void {
    const ok = actor.roles.some((r) =>
      ['ADMISSIONS_REVIEWER', 'ADMISSIONS_APPROVER', 'SECURITY_ADMIN', 'SUPERADMIN'].includes(r),
    );
    if (!ok) {
      throw new InsufficientRoleException(
        'Su rol no alcanza para abrir documentos de admisiones',
        {},
        ProfilesErrorReason.ADMISSION_ROLE_REQUIRED,
      );
    }
  }

  /** El archivo tiene que ser de ESTA admisión; si no, es como si no existiera. */
  private async assertFileBelongs(
    em: EntityManager,
    admissionId: string,
    fileId: string,
  ) {
    const admission = await this.admissionsRepo.findById(em, admissionId);
    const notFound = () =>
      new ResourceNotFoundException(
        'Documento no encontrado',
        {},
        ProfilesErrorReason.ADMISSION_DOCUMENT_NOT_FOUND,
      );
    if (!admission) throw notFound();
    const live = await this.evidence.collect(em, admission.practitionerProfileId);
    if (!live.items.some((item) => item.fileId === fileId)) {
      this.logger.warn(
        { operation: 'profiles.admission.document', admissionId },
        'Refused a document that does not belong to the admission',
      );
      throw notFound();
    }
    const facts = (await this.evidence.fileFacts(em, [fileId])).get(fileId);
    if (!facts) throw notFound();
    return facts;
  }

  private sign(admissionId: string, fileId: string, actorId: string, expiry: number): string {
    return createHmac('sha256', documentSecret())
      .update(`admission-doc:${admissionId}:${fileId}:${actorId}:${expiry}`)
      .digest('hex');
  }
}

function invalidUrl(): InsufficientRoleException {
  return new InsufficientRoleException(
    'La firma de la URL del documento no es válida',
    {},
    ProfilesErrorReason.ADMISSION_DOCUMENT_URL_INVALID,
  );
}
