import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationAuthProfiles } from '../entities';
import { createdBy } from '../../../common';

/** Datos para configurar un perfil de autenticación sender-constrained (UC-31-03). */
export interface CreateAuthProfileData {
  /**
   * Identificador asociado a integration contract.
   */
  integrationContractId: string;
  /**
   * Identificador asociado a auth profile concept.
   */
  authProfileConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de oauth issuer uri mantenido por la instancia.
   */
  oauthIssuerUri?: string;
  /**
   * Valor de client identifier mantenido por la instancia.
   */
  clientIdentifier?: string;
  /**
   * Valor de credential secret reference mantenido por la instancia.
   */
  credentialSecretReference?: string;
  /**
   * Identificador asociado a token binding concept.
   */
  tokenBindingConceptId?: string;
  /**
   * Valor de mtls certificate reference mantenido por la instancia.
   */
  mtlsCertificateReference?: string;
  /**
   * Valor de dpop key reference mantenido por la instancia.
   */
  dpopKeyReference?: string;
  /**
   * Valor de scopes json mantenido por la instancia.
   */
  scopesJson?: unknown;
  /**
   * Valor de audience mantenido por la instancia.
   */
  audience?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `integration_contracts.integration_auth_profiles`. */
@Injectable()
export class AuthProfilesRepository {
  /** Busca un perfil por id; `null` si no existe. */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IntegrationAuthProfiles | null> {
    return em.findOne(IntegrationAuthProfiles, { id });
  }

  /** Crea la entidad de perfil en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateAuthProfileData,
  ): IntegrationAuthProfiles {
    return em.create(
      IntegrationAuthProfiles,
      {
        integrationContractId: data.integrationContractId,
        authProfileConceptId: data.authProfileConceptId,
        oauthIssuerUri: data.oauthIssuerUri,
        clientIdentifier: data.clientIdentifier,
        credentialSecretReference: data.credentialSecretReference,
        tokenBindingConceptId: data.tokenBindingConceptId,
        mtlsCertificateReference: data.mtlsCertificateReference,
        dpopKeyReference: data.dpopKeyReference,
        scopesJson: data.scopesJson,
        audience: data.audience,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
