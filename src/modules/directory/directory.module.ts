import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommunityModule } from '../community/community.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { TerminologyModule } from '../terminology/terminology.module';
import {
  TenantAdministrationService,
  TenantTypeProfileService,
} from './services';
import * as entities from './entities';
import { AdminTenantsController, TenantsController } from './controllers';
import {
  DirectoryTenantsService,
  DirectoryBranchesService,
  DirectoryMembershipsService,
  DirectoryReadService,
} from './services';
import {
  TenantsRepository,
  BranchesRepository,
  TenantMembershipsRepository,
  BranchMembershipsRepository,
  DirectoryTenantLegalRepository,
} from './repositories';

/**
 * Módulo Directory (04): tenants, sub-tenants, branches y membresías de tenant /
 * branch. Los conceptos propios viven en `directory.concepts.ts`; el guard de auth
 * y `CurrentUser` llegan desde el `AuthModule` global.
 */
@Module({
  // InsuranceModule: el alta de un tenant PAYER o BROKER materializa su
  // aseguradora o su corredor en la misma transacción.
  // TerminologyModule: el alta valida contra el catálogo los `*ConceptId` que
  // declara, porque son FK y el error de FK sale como 500 sin nombrar el campo.
  // CommunityModule: verificar una organización publica su vitrina en el
  // directorio público, con el mismo puerto de proyección que ya usan las
  // unidades de diagnóstico. No hay ciclo: `community` no depende de
  // `directory`.
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    CommunityModule,
    InsuranceModule,
    TerminologyModule,
  ],
  controllers: [AdminTenantsController, TenantsController],
  providers: [
    TenantTypeProfileService,
    TenantAdministrationService,
    // Repositorios
    TenantsRepository,
    BranchesRepository,
    TenantMembershipsRepository,
    BranchMembershipsRepository,
    DirectoryTenantLegalRepository,
    // Servicios
    DirectoryTenantsService,
    DirectoryBranchesService,
    DirectoryMembershipsService,
    DirectoryReadService,
  ],
  // `TenantsRepository` lo necesita identity_assurance para marcar verificada la
  // institución cuando la autoridad externa la aprueba; `TenantMembershipsRepository`
  // para comprobar que quien pide la verificación manda en ese tenant.
  exports: [
    TenantsRepository,
    TenantMembershipsRepository,
    TenantTypeProfileService,
  ],
})
export class DirectoryModule {}
