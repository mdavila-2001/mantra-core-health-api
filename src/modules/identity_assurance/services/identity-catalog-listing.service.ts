import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  DEFAULT_KEYSET_PAGE_SIZE,
  afterIdOf,
  toKeysetPage,
} from '../../../common';
import type {
  ListIdentityAuthoritiesResponseDto,
  ListIdentityPoliciesResponseDto,
} from '../dto/listings.dto';

type Row = Record<string, unknown>;

const optional = <T>(value: unknown): T | undefined =>
  (value as T | null) ?? undefined;

/**
 * CV-13 (BR-28): lecturas del hub `identity-assurance`, que sólo tenía la cola
 * de casos. Las autoridades son del tenant (`tenant_id NOT NULL`) y se acotan
 * al del actor; las políticas son catálogo de plataforma, sin tenant, y se
 * leen con el mismo rol que las crea.
 */
@Injectable()
export class IdentityCatalogListingService {
  constructor(private readonly em: EntityManager) {}

  /** Autoridades de identidad del tenant. */
  async listAuthorities(
    tenantId: string,
    options: { cursor?: string; limit?: number },
  ): Promise<ListIdentityAuthoritiesResponseDto> {
    const limit = options.limit ?? DEFAULT_KEYSET_PAGE_SIZE;
    const afterId = afterIdOf(options.cursor) ?? null;
    const rows = await this.fetch(
      `select id, authority_code, name, authority_type_concept_id,
              jurisdiction_concept_id, verification_status_concept_id,
              status_concept_id, created_at
         from identity_assurance.identity_authorities
        where tenant_id = ? and (?::uuid is null or id > ?::uuid)
        order by id
        limit ?`,
      [tenantId, afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        authorityCode: r.authority_code as string,
        name: r.name as string,
        authorityTypeConceptId: r.authority_type_concept_id as string,
        jurisdictionConceptId: optional<string>(r.jurisdiction_concept_id),
        verificationStatusConceptId: r.verification_status_concept_id as string,
        statusConceptId: r.status_concept_id as string,
        createdAt: r.created_at as Date,
      })),
      limit,
    );
  }

  /** Políticas de verificación (catálogo de plataforma). */
  async listPolicies(options: {
    cursor?: string;
    limit?: number;
  }): Promise<ListIdentityPoliciesResponseDto> {
    const limit = options.limit ?? DEFAULT_KEYSET_PAGE_SIZE;
    const afterId = afterIdOf(options.cursor) ?? null;
    const rows = await this.fetch(
      `select id, policy_code, subject_type_concept_id, transaction_risk_concept_id,
              required_identity_assurance_level_concept_id, version_number,
              effective_from, effective_to, status_concept_id
         from identity_assurance.identity_verification_policies
        where (?::uuid is null or id > ?::uuid)
        order by id
        limit ?`,
      [afterId, afterId, limit + 1],
    );
    return toKeysetPage(
      rows.map((r) => ({
        id: r.id as string,
        policyCode: r.policy_code as string,
        subjectTypeConceptId: r.subject_type_concept_id as string,
        transactionRiskConceptId: r.transaction_risk_concept_id as string,
        requiredIdentityAssuranceLevelConceptId:
          r.required_identity_assurance_level_concept_id as string,
        versionNumber: r.version_number as number,
        effectiveFrom: r.effective_from as Date,
        effectiveTo: optional<Date>(r.effective_to),
        statusConceptId: r.status_concept_id as string,
      })),
      limit,
    );
  }

  private fetch(sql: string, params: unknown[]): Promise<Row[]> {
    return this.em.fork().getConnection().execute<Row[]>(sql, params);
  }
}
