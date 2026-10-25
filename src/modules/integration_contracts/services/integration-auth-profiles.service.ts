import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  assertContractInTenant,
  integrationResourceOutOfScope,
} from '../integration_contracts.tenant-scope';
import { ICON } from '../integration_contracts.concepts';
import { AuthProfilesRepository, ContractsRepository } from '../repositories';
import {
  AuthProfileResponseDto,
  CreateAuthProfileDto,
  RotateCredentialDto,
  StatusResultDto,
} from '../dto';

/**
 * Perfiles de autenticación sender-constrained del contrato: configuración
 * (UC-31-03) y rotación de credenciales (UC-31-11). Las credenciales viven como
 * referencias a secret-manager; nunca se persiste ni se registra el plaintext.
 */
@Injectable()
export class IntegrationAuthProfilesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param contractsRepo - Valor de contracts repo requerido por la operación.
   * @param authProfilesRepo - Valor de auth profiles repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly contractsRepo: ContractsRepository,
    private readonly authProfilesRepo: AuthProfilesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IntegrationAuthProfilesService.name);
  }

  /** UC-31-03: configura un perfil de autenticación (ACTIVE) para el contrato. */
  async configure(
    contractId: string,
    dto: CreateAuthProfileDto,
    actor: AuthenticatedUser,
  ): Promise<AuthProfileResponseDto> {
    this.logger.info(
      {
        operation: 'integration.auth-profile.configure',
        contractId,
        actorId: actor.id,
      },
      'Configuring auth profile',
    );
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      assertContractInTenant(
        await this.contractsRepo.findByIdInTenant(tx, tenantId, contractId),
        tenantId,
      );

      const profile = this.authProfilesRepo.create(tx, {
        integrationContractId: contractId,
        authProfileConceptId:
          dto.authProfileConceptId ?? ICON.AUTH_OAUTH2_CONFIDENTIAL,
        oauthIssuerUri: dto.oauthIssuerUri,
        clientIdentifier: dto.clientIdentifier,
        credentialSecretReference: dto.credentialSecretReference,
        tokenBindingConceptId: dto.tokenBindingConceptId,
        mtlsCertificateReference: dto.mtlsCertificateReference,
        dpopKeyReference: dto.dpopKeyReference,
        scopesJson: dto.scopesJson,
        audience: dto.audience,
        statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'integration.auth-profile.configure',
          contractId,
          profileId: profile.id,
        },
        'Auth profile configured',
      );
      return {
        id: profile.id,
        integrationContractId: contractId,
        status: profile.statusConceptId,
      };
    });
  }

  /** UC-31-11: rota la referencia de secreto del perfil (append-only preservado). */
  async rotate(
    contractId: string,
    profileId: string,
    dto: RotateCredentialDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      {
        operation: 'integration.auth-profile.rotate',
        contractId,
        profileId,
        actorId: actor.id,
      },
      'Rotating auth profile credentials',
    );
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      // Perfil → contrato → tenant: el contrato de la ruta debe ser del tenant
      // activo y el perfil debe colgar de él antes de tocar el secreto.
      const contract = assertContractInTenant(
        await this.contractsRepo.findByIdInTenant(tx, tenantId, contractId),
        tenantId,
        'Perfil de autenticación no encontrado',
      );
      const profile = await this.authProfilesRepo.findById(tx, profileId);
      if (!profile || profile.integrationContractId !== contract.id) {
        throw integrationResourceOutOfScope(
          'Perfil de autenticación no encontrado',
        );
      }

      profile.credentialSecretReference = dto.credentialSecretReference;
      if (dto.dpopKeyReference !== undefined) {
        profile.dpopKeyReference = dto.dpopKeyReference;
      }
      profile.statusConceptId =
        dto.targetStatus === 'REVOKED'
          ? ICON.AUTH_PROFILE_REVOKED
          : ICON.AUTH_PROFILE_ROTATED;
      touch(profile, actor.id);
      await tx.flush();

      this.logger.info(
        { operation: 'integration.auth-profile.rotate', profileId },
        'Auth profile credentials rotated',
      );
      return { ok: true };
    });
  }
}
