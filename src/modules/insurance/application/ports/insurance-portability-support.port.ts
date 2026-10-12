import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';

export interface InsurancePortabilityPatientParts {
  readonly fullName: string;
  readonly nationalId: string | null;
  readonly issuerAdministrativeAreaConceptId?: string;
  readonly birthDate: string | null;
}

export interface InsurancePortabilityJobRecord {
  readonly id: string;
  readonly patientProfileId?: string | null;
  readonly exportTypeConceptId: string;
  readonly requestedAt: Date;
}

export interface InsurancePortabilityManifestRecord {
  readonly id: string;
  readonly healthExportJobId: string;
  readonly fileId: string;
  readonly contentHash: string;
  readonly recordCount: string;
}

export interface InsurancePortabilityExportInput {
  readonly certificateId: string;
  readonly actor: AuthenticatedUser;
  readonly patientProfileId: string;
  readonly generatedAt: Date;
  readonly fileId: string;
  readonly manifestHash: string;
  readonly recordCount: string;
  readonly sizeBytes: string;
  readonly format: string;
  readonly targetInsurerTenantId: string | null;
}

export interface InsurancePortabilitySupportPort {
  assertOwnsPatientProfile(
    em: EntityManager,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void>;
  resolvePatientParts(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<InsurancePortabilityPatientParts>;
  storeGeneratedFile(
    buffer: Buffer,
    originalName: string,
    actor: AuthenticatedUser,
  ): Promise<{ id: string }>;
  downloadFile(fileId: string, operation: string): Promise<{ buffer: Buffer }>;
  persistExport(
    tx: EntityManager,
    input: InsurancePortabilityExportInput,
  ): Promise<void>;
  recordAudit(
    tx: EntityManager,
    actor: AuthenticatedUser,
    entry: {
      action: string;
      entity: string;
      entityId?: string;
      success?: boolean;
    },
  ): Promise<void>;
  findExportJobById(
    em: EntityManager,
    id: string,
  ): Promise<InsurancePortabilityJobRecord | null>;
  findManifestByContentHash(
    em: EntityManager,
    contentHash: string,
  ): Promise<InsurancePortabilityManifestRecord | null>;
  findManifest(
    em: EntityManager,
    exportJobId: string,
    version: number,
  ): Promise<InsurancePortabilityManifestRecord | null>;
  webAppBaseUrl(): string;
}

export const INSURANCE_PORTABILITY_SUPPORT_PORT = Symbol(
  'INSURANCE_PORTABILITY_SUPPORT_PORT',
);
