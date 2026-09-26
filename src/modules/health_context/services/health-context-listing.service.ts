import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  DEFAULT_KEYSET_PAGE_SIZE,
  afterIdOf,
  toKeysetPage,
} from '../../../common';
import type {
  ListContextAgentsResponseDto,
  ListContextCollectionRunsResponseDto,
  ListContextSchedulesResponseDto,
  ListCountryHealthContextVersionsResponseDto,
  ListCountryHealthContextsResponseDto,
  ListHealthContextSourcesResponseDto,
} from '../dto/listings.dto';

type Row = Record<string, unknown>;
interface PageOptions {
  cursor?: string;
  limit?: number;
}

const optional = <T>(value: unknown): T | undefined =>
  (value as T | null) ?? undefined;

/**
 * CV-13 (BR-28): lecturas del hub `health-context`, que sólo tenía
 * `contexts/resolve`. Fuentes, programaciones, contextos, versiones y corridas
 * son catálogo de plataforma (no tienen `tenant_id`): se leen con los mismos
 * roles que las crean. Los agentes sí pueden ser de un tenant
 * (`owner_tenant_id`): se listan los de plataforma y los del tenant del actor,
 * nunca los de otro. Las versiones se devuelven **sin** `context_payload_json`.
 */
@Injectable()
export class HealthContextListingService {
  constructor(private readonly em: EntityManager) {}

  /** Fuentes de contexto. */
  async listSources(
    options: PageOptions,
  ): Promise<ListHealthContextSourcesResponseDto> {
    const { limit, afterId } = this.page(options);
    const rows = await this.fetch(
      `select id, code, name, source_type_concept_id, owner_name, canonical_url,
              country_concept_id, trust_tier_concept_id, status_concept_id
         from health_context.health_context_sources
        where (?::uuid is null or id > ?::uuid)
        order by id limit ?`,
      [afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        code: r.code as string,
        name: r.name as string,
        sourceTypeConceptId: r.source_type_concept_id as string,
        ownerName: optional<string>(r.owner_name),
        canonicalUrl: optional<string>(r.canonical_url),
        countryConceptId: optional<string>(r.country_concept_id),
        trustTierConceptId: optional<string>(r.trust_tier_concept_id),
        statusConceptId: r.status_concept_id as string,
      })),
      limit,
    );
  }

  /** Agentes recolectores: los de plataforma y los del tenant del actor. */
  async listAgents(
    tenantId: string | undefined,
    options: PageOptions,
  ): Promise<ListContextAgentsResponseDto> {
    const { limit, afterId } = this.page(options);
    const rows = await this.fetch(
      `select id, code, name, agent_type_concept_id, owner_tenant_id,
              last_heartbeat_at, status_concept_id
         from health_context.context_agents
        where (owner_tenant_id is null or owner_tenant_id = ?::uuid)
          and (?::uuid is null or id > ?::uuid)
        order by id limit ?`,
      [tenantId ?? null, afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        code: r.code as string,
        name: r.name as string,
        agentTypeConceptId: r.agent_type_concept_id as string,
        ownerTenantId: optional<string>(r.owner_tenant_id),
        lastHeartbeatAt: optional<Date>(r.last_heartbeat_at),
        statusConceptId: r.status_concept_id as string,
      })),
      limit,
    );
  }

  /** Programaciones de recolección. */
  async listSchedules(
    options: PageOptions,
  ): Promise<ListContextSchedulesResponseDto> {
    const { limit, afterId } = this.page(options);
    const rows = await this.fetch(
      `select id, country_concept_id, agent_id, schedule_expression, next_run_at,
              last_success_at, status_concept_id
         from health_context.country_context_schedules
        where (?::uuid is null or id > ?::uuid)
        order by id limit ?`,
      [afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        countryConceptId: r.country_concept_id as string,
        agentId: r.agent_id as string,
        scheduleExpression: r.schedule_expression as string,
        nextRunAt: optional<Date>(r.next_run_at),
        lastSuccessAt: optional<Date>(r.last_success_at),
        statusConceptId: r.status_concept_id as string,
      })),
      limit,
    );
  }

  /** Contextos de salud por país. */
  async listContexts(
    options: PageOptions,
  ): Promise<ListCountryHealthContextsResponseDto> {
    const { limit, afterId } = this.page(options);
    const rows = await this.fetch(
      `select id, country_concept_id, context_domain_concept_id, context_key,
              title, current_version_id, status_concept_id
         from health_context.country_health_contexts
        where (?::uuid is null or id > ?::uuid)
        order by id limit ?`,
      [afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        countryConceptId: r.country_concept_id as string,
        contextDomainConceptId: r.context_domain_concept_id as string,
        contextKey: r.context_key as string,
        title: r.title as string,
        currentVersionId: optional<string>(r.current_version_id),
        statusConceptId: r.status_concept_id as string,
      })),
      limit,
    );
  }

  /** Versiones de un contexto, sin el payload. */
  async listContextVersions(
    contextId: string,
    options: PageOptions,
  ): Promise<ListCountryHealthContextVersionsResponseDto> {
    const { limit, afterId } = this.page(options);
    const rows = await this.fetch(
      `select id, version_number, summary, observed_at, effective_from,
              effective_to, content_hash, status_concept_id
         from health_context.country_health_context_versions
        where country_health_context_id = ?
          and (?::uuid is null or id > ?::uuid)
        order by id limit ?`,
      [contextId, afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        versionNumber: r.version_number as number,
        summary: optional<string>(r.summary),
        observedAt: r.observed_at as Date,
        effectiveFrom: r.effective_from as Date,
        effectiveTo: optional<Date>(r.effective_to),
        contentHash: r.content_hash as string,
        statusConceptId: r.status_concept_id as string,
      })),
      limit,
    );
  }

  /** Corridas de recolección. */
  async listCollectionRuns(
    options: PageOptions,
  ): Promise<ListContextCollectionRunsResponseDto> {
    const { limit, afterId } = this.page(options);
    const rows = await this.fetch(
      `select id, schedule_id, agent_id, country_concept_id, status_concept_id,
              started_at, finished_at, error_summary
         from health_context.context_collection_runs
        where (?::uuid is null or id > ?::uuid)
        order by id limit ?`,
      [afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        scheduleId: optional<string>(r.schedule_id),
        agentId: r.agent_id as string,
        countryConceptId: r.country_concept_id as string,
        statusConceptId: r.status_concept_id as string,
        startedAt: r.started_at as Date,
        finishedAt: optional<Date>(r.finished_at),
        errorSummary: optional<string>(r.error_summary),
      })),
      limit,
    );
  }

  private page(options: PageOptions): {
    limit: number;
    afterId: string | null;
  } {
    return {
      limit: options.limit ?? DEFAULT_KEYSET_PAGE_SIZE,
      afterId: afterIdOf(options.cursor) ?? null,
    };
  }

  private fetch(sql: string, params: unknown[]): Promise<Row[]> {
    return this.em.fork().getConnection().execute<Row[]>(sql, params);
  }
}
