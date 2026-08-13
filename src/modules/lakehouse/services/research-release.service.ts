import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { DataReleaseRepository } from '../../health_data/repositories';
import {
  LakehouseCatalogRepository,
  ResearchRepository,
} from '../repositories';
import {
  APPROVABLE_RELEASE_STATUSES,
  CLOSEABLE_RELEASE_STATUSES,
  DEFAULT_RELEASE_TTL_DAYS,
} from '../constants';
import {
  DefineCohortDto,
  CohortResponseDto,
  RequestDatasetReleaseDto,
  ReleaseRequestResponseDto,
  ApproveDatasetReleaseDto,
  ReleaseManifestResponseDto,
  RevokeDatasetReleaseDto,
  RevokeReleaseResponseDto,
  ExpiredReleaseSummaryDto,
  PendingExpiredReleasesResponseDto,
  CreateDeidentificationProfileDto,
  DeidentificationProfileResponseDto,
} from '../dto';

const MILLISECONDS_PER_DAY = 86_400_000;
const DEFAULT_EXPIRED_RELEASES_BATCH = 50;

/**
 * Investigación (UC-63-09 … 12): proyectos con aprobación ética, cohortes,
 * solicitudes de release y su materialización de-identificada con caducidad.
 *
 * La idea que lo sostiene: **el acceso a datos de investigación siempre caduca**.
 * Un release sin fecha de fin es un acceso permanente a datos de pacientes
 * concedido por un comité que aprobó un estudio con principio y final.
 */
@Injectable()
export class ResearchReleaseService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param researchRepo - Valor de research repo requerido por la operación.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param dataReleaseRepo - Valor de data release repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly researchRepo: ResearchRepository,
    private readonly catalogRepo: LakehouseCatalogRepository,
    private readonly dataReleaseRepo: DataReleaseRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ResearchReleaseService.name);
  }

  /**
   * Alta del perfil de de-identificación con el que se materializan los
   * releases de investigación.
   *
   * Sin él no se puede definir una cohorte —el DTO lo exige— y no existía
   * ninguna operación que lo creara: el flujo del investigador principal
   * arrancaba en un identificador imposible de obtener.
   *
   * @param dto - Tenant, metodología y reglas del perfil.
   * @param actor - Quien lo da de alta.
   * @returns El perfil creado, activo.
   */
  async createDeidentificationProfile(
    dto: CreateDeidentificationProfileDto,
    actor: AuthenticatedUser,
  ): Promise<DeidentificationProfileResponseDto> {
    this.logger.info(
      {
        operation: 'research.deid-profile.create',
        code: dto.code,
        actorUserId: actor.id,
      },
      'Creating de-identification profile',
    );
    return this.em.transactional(async (tx) => {
      const profile = this.dataReleaseRepo.createDeidProfile(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        methodologyConceptId: dto.methodologyConceptId,
        directIdentifierRulesJson: dto.directIdentifierRulesJson,
        quasiIdentifierRulesJson: dto.quasiIdentifierRulesJson,
        dateShiftPolicyJson: dto.dateShiftPolicyJson,
        freeTextPolicyJson: dto.freeTextPolicyJson,
      });
      await tx.flush();
      return {
        id: profile.id,
        code: profile.code,
        stateConceptId: profile.stateConceptId,
      };
    });
  }

  /**
   * UC-63-09: definir el proyecto y su cohorte.
   *
   * Como en UC-63-03, el caso de uso declara `research_projects — UPSERT` con el
   * id en la ruta: si el proyecto existe se actualiza, y si no, se crea con ese
   * id.
   *
   * La ventana ética tiene que ser coherente y estar vigente. Una cohorte definida
   * bajo una aprobación caducada es una cohorte que nadie puede usar, y dejarla
   * crear sólo aplaza el rechazo hasta el momento en que ya hay expectativas.
   */
  async defineCohort(
    projectId: string,
    dto: DefineCohortDto,
    actor: AuthenticatedUser,
  ): Promise<CohortResponseDto> {
    return this.em.transactional(async (tx) => {
      const approvedFrom = new Date(dto.approvedFrom);
      const approvedTo = new Date(dto.approvedTo);
      if (approvedFrom >= approvedTo) {
        throw new PreconditionFailedException(
          'La ventana de aprobación ética tiene que empezar antes de terminar.',
          { approvedFrom: dto.approvedFrom, approvedTo: dto.approvedTo },
        );
      }
      if (approvedTo <= new Date()) {
        throw new PreconditionFailedException(
          'La aprobación ética ya está caducada.',
          { approvedTo: dto.approvedTo },
        );
      }

      let project = await this.researchRepo.findProjectForUpdate(tx, projectId);
      if (!project) {
        const byCode = await this.researchRepo.findProjectByCode(
          tx,
          dto.tenantId,
          dto.projectCode,
        );
        if (byCode) {
          throw new ConflictException(
            'Ya existe un proyecto con ese código para el tenant, con otro identificador.',
            {
              tenantId: dto.tenantId,
              code: dto.projectCode,
              existingId: byCode.id,
            },
          );
        }
        project = this.researchRepo.createProject(tx, {
          id: projectId,
          tenantId: dto.tenantId,
          code: dto.projectCode,
          title: dto.title,
          protocolReference: dto.protocolReference,
          principalInvestigatorId: dto.principalInvestigatorId,
          ethicsApprovalReference: dto.ethicsApprovalReference,
          approvedFrom,
          approvedTo,
          state: 'approved',
        });
      } else {
        if (
          project.code !== dto.projectCode ||
          project.tenantId !== dto.tenantId
        ) {
          throw new ConflictException(
            'El proyecto existente tiene otro código o pertenece a otro tenant.',
            { projectId, code: project.code },
          );
        }
        project.title = dto.title;
        if (dto.protocolReference)
          project.protocolReference = dto.protocolReference;
        project.principalInvestigatorId = dto.principalInvestigatorId;
        project.ethicsApprovalReference = dto.ethicsApprovalReference;
        project.approvedFrom = approvedFrom;
        project.approvedTo = approvedTo;
        project.state = 'approved';
      }

      const duplicate = await this.researchRepo.findCohortByVersion(
        tx,
        project.id,
        dto.cohortCode,
        dto.cohortVersion,
      );
      if (duplicate) {
        throw new ConflictException(
          'Esa versión de la cohorte ya está definida.',
          {
            researchProjectId: project.id,
            code: dto.cohortCode,
            version: dto.cohortVersion,
          },
        );
      }

      const cohort = this.researchRepo.createCohort(tx, {
        researchProjectId: project.id,
        code: dto.cohortCode,
        version: dto.cohortVersion,
        inclusionExpression: dto.inclusionExpression,
        exclusionExpression: dto.exclusionExpression,
        deidentificationProfileId: dto.deidentificationProfileId,
        state: 'active',
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'CohortDefined',
        aggregateType: 'lakehouse.cohort_definitions',
        aggregateId: cohort.id,
        payloadJson: {
          researchProjectId: project.id,
          projectCode: project.code,
          cohortCode: cohort.code,
          version: cohort.version,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'lakehouse.research.cohort',
          researchProjectId: project.id,
          cohortId: cohort.id,
        },
        'Cohorte de investigación definida',
      );

      return {
        researchProjectId: project.id,
        id: cohort.id,
        code: cohort.code,
        version: cohort.version,
        state: cohort.state,
      };
    });
  }

  /**
   * UC-63-10: solicitar el release del dataset.
   *
   * Se comprueba la ventana ética **al solicitar**, no sólo al aprobar: dejar
   * entrar solicitudes de un proyecto caducado llenaría la cola de gobernanza de
   * peticiones que sólo pueden rechazarse.
   *
   * Un producto con datos de paciente exige que la cohorte declare perfil de
   * de-identificación. Sin él no hay forma de materializar el release sin exponer
   * el dato tal cual.
   */
  async requestRelease(
    dto: RequestDatasetReleaseDto,
    actor: AuthenticatedUser,
  ): Promise<ReleaseRequestResponseDto> {
    return this.em.transactional(async (tx) => {
      const project = await this.researchRepo.findProjectById(
        tx,
        dto.researchProjectId,
      );
      if (!project) {
        throw new ResourceNotFoundException(
          'Proyecto de investigación no encontrado.',
          {
            researchProjectId: dto.researchProjectId,
          },
        );
      }
      if (project.state !== 'approved') {
        throw new PreconditionFailedException('El proyecto no está aprobado.', {
          researchProjectId: project.id,
          state: project.state,
        });
      }
      const now = new Date();
      if (project.approvedTo <= now || project.approvedFrom > now) {
        throw new PreconditionFailedException(
          'La ventana de aprobación ética del proyecto no está vigente.',
          {
            approvedFrom: project.approvedFrom,
            approvedTo: project.approvedTo,
          },
        );
      }

      const cohort = await this.researchRepo.findCohortById(
        tx,
        dto.cohortDefinitionId,
      );
      if (!cohort || cohort.researchProjectId !== project.id) {
        throw new ResourceNotFoundException(
          'La cohorte no pertenece a ese proyecto.',
          {
            cohortDefinitionId: dto.cohortDefinitionId,
          },
        );
      }
      if (cohort.state !== 'active') {
        throw new PreconditionFailedException('La cohorte no está activa.', {
          cohortDefinitionId: cohort.id,
        });
      }

      const productVersion = await this.catalogRepo.findProductVersionById(
        tx,
        dto.dataProductVersionId,
      );
      if (!productVersion) {
        throw new ResourceNotFoundException(
          'Versión de producto no encontrada.',
          {
            dataProductVersionId: dto.dataProductVersionId,
          },
        );
      }

      const product = await this.catalogRepo.findProductForUpdate(
        tx,
        productVersion.dataProductId,
      );
      if (product?.containsPhi && !cohort.deidentificationProfileId) {
        throw new PreconditionFailedException(
          'El producto contiene datos de paciente y la cohorte no declara perfil de de-identificación.',
          {
            dataProductVersionId: productVersion.id,
            cohortDefinitionId: cohort.id,
          },
        );
      }

      const request = this.researchRepo.createReleaseRequest(tx, {
        tenantId: dto.tenantId,
        researchProjectId: project.id,
        dataProductVersionId: dto.dataProductVersionId,
        cohortDefinitionId: cohort.id,
        purposeOfUseCode: dto.purposeOfUseCode,
        requestedByUserId: actor.id,
        status: 'submitted',
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'DatasetReleaseRequested',
        aggregateType: 'lakehouse.dataset_release_requests',
        aggregateId: request.id,
        payloadJson: {
          researchProjectId: project.id,
          dataProductVersionId: dto.dataProductVersionId,
          cohortDefinitionId: cohort.id,
          purposeOfUseCode: dto.purposeOfUseCode,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'lakehouse.research.request', requestId: request.id },
        'Release de dataset solicitado',
      );

      return {
        id: request.id,
        status: request.status,
        requestedAt: request.requestedAt.toISOString(),
      };
    });
  }

  /**
   * UC-63-11: aprobar y materializar el manifiesto de-identificado.
   *
   * Tres cosas en la misma transacción: la corrida de de-identificación en
   * `health_data`, el manifiesto con su hash, y el paso de la solicitud a
   * `released`. Separarlas dejaría un manifiesto sin prueba de cómo se produjo, o
   * una solicitud aprobada sin nada materializado.
   *
   * **Un manifiesto por solicitud.** Materializar dos veces daría dos copias
   * de-identificadas del mismo dato con caducidades distintas, y revocar una no
   * revocaría la otra.
   *
   * El `expires_at` no es opcional: el comité aprobó un estudio con final.
   */
  async approveRelease(
    requestId: string,
    dto: ApproveDatasetReleaseDto,
    actor: AuthenticatedUser,
  ): Promise<ReleaseManifestResponseDto> {
    return this.em.transactional(async (tx) => {
      const request = await this.researchRepo.findReleaseRequestForUpdate(
        tx,
        requestId,
      );
      if (!request) {
        throw new ResourceNotFoundException(
          'Solicitud de release no encontrada.',
          { requestId },
        );
      }

      const existingManifest =
        await this.researchRepo.findManifestByRequestForUpdate(tx, requestId);
      if (existingManifest) {
        return {
          datasetReleaseRequestId: requestId,
          id: existingManifest.id,
          deidentificationRunId: existingManifest.deidentificationRunId,
          status: request.status,
          expiresAt: existingManifest.expiresAt.toISOString(),
          alreadyReleased: true,
        };
      }

      if (
        !(APPROVABLE_RELEASE_STATUSES as readonly string[]).includes(
          request.status,
        )
      ) {
        throw new PreconditionFailedException(
          'La solicitud no está en un estado que admita aprobación.',
          { requestId, status: request.status },
        );
      }

      const project = await this.researchRepo.findProjectById(
        tx,
        request.researchProjectId,
      );
      if (!project) {
        throw new ResourceNotFoundException(
          'Proyecto de investigación no encontrado.',
          {
            researchProjectId: request.researchProjectId,
          },
        );
      }
      const now = new Date();
      if (project.approvedTo <= now) {
        throw new PreconditionFailedException(
          'La aprobación ética del proyecto caducó; el release no puede materializarse.',
          { approvedTo: project.approvedTo },
        );
      }

      const cohort = await this.researchRepo.findCohortById(
        tx,
        request.cohortDefinitionId,
      );
      if (!cohort?.deidentificationProfileId) {
        throw new PreconditionFailedException(
          'La cohorte no declara perfil de de-identificación.',
          { cohortDefinitionId: request.cohortDefinitionId },
        );
      }

      const ttlDays = dto.ttlDays ?? DEFAULT_RELEASE_TTL_DAYS;
      const proposedExpiry = new Date(
        now.getTime() + ttlDays * MILLISECONDS_PER_DAY,
      );
      // El acceso nunca sobrevive a la aprobación ética: si el plazo pedido la
      // rebasa, se recorta a ella.
      const expiresAt =
        proposedExpiry > project.approvedTo
          ? project.approvedTo
          : proposedExpiry;

      const deidRun = this.dataReleaseRepo.createDeidRun(tx, {
        tenantId: request.tenantId,
        healthDeidentificationProfileId: cohort.deidentificationProfileId,
        purposeConceptId: dto.purposeConceptId,
        startedAt: now,
        statusConceptId: CONCEPTS.DEID_COMPLETED,
        outputManifestFileId: dto.objectManifestId,
        recordsProcessed: dto.recordCount,
      });

      const manifest = this.researchRepo.createManifest(tx, {
        datasetReleaseRequestId: requestId,
        deidentificationRunId: deidRun.id,
        objectManifestId: dto.objectManifestId,
        schemaVersion: dto.schemaVersion,
        recordCount: dto.recordCount,
        contentHash: dto.contentHash,
        expiresAt,
      });

      request.status = 'released';

      await this.outbox.publishDomainEvent(tx, {
        tenantId: request.tenantId,
        eventType: 'DatasetReleaseMaterialized',
        aggregateType: 'lakehouse.dataset_release_manifests',
        aggregateId: manifest.id,
        payloadJson: {
          datasetReleaseRequestId: requestId,
          researchProjectId: project.id,
          deidentificationRunId: deidRun.id,
          contentHash: dto.contentHash,
          recordCount: dto.recordCount,
          expiresAt: expiresAt.toISOString(),
          // Quien consuma el evento tiene que poder conceder el acceso temporal al
          // investigador y programarlo para que caduque solo.
          grantToUserId: project.principalInvestigatorId,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'lakehouse.research.release',
          requestId,
          manifestId: manifest.id,
          expiresAt: expiresAt.toISOString(),
        },
        'Release de investigación materializado',
      );

      return {
        datasetReleaseRequestId: requestId,
        id: manifest.id,
        deidentificationRunId: deidRun.id,
        status: request.status,
        expiresAt: expiresAt.toISOString(),
        alreadyReleased: false,
      };
    });
  }

  /**
   * UC-63-12: expirar o revocar el release.
   *
   * Los dos cierres se distinguen: `expired` es el fin del plazo previsto y
   * `revoked` una decisión de gobernanza. Auditarlas juntas escondería la segunda,
   * que es la que hay que poder explicar.
   */
  async revokeRelease(
    requestId: string,
    dto: RevokeDatasetReleaseDto,
    actor: AuthenticatedUser,
  ): Promise<RevokeReleaseResponseDto> {
    return this.em.transactional(async (tx) => {
      const request = await this.researchRepo.findReleaseRequestForUpdate(
        tx,
        requestId,
      );
      if (!request) {
        throw new ResourceNotFoundException(
          'Solicitud de release no encontrada.',
          { requestId },
        );
      }

      if (
        !(CLOSEABLE_RELEASE_STATUSES as readonly string[]).includes(
          request.status,
        )
      ) {
        return { id: request.id, status: request.status, alreadyClosed: true };
      }

      const manifest = await this.researchRepo.findManifestByRequestForUpdate(
        tx,
        requestId,
      );
      const now = new Date();

      request.status = dto.expired === true ? 'expired' : 'revoked';
      if (manifest) {
        // Adelantar la caducidad es lo que corta el acceso: el manifiesto no se
        // borra aquí porque su purga física es del almacén de objetos.
        manifest.expiresAt = now;
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: request.tenantId,
        eventType: 'DatasetReleaseRevoked',
        aggregateType: 'lakehouse.dataset_release_requests',
        aggregateId: request.id,
        payloadJson: {
          status: request.status,
          manifestId: manifest?.id ?? null,
          objectManifestId: manifest?.objectManifestId ?? null,
          reason: dto.reason ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'lakehouse.research.revoke',
          requestId,
          status: request.status,
        },
        'Release de investigación cerrado',
      );

      return { id: request.id, status: request.status, alreadyClosed: false };
    });
  }

  /**
   * UC-63-12 (descubrimiento del worker): releases con manifiesto vencido que
   * todavía no se cerraron. El propio README lo deja explícito como
   * pendiente: el endpoint es idempotente, "quien lo llama en bucle es el
   * worker" — esta es la consulta de descubrimiento que le faltaba.
   */
  async listExpiredReleases(
    limit = DEFAULT_EXPIRED_RELEASES_BATCH,
  ): Promise<PendingExpiredReleasesResponseDto> {
    const now = new Date();
    const manifests = await this.researchRepo.findExpiredManifests(
      this.em,
      now,
      limit,
    );

    const releases: ExpiredReleaseSummaryDto[] = [];
    for (const manifest of manifests) {
      const request = await this.researchRepo.findReleaseRequestById(
        this.em,
        manifest.datasetReleaseRequestId,
      );
      // Sólo lo que sigue "abierto": ya cerrado (revocado o expirado antes)
      // no debe volver a ofrecerse al worker en cada tick para siempre.
      if (
        request &&
        (CLOSEABLE_RELEASE_STATUSES as readonly string[]).includes(
          request.status,
        )
      ) {
        releases.push({ requestId: request.id, expiresAt: manifest.expiresAt });
      }
    }

    return { releases };
  }
}
