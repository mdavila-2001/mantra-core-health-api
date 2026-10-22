import { Module } from '@nestjs/common';
import { TenantMembershipsRepository } from './repositories';
import { TenantAdministrationService } from './services';

/**
 * Regla de autorización de tenant compartida por módulos de dominio.
 *
 * Se mantiene separada de `DirectoryModule` porque este último materializa
 * perfiles de aseguradora y, por ello, importa `InsuranceModule`. Insurance
 * puede reutilizar la autorización sin cerrar un ciclo entre ambos módulos.
 */
@Module({
  providers: [TenantMembershipsRepository, TenantAdministrationService],
  exports: [TenantMembershipsRepository, TenantAdministrationService],
})
export class DirectoryAuthorizationModule {}
