import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalAccessGrants } from '../../authz/entities';
import { Files } from '../../common/entities/files.entity';
import { Consents } from '../../consent/entities';
import { CONS } from '../../consent/consent.concepts';
import { CohortDefinitions } from '../../lakehouse/entities';
import {
  DataReleaseRepository,
  CanonicalResourcesRepository,
  PatientIdentityRepository,
  HealthProvenanceRepository,
} from '../repositories';
import {
  RecordDeidRunDto,
  DeidRunResponseDto,
  ExportBundleDto,
  ExportJobResponseDto,
  EverythingBundleResponseDto,
  EverythingEntryDto,
} from '../dto';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { assertHealthResourceInTenant } from '../health-data-scope';
import { HealthDataErrorReason } from '../health_data.error-reasons';

/** Rol que lee la historia del tenant sin necesitar un acceso clínico nominal. */
const TENANT_DATA_ADMIN_ROLE = 'HEALTH_DATA_ADMIN';

/** Con qué fundamento se autorizó la lectura de la historia de un paciente. */
type ReadDecision = 'CLINICAL_ACCESS_GRANT' | 'TENANT_DATA_ADMIN';

/** Versión del manifiesto que abre cada trabajo de exportación. */
const FIRST_MANIFEST_VERSION = 1;

/**
 * Liberación de datos: de-identificación, exportación de Bundles FHIR con
 * manifiesto sellado y servicio de la historia longitudinal
 * (UC-52-11 … 13).
 *
 * Todo lo que sale de aquí es acceso a datos clínicos: el propósito de uso es
 * obligatorio y cada liberación deja procedencia.
 */
@Injectable()
export class DataReleaseService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param releaseRepo - Valor de release repo requerido por la operación.
   * @param resourcesRepo - Valor de resources repo requerido por la operación.
   * @param identityRepo - Valor de identity repo requerido por la operación.
   * @param provenanceRepo - Valor de provenance repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly releaseRepo: DataReleaseRepository,
    private readonly resourcesRepo: CanonicalResourcesRepository,
    private readonly identityRepo: PatientIdentityRepository,
    private readonly provenanceRepo: HealthProvenanceRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DataReleaseService.name);
  }

  /**
   * UC-52-11: registrar una corrida de de-identificación con su procedencia y
   * el linaje de cada versión de origen hacia el manifiesto de salida.
   *
   * La clave de re-identificación vive en el vault y no pasa por aquí: el
   * módulo guarda su referencia, nunca su valor.
   */
  async recordDeidRun(
    dto: RecordDeidRunDto,
    actor: AuthenticatedUser,
  ): Promise<DeidRunResponseDto> {
    this.logger.info(
      {
        operation: 'health-data.deid.run',
        profileId: dto.healthDeidentificationProfileId,
        outcome: dto.outcome,
      },
      'Recording de-identification run',
    );

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const profile = assertHealthResourceInTenant(
        await this.releaseRepo.findDeidProfileById(
          tx,
          dto.healthDeidentificationProfileId,
        ),
        tenantId,
        'Perfil de de-identificación no encontrado',
        HealthDataErrorReason.DEID_PROFILE_NOT_AVAILABLE,
      );
      if (profile.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'El perfil de de-identificación no está activo',
          {
            profileId: dto.healthDeidentificationProfileId,
          },
        );
      }
      // Una corrida que dice haber terminado bien sin salida no entregó nada:
      // el manifiesto es lo único que prueba qué se liberó.
      if (dto.outcome === 'COMPLETED' && !dto.outputManifestFileId) {
        throw new PreconditionFailedException(
          'Una corrida completada debe declarar su manifiesto de salida',
          { profileId: dto.healthDeidentificationProfileId },
        );
      }

      // El linaje (sólo se dibuja con manifiesto de salida) enlaza versiones de
      // origen con el manifiesto: cada versión
      // tiene que ser de un recurso custodiado por este tenant, o la corrida
      // sellaría linaje sobre datos de otra organización.
      if (dto.outputManifestFileId) {
        await this.assertVersionsInTenant(tx, tenantId, dto.sourceVersionIds);
      }
      // El consentimiento y los manifiestos son UUID que aporta el cliente: se
      // guardan en la corrida y en su procedencia, así que tienen que ser del
      // tenant activo (404 uniforme, sin dejar corrida).
      if (dto.consentDirectiveId) {
        await this.assertConsentInTenant(
          tx,
          tenantId,
          dto.consentDirectiveId,
          undefined,
        );
      }
      await this.assertFileInTenant(tx, tenantId, dto.inputManifestFileId);
      await this.assertFileInTenant(tx, tenantId, dto.outputManifestFileId);

      const statusConceptId =
        dto.outcome === 'COMPLETED'
          ? CONCEPTS.DEID_COMPLETED
          : CONCEPTS.DEID_FAILED;

      const run = this.releaseRepo.createDeidRun(tx, {
        tenantId,
        healthDeidentificationProfileId: dto.healthDeidentificationProfileId,
        purposeConceptId: dto.purposeConceptId,
        consentDirectiveId: dto.consentDirectiveId,
        startedAt: new Date(dto.startedAt),
        statusConceptId,
        inputManifestFileId: dto.inputManifestFileId,
        outputManifestFileId: dto.outputManifestFileId,
        recordsProcessed: dto.recordsProcessed,
        recordsRejected: dto.recordsRejected,
        verificationSummaryJson: dto.verificationSummaryJson,
      });

      const provenance = this.provenanceRepo.createProvenanceRecord(tx, {
        custodianTenantId: tenantId,
        activityConceptId: CONCEPTS.PROV_DEIDENTIFY,
        occurredStartAt: new Date(dto.startedAt),
        occurredEndAt: new Date(),
        responsibleAgentId: actor.id,
        policyUrisJson: dto.consentDirectiveId
          ? { consentDirectiveId: dto.consentDirectiveId }
          : undefined,
      });
      // El objetivo referencia el registro de procedencia por una columna uuid
      // plana: sin este flush MikroORM puede insertarlo antes y la FK lo
      // rechaza. Mismo patrón que en `OutboxService.publishDomainEvent`.
      await tx.flush();
      this.provenanceRepo.createProvenanceTarget(tx, {
        healthProvenanceRecordId: provenance.id,
        targetTypeConceptId: CONCEPTS.HD_ENTITY_MANIFEST,
        targetId: dto.outputManifestFileId ?? run.id,
      });

      let lineageEdgeCount = 0;
      if (dto.outputManifestFileId) {
        for (const sourceVersionId of dto.sourceVersionIds ?? []) {
          this.provenanceRepo.createLineageEdge(tx, {
            tenantId,
            sourceTypeConceptId: CONCEPTS.HD_ENTITY_RESOURCE_VERSION,
            sourceId: sourceVersionId,
            targetTypeConceptId: CONCEPTS.HD_ENTITY_MANIFEST,
            targetId: dto.outputManifestFileId,
            transformationTypeConceptId: CONCEPTS.LINEAGE_DEIDENTIFY,
          });
          lineageEdgeCount += 1;
        }
      }

      if (dto.outcome === 'FAILED') {
        this.logger.warn(
          { operation: 'health-data.deid.run', runId: run.id },
          'De-identification run failed',
        );
      }

      return {
        id: run.id,
        statusConceptId,
        provenanceRecordId: provenance.id,
        lineageEdgeCount,
      };
    });
  }

  /**
   * UC-52-12: registrar la exportación del Bundle con su manifiesto inmutable.
   * El `content_hash` sella lo entregado: sin él no se podría demostrar después
   * qué contenía exactamente lo que salió.
   */
  async exportBundle(
    dto: ExportBundleDto,
    actor: AuthenticatedUser,
  ): Promise<ExportJobResponseDto> {
    this.logger.warn(
      {
        operation: 'health-data.export.create',
        purposeOfUseConceptId: dto.purposeOfUseConceptId,
        actorUserId: actor.id,
        recordCount: dto.recordCount,
      },
      'Health data exported',
    );

    // Exportar sin decir a quién o a qué cohorte deja una liberación imposible
    // de acotar después.
    if (!dto.patientProfileId && !dto.cohortDefinitionId) {
      throw new PreconditionFailedException(
        'La exportación necesita un paciente o una cohorte',
        { purposeOfUseConceptId: dto.purposeOfUseConceptId },
      );
    }

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      // Todo lo que la exportación referencia se resuelve contra el tenant
      // activo antes de crear el trabajo o el manifiesto; un identificador
      // ajeno responde como inexistente y no deja registro de salida.
      if (dto.patientProfileId) {
        await this.assertPatientInTenant(
          tx,
          tenantId,
          actor,
          dto.patientProfileId,
        );
      }
      if (dto.cohortDefinitionId) {
        await this.assertCohortInTenant(tx, tenantId, dto.cohortDefinitionId);
      }
      if (dto.consentDirectiveId) {
        await this.assertConsentInTenant(
          tx,
          tenantId,
          dto.consentDirectiveId,
          dto.patientProfileId,
        );
      }
      await this.assertFileInTenant(tx, tenantId, dto.fileId);
      if (dto.deidentificationRunId) {
        const deidRun = assertHealthResourceInTenant(
          await this.releaseRepo.findDeidRunById(tx, dto.deidentificationRunId),
          tenantId,
          'Corrida de de-identificación no encontrada',
          HealthDataErrorReason.DEID_RUN_NOT_AVAILABLE,
        );
        // Exportar apoyándose en una de-identificación que falló entregaría
        // datos que nadie llegó a anonimizar.
        if (deidRun.statusConceptId !== CONCEPTS.DEID_COMPLETED) {
          throw new PreconditionFailedException(
            'La corrida de de-identificación no está completada',
            { deidentificationRunId: dto.deidentificationRunId },
          );
        }
      }

      const job = this.releaseRepo.createExportJob(tx, {
        tenantId,
        exportTypeConceptId: dto.exportTypeConceptId,
        requestedByUserId: actor.id,
        purposeOfUseConceptId: dto.purposeOfUseConceptId,
        patientProfileId: dto.patientProfileId,
        cohortDefinitionId: dto.cohortDefinitionId,
        consentDirectiveId: dto.consentDirectiveId,
        deidentificationRunId: dto.deidentificationRunId,
        statusConceptId: CONCEPTS.EXPORT_COMPLETED,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        deliveryDestinationJson: dto.deliveryDestinationJson,
      });

      const manifest = this.releaseRepo.createExportManifest(tx, {
        healthExportJobId: job.id,
        manifestVersion: FIRST_MANIFEST_VERSION,
        fileId: dto.fileId,
        contentHash: dto.contentHash,
        recordCount: dto.recordCount,
        sizeBytes: dto.sizeBytes,
        encryptionProfileId: dto.encryptionProfileId,
        retentionPolicyId: dto.retentionPolicyId,
      });

      const provenance = this.provenanceRepo.createProvenanceRecord(tx, {
        custodianTenantId: tenantId,
        activityConceptId: CONCEPTS.PROV_EXPORT,
        occurredStartAt: new Date(),
        responsibleAgentId: actor.id,
        contentHash: dto.contentHash,
        policyUrisJson: {
          purposeOfUseConceptId: dto.purposeOfUseConceptId,
          consentDirectiveId: dto.consentDirectiveId,
        },
      });
      // El objetivo referencia el registro de procedencia por una columna uuid
      // plana: sin este flush MikroORM puede insertarlo antes y la FK lo
      // rechaza. Mismo patrón que en `OutboxService.publishDomainEvent`.
      await tx.flush();
      this.provenanceRepo.createProvenanceTarget(tx, {
        healthProvenanceRecordId: provenance.id,
        targetTypeConceptId: CONCEPTS.HD_ENTITY_MANIFEST,
        targetId: manifest.id,
      });

      return {
        id: job.id,
        statusConceptId: CONCEPTS.EXPORT_COMPLETED,
        manifestId: manifest.id,
        manifestVersion: FIRST_MANIFEST_VERSION,
        provenanceRecordId: provenance.id,
      };
    });
  }

  /**
   * UC-52-13: servir la historia longitudinal del paciente.
   *
   * La identidad se expande por el clúster del MPI: si dos perfiles se
   * resolvieron como la misma persona, su historia es una sola, y devolver
   * únicamente el perfil por el que se preguntó daría una vista incompleta al
   * clínico que la consulta.
   */
  async serveEverything(
    patientProfileId: string,
    custodianTenantId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<EverythingBundleResponseDto> {
    // El custodio sale de la sesión, nunca de la query: un `custodian` distinto
    // del tenant activo se trata como paciente no disponible.
    const tenantId = requireTenantId();
    if (custodianTenantId !== undefined && custodianTenantId !== tenantId) {
      throw this.patientNotAvailable();
    }

    return this.em.transactional(async (tx) => {
      // Sólo cuenta el clúster del tenant activo: el de otra organización no se
      // expande ni aporta identidad.
      const membership = await this.identityRepo.findLiveMembershipInTenant(
        tx,
        patientProfileId,
        tenantId,
      );
      const decision = await this.resolveReadDecision(
        tx,
        tenantId,
        actor,
        patientProfileId,
      );

      let includedPatientProfileIds = [patientProfileId];
      if (membership) {
        const members = await this.identityRepo.findLiveMembers(
          tx,
          membership.patientIdentityClusterId,
        );
        includedPatientProfileIds = [
          ...new Set([
            patientProfileId,
            ...members.map((member) => member.patientProfileId),
          ]),
        ];
      }

      const resources = await this.resourcesRepo.findResourcesByPatient(
        tx,
        tenantId,
        includedPatientProfileIds,
        CONCEPTS.RESOURCE_ACTIVE,
      );

      // Un administrador sin acceso nominal sólo ve a pacientes con huella en su
      // tenant (clúster o recursos); si no la hay, el paciente "no existe".
      if (
        decision === 'TENANT_DATA_ADMIN' &&
        !membership &&
        resources.length === 0
      ) {
        throw this.patientNotAvailable();
      }

      // Registro de acceso: decisión y fundamento, sin contenido clínico.
      this.logger.warn(
        {
          operation: 'health-data.patient.everything',
          patientProfileId,
          actorUserId: actor.id,
          tenantId,
          decision,
          resources: resources.length,
        },
        'Serving patient longitudinal history',
      );

      const versionIds = resources
        .map((resource) => resource.currentVersionId)
        .filter((id): id is string => id !== undefined);
      const versions = versionIds.length
        ? await this.resourcesRepo.findVersionsByIds(tx, versionIds)
        : [];
      const byId = new Map(versions.map((version) => [version.id, version]));

      const entries: EverythingEntryDto[] = [];
      for (const resource of resources) {
        const version = resource.currentVersionId
          ? byId.get(resource.currentVersionId)
          : undefined;
        // Un recurso sin versión vigente no tiene contenido que servir; queda
        // fuera del Bundle en vez de aparecer vacío.
        if (!version) continue;

        entries.push({
          resourceId: resource.id,
          resourceTypeConceptId: resource.resourceTypeConceptId,
          versionId: version.id,
          versionNumber: version.versionNumber,
          payload: version.normalizedPayloadJson,
        });
      }

      // El hash sale de las versiones incluidas y su orden estable: identifica
      // el Bundle sin depender del orden en que la consulta las devolvió.
      const contentHash = createHash('sha256')
        .update(
          entries
            .map((entry) => `${entry.versionId}:${entry.versionNumber}`)
            .sort()
            .join('|'),
        )
        .digest('hex');

      return {
        patientProfileId,
        includedPatientProfileIds,
        identityClusterId: membership?.patientIdentityClusterId,
        entries,
        total: entries.length,
        contentHash,
      };
    });
  }

  /**
   * Respuesta única de "paciente no disponible": inexistente, de otro tenant o
   * sin acceso del actor son indistinguibles.
   *
   * @returns La excepción 404 uniforme.
   */
  private patientNotAvailable(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Paciente no encontrado',
      undefined,
      HealthDataErrorReason.PATIENT_NOT_AVAILABLE,
    );
  }

  /**
   * Política clínica de lectura de la historia de un paciente.
   *
   * Autoriza si el actor tiene un acceso clínico vigente (`authz.clinical_access_grants`)
   * sobre el paciente en el tenant activo, o si es `HEALTH_DATA_ADMIN` de ese
   * tenant. Cualquier otro caso se deniega como "paciente no disponible".
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param actor - Quien lee.
   * @param patientProfileId - Paciente pedido.
   * @returns El fundamento de la autorización.
   * @throws ResourceNotFoundException uniforme si no hay fundamento.
   */
  private async resolveReadDecision(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    patientProfileId: string,
  ): Promise<ReadDecision> {
    const now = new Date();
    const grants = await tx.find(ClinicalAccessGrants, {
      patientProfileId,
      grantedUserId: actor.id,
      tenantId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    if (grants.some((grant) => grant.validFrom <= now && grant.validTo > now)) {
      return 'CLINICAL_ACCESS_GRANT';
    }
    if (roleAuthorizesInTenant(actor, TENANT_DATA_ADMIN_ROLE, tenantId)) {
      return 'TENANT_DATA_ADMIN';
    }
    throw this.patientNotAvailable();
  }

  /**
   * El paciente exportado tiene que estar vinculado al tenant activo (clúster,
   * recursos custodiados o acceso clínico del actor) y el actor debe poder
   * leerlo; si no, responde como inexistente y no se crea nada.
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param actor - Quien exporta.
   * @param patientProfileId - Paciente a exportar.
   * @throws ResourceNotFoundException uniforme si no está disponible.
   */
  private async assertPatientInTenant(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    patientProfileId: string,
  ): Promise<void> {
    const decision = await this.resolveReadDecision(
      tx,
      tenantId,
      actor,
      patientProfileId,
    );
    if (decision === 'CLINICAL_ACCESS_GRANT') return;
    const inCluster = await this.identityRepo.findLiveMembershipInTenant(
      tx,
      patientProfileId,
      tenantId,
    );
    const hasResources =
      inCluster !== null ||
      (await this.resourcesRepo.existsResourceByPatient(
        tx,
        tenantId,
        patientProfileId,
      ));
    if (!hasResources) throw this.patientNotAvailable();
  }

  /**
   * La cohorte exportada pertenece al tenant activo si su perfil de
   * de-identificación lo es (la cohorte no lleva tenant propio).
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param cohortDefinitionId - Cohorte a exportar.
   * @throws ResourceNotFoundException uniforme si no existe o es ajena.
   */
  private async assertCohortInTenant(
    tx: EntityManager,
    tenantId: string,
    cohortDefinitionId: string,
  ): Promise<void> {
    const cohort = await tx.findOne(CohortDefinitions, {
      id: cohortDefinitionId,
    });
    const profile = cohort
      ? await this.releaseRepo.findDeidProfileById(
          tx,
          cohort.deidentificationProfileId,
        )
      : null;
    assertResourceInTenant(cohort, profile?.tenantId, tenantId, {
      message: 'Cohorte no encontrada',
      reason: HealthDataErrorReason.COHORT_NOT_AVAILABLE,
    });
  }

  /**
   * La directiva de consentimiento citada debe ser vigente, del tenant activo y,
   * si se exporta un paciente, de ese mismo paciente.
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param consentDirectiveId - Consentimiento citado por la exportación.
   * @param patientProfileId - Paciente exportado, si lo hay.
   * @throws ResourceNotFoundException uniforme si no cumple.
   */
  private async assertConsentInTenant(
    tx: EntityManager,
    tenantId: string,
    consentDirectiveId: string,
    patientProfileId: string | undefined,
  ): Promise<void> {
    const consent = await tx.findOne(Consents, { id: consentDirectiveId });
    const usable =
      consent !== null &&
      consent.tenantId === tenantId &&
      consent.statusConceptId === CONS.CONSENT_ACTIVE &&
      (patientProfileId === undefined ||
        consent.patientProfileId === patientProfileId);
    if (!usable) {
      throw new ResourceNotFoundException(
        'Consentimiento no encontrado',
        undefined,
        HealthDataErrorReason.CONSENT_NOT_AVAILABLE,
      );
    }
  }

  /**
   * Un archivo citado (manifiesto de entrada o de salida) debe ser del tenant.
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param fileId - Archivo citado; si no se cita ninguno, no hace nada.
   * @throws ResourceNotFoundException uniforme si no existe o es ajeno.
   */
  private async assertFileInTenant(
    tx: EntityManager,
    tenantId: string,
    fileId: string | undefined,
  ): Promise<void> {
    if (!fileId) return;
    const file = await tx.findOne(Files, { id: fileId });
    assertResourceInTenant(file, file?.tenantId, tenantId, {
      message: 'Archivo no encontrado',
      reason: HealthDataErrorReason.FILE_NOT_AVAILABLE,
    });
  }

  /**
   * Cada versión de origen del linaje debe pertenecer a un recurso del tenant.
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param versionIds - Versiones declaradas como origen.
   * @throws ResourceNotFoundException uniforme si alguna no existe o es ajena.
   */
  private async assertVersionsInTenant(
    tx: EntityManager,
    tenantId: string,
    versionIds: readonly string[] | undefined,
  ): Promise<void> {
    const ids = [...new Set(versionIds ?? [])];
    if (ids.length === 0) return;
    const versions = await this.resourcesRepo.findVersionsByIds(tx, ids);
    const resources = versions.length
      ? await this.resourcesRepo.findResourcesByIds(
          tx,
          versions.map((version) => version.canonicalHealthResourceId),
        )
      : [];
    const owned = new Set(
      resources
        .filter((resource) => resource.custodianTenantId === tenantId)
        .map((resource) => resource.id),
    );
    const allOwned =
      versions.length === ids.length &&
      versions.every((version) => owned.has(version.canonicalHealthResourceId));
    if (!allOwned) {
      throw new ResourceNotFoundException(
        'Versión de origen no encontrada',
        undefined,
        HealthDataErrorReason.RESOURCE_VERSION_NOT_AVAILABLE,
      );
    }
  }
}
