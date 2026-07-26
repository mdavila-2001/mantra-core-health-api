import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { SYSOPS } from '../../../src/modules/system_ops/system_ops.concepts';

/**
 * Smoke del módulo system_ops (11). Encadena recursos sobre `ctx.vars`:
 *  - cataloga una entidad + campos, define y aplica políticas (escritura,
 *    retención, anonimización);
 *  - coloca un legal hold sobre la entidad, corre un barrido de retención (que el
 *    hold excluye) y levanta el hold;
 *  - registra una transferencia transfronteriza;
 *  - define política de backup y registra una prueba de restauración;
 *  - publica un framework, evalúa un workload, registra resultados, abre un
 *    hallazgo, crea un plan con acciones, verifica la acción y ajusta el hallazgo;
 *  - guarda y publica un draft genérico.
 *
 * `ctx.tenantId` es el tenant DEFAULT sembrado (FK válida); `ctx.adminUserId` es
 * un usuario real (FK válida para created_by). Los `*_concept_id` específicos del
 * módulo provienen de `SYSOPS.*` (sembrados por el agregador de conceptos).
 *
 * NOTA: `residency-policies` exige un `terminology.value_sets.id` real y
 * `tenant-residency-bindings` una `polyglot_storage.residency_policies.id`; como
 * no hay endpoint para sembrarlos ni filas deterministas, esos happy-path no se
 * ejercen aquí (solo sus casos límite), según la guía del brief.
 */
export const SYSTEM_OPS_SMOKE: SmokeCase[] = [
  // ===================== UC-11-01: catalogar entidad =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/entity-registry',
    name: 'happy: cataloga entidad + campos',
    method: 'post',
    path: () => '/admin/governance/entity-registry',
    body: (c) => ({
      domain: { code: `SO-DOM-${c.u}`, name: 'Clinical', ownerTeam: 'data-eng' },
      classification: { code: `SO-CLS-${c.u}`, name: 'PHI', isPii: true, isPhi: true, handlingRulesJson: { mask: true } },
      schemaName: 'clinical',
      tableName: `encounters_${c.u}`,
      isAppendOnly: false,
      isSoftDelete: true,
      hasHistory: false,
      containsPii: true,
      containsPhi: true,
      fields: [
        { columnName: 'patient_name', isPii: true },
        { columnName: 'diagnosis', isPhi: true },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soEntityId = String(b.id);
      c.vars.soClassificationId = String(b.classificationId);
      c.vars.soFieldId = String((b.fieldIds as string[])[0]);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/entity-registry',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/admin/governance/entity-registry',
    auth: false,
    body: (c) => ({
      domain: { code: `SO-DOM-X-${c.u}`, name: 'X' },
      classification: { code: `SO-CLS-X-${c.u}`, name: 'X', handlingRulesJson: {} },
      schemaName: 's',
      tableName: 't',
      isAppendOnly: false,
      isSoftDelete: false,
      hasHistory: false,
      fields: [],
    }),
    expectedStatus: 401,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/entity-registry',
    name: 'límite: falta schemaName -> 400',
    method: 'post',
    path: () => '/admin/governance/entity-registry',
    body: (c) => ({
      domain: { code: `SO-DOM-Y-${c.u}`, name: 'X' },
      classification: { code: `SO-CLS-Y-${c.u}`, name: 'X', handlingRulesJson: {} },
      tableName: 't',
      isAppendOnly: false,
      isSoftDelete: false,
      hasHistory: false,
      fields: [],
    }),
    expectedStatus: 400,
  },

  // ===================== UC-11-02: política de escritura =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/write-policies',
    name: 'happy: define política de escritura',
    method: 'post',
    path: () => '/admin/governance/write-policies',
    body: (c) => ({
      code: `SO-WP-${c.u}`,
      name: 'Append-only PHI',
      insertModeConceptId: SYSOPS.WRITE_MODE_ALLOWED,
      updateModeConceptId: SYSOPS.WRITE_MODE_BLOCKED,
      deleteModeConceptId: SYSOPS.WRITE_MODE_SOFT_DELETE,
      requiresReason: true,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soWritePolicyId = String(b.id);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'PATCH /admin/governance/entity-registry/{id}/write-policy',
    name: 'happy: aplica política de escritura',
    method: 'patch',
    path: (c) => `/admin/governance/entity-registry/${c.vars.soEntityId}/write-policy`,
    body: (c) => ({ writePolicyId: c.vars.soWritePolicyId, reason: 'PHI hardening' }),
    expectedStatus: 200,
  },
  {
    module: 'SystemOps',
    endpoint: 'PATCH /admin/governance/entity-registry/{id}/write-policy',
    name: 'límite: entidad inexistente -> 404',
    method: 'patch',
    path: (c) => `/admin/governance/entity-registry/${UUID_ABSENT}/write-policy`,
    body: (c) => ({ writePolicyId: c.vars.soWritePolicyId }),
    expectedStatus: 404,
  },

  // ===================== UC-11-03: política de retención =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/retention-policies',
    name: 'happy: define política de retención',
    method: 'post',
    path: () => '/admin/governance/retention-policies',
    body: (c) => ({
      code: `SO-RET-${c.u}`,
      name: 'Retención 7 años',
      retentionPeriodDays: 2555,
      legalBasisConceptId: SYSOPS.LEGAL_BASIS_LEGAL_OBLIGATION,
      dispositionConceptId: SYSOPS.DISPOSITION_DELETE,
      jurisdictionConceptId: SYSOPS.JURISDICTION_PE,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soRetentionPolicyId = String(b.id);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'PATCH /admin/governance/entity-registry/{id}/retention',
    name: 'happy: aplica retención a la entidad',
    method: 'patch',
    path: (c) => `/admin/governance/entity-registry/${c.vars.soEntityId}/retention`,
    body: (c) => ({ retentionPolicyId: c.vars.soRetentionPolicyId, reason: 'Cumplimiento normativo' }),
    expectedStatus: 200,
  },
  {
    module: 'SystemOps',
    endpoint: 'PATCH /admin/governance/entity-registry/{id}/retention',
    name: 'límite: falta reason -> 400',
    method: 'patch',
    path: (c) => `/admin/governance/entity-registry/${c.vars.soEntityId}/retention`,
    body: (c) => ({ retentionPolicyId: c.vars.soRetentionPolicyId }),
    expectedStatus: 400,
  },

  // ===================== UC-11-04: regla de anonimización =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/anonymization-rules',
    name: 'happy: define regla de anonimización',
    method: 'post',
    path: () => '/admin/governance/anonymization-rules',
    body: (c) => ({
      code: `SO-ANON-${c.u}`,
      techniqueConceptId: SYSOPS.TECHNIQUE_HASH,
      parametersJson: { algo: 'sha256' },
      description: 'Hash de identificadores',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soAnonRuleId = String(b.id);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'PATCH /admin/governance/field-registry/{id}',
    name: 'happy: asigna regla al campo',
    method: 'patch',
    path: (c) => `/admin/governance/field-registry/${c.vars.soFieldId}`,
    body: (c) => ({ anonymizationRuleId: c.vars.soAnonRuleId, maskingStrategyConceptId: SYSOPS.MASK_FULL, isPii: true }),
    expectedStatus: 200,
  },
  {
    module: 'SystemOps',
    endpoint: 'PATCH /admin/governance/field-registry/{id}',
    name: 'límite: campo inexistente -> 404',
    method: 'patch',
    path: () => `/admin/governance/field-registry/${UUID_ABSENT}`,
    body: () => ({ isPii: false }),
    expectedStatus: 404,
  },

  // ===================== UC-11-08: legal hold (antes del barrido) =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/legal-holds',
    name: 'happy: coloca legal hold sobre la entidad',
    method: 'post',
    path: () => '/admin/governance/legal-holds',
    body: (c) => ({
      tenantId: c.tenantId,
      targetTypeConceptId: SYSOPS.HOLD_TARGET_TABLE,
      targetId: c.vars.soEntityId,
      reasonConceptId: SYSOPS.HOLD_REASON_LITIGATION,
      authorityReference: 'CASE-2026-001',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soHoldId = String(b.id);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/legal-holds',
    name: 'límite: hold ACTIVE duplicado -> 409',
    method: 'post',
    path: () => '/admin/governance/legal-holds',
    body: (c) => ({
      tenantId: c.tenantId,
      targetTypeConceptId: SYSOPS.HOLD_TARGET_TABLE,
      targetId: c.vars.soEntityId,
      reasonConceptId: SYSOPS.HOLD_REASON_LITIGATION,
    }),
    expectedStatus: 409,
  },

  // ===================== UC-11-05: barrido de retención =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /internal/governance/retention-executions/run',
    name: 'happy: barrido excluido por legal hold activo',
    method: 'post',
    path: () => '/internal/governance/retention-executions/run',
    body: (c) => ({ retentionPolicyId: c.vars.soRetentionPolicyId, entityRegistryId: c.vars.soEntityId }),
    expectedStatus: 200,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /internal/governance/retention-executions/run',
    name: 'límite: política inexistente -> 404',
    method: 'post',
    path: (c) => '/internal/governance/retention-executions/run',
    body: (c) => ({ retentionPolicyId: UUID_ABSENT, entityRegistryId: c.vars.soEntityId }),
    expectedStatus: 404,
  },

  // ===================== UC-11-08: levantar legal hold =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/legal-holds/{id}/release',
    name: 'happy: levanta el legal hold',
    method: 'post',
    path: (c) => `/admin/governance/legal-holds/${c.vars.soHoldId}/release`,
    body: () => ({ reason: 'Fin del litigio' }),
    expectedStatus: 200,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/legal-holds/{id}/release',
    name: 'límite: hold inexistente -> 404',
    method: 'post',
    path: () => `/admin/governance/legal-holds/${UUID_ABSENT}/release`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // ===================== UC-11-06: residencia (solo casos límite) =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/residency-policies',
    name: 'límite: sin auth -> 401 (happy requiere value_set externo)',
    method: 'post',
    path: () => '/admin/governance/residency-policies',
    auth: false,
    body: (c) => ({
      code: `SO-RES-${c.u}`,
      jurisdictionConceptId: SYSOPS.JURISDICTION_PE,
      dataClassificationId: c.vars.soClassificationId,
      allowedStorageRegionValueSetId: UUID_ABSENT,
    }),
    expectedStatus: 401,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/tenant-residency-bindings',
    name: 'límite: sin auth -> 401 (happy requiere residency_policy externa)',
    method: 'post',
    path: () => '/admin/governance/tenant-residency-bindings',
    auth: false,
    body: (c) => ({ tenantId: c.tenantId, residencyPolicyId: UUID_ABSENT, primaryRegionConceptId: SYSOPS.REGION_SA_EAST }),
    expectedStatus: 401,
  },

  // ===================== UC-11-07: transferencia transfronteriza =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/cross-border-transfers',
    name: 'happy: registra transferencia transfronteriza',
    method: 'post',
    path: () => '/admin/governance/cross-border-transfers',
    body: (c) => ({
      tenantId: c.tenantId,
      dataCategoryConceptId: SYSOPS.DATA_CATEGORY_PHI,
      sourceRegionConceptId: SYSOPS.REGION_SA_EAST,
      destinationRegionConceptId: SYSOPS.REGION_EU_WEST,
      transferBasisConceptId: SYSOPS.TRANSFER_BASIS_SCC,
      transferReference: `SO-XFER-${c.u}`,
    }),
    expectedStatus: 201,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/cross-border-transfers',
    name: 'límite: referencia duplicada -> 409',
    method: 'post',
    path: () => '/admin/governance/cross-border-transfers',
    body: (c) => ({
      tenantId: c.tenantId,
      dataCategoryConceptId: SYSOPS.DATA_CATEGORY_PHI,
      sourceRegionConceptId: SYSOPS.REGION_SA_EAST,
      destinationRegionConceptId: SYSOPS.REGION_EU_WEST,
      transferBasisConceptId: SYSOPS.TRANSFER_BASIS_SCC,
      transferReference: `SO-XFER-${c.u}`,
    }),
    expectedStatus: 409,
  },

  // ===================== UC-11-09: política de backup =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/ops/backup-policies',
    name: 'happy: define política de backup',
    method: 'post',
    path: () => '/admin/ops/backup-policies',
    body: (c) => ({
      tenantId: c.tenantId,
      resourceScopeConceptId: SYSOPS.BACKUP_SCOPE_DATABASE,
      backupTypeConceptId: SYSOPS.BACKUP_TYPE_FULL,
      rpoSeconds: 300,
      rtoSeconds: 3600,
      retentionDays: 30,
      immutableCopyRequired: true,
      restoreTestFrequencyDays: 90,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soBackupPolicyId = String(b.id);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/ops/backup-policies',
    name: 'límite: rpo > rto -> 422',
    method: 'post',
    path: () => '/admin/ops/backup-policies',
    body: (c) => ({
      tenantId: c.tenantId,
      resourceScopeConceptId: SYSOPS.BACKUP_SCOPE_DATABASE,
      backupTypeConceptId: SYSOPS.BACKUP_TYPE_FULL,
      rpoSeconds: 7200,
      rtoSeconds: 60,
    }),
    expectedStatus: 422,
  },

  // ===================== UC-11-10: prueba de restauración =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /internal/ops/restore-test-runs',
    name: 'happy: registra prueba de restauración',
    method: 'post',
    path: () => '/internal/ops/restore-test-runs',
    body: (c) => ({
      backupPolicyId: c.vars.soBackupPolicyId,
      backupReference: `bkp-${c.u}`,
      outcomeConceptId: SYSOPS.RESTORE_OUTCOME_PASS,
      measuredRpoSeconds: 120,
      measuredRtoSeconds: 1800,
      integrityCheckPassed: true,
    }),
    expectedStatus: 201,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /internal/ops/restore-test-runs',
    name: 'límite: política inexistente -> 404',
    method: 'post',
    path: () => '/internal/ops/restore-test-runs',
    body: () => ({ backupPolicyId: UUID_ABSENT, outcomeConceptId: SYSOPS.RESTORE_OUTCOME_PASS }),
    expectedStatus: 404,
  },

  // ===================== UC-11-11: framework operativo =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/operational-frameworks',
    name: 'happy: publica framework con controles',
    method: 'post',
    path: () => '/admin/governance/operational-frameworks',
    body: (c) => ({
      code: `SO-FW-${c.u}`,
      name: 'Well-Architected',
      providerConceptId: SYSOPS.FRAMEWORK_PROVIDER_INTERNAL,
      version: '1.0',
      controls: [
        { controlCode: 'SEC', title: 'Security', pillarConceptId: SYSOPS.PILLAR_SECURITY },
        { controlCode: 'SEC-1', title: 'Encryption at rest', parentControlCode: 'SEC', pillarConceptId: SYSOPS.PILLAR_SECURITY },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soFrameworkId = String(b.id);
      c.vars.soControlId = String((b.controlIds as string[])[0]);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/operational-frameworks',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/admin/governance/operational-frameworks',
    auth: false,
    body: (c) => ({ code: `SO-FW-X-${c.u}`, name: 'x', providerConceptId: SYSOPS.FRAMEWORK_PROVIDER_INTERNAL, version: '1', controls: [] }),
    expectedStatus: 401,
  },

  // ===================== UC-11-12: evaluación de workload =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/workload-assessments',
    name: 'happy: inicia evaluación de workload',
    method: 'post',
    path: () => '/admin/governance/workload-assessments',
    body: (c) => ({
      tenantId: c.tenantId,
      operationalFrameworkId: c.vars.soFrameworkId,
      workloadCode: `WL-${c.u}`,
      workloadName: 'Core API',
      assessmentTypeConceptId: SYSOPS.ASSESS_TYPE_SELF,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soAssessmentId = String(b.id);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/workload-assessments',
    name: 'límite: framework inexistente -> 404',
    method: 'post',
    path: (c) => '/admin/governance/workload-assessments',
    body: (c) => ({
      tenantId: c.tenantId,
      operationalFrameworkId: UUID_ABSENT,
      workloadCode: `WL-X-${c.u}`,
      workloadName: 'x',
      assessmentTypeConceptId: SYSOPS.ASSESS_TYPE_SELF,
    }),
    expectedStatus: 404,
  },
  {
    module: 'SystemOps',
    endpoint: 'PUT /admin/governance/workload-assessments/{id}/control-results',
    name: 'happy: registra resultados de control',
    method: 'put',
    path: (c) => `/admin/governance/workload-assessments/${c.vars.soAssessmentId}/control-results`,
    body: (c) => ({
      results: [
        {
          operationalFrameworkControlId: c.vars.soControlId,
          resultConceptId: SYSOPS.RESULT_PARTIAL,
          maturityLevelConceptId: SYSOPS.MATURITY_MANAGED,
          evidenceSummary: 'Parcialmente implementado',
        },
      ],
    }),
    expectedStatus: 200,
  },
  {
    module: 'SystemOps',
    endpoint: 'PUT /admin/governance/workload-assessments/{id}/control-results',
    name: 'límite: evaluación inexistente -> 404',
    method: 'put',
    path: (c) => `/admin/governance/workload-assessments/${UUID_ABSENT}/control-results`,
    body: (c) => ({ results: [{ operationalFrameworkControlId: c.vars.soControlId, resultConceptId: SYSOPS.RESULT_PASS }] }),
    expectedStatus: 404,
  },

  // ===================== UC-11-13: hallazgo + plan de remediación =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/assessments/{id}/findings',
    name: 'happy: abre hallazgo',
    method: 'post',
    path: (c) => `/admin/governance/assessments/${c.vars.soAssessmentId}/findings`,
    body: (c) => ({
      findingCode: `FND-${c.u}`,
      title: 'Cifrado incompleto',
      severityConceptId: SYSOPS.SEVERITY_HIGH,
      ownerTeam: 'security',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soFindingId = String(b.id);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/assessments/{id}/findings',
    name: 'límite: finding_code duplicado -> 409',
    method: 'post',
    path: (c) => `/admin/governance/assessments/${c.vars.soAssessmentId}/findings`,
    body: (c) => ({ findingCode: `FND-${c.u}`, title: 'dup', severityConceptId: SYSOPS.SEVERITY_LOW }),
    expectedStatus: 409,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/assessments/{id}/remediation-plans',
    name: 'happy: crea plan con acciones',
    method: 'post',
    path: (c) => `/admin/governance/assessments/${c.vars.soAssessmentId}/remediation-plans`,
    body: (c) => ({
      code: `PLAN-${c.u}`,
      name: 'Remediar cifrado',
      assessmentFindingId: c.vars.soFindingId,
      actions: [{ actionCode: 'A1', description: 'Habilitar cifrado at-rest', assignedTeam: 'platform' }],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soPlanId = String(b.id);
      c.vars.soActionId = String((b.actionIds as string[])[0]);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/assessments/{id}/remediation-plans',
    name: 'límite: hallazgo inexistente -> 404',
    method: 'post',
    path: (c) => `/admin/governance/assessments/${c.vars.soAssessmentId}/remediation-plans`,
    body: (c) => ({ code: `PLAN-X-${c.u}`, name: 'x', assessmentFindingId: UUID_ABSENT, actions: [] }),
    expectedStatus: 404,
  },

  // ===================== UC-11-14: verificar acción / cerrar hallazgo =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/remediation-actions/{id}/verify',
    name: 'happy: verifica acción (cierra hallazgo y completa plan)',
    method: 'post',
    path: (c) => `/admin/governance/remediation-actions/${c.vars.soActionId}/verify`,
    body: () => ({ verificationEvidenceJson: { evidence: 'PR #123 merged' } }),
    expectedStatus: 200,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/remediation-actions/{id}/verify',
    name: 'límite: acción inexistente -> 404',
    method: 'post',
    path: () => `/admin/governance/remediation-actions/${UUID_ABSENT}/verify`,
    body: () => ({ verificationEvidenceJson: {} }),
    expectedStatus: 404,
  },
  {
    module: 'SystemOps',
    endpoint: 'PATCH /admin/governance/findings/{id}',
    name: 'happy: actualiza owner del hallazgo',
    method: 'patch',
    path: (c) => `/admin/governance/findings/${c.vars.soFindingId}`,
    body: () => ({ ownerTeam: 'security-ops' }),
    expectedStatus: 200,
  },
  {
    module: 'SystemOps',
    endpoint: 'PATCH /admin/governance/findings/{id}',
    name: 'límite: hallazgo inexistente -> 404',
    method: 'patch',
    path: () => `/admin/governance/findings/${UUID_ABSENT}`,
    body: () => ({ ownerTeam: 'x' }),
    expectedStatus: 404,
  },

  // ===================== UC-11-15: draft genérico =====================
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/drafts',
    name: 'happy: guarda draft',
    method: 'post',
    path: () => '/admin/governance/drafts',
    body: (c) => ({
      schemaName: 'directory',
      tableName: 'tenants',
      draftLabel: `draft-${c.u}`,
      payloadJson: { legalName: 'Draft Co' },
      schemaVersion: 1,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.soDraftId = String(b.id);
    },
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/drafts',
    name: 'límite: falta payloadJson -> 400',
    method: 'post',
    path: () => '/admin/governance/drafts',
    body: (c) => ({ schemaName: 's', tableName: 't', draftLabel: `d-${c.u}` }),
    expectedStatus: 400,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/drafts/{id}/publish',
    name: 'happy: publica draft',
    method: 'post',
    path: (c) => `/admin/governance/drafts/${c.vars.soDraftId}/publish`,
    body: (c) => ({ publishReference: `PUB-${c.u}` }),
    expectedStatus: 200,
  },
  {
    module: 'SystemOps',
    endpoint: 'POST /admin/governance/drafts/{id}/publish',
    name: 'límite: draft inexistente -> 404',
    method: 'post',
    path: () => `/admin/governance/drafts/${UUID_ABSENT}/publish`,
    body: (c) => ({ publishReference: `PUB-X-${c.u}` }),
    expectedStatus: 404,
  },
];
