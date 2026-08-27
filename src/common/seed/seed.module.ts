import { Module } from '@nestjs/common';
import { TerminologyModule } from '../../modules/terminology/terminology.module';
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
import {
  Permissions as AuthzPermissions,
  Roles as AuthzRoles,
} from '../../modules/authz/entities';
import { IamModule } from '../../modules/iam/iam.module';
import { TenantMemberships } from '../../modules/directory/entities';
import { TerminologySeedService } from './terminology-seed.service';
import { IdentityVerificationSeedService } from './identity-verification-seed.service';
import { AuthzClinicalRolesSeedService } from './authz-clinical-roles-seed.service';
import { AuthzPlatformPermissionsSeedService } from './authz-platform-permissions-seed.service';
import { MessagingSeedService } from './messaging-seed.service';
import { AudioAssetsSeedService } from './audio-assets-seed.service';
import { VademecumSeedService } from './vademecum-seed.service';
import { MessageQueues } from '../../modules/messaging/entities';
import { AudioTemplates } from '../../modules/audio_assets/entities';
import { BootstrapAdminSeedService } from './bootstrap-admin-seed.service';
import { ProviderAccountsSeedService } from './provider-accounts-seed.service';
import { DynamicEnumSeedService } from './dynamic-enum-seed.service';
import { GlossarySeedService } from './glossary-seed.service';
import { BoGeographySeedService } from './bo-geography-seed.service';
import { BoOccupationsSeedService } from './bo-occupations-seed.service';
import { BoliviaFacilitiesSeedService } from './bolivia-facilities-seed.service';
import { BoliviaFeeScheduleSeedService } from './bolivia-fee-schedule-seed.service';
import { BoliviaInsuranceSeedService } from './bolivia-insurance-seed.service';
import { SeedBootstrapService } from './seed-bootstrap.service';
import { SpecialtyChartTemplates } from '../../modules/chart/entities';
import {
  DynamicFieldDefinitions,
  DynamicFieldSections,
  FieldAssignments,
} from '../../modules/forms/entities';
import { ClinicalFormsSeedService } from './clinical-forms-seed.service';

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
    // El seeder de fichas por especialidad (2d2711b2) inyecta
    // ValueSetsRepository, que vive en terminology y su módulo ya exporta. Sin
    // este import Nest no resolvía la dependencia y LA API ENTERA se caía al
    // arrancar, en bucle: sin arranque no hay login ni registro ni nada.
    // Tomado de #194, para poder verificar el seeder contra el contenedor.
    TerminologyModule,
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
      AuthzPermissions,
      // Carril R2-5: el catálogo de formularios clínicos estándar. La plantilla
      // vive en `chart` y su esquema en `forms`, igual que cuando la arma un
      // admin por API.
      SpecialtyChartTemplates,
      DynamicFieldSections,
      DynamicFieldDefinitions,
      FieldAssignments,
      AuthzPermissions,
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
    BoGeographySeedService,
    BoOccupationsSeedService,
    BoliviaFacilitiesSeedService,
    BoliviaFeeScheduleSeedService,
    BoliviaInsuranceSeedService,
    MessagingSeedService,
    AudioAssetsSeedService,
    VademecumSeedService,
    IdentityVerificationSeedService,
    AuthzClinicalRolesSeedService,
    AuthzPlatformPermissionsSeedService,
    BootstrapAdminSeedService,
    ProviderAccountsSeedService,
    SeedBootstrapService,
    ClinicalFormsSeedService,
  ],
  exports: [
    SeedBootstrapService,
    TerminologySeedService,
    DynamicEnumSeedService,
    GlossarySeedService,
    BoGeographySeedService,
    BoOccupationsSeedService,
    BoliviaFacilitiesSeedService,
    BoliviaFeeScheduleSeedService,
    BoliviaInsuranceSeedService,
    MessagingSeedService,
    AudioAssetsSeedService,
    VademecumSeedService,
    IdentityVerificationSeedService,
    AuthzClinicalRolesSeedService,
    AuthzPlatformPermissionsSeedService,
    BootstrapAdminSeedService,
    ProviderAccountsSeedService,
    ClinicalFormsSeedService,
  ],
})
export class SeedModule {}
