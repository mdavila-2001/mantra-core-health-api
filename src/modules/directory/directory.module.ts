import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AdminTenantsController, TenantsController } from './controllers';
import {
  DirectoryTenantsService,
  DirectoryBranchesService,
  DirectoryMembershipsService,
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
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AdminTenantsController, TenantsController],
  providers: [
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
  ],
  // `TenantsRepository` lo necesita identity_assurance para marcar verificada la
  // institución cuando la autoridad externa la aprueba; `TenantMembershipsRepository`
  // para comprobar que quien pide la verificación manda en ese tenant.
  exports: [TenantsRepository, TenantMembershipsRepository],
})
export class DirectoryModule {}
