import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';
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
    return this.em.transactional(async (tx) => {
      const authority = this.authoritiesRepo.create(tx, {
        tenantId: dto.tenantId,
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
    return this.em.transactional(async (tx) => {
      const authority = await this.authoritiesRepo.findById(tx, authorityId);
      if (!authority) {
        throw new ResourceNotFoundException(
          'Autoridad de identidad no encontrada',
          { authorityId },
        );
      }

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
}
