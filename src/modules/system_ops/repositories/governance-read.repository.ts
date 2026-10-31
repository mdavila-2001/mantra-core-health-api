import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/** Fila cruda de una política, ya unificada: lo común más los atributos propios de su tipo. */
export interface PolicyRow {
  id: string;
  type: string;
  code: string;
  name: string | null;
  stateCode: string | null;
  stateDisplay: string | null;
  updatedAt: Date | null;
  /** Columnas propias del tipo, tal cual salen de la consulta. */
  attributes: Record<string, unknown>;
}

/** Un grupo de destinos a los que se aplica una política. */
export interface AppliesToRow {
  kind: 'ENTITY' | 'FIELD' | 'TENANT_BINDING';
  total: number;
  items: string[];
}

/** Fila cruda del inventario de campos con datos sensibles. */
export interface PiiFieldRow {
  schema_name: string;
  table_name: string;
  column_name: string;
  sensitivity: string | null;
  review_status: string | null;
  in_registry: boolean;
  registry_is_pii: boolean | null;
  registry_is_phi: boolean | null;
  registry_classification: string | null;
  registry_masking: string | null;
  registry_anonymization_rule: string | null;
}

/** Cambio de gobierno registrado sobre una política (sin las fotos antes/después). */
export interface PolicyChangeRow {
  id: string;
  action_code: string | null;
  action_display: string | null;
  changed_by_user_id: string;
  reason: string | null;
  recorded_at: Date;
}

/**
 * Niveles de sensibilidad del catálogo de datos que cuentan como dato personal o secreto
 * (`data_catalog.constants` de la API). Es una constante interna, nunca entrada de usuario: por
 * eso puede ir escrita en la consulta sin parámetros.
 */
export const PII_SENSITIVITIES = [
  'PERSONAL',
  'PHI_IDENTIFIER',
  'PHI_SENSITIVE',
  'PHI_SPECIAL',
  'CREDENTIAL',
] as const;

/** Tope de destinos que se listan por grupo en el detalle de una política. */
export const APPLIES_TO_LIMIT = 50;
/** Tope de cambios que se listan en el historial de una política. */
export const HISTORY_LIMIT = 20;

/**
 * Lecturas del gobierno de datos (`system_ops`): políticas y campos con datos personales.
 *
 * SOLO LECTURA. SQL estático: ningún valor del cliente se concatena (los filtros se aplican
 * después, en memoria, sobre el resultado). Las tablas de política son catálogos chicos
 * (decenas de filas), por eso se leen enteras y se pagina por clave en el servicio.
 *
 * Las lecturas cruzan a `terminology` (códigos de los conceptos) y, en el inventario de campos,
 * a `data_catalog` (sensibilidad que clasificó el escaneo): es una vista de sólo lectura sobre
 * la misma base, igual que `data_catalog` ya lee `system_ops.entity_registry`.
 */
@Injectable()
export class GovernanceReadRepository {
  private q<T = unknown>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  /** Todas las políticas de todos los tipos, en filas uniformes. */
  async listPolicies(em: EntityManager): Promise<PolicyRow[]> {
    const [write, retention, anonymization, classification, residency] =
      await Promise.all([
        this.writePolicies(em),
        this.retentionPolicies(em),
        this.anonymizationRules(em),
        this.classifications(em),
        this.residencyPolicies(em),
      ]);
    return [
      ...write,
      ...retention,
      ...anonymization,
      ...classification,
      ...residency,
    ];
  }

  /** Una política por id, buscándola en cada tabla (los uuid no se repiten entre tablas). */
  async findPolicy(em: EntityManager, id: string): Promise<PolicyRow | null> {
    const todas = await this.listPolicies(em);
    return todas.find((p) => p.id === id) ?? null;
  }

  private async writePolicies(em: EntityManager): Promise<PolicyRow[]> {
    const rows = await this.q<Record<string, unknown>[]>(
      em,
      `select p.id, p.code, p.name, p.requires_reason, p.requires_approval, p.max_batch_size, p.dual_control,
              p.updated_at,
              ins.code as insert_mode, ins.display as insert_mode_display,
              upd.code as update_mode, upd.display as update_mode_display,
              del.code as delete_mode, del.display as delete_mode_display,
              st.code as state_code, st.display as state_display
         from system_ops.write_policies p
         left join terminology.catalog_concepts ins on ins.id = p.insert_mode_concept_id
         left join terminology.catalog_concepts upd on upd.id = p.update_mode_concept_id
         left join terminology.catalog_concepts del on del.id = p.delete_mode_concept_id
         left join terminology.catalog_concepts st on st.id = p.state_concept_id`,
    );
    return rows.map((r) =>
      this.row('WRITE', r, {
        insertMode: r['insert_mode_display'] ?? r['insert_mode'],
        updateMode: r['update_mode_display'] ?? r['update_mode'],
        deleteMode: r['delete_mode_display'] ?? r['delete_mode'],
        requiresReason: r['requires_reason'],
        requiresApproval: r['requires_approval'],
        dualControl: r['dual_control'],
        maxBatchSize: r['max_batch_size'],
      }),
    );
  }

  private async retentionPolicies(em: EntityManager): Promise<PolicyRow[]> {
    const rows = await this.q<Record<string, unknown>[]>(
      em,
      `select p.id, p.code, p.name, p.retention_period_days, p.updated_at,
              lb.code as legal_basis, lb.display as legal_basis_display,
              dp.code as disposition, dp.display as disposition_display,
              ju.code as jurisdiction, ju.display as jurisdiction_display,
              st.code as state_code, st.display as state_display
         from system_ops.retention_policies p
         left join terminology.catalog_concepts lb on lb.id = p.legal_basis_concept_id
         left join terminology.catalog_concepts dp on dp.id = p.disposition_concept_id
         left join terminology.catalog_concepts ju on ju.id = p.jurisdiction_concept_id
         left join terminology.catalog_concepts st on st.id = p.state_concept_id`,
    );
    return rows.map((r) =>
      this.row('RETENTION', r, {
        retentionPeriodDays: r['retention_period_days'],
        legalBasis: r['legal_basis_display'] ?? r['legal_basis'],
        disposition: r['disposition_display'] ?? r['disposition'],
        jurisdiction: r['jurisdiction_display'] ?? r['jurisdiction'],
      }),
    );
  }

  private async anonymizationRules(em: EntityManager): Promise<PolicyRow[]> {
    const rows = await this.q<Record<string, unknown>[]>(
      em,
      `select p.id, p.code, p.description, p.parameters_json, p.updated_at,
              te.code as technique, te.display as technique_display
         from system_ops.anonymization_rules p
         left join terminology.catalog_concepts te on te.id = p.technique_concept_id`,
    );
    return rows.map((r) =>
      this.row('ANONYMIZATION', r, {
        technique: r['technique_display'] ?? r['technique'],
        description: r['description'],
      }),
    );
  }

  private async classifications(em: EntityManager): Promise<PolicyRow[]> {
    const rows = await this.q<Record<string, unknown>[]>(
      em,
      `select p.id, p.code, p.name, p.rank, p.is_pii, p.is_phi, p.updated_at,
              st.code as state_code, st.display as state_display
         from system_ops.data_classifications p
         left join terminology.catalog_concepts st on st.id = p.state_concept_id`,
    );
    return rows.map((r) =>
      this.row('CLASSIFICATION', r, {
        rank: r['rank'],
        isPii: r['is_pii'],
        isPhi: r['is_phi'],
      }),
    );
  }

  private async residencyPolicies(em: EntityManager): Promise<PolicyRow[]> {
    const rows = await this.q<Record<string, unknown>[]>(
      em,
      `select p.id, p.code, p.transfer_impact_assessment_required, p.encryption_key_region_locked,
              p.valid_from, p.valid_to, p.updated_at,
              ju.code as jurisdiction, ju.display as jurisdiction_display,
              cl.code as data_classification,
              tb.code as transfer_basis, tb.display as transfer_basis_display,
              st.code as state_code, st.display as state_display
         from system_ops.data_residency_policies p
         left join terminology.catalog_concepts ju on ju.id = p.jurisdiction_concept_id
         left join system_ops.data_classifications cl on cl.id = p.data_classification_id
         left join terminology.catalog_concepts tb on tb.id = p.cross_border_transfer_basis_concept_id
         left join terminology.catalog_concepts st on st.id = p.status_concept_id`,
    );
    return rows.map((r) =>
      this.row('RESIDENCY', r, {
        jurisdiction: r['jurisdiction_display'] ?? r['jurisdiction'],
        dataClassification: r['data_classification'],
        transferBasis: r['transfer_basis_display'] ?? r['transfer_basis'],
        transferImpactAssessmentRequired:
          r['transfer_impact_assessment_required'],
        encryptionKeyRegionLocked: r['encryption_key_region_locked'],
        validFrom: this.iso(r['valid_from']),
        validTo: this.iso(r['valid_to']),
      }),
    );
  }

  private row(
    type: string,
    r: Record<string, unknown>,
    attributes: Record<string, unknown>,
  ): PolicyRow {
    return {
      id: String(r['id']),
      type,
      code: String(r['code']),
      name: typeof r['name'] === 'string' ? r['name'] : null,
      stateCode: (r['state_code'] as string | null | undefined) ?? null,
      stateDisplay: (r['state_display'] as string | null | undefined) ?? null,
      updatedAt: r['updated_at'] ? new Date(r['updated_at'] as string) : null,
      attributes,
    };
  }

  private iso(value: unknown): string | null {
    return value ? new Date(value as string).toISOString() : null;
  }

  /**
   * Configuración extensa de una política que no cabe en la fila de la lista (parámetros de la
   * regla de anonimización, reglas de manejo de la clasificación). `null` si el tipo no la tiene.
   */
  async policyConfiguration(
    em: EntityManager,
    type: string,
    id: string,
  ): Promise<unknown> {
    if (type === 'ANONYMIZATION') {
      const [r] = await this.q<{ parameters_json: unknown }[]>(
        em,
        `select parameters_json from system_ops.anonymization_rules where id = ?`,
        [id],
      );
      return r?.parameters_json ?? null;
    }
    if (type === 'CLASSIFICATION') {
      const [r] = await this.q<{ handling_rules_json: unknown }[]>(
        em,
        `select handling_rules_json from system_ops.data_classifications where id = ?`,
        [id],
      );
      return r?.handling_rules_json ?? null;
    }
    return null;
  }

  /** A qué se aplica una política: entidades, campos o vínculos de residencia. */
  async appliesTo(
    em: EntityManager,
    type: string,
    id: string,
  ): Promise<AppliesToRow[]> {
    switch (type) {
      case 'WRITE':
        return [await this.entities(em, 'write_policy_id', id)];
      case 'RETENTION':
        return [await this.entities(em, 'retention_policy_id', id)];
      case 'ANONYMIZATION':
        return [await this.fields(em, 'anonymization_rule_id', id)];
      case 'CLASSIFICATION':
        return [
          await this.entities(em, 'classification_id', id),
          await this.fields(em, 'classification_id', id),
        ];
      case 'RESIDENCY': {
        const [r] = await this.q<{ total: string }[]>(
          em,
          `select count(*)::text as total from system_ops.tenant_residency_bindings where residency_policy_id = ?`,
          [id],
        );
        return [
          { kind: 'TENANT_BINDING', total: Number(r?.total ?? 0), items: [] },
        ];
      }
      default:
        return [];
    }
  }

  /** `column` sólo toma valores de este archivo: nunca viene del cliente. */
  private async entities(
    em: EntityManager,
    column: 'write_policy_id' | 'retention_policy_id' | 'classification_id',
    id: string,
  ): Promise<AppliesToRow> {
    const [count] = await this.q<{ total: string }[]>(
      em,
      `select count(*)::text as total from system_ops.entity_registry where ${column} = ?`,
      [id],
    );
    const items = await this.q<{ schema_name: string; table_name: string }[]>(
      em,
      `select schema_name, table_name from system_ops.entity_registry where ${column} = ?
        order by schema_name, table_name limit ${APPLIES_TO_LIMIT}`,
      [id],
    );
    return {
      kind: 'ENTITY',
      total: Number(count?.total ?? 0),
      items: items.map((i) => `${i.schema_name}.${i.table_name}`),
    };
  }

  private async fields(
    em: EntityManager,
    column: 'anonymization_rule_id' | 'classification_id',
    id: string,
  ): Promise<AppliesToRow> {
    const [count] = await this.q<{ total: string }[]>(
      em,
      `select count(*)::text as total from system_ops.field_registry where ${column} = ?`,
      [id],
    );
    const items = await this.q<
      { schema_name: string; table_name: string; column_name: string }[]
    >(
      em,
      `select e.schema_name, e.table_name, f.column_name
         from system_ops.field_registry f
         join system_ops.entity_registry e on e.id = f.entity_registry_id
        where f.${column} = ?
        order by e.schema_name, e.table_name, f.column_name limit ${APPLIES_TO_LIMIT}`,
      [id],
    );
    return {
      kind: 'FIELD',
      total: Number(count?.total ?? 0),
      items: items.map(
        (i) => `${i.schema_name}.${i.table_name}.${i.column_name}`,
      ),
    };
  }

  /** Últimos cambios de gobierno sobre una política, del más reciente al más antiguo. */
  history(em: EntityManager, id: string): Promise<PolicyChangeRow[]> {
    return this.q<PolicyChangeRow[]>(
      em,
      `select l.id, a.code as action_code, a.display as action_display, l.changed_by_user_id, l.reason, l.recorded_at
         from system_ops.governance_change_log l
         left join terminology.catalog_concepts a on a.id = l.action_concept_id
        where l.target_id = ?
        order by l.recorded_at desc, l.id desc
        limit ${HISTORY_LIMIT}`,
      [id],
    );
  }

  /**
   * Campos con datos personales o secretos: los que el escaneo del catálogo clasificó con un nivel
   * de `PII_SENSITIVITIES` y los que el registro de gobierno marca como personales o de salud.
   * Una fila puede venir de una fuente, de la otra o de las dos.
   */
  piiFields(em: EntityManager): Promise<PiiFieldRow[]> {
    const niveles = PII_SENSITIVITIES.map((n) => `'${n}'`).join(', ');
    return this.q<PiiFieldRow[]>(
      em,
      `with cat as (
         select o.schema_name, o.object_name as table_name, c.column_name, a.sensitivity, a.review_status
           from data_catalog.catalog_columns c
           join data_catalog.catalog_objects o on o.id = c.object_id
           join data_catalog.catalog_annotations a on a.column_id = c.id and a.target_kind = 'COLUMN'
          where c.observation_status = 'OBSERVED' and o.observation_status = 'OBSERVED'
            and a.sensitivity in (${niveles})
       ), reg as (
         select e.schema_name, e.table_name, f.column_name, f.is_pii, f.is_phi,
                k.code as classification, m.code as masking, r.code as anonymization_rule
           from system_ops.field_registry f
           join system_ops.entity_registry e on e.id = f.entity_registry_id
           left join system_ops.data_classifications k on k.id = f.classification_id
           left join terminology.catalog_concepts m on m.id = f.masking_strategy_concept_id
           left join system_ops.anonymization_rules r on r.id = f.anonymization_rule_id
          where coalesce(f.is_pii, false) or coalesce(f.is_phi, false)
       )
       select coalesce(cat.schema_name, reg.schema_name) as schema_name,
              coalesce(cat.table_name, reg.table_name) as table_name,
              coalesce(cat.column_name, reg.column_name) as column_name,
              cat.sensitivity, cat.review_status,
              (reg.column_name is not null) as in_registry,
              reg.is_pii as registry_is_pii, reg.is_phi as registry_is_phi,
              reg.classification as registry_classification, reg.masking as registry_masking,
              reg.anonymization_rule as registry_anonymization_rule
         from cat
         full outer join reg
           on reg.schema_name = cat.schema_name and reg.table_name = cat.table_name and reg.column_name = cat.column_name
        order by 1, 2, 3`,
    );
  }

  /** Cuántas fuentes hay detrás del inventario, para que una lista vacía diga por qué lo está. */
  async piiSources(
    em: EntityManager,
  ): Promise<{ catalogColumns: number; registryFields: number }> {
    const [cat] = await this.q<{ total: string }[]>(
      em,
      `select count(*)::text as total from data_catalog.catalog_columns where observation_status = 'OBSERVED'`,
    );
    const [reg] = await this.q<{ total: string }[]>(
      em,
      `select count(*)::text as total from system_ops.field_registry`,
    );
    return {
      catalogColumns: Number(cat?.total ?? 0),
      registryFields: Number(reg?.total ?? 0),
    };
  }
}
