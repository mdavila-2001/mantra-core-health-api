import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/repositories';
import { ResourceScopeGrantsRepository } from '../../authz/repositories';
import { AUTHZ } from '../../authz/authz.concepts';
import {
  DIAGNOSTIC_RESULT_READ_PERMISSION_CODE,
  platformPermissionId,
} from '../../authz/authz.seed';
import { DiagnosticOrdersRepository, ReportsRepository } from '../repositories';
import { DIAG } from '../diagnostics.concepts';
import type {
  DiagnosticResultShareDto,
  DiagnosticResultSharesResponseDto,
  PatientDiagnosticResultDto,
  PatientDiagnosticResultsResponseDto,
  ShareDiagnosticResultDto,
} from '../dto';
import type {
  DiagnosticReportFiles,
  DiagnosticReportVersions,
} from '../entities';

/**
 * Id del permiso que respalda un resultado compartido. Es determinista, así que
 * no hace falta leerlo del catálogo en cada operación.
 */
const RESULT_READ_PERMISSION_ID = platformPermissionId(
  DIAGNOSTIC_RESULT_READ_PERMISSION_CODE,
);

/**
 * Los resultados diagnósticos vistos **por la persona a la que pertenecen**.
 *
 * ## Por qué existe, si ya había una lectura del circuito diagnóstico
 *
 * `DiagnosticsOrdersService` existe y funciona, pero mira desde el otro lado del
 * mostrador: exige `CLINICIAN`/`PRACTITIONER`, se acota al tenant del request y
 * devuelve órdenes e informes **estén liberados o no**, que es lo correcto para
 * quien atiende y exactamente lo que no se le puede mostrar a un paciente. La
 * especificación es explícita: los resultados están disponibles para el
 * paciente, el profesional tratante autorizado, el centro que hizo el estudio y
 * los profesionales que el paciente autorice. Del primero de esos cuatro no
 * había ninguna lectura.
 *
 * ## Qué se muestra y qué no
 *
 * Sólo versiones **liberadas con visibilidad de paciente**. La visibilidad la
 * fija el evento de liberación (`diagnostic_release_events`), que es donde el
 * profesional que libera decide si la persona puede verlo; un informe redactado
 * y no liberado, o liberado como oculto, no aparece. No se infiere visibilidad
 * de ninguna otra señal: un resultado clínico que se muestra por descarte es un
 * incidente, no una funcionalidad.
 *
 * ## Cómo se sabe quién es la persona
 *
 * Por el vínculo cuenta↔persona (`profiles.person_account_links`), igual que
 * `GET /profiles/patients/me/summary`. **No** por el claim `pid` del token: ese
 * claim está documentado como dato de identificación que no participa de
 * ninguna decisión de autorización, y ésta es una decisión de autorización.
 */
@Injectable()
export class DiagnosticsPatientResultsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param ordersRepo - Informes y órdenes del circuito diagnóstico.
   * @param reportsRepo - Versiones, archivos y eventos de liberación.
   * @param accountLinksRepo - Vínculo cuenta↔persona, para resolver al titular.
   * @param patientProfilesRepo - Perfil de paciente de esa persona.
   * @param grantsRepo - Grants sujeto→recurso: los resultados compartidos.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly ordersRepo: DiagnosticOrdersRepository,
    private readonly reportsRepo: ReportsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly grantsRepo: ResourceScopeGrantsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsPatientResultsService.name);
  }

  /**
   * Los resultados liberados del titular de la sesión.
   *
   * @param actor - Usuario autenticado.
   * @param limit - Tope de informes considerados.
   * @returns Los resultados que la persona puede ver.
   */
  async listOwnResults(
    actor: AuthenticatedUser,
    limit: number,
  ): Promise<PatientDiagnosticResultsResponseDto> {
    const em = this.em.fork();
    const patientProfileId = await this.resolveOwnPatientProfileId(em, actor);

    this.logger.info(
      { operation: 'diagnostics.patient-results.list', limit },
      'Leyendo los resultados liberados del titular',
    );

    // Una fila de más para poder decir «hay más» sin pagar un `count` aparte,
    // igual que el resto de las lecturas del producto.
    const reports = await this.ordersRepo.findReportsForPatientPortal(
      em,
      patientProfileId,
      limit + 1,
    );
    const truncated = reports.length > limit;
    const page = reports.slice(0, limit);

    const items = await this.projectReleasedResults(em, page);

    return { patientProfileId, items, limit, truncated };
  }

  /**
   * Un resultado concreto del titular.
   *
   * @param actor - Usuario autenticado.
   * @param reportId - Informe pedido.
   * @returns El resultado liberado.
   */
  async getOwnResult(
    actor: AuthenticatedUser,
    reportId: string,
  ): Promise<PatientDiagnosticResultDto> {
    const em = this.em.fork();
    const report = await this.requireOwnReport(em, actor, reportId);

    const [item] = await this.projectReleasedResults(em, [report]);
    if (!item) {
      // El informe existe y es suyo, pero no hay versión liberada y visible. Es
      // un 404 y no un 403 a propósito: para la persona, ese resultado todavía
      // no existe, y decirle «existe pero no podés verlo» filtra que hay algo.
      throw new ResourceNotFoundException(
        'El resultado todavía no está disponible',
        {
          reportId,
        },
      );
    }
    return item;
  }

  /**
   * Comparte un resultado con un profesional, hasta una fecha.
   *
   * Se materializa como un `authz.resource_scope_grants`: sujeto el profesional,
   * recurso el informe, permiso el de lectura de resultado, y `valid_to` el
   * vencimiento. Es la tabla de grants que el producto ya tiene, y compartir no
   * merece una segunda.
   *
   * @param actor - Usuario autenticado (el paciente que comparte).
   * @param reportId - Informe que se comparte.
   * @param dto - Con quién y hasta cuándo.
   * @returns El compartido creado.
   */
  async shareOwnResult(
    actor: AuthenticatedUser,
    reportId: string,
    dto: ShareDiagnosticResultDto,
  ): Promise<DiagnosticResultShareDto> {
    const now = new Date();
    if (dto.validUntil.getTime() <= now.getTime()) {
      throw new PreconditionFailedException(
        'El vencimiento del acceso compartido tiene que ser futuro',
        { validUntil: dto.validUntil.toISOString() },
      );
    }
    if (dto.practitionerUserId === actor.id) {
      throw new PreconditionFailedException(
        'No hace falta compartirse un resultado con uno mismo',
        {},
      );
    }

    return this.em.transactional(async (tx) => {
      const report = await this.requireOwnReport(tx, actor, reportId);
      // Sólo se comparte lo que la persona misma puede ver. Compartir un
      // resultado que ni el titular puede abrir sería adelantarle a un tercero
      // algo que el profesional que lo firma todavía no liberó.
      const [visible] = await this.projectReleasedResults(tx, [report]);
      if (!visible) {
        throw new PreconditionFailedException(
          'Sólo se puede compartir un resultado ya liberado',
          { reportId },
        );
      }

      const existing = await this.grantsRepo.findExisting(
        tx,
        dto.practitionerUserId,
        RESULT_READ_PERMISSION_ID,
        reportId,
      );
      if (existing) {
        // La tabla tiene una única fila por (sujeto, permiso, recurso), así que
        // volver a compartir es **extender** el plazo, no crear un duplicado que
        // la base rechazaría. Reactivar un compartido vencido es lo que la
        // persona quiere decir cuando lo vuelve a compartir.
        existing.validFrom = existing.validFrom ?? now;
        existing.validTo = dto.validUntil;
        tx.persist(touch(existing, actor.id));
        await tx.flush();
        this.logger.info(
          {
            operation: 'diagnostics.patient-results.share.extend',
            reportId,
            grantId: existing.id,
          },
          'Se extendió un resultado ya compartido',
        );
        return this.toShareDto(existing.id, reportId, dto.practitionerUserId, {
          validFrom: existing.validFrom,
          validTo: existing.validTo,
          now,
        });
      }

      const grant = this.grantsRepo.create(tx, {
        subjectTypeConceptId: AUTHZ.SUBJECT_TYPE_USER,
        subjectId: dto.practitionerUserId,
        permissionId: RESULT_READ_PERMISSION_ID,
        resourceTypeConceptId: AUTHZ.RESOURCE_TYPE_DOCUMENT,
        resourceId: reportId,
        effectConceptId: AUTHZ.EFFECT_ALLOW,
        tenantId: report.custodianTenantId,
        validFrom: now,
        validTo: dto.validUntil,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'diagnostics.patient-results.share',
          reportId,
          grantId: grant.id,
        },
        'Resultado compartido con un profesional',
      );
      return this.toShareDto(grant.id, reportId, dto.practitionerUserId, {
        validFrom: now,
        validTo: dto.validUntil,
        now,
      });
    });
  }

  /**
   * Con quién está compartido un resultado.
   *
   * @param actor - Usuario autenticado (el paciente).
   * @param reportId - Informe consultado.
   * @returns Los compartidos, vigentes y vencidos.
   */
  async listOwnResultShares(
    actor: AuthenticatedUser,
    reportId: string,
  ): Promise<DiagnosticResultSharesResponseDto> {
    const em = this.em.fork();
    await this.requireOwnReport(em, actor, reportId);

    const now = new Date();
    const grants = await this.grantsRepo.findForResource(
      em,
      reportId,
      RESULT_READ_PERMISSION_ID,
    );

    return {
      reportId,
      items: grants.map((grant) =>
        this.toShareDto(grant.id, reportId, grant.subjectId, {
          validFrom: grant.validFrom,
          validTo: grant.validTo,
          now,
        }),
      ),
    };
  }

  /**
   * Deja de compartir un resultado.
   *
   * Se cierra la vigencia en vez de borrar la fila: quién tuvo acceso a un
   * resultado clínico y hasta cuándo es información que hay que poder responder
   * después, y un `DELETE` la borra.
   *
   * @param actor - Usuario autenticado (el paciente).
   * @param reportId - Informe compartido.
   * @param shareId - Compartido a revocar.
   * @returns El compartido, ya cerrado.
   */
  async revokeOwnResultShare(
    actor: AuthenticatedUser,
    reportId: string,
    shareId: string,
  ): Promise<DiagnosticResultShareDto> {
    return this.em.transactional(async (tx) => {
      await this.requireOwnReport(tx, actor, reportId);

      const grant = await this.grantsRepo.findByIdForResource(
        tx,
        shareId,
        reportId,
      );
      if (!grant || grant.permissionId !== RESULT_READ_PERMISSION_ID) {
        throw new ResourceNotFoundException(
          'Ese resultado no está compartido así',
          {
            reportId,
            shareId,
          },
        );
      }

      const now = new Date();
      if (
        grant.validTo !== undefined &&
        grant.validTo.getTime() <= now.getTime()
      ) {
        throw new ConflictException('Ese acceso compartido ya estaba cerrado', {
          shareId,
        });
      }

      grant.validTo = now;
      tx.persist(touch(grant, actor.id));
      await tx.flush();

      this.logger.info(
        {
          operation: 'diagnostics.patient-results.share.revoke',
          reportId,
          grantId: grant.id,
        },
        'Se dejó de compartir un resultado',
      );
      return this.toShareDto(grant.id, reportId, grant.subjectId, {
        validFrom: grant.validFrom,
        validTo: grant.validTo,
        now,
      });
    });
  }

  /* ---- resolución del titular --------------------------------------------- */

  /**
   * El perfil de paciente del titular de la sesión.
   *
   * @param em - Contexto de persistencia.
   * @param actor - Usuario autenticado.
   * @returns El `patient_profile_id` del titular.
   */
  private async resolveOwnPatientProfileId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una persona vinculada',
      );
    }
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    if (!patient) {
      throw new PreconditionFailedException(
        'La cuenta no tiene perfil de paciente',
        { personId: link.personId },
      );
    }
    return patient.profileId;
  }

  /**
   * El informe, comprobando que es del titular.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param actor - Usuario autenticado.
   * @param reportId - Informe pedido.
   * @returns El informe.
   */
  private async requireOwnReport(
    em: EntityManager,
    actor: AuthenticatedUser,
    reportId: string,
  ) {
    const patientProfileId = await this.resolveOwnPatientProfileId(em, actor);
    const report = await this.ordersRepo.findReportById(em, reportId);
    if (!report) {
      throw new ResourceNotFoundException('Informe no encontrado', {
        reportId,
      });
    }
    if (report.patientProfileId !== patientProfileId) {
      // 401/403 y no 404: el informe existe y pertenece a otra persona. Se
      // registra, porque un intento de leer el resultado de otro no es ruido.
      this.logger.warn(
        { operation: 'diagnostics.patient-results.denied', reportId },
        'Intento de leer un informe de otra persona',
      );
      throw new UnauthorizedException('El informe no pertenece a esta cuenta');
    }
    return report;
  }

  /* ---- proyección ---------------------------------------------------------- */

  /**
   * Proyecta cada informe a su versión liberada y visible, si la tiene.
   *
   * Un informe sin versión liberada, o cuya última liberación fue con
   * visibilidad oculta, no produce ninguna fila.
   *
   * @param em - Contexto de persistencia.
   * @param reports - Informes a proyectar.
   * @returns Los resultados visibles, en el orden de entrada.
   */
  private async projectReleasedResults(
    em: EntityManager,
    reports: readonly {
      id: string;
      serviceRequestId?: string;
      codeConceptId: string;
      categoryConceptId?: string;
      custodianTenantId: string;
    }[],
  ): Promise<PatientDiagnosticResultDto[]> {
    if (reports.length === 0) {
      return [];
    }

    const versions = await this.reportsRepo.findVersionsByReports(
      em,
      reports.map((report) => report.id),
    );
    if (versions.length === 0) {
      return [];
    }

    const releases = await this.reportsRepo.findReleaseEventsByVersions(
      em,
      versions.map((version) => version.id),
    );

    // El último evento de cada versión es el que manda: una liberación puede
    // rectificarse, y lo que vale es la decisión más reciente. Los eventos
    // llegan del más nuevo al más viejo, así que el primero que se ve de cada
    // versión es ése.
    const ultimoEvento = new Map<
      string,
      { visibilityConceptId: string; recordedAt: Date }
    >();
    for (const evento of releases) {
      const versionId = evento.diagnosticReportVersionId;
      if (versionId === undefined || ultimoEvento.has(versionId)) {
        continue;
      }
      ultimoEvento.set(versionId, {
        visibilityConceptId: evento.patientVisibilityConceptId,
        recordedAt: evento.recordedAt,
      });
    }

    // De cada informe, la versión visible de número más alto: una enmienda
    // reemplaza a la versión que corrige, y mostrar las dos sería mostrar dos
    // veces el mismo resultado con textos distintos.
    const visiblePorInforme = new Map<string, DiagnosticReportVersions>();
    for (const version of versions) {
      const release = ultimoEvento.get(version.id);
      if (
        release === undefined ||
        release.visibilityConceptId !== DIAG.VISIBILITY_PATIENT_VISIBLE
      ) {
        continue;
      }
      const actual = visiblePorInforme.get(version.diagnosticReportId);
      if (
        actual === undefined ||
        version.versionNumber > actual.versionNumber
      ) {
        visiblePorInforme.set(version.diagnosticReportId, version);
      }
    }
    if (visiblePorInforme.size === 0) {
      return [];
    }

    const visibleIds = [...visiblePorInforme.values()].map((v) => v.id);
    const [files, results] = await Promise.all([
      this.reportsRepo.findFilesByVersions(em, visibleIds),
      this.reportsRepo.findResultsByVersions(em, visibleIds),
    ]);

    const filesPorVersion = new Map<string, DiagnosticReportFiles[]>();
    for (const file of files) {
      const lista = filesPorVersion.get(file.diagnosticReportVersionId) ?? [];
      lista.push(file);
      filesPorVersion.set(file.diagnosticReportVersionId, lista);
    }
    const observacionesPorVersion = new Map<string, string[]>();
    for (const result of results) {
      const lista =
        observacionesPorVersion.get(result.diagnosticReportVersionId) ?? [];
      lista.push(result.observationId);
      observacionesPorVersion.set(result.diagnosticReportVersionId, lista);
    }

    const items: PatientDiagnosticResultDto[] = [];
    for (const report of reports) {
      const version = visiblePorInforme.get(report.id);
      if (version === undefined) {
        continue;
      }
      const release = ultimoEvento.get(version.id);
      items.push({
        reportId: report.id,
        versionId: version.id,
        versionNumber: version.versionNumber,
        serviceRequestId: report.serviceRequestId,
        codeConceptId: report.codeConceptId,
        categoryConceptId: report.categoryConceptId,
        custodianTenantId: report.custodianTenantId,
        conclusionText: version.conclusionText,
        issuedAt: version.issuedAt,
        releasedAt: release?.recordedAt ?? version.recordedAt,
        clinicalStatusConceptId: version.clinicalStatusConceptId,
        observationIds: observacionesPorVersion.get(version.id) ?? [],
        files: (filesPorVersion.get(version.id) ?? []).map((file) => ({
          id: file.id,
          fileId: file.fileId,
          contentRoleConceptId: file.contentRoleConceptId,
          presentationFormatConceptId: file.presentationFormatConceptId,
          ordinal: file.ordinal,
        })),
      });
    }
    return items;
  }

  /** Arma la vista de un compartido, resolviendo si está vigente ahora. */
  private toShareDto(
    id: string,
    reportId: string,
    practitionerUserId: string,
    vigencia: {
      /** Desde cuándo vale. */
      validFrom?: Date;
      /** Hasta cuándo vale. */
      validTo?: Date;
      /** Instante contra el que se decide la vigencia. */
      now: Date;
    },
  ): DiagnosticResultShareDto {
    const desde = vigencia.validFrom ?? vigencia.now;
    const activo =
      desde.getTime() <= vigencia.now.getTime() &&
      (vigencia.validTo === undefined ||
        vigencia.validTo.getTime() > vigencia.now.getTime());
    return {
      id,
      reportId,
      practitionerUserId,
      validFrom: desde,
      validTo: vigencia.validTo,
      active: activo,
    };
  }
}
