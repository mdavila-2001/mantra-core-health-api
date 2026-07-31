import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  CatalogConcepts,
  CodeSystemVersions,
  CodeSystems,
  TerminologySources,
} from '../../modules/terminology/entities';
import { Tenants } from '../../modules/directory/entities';
import { ProcessingPurposes } from '../../modules/consent/entities';
import { Users } from '../../modules/iam/entities';
import {
  ExternalProviders,
  IntegrationEndpoints,
} from '../../modules/integrations/entities';
import {
  IdentityAuthorities,
  IdentityAuthorityEndpoints,
  IdentityVerificationPolicies,
} from '../../modules/identity_assurance/entities';
import {
  MessageChannels,
  MessagingProviders,
  ProviderChannelConfigs,
} from '../../modules/messaging/entities';
import { TerminologySeedService } from './terminology-seed.service';
import { IdentityVerificationSeedService } from './identity-verification-seed.service';
import { MessagingSeedService } from './messaging-seed.service';

/**
 * Módulo de datos estructurales iniciales. Registra los seeds (catálogo de
 * conceptos internos, canal de correo por defecto y datos de referencia de
 * verificación de identidad) y los exporta para que las pruebas de integración
 * puedan invocarlos tras materializar el esquema. Se importa una sola vez en
 * `AppModule`.
 *
 * El orden del array `providers` importa: los hooks `OnApplicationBootstrap`
 * corren en ese orden, y los seeds de dominio necesitan que los conceptos y el
 * tenant por defecto ya estén materializados.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      TerminologySources,
      CodeSystems,
      CodeSystemVersions,
      CatalogConcepts,
      Tenants,
      ProcessingPurposes,
      Users,
      ExternalProviders,
      IntegrationEndpoints,
      IdentityAuthorities,
      IdentityAuthorityEndpoints,
      IdentityVerificationPolicies,
      MessageChannels,
      MessagingProviders,
      ProviderChannelConfigs,
    ]),
  ],
  providers: [
    TerminologySeedService,
    MessagingSeedService,
    IdentityVerificationSeedService,
  ],
  exports: [
    TerminologySeedService,
    MessagingSeedService,
    IdentityVerificationSeedService,
  ],
})
export class SeedModule {}
