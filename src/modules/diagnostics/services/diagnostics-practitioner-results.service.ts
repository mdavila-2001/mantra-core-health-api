import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { FileUploadService } from '../../common/services';
import type { FileContentDto } from '../../common/dto';
import type { Observations } from '../../clinical/entities';
import {
  ClinicalRefsRepository,
  DiagnosticOrdersRepository,
  ReportsRepository,
} from '../repositories';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import type {
  DiagnosticResultValueDto,
  PractitionerDiagnosticResultDto,
  ResultValueKind,
} from '../dto';
import type { DiagnosticReportVersions } from '../entities';

/**
 * El resultado liberado de un informe, leído por quien atiende al paciente.
 *
 * ## Quién decide el acceso
 *
 * La pregunta «¿puede este actor leer la historia de este paciente?» la
 * contesta `ClinicalRecordAccessGuard` en el controlador, igual que en
 * `GET /diagnostics/patients/:id/orders`: este servicio no la repite. Lo que sí
 * decide es que el informe pedido sea **de ese paciente, de la organización
 * activa y esté liberado** — el mismo acotamiento por tenant y paciente con el
 * que la lista de órdenes lo encuentra.
 *
 * ## Por qué todo lo que no cumple es el mismo 404
 *
 * Inexistente, de otro paciente, de otra organización o sin versión liberada
 * responden igual, con el mismo mensaje y `reason`: distinguirlos le diría a
 * quien pregunta que un UUID existe o que hay un borrador en curso.
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
   * @param ordersRepo - Informes del circuito diagnóstico.
   * @param reportsRepo - Versiones, eventos de liberación, archivos y resultados.
   * @param refsRepo - Observaciones, rangos, archivos y conceptos de otros dominios.
   * @param logger - Registro estructurado.
   * @param fileUpload - Bytes de un archivo ya autorizado por contexto.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly ordersRepo: DiagnosticOrdersRepository,
    private readonly reportsRepo: ReportsRepository,
    private readonly refsRepo: ClinicalRefsRepository,
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
   * @returns La versión liberada con sus valores y archivos.
   * @throws ResourceNotFoundException si no existe, no es de ese paciente o
   *   tenant, o no tiene versión liberada.
   */
  async getReleasedResult(
    custodianTenantId: string,
    patientProfileId: string,
    reportId: string,
  ): Promise<PractitionerDiagnosticResultDto> {
    this.logger.info(
      { operation: 'diagnostics.practitioner-result.read', reportId },
      'Leyendo el resultado liberado de un informe',
    );
    const em = this.em.fork();
    const { report, version, release } = await this.requireReleased(
      em,
      custodianTenantId,
      patientProfileId,
      reportId,
    );

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
    const rangeByObservation = new Map<string, (typeof ranges)[number]>();
    for (const range of ranges) {
      if (range.observationComponentId) continue;
      if (!rangeByObservation.has(range.observationId)) {
        rangeByObservation.set(range.observationId, range);
      }
    }
    const fileNameById = new Map(
      files.map((file) => [file.id, file.originalName ?? null]),
    );

    const conceptIds: string[] = [report.codeConceptId];
    for (const o of observations) {
      conceptIds.push(o.codeConceptId);
      if (o.quantityUnitConceptId) conceptIds.push(o.quantityUnitConceptId);
      if (o.interpretationConceptId) conceptIds.push(o.interpretationConceptId);
      if (o.valueConceptId) conceptIds.push(o.valueConceptId);
    }
    for (const range of rangeByObservation.values()) {
      if (range.unitConceptId) conceptIds.push(range.unitConceptId);
    }
    const labels = await this.refsRepo.findConceptLabels(em, conceptIds);
    const display = (id?: string | null): string | null =>
      id ? (labels.get(id)?.display ?? null) : null;

    const values: DiagnosticResultValueDto[] = [];
    for (const link of links) {
      const o = observationById.get(link.observationId);
      // Un enlace a una observación que ya no se puede leer no se inventa.
      if (!o) continue;
      const range = rangeByObservation.get(o.id);
      const { value, valueKind } = valueOf(o, display);
      values.push({
        observationId: o.id,
        codeConceptId: o.codeConceptId,
        name: display(o.codeConceptId),
        value,
        valueKind,
        valueConceptId: o.valueConceptId ?? null,
        unitConceptId: o.quantityUnitConceptId ?? null,
        unit: display(o.quantityUnitConceptId),
        referenceRange: range
          ? {
              low: range.lowValue ?? null,
              high: range.highValue ?? null,
              text: range.text ?? null,
              unitConceptId: range.unitConceptId ?? null,
              unit: display(range.unitConceptId),
            }
          : null,
        interpretationConceptId: o.interpretationConceptId ?? null,
        interpretationCode: o.interpretationConceptId
          ? (labels.get(o.interpretationConceptId)?.code ?? null)
          : null,
        interpretation: display(o.interpretationConceptId),
        statusConceptId: o.statusConceptId,
        effectiveAt: o.effectiveStartAt ?? null,
      });
    }

    return {
      reportId: report.id,
      patientProfileId: report.patientProfileId,
      serviceRequestId: report.serviceRequestId ?? null,
      codeConceptId: report.codeConceptId,
      codeDisplay: display(report.codeConceptId),
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
   * historia del paciente; acá se exige que el informe sea de ese paciente y
   * tenant, esté liberado y que el archivo cuelgue de esa versión. Todo lo que
   * no cumpla es el mismo 404.
   *
   * @param custodianTenantId - Tenant del contexto.
   * @param patientProfileId - Paciente de la ruta.
   * @param reportId - Informe.
   * @param fileId - Archivo del informe.
   * @returns Bytes y tipo MIME.
   */
  async getReleasedResultFileContent(
    custodianTenantId: string,
    patientProfileId: string,
    reportId: string,
    fileId: string,
  ): Promise<FileContentDto> {
    const em = this.em.fork();
    const { version } = await this.requireReleased(
      em,
      custodianTenantId,
      patientProfileId,
      reportId,
    );
    const files = await this.reportsRepo.findFilesByVersions(em, [version.id]);
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
    return this.fileUpload.downloadForAuthorizedContext(
      fileId,
      'diagnostics.practitioner-result.file.content',
    );
  }

  /**
   * El informe con su versión liberada vigente y el evento que la liberó.
   *
   * @param em - Contexto de persistencia.
   * @param custodianTenantId - Tenant del contexto.
   * @param patientProfileId - Paciente de la ruta.
   * @param reportId - Informe pedido.
   * @returns Informe, versión y evento.
   * @throws ResourceNotFoundException en cualquier otro caso.
   */
  private async requireReleased(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    reportId: string,
  ) {
    const report = await this.ordersRepo.findReportById(em, reportId);
    if (
      !report ||
      report.custodianTenantId !== custodianTenantId ||
      report.patientProfileId !== patientProfileId
    ) {
      throw notFound(reportId);
    }

    const versions = await this.reportsRepo.findVersionsByReports(em, [
      report.id,
    ]);
    const releases = await this.reportsRepo.findReleaseEventsByVersions(
      em,
      versions.map((version) => version.id),
    );
    // Los eventos llegan del más nuevo al más viejo: el primero de cada versión
    // es la decisión vigente.
    const lastEvent = new Map<string, (typeof releases)[number]>();
    for (const event of releases) {
      const versionId = event.diagnosticReportVersionId;
      if (versionId === undefined || lastEvent.has(versionId)) continue;
      lastEvent.set(versionId, event);
    }

    let chosen: DiagnosticReportVersions | undefined;
    for (const version of versions) {
      const event = lastEvent.get(version.id);
      if (event?.actionConceptId !== DIAG.RELEASE_ACTION_RELEASE) continue;
      if (!chosen || version.versionNumber > chosen.versionNumber) {
        chosen = version;
      }
    }
    const release = chosen ? lastEvent.get(chosen.id) : undefined;
    if (!chosen || !release) {
      throw notFound(reportId);
    }
    return { report, version: chosen, release };
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

/**
 * El valor de la observación como texto, y de qué columna salió.
 *
 * Una observación lleva un único tipo de valor (contrato de
 * `ObservationsService`); se toma el primero presente en este orden.
 */
function valueOf(
  o: Observations,
  display: (id?: string | null) => string | null,
): { value: string | null; valueKind: ResultValueKind | null } {
  if (o.quantityValue != null)
    return { value: o.quantityValue, valueKind: 'QUANTITY' };
  if (o.valueDecimal != null)
    return { value: o.valueDecimal, valueKind: 'DECIMAL' };
  if (o.valueInteger != null)
    return { value: String(o.valueInteger), valueKind: 'INTEGER' };
  if (o.valueText != null) return { value: o.valueText, valueKind: 'TEXT' };
  if (o.valueBoolean != null)
    return { value: String(o.valueBoolean), valueKind: 'BOOLEAN' };
  if (o.valueConceptId)
    return { value: display(o.valueConceptId), valueKind: 'CONCEPT' };
  if (o.valueDatetime)
    return {
      value: new Date(o.valueDatetime).toISOString(),
      valueKind: 'DATETIME',
    };
  if (o.valueDate)
    return {
      value: new Date(o.valueDate).toISOString().slice(0, 10),
      valueKind: 'DATE',
    };
  return { value: null, valueKind: null };
}
