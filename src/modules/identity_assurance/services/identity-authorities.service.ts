import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { IntegrationEndpoints } from '../../integrations/entities/integration_endpoints.entity';
import { ProviderConnections } from '../../integrations/entities/provider_connections.entity';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { IDA } from '../identity_assurance.concepts';
import { IdentityAssuranceErrorReason } from '../identity_assurance.error-reasons';
import {
  IdentityAuthoritiesRepository,
  IdentityAuthorityEndpointsRepository,
} from '../repositories';
import {
  RegisterAuthorityDto,
  CreateAuthorityEndpointDto,
  AuthorityResponseDto,
  AuthorityEndpointResponseDto,
} from '../dto';

/**
 * UC-27-01: registro de autoridades de identidad y publicación de sus endpoints
 * de verificación. Escrituras dentro de `em.transactional`; las FK son columnas
 * uuid planas, por lo que se hace `flush` del padre antes del hijo.
 */
@Injectable()
export class IdentityAuthoritiesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param authoritiesRepo - Valor de authorities repo requerido por la operación.
   * @param endpointsRepo - Valor de endpoints repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly authoritiesRepo: IdentityAuthoritiesRepository,
    private readonly endpointsRepo: IdentityAuthorityEndpointsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentityAuthoritiesService.name);
  }

  /** UC-27-01: da de alta una autoridad de identidad en estado activo. */
  async registerAuthority(
    dto: RegisterAuthorityDto,
    actor: AuthenticatedUser,
  ): Promise<AuthorityResponseDto> {
    this.logger.info(
      {
        operation: 'ida.authority.register',
        actorId: actor.id,
        code: dto.authorityCode,
      },
      'Registering identity authority',
    );
    // El tenant sale del contexto autenticado, nunca del cuerpo: el interceptor
    // rechaza un `dto.tenantId` contradictorio y acá se ignora el declarado.
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const authority = this.authoritiesRepo.create(tx, {
        tenantId,
        authorityCode: dto.authorityCode,
        name: dto.name,
        authorityTypeConceptId: dto.authorityTypeConceptId,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        assuranceFrameworkConceptId: dto.assuranceFrameworkConceptId,
        verificationStatusConceptId: IDA.AUTHORITY_VERIFIED,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: authority.id,
        authorityCode: authority.authorityCode,
        status: authority.statusConceptId,
        createdAt: authority.createdAt,
      };
    });
  }

  /** UC-27-01: publica un endpoint de verificación para la autoridad. */
  async addEndpoint(
    authorityId: string,
    dto: CreateAuthorityEndpointDto,
    actor: AuthenticatedUser,
  ): Promise<AuthorityEndpointResponseDto> {
    this.logger.info(
      { operation: 'ida.authority.endpoint', actorId: actor.id, authorityId },
      'Adding identity authority endpoint',
    );
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      // Autoridad ajena e inexistente responden igual (404 uniforme).
      const found = await this.authoritiesRepo.findById(tx, authorityId);
      const authority = assertResourceInTenant(
        found,
        found?.tenantId,
        tenantId,
        {
          message: 'Autoridad de identidad no encontrada',
          reason: IdentityAssuranceErrorReason.AUTHORITY_NOT_AVAILABLE,
        },
      );
      await this.assertEndpointInTenant(
        tx,
        dto.integrationEndpointId,
        tenantId,
      );

      const endpoint = this.endpointsRepo.create(tx, {
        identityAuthorityId: authority.id,
        integrationEndpointId: dto.integrationEndpointId,
        capabilityConceptId: dto.capabilityConceptId,
        assuranceLevelConceptId: dto.assuranceLevelConceptId,
        requestContractVersion: dto.requestContractVersion,
        responseContractVersion: dto.responseContractVersion,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      touch(authority, actor.id);
      await tx.flush();
      return {
        id: endpoint.id,
        identityAuthorityId: endpoint.identityAuthorityId,
        status: endpoint.statusConceptId,
        createdAt: endpoint.createdAt,
      };
    });
  }

  /**
   * El endpoint de integración tiene que ser alcanzable por el tenant: su
   * proveedor debe tener una conexión del tenant (`provider_connections`). El
   * endpoint en sí es de catálogo; lo que es del tenant es la conexión.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param integrationEndpointId - Endpoint de integración citado.
   * @param tenantId - Tenant activo.
   * @throws ResourceNotFoundException `IDENTITY_ENDPOINT_NOT_AVAILABLE`, igual para ajeno e inexistente.
   */
  private async assertEndpointInTenant(
    tx: EntityManager,
    integrationEndpointId: string,
    tenantId: string,
  ): Promise<void> {
    const endpoint = await tx.findOne(IntegrationEndpoints, {
      id: integrationEndpointId,
    });
    const connection = endpoint
      ? await tx.findOne(ProviderConnections, {
          providerId: endpoint.providerId,
          tenantId,
        })
      : null;
    assertResourceInTenant(endpoint, connection?.tenantId, tenantId, {
      message: 'Endpoint de integración no encontrado',
      reason: IdentityAssuranceErrorReason.ENDPOINT_NOT_AVAILABLE,
    });
  }
}
