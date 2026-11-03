import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ResourceNotFoundException,
  SEED,
  type AuthenticatedUser,
} from '../../../../common';
import { FileCategory, FileSensitivity } from '../../../common/dto';
import { FileUploadService } from '../../../common/services';
import { IdentifiersRepository } from '../../../common/repositories';
import { ProfileOwnershipService } from '../../../profiles/application/services/profile-ownership.service';
import {
  PatientProfilesRepository,
  PersonsRepository,
} from '../../../profiles/infrastructure/repositories';
import { composePersonDisplayName } from '../../../profiles/domain/person-name';
import { DataReleaseRepository } from '../../../health_data/repositories/data-release.repository';
import { HealthProvenanceRepository } from '../../../health_data/repositories/health-provenance.repository';
import { DsarRequestsRepository } from '../../../audit/repositories/dsar-requests.repository';
import { DataAccessLogRepository } from '../../../audit/repositories/data-access-log.repository';
import { AuditTrailService } from '../../../audit/services';
import { AUD } from '../../../audit/audit.concepts';
import { CONCEPTS as COMMON_CONCEPTS } from '../../../../common/constants/concepts';
import { loadAgendaNoticesEnv } from '../../../scheduling/infrastructure/config/agenda-notices.env';
import type {
  InsurancePortabilityExportInput,
  InsurancePortabilitySupportPort,
} from '../../application/ports/insurance-portability-support.port';

@Injectable()
export class InsurancePortabilitySupportAdapter implements InsurancePortabilitySupportPort {
  constructor(
    private readonly ownership: ProfileOwnershipService,
    private readonly patients: PatientProfilesRepository,
    private readonly persons: PersonsRepository,
    private readonly identifiers: IdentifiersRepository,
    private readonly files: FileUploadService,
    private readonly releases: DataReleaseRepository,
    private readonly provenance: HealthProvenanceRepository,
    private readonly dsar: DsarRequestsRepository,
    private readonly access: DataAccessLogRepository,
    private readonly audit: AuditTrailService,
  ) {}

  assertOwnsPatientProfile(
    em: EntityManager,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    return this.ownership.assertOwnsPatientProfile(em, patientProfileId, actor);
  }

  async resolvePatientParts(em: EntityManager, patientProfileId: string) {
    const profile = await this.patients.findById(em, patientProfileId);
    if (!profile) {
      throw new ResourceNotFoundException('Paciente no encontrado', {
        patientProfileId,
      });
    }
    const [person, identifiers] = await Promise.all([
      this.persons.findById(em, profile.profileId),
      this.identifiers.findCurrentByOwner(em, profile.profileId),
    ]);
    const nationalIdentifier = identifiers.find(
      (identifier) => identifier.typeConceptId === CONCEPTS.ID_TYPE_NATIONAL,
    );
    return {
      fullName: person ? (composePersonDisplayName(person) ?? '') : '',
      nationalId: nationalIdentifier?.value ?? null,
      issuerAdministrativeAreaConceptId:
        nationalIdentifier?.issuerAdministrativeAreaConceptId,
      birthDate: person?.birthDate
        ? person.birthDate.toISOString().slice(0, 10)
        : null,
    };
  }

  async storeGeneratedFile(
    buffer: Buffer,
    originalName: string,
    actor: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.files.storeGenerated(
      {
        buffer,
        originalName,
        mimeType: 'application/json',
        category: FileCategory.DOCUMENT,
        sensitivity: FileSensitivity.PHI,
      },
      actor,
    );
  }

  downloadFile(fileId: string, operation: string) {
    return this.files.downloadForAuthorizedContext(fileId, operation);
  }

  async persistExport(
    tx: EntityManager,
    input: InsurancePortabilityExportInput,
  ): Promise<void> {
    const job = this.releases.createExportJob(tx, {
      id: input.certificateId,
      tenantId: SEED.tenantId,
      exportTypeConceptId: CONCEPTS.EXPORT_TYPE_INSURANCE_PORTABILITY,
      requestedByUserId: input.actor.id,
      purposeOfUseConceptId: AUD.PURPOSE_PATIENT_REQUEST,
      patientProfileId: input.patientProfileId,
      statusConceptId: CONCEPTS.EXPORT_COMPLETED,
      requestedAt: input.generatedAt,
      deliveryDestinationJson: {
        channel: 'PATIENT_SELF_SERVICE',
        format: input.format,
        targetInsurerTenantId: input.targetInsurerTenantId,
      },
    });
    await tx.flush();
    const manifest = this.releases.createExportManifest(tx, {
      healthExportJobId: job.id,
      manifestVersion: 1,
      fileId: input.fileId,
      contentHash: input.manifestHash,
      recordCount: input.recordCount,
      sizeBytes: input.sizeBytes,
    });
    const provenance = this.provenance.createProvenanceRecord(tx, {
      custodianTenantId: SEED.tenantId,
      activityConceptId: COMMON_CONCEPTS.PROV_EXPORT,
      occurredStartAt: input.generatedAt,
      responsibleAgentId: input.actor.id,
      contentHash: input.manifestHash,
      policyUrisJson: { purposeOfUseConceptId: AUD.PURPOSE_PATIENT_REQUEST },
    });
    await tx.flush();
    this.provenance.createProvenanceTarget(tx, {
      healthProvenanceRecordId: provenance.id,
      targetTypeConceptId: COMMON_CONCEPTS.HD_ENTITY_MANIFEST,
      targetId: manifest.id,
    });
    const request = this.dsar.create(tx, {
      userId: input.actor.id,
      typeConceptId: AUD.DSAR_TYPE_PORTABILITY,
      statusConceptId: AUD.DSAR_COMPLETED,
      actorUserId: input.actor.id,
    });
    request.completedAt = input.generatedAt;
    request.resultFileId = input.fileId;
    this.access.record(tx, {
      userId: input.actor.id,
      actionConceptId: AUD.ACTION_EXPORT,
      patientProfileId: input.patientProfileId,
      purpose: 'insurance-portability-export',
      legalBasisConceptId: AUD.LEGAL_BASIS_CONSENT,
      resourceType: 'insurance.portability_certificate',
      resourceId: input.certificateId,
      recordedByUserId: input.actor.id,
    });
    await this.audit.record(tx, input.actor, {
      action: 'INSURANCE_PORTABILITY_EXPORTED',
      entity: 'insurance.portability_certificate',
      entityId: input.certificateId,
    });
  }

  recordAudit(
    tx: EntityManager,
    actor: AuthenticatedUser,
    entry: Parameters<AuditTrailService['record']>[2],
  ) {
    return this.audit.record(tx, actor, entry);
  }

  findExportJobById(
    ...args: Parameters<DataReleaseRepository['findExportJobById']>
  ) {
    return this.releases.findExportJobById(...args);
  }

  findManifestByContentHash(
    ...args: Parameters<DataReleaseRepository['findManifestByContentHash']>
  ) {
    return this.releases.findManifestByContentHash(...args);
  }

  findManifest(...args: Parameters<DataReleaseRepository['findManifest']>) {
    return this.releases.findManifest(...args);
  }

  webAppBaseUrl(): string {
    return loadAgendaNoticesEnv().webAppBaseUrl;
  }
}
