import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationAuthProfiles } from '../entities';
import { createdBy } from '../../../common';

/** Datos para configurar un perfil de autenticación sender-constrained (UC-31-03). */
export interface CreateAuthProfileData {
  integrationContractId: string;
  authProfileConceptId: string;
  statusConceptId: string;
  oauthIssuerUri?: string;
  clientIdentifier?: string;
  credentialSecretReference?: string;
  tokenBindingConceptId?: string;
  mtlsCertificateReference?: string;
  dpopKeyReference?: string;
  scopesJson?: unknown;
  audience?: string;
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
