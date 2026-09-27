import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  DEFAULT_KEYSET_PAGE_SIZE,
  ResourceNotFoundException,
  afterIdOf,
  toKeysetPage,
} from '../../../common';
import type {
  IdentityProviderDetailDto,
  IdentityProviderSummaryDto,
  ListIdentityProvidersResponseDto,
} from '../dto/listings.dto';

type Row = Record<string, unknown>;

const optional = <T>(value: unknown): T | undefined =>
  (value as T | null) ?? undefined;

/**
 * CV-13 (BR-28): lecturas del hub de proveedores de identidad, que hasta ahora
 * sólo escribía.
 *
 * **Sin secretos:** cada consulta nombra sus columnas. Nunca se selecciona
 * `client_secret_ref` ni `extra_config_json` de `provider_protocol_configs`,
 * ni el `certificate` de las llaves: aunque alguien agregara una columna
 * privada a la tabla, no llegaría a la respuesta.
 *
 * **Aislamiento por tenant:** un proveedor es visible si es global
 * (`tenant_id` nulo o `is_global`) o si es del tenant del actor. Los vínculos
 * y las reglas de aprovisionamiento también se recortan a ese tenant.
 */
@Injectable()
export class AuthProvidersListingService {
  constructor(private readonly em: EntityManager) {}

  /** Página de proveedores visibles para el tenant del actor. */
  async listProviders(
    tenantId: string,
    options: { cursor?: string; limit?: number },
  ): Promise<ListIdentityProvidersResponseDto> {
    const limit = options.limit ?? DEFAULT_KEYSET_PAGE_SIZE;
    const afterId = afterIdOf(options.cursor) ?? null;
    const rows = await this.fetch(
      `select ${PROVIDER_COLUMNS}
         from auth_providers.identity_providers p
        where (p.tenant_id = ? or p.tenant_id is null or p.is_global = true)
          and (?::uuid is null or p.id > ?::uuid)
        order by p.id
        limit ?`,
      [tenantId, afterId, afterId, limit + 1],
    );
    return toKeysetPage(rows.map(toSummary), limit);
  }

  /** Ficha de un proveedor visible; 404 si no existe o es de otro tenant. */
  async getProvider(
    tenantId: string,
    providerId: string,
  ): Promise<IdentityProviderDetailDto> {
    const [provider] = await this.fetch(
      `select ${PROVIDER_COLUMNS}
         from auth_providers.identity_providers p
        where p.id = ?
          and (p.tenant_id = ? or p.tenant_id is null or p.is_global = true)`,
      [providerId, tenantId],
    );
    if (!provider) {
      throw new ResourceNotFoundException('Proveedor no encontrado', {
        providerId,
      });
    }

    const [configs, keys, mappings, bindings, rules] = await Promise.all([
      this.fetch(
        `select id, environment_concept_id, client_id, authorize_url, token_url,
                userinfo_url, jwks_uri, metadata_url, scopes, pkce_required,
                state_concept_id
           from auth_providers.provider_protocol_configs
          where provider_id = ? order by id`,
        [providerId],
      ),
      this.fetch(
        `select id, key_id, algorithm, public_key, valid_from, valid_to,
                state_concept_id
           from auth_providers.provider_signing_keys
          where provider_id = ? order by id`,
        [providerId],
      ),
      this.fetch(
        `select id, source_claim, target_attribute, is_identifier, required
           from auth_providers.provider_attribute_mappings
          where provider_id = ? order by id`,
        [providerId],
      ),
      this.fetch(
        `select id, is_enabled, auto_provision, allowed_email_domains,
                state_concept_id
           from auth_providers.provider_tenant_bindings
          where provider_id = ? and tenant_id = ? order by id`,
        [providerId, tenantId],
      ),
      this.fetch(
        `select id, priority, is_active, assign_role_concept_id
           from auth_providers.provisioning_rules
          where provider_id = ? and (tenant_id = ? or tenant_id is null)
          order by priority, id`,
        [providerId, tenantId],
      ),
    ]);

    return {
      ...toSummary(provider),
      protocolConfigs: configs.map((c) => ({
        id: c.id as string,
        environmentConceptId: c.environment_concept_id as string,
        clientId: optional(c.client_id),
        authorizeUrl: optional(c.authorize_url),
        tokenUrl: optional(c.token_url),
        userinfoUrl: optional(c.userinfo_url),
        jwksUri: optional(c.jwks_uri),
        metadataUrl: optional(c.metadata_url),
        scopes: optional(c.scopes),
        pkceRequired: optional(c.pkce_required),
        stateConceptId: c.state_concept_id as string,
      })),
      publicKeys: keys.map((k) => ({
        id: k.id as string,
        keyId: k.key_id as string,
        algorithm: k.algorithm as string,
        publicKey: k.public_key as string,
        validFrom: optional(k.valid_from),
        validTo: optional(k.valid_to),
        stateConceptId: k.state_concept_id as string,
      })),
      attributeMappings: mappings.map((m) => ({
        id: m.id as string,
        sourceClaim: m.source_claim as string,
        targetAttribute: m.target_attribute as string,
        isIdentifier: optional(m.is_identifier),
        required: optional(m.required),
      })),
      tenantBindings: bindings.map((b) => ({
        id: b.id as string,
        isEnabled: b.is_enabled as boolean,
        autoProvision: optional(b.auto_provision),
        allowedEmailDomains: optional(b.allowed_email_domains),
        stateConceptId: b.state_concept_id as string,
      })),
      provisioningRules: rules.map((r) => ({
        id: r.id as string,
        priority: r.priority as number,
        isActive: r.is_active as boolean,
        assignRoleConceptId: optional(r.assign_role_concept_id),
      })),
    };
  }

  private fetch(sql: string, params: unknown[]): Promise<Row[]> {
    return this.em.fork().getConnection().execute<Row[]>(sql, params);
  }
}

const PROVIDER_COLUMNS = `p.id, p.tenant_id, p.code, p.name, p.protocol_concept_id,
       p.provider_category_concept_id, p.issuer, p.is_global,
       p.state_concept_id, p.created_at`;

function toSummary(r: Row): IdentityProviderSummaryDto {
  return {
    id: r.id as string,
    tenantId: optional(r.tenant_id),
    code: r.code as string,
    name: r.name as string,
    protocolConceptId: r.protocol_concept_id as string,
    providerCategoryConceptId: r.provider_category_concept_id as string,
    issuer: optional(r.issuer),
    isGlobal: optional(r.is_global),
    stateConceptId: r.state_concept_id as string,
    createdAt: r.created_at as Date,
  };
}
