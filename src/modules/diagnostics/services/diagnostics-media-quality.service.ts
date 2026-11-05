import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash } from 'node:crypto';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import { MediaQualityRepository } from '../repositories';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsScopeService } from './diagnostics-scope.service';
import {
  AttachClinicalMediaDto,
  CreateDataQualityEventDto,
  ResourceCreatedDto,
} from '../dto';

/**
 * Casos de uso de media clínica y calidad de datos: adjuntar media/imagen al
 * chart con sus anotaciones (UC-20-12) y registrar un evento de calidad de datos
 * enlazando su provenance (UC-20-14).
 */
@Injectable()
export class DiagnosticsMediaQualityService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param scope - Resolvedor de recursos acotados al tenant activo.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: MediaQualityRepository,
    private readonly scope: DiagnosticsScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsMediaQualityService.name);
  }

  /** UC-20-12: adjunta media clínica y sus anotaciones. */
  async attachMedia(
    dto: AttachClinicalMediaDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.media.attach', fileId: dto.fileId },
      'Attaching clinical media',
    );
    return this.em.transactional(async (tx) => {
      const tenantId = this.scope.activeTenantFor(dto.custodianTenantId);
      // Archivo, encuentro e informe deben ser del tenant activo y del mismo
      // paciente, antes de escribir la primera fila.
      await this.scope.file(tx, dto.fileId);
      if (dto.encounterId) {
        await this.scope.encounter(tx, dto.encounterId, dto.patientProfileId);
      }
      if (dto.diagnosticReportId) {
        await this.scope.report(
          tx,
          dto.diagnosticReportId,
          dto.patientProfileId,
        );
      }
      // Un mismo archivo no genera dos medias.
      const dup = await this.repo.findMediaByFile(tx, dto.fileId);
      if (dup) {
        throw new ConflictException(
          'El archivo ya está adjunto como media clínica',
          { fileId: dto.fileId },
        );
      }

      const media = this.repo.createMedia(tx, {
        patientProfileId: dto.patientProfileId,
        mediaTypeConceptId: dto.mediaTypeConceptId ?? DIAG.MEDIA_TYPE_PHOTO,
        fileId: dto.fileId,
        statusConceptId: DIAG.MEDIA_STATUS_ACTIVE,
        custodianTenantId: tenantId,
        encounterId: dto.encounterId,
        diagnosticReportId: dto.diagnosticReportId,
        bodySiteConceptId: dto.bodySiteConceptId,
        viewConceptId: dto.viewConceptId,
        capturedAt: new Date(),
        capturedByProfileId: dto.capturedByProfileId,
        patientVisibilityConceptId: dto.patientVisibilityConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const a of dto.annotations ?? []) {
        this.repo.addAnnotation(tx, {
          clinicalMediaId: media.id,
          annotationTypeConceptId:
            a.annotationTypeConceptId ?? DIAG.ANNOTATION_TYPE_MANUAL,
          statusConceptId: DIAG.ANNOTATION_STATUS_ACTIVE,
          labelText: a.labelText,
          confidenceScore: a.confidenceScore,
          authorProfileId: a.authorProfileId,
          algorithmModelReference: a.algorithmModelReference,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      return { id: media.id, status: media.statusConceptId };
    });
  }

  /** UC-20-14: registra un evento de calidad de datos y su enlace de provenance. */
  async recordDataQualityEvent(
    dto: CreateDataQualityEventDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.dataQuality.record', ruleCode: dto.ruleCode },
      'Recording data-quality event',
    );
    return this.em.transactional(async (tx) => {
      const tenantId = this.scope.activeTenantFor(dto.custodianTenantId);
      await this.scope.dataQualityTarget(tx, dto.targetId);
      if (dto.provenanceSourceId) {
        await this.scope.dataQualityTarget(tx, dto.provenanceSourceId);
      }

      const now = new Date();
      const event = this.repo.createDataQualityEvent(tx, {
        custodianTenantId: tenantId,
        targetTypeConceptId: dto.targetTypeConceptId ?? DIAG.DQ_TARGET_SPECIMEN,
        targetId: dto.targetId,
        occurredAt: now,
        ruleCode: dto.ruleCode,
        severityConceptId: dto.severityConceptId ?? DIAG.DQ_SEVERITY_WARNING,
        statusConceptId: DIAG.DQ_OPEN,
        detailsJson: dto.detailsJson,
      });
      await tx.flush();

      // Enlaza provenance target->source si se aporta una fuente.
      if (dto.provenanceSourceId) {
        const contentHash = createHash('sha256')
          .update(`${dto.targetId}:${dto.provenanceSourceId}:${dto.ruleCode}`)
          .digest('hex');
        this.repo.addProvenanceLink(tx, {
          custodianTenantId: tenantId,
          targetTypeConceptId:
            dto.targetTypeConceptId ?? DIAG.PROVENANCE_TARGET,
          targetId: dto.targetId,
          sourceTypeConceptId:
            dto.provenanceSourceTypeConceptId ?? DIAG.PROVENANCE_SOURCE,
          sourceId: dto.provenanceSourceId,
          activityConceptId: DIAG.PROVENANCE_DERIVATION,
          contentHash,
          recordedAt: now,
          agentProfileId: this.scope.authorFor(actor, dto.agentProfileId),
        });
        await tx.flush();
      }

      return { id: event.id, status: event.statusConceptId };
    });
  }
}
