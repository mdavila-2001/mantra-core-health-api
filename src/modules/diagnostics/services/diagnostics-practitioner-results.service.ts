import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { FileUploadService } from '../../common/services';
import type { FileContentDto } from '../../common/dto';
import { DiagnosticReports } from '../../clinical/entities';
import type { ClinicalReadScope } from '../../clinical/domain/clinical-read-scope';
import { ClinicalScopeFilterService } from '../../clinical/services/clinical-scope-filter.service';
import { ClinicalRefsRepository, ReportsRepository } from '../repositories';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import type {
  DiagnosticResultValueDto,
  PractitionerDiagnosticResultDto,
} from '../dto';
import { ownReportsWhere } from './chart-report-visibility';
import { RequesterReportsReader } from './requester-reports.reader';
import {
  conceptIdsOf,
  currentRelease,
  rangeByObservation,
  toResultValue,
} from './practitioner-result.values';

/**
 * El resultado liberado de un informe, leído por quien atiende al paciente.
 *
 * ## Quién decide el acceso
 *
 * La pregunta «¿puede este actor leer la historia de este paciente?» la
 * contesta `ClinicalRecordAccessGuard` en el controlador, igual que en
 * `GET /diagnostics/patients/:id/orders`: este servicio no la repite. Lo que sí
 * decide es que el informe pedido sea **uno que esa lista le mostraría** (mismo
 * alcance de lectura, mismo predicado: `ownReportsWhere` para los que custodia
 * la organización activa y `RequesterReportsReader` para los que custodia el
 * laboratorio de una orden propia) **y esté liberado**.
 *
 * ## Por qué todo lo que no cumple es el mismo 404
 *
 * Inexistente, de otro paciente, de otra organización, fuera del alcance de
 * lectura o sin versión liberada responden igual, con el mismo mensaje y
 * `reason`: distinguirlos le diría a quien pregunta que un UUID existe o que
 * hay un borrador en curso.
 *
 * ## Qué es «liberado» acá
 *
 * Una versión cuyo **último** evento de liberación es la acción de liberar,
 * con cualquier visibilidad: lo oculto lo es para el paciente, no para quien
 * lo atiende. De varias, gana la de número más alto (una enmienda reemplaza a
 * la versión que corrige). Mismo recorrido que el portal del paciente, sin su
 * filtro de visibilidad.
 */
@Injectable()
export class DiagnosticsPractitionerResultsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param reportsRepo - Versiones, eventos de liberación, archivos y resultados.
   * @param refsRepo - Observaciones, rangos, archivos y conceptos de otros dominios.
   * @param scopeFilter - Alcance de lectura hecho filtro, como en la lista.
   * @param requesterReports - Informes de órdenes propias que custodia el laboratorio.
   * @param logger - Registro estructurado.
   * @param fileUpload - Bytes de un archivo ya autorizado por contexto.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reportsRepo: ReportsRepository,
    private readonly refsRepo: ClinicalRefsRepository,
    private readonly scopeFilter: ClinicalScopeFilterService,
    private readonly requesterReports: RequesterReportsReader,
    private readonly logger: PinoLogger,
    private readonly fileUpload?: FileUploadService,
  ) {
    this.logger.setContext(DiagnosticsPractitionerResultsService.name);
  }

  /**
   * El resultado liberado de un informe del paciente.
   *
   * @param custodianTenantId - Tenant del contexto.
   * @param patientProfileId - Paciente de la ruta (ya autorizado por el guard).
   * @param reportId - Informe pedido.
   * @param scope - Alcance de lectura que resolvió el guard, como en la lista.
   * @returns La versión liberada con sus valores y archivos.
   * @throws ResourceNotFoundException si la lista no lo mostraría o no tiene
   *   versión liberada.
   */
  async getReleasedResult(
    custodianTenantId: string,
    patientProfileId: string,
    reportId: string,
    scope: ClinicalReadScope,
  ): Promise<PractitionerDiagnosticResultDto> {
    this.logger.info(
      { operation: 'diagnostics.practitioner-result.read', reportId },
      'Leyendo el resultado liberado de un informe',
    );
    return this.readVisible(
      custodianTenantId,
      patientProfileId,
      reportId,
      scope,
      (em, report) => this.project(em, report),
    );
  }

  /** The released version of a visible report, with its values and files. */
  private async project(
    em: EntityManager,
    report: DiagnosticReports,
  ): Promise<PractitionerDiagnosticResultDto> {
    const { version, release } = await this.requireReleased(em, report);
    const [links, reportFiles] = await Promise.all([
      this.reportsRepo.findResultsByVersions(em, [version.id]),
      this.reportsRepo.findFilesByVersions(em, [version.id]),
    ]);
    const observationIds = links.map((link) => link.observationId);
    const [observations, ranges, files] = await Promise.all([
      this.refsRepo.findObservations(em, observationIds),
      this.refsRepo.findReferenceRanges(em, observationIds),
      this.refsRepo.findFiles(
        em,
        reportFiles.map((file) => file.fileId),
      ),
    ]);

    const observationById = new Map(observations.map((o) => [o.id, o]));
    const rangeOf = rangeByObservation(ranges);
    const fileNameById = new Map(
      files.map((file) => [file.id, file.originalName ?? null]),
    );
    const labels = await this.refsRepo.findConceptLabels(em, [
      report.codeConceptId,
      ...conceptIdsOf(observations, rangeOf.values()),
    ]);

    const values: DiagnosticResultValueDto[] = [];
    for (const link of links) {
      const o = observationById.get(link.observationId);
      // Un enlace a una observación que ya no se puede leer no se inventa.
      if (o) values.push(toResultValue(o, rangeOf.get(o.id), labels));
    }

    return {
      reportId: report.id,
      patientProfileId: report.patientProfileId,
      serviceRequestId: report.serviceRequestId ?? null,
      codeConceptId: report.codeConceptId,
      codeDisplay: labels.get(report.codeConceptId)?.display ?? null,
      categoryConceptId: report.categoryConceptId ?? null,
      versionId: version.id,
      versionNumber: version.versionNumber,
      clinicalStatusConceptId: version.clinicalStatusConceptId,
      issuedAt: version.issuedAt ?? null,
      releasedAt: release.recordedAt,
      patientVisible:
        release.patientVisibilityConceptId === DIAG.VISIBILITY_PATIENT_VISIBLE,
      conclusionText: version.conclusionText ?? null,
      values,
      files: reportFiles.map((file) => ({
        id: file.id,
        fileId: file.fileId,
        name: fileNameById.get(file.fileId) ?? null,
        contentRoleConceptId: file.contentRoleConceptId,
        presentationFormatConceptId: file.presentationFormatConceptId ?? null,
        ordinal: file.ordinal ?? null,
      })),
    };
  }

  /**
   * Los bytes de un archivo de la versión liberada del informe.
   *
   * Autoriza por contexto antes de pedir los bytes (contrato de
   * `downloadForAuthorizedContext`): el guard ya decidió el acceso a la
   * historia del paciente; acá se exige que el informe sea uno que la lista le
   * mostraría, esté liberado y que el archivo cuelgue de esa versión. Todo lo
   * que no cumpla es el mismo 404.
   *
   * @param custodianTenantId - Tenant del contexto.
   * @param patientProfileId - Paciente de la ruta.
   * @param reportId - Informe.
   * @param fileId - Archivo del informe.
   * @param scope - Alcance de lectura que resolvió el guard.
   * @returns Bytes y tipo MIME.
   */
  async getReleasedResultFileContent(
    custodianTenantId: string,
    patientProfileId: string,
    reportId: string,
    fileId: string,
    scope: ClinicalReadScope,
  ): Promise<FileContentDto> {
    return this.readVisible(
      custodianTenantId,
      patientProfileId,
      reportId,
      scope,
      async (em, report) => {
        const { version } = await this.requireReleased(em, report);
        const files = await this.reportsRepo.findFilesByVersions(em, [
          version.id,
        ]);
        if (!files.some((file) => file.fileId === fileId)) {
          throw notFound(reportId);
        }
        if (!this.fileUpload) {
          throw new PreconditionFailedException(
            'La descarga de archivos no está disponible',
          );
        }
        this.logger.info(
          {
            operation: 'diagnostics.practitioner-result.file.content',
            reportId,
            fileId,
          },
          'Quien atiende descarga un archivo de un resultado liberado',
        );
        // Inside `work`: a laboratory-custodied file is read in the same bounded window.
        return this.fileUpload.downloadForAuthorizedContext(
          fileId,
          'diagnostics.practitioner-result.file.content',
        );
      },
    );
  }

  /**
   * Runs `work` on the report only if the chart list would show it to this
   * reader: one the tenant custodies under the scope (`ownReportsWhere`), or
   * one the laboratory custodies for an order of this tenant, read in the
   * reader's bounded system window. Anything else is the single 404.
   */
  private async readVisible<T>(
    custodianTenantId: string,
    patientProfileId: string,
    reportId: string,
    scope: ClinicalReadScope,
    work: (em: EntityManager, report: DiagnosticReports) => Promise<T>,
  ): Promise<T> {
    const em = this.em.fork();
    const filter = await this.scopeFilter.build(em, patientProfileId, scope);
    const own = await em.findOne(DiagnosticReports, {
      $and: [
        { id: reportId },
        ownReportsWhere(custodianTenantId, patientProfileId, filter),
      ],
    });
    if (own) return work(em, own);
    const issued = await this.requesterReports.readIssued(
      custodianTenantId,
      patientProfileId,
      reportId,
      filter,
      work,
    );
    if (!issued) throw notFound(reportId);
    return issued.value;
  }

  /**
   * La versión liberada vigente de un informe visible y el evento que la liberó.
   *
   * @param em - Contexto de persistencia.
   * @param report - Informe ya resuelto por {@link readVisible}.
   * @returns Versión y evento.
   * @throws ResourceNotFoundException si no tiene versión liberada.
   */
  private async requireReleased(em: EntityManager, report: DiagnosticReports) {
    const versions = await this.reportsRepo.findVersionsByReports(em, [
      report.id,
    ]);
    const releases = await this.reportsRepo.findReleaseEventsByVersions(
      em,
      versions.map((version) => version.id),
    );
    const { chosen, release } = currentRelease(versions, releases);
    if (!chosen || !release) {
      throw notFound(report.id);
    }
    return { version: chosen, release };
  }
}

/** El único 404 de esta lectura, igual para todos los casos. */
function notFound(reportId: string): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Informe no encontrado',
    { reportId },
    DiagnosticsErrorReason.DIAGNOSTICS_RESOURCE_NOT_AVAILABLE,
  );
}
