import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AuthProvidersController } from './controllers';
import { AuthProvidersConfigService, FederatedLoginService } from './services';
import { AuthProvidersRepository } from './repositories';

/**
 * Módulo de proveedores de identidad: alta del proveedor, configuración de
 * protocolo y claves, mapeo de atributos, vínculo por tenant, reglas de
 * aprovisionamiento, login federado, vinculación y desvinculación de cuentas
 * (UC-40-01 … 12).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AuthProvidersController],
  providers: [
    AuthProvidersRepository,
    AuthProvidersConfigService,
    FederatedLoginService,
  ],
})
export class AuthProvidersModule {}
