import { MetadataStorage } from '@mikro-orm/core';
import { Permissions } from '../../authz/entities';
import * as entities from './index';
import {
  AccessAnomalies,
  AccessDecisionLog,
  AccessReviewCampaigns,
  AccessReviewItems,
  FourEyesRequests,
  GovernanceRules,
  GrantUsageStats,
  HandoverItems,
  LifecycleCases,
  OrganizationUserAssignments,
  PatientRestrictionFlags,
  RoleTemplates,
  SodExceptions,
  SodRules,
  SupportGrantActions,
  SupportScopeGrants,
} from './index';

/**
 * Las 12 tablas nuevas y las 5 ampliadas del gobierno de accesos (v4.2.72) deben
 * mapearse 1:1 con CONTRATO-GOBIERNO §7.2/§7.3. La notación de cada columna es
 * la del contrato: `nombre` = NOT NULL; `nombre?` = nulable; `nombre=` = NOT NULL
 * con DEFAULT en la base (la entidad lo declara en `default`).
 */

/** Auditoría estándar de las tablas del módulo (todas salvo las WORM y la derivada de uso). */
const STD = [
  'created_at',
  'updated_at',
  'created_by_user_id?',
  'updated_by_user_id?',
  'row_version',
] as const;

interface TableContract {
  readonly entity: new () => unknown;
  readonly schema: string;
  readonly table: string;
  readonly columns: readonly string[];
  /** Si es `true` la entidad solo puede ampliar estas columnas (tablas existentes). */
  readonly additions?: boolean;
}

const NEW_TABLES: readonly TableContract[] = [
  {
    entity: GovernanceRules,
    schema: 'delegated_access',
    table: 'governance_rules',
    columns: [
      'id',
      'tenant_id',
      'rule_kind_concept_id',
      'role_template_code?',
      'permission_pattern',
      'rule_json?',
      'rule_schema_version?',
      'message_text?',
      'status_concept_id',
      'valid_from?',
      'valid_to?',
      ...STD,
    ],
  },
  {
    entity: SodRules,
    schema: 'delegated_access',
    table: 'sod_rules',
    columns: [
      'id',
      'tenant_id?',
      'code',
      'name',
      'base_rule_id?',
      'atoms_a_json',
      'atoms_b_json',
      'scope_concept_id',
      'action_concept_id',
      'is_hard=',
      'max_exception_days?',
      'rationale_text?',
      'status_concept_id',
      'version_number',
      ...STD,
    ],
  },
  {
    entity: SodExceptions,
    schema: 'delegated_access',
    table: 'sod_exceptions',
    columns: [
      'id',
      'tenant_id',
      'sod_rule_id',
      'organization_user_assignment_id',
      'four_eyes_request_id',
      'justification_text',
      'valid_from',
      'valid_to',
      'status_concept_id',
      'revoked_at?',
      'revoked_by_user_id?',
      'revoke_reason_text?',
      ...STD,
    ],
  },
  {
    entity: FourEyesRequests,
    schema: 'delegated_access',
    table: 'four_eyes_requests',
    columns: [
      'id',
      'tenant_id',
      'kind_concept_id',
      'requester_user_id',
      'subject_user_id?',
      'organization_user_assignment_id?',
      'permission_code?',
      'approver_kind_concept_id',
      'payload_json',
      'payload_hash',
      'payload_schema_version',
      'reason_text?',
      'status_concept_id',
      'expires_at',
      'decided_at?',
      'decided_by_user_id?',
      'decision_comment_text?',
      'approved_until?',
      'consumed_at?',
      'executed_at?',
      'execution_result_json?',
      ...STD,
    ],
  },
  {
    entity: AccessReviewCampaigns,
    schema: 'delegated_access',
    table: 'access_review_campaigns',
    columns: [
      'id',
      'tenant_id',
      'name',
      'kind_concept_id',
      'scope_json',
      'scope_schema_version',
      'filters_json?',
      'due_at',
      'grace_days=',
      'reminder_days_before_json=',
      'escalate_after_days=',
      'uncertified_action_concept_id',
      'owner_user_id?',
      'status_concept_id',
      'launched_at?',
      'closed_at?',
      'cancelled_at?',
      ...STD,
    ],
  },
  {
    entity: AccessReviewItems,
    schema: 'delegated_access',
    table: 'access_review_items',
    columns: [
      'id',
      'tenant_id',
      'access_review_campaign_id',
      'organization_user_assignment_id',
      'support_scope_grant_id?',
      'reviewer_user_id?',
      'reviewer_kind_concept_id',
      'decision_concept_id=',
      'decided_at?',
      'decided_by_user_id?',
      'decision_comment_text?',
      'adjustment_json?',
      'evidence_json',
      'evidence_hash',
      'due_at',
      'reminder_count=',
      'last_reminded_at?',
      'escalated_at?',
      'escalated_to_user_id?',
      ...STD,
    ],
  },
  {
    entity: LifecycleCases,
    schema: 'delegated_access',
    table: 'lifecycle_cases',
    columns: [
      'id',
      'tenant_id',
      'organization_user_assignment_id',
      'subject_user_id',
      'kind_concept_id',
      'status_concept_id',
      'opened_by_user_id?',
      'opened_at',
      'due_at?',
      'completed_at?',
      'reason_text?',
      'checklist_json',
      'details_json?',
      ...STD,
    ],
  },
  {
    entity: HandoverItems,
    schema: 'delegated_access',
    table: 'handover_items',
    columns: [
      'id',
      'tenant_id',
      'lifecycle_case_id',
      'item_kind_concept_id',
      'source_id',
      'from_user_id',
      'to_user_id?',
      'status_concept_id',
      'summary_text?',
      'reassigned_at?',
      'reassigned_by_user_id?',
      'note_text?',
      ...STD,
    ],
  },
  {
    entity: PatientRestrictionFlags,
    schema: 'delegated_access',
    table: 'patient_restriction_flags',
    columns: [
      'id',
      'tenant_id',
      'patient_profile_id',
      'flag_concept_id',
      'reason_text',
      'status_concept_id',
      'valid_from',
      'valid_to?',
      ...STD,
    ],
  },
  {
    // WORM: sin updated_at ni row_version.
    entity: AccessDecisionLog,
    schema: 'delegated_access',
    table: 'access_decision_log',
    columns: [
      'id',
      'tenant_id',
      'user_id',
      'permission_code',
      'effect_concept_id',
      'reason_code',
      'grant_id?',
      'rule_id?',
      'practitioner_role_assignment_id?',
      'healthcare_service_id?',
      'care_space_id?',
      'patient_profile_id?',
      'approval_id?',
      'correlation_id?',
      'session_id?',
      'ip?',
      'detail_json?',
      'recorded_at',
      'recorded_by_user_id?',
    ],
  },
  {
    // Derivada de uso: solo updated_at.
    entity: GrantUsageStats,
    schema: 'delegated_access',
    table: 'grant_usage_stats',
    columns: [
      'id',
      'tenant_id',
      'user_id',
      'support_scope_grant_id',
      'permission_code',
      'bucket_start',
      'permit_count=',
      'deny_count=',
      'challenge_count=',
      'off_hours_count=',
      'distinct_patients_in_bucket=',
      'last_used_at?',
      'updated_at',
    ],
  },
  {
    entity: AccessAnomalies,
    schema: 'delegated_access',
    table: 'access_anomalies',
    columns: [
      'id',
      'tenant_id',
      'user_id',
      'organization_user_assignment_id?',
      'kind_concept_id',
      'window_start',
      'window_end',
      'observed_value',
      'baseline_value?',
      'threshold_value',
      'evidence_json',
      'status_concept_id',
      'acknowledged_by_user_id?',
      'acknowledged_at?',
      'resolution_comment_text?',
      ...STD,
    ],
  },
];

const ALTERED_TABLES: readonly TableContract[] = [
  {
    entity: SupportScopeGrants,
    schema: 'delegated_access',
    table: 'support_scope_grants',
    additions: true,
    columns: [
      'effect_concept_id=',
      'condition_json?',
      'condition_schema_version?',
      'reason_text?',
      'source_role_template_id?',
    ],
  },
  {
    entity: SupportGrantActions,
    schema: 'delegated_access',
    table: 'support_grant_actions',
    additions: true,
    columns: [
      'condition_json?',
      'condition_schema_version?',
      'superseded_at?',
      'updated_at?',
      'updated_by_user_id?',
    ],
  },
  {
    entity: RoleTemplates,
    schema: 'delegated_access',
    table: 'role_templates',
    additions: true,
    columns: ['default_conditions_json?', 'ceiling_actions_json?'],
  },
  {
    entity: OrganizationUserAssignments,
    schema: 'delegated_access',
    table: 'organization_user_assignments',
    additions: true,
    columns: [
      'identity_verified_at?',
      'identity_verified_by_user_id?',
      'identity_method_concept_id?',
      'suspended_at?',
      'suspension_reason_concept_id?',
      'suspension_note_text?',
      'onboarding_completed_at?',
      'last_certified_at?',
      'last_active_at?',
    ],
  },
  {
    entity: Permissions,
    schema: 'authz',
    table: 'permissions',
    additions: true,
    columns: [
      'sensitivity_concept_id?',
      'requires_reason=',
      'requires_step_up=',
      'approval_mode_concept_id?',
      'purpose_of_use_concept_id?',
      'legal_basis_concept_id?',
      'touches_clinical_data=',
      'support_assignable=',
    ],
  },
];

interface Prop {
  readonly fieldName: string;
  readonly nullable?: boolean;
  readonly type?: string;
  readonly columnType?: string;
  readonly default?: unknown;
  readonly version?: boolean;
  readonly kind?: string;
}

interface Meta {
  readonly tableName: string;
  readonly schema?: string;
  readonly properties: Record<string, Prop>;
}

/** Metadata que los decoradores dejaron registrada para la clase. */
function metaOf(cls: { name: string }): Meta {
  const all = MetadataStorage.getMetadata() as unknown as Record<string, Meta>;
  const key = Object.keys(all).find((k) => k.startsWith(`${cls.name}-`));
  if (!key) throw new Error(`Sin metadata para ${cls.name}`);
  return all[key];
}

/** Las propiedades persistidas por nombre de columna. */
function byColumn(meta: Meta): Map<string, Prop> {
  // La llave primaria declara solo el nombre de la propiedad (`id`), sin `fieldName`.
  return new Map(
    Object.entries(meta.properties).map(([name, p]) => [
      p.fieldName ?? name,
      p,
    ]),
  );
}

function parse(spec: string): {
  name: string;
  nullable: boolean;
  dflt: boolean;
} {
  const nullable = spec.endsWith('?');
  const dflt = spec.endsWith('=');
  return {
    name: spec.replace(/[?=]$/, ''),
    nullable,
    dflt,
  };
}

describe('gobierno de accesos: entidades nuevas (12)', () => {
  it('son exactamente 12 y las exporta entities/index.ts', () => {
    expect(NEW_TABLES).toHaveLength(12);
    const exported = new Set<unknown>(Object.values(entities));
    for (const t of NEW_TABLES) expect(exported.has(t.entity)).toBe(true);
  });

  describe.each(NEW_TABLES)('$schema.$table', (t) => {
    const meta = metaOf(t.entity as { name: string });
    const cols = byColumn(meta);

    it('mapea la tabla del contrato', () => {
      expect(meta.schema).toBe(t.schema);
      expect(meta.tableName).toBe(t.table);
    });

    it('declara exactamente las columnas del contrato, ni más ni menos', () => {
      const esperadas = t.columns.map((c) => parse(c).name).sort();
      expect([...cols.keys()].sort()).toEqual(esperadas);
    });

    it('respeta la obligatoriedad y los DEFAULT del contrato', () => {
      for (const spec of t.columns) {
        const { name, nullable, dflt } = parse(spec);
        const prop = cols.get(name) as Prop;
        expect({ name, nullable: prop.nullable === true }).toEqual({
          name,
          nullable,
        });
        if (dflt)
          expect({ name, tieneDefault: prop.default !== undefined }).toEqual({
            name,
            tieneDefault: true,
          });
      }
    });

    it('usa uuid escalar en id y en toda columna *_id (sin relaciones)', () => {
      for (const [name, prop] of cols) {
        expect(prop.kind).toBe('scalar');
        if (name === 'id' || /_id$/.test(name)) {
          expect({ name, type: prop.type }).toEqual({ name, type: 'uuid' });
        }
      }
    });

    it('tenant_id es la segunda columna', () => {
      expect(Object.values(meta.properties)[1].fieldName).toBe('tenant_id');
    });

    it('controla la concurrencia con row_version solo si la tabla lo lleva', () => {
      const tieneVersion = t.columns.includes('row_version');
      const prop = cols.get('row_version');
      if (tieneVersion) {
        expect(prop?.version).toBe(true);
      } else {
        expect(prop).toBeUndefined();
      }
    });
  });

  it('solo sod_rules admite tenant_id nulo (NULL = plataforma)', () => {
    for (const t of NEW_TABLES) {
      const prop = byColumn(metaOf(t.entity as { name: string })).get(
        'tenant_id',
      );
      expect({ tabla: t.table, nulo: prop?.nullable === true }).toEqual({
        tabla: t.table,
        nulo: t.table === 'sod_rules',
      });
    }
  });

  it('access_decision_log (WORM) y grant_usage_stats no llevan row_version ni created_at', () => {
    for (const cls of [AccessDecisionLog, GrantUsageStats]) {
      const cols = byColumn(metaOf(cls));
      expect(cols.has('row_version')).toBe(false);
      expect(cols.has('created_at')).toBe(false);
    }
  });

  it('los literales de DEFAULT son los ids del Anexo B', () => {
    const d = (cls: { name: string }, col: string): unknown =>
      byColumn(metaOf(cls)).get(col)?.default;
    // REVIEW_ITEM_PENDING
    expect(d(AccessReviewItems, 'decision_concept_id')).toBe(
      '55a6db07-19e7-5bb4-978a-3d246492f49d',
    );
    expect(d(AccessReviewCampaigns, 'grace_days')).toBe(7);
    expect(d(AccessReviewCampaigns, 'escalate_after_days')).toBe(3);
    expect(d(AccessReviewCampaigns, 'reminder_days_before_json')).toBe(
      '[7,3,1]',
    );
    expect(d(AccessReviewItems, 'reminder_count')).toBe(0);
    expect(d(SodRules, 'is_hard')).toBe(false);
  });
});

describe('gobierno de accesos: entidades ampliadas (5)', () => {
  describe.each(ALTERED_TABLES)('$schema.$table', (t) => {
    const meta = metaOf(t.entity as { name: string });
    const cols = byColumn(meta);

    it('conserva la tabla', () => {
      expect(meta.schema).toBe(t.schema);
      expect(meta.tableName).toBe(t.table);
    });

    it('agrega las columnas del contrato con su obligatoriedad', () => {
      for (const spec of t.columns) {
        const { name, nullable, dflt } = parse(spec);
        const prop = cols.get(name);
        expect({ name, existe: prop !== undefined }).toEqual({
          name,
          existe: true,
        });
        expect({ name, nulo: prop?.nullable === true }).toEqual({
          name,
          nulo: nullable,
        });
        if (dflt)
          expect({ name, tieneDefault: prop?.default !== undefined }).toEqual({
            name,
            tieneDefault: true,
          });
      }
    });
  });

  it('effect_concept_id nace en ALLOW (authz:EFFECT_ALLOW) como en la base', () => {
    expect(
      byColumn(metaOf(SupportScopeGrants)).get('effect_concept_id')?.default,
    ).toBe('6905e0db-1650-5d49-adca-8b2688ac049c');
  });

  it('las columnas booleanas nuevas de authz.permissions nacen en false', () => {
    const cols = byColumn(metaOf(Permissions));
    for (const c of [
      'requires_reason',
      'requires_step_up',
      'touches_clinical_data',
      'support_assignable',
    ]) {
      expect({ c, d: cols.get(c)?.default }).toEqual({ c, d: false });
    }
  });
});
