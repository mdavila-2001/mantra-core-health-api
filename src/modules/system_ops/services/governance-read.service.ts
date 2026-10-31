import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import {
  coincide,
  compararClaves,
  paginar,
} from '../../data_catalog/application/paginacion';
import {
  GOVERNANCE_DEFAULT_PAGE_SIZE,
  GOVERNANCE_POLICY_TYPES,
  type GovernanceAppliesToDto,
  type GovernancePiiFieldDto,
  type GovernancePiiPageDto,
  type GovernancePiiSummaryDto,
  type GovernancePolicyDetailDto,
  type GovernancePolicyPageDto,
  type GovernancePolicySummaryDto,
  type GovernancePolicyType,
  type ListGovernancePiiFieldsQueryDto,
  type ListGovernancePoliciesQueryDto,
} from '../dto/governance-read.dto';
import {
  APPLIES_TO_LIMIT,
  GovernanceReadRepository,
  type PiiFieldRow,
  type PolicyRow,
} from '../repositories/governance-read.repository';

type Scalar = string | number | boolean | null;

/** Sólo escalares viajan en `attributes`: un objeto anidado no tendría rótulo en la lista. */
function scalars(attributes: Record<string, unknown>): Record<string, Scalar> {
  const out: Record<string, Scalar> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) out[key] = null;
    else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    )
      out[key] = value;
  }
  return out;
}

function toSummary(row: PolicyRow): GovernancePolicySummaryDto {
  return {
    id: row.id,
    type: row.type as GovernancePolicyType,
    code: row.code,
    name: row.name,
    stateCode: row.stateCode,
    stateLabel: row.stateDisplay,
    attributes: scalars(row.attributes),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

const SECRET_KEY =
  /salt|secret|pepper|password|passphrase|token|credential|api[_-]?key|private|(^|[_-])key($|[_-])/i;
/** `hmacKey`, `signingKey`: la «K» mayúscula marca el final de la palabra (sin confundir «monkey»). */
const CAMEL_KEY = /[a-z0-9]Key$/;
/** Lo que se muestra en lugar de un valor que parece secreto. */
export const REDACTED = '[oculto]';

/**
 * Copia la configuración de una regla ocultando todo valor cuya clave parezca un secreto
 * (sal, pimienta, clave, token…). La configuración de una regla de anonimización puede llevar el
 * material con el que se enmascara, y quien lee el portal no tiene por qué verlo.
 */
export function redactConfiguration(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value))
    return value.map((v) => redactConfiguration(v, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      (SECRET_KEY.test(k) || CAMEL_KEY.test(k)) && v !== null && v !== undefined
        ? REDACTED
        : redactConfiguration(v, depth + 1),
    ]),
  );
}

/** Clave de orden y de cursor: tipo, código e id (el id desempata códigos repetidos). */
const policyKey = (p: PolicyRow): string => `${p.type}|${p.code}|${p.id}`;

function piiSource(row: PiiFieldRow): GovernancePiiFieldDto['source'] {
  if (row.sensitivity && row.in_registry) return 'BOTH';
  return row.sensitivity ? 'CATALOG' : 'REGISTRY';
}

function toPiiField(row: PiiFieldRow): GovernancePiiFieldDto {
  return {
    schemaName: row.schema_name,
    tableName: row.table_name,
    columnName: row.column_name,
    sensitivity: row.sensitivity,
    reviewStatus: row.review_status,
    source: piiSource(row),
    registry: row.in_registry
      ? {
          isPii: row.registry_is_pii,
          isPhi: row.registry_is_phi,
          classification: row.registry_classification,
          maskingStrategy: row.registry_masking,
          anonymizationRule: row.registry_anonymization_rule,
        }
      : null,
  };
}

const piiKey = (f: GovernancePiiFieldDto): string =>
  `${f.schemaName}|${f.tableName}|${f.columnName}`;

/** Un campo está sin protección declarada si el registro no le asigna enmascarado ni anonimización. */
const isUnprotected = (f: GovernancePiiFieldDto): boolean =>
  !f.registry || (!f.registry.maskingStrategy && !f.registry.anonymizationRule);

/**
 * Lecturas del gobierno de datos para el portal administrativo: políticas (escritura,
 * retención, anonimización, clasificación y residencia) y el inventario de campos con datos
 * personales. Sólo lee; la escritura sigue en {@link GovernanceCatalogService} y compañía.
 */
@Injectable()
export class GovernanceReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: GovernanceReadRepository,
  ) {}

  private db(): EntityManager {
    return this.em.fork();
  }

  async listPolicies(
    query: ListGovernancePoliciesQueryDto,
  ): Promise<GovernancePolicyPageDto> {
    const all = await this.repo.listPolicies(this.db());
    const searched = all.filter((p) => coincide(query.q, p.code, p.name));
    const filtered = searched
      .filter((p) => !query.type || p.type === query.type)
      .sort((a, b) => compararClaves(policyKey(a), policyKey(b)));
    const page = paginar(filtered, policyKey, {
      cursor: query.cursor,
      limit: query.limit ?? GOVERNANCE_DEFAULT_PAGE_SIZE,
    });
    return {
      items: page.items.map(toSummary),
      nextCursor: page.nextCursor,
      limit: page.limit,
      total: page.total,
      // Los conteos ignoran el filtro de tipo a propósito: sirven para ver qué hay en cada tipo.
      byType: GOVERNANCE_POLICY_TYPES.map((type) => ({
        type,
        total: searched.filter((p) => p.type === type).length,
      })),
    };
  }

  async getPolicy(id: string): Promise<GovernancePolicyDetailDto> {
    const em = this.db();
    const row = await this.repo.findPolicy(em, id);
    if (!row) {
      throw new ResourceNotFoundException('Política no encontrada', {
        policyId: id,
      });
    }
    const [configuration, appliesTo, history] = await Promise.all([
      this.repo.policyConfiguration(em, row.type, row.id),
      this.repo.appliesTo(em, row.type, row.id),
      this.repo.history(em, row.id),
    ]);
    return {
      ...toSummary(row),
      configuration: redactConfiguration(configuration),
      appliesTo: appliesTo.map((g): GovernanceAppliesToDto => ({
        kind: g.kind,
        total: g.total,
        items: g.items,
        truncated: g.total > Math.min(g.items.length, APPLIES_TO_LIMIT),
      })),
      history: history.map((h) => ({
        id: h.id,
        action: h.action_display ?? h.action_code,
        changedByUserId: h.changed_by_user_id,
        reason: h.reason,
        recordedAt: new Date(h.recorded_at).toISOString(),
      })),
    };
  }

  async listPiiFields(
    query: ListGovernancePiiFieldsQueryDto,
  ): Promise<GovernancePiiPageDto> {
    const em = this.db();
    const [rows, sources] = await Promise.all([
      this.repo.piiFields(em),
      this.repo.piiSources(em),
    ]);
    const filtered = rows
      .map(toPiiField)
      .filter(
        (f) =>
          (!query.schema || f.schemaName === query.schema) &&
          (!query.sensitivity || f.sensitivity === query.sensitivity) &&
          (!query.source || f.source === query.source) &&
          coincide(query.q, f.schemaName, f.tableName, f.columnName),
      )
      .sort((a, b) => compararClaves(piiKey(a), piiKey(b)));
    const page = paginar(filtered, piiKey, {
      cursor: query.cursor,
      limit: query.limit ?? GOVERNANCE_DEFAULT_PAGE_SIZE,
    });
    return {
      items: page.items,
      nextCursor: page.nextCursor,
      limit: page.limit,
      total: page.total,
      summary: this.piiSummary(filtered),
      sources,
    };
  }

  private piiSummary(fields: GovernancePiiFieldDto[]): GovernancePiiSummaryDto {
    const bySensitivity: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    for (const f of fields) {
      const level = f.sensitivity ?? 'SIN_NIVEL_EN_CATALOGO';
      bySensitivity[level] = (bySensitivity[level] ?? 0) + 1;
      bySource[f.source] = (bySource[f.source] ?? 0) + 1;
    }
    return {
      fields: fields.length,
      tables: new Set(fields.map((f) => `${f.schemaName}.${f.tableName}`)).size,
      approved: fields.filter((f) => f.reviewStatus === 'APPROVED').length,
      withoutProtection: fields.filter(isUnprotected).length,
      bySensitivity,
      bySource,
    };
  }
}
