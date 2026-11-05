import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  requireTenantId,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import {
  ClinicalRefsRepository,
  DiagnosticOrdersRepository,
  ImagingRepository,
  ReportsRepository,
  SpecimensRepository,
} from '../repositories';
import type {
  CriticalResultNotifications,
  ImagingEndpoints,
  LaboratoryAccessions,
  ImagingSeries,
  ImagingStudies,
  SpecimenContainers,
  Specimens,
} from '../entities';
import type {
  Encounters,
  Observations,
  ServiceRequests,
  DiagnosticReports,
} from '../../clinical/entities';
import type { Files } from '../../common/entities';

const REASON = DiagnosticsErrorReason.DIAGNOSTICS_RESOURCE_NOT_AVAILABLE;

/**
 * Resuelve por UUID los recursos que un write clínico de `diagnostics` enlaza,
 * acotados al tenant activo y coherentes entre sí.
 *
 * El tenant sale siempre del contexto verificado (`requireTenantId()`), nunca
 * del cuerpo: un `custodianTenantId` o `tenantId` del cliente solo se acepta si
 * coincide. Un recurso de otro tenant responde exactamente igual que uno
 * inexistente (`404`, mismo mensaje y `reason`, sin `details`), y las
 * relaciones que declara el cuerpo (paciente, encuentro, orden, observación,
 * archivo, espécimen, informe) se comprueban **antes** de escribir la primera
 * fila, de modo que una mezcla entre tenants no deja nada persistido.
 */
@Injectable()
export class DiagnosticsScopeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param specimensRepo - Especímenes, contenedores y acesiones.
   * @param imagingRepo - Endpoints, estudios y series de imagen.
   * @param reportsRepo - Versiones de informe y notificaciones críticas.
   * @param ordersRepo - Informe clínico (`clinical.diagnostic_reports`).
   * @param refsRepo - Encuentros, órdenes, observaciones y archivos.
   */
  constructor(
    private readonly specimensRepo: SpecimensRepository,
    private readonly imagingRepo: ImagingRepository,
    private readonly reportsRepo: ReportsRepository,
    private readonly ordersRepo: DiagnosticOrdersRepository,
    private readonly refsRepo: ClinicalRefsRepository,
  ) {}

  /**
   * Tenant custodio de un write: el del contexto.
   *
   * @param bodyTenantId - Tenant declarado por el cliente, si lo hubo.
   * @returns El tenant activo, única fuente de verdad.
   * @throws ResourceNotFoundException si el cuerpo declara otro tenant.
   */
  activeTenantFor(bodyTenantId?: string): string {
    const tenantId = requireTenantId();
    if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
      this.notFound('Recurso no encontrado');
    }
    return tenantId;
  }

  /**
   * Autor de un acto clínico: el profesional que firma la petición.
   *
   * Si el actor trae `practitionerProfileId` (claim `hpid`), un autor distinto
   * en el cuerpo se rechaza; sin autor en el cuerpo se toma el del actor. Un
   * actor sin perfil profesional (personal de laboratorio por membresía) no
   * permite comprobar el valor, que queda como auditoría de lo declarado:
   * `recordedByUserId` sigue fijando quién firmó.
   *
   * @param actor - Quien firma la petición.
   * @param supplied - Perfil declarado por el cuerpo.
   * @returns El perfil a persistir como autor.
   * @throws InsufficientRoleException si el cuerpo declara a otro profesional.
   */
  authorFor(actor: AuthenticatedUser, supplied: string): string;
  authorFor(actor: AuthenticatedUser, supplied?: string): string | undefined;
  authorFor(actor: AuthenticatedUser, supplied?: string): string | undefined {
    const own = actor.practitionerProfileId;
    if (own && supplied !== undefined && supplied !== own) {
      throw new InsufficientRoleException(
        'El autor debe ser el profesional que firma',
        undefined,
        DiagnosticsErrorReason.DIAGNOSTICS_AUTHOR_NOT_ACTOR,
      );
    }
    return supplied ?? own;
  }

  /**
   * Carga un endpoint de imagen del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del endpoint.
   * @returns El endpoint, ya acotado al tenant.
   */
  async endpoint(tx: EntityManager, id: string): Promise<ImagingEndpoints> {
    const tenantId = requireTenantId();
    const endpoint = await this.imagingRepo.findEndpoint(tx, id);
    return assertResourceInTenant(endpoint, endpoint?.tenantId, tenantId, {
      message: 'Endpoint de imagen no encontrado',
      reason: REASON,
    });
  }

  /**
   * Carga un estudio de imagen custodiado por el tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del estudio.
   * @returns El estudio, ya acotado al tenant.
   */
  async study(tx: EntityManager, id: string): Promise<ImagingStudies> {
    const tenantId = requireTenantId();
    const study = await this.imagingRepo.findStudy(tx, id);
    return assertResourceInTenant(study, study?.custodianTenantId, tenantId, {
      message: 'Estudio de imagen no encontrado',
      reason: REASON,
    });
  }

  /**
   * Carga una serie que pertenece a un estudio ya acotado al tenant.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param study - Estudio ya resuelto con {@link study}.
   * @param seriesId - UUID de la serie declarada por el cliente.
   * @returns La serie de ese estudio.
   */
  async seriesOfStudy(
    tx: EntityManager,
    study: ImagingStudies,
    seriesId: string,
  ): Promise<ImagingSeries> {
    const series = await this.imagingRepo.findSeriesInStudy(
      tx,
      study.id,
      seriesId,
    );
    return assertResourceInTenant(
      series,
      series ? study.custodianTenantId : null,
      requireTenantId(),
      {
        message: 'Serie no encontrada',
        reason: REASON,
      },
    );
  }

  /**
   * Carga un espécimen custodiado por el tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del espécimen.
   * @returns El espécimen, ya acotado al tenant.
   */
  async specimen(tx: EntityManager, id: string): Promise<Specimens> {
    const tenantId = requireTenantId();
    const specimen = await this.specimensRepo.findSpecimen(tx, id);
    return assertResourceInTenant(
      specimen,
      specimen?.custodianTenantId,
      tenantId,
      { message: 'Espécimen no encontrado', reason: REASON },
    );
  }

  /**
   * Carga una acesión de laboratorio custodiada por el tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la acesión.
   * @returns La acesión, ya acotada al tenant.
   */
  async accession(
    tx: EntityManager,
    id: string,
  ): Promise<LaboratoryAccessions> {
    const tenantId = requireTenantId();
    const accession = await this.specimensRepo.findAccession(tx, id);
    return assertResourceInTenant(
      accession,
      accession?.custodianTenantId,
      tenantId,
      { message: 'Acesión no encontrada', reason: REASON },
    );
  }

  /**
   * Comprueba que un recurso cargado por el llamador es del tenant activo, para
   * los recursos del circuito de laboratorio que no tienen un resolvedor propio
   * (corridas de analizador, órdenes de trabajo y sus pruebas).
   *
   * @param resource - Recurso ya cargado, o `null` si no existe.
   * @param resourceTenantId - `custodianTenantId` del recurso (o de su padre).
   * @param message - Mensaje del 404, igual para lo ajeno y lo inexistente.
   * @returns El mismo recurso, ya acotado al tenant.
   */
  assertInTenant<T>(
    resource: T | null | undefined,
    resourceTenantId: string | null | undefined,
    message: string,
  ): T {
    return assertResourceInTenant(
      resource,
      resourceTenantId,
      requireTenantId(),
      { message, reason: REASON },
    );
  }

  /**
   * Carga un espécimen del tenant activo que además es del paciente dado.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del espécimen.
   * @param patientProfileId - Paciente al que debe pertenecer.
   * @returns El espécimen, ya acotado al tenant y al paciente.
   */
  async specimenOfPatient(
    tx: EntityManager,
    id: string,
    patientProfileId: string,
  ): Promise<Specimens> {
    const specimen = await this.specimen(tx, id);
    this.assertPatientMatches(specimen, patientProfileId);
    return specimen;
  }

  /**
   * Carga un contenedor cuyo espécimen es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del contenedor.
   * @returns El contenedor, ya acotado al tenant.
   */
  async container(tx: EntityManager, id: string): Promise<SpecimenContainers> {
    const tenantId = requireTenantId();
    const container = await this.specimensRepo.findContainer(tx, id);
    const specimen = container
      ? await this.specimensRepo.findSpecimen(tx, container.specimenId)
      : null;
    return assertResourceInTenant(
      container,
      specimen?.custodianTenantId,
      tenantId,
      { message: 'Contenedor no encontrado', reason: REASON },
    );
  }

  /**
   * Carga el informe clínico (`clinical.diagnostic_reports`) del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del informe.
   * @param patientProfileId - Paciente declarado, que debe ser el del informe.
   * @returns El informe, ya acotado al tenant.
   */
  async report(
    tx: EntityManager,
    id: string,
    patientProfileId?: string,
  ): Promise<DiagnosticReports> {
    const tenantId = requireTenantId();
    const report = await this.ordersRepo.findReportById(tx, id);
    this.assertPatientMatches(report, patientProfileId);
    return assertResourceInTenant(report, report?.custodianTenantId, tenantId, {
      message: 'Informe no encontrado',
      reason: REASON,
    });
  }

  /**
   * Carga una notificación crítica del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la notificación.
   * @returns La notificación, ya acotada al tenant.
   */
  async criticalNotification(
    tx: EntityManager,
    id: string,
  ): Promise<CriticalResultNotifications> {
    const tenantId = requireTenantId();
    const notification = await this.reportsRepo.findCriticalNotification(
      tx,
      id,
    );
    return assertResourceInTenant(
      notification,
      notification?.custodianTenantId,
      tenantId,
      { message: 'Notificación crítica no encontrada', reason: REASON },
    );
  }

  /**
   * Carga un encuentro del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del encuentro.
   * @param patientProfileId - Paciente declarado, que debe ser el del encuentro.
   * @returns El encuentro, ya acotado al tenant.
   */
  async encounter(
    tx: EntityManager,
    id: string,
    patientProfileId?: string,
  ): Promise<Encounters> {
    const tenantId = requireTenantId();
    const encounter = await this.refsRepo.findEncounter(tx, id);
    this.assertPatientMatches(encounter, patientProfileId);
    return assertResourceInTenant(encounter, encounter?.tenantId, tenantId, {
      message: 'Encuentro no encontrado',
      reason: REASON,
    });
  }

  /**
   * Carga una orden de servicio que el tenant activo pidió o ejecuta.
   *
   * Una orden la pide un tenant (`custodian`) y la puede ejecutar otro
   * (`performer`, el laboratorio o centro de imagen): ambos pueden enlazarla.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la orden.
   * @param patientProfileId - Paciente declarado, que debe ser el de la orden.
   * @returns La orden, ya acotada al tenant.
   */
  async serviceRequest(
    tx: EntityManager,
    id: string,
    patientProfileId?: string,
  ): Promise<ServiceRequests> {
    const tenantId = requireTenantId();
    const request = await this.refsRepo.findServiceRequest(tx, id);
    this.assertPatientMatches(request, patientProfileId);
    const scopeTenant =
      request?.performerTenantId === tenantId
        ? request.performerTenantId
        : request?.custodianTenantId;
    return assertResourceInTenant(request, scopeTenant, tenantId, {
      message: 'Orden no encontrada',
      reason: REASON,
    });
  }

  /**
   * Carga una observación del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID de la observación.
   * @param patientProfileId - Paciente declarado, que debe ser el de la observación.
   * @returns La observación, ya acotada al tenant.
   */
  async observation(
    tx: EntityManager,
    id: string,
    patientProfileId?: string,
  ): Promise<Observations> {
    const tenantId = requireTenantId();
    const observation = await this.refsRepo.findObservation(tx, id);
    this.assertPatientMatches(observation, patientProfileId);
    return assertResourceInTenant(
      observation,
      observation?.custodianTenantId,
      tenantId,
      { message: 'Observación no encontrada', reason: REASON },
    );
  }

  /**
   * Carga un archivo del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del archivo.
   * @returns El archivo, ya acotado al tenant.
   */
  async file(tx: EntityManager, id: string): Promise<Files> {
    const tenantId = requireTenantId();
    const file = await this.refsRepo.findFile(tx, id);
    return assertResourceInTenant(file, file?.tenantId, tenantId, {
      message: 'Archivo no encontrado',
      reason: REASON,
    });
  }

  /**
   * Resuelve el objetivo (o la fuente) de un evento de calidad: un espécimen,
   * una observación o un estudio de imagen del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - UUID del recurso apuntado.
   * @throws ResourceNotFoundException si no es ninguno de los tres en el tenant.
   */
  async dataQualityTarget(tx: EntityManager, id: string): Promise<void> {
    const tenantId = requireTenantId();
    const [specimen, observation, study] = await Promise.all([
      this.specimensRepo.findSpecimen(tx, id),
      this.refsRepo.findObservation(tx, id),
      this.imagingRepo.findStudy(tx, id),
    ]);
    const inScope =
      specimen?.custodianTenantId === tenantId ||
      observation?.custodianTenantId === tenantId ||
      study?.custodianTenantId === tenantId;
    if (!inScope) this.notFound('Recurso no encontrado');
  }

  /** Un paciente declarado distinto del del recurso se trata como recurso ajeno. */
  private assertPatientMatches(
    resource: { patientProfileId: string } | null,
    patientProfileId?: string,
  ): void {
    if (
      resource &&
      patientProfileId !== undefined &&
      resource.patientProfileId !== patientProfileId
    ) {
      this.notFound('Recurso no encontrado');
    }
  }

  /** Lanza el 404 uniforme del módulo. */
  private notFound(message: string): never {
    throw new ResourceNotFoundException(message, undefined, REASON);
  }
}
