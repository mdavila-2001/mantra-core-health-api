import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InsuranceModule } from '../insurance/insurance.module';
import { TenantTypeProfileService } from './services';
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
  // InsuranceModule: el alta de un tenant PAYER o BROKER materializa su
  // aseguradora o su corredor en la misma transacción.
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    InsuranceModule,
  ],
  controllers: [AdminTenantsController, TenantsController],
  providers: [
    TenantTypeProfileService,
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
  exports: [
    TenantsRepository,
    TenantMembershipsRepository,
    TenantTypeProfileService,
  ],
})
export class DirectoryModule {}
