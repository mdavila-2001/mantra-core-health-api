import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticReports, ServiceRequests } from '../entities';
import { DiagnosticReportVersions } from '../../diagnostics/entities';
import { Tenants } from '../../directory/entities';
import { CatalogConcepts } from '../../terminology/entities';
import { ConceptDesignationsRepository } from '../../terminology/repositories';
import { CLIN } from '../clinical.concepts';
import { CONCEPTS } from '../../../common';

/** Ventana por defecto de la regla de antiduplicación (T-26), en días. */
export const DEFAULT_DUPLICATE_STUDY_WINDOW_DAYS = 30;
/** Tope defendible del parámetro de ventana del chequeo. */
export const MAX_DUPLICATE_STUDY_WINDOW_DAYS = 365;

/** El informe previo que el motor encontró dentro de la ventana. */
export interface DuplicateStudyMatch {
  readonly report: DiagnosticReports;
  readonly version: DiagnosticReportVersions | null;
  readonly performedAt: Date;
  readonly resultsAvailable: boolean;
}

/** El estudio previo, listo para viajar en un DTO de respuesta. */
export interface PreviousStudyDescription {
  readonly reportId: string;
  readonly serviceRequestId: string | null;
  readonly studyName: string;
  readonly providerName: string;
  readonly performedAt: Date;
  readonly daysAgo: number;
  readonly resultsAvailable: boolean;
  readonly conclusionText: string | null;
  readonly reportDownloadUrl: null;
  readonly sameOrganization: boolean;
}

/**
 * Antiduplicación de estudios de laboratorio e imagenología (subtarea 3.2,
 * T-26, brecha §23). Clase sin estado (`EntityManager` por parámetro), igual
 * que `DeclaredCoveragesReader`: se provee directo en `ClinicalModule` y en
 * `InsuranceModule`, sin importar el módulo entero del otro y sin cerrar
 * ningún ciclo de DI.
 *
 * **Qué cuenta como "el mismo estudio ya realizado"**: un informe diagnóstico
 * del mismo paciente y del mismo `code_concept_id`, liberado o final. Hay dos
 * caminos de liberación en el sistema y escriben cosas distintas —
 * `POST /clinical/diagnostic-reports/:id/release` pone
 * `lifecycle_status = REPORT_FINAL` sin versión, y
 * `POST /diagnostics/reports/:id/versions/:vid/release` deja
 * `current_released_version_id` con `VISIBILITY_PATIENT_VISIBLE` sin tocar
 * `lifecycle_status` — así que se aceptan los dos, no uno solo.
 *
 * **Qué NO hace**: no decide autorización (eso lo resuelve quien llama, con
 * `ClinicalReadService.assertPuedeLeerHistoria`) y no persiste nada.
 */
@Injectable()
export class DuplicateStudyDetector {
  constructor(
    private readonly conceptDesignations: ConceptDesignationsRepository,
  ) {}

  /**
   * Busca, dentro de la ventana, el informe más reciente del mismo paciente y
   * del mismo estudio que cuente como "ya realizado".
   *
   * Cruza organizaciones a propósito, con el mismo criterio que
   * `DiagnosticOrdersRepository.findReportsForPatientPortal`: alguien puede
   * haberse hecho el estudio en un centro distinto del que hoy lo atiende, y
   * es exactamente el caso que la regla del stakeholder quiere evitar.
   *
   * @param em - Contexto de persistencia.
   * @param patientProfileId - Paciente cuyo historial se revisa.
   * @param codeConceptId - Estudio pedido (concepto clínico).
   * @param windowDays - Ventana en días hacia atrás desde `now`.
   * @param now - Instante de referencia (inyectado para poder probarlo).
   * @returns El duplicado más reciente, o `null` si no hay ninguno en la ventana.
   */
  async findDuplicate(
    em: EntityManager,
    patientProfileId: string,
    codeConceptId: string,
    windowDays: number,
    now: Date,
  ): Promise<DuplicateStudyMatch | null> {
    const candidates = await em.find(
      DiagnosticReports,
      { patientProfileId, codeConceptId },
      { orderBy: { updatedAt: 'DESC' } },
    );
    if (candidates.length === 0) return null;

    const revoked = await this.revokedServiceRequestIds(em, candidates);
    const versionByReport = await this.releasedVersionsByReport(em, candidates);

    const windowStart = new Date(
      now.getTime() - windowDays * 24 * 60 * 60 * 1000,
    );

    for (const report of candidates) {
      if (report.serviceRequestId && revoked.has(report.serviceRequestId)) {
        continue;
      }
      const version = versionByReport.get(report.id) ?? null;
      const resultsAvailable = this.isReleased(report, version);
      const isFinalOrReleased =
        resultsAvailable ||
        report.lifecycleStatusConceptId === CLIN.REPORT_FINAL;
      if (!isFinalOrReleased) continue;

      const performedAt =
        version?.issuedAt ?? version?.recordedAt ?? report.updatedAt;
      if (performedAt < windowStart) continue;

      return { report, version, performedAt, resultsAvailable };
    }
    return null;
  }

  /**
   * Si el mismo estudio tiene un informe TODAVÍA sin liberar dentro de la
   * ventana. Informativo: no exige justificación, sólo avisa que hay un
   * resultado en camino.
   */
  async findPendingReport(
    em: EntityManager,
    patientProfileId: string,
    codeConceptId: string,
    windowDays: number,
    now: Date,
  ): Promise<boolean> {
    const windowStart = new Date(
      now.getTime() - windowDays * 24 * 60 * 60 * 1000,
    );
    const reports = await em.find(DiagnosticReports, {
      patientProfileId,
      codeConceptId,
      updatedAt: { $gte: windowStart },
    });
    return reports.some(
      (report) =>
        report.lifecycleStatusConceptId !== CLIN.REPORT_FINAL &&
        report.currentReleasedVersionId === undefined,
    );
  }

  /**
   * Arma la descripción del estudio previo lista para un DTO de respuesta.
   *
   * @param em - Contexto de persistencia.
   * @param match - El duplicado encontrado por {@link findDuplicate}.
   * @param requesterTenantId - Tenant activo de quien pide la descripción.
   * @param referenceDate - Instante contra el que se calcula `daysAgo`. En el
   *   chequeo es "ahora"; en el detalle del reclamo, la fecha de la orden.
   * @param includeConclusion - Si `false`, nunca devuelve el texto del
   *   informe (la cara del reclamo no accede a la conclusión clínica).
   */
  async describe(
    em: EntityManager,
    match: DuplicateStudyMatch,
    requesterTenantId: string,
    referenceDate: Date,
    includeConclusion: boolean,
  ): Promise<PreviousStudyDescription> {
    const { report, version, performedAt, resultsAvailable } = match;
    const sameOrganization = report.custodianTenantId === requesterTenantId;

    const [studyName, providerName] = await Promise.all([
      this.designationOrDisplay(em, report.codeConceptId),
      this.providerName(
        em,
        version?.performerTenantId ?? report.custodianTenantId,
      ),
    ]);

    const daysAgo = Math.max(
      0,
      Math.floor(
        (referenceDate.getTime() - performedAt.getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    );

    return {
      reportId: report.id,
      serviceRequestId: report.serviceRequestId ?? null,
      studyName,
      providerName,
      performedAt,
      daysAgo,
      resultsAvailable,
      conclusionText:
        includeConclusion && sameOrganization
          ? (version?.conclusionText ?? null)
          : null,
      reportDownloadUrl: null,
      sameOrganization,
    };
  }

  /**
   * Arma la descripción de un informe previo ya conocido por id (el caso del
   * detalle del reclamo: `service_requests.previous_diagnostic_report_id` ya
   * dice cuál es, no hace falta re-buscar el duplicado).
   *
   * @param em - Contexto de persistencia.
   * @param reportId - El informe enlazado.
   * @param requesterTenantId - Tenant activo de quien pide la descripción.
   * @param referenceDate - Instante contra el que se calcula `daysAgo`.
   * @param includeConclusion - Si `false`, nunca devuelve el texto del informe.
   * @returns La descripción, o `null` si el informe ya no existe.
   */
  async describeByReportId(
    em: EntityManager,
    reportId: string,
    requesterTenantId: string,
    referenceDate: Date,
    includeConclusion: boolean,
  ): Promise<PreviousStudyDescription | null> {
    const report = await em.findOne(DiagnosticReports, { id: reportId });
    if (!report) return null;

    const version = report.currentReleasedVersionId
      ? await em.findOne(DiagnosticReportVersions, {
          id: report.currentReleasedVersionId,
        })
      : null;
    const resultsAvailable = this.isReleased(report, version);
    const performedAt =
      version?.issuedAt ?? version?.recordedAt ?? report.updatedAt;

    return this.describe(
      em,
      { report, version, performedAt, resultsAvailable },
      requesterTenantId,
      referenceDate,
      includeConclusion,
    );
  }

  /**
   * El texto de advertencia en castellano para el chequeo (UC del prompt:
   * "El paciente ya cuenta con este estudio…").
   */
  warningMessageFor(description: PreviousStudyDescription): string {
    const plural = description.daysAgo === 1 ? 'día' : 'días';
    return (
      `El paciente ya cuenta con este estudio (${description.studyName}) ` +
      `realizado hace ${description.daysAgo} ${plural} ` +
      `en ${description.providerName}.`
    );
  }

  /**
   * "Con resultado" es `current_released_version_id` presente, o el camino
   * `clinical` de liberación (`RELEASE_RELEASED`), o el evento de liberación
   * de `diagnostics` (versión con `current_released_version_id`). Los dos
   * caminos de la API escriben cosas distintas: ninguno alcanza solo.
   */
  private isReleased(
    report: DiagnosticReports,
    version: DiagnosticReportVersions | null,
  ): boolean {
    if (report.currentReleasedVersionId !== undefined) return true;
    if (report.resultReleaseStatusConceptId === CLIN.RELEASE_RELEASED)
      return true;
    return version !== null;
  }

  /** Las órdenes revocadas de un lote de informes, en una sola consulta. */
  private async revokedServiceRequestIds(
    em: EntityManager,
    reports: readonly DiagnosticReports[],
  ): Promise<ReadonlySet<string>> {
    const serviceRequestIds = [
      ...new Set(
        reports
          .map((report) => report.serviceRequestId)
          .filter((id): id is string => id !== undefined),
      ),
    ];
    if (serviceRequestIds.length === 0) return new Set();
    const orders = await em.find(ServiceRequests, {
      id: { $in: serviceRequestIds },
      statusConceptId: CLIN.SERVICE_REQUEST_REVOKED,
    });
    return new Set(orders.map((order) => order.id));
  }

  /**
   * La versión liberada de cada informe (por `current_released_version_id`),
   * en una sola consulta por lote.
   */
  private async releasedVersionsByReport(
    em: EntityManager,
    reports: readonly DiagnosticReports[],
  ): Promise<Map<string, DiagnosticReportVersions>> {
    const versionIds = [
      ...new Set(
        reports
          .map((report) => report.currentReleasedVersionId)
          .filter((id): id is string => id !== undefined),
      ),
    ];
    if (versionIds.length === 0) return new Map();
    const versions = await em.find(DiagnosticReportVersions, {
      id: { $in: versionIds },
    });
    const versionById = new Map(
      versions.map((version) => [version.id, version]),
    );
    const byReport = new Map<string, DiagnosticReportVersions>();
    for (const report of reports) {
      if (report.currentReleasedVersionId === undefined) continue;
      const version = versionById.get(report.currentReleasedVersionId);
      if (version) byReport.set(report.id, version);
    }
    return byReport;
  }

  /** El nombre del estudio en castellano, con reserva al `display` del catálogo. */
  private async designationOrDisplay(
    em: EntityManager,
    conceptId: string,
  ): Promise<string> {
    const designations =
      await this.conceptDesignations.findPreferredByLanguageForConcepts(
        em,
        [conceptId],
        CONCEPTS.LANG_ES,
      );
    const designated = designations.get(conceptId)?.value;
    if (designated) return designated;
    const concept = await em.findOne(CatalogConcepts, { id: conceptId });
    return concept?.display ?? 'Estudio';
  }

  /** El nombre legible del prestador. `undefined`/ausente cae a un texto neutro. */
  private async providerName(
    em: EntityManager,
    tenantId: string | undefined,
  ): Promise<string> {
    if (!tenantId) return 'Prestador no identificado';
    const tenant = await em.findOne(Tenants, { id: tenantId });
    return tenant?.legalName ?? 'Prestador no identificado';
  }
}
