import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommunityModule } from '../community/community.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { TerminologyModule } from '../terminology/terminology.module';
import { DiagnosticUnitsModule } from '../diagnostic_units/diagnostic_units.module';
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
  // DiagnosticUnitsModule (subtarea 1.5): `TenantTypeProfileService`
  // materializa la unidad diagnóstica de un tenant `DIAGNOSTIC_CENTER`
  // dentro de la misma transacción del alta. `diagnostic_units` no importa
  // `directory`, así que la dependencia va en un solo sentido.
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    CommunityModule,
    InsuranceModule,
    TerminologyModule,
    DiagnosticUnitsModule,
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
  // `TenantAdministrationService` lo necesita `profiles` para la bandeja de
  // vínculos de TP-2: quién administra una organización se decide en un solo
  // lugar, y ese lugar es éste. Copiar el criterio allá daría dos definiciones
  // de «admin de la organización» que se separan con el tiempo.
  // `DirectoryMembershipsService` lo necesita `profiles` para que aprobar un
  // vínculo conceda la membresía asistencial (MAC-VINCULO): qué campos lleva una
  // membresía y qué cuenta como duplicada se decide acá, no en cada llamador.
  exports: [
    TenantsRepository,
    TenantMembershipsRepository,
    TenantTypeProfileService,
    TenantAdministrationService,
    DirectoryMembershipsService,
  ],
})
export class DirectoryModule {}
