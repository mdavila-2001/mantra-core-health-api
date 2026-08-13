import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
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

    return this.em.transactional(async (tx) => {
      const profile = await this.releaseRepo.findDeidProfileById(
        tx,
        dto.healthDeidentificationProfileId,
      );
      if (!profile) {
        throw new ResourceNotFoundException(
          'Perfil de de-identificación no encontrado',
          {
            profileId: dto.healthDeidentificationProfileId,
          },
        );
      }
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

      const statusConceptId =
        dto.outcome === 'COMPLETED'
          ? CONCEPTS.DEID_COMPLETED
          : CONCEPTS.DEID_FAILED;

      const run = this.releaseRepo.createDeidRun(tx, {
        tenantId: profile.tenantId,
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
        custodianTenantId: profile.tenantId,
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
            tenantId: profile.tenantId,
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

    return this.em.transactional(async (tx) => {
      if (dto.deidentificationRunId) {
        const deidRun = await this.releaseRepo.findDeidRunById(
          tx,
          dto.deidentificationRunId,
        );
        if (!deidRun) {
          throw new ResourceNotFoundException(
            'Corrida de de-identificación no encontrada',
            {
              deidentificationRunId: dto.deidentificationRunId,
            },
          );
        }
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
    this.logger.warn(
      {
        operation: 'health-data.patient.everything',
        patientProfileId,
        actorUserId: actor.id,
      },
      'Serving patient longitudinal history',
    );

    return this.em.transactional(async (tx) => {
      const membership = await this.identityRepo.findLiveMembershipByProfile(
        tx,
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
        custodianTenantId,
        includedPatientProfileIds,
        CONCEPTS.RESOURCE_ACTIVE,
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
}
