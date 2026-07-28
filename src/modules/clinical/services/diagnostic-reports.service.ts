import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  DiagnosticReportsRepository,
  ServiceRequestsRepository,
} from '../repositories';
import {
  CreateDiagnosticReportDto,
  DiagnosticReportResponseDto,
  ReleaseDiagnosticReportDto,
} from '../dto';
import { CLIN } from '../clinical.concepts';

/**
 * UC-08-06 (crear) y UC-08-07 (liberar) de reportes diagnósticos. Al crear desde
 * una orden, ésta se marca completada; al liberar, el reporte pasa a final y sus
 * resultados quedan liberados.
 */
@Injectable()
export class DiagnosticReportsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reportsRepo - Valor de reports repo requerido por la operación.
   * @param serviceRequestsRepo - Valor de service requests repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reportsRepo: DiagnosticReportsRepository,
    private readonly serviceRequestsRepo: ServiceRequestsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticReportsService.name);
  }

  /** UC-08-06: emite un reporte diagnóstico parcial con resultados retenidos. */
  async create(
    dto: CreateDiagnosticReportDto,
    actor: AuthenticatedUser,
  ): Promise<DiagnosticReportResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.diagnostic-report.create',
        patientProfileId: dto.patientProfileId,
      },
      'Creating diagnostic report',
    );
    return this.em.transactional(async (tx) => {
      if (dto.serviceRequestId) {
        const sr = await this.serviceRequestsRepo.findById(
          tx,
          dto.serviceRequestId,
        );
        if (!sr) {
          throw new ResourceNotFoundException(
            'Orden de servicio no encontrada',
            {
              serviceRequestId: dto.serviceRequestId,
            },
          );
        }
        sr.statusConceptId = CLIN.SERVICE_REQUEST_COMPLETED;
        touch(sr, actor.id);
      }

      const report = this.reportsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        serviceRequestId: dto.serviceRequestId,
        encounterId: dto.encounterId,
        codeConceptId: dto.codeConceptId,
        categoryConceptId: dto.categoryConceptId,
        lifecycleStatusConceptId: CLIN.REPORT_PARTIAL,
        resultReleaseStatusConceptId: CLIN.RELEASE_HELD,
        currentVersionId: dto.currentVersionId,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.diagnostic-report.create', reportId: report.id },
        'Diagnostic report created',
      );
      return this.toResponse(report);
    });
  }

  /** UC-08-07: libera los resultados de un reporte (preliminary/partial → final). */
  async release(
    reportId: string,
    dto: ReleaseDiagnosticReportDto,
    actor: AuthenticatedUser,
  ): Promise<DiagnosticReportResponseDto> {
    this.logger.info(
      { operation: 'clinical.diagnostic-report.release', reportId },
      'Releasing diagnostic report',
    );
    return this.em.transactional(async (tx) => {
      const report = await this.reportsRepo.findById(tx, reportId);
      if (!report) {
        throw new ResourceNotFoundException(
          'Reporte diagnóstico no encontrado',
          { reportId },
        );
      }
      const releasable = [CLIN.REPORT_PARTIAL, CLIN.REPORT_PRELIMINARY];
      if (!releasable.includes(report.lifecycleStatusConceptId)) {
        throw new PreconditionFailedException(
          'El reporte no está en estado liberable',
          {
            reportId,
            status: report.lifecycleStatusConceptId,
          },
        );
      }
      if (
        dto.expectedRowVersion !== undefined &&
        dto.expectedRowVersion !== report.rowVersion
      ) {
        throw new ConcurrencyConflictException(
          'Versión del reporte desactualizada',
          {
            expected: dto.expectedRowVersion,
            actual: report.rowVersion,
          },
        );
      }

      report.lifecycleStatusConceptId = CLIN.REPORT_FINAL;
      report.resultReleaseStatusConceptId = CLIN.RELEASE_RELEASED;
      if (report.currentVersionId) {
        report.currentReleasedVersionId = report.currentVersionId;
      }
      touch(report, actor.id);
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.diagnostic-report.release', reportId },
        'Diagnostic report released',
      );
      return this.toResponse(report);
    });
  }

  /**
   * Transforma to response.
   *
   * @param report - Valor de report requerido por la operación.
   * @returns Resultado de to response conforme al contrato `DiagnosticReportResponseDto`.
   */
  private toResponse(report: {
    /**
     * Identificador único de la instancia.
     */
    id: string;
    /**
     * Identificador asociado a patient profile.
     */
    patientProfileId: string;
    /**
     * Identificador asociado a lifecycle status concept.
     */
    lifecycleStatusConceptId: string;
    /**
     * Identificador asociado a result release status concept.
     */
    resultReleaseStatusConceptId?: string;
    /**
     * Identificador asociado a service request.
     */
    serviceRequestId?: string;
    /**
     * Fecha y hora en que se creó el registro.
     */
    createdAt: Date;
  }): DiagnosticReportResponseDto {
    return {
      id: report.id,
      patientProfileId: report.patientProfileId,
      lifecycleStatus: report.lifecycleStatusConceptId,
      resultReleaseStatus: report.resultReleaseStatusConceptId ?? null,
      serviceRequestId: report.serviceRequestId ?? null,
      createdAt: report.createdAt,
    };
  }
}
