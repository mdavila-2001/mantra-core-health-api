import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  CatalogConcepts,
  CodeSystemVersions,
  CodeSystems,
  ConceptDesignations,
  ConceptProperties,
  ConceptRelationships,
  TerminologySources,
  ValueSetMembers,
  ValueSetVersions,
  ValueSets,
} from '../../modules/terminology/entities';
import {
  DynamicEnumBindings,
  DynamicEnumDefinitions,
  DynamicEnumOptions,
  DynamicEnumVersions,
} from '../../modules/system_context/entities';
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
import { Roles as AuthzRoles } from '../../modules/authz/entities';
import { IamModule } from '../../modules/iam/iam.module';
import { TenantMemberships } from '../../modules/directory/entities';
import { TerminologySeedService } from './terminology-seed.service';
import { IdentityVerificationSeedService } from './identity-verification-seed.service';
import { AuthzClinicalRolesSeedService } from './authz-clinical-roles-seed.service';
import { MessagingSeedService } from './messaging-seed.service';
import { AudioAssetsSeedService } from './audio-assets-seed.service';
import { MessageQueues } from '../../modules/messaging/entities';
import { AudioTemplates } from '../../modules/audio_assets/entities';
import { BootstrapAdminSeedService } from './bootstrap-admin-seed.service';
import { DynamicEnumSeedService } from './dynamic-enum-seed.service';
import { GlossarySeedService } from './glossary-seed.service';
import { SeedBootstrapService } from './seed-bootstrap.service';

/**
 * Módulo de datos estructurales iniciales. Registra los seeds (catálogo de
 * conceptos internos, canal de correo por defecto y datos de referencia de
 * verificación de identidad) y los exporta para que las pruebas de integración
 * puedan invocarlos tras materializar el esquema. Se importa una sola vez en
 * `AppModule`.
 *
 * `SeedBootstrapService` impone el orden: primero catálogo/tenant, después los
 * dominios que dependen de esas filas.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      TerminologySources,
      CodeSystems,
      CodeSystemVersions,
      CatalogConcepts,
      ConceptDesignations,
      ConceptProperties,
      ConceptRelationships,
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
      TenantMemberships,
      ValueSets,
      ValueSetVersions,
      ValueSetMembers,
      DynamicEnumDefinitions,
      DynamicEnumVersions,
      DynamicEnumOptions,
      DynamicEnumBindings,
      MessageQueues,
      AudioTemplates,
      AuthzRoles,
    ]),
    // El seed del administrador reutiliza `IamUsersService.createUser` para que
    // la credencial se hashee con argon2id igual que por API, en vez de duplicar
    // aquí los parámetros del hash.
    IamModule,
  ],
  providers: [
    TerminologySeedService,
    DynamicEnumSeedService,
    GlossarySeedService,
    MessagingSeedService,
    AudioAssetsSeedService,
    IdentityVerificationSeedService,
    AuthzClinicalRolesSeedService,
    BootstrapAdminSeedService,
    SeedBootstrapService,
  ],
  exports: [
    TerminologySeedService,
    DynamicEnumSeedService,
    GlossarySeedService,
    MessagingSeedService,
    AudioAssetsSeedService,
    IdentityVerificationSeedService,
    AuthzClinicalRolesSeedService,
    BootstrapAdminSeedService,
  ],
})
export class SeedModule {}
