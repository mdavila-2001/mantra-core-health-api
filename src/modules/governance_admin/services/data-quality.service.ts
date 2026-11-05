import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException, ResourceNotFoundException } from '../../../common';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import {
  DEFAULT_PAGE_SIZE,
  GOV,
  ISSUE_STATUS_CONCEPT,
  MAX_PAGE_SIZE,
  SEVERITY_CONCEPT,
  codeOfConcept,
  type IssueStatus,
  type Severity,
} from '../governance_admin.constants';
import {
  DataQualityRepository,
  type IssueRow,
  type RuleRow,
  type RunRow,
} from '../repositories/data-quality.repository';
import { clampLimit } from '../sql-filter';
import { readKeyset } from '../keyset';
import type {
  IssuesQueryDto,
  RulesQueryDto,
} from '../dto/governance-admin.query.dto';
import type { ResolveIssueDto } from '../dto/resolve-issue.dto';

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  limit: number;
  total: number;
}

export interface QualityIssue {
  id: string;
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  severity: Severity | null;
  status: IssueStatus | null;
  fieldPath: string;
  resourceId: string | null;
  assignedUserId: string | null;
  tenantId: string;
  runId: string;
  createdAt: string;
  resolvedAt: string | null;
  resolutionText: string | null;
}

export interface ResolutionResult {
  issue: QualityIssue;
  /** `true` si la incidencia ya estaba en ese estado: la repetición no hizo nada. */
  alreadyApplied: boolean;
}

export interface QualityRule {
  id: string;
  ruleCode: string;
  name: string;
  severity: Severity | null;
  state: { code: string | null; display: string | null };
  dimension: { code: string | null; display: string | null };
  ruleSet: { id: string; code: string; name: string; version: string };
  openIssues: number;
  totalIssues: number;
  updatedAt: string;
}

export interface QualityRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  result: { code: string | null; display: string | null };
  recordsEvaluated: number | null;
  issuesDetected: number | null;
}

export interface QualityRuleDetail extends QualityRule {
  ruleExpression: string;
  expressionLanguage: string | null;
  remediationGuidance: string | null;
  issuesByStatus: Record<IssueStatus, number> & { other: number };
  recentRuns: QualityRun[];
}

const iso = (d: Date | string | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;
const numOrNull = (v: string | null | undefined): number | null =>
  v === null || v === undefined ? null : Number(v);

/** Calidad de datos: incidencias (con una acción idempotente) y reglas. */
@Injectable()
export class DataQualityService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: DataQualityRepository,
  ) {}

  async listIssues(q: IssuesQueryDto): Promise<Page<QualityIssue>> {
    const limit = clampLimit(q.limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const filters = {
      status: q.status,
      severity: q.severity,
      ruleId: q.ruleId,
      q: q.q,
    };
    const after = readKeyset(q.cursor);
    const [rows, total] = await Promise.all([
      this.repo.listIssues(this.em, filters, limit + 1, after),
      this.repo.countIssues(this.em, filters),
    ]);
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page.map((r) => this.toIssue(r)),
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({ c: last.created_at_key, i: last.id })
          : null,
      limit,
      total,
    };
  }

  async getIssue(id: string): Promise<QualityIssue> {
    const row = await this.repo.findIssue(this.em, id);
    if (!row)
      throw new ResourceNotFoundException('Incidencia no encontrada', { id });
    return this.toIssue(row);
  }

  /**
   * Resuelve o descarta una incidencia abierta. Idempotente: repetir la misma acción devuelve la
   * incidencia tal como quedó y `alreadyApplied: true`; pedir la contraria sobre una ya cerrada
   * es un conflicto (409), no una sobreescritura.
   */
  async resolve(id: string, dto: ResolveIssueDto): Promise<ResolutionResult> {
    const target: IssueStatus =
      dto.action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED';
    const targetConcept =
      target === 'RESOLVED' ? GOV.ISSUE_RESOLVED : GOV.ISSUE_DISMISSED;
    return this.em.transactional(async (tx) => {
      const closed = await this.repo.closeIfOpen(
        tx,
        id,
        targetConcept,
        dto.note,
      );
      const row = await this.repo.findIssue(tx, id);
      if (!row)
        throw new ResourceNotFoundException('Incidencia no encontrada', { id });
      const issue = this.toIssue(row);
      if (closed) return { issue, alreadyApplied: false };
      if (issue.status === target) return { issue, alreadyApplied: true };
      throw new ConflictException(
        'La incidencia ya no está abierta: otra persona la cerró con otro desenlace',
        { id, currentStatus: issue.status },
      );
    });
  }

  async listRules(q: RulesQueryDto): Promise<Page<QualityRule>> {
    const limit = clampLimit(q.limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const filters = { severity: q.severity, dimension: q.dimension, q: q.q };
    const after = readKeyset(q.cursor);
    const [rows, total] = await Promise.all([
      this.repo.listRules(this.em, filters, limit + 1, after),
      this.repo.countRules(this.em, filters),
    ]);
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page.map((r) => this.toRule(r)),
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({ c: last.rule_code, i: last.id })
          : null,
      limit,
      total,
    };
  }

  async getRule(id: string): Promise<QualityRuleDetail> {
    const row = await this.repo.findRule(this.em, id);
    if (!row)
      throw new ResourceNotFoundException('Regla no encontrada', { id });
    const [counts, runs] = await Promise.all([
      this.repo.issueCountsByStatus(this.em, id),
      this.repo.recentRuns(this.em, row.rule_set_id, 10),
    ]);
    const issuesByStatus = { OPEN: 0, RESOLVED: 0, DISMISSED: 0, other: 0 };
    for (const c of counts) {
      const code = codeOfConcept(ISSUE_STATUS_CONCEPT, c.status_concept_id);
      if (code) issuesByStatus[code] += Number(c.n);
      else issuesByStatus.other += Number(c.n);
    }
    return {
      ...this.toRule(row),
      ruleExpression: row.rule_expression ?? '',
      expressionLanguage: row.expression_language_code ?? null,
      remediationGuidance: row.remediation_guidance ?? null,
      issuesByStatus,
      recentRuns: runs.map((r) => this.toRun(r)),
    };
  }

  private toIssue(r: IssueRow): QualityIssue {
    return {
      id: r.id,
      ruleId: r.rule_id,
      ruleCode: r.rule_code,
      ruleName: r.rule_name,
      severity: codeOfConcept(SEVERITY_CONCEPT, r.severity_concept_id),
      status: codeOfConcept(ISSUE_STATUS_CONCEPT, r.status_concept_id),
      fieldPath: r.field_path,
      resourceId: r.canonical_health_resource_id,
      assignedUserId: r.assigned_user_id,
      tenantId: r.tenant_id,
      runId: r.run_id,
      createdAt: iso(r.created_at) as string,
      resolvedAt: iso(r.resolved_at),
      resolutionText: r.resolution_text,
    };
  }

  private toRule(r: RuleRow): QualityRule {
    return {
      id: r.id,
      ruleCode: r.rule_code,
      name: r.name,
      severity: codeOfConcept(SEVERITY_CONCEPT, r.severity_concept_id),
      state: { code: r.state_code, display: r.state_display },
      dimension: { code: r.dimension_code, display: r.dimension_display },
      ruleSet: {
        id: r.rule_set_id,
        code: r.rule_set_code,
        name: r.rule_set_name,
        version: r.rule_set_version,
      },
      openIssues: Number(r.open_issues),
      totalIssues: Number(r.total_issues),
      updatedAt: iso(r.updated_at) as string,
    };
  }

  private toRun(r: RunRow): QualityRun {
    return {
      id: r.id,
      startedAt: iso(r.started_at) as string,
      completedAt: iso(r.completed_at),
      result: { code: r.result_code, display: r.result_display },
      recordsEvaluated: numOrNull(r.records_evaluated),
      issuesDetected: numOrNull(r.issues_detected),
    };
  }
}
