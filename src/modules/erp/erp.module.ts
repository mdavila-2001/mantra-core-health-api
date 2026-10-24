import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { ErpController, ErpCollectionsController } from './controllers';
import {
  ErpContractsService,
  ErpOperationsService,
  ErpCollectionsService,
} from './services';
import {
  ErpContractsRepository,
  ErpOperationsRepository,
  ErpContractsExtRepository,
} from './repositories';

/**
 * Módulo ERP: socios de negocio, ciclo de vida contractual, RR. HH., compras y
 * recepción, conciliación de facturas, ventas y arrendamientos (UC-38-01 … 16).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ErpController, ErpCollectionsController],
  providers: [
    ErpCollectionsService,
    ErpContractsRepository,
    ErpOperationsRepository,
    ErpContractsExtRepository,
    ErpContractsService,
    ErpOperationsService,
  ],
})
export class ErpModule {}
