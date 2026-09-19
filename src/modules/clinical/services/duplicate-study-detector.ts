import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticReports } from '../entities';
import { DiagnosticReportVersions } from '../../diagnostics/entities';
import { Tenants } from '../../directory/entities';
import { CatalogConcepts } from '../../terminology/entities';
import { ConceptDesignationsRepository } from '../../terminology/repositories';
import { CLIN } from '../clinical.concepts';
import { CONCEPTS } from '../../../common';

/** Presente de verdad: ni `undefined` (entidad nueva) ni `null` (fila leída). */
function hasValue<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

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
    const windowStart = this.windowStartOf(windowDays, now);

    // MCH-029: la ventana, el estado y la orden revocada se resuelven en la
    // base, y vuelve UNA fila. Antes se traían todos los informes del paciente
    // con ese estudio y se filtraba en memoria: el costo crecía con el
    // historial, no con la ventana pedida.
    //
    // «Liberado o final» son los dos caminos de liberación (ver la clase) más
    // `RELEASE_RELEASED`, el mismo criterio que `isReleased`. La fecha es la
    // de `performedAtOf`, escrita en SQL: emisión de la versión liberada, su
    // registro, o la creación del informe.
    const filas = await em.getConnection().execute<{ id: string }[]>(
      `SELECT r.id
         FROM clinical.diagnostic_reports r
         LEFT JOIN diagnostics.diagnostic_report_versions v
                ON v.id = r.current_released_version_id
         LEFT JOIN clinical.service_requests sr
                ON sr.id = r.service_request_id
        WHERE r.patient_profile_id = ?
          AND r.code_concept_id = ?
          AND (r.current_released_version_id IS NOT NULL
               OR r.result_release_status_concept_id = ?
               OR r.lifecycle_status_concept_id = ?)
          AND (sr.id IS NULL OR sr.status_concept_id <> ?)
          AND COALESCE(v.issued_at, v.recorded_at, r.created_at) >= ?
        ORDER BY COALESCE(v.issued_at, v.recorded_at, r.created_at) DESC, r.id DESC
        LIMIT 1`,
      [
        patientProfileId,
        codeConceptId,
        CLIN.RELEASE_RELEASED,
        CLIN.REPORT_FINAL,
        CLIN.SERVICE_REQUEST_REVOKED,
        windowStart,
      ],
      'all',
    );
    if (filas.length === 0) return null;

    const report = await em.findOne(DiagnosticReports, { id: filas[0].id });
    if (!report) return null;
    const version = await this.releasedVersionOf(em, report);
    return {
      report,
      version,
      performedAt: this.performedAtOf(report, version),
      resultsAvailable: this.isReleased(report, version),
    };
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
    // MCH-029: `created_at`, no `updated_at`: corregir un informe viejo no lo
    // vuelve un resultado «en camino».
    const reports = await em.find(DiagnosticReports, {
      patientProfileId,
      codeConceptId,
      createdAt: { $gte: this.windowStartOf(windowDays, now) },
    });
    return reports.some(
      (report) =>
        report.lifecycleStatusConceptId !== CLIN.REPORT_FINAL &&
        !this.isReleased(report, null),
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

    const version = await this.releasedVersionOf(em, report);
    const resultsAvailable = this.isReleased(report, version);
    const performedAt = this.performedAtOf(report, version);

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
    // MikroORM hidrata la columna vacía como `null`, no `undefined`: comparar
    // sólo con `undefined` daba por liberado cualquier informe leído de la
    // base (MCH-029).
    if (hasValue(report.currentReleasedVersionId)) return true;
    if (report.resultReleaseStatusConceptId === CLIN.RELEASE_RELEASED)
      return true;
    return version !== null;
  }

  /** La versión liberada del informe, si la tiene. */
  private async releasedVersionOf(
    em: EntityManager,
    report: DiagnosticReports,
  ): Promise<DiagnosticReportVersions | null> {
    if (!hasValue(report.currentReleasedVersionId)) return null;
    return em.findOne(DiagnosticReportVersions, {
      id: report.currentReleasedVersionId,
    });
  }

  /**
   * Cuándo se hizo el estudio: la emisión de la versión liberada, su registro
   * o, sin versión, la **creación** del informe.
   *
   * MCH-029: antes el último recurso era `updated_at`, y corregir los
   * metadatos de un estudio viejo lo volvía reciente. El modelo no tiene
   * fecha de realización en `diagnostic_reports`; `created_at` no se mueve
   * con una corrección y, en el camino sin versión (liberación por
   * `clinical`), es lo más cercano a la realización que el informe guarda.
   * La consulta de {@link findDuplicate} repite esta misma expresión en SQL.
   */
  private performedAtOf(
    report: DiagnosticReports,
    version: DiagnosticReportVersions | null,
  ): Date {
    return version?.issuedAt ?? version?.recordedAt ?? report.createdAt;
  }

  private windowStartOf(windowDays: number, now: Date): Date {
    return new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
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
