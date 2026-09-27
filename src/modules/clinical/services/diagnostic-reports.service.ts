import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
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
import { ClinicalReadService } from './clinical-read.service';

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
   * @param clinicalRead - Política de escritura sobre la historia (MCH-007).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reportsRepo: DiagnosticReportsRepository,
    private readonly serviceRequestsRepo: ServiceRequestsRepository,
    private readonly logger: PinoLogger,
    private readonly clinicalRead: ClinicalReadService,
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

  /**
   * @deprecated (D-E, BR-17/CL-46) Este camino **no** escribe
   * `diagnostics.diagnostic_release_events`, así que lo liberado por acá nunca
   * llegó a `GET /diagnostic-results/me` — el paciente no lo veía en «Mis
   * resultados». Ese hallazgo (CV-02) hizo elegir un solo camino canónico:
   * `POST /diagnostics/reports/:reportId/versions/:versionId/release`
   * (`DiagnosticsReportsService.releaseVersion`), que sí registra el evento de
   * liberación con la visibilidad del paciente en la misma transacción.
   *
   * Se marca obsoleto **sin borrarlo** (así lo decidió D-E/Q-02): el contrato
   * UC-08-07 sigue teniendo spec en la API y el front, y borrarlo de golpe
   * rompía ambos sin aviso. Este método ya no libera nada — devuelve 422 con
   * el endpoint canónico en el mensaje — para que ningún llamador crea que
   * liberó un informe que el paciente jamás va a ver.
   */
  async release(
    reportId: string,
    _dto: ReleaseDiagnosticReportDto,
    actor: AuthenticatedUser,
  ): Promise<DiagnosticReportResponseDto> {
    const report = await this.reportsRepo.findById(this.em.fork(), reportId);
    if (!report) {
      throw new ResourceNotFoundException('Reporte diagnóstico no encontrado', {
        reportId,
      });
    }
    // MCH-007: la ruta sólo trae el id; el paciente sale de la fila. Se
    // mantiene la verificación de permiso aunque la ruta esté obsoleta: no
    // hay que revelar el estado de un reporte a quien no puede leerlo.
    await this.clinicalRead.assertPuedeEscribirHistoria(
      report.patientProfileId,
      actor,
    );
    this.logger.warn(
      { operation: 'clinical.diagnostic-report.release.deprecated', reportId },
      'Camino de liberación obsoleto (D-E): usar diagnostics/reports/:reportId/versions/:versionId/release',
    );
    throw new PreconditionFailedException(
      'Esta ruta ya no libera informes. Usá ' +
        'POST /diagnostics/reports/:reportId/versions/:versionId/release, ' +
        'que es el único camino que el paciente ve en «Mis resultados».',
      {
        reportId,
        canonicalEndpoint:
          'diagnostics/reports/:reportId/versions/:versionId/release',
      },
    );
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
