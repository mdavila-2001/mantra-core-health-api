import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { CrmController } from './controllers';
import { CrmSalesService, CrmServiceService } from './services';
import { CrmSalesRepository, CrmServiceRepository } from './repositories';

/**
 * Módulo CRM: cuentas y equipo, contactos y consentimiento de canal, leads,
 * oportunidades con pipeline, actividades, alianzas y casos de servicio
 * (UC-49-01 … 15).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [CrmController],
  providers: [
    CrmSalesRepository,
    CrmServiceRepository,
    CrmSalesService,
    CrmServiceService,
  ],
})
export class CrmModule {}
