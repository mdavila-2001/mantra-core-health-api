import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../common/constants/concepts';
import { StorageLifecycleDenied } from '../../common/storage/storage-lifecycle.protocol';
import { GovernanceRepository } from '../system_ops/repositories/governance.repository';
import { EntityRegistry } from '../system_ops/entities/entity_registry.entity';
import { CatalogConcepts } from '../terminology/entities/catalog_concepts.entity';
import { SYSOPS } from '../system_ops/system_ops.concepts';

export type IdentityDisposition = 'RETENTION' | 'ANONYMIZATION' | 'PURGE';
export const IDENTITY_BASE_EVENTS = [
  'evidence.createdAt',
  'evidence.issuedAt',
  'evidence.expiresAt',
  'case.createdAt',
  'case.openedAt',
  'case.completedAt',
  'case.expiresAt',
] as const;
export interface IdentityLifecycleRule {
  tenantId: string;
  evidenceTypeConceptCode: string;
  operation: IdentityDisposition;
  retentionPolicyCode: string;
  expectedRowVersion: number;
  expectedDispositionConceptCode: string;
  entityRegistryId: string;
  baseEvent: (typeof IDENTITY_BASE_EVENTS)[number];
  allowedCaseStatusConceptCodes: string[];
  additionalWaitSeconds: number;
  fieldRules: {
    fieldRegistryId: string;
    expectedRowVersion: number;
    anonymizationRuleId: string;
    expectedRuleRowVersion: number;
  }[];
  metadataDisposition: 'PRESERVE' | 'MINIMIZE' | 'REMOVE';
  preserveProfile: 'CASE_ANCHOR_WORM_TECHNICAL_REVISION';
  storageDisposition: 'PRESERVE' | 'PURGE';
  authorizationRevision: string;
}
export interface IdentityLifecycleConfig {
  schemaVersion: 1;
  revision: string;
  enabled: boolean;
  rules: IdentityLifecycleRule[];
}
export const IDENTITY_LIFECYCLE_CONFIG = Symbol('IDENTITY_LIFECYCLE_CONFIG');
/** No legal duration, implicit cutoff, wildcard tenant or enabling seed. */
export const DEFAULT_IDENTITY_LIFECYCLE_CONFIG: IdentityLifecycleConfig = {
  schemaVersion: 1,
  revision: '7.2-deny-by-default-v1',
  enabled: false,
  rules: [],
};

export interface ResolvedIdentityLifecycleRule {
  rule: IdentityLifecycleRule;
  configRevision: string;
  retentionPeriodDays: number;
  evidenceTypeConceptId: string;
  allowedCaseStatusConceptIds: string[];
  fieldOperations?: { columnName: string; operation: 'CLEAR' }[];
  retentionPolicyId?: string;
}

export function loadIdentityLifecycleConfig(): IdentityLifecycleConfig {
  const raw = process.env.IDENTITY_EVIDENCE_LIFECYCLE_CONFIG;
  if (!raw) return DEFAULT_IDENTITY_LIFECYCLE_CONFIG;
  try {
    return JSON.parse(raw) as IdentityLifecycleConfig;
  } catch {
    throw new StorageLifecycleDenied('CONFIGURATION_INVALID');
  }
}

/** Typed binding to the existing governance catalog, not a second policy store. */
@Injectable()
export class IdentityLifecycleConfigResolver {
  constructor(
    private readonly governance: GovernanceRepository,
    @Inject(IDENTITY_LIFECYCLE_CONFIG)
    private readonly config: IdentityLifecycleConfig,
  ) {}

  configuredRules(): readonly IdentityLifecycleRule[] {
    if (
      !this.config ||
      this.config.schemaVersion !== 1 ||
      this.config.enabled !== true ||
      !Array.isArray(this.config.rules)
    )
      return [];
    if (
      !this.config.revision ||
      this.config.rules.some(
        (rule) =>
          !rule ||
          typeof rule !== 'object' ||
          ![
            rule.tenantId,
            rule.evidenceTypeConceptCode,
            rule.retentionPolicyCode,
          ].every(
            (value) =>
              typeof value === 'string' && value.length > 0 && value !== '*',
          ) ||
          !['RETENTION', 'ANONYMIZATION', 'PURGE'].includes(rule.operation),
      )
    )
      return [];
    return this.config.rules;
  }

  async resolve(
    tx: EntityManager,
    tenantId: string,
    evidenceTypeConceptCode: string,
    operation: IdentityDisposition,
  ): Promise<ResolvedIdentityLifecycleRule> {
    if (
      !this.config ||
      this.config.schemaVersion !== 1 ||
      this.config.enabled !== true ||
      !this.config.revision ||
      !Array.isArray(this.config.rules)
    )
      throw new StorageLifecycleDenied('MISSING_CONFIGURATION');
    const rules = this.configuredRules().filter(
      (rule) =>
        rule.tenantId === tenantId &&
        rule.evidenceTypeConceptCode === evidenceTypeConceptCode &&
        rule.operation === operation,
    );
    if (rules.length !== 1)
      throw new StorageLifecycleDenied('MISSING_OR_DUPLICATE_BINDING');
    const rule = rules[0];
    if (
      !tenantId ||
      tenantId === '*' ||
      !rule.authorizationRevision ||
      !IDENTITY_BASE_EVENTS.includes(rule.baseEvent) ||
      !Number.isSafeInteger(rule.additionalWaitSeconds) ||
      rule.additionalWaitSeconds < 0 ||
      !Array.isArray(rule.allowedCaseStatusConceptCodes) ||
      !rule.allowedCaseStatusConceptCodes.length ||
      rule.allowedCaseStatusConceptCodes.some(
        (code) => !code || code === '*',
      ) ||
      !Number.isSafeInteger(rule.expectedRowVersion) ||
      rule.expectedRowVersion < 1 ||
      rule.preserveProfile !== 'CASE_ANCHOR_WORM_TECHNICAL_REVISION' ||
      !['PRESERVE', 'MINIMIZE', 'REMOVE'].includes(rule.metadataDisposition) ||
      !['PRESERVE', 'PURGE'].includes(rule.storageDisposition) ||
      (operation !== 'PURGE' && rule.storageDisposition !== 'PRESERVE') ||
      (operation === 'RETENTION' && rule.metadataDisposition !== 'PRESERVE') ||
      !Array.isArray(rule.fieldRules)
    )
      throw new StorageLifecycleDenied('CONFIGURATION_INVALID');
    const registries = await tx.find(EntityRegistry, {
      schemaName: 'identity_assurance',
      tableName: 'identity_evidence_records',
    });
    if (
      registries.length !== 1 ||
      registries[0].id !== rule.entityRegistryId ||
      registries[0].stateConceptId !== CONCEPTS.STATE_ACTIVE ||
      (operation !== 'RETENTION' && registries[0].isAppendOnly === true)
    )
      throw new StorageLifecycleDenied('REGISTRY_BINDING_INVALID');
    const policy = await this.governance.findRetentionPolicyByCode(
      tx,
      rule.retentionPolicyCode,
    );
    if (
      !policy ||
      policy.stateConceptId !== CONCEPTS.STATE_ACTIVE ||
      policy.rowVersion !== rule.expectedRowVersion ||
      !Number.isSafeInteger(policy.retentionPeriodDays) ||
      (policy.retentionPeriodDays ?? -1) < 0
    )
      throw new StorageLifecycleDenied('RETENTION_POLICY_INVALID');
    const conceptId = async (code: string): Promise<string> => {
      const concepts = await tx.find(CatalogConcepts, { code });
      if (
        concepts.length !== 1 ||
        concepts[0].stateConceptId !== CONCEPTS.STATE_ACTIVE
      )
        throw new StorageLifecycleDenied('CONCEPT_UNKNOWN');
      return concepts[0].id;
    };
    if (
      (await conceptId(rule.expectedDispositionConceptCode)) !==
      policy.dispositionConceptId
    )
      throw new StorageLifecycleDenied('POLICY_DISPOSITION_MISMATCH');
    if (
      (operation === 'PURGE' &&
        policy.dispositionConceptId !== SYSOPS.DISPOSITION_DELETE) ||
      (operation === 'ANONYMIZATION' &&
        policy.dispositionConceptId !== SYSOPS.DISPOSITION_ANONYMIZE)
    )
      throw new StorageLifecycleDenied('OPERATION_NOT_AUTHORIZED');
    const fieldIds = new Set<string>();
    const fieldOperations: { columnName: string; operation: 'CLEAR' }[] = [];
    for (const binding of rule.fieldRules) {
      if (fieldIds.has(binding.fieldRegistryId))
        throw new StorageLifecycleDenied('DUPLICATE_FIELD_RULE');
      fieldIds.add(binding.fieldRegistryId);
      const field = await this.governance.findFieldById(
        tx,
        binding.fieldRegistryId,
      );
      const fieldRule = await this.governance.findAnonymizationRuleById(
        tx,
        binding.anonymizationRuleId,
      );
      if (
        !field ||
        !fieldRule ||
        field.entityRegistryId !== rule.entityRegistryId ||
        field.rowVersion !== binding.expectedRowVersion ||
        field.anonymizationRuleId !== fieldRule.id ||
        fieldRule.rowVersion !== binding.expectedRuleRowVersion
      )
        throw new StorageLifecycleDenied('FIELD_RULE_BINDING_INVALID');
      // No technique-name inference: explicit, versioned governance parameters only.
      const parameters = fieldRule.parametersJson as
        { schemaVersion?: unknown; operation?: unknown } | undefined;
      const nullableEvidenceFields = [
        'issuer_authority_id',
        'evidence_identifier_hash',
        'evidence_file_id',
        'encrypted_evidence_reference',
        'evidence_quality_concept_id',
        'issued_at',
        'expires_at',
        'collected_under_consent_id',
        'created_by_user_id',
      ];
      if (
        fieldRule.techniqueConceptId !== SYSOPS.TECHNIQUE_MASK ||
        parameters?.schemaVersion !== 1 ||
        parameters.operation !== 'CLEAR' ||
        !nullableEvidenceFields.includes(field.columnName)
      )
        throw new StorageLifecycleDenied('FIELD_OPERATION_UNSUPPORTED');
      fieldOperations.push({
        columnName: field.columnName,
        operation: 'CLEAR',
      });
    }
    if (
      operation === 'ANONYMIZATION' &&
      (rule.metadataDisposition !== 'MINIMIZE' || !fieldOperations.length)
    )
      throw new StorageLifecycleDenied('ANONYMIZATION_RULES_MISSING');
    if (operation === 'PURGE' && rule.metadataDisposition !== 'REMOVE')
      throw new StorageLifecycleDenied('PURGE_METADATA_RULE_MISSING');
    return {
      rule,
      configRevision: this.config.revision,
      retentionPeriodDays: policy.retentionPeriodDays!,
      retentionPolicyId: policy.id,
      fieldOperations,
      evidenceTypeConceptId: await conceptId(evidenceTypeConceptCode),
      allowedCaseStatusConceptIds: await Promise.all(
        rule.allowedCaseStatusConceptCodes.map(conceptId),
      ),
    };
  }
}
